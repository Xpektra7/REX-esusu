import { and, eq, gte, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users, virtualAccounts, walletTransactions } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaPost } from "@/lib/nomba";
import { withdrawSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((e) => e.message).join("; "));
    }
    const { amountKobo, bankCode, accountNumber } = parsed.data;

    // Get user's name for senderName
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.user?.userId))
      .limit(1);
    if (!user) return error("User not found", "04", 404);

    // Atomic balance deduction — check-and-decrement in one SQL statement
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

    // Resolve account name via bank lookup
    let accountName = "";
    try {
      const lookup = await nombaPost("/v1/transfers/bank/lookup", {
        accountNumber,
        bankCode,
      });
      accountName = lookup?.data?.accountName ?? "";
    } catch {
      // Revert the atomic deduction on failure
      await db
        .update(virtualAccounts)
        .set({
          balanceKobo: sql`balance_kobo + ${amountKobo}`,
        })
        .where(eq(virtualAccounts.id, updatedVa.id));
      return error(
        "Could not verify bank account. Please check the account number.",
      );
    }
    if (!accountName) {
      await db
        .update(virtualAccounts)
        .set({
          balanceKobo: sql`balance_kobo + ${amountKobo}`,
        })
        .where(eq(virtualAccounts.id, updatedVa.id));
      return error("Could not resolve account name for this bank account.");
    }

    const merchantTxRef = `WITHDRAW_${auth.user?.userId.slice(0, 8)}_${Date.now()}`;
    // biome-ignore lint/suspicious/noExplicitAny: Nomba API response is dynamic
    let nombaResp: any;
    try {
      nombaResp = await nombaPost("/v2/transfers/bank", {
        amount: amountKobo,
        bankCode,
        accountNumber,
        accountName,
        senderName: user.name,
        merchantTxRef,
        narration: "Esusu wallet withdrawal",
      });
    } catch {
      await db
        .update(virtualAccounts)
        .set({
          balanceKobo: sql`balance_kobo + ${amountKobo}`,
        })
        .where(eq(virtualAccounts.id, updatedVa.id));
      return error("Transfer failed. Please try again.");
    }

    const transferRef =
      nombaResp?.data?.meta?.merchantTxRef ||
      nombaResp?.data?.id ||
      merchantTxRef;

    // Record the withdrawal in the wallet transaction history so it shows up
    // in the user's transaction list and activity feed.
    await db
      .insert(walletTransactions)
      .values({
        userId: auth.user?.userId,
        type: "withdrawal",
        amountKobo,
        reference: transferRef,
        status: "success",
        metadata: {
          bankCode,
          accountNumber: accountNumber.slice(-4),
          nombaTransferRef: transferRef,
        },
      })
      .onConflictDoNothing();

    return success(
      {
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
