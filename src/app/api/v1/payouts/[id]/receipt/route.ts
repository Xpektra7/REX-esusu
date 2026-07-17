import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import {
  circles,
  cycles,
  payoutTransactions,
  users,
  virtualAccounts,
} from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const [payout] = await db
      .select({
        id: payoutTransactions.id,
        amountKobo: payoutTransactions.amountKobo,
        status: payoutTransactions.status,
        reference: payoutTransactions.nombaTransferRef,
        recipientUserId: payoutTransactions.recipientUserId,
        createdAt: payoutTransactions.createdAt,
        completedAt: payoutTransactions.completedAt,
        cycleNumber: cycles.cycleNumber,
        circleName: circles.name,
      })
      .from(payoutTransactions)
      .innerJoin(cycles, eq(payoutTransactions.cycleId, cycles.id))
      .innerJoin(circles, eq(cycles.circleId, circles.id))
      .where(eq(payoutTransactions.id, id))
      .limit(1);
    if (!payout) return error("Payout not found", "04", 404);
    if (payout.recipientUserId !== auth.user?.userId) {
      return error("You cannot view this receipt", "03", 403);
    }

    const [recipient] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, payout.recipientUserId))
      .limit(1);

    const [recipientVA] = await db
      .select({
        accountName: virtualAccounts.accountName,
        accountNumber: virtualAccounts.accountNumber,
        bankCode: virtualAccounts.bankCode,
      })
      .from(virtualAccounts)
      .where(eq(virtualAccounts.userId, payout.recipientUserId))
      .limit(1);

    return success(
      {
        receiptId: payout.id,
        type: "payout",
        direction: "outward",
        status: payout.status,
        amountKobo: payout.amountKobo,
        reference: payout.reference,
        narration: `Payout Cycle ${payout.cycleNumber} - ${payout.circleName}`,
        circle: {
          name: payout.circleName,
          cycleNumber: payout.cycleNumber,
        },
        recipient: {
          name: recipient?.name ?? null,
          email: recipient?.email ?? null,
          accountName: recipientVA?.accountName ?? null,
          accountNumber: recipientVA?.accountNumber ?? null,
          bankCode: recipientVA?.bankCode ?? null,
        },
        createdAt: payout.createdAt,
        completedAt: payout.completedAt,
      },
      "Receipt generated",
    );
  } catch (e) {
    return error((e as Error).message);
  }
}
