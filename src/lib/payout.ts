import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cycles, payoutTransactions, walletTransactions } from "@/db/schema";

export async function handlePayoutSuccess(payload: {
  event_type: string;
  requestId: string;
  data: {
    merchant: { userId?: string; walletId?: string };
    transaction: {
      merchantTxRef?: string;
      transactionRef?: string;
      amount?: number;
      status?: string;
    };
  };
}) {
  const txn = payload.data.transaction;
  const ref = txn.merchantTxRef || txn.transactionRef;
  if (!ref) return;

  await db.transaction(async (tx) => {
    const [payout] = await tx
      .select()
      .from(payoutTransactions)
      .where(eq(payoutTransactions.nombaTransferRef, ref))
      .limit(1);

    if (!payout) return;

    await tx
      .update(payoutTransactions)
      .set({
        status: "success",
        completedAt: new Date(),
        nombaResponse: payload.data,
      })
      .where(eq(payoutTransactions.id, payout.id));

    await tx
      .update(cycles)
      .set({ status: "paid_out" })
      .where(eq(cycles.id, payout.cycleId));

    await tx
      .insert(walletTransactions)
      .values({
        userId: payout.recipientUserId,
        type: "credit",
        amountKobo: payout.amountKobo,
        reference: payout.nombaTransferRef || payout.id,
        status: "success",
        metadata: { payoutId: payout.id, cycleId: payout.cycleId },
      })
      .onConflictDoNothing();
  });
}

export async function handlePayoutFailed(payload: {
  event_type: string;
  requestId: string;
  data: {
    merchant: { userId?: string; walletId?: string };
    transaction: {
      merchantTxRef?: string;
      transactionRef?: string;
      amount?: number;
      status?: string;
    };
  };
}) {
  const txn = payload.data.transaction;
  const ref = txn.merchantTxRef || txn.transactionRef;
  if (!ref) return;

  await db.transaction(async (tx) => {
    const [payout] = await tx
      .select()
      .from(payoutTransactions)
      .where(eq(payoutTransactions.nombaTransferRef, ref))
      .limit(1);

    if (!payout) return;

    await tx
      .update(payoutTransactions)
      .set({ status: "failed", nombaResponse: payload.data })
      .where(eq(payoutTransactions.id, payout.id));

    await tx
      .update(cycles)
      .set({ status: "settling" })
      .where(eq(cycles.id, payout.cycleId));
  });
}
