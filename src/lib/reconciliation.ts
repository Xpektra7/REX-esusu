import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { initiatePayout } from "./payout";
import {
  circles,
  contributions,
  cycles,
  debts,
  membersCircles,
  notifications,
  orphanPayments,
  users,
  virtualAccounts,
  walletTransactions,
} from "@/db/schema";

// biome-ignore lint/suspicious/noExplicitAny: PgTransaction and PostgresJsDatabase share PgDatabase base
type TxOrDb = PgDatabase<any, any, any>;

type WebhookPayload = {
  event_type: string;
  requestId: string;
  data: {
    merchant: { userId: string; walletId: string; walletBalance?: number };
    transaction: {
      transactionId: string;
      type: string;
      time: string;
      responseCode: string;
      aliasAccountNumber?: string;
      aliasAccountName?: string;
      aliasAccountReference?: string;
      transactionAmount?: number;
      narration?: string;
      fee?: number;
      merchantTxRef?: string;
      transactionRef?: string;
    };
    customer?: {
      bankCode?: string;
      senderName?: string;
      bankName?: string;
      accountNumber?: string;
    };
  };
};

type Classification =
  | "exact"
  | "underpayment"
  | "overpayment"
  | "misdirected"
  | "topup";

export function classifyPayment(
  actual: number,
  expected: number,
): Classification {
  if (expected <= 0) return "misdirected";
  const ratio = actual / expected;
  if (ratio < 0.5 || ratio > 1.5) return "misdirected";
  if (ratio >= 1.01 && ratio <= 1.5) return "overpayment";
  if (ratio >= 0.5 && ratio <= 0.99) return "underpayment";
  return "exact";
}

// ---------------------------------------------------------------------------
// reconcilePayment — wraps all financial mutations in a single transaction
// ---------------------------------------------------------------------------

export async function reconcilePayment(payload: WebhookPayload) {
  return db.transaction(async (tx) => {
    return reconcilePaymentInTx(tx, payload);
  });
}

// Exposed for the webhook handler to compose within its own transaction
// alongside the webhookEvent status update (atomic idempotency fix).
export async function reconcilePaymentInTx(
  tx: TxOrDb,
  payload: WebhookPayload,
) {
  const txn = payload.data.transaction;
  const nombaTransactionRef = txn.transactionRef || null;

  const va = await tx
    .select()
    .from(virtualAccounts)
    .where(eq(virtualAccounts.accountNumber, txn.aliasAccountNumber || ""))
    .limit(1);

  if (!va[0]) return handleOrphan(tx, payload);

  const actual = Math.round((txn.transactionAmount || 0) * 100);

  const ourRef = extractReference(txn.narration || "");

  let _contribution: typeof contributions.$inferSelect | null = null;
  if (ourRef) {
    const results = await tx
      .select()
      .from(contributions)
      .where(eq(contributions.ourReference, ourRef))
      .limit(1);
    _contribution = results[0] || null;
  }

  const mcIds = await getMemberCircleIds(tx, va[0].userId);
  const perCircleExpected = await getExpectedPerActiveCircle(tx, mcIds);
  const baseExpectedTotal = Object.values(perCircleExpected).reduce(
    (s, v) => s + v,
    0,
  );
  const outstandingDebts = await getOutstandingDebtsForMemberCircles(tx, mcIds);
  const totalExpected = baseExpectedTotal + outstandingDebts;

  let classification: Classification;
  if (totalExpected <= 0 && !ourRef) {
    classification = "topup";
  } else {
    classification = classifyPayment(actual, totalExpected);
  }

  if (classification === "misdirected") {
    await flagForReview(tx, va[0], actual);
  }

  // Pure top-ups skip debt clearing and cycle allocation entirely.
  // They go straight to balance_kobo.
  let remaining = actual;
  if (classification !== "topup") {
    remaining = await applyFifoDebtClearing(tx, va[0].userId, actual, va[0].id);

    if (remaining > 0) {
      remaining = await allocateToCycle(
        tx,
        va[0].userId,
        remaining,
        va[0].id,
        classification,
        perCircleExpected,
        nombaTransactionRef,
      );
    }
  }

  if (remaining > 0) {
    await tx
      .update(virtualAccounts)
      .set({ balanceKobo: sql`balance_kobo + ${remaining}` })
      .where(eq(virtualAccounts.id, va[0].id));

    await tx
      .insert(walletTransactions)
      .values({
        userId: va[0].userId,
        type: "topup",
        amountKobo: remaining,
        reference: `topup_${txn.transactionId}`,
        status: "success",
        metadata: {
          nombaRequestId: payload.requestId,
          originalAmount: actual,
          classification,
        },
      })
      .onConflictDoNothing();

    if (classification === "topup") {
      await tx.insert(notifications).values({
        userId: va[0].userId,
        title: "Top-up received",
        body: `₦${(remaining / 100).toLocaleString()} has been added to your wallet.`,
        type: "payment",
      });
    }
  }

  if (classification === "underpayment") {
    let contributionShortfallNotified = false;
    for (const mcId of Object.keys(perCircleExpected)) {
      const expectedAmt = perCircleExpected[mcId];
      if (actual < expectedAmt) {
        contributionShortfallNotified = true;
        await tx.insert(notifications).values({
          userId: va[0].userId,
          title: "Underpayment detected",
          body: `You paid ₦${(actual / 100).toLocaleString()} but ₦${(expectedAmt / 100).toLocaleString()} was expected. Grace period started.`,
          type: "payment",
        });
      }
    }
    if (!contributionShortfallNotified && outstandingDebts > 0) {
      await tx.insert(notifications).values({
        userId: va[0].userId,
        title: "Debt deducted from payment",
        body: `₦${(outstandingDebts / 100).toLocaleString()} debt was cleared from your payment. Your cycle contribution was reduced.`,
        type: "payment",
      });
    }
  }

  return {
    status: "reconciled",
    classification,
    actual,
    totalExpected,
    allocated: actual - remaining,
  };
}

function extractReference(narration: string): string | null {
  if (!narration) return null;
  const match = narration.match(/CONTRIB_[a-zA-Z0-9_]+/);
  return match ? match[0] : null;
}

async function getMemberCircleIds(
  tx: TxOrDb,
  userId: string,
): Promise<string[]> {
  const mcList = await tx
    .select({ id: membersCircles.id })
    .from(membersCircles)
    .where(
      and(
        eq(membersCircles.userId, userId),
        eq(membersCircles.status, "active"),
      ),
    );
  return mcList.map((m) => m.id);
}

async function getExpectedPerActiveCircle(
  tx: TxOrDb,
  mcIds: string[],
): Promise<Record<string, number>> {
  if (mcIds.length === 0) return {};

  const membersList = await tx
    .select()
    .from(membersCircles)
    .where(inArray(membersCircles.id, mcIds));

  const circleIds = membersList.map((m) => m.circleId);
  const circlesList = await tx
    .select()
    .from(circles)
    .where(inArray(circles.id, circleIds));
  const circlesMap = new Map(circlesList.map((c) => [c.id, c]));

  const activeCycles = await tx
    .select()
    .from(cycles)
    .where(
      and(inArray(cycles.circleId, circleIds), eq(cycles.status, "active")),
    );
  const activeCyclesByCircle = new Map(
    activeCycles.map((c) => [c.circleId, c]),
  );

  const allContributions = await tx
    .select({
      memberCircleId: contributions.memberCircleId,
      cycleId: contributions.cycleId,
      sum: sql<number>`coalesce(sum(amount_kobo), 0)`,
    })
    .from(contributions)
    .where(
      and(
        inArray(contributions.memberCircleId, mcIds),
        inArray(
          contributions.cycleId,
          activeCycles.map((c) => c.id),
        ),
      ),
    )
    .groupBy(contributions.memberCircleId, contributions.cycleId);
  const paidMap = new Map(
    allContributions.map((c) => [`${c.memberCircleId}:${c.cycleId}`, c.sum]),
  );

  const result: Record<string, number> = {};
  for (const mc of membersList) {
    const circle = circlesMap.get(mc.circleId);
    if (!circle) continue;

    const activeCycle = activeCyclesByCircle.get(mc.circleId);
    if (!activeCycle) continue;

    const paid = paidMap.get(`${mc.id}:${activeCycle.id}`) || 0;
    result[mc.id] = Math.max(0, circle.contributionAmountKobo - paid);
  }
  return result;
}

async function getOutstandingDebtsForMemberCircles(
  tx: TxOrDb,
  mcIds: string[],
): Promise<number> {
  if (mcIds.length === 0) return 0;
  const rows = await tx
    .select({
      remaining: sql<number>`coalesce(sum(amount_kobo - paid_kobo), 0)`,
    })
    .from(debts)
    .where(
      and(inArray(debts.debtorMemberId, mcIds), eq(debts.status, "active")),
    );
  return Number(rows[0]?.remaining) || 0;
}

// ---------------------------------------------------------------------------
// applyFifoDebtClearing — uses FOR UPDATE + atomic SQL to prevent races
// ---------------------------------------------------------------------------

async function applyFifoDebtClearing(
  tx: TxOrDb,
  userId: string,
  amountKobo: number,
  _vaId: string,
): Promise<number> {
  const mcIds = await getMemberCircleIds(tx, userId);
  if (mcIds.length === 0) return amountKobo;

  // FOR UPDATE locks the selected debt rows so concurrent webhook events
  // for the same user cannot read stale paidKobo values.
  const activeDebts = await tx
    .select()
    .from(debts)
    .where(
      and(inArray(debts.debtorMemberId, mcIds), eq(debts.status, "active")),
    )
    .orderBy(asc(debts.createdAt))
    .for("update");

  let remaining = amountKobo;

  for (const debt of activeDebts) {
    const debtRemaining = debt.amountKobo - debt.paidKobo;
    if (remaining >= debtRemaining) {
      remaining -= debtRemaining;
      // Atomic: full clear in one statement
      await tx
        .update(debts)
        .set({
          paidKobo: debt.amountKobo,
          status: "cleared",
          clearedAt: new Date(),
        })
        .where(eq(debts.id, debt.id));
    } else {
      // Atomic: use SQL addition to prevent read-modify-write race
      await tx
        .update(debts)
        .set({ paidKobo: sql`paid_kobo + ${remaining}` })
        .where(eq(debts.id, debt.id));
      remaining = 0;
      break;
    }
  }

  return remaining;
}

// ---------------------------------------------------------------------------
// allocateToCycle — populates nombaTransactionRef for DB-level dedup
// ---------------------------------------------------------------------------

async function allocateToCycle(
  tx: TxOrDb,
  _userId: string,
  amountKobo: number,
  vaId: string,
  classification: Classification,
  expected: Record<string, number>,
  nombaTransactionRef?: string | null,
): Promise<number> {
  let remaining = amountKobo;
  const sortedEntries = Object.entries(expected).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [mcId, expectedAmt] of sortedEntries) {
    if (remaining <= 0) break;

    const [mc] = await tx
      .select({ circleId: membersCircles.circleId })
      .from(membersCircles)
      .where(eq(membersCircles.id, mcId))
      .limit(1);
    if (!mc) continue;

    const [activeCycle] = await tx
      .select()
      .from(cycles)
      .where(and(eq(cycles.circleId, mc.circleId), eq(cycles.status, "active")))
      .limit(1);
    if (!activeCycle) continue;

    const alloc = Math.min(remaining, expectedAmt);
    if (alloc <= 0) continue;

    // Insert contribution WITH nombaTransactionRef so the DB UNIQUE constraint
    // prevents double-allocation even if the webhook handler retries.
    await tx
      .insert(contributions)
      .values({
        memberCircleId: mcId,
        cycleId: activeCycle.id,
        virtualAccountId: vaId,
        amountKobo: alloc,
        appliedKobo: alloc,
        status: classification === "underpayment" ? "partial" : "fully_applied",
        nombaTransactionRef: nombaTransactionRef || undefined,
        reconciledAt: new Date(),
      })
      .onConflictDoNothing({ target: contributions.nombaTransactionRef });

    await tx
      .update(cycles)
      .set({
        actualTotalKobo: sql`actual_total_kobo + ${alloc}`,
      })
      .where(eq(cycles.id, activeCycle.id));

    remaining -= alloc;
  }
  return remaining;
}

// ---------------------------------------------------------------------------
// reconcileCycle — closes a cycle, creates debts, advances to next cycle
// ---------------------------------------------------------------------------

export async function reconcileCycle(cycleId: string) {
  const result = await db.transaction(async (tx) => {
    return reconcileCycleInTx(tx, cycleId);
  });

  // Initiate payout after the transaction commits
  if (result.totalPaidKobo > 0) {
    const feeKobo = Math.min(5000, Math.ceil(result.totalPaidKobo * 0.01));
    const payoutAmount = result.totalPaidKobo - feeKobo;
    if (payoutAmount > 0) {
      try {
        const p = await initiatePayout(
          cycleId,
          result.recipientUserId,
          result.recipientName,
          payoutAmount,
        );
        result.payoutStatus = p.status;
      } catch (e) {
        console.error(
          `[reconcileCycle] Payout initiation failed for cycle ${cycleId}:`,
          e,
        );
      }
    }
  }

  return result;
}

async function reconcileCycleInTx(tx: TxOrDb, cycleId: string) {
  const [cycle] = await tx
    .select()
    .from(cycles)
    .where(eq(cycles.id, cycleId))
    .limit(1);
  if (!cycle) throw new Error("Cycle not found");
  if (cycle.status === "closed" || cycle.status === "paid_out")
    throw new Error("Cycle already closed");

  const [circle] = await tx
    .select()
    .from(circles)
    .where(eq(circles.id, cycle.circleId))
    .limit(1);
  if (!circle) throw new Error("Circle not found");

  const members = await tx
    .select()
    .from(membersCircles)
    .where(
      and(
        eq(membersCircles.circleId, circle.id),
        eq(membersCircles.status, "active"),
      ),
    )
    .orderBy(membersCircles.rotationOrder);

  if (members.length === 0) throw new Error("No active members");

  const userIds = members.map((m) => m.userId);
  const usersList = await tx
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, userIds));
  const usersById = new Map(usersList.map((u) => [u.id, u]));

  const memberInfo = members.map((mc) => {
    const user = usersById.get(mc.userId);
    return {
      mcId: mc.id,
      name: user?.name || "Unknown",
      userId: user?.id || mc.userId,
    };
  });
  const recipientName =
    memberInfo.find((m) => m.mcId === cycle.recipientMemberId)?.name ||
    "Unknown";

  const contribRows = await tx
    .select({
      memberCircleId: contributions.memberCircleId,
      sum: sql<number>`coalesce(sum(amount_kobo), 0)`,
    })
    .from(contributions)
    .where(
      and(
        inArray(contributions.memberCircleId, members.map((m) => m.id)),
        eq(contributions.cycleId, cycle.id),
      ),
    )
    .groupBy(contributions.memberCircleId);
  const contribsByMember = new Map(
    contribRows.map((r) => [r.memberCircleId, r.sum]),
  );

  let totalPaid = 0;
  const missedPayers: Array<{
    memberId: string;
    name: string;
    deficit: number;
  }> = [];
  const debtsCreated: Array<{
    debtorName: string;
    debtorId: string;
    creditorName: string;
    amountKobo: number;
  }> = [];

  for (const mc of members) {
    const paidKobo = contribsByMember.get(mc.id) || 0;
    totalPaid += paidKobo;

    const userName =
      memberInfo.find((m) => m.mcId === mc.id)?.name || "Unknown";

    if (paidKobo < circle.contributionAmountKobo) {
      const deficit = circle.contributionAmountKobo - paidKobo;

      await tx.insert(debts).values({
        cycleId: cycle.id,
        debtorMemberId: mc.id,
        creditorMemberId: cycle.recipientMemberId,
        amountKobo: deficit + 50000,
        paidKobo: 0,
        fineKobo: 50000,
        status: "active",
      });

      await tx
        .update(membersCircles)
        .set({
          missedCycles: sql`missed_cycles + 1`,
        })
        .where(eq(membersCircles.id, mc.id));

      missedPayers.push({ memberId: mc.id, name: userName, deficit });
      debtsCreated.push({
        debtorName: userName,
        debtorId: mc.id,
        creditorName: recipientName,
        amountKobo: deficit,
      });

      await tx.insert(notifications).values({
        userId: mc.userId,
        title: "Debt recorded for missed contribution",
        body: `Cycle ${cycle.cycleNumber} shortfall of ₦${(deficit / 100).toLocaleString()} + ₦500 fine recorded. This amount carries forward.`,
        type: "payment",
      });
    }

    if (paidKobo > circle.contributionAmountKobo) {
      const excess = paidKobo - circle.contributionAmountKobo;
      const [va] = await tx
        .select()
        .from(virtualAccounts)
        .where(
          and(
            eq(virtualAccounts.userId, mc.userId),
            eq(virtualAccounts.type, "personal"),
          ),
        )
        .limit(1);
      if (va) {
        await tx
          .update(virtualAccounts)
          .set({
            balanceKobo: sql`balance_kobo + ${excess}`,
          })
          .where(eq(virtualAccounts.id, va.id));
      }
    }
  }

  await tx
    .update(cycles)
    .set({
      actualTotalKobo: totalPaid,
      status: "closed",
      closedAt: new Date(),
    })
    .where(eq(cycles.id, cycle.id));

  let nextCycle = null;
  if (circle.cycleCount === null || cycle.cycleNumber < circle.cycleCount) {
    const nextCycleNumber = cycle.cycleNumber + 1;
    const nextRecipientIndex = (nextCycleNumber - 1) % members.length;
    const nextRecipient = members[nextRecipientIndex];
    if (nextRecipient) {
      const deadlineHours =
        circle.gracePeriodHours || (circle.frequency === "daily" ? 6 : circle.frequency === "weekly" ? 24 : 72);
      [nextCycle] = await tx
        .insert(cycles)
        .values({
          circleId: circle.id,
          recipientMemberId: nextRecipient.id,
          cycleNumber: nextCycleNumber,
          expectedTotalKobo: circle.contributionAmountKobo * members.length,
          actualTotalKobo: 0,
          status: "active",
          startsAt: new Date(),
          deadlineAt: new Date(Date.now() + deadlineHours * 60 * 60 * 1000),
        })
        .returning();

      await tx
        .update(circles)
        .set({ currentCycle: nextCycleNumber })
        .where(eq(circles.id, circle.id));

      const memberDebtMap = new Map<string, number>();
      const allActiveDebts = await tx
        .select({
          debtorMemberId: debts.debtorMemberId,
          remaining: sql<number>`amount_kobo - paid_kobo`,
        })
        .from(debts)
        .where(
          and(
            inArray(
              debts.debtorMemberId,
              members.map((m) => m.id),
            ),
            eq(debts.status, "active"),
          ),
        );
      for (const d of allActiveDebts) {
        const current = memberDebtMap.get(d.debtorMemberId) || 0;
        memberDebtMap.set(d.debtorMemberId, current + Number(d.remaining));
      }

      for (const mc of members) {
        const outstandingDebt = memberDebtMap.get(mc.id) || 0;
        const totalRequired = circle.contributionAmountKobo + outstandingDebt;
        const formattedContribution = `₦${(circle.contributionAmountKobo / 100).toLocaleString()}`;
        const deadline = nextCycle.deadlineAt?.toLocaleDateString() ?? "N/A";
        const body =
          outstandingDebt > 0
            ? `Contribute ₦${(totalRequired / 100).toLocaleString()} (${formattedContribution} + ₦${(outstandingDebt / 100).toLocaleString()} debt) by ${deadline}.`
            : `Contribute ${formattedContribution} by ${deadline}.`;

        await tx.insert(notifications).values({
          userId: mc.userId,
          title: `Cycle ${nextCycleNumber} started`,
          body,
          type: "cycle",
        });
      }
    }
  }

  const recipientInfo = memberInfo.find(
    (m) => m.mcId === cycle.recipientMemberId,
  );
  if (recipientInfo) {
    await tx.insert(notifications).values({
      userId: recipientInfo.userId,
      title: `Payout from ${circle.name}`,
      body: `₦${(totalPaid / 100).toLocaleString()} paid out to you for ${circle.name} Cycle ${cycle.cycleNumber}.${totalPaid < cycle.expectedTotalKobo ? ` Shortfall ₦${((cycle.expectedTotalKobo - totalPaid) / 100).toLocaleString()} tracked as debts.` : ""}`,
      type: "payout",
    });
  }

  for (const m of memberInfo) {
    if (m.userId === recipientInfo?.userId) continue;
    await tx.insert(notifications).values({
      userId: m.userId,
      title: `Payout from ${circle.name}`,
      body: `₦${(totalPaid / 100).toLocaleString()} paid out to ${recipientInfo?.name ?? "a member"} for ${circle.name} Cycle ${cycle.cycleNumber}.`,
      type: "payout",
    });
  }

  const isLastCycle = circle.cycleCount !== null && cycle.cycleNumber >= circle.cycleCount;
  if (isLastCycle) {
    await tx
      .update(circles)
      .set({ status: "completed" })
      .where(eq(circles.id, circle.id));
  }

  const recipientInfoForPayout = memberInfo.find(
    (m) => m.mcId === cycle.recipientMemberId,
  );

  return {
    cycleNumber: cycle.cycleNumber,
    totalExpectedKobo: cycle.expectedTotalKobo,
    totalPaidKobo: totalPaid,
    shortfallKobo: cycle.expectedTotalKobo - totalPaid,
    debtsCreated,
    missedPayers,
    recipientUserId: recipientInfoForPayout?.userId || "",
    recipientName,
    payoutStatus: null as string | null,
    nextCycle: nextCycle
      ? {
          cycleNumber: nextCycle.cycleNumber,
          id: nextCycle.id,
          deadlineAt: nextCycle.deadlineAt,
        }
      : null,
    circleCompleted: isLastCycle,
  };
}

async function handleOrphan(tx: TxOrDb, payload: WebhookPayload) {
  const txn = payload.data.transaction;
  const customer = payload.data.customer;

  await tx
    .insert(orphanPayments)
    .values({
      nombaRequestId: payload.requestId,
      transactionId: txn.transactionId,
      accountNumber: txn.aliasAccountNumber || null,
      amountKobo: Math.round((txn.transactionAmount || 0) * 100),
      senderName: customer?.senderName || null,
      senderAccount: customer?.accountNumber || null,
      senderBank: customer?.bankName || null,
      narration: txn.narration || null,
      rawPayload: payload,
    })
    .onConflictDoNothing();

  console.error(
    `[Orphan] ${txn.aliasAccountNumber} — ₦${(txn.transactionAmount || 0).toLocaleString()} — no matching VA. Logged to orphan_payments.`,
  );
}

async function flagForReview(
  tx: TxOrDb,
  va: typeof virtualAccounts.$inferSelect,
  actual: number,
) {
  await tx.insert(notifications).values({
    userId: va.userId,
    title: "Misdirected payment flagged",
    body: `₦${(actual / 100).toLocaleString()} received — doesn't match expected amounts.`,
    type: "payment",
  });
}
