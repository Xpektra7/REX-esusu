import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles, cycles, payoutTransactions } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const payouts = await db
      .select({
        id: payoutTransactions.id,
        amountKobo: payoutTransactions.amountKobo,
        status: payoutTransactions.status,
        createdAt: payoutTransactions.createdAt,
        completedAt: payoutTransactions.completedAt,
        nombaTransferRef: payoutTransactions.nombaTransferRef,
        cycleNumber: cycles.cycleNumber,
        circleName: circles.name,
      })
      .from(payoutTransactions)
      .innerJoin(cycles, eq(payoutTransactions.cycleId, cycles.id))
      .innerJoin(circles, eq(cycles.circleId, circles.id))
      .where(eq(payoutTransactions.recipientUserId, auth.user?.userId))
      .orderBy(payoutTransactions.createdAt);

    return success({ payouts });
  } catch (e) {
    return error((e as Error).message);
  }
}
