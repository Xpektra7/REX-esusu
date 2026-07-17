import { and, eq, gte, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users, virtualAccounts, walletTransactions } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { verifyPinToken } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";
import { nombaPost } from "@/lib/nomba";
import { rateLimit } from "@/lib/rate-limit";
import { withdrawSchema } from "@/lib/validations";

const withdrawLimiter = rateLimit({ windowMs: 60_000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((e) => e.message).join("; "));
    }
    const { amountKobo, bankCode, accountNumber, pinToken } = parsed.data;

    // Rate limit withdrawals per user
    const limit = withdrawLimiter.check(`withdraw:${auth.user?.userId}`);
    if (!limit.allowed) {
      return error("Too many withdrawals. Try again later.", "06", 429);
    }

    // Verify PIN token
    const pinPayload = verifyPinToken(pinToken);
    if (!pinPayload || pinPayload.userId !== auth.user?.userId) {
      return error(
        "Invalid or expired PIN verification. Please verify your PIN again.",
        "03",
        401,
      );
    }

    // Get user's name for senderName
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.user?.userId))
      .limit(1);
    if (!user) return error("User not found", "04", 404);

    // Step 1: Resolve account name via bank lookup (no balance change yet)
    let accountName = "";
    try {
      const lookup = await nombaPost("/v1/transfers/bank/lookup", {
        accountNumber,
        bankCode,
      });
      accountName = lookup?.data?.accountName ?? "";
    } catch {
      return error(
        "Could not verify bank account. Please check the account number.",
      );
    }
    if (!accountName) {
      return error("Could not resolve account name for this bank account.");
    }

    // Step 2: Atomic balance deduction — check-and-decrement in one SQL statement
    const [updatedVa] = await db
      .update(virtualAccounts)
      .set({ balanceKobo: sql`balance_kobo - ${amountKobo}` })
      .where(
        and(
          eq(virtualAccounts.userId, auth.user?.userId),
          eq(virtualAccounts.type, "personal"),
          gte(virtualAccounts.balanceKobo, amountKobo),
        ),
      )
      .returning();
    if (!updatedVa) {
      return error("Insufficient balance", "07");
    }

    // Step 3: Initiate transfer via Nomba
    const merchantTxRef = `WITHDRAW_${auth.user?.userId.slice(0, 8)}_${Date.now()}`;
    // biome-ignore lint/suspicious/noExplicitAny: Nomba API response is dynamic
    let nombaResp: any;
    let transferFailed = false;
    try {
      nombaResp = await nombaPost("/v2/transfers/bank", {
        amount: amountKobo / 100,
        bankCode,
        accountNumber,
        accountName,
        senderName: user.name,
        merchantTxRef,
        narration: "Esusu wallet withdrawal",
      });
    } catch {
      // Network error — DO NOT refund balance. Record as pending and
      // let the Nomba webhook settle it (confirm or refund).
      transferFailed = true;
    }

    const transferRef =
      nombaResp?.data?.meta?.merchantTxRef ||
      nombaResp?.data?.id ||
      merchantTxRef;

    const [walletTx] = await db
      .insert(walletTransactions)
      .values({
        userId: auth.user?.userId,
        type: "withdrawal",
        amountKobo,
        reference: transferRef,
        status: transferFailed ? "pending" : "success",
        metadata: {
          bankCode,
          accountNumber: accountNumber.slice(-4),
          nombaTransferRef: transferRef,
          transferFailed,
        },
      })
      .returning();

    return success(
      {
        transactionId: walletTx.id,
        amountKobo,
        status: "pending",
        nombaTransferRef: transferRef,
      },
      "Withdrawal initiated",
    );
  } catch (e) {
    return handleApiError(e);
  }
}
