import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contributions, membersCircles, virtualAccounts } from "@/db/schema";
import { handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
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

    if (!va) {
      return success({
        balanceKobo: 0,
        virtualAccount: null,
        pendingReconciliationKobo: 0,
      });
    }

    const pendingContribs = await db
      .select()
      .from(contributions)
      .innerJoin(
        membersCircles,
        eq(contributions.memberCircleId, membersCircles.id),
      )
      .where(
        and(
          eq(membersCircles.userId, auth.user?.userId),
          eq(contributions.status, "pending"),
        ),
      );

    const pendingKobo = pendingContribs.reduce(
      (s, c) => s + c.contributions.amountKobo,
      0,
    );

    return success({
      balanceKobo: va.balanceKobo,
      virtualAccount: {
        accountNumber: va.accountNumber,
        accountName: va.accountName,
        bankCode: va.bankCode,
      },
      pendingReconciliationKobo: pendingKobo,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
