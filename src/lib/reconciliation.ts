import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { initiatePayout } from "./payout";
import {
  circles,
  contributions,
  cycles,
  debts,
  membersCircles,
  notifications,
  users,
  virtualAccounts,
  walletTransactions,
} from "@/db/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

export async function reconcilePayment(payload: WebhookPayload) {
  const txn = payload.data.transaction;
  const va = await db
    .select()
    .from(virtualAccounts)
    .where(eq(virtualAccounts.accountNumber, txn.aliasAccountNumber || ""))
    .limit(1);

  if (!va[0]) return handleOrphan(payload);

  const actual = Math.round((txn.transactionAmount || 0) * 100);

  const ourRef = extractReference(txn.narration || "");

  const mcIds = await getMemberCircleIds(va[0].userId);

  // Pre-fetch expectations before the transaction (read-only)
  const perCircleExpected = await getExpectedPerActiveCircle(mcIds);
  const baseExpectedTotal = Object.values(perCircleExpected).reduce(
    (s, v) => s + v,
    0,
  );
  const outstandingDebts = await getOutstandingDebtsForMemberCircles(mcIds);
  const totalExpected = baseExpectedTotal + outstandingDebts;

  let classification: Classification;
  if (totalExpected <= 0 && !ourRef) {
    classification = "topup";
  } else {
    classification = classifyPayment(actual, totalExpected);
  }

  if (classification === "misdirected") {
    await flagForReview(va[0], actual);
  }

  const result = await db.transaction(async (tx) => {
    let remaining = await applyFifoDebtClearingTx(tx, va[0].userId, actual, va[0].id);

    if (remaining > 0) {
      remaining = await allocateToCycleTx(
        tx,
        va[0].userId,
        remaining,
        va[0].id,
        classification,
        perCircleExpected,
      );
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

    return { remaining };
  });

  return {
    status: "reconciled",
    classification,
    actual,
    totalExpected,
    allocated: actual - result.remaining,
  };
}

function extractReference(narration: string): string | null {
  if (!narration) return null;
  const match = narration.match(/CONTRIB_[a-zA-Z0-9_]+/);
  return match ? match[0] : null;
}

async function getMemberCircleIds(userId: string): Promise<string[]> {
  const mcList = await db
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
  mcIds: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const mcId of mcIds) {
    const [mc] = await db
      .select({ circleId: membersCircles.circleId })
      .from(membersCircles)
      .where(eq(membersCircles.id, mcId))
      .limit(1);
    if (!mc) continue;

    const [activeCycle] = await db
      .select({ id: cycles.id })
      .from(cycles)
      .where(and(eq(cycles.circleId, mc.circleId), eq(cycles.status, "active")))
      .limit(1);
    if (!activeCycle) continue;

    const [circle] = await db
      .select({ contributionAmountKobo: circles.contributionAmountKobo })
      .from(circles)
      .where(eq(circles.id, mc.circleId))
      .limit(1);
    if (!circle) continue;

    const paid = await db
      .select({ sum: sql<number>`coalesce(sum(amount_kobo), 0)` })
      .from(contributions)
      .where(
        and(
          eq(contributions.memberCircleId, mcId),
          eq(contributions.cycleId, activeCycle.id),
        ),
      );

    result[mcId] = Math.max(
      0,
      circle.contributionAmountKobo - (Number(paid[0]?.sum) || 0),
    );
  }
  return result;
}

async function getOutstandingDebtsForMemberCircles(
  mcIds: string[],
): Promise<number> {
  if (mcIds.length === 0) return 0;
  const rows = await db
    .select({
      remaining: sql<number>`coalesce(sum(amount_kobo - paid_kobo), 0)`,
    })
    .from(debts)
    .where(
      and(inArray(debts.debtorMemberId, mcIds), eq(debts.status, "active")),
    );
  return Number(rows[0]?.remaining) || 0;
}

async function applyFifoDebtClearing(
  userId: string,
  amountKobo: number,
  _vaId: string,
): Promise<number> {
  const mcIds = await getMemberCircleIds(userId);
  if (mcIds.length === 0) return amountKobo;

  const activeDebts = await db
    .select()
    .from(debts)
    .where(
      and(inArray(debts.debtorMemberId, mcIds), eq(debts.status, "active")),
    )
    .orderBy(asc(debts.createdAt));

  let remaining = amountKobo;

  for (const debt of activeDebts) {
    const debtRemaining = debt.amountKobo - debt.paidKobo;
    if (remaining >= debtRemaining) {
      remaining -= debtRemaining;
      await db
        .update(debts)
        .set({
          paidKobo: debt.amountKobo,
          status: "cleared",
          clearedAt: new Date(),
        })
        .where(eq(debts.id, debt.id));
    } else {
      await db
        .update(debts)
        .set({ paidKobo: debt.paidKobo + remaining })
        .where(eq(debts.id, debt.id));
      remaining = 0;
      break;
    }
  }

  return remaining;
}

async function applyFifoDebtClearingTx(
  tx: Tx,
  userId: string,
  amountKobo: number,
  _vaId: string,
): Promise<number> {
  const mcIds = await getMemberCircleIds(userId);
  if (mcIds.length === 0) return amountKobo;

  const activeDebts = await tx
    .select()
    .from(debts)
    .where(
      and(inArray(debts.debtorMemberId, mcIds), eq(debts.status, "active")),
    )
    .orderBy(asc(debts.createdAt));

  let remaining = amountKobo;

  for (const debt of activeDebts) {
    const debtRemaining = debt.amountKobo - debt.paidKobo;
    if (remaining >= debtRemaining) {
      remaining -= debtRemaining;
      await tx
        .update(debts)
        .set({
          paidKobo: debt.amountKobo,
          status: "cleared",
          clearedAt: new Date(),
        })
        .where(eq(debts.id, debt.id));
    } else {
      await tx
        .update(debts)
        .set({ paidKobo: debt.paidKobo + remaining })
        .where(eq(debts.id, debt.id));
      remaining = 0;
      break;
    }
  }

  return remaining;
}

async function allocateToCycle(
  _userId: string,
  amountKobo: number,
  vaId: string,
  classification: Classification,
  expected: Record<string, number>,
): Promise<number> {
  let remaining = amountKobo;
  const sortedEntries = Object.entries(expected).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [mcId, expectedAmt] of sortedEntries) {
    if (remaining <= 0) break;

    const [mc] = await db
      .select({ circleId: membersCircles.circleId })
      .from(membersCircles)
      .where(eq(membersCircles.id, mcId))
      .limit(1);
    if (!mc) continue;

    const [activeCycle] = await db
      .select()
      .from(cycles)
      .where(and(eq(cycles.circleId, mc.circleId), eq(cycles.status, "active")))
      .limit(1);
    if (!activeCycle) continue;

    const alloc = Math.min(remaining, expectedAmt);
    if (alloc <= 0) continue;

    await db.insert(contributions).values({
      memberCircleId: mcId,
      cycleId: activeCycle.id,
      virtualAccountId: vaId,
      amountKobo: alloc,
      appliedKobo: alloc,
      status: classification === "underpayment" ? "partial" : "fully_applied",
      reconciledAt: new Date(),
    });

    await db
      .update(cycles)
      .set({
        actualTotalKobo: sql`actual_total_kobo + ${alloc}`,
      })
      .where(eq(cycles.id, activeCycle.id));

    remaining -= alloc;
  }
  return remaining;
}

async function allocateToCycleTx(
  tx: Tx,
  _userId: string,
  amountKobo: number,
  vaId: string,
  classification: Classification,
  expected: Record<string, number>,
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

    await tx.insert(contributions).values({
      memberCircleId: mcId,
      cycleId: activeCycle.id,
      virtualAccountId: vaId,
      amountKobo: alloc,
      appliedKobo: alloc,
      status: classification === "underpayment" ? "partial" : "fully_applied",
      reconciledAt: new Date(),
    });

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
  const [cycle] = await db
    .select()
    .from(cycles)
    .where(eq(cycles.id, cycleId))
    .limit(1);
  if (!cycle) throw new Error("Cycle not found");
  if (cycle.status === "closed" || cycle.status === "paid_out")
    throw new Error("Cycle already closed");

  const [circle] = await db
    .select()
    .from(circles)
    .where(eq(circles.id, cycle.circleId))
    .limit(1);
  if (!circle) throw new Error("Circle not found");

  const members = await db
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

  const memberInfo = await Promise.all(
    members.map(async (mc) => {
      const [user] = await db
        .select({ name: users.name, userId: users.id })
        .from(users)
        .where(eq(users.id, mc.userId))
        .limit(1);
      return {
        mcId: mc.id,
        name: user?.name || "Unknown",
        userId: user?.userId || mc.userId,
      };
    }),
  );
  const recipientName =
    memberInfo.find((m) => m.mcId === cycle.recipientMemberId)?.name ||
    "Unknown";

  const result = await db.transaction(async (tx) => {
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
      const memberContribs = await tx
        .select({ sum: sql<number>`coalesce(sum(amount_kobo), 0)` })
        .from(contributions)
        .where(
          and(
            eq(contributions.memberCircleId, mc.id),
            eq(contributions.cycleId, cycle.id),
          ),
        );
      const paidKobo = Number(memberContribs[0]?.sum) || 0;
      totalPaid += paidKobo;

      const userName =
        memberInfo.find((m) => m.mcId === mc.id)?.name || "Unknown";

      if (paidKobo < circle.contributionAmountKobo) {
        const deficit = circle.contributionAmountKobo - paidKobo;

        await tx.insert(debts).values({
          cycleId: cycle.id,
          debtorMemberId: mc.id,
          creditorMemberId: cycle.recipientMemberId,
          amountKobo: deficit,
          paidKobo: 0,
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
          body: `Cycle ${cycle.cycleNumber} shortfall of ₦${(deficit / 100).toLocaleString()} recorded. This amount carries forward.`,
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
    if (cycle.cycleNumber < circle.cycleCount) {
      const nextCycleNumber = cycle.cycleNumber + 1;
      const nextRecipientIndex = (nextCycleNumber - 1) % members.length;
      const nextRecipient = members[nextRecipientIndex];
      if (nextRecipient) {
        const deadlineHours =
          circle.gracePeriodHours || (circle.frequency === "weekly" ? 24 : 72);
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
        title: `Cycle ${cycle.cycleNumber} payout`,
        body: `₦${(totalPaid / 100).toLocaleString()} collected for your cycle.${totalPaid < cycle.expectedTotalKobo ? ` Shortfall ₦${((cycle.expectedTotalKobo - totalPaid) / 100).toLocaleString()} tracked as debts.` : ""}`,
        type: "payout",
      });
    }

    const isLastCycle = cycle.cycleNumber >= circle.cycleCount;
    if (isLastCycle) {
      await tx
        .update(circles)
        .set({ status: "completed" })
        .where(eq(circles.id, circle.id));
    }

    return { totalPaid, missedPayers, debtsCreated, nextCycle, isLastCycle };
  });

  const isLastCycle = result.isLastCycle;

  // Initiate payout to the cycle recipient after the transaction commits
  const recipientMember = members.find(
    (m) => m.id === cycle.recipientMemberId,
  );
  let payoutStatus: string | null = null;
  if (recipientMember && result.totalPaid > 0) {
    const feeKobo = Math.min(5000, Math.ceil(result.totalPaid * 0.01));
    const payoutAmount = result.totalPaid - feeKobo;
    if (payoutAmount > 0) {
      try {
        const p = await initiatePayout(
          cycleId,
          recipientMember.userId,
          recipientName,
          payoutAmount,
        );
        payoutStatus = p.status;
      } catch (e) {
        console.error(
          `[reconcileCycle] Payout initiation failed for cycle ${cycleId}:`,
          e,
        );
      }
    }
  }

  return {
    cycleNumber: cycle.cycleNumber,
    totalExpectedKobo: cycle.expectedTotalKobo,
    totalPaidKobo: result.totalPaid,
    shortfallKobo: cycle.expectedTotalKobo - result.totalPaid,
    debtsCreated: result.debtsCreated,
    missedPayers: result.missedPayers,
    nextCycle: result.nextCycle
      ? {
          cycleNumber: result.nextCycle.cycleNumber,
          id: result.nextCycle.id,
          deadlineAt: result.nextCycle.deadlineAt,
        }
      : null,
    circleCompleted: isLastCycle,
    payoutStatus,
  };
}

async function handleOrphan(payload: WebhookPayload) {
  const txn = payload.data.transaction;
  console.error(
    `Orphan payment: ${txn.aliasAccountNumber}, amount: ${txn.transactionAmount}`,
  );
}

async function flagForReview(
  va: typeof virtualAccounts.$inferSelect,
  actual: number,
) {
  await db.insert(notifications).values({
    userId: va.userId,
    title: "Misdirected payment flagged",
    body: `₦${(actual / 100).toLocaleString()} received — doesn't match expected amounts.`,
    type: "payment",
  });
}
