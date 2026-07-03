import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { users, virtualAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
    const [user] = await db.select().from(users).where(eq(users.id, auth.user!.userId)).limit(1);
    if (!user) return error("User not found", "04", 404);

    const [va] = await db.select().from(virtualAccounts)
      .where(and(eq(virtualAccounts.userId, auth.user!.userId), eq(virtualAccounts.type, "personal")))
      .limit(1);
    if (!va || va.balanceKobo < amountKobo) {
      return error("Insufficient balance", "07");
    }

    // Resolve account name via bank lookup
    let accountName = "";
    try {
      const lookup = await nombaPost("/v1/transfers/bank/lookup", { accountNumber, bankCode });
      accountName = lookup?.data?.accountName ?? "";
    } catch {
      return error("Could not verify bank account. Please check the account number.");
    }
    if (!accountName) {
      return error("Could not resolve account name for this bank account.");
    }

    const merchantTxRef = `WITHDRAW_${auth.user!.userId.slice(0, 8)}_${Date.now()}`;
    const nombaResp = await nombaPost("/v2/transfers/bank", {
      amount: amountKobo,
      bankCode,
      accountNumber,
      accountName,
      senderName: user.name,
      merchantTxRef,
      narration: "Esusu wallet withdrawal",
    });

    const transferRef = nombaResp?.data?.meta?.merchantTxRef || nombaResp?.data?.id || merchantTxRef;

    await db.update(virtualAccounts).set({
      balanceKobo: va.balanceKobo - amountKobo,
    }).where(eq(virtualAccounts.id, va.id));

    return success({
      amountKobo,
      status: "pending",
      nombaTransferRef: transferRef,
    }, "Withdrawal initiated");
  } catch (e) {
    return error((e as Error).message);
  }
}
