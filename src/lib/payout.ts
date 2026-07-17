import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  cycles,
  payoutTransactions,
  virtualAccounts,
  walletTransactions,
} from "@/db/schema";
import { nombaPost } from "./nomba";

export async function initiatePayout(
  cycleId: string,
  recipientUserId: string,
  recipientName: string,
  amountKobo: number,
): Promise<{ id: string; status: string }> {
  const merchantTxRef = `PO_${cycleId.slice(0, 8)}_${Date.now()}`;

  const [va] = await db
    .select()
    .from(virtualAccounts)
    .where(eq(virtualAccounts.userId, recipientUserId))
    .limit(1);

  if (!va?.bankCode || !va?.accountNumber) {
    throw new Error("Recipient has no bank details on file");
  }

  const [pt] = await db
    .insert(payoutTransactions)
    .values({
      cycleId,
      recipientUserId,
      amountKobo,
      nombaTransferRef: merchantTxRef,
      status: "pending",
    })
    .returning();

  try {
    const nombaResp = await nombaPost("/v2/transfers/bank", {
      amount: amountKobo,
      bankCode: va.bankCode,
      accountNumber: va.accountNumber,
      accountName: va.accountName,
      senderName: "Esusu",
      merchantTxRef,
      narration: `Payout for cycle ${cycleId.slice(0, 8)}`,
    });

    const ref =
      nombaResp?.data?.meta?.merchantTxRef ||
      nombaResp?.data?.id ||
      merchantTxRef;

    await db
      .update(payoutTransactions)
      .set({
        status: "processing",
        nombaTransferRef: ref,
        nombaResponse: nombaResp as unknown,
      })
      .where(eq(payoutTransactions.id, pt.id));

    return { id: pt.id, status: "processing" };
  } catch (err) {
    await db
      .update(payoutTransactions)
      .set({
        status: "failed",
        nombaResponse: err as unknown,
      })
      .where(eq(payoutTransactions.id, pt.id));
    throw err;
  }
}

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
