import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { virtualAccounts } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaGet } from "@/lib/nomba";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
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

    if (!va || !va.accountNumber) {
      return error("No virtual account found");
    }

    // Fetch actual balance from Nomba
    const nombaData = await nombaGet(
      `/v1/accounts/virtual/${va.accountNumber}`,
    );

    const accountData = nombaData?.data || nombaData;
    const actualBalanceKobo = Math.round(
      (accountData.balance || accountData.availableBalance || 0) * 100,
    );

    // Sync local balance_kobo to match Nomba's actual balance
    await db
      .update(virtualAccounts)
      .set({ balanceKobo: actualBalanceKobo })
      .where(eq(virtualAccounts.id, va.id));

    return success({
      previousBalanceKobo: va.balanceKobo,
      syncedBalanceKobo: actualBalanceKobo,
      accountNumber: va.accountNumber,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
