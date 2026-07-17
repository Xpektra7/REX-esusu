import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { virtualAccounts } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { amountKobo } = await req.json();
    if (!amountKobo || amountKobo < 1000) return error("Minimum top-up is ₦10");

    const [va] = await db
      .select()
      .from(virtualAccounts)
      .where(
        and(
          eq(virtualAccounts.userId, auth.user?.userId),
          eq(virtualAccounts.type, "personal"),
        ),
      )
      .limit(1);

    if (!va) return error("No virtual account found");

    const reference = `TOPUP_${auth.user?.userId}_${Date.now()}`;

    return success({
      virtualAccount: {
        accountNumber: va.accountNumber,
        accountName: va.accountName,
        bankCode: va.bankCode,
      },
      amountKobo,
      reference,
      instructions:
        "Transfer the exact amount to the virtual account above. Your wallet will be credited automatically once the payment is confirmed.",
    });
  } catch (e) {
    return handleApiError(e);
  }
}
