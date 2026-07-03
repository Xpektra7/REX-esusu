import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { virtualAccounts, contributions, membersCircles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const [va] = await db.select().from(virtualAccounts)
      .where(and(eq(virtualAccounts.userId, auth.user!.userId), eq(virtualAccounts.type, "personal")))
      .limit(1);

    if (!va) {
      return success({ balanceKobo: 0, virtualAccount: null, pendingReconciliationKobo: 0 });
    }

    const pendingContribs = await db.select().from(contributions)
      .innerJoin(membersCircles, eq(contributions.memberCircleId, membersCircles.id))
      .where(and(eq(membersCircles.userId, auth.user!.userId), eq(contributions.status, "pending")));

    const pendingKobo = pendingContribs.reduce((s, c) => s + c.contributions.amountKobo, 0);

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
    return error((e as Error).message);
  }
}
