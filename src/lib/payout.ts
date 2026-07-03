import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cycles, payoutTransactions } from "@/db/schema";

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

  const [payout] = await db
    .select()
    .from(payoutTransactions)
    .where(eq(payoutTransactions.nombaTransferRef, ref))
    .limit(1);

  if (!payout) return;

  await db
    .update(payoutTransactions)
    .set({
      status: "success",
      completedAt: new Date(),
      nombaResponse: payload.data,
    })
    .where(eq(payoutTransactions.id, payout.id));

  await db
    .update(cycles)
    .set({ status: "paid_out" })
    .where(eq(cycles.id, payout.cycleId));
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

  const [payout] = await db
    .select()
    .from(payoutTransactions)
    .where(eq(payoutTransactions.nombaTransferRef, ref))
    .limit(1);

  if (!payout) return;

  await db
    .update(payoutTransactions)
    .set({ status: "failed", nombaResponse: payload.data })
    .where(eq(payoutTransactions.id, payout.id));

  await db
    .update(cycles)
    .set({ status: "settling" })
    .where(eq(cycles.id, payout.cycleId));
}
