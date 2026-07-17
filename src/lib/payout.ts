import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { cycles, payoutTransactions } from "@/db/schema";

// biome-ignore lint/suspicious/noExplicitAny: PgTransaction and PostgresJsDatabase share PgDatabase base
type TxOrDb = PgDatabase<any, any, any>;

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
  return db.transaction(async (tx) => {
    return handlePayoutSuccessInTx(tx, payload);
  });
}

export async function handlePayoutSuccessInTx(
  tx: TxOrDb,
  payload: {
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
  },
) {
  const txn = payload.data.transaction;
  const ref = txn.merchantTxRef || txn.transactionRef;
  if (!ref) return;

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
  return db.transaction(async (tx) => {
    return handlePayoutFailedInTx(tx, payload);
  });
}

export async function handlePayoutFailedInTx(
  tx: TxOrDb,
  payload: {
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
  },
) {
  const txn = payload.data.transaction;
  const ref = txn.merchantTxRef || txn.transactionRef;
  if (!ref) return;

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
}
