import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { circles, membersCircles, cycles, contributions, debts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const [membership] = await db.select().from(membersCircles)
      .where(and(eq(membersCircles.circleId, id), eq(membersCircles.userId, auth.user!.userId)))
      .limit(1);
    if (!membership) return error("Not a member of this circle", "03", 403);

    const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const memberRows = await db.select({
      id: membersCircles.id,
      userId: membersCircles.userId,
      name: users.name,
      role: membersCircles.role,
      status: membersCircles.status,
      trustScore: users.trustScore,
      missedCycles: membersCircles.missedCycles,
      rotationOrder: membersCircles.rotationOrder,
    }).from(membersCircles).innerJoin(users, eq(users.id, membersCircles.userId))
      .where(eq(membersCircles.circleId, id));

    const cycleRows = await db.select({
      id: cycles.id,
      cycleNumber: cycles.cycleNumber,
      recipientMemberId: cycles.recipientMemberId,
      expectedTotalKobo: cycles.expectedTotalKobo,
      actualTotalKobo: cycles.actualTotalKobo,
      status: cycles.status,
      startsAt: cycles.startsAt,
      deadlineAt: cycles.deadlineAt,
      closedAt: cycles.closedAt,
    }).from(cycles).where(eq(cycles.circleId, id)).orderBy(cycles.cycleNumber);

    const allDebts = await db.select().from(debts)
      .innerJoin(cycles, eq(debts.cycleId, cycles.id))
      .where(eq(cycles.circleId, id));

    const memberMap = new Map(memberRows.map((m) => [m.id, m]));

    const totalCollected = cycleRows.reduce((s, c) => s + c.actualTotalKobo, 0);
    const totalPaidOut = cycleRows.filter((c) => c.status === "paid_out").reduce((s, c) => s + c.actualTotalKobo, 0);
    const totalFines = allDebts.reduce((s, d) => s + d.debts.fineKobo, 0);
    const totalOutstandingDebts = allDebts.filter((d) => d.debts.status === "active").reduce((s, d) => s + (d.debts.amountKobo - d.debts.paidKobo), 0);
    const completedCycles = cycleRows.filter((c) => c.status === "paid_out" || c.status === "closed").length;
    const defaultRate = cycleRows.length > 0 ? Math.round((allDebts.filter((d) => d.debts.status === "active").length / (cycleRows.length * memberRows.length)) * 100) : 0;

    const memberReports = await Promise.all(memberRows.map(async (m) => {
      const memberCycleIds = cycleRows.map((c) => c.id);
      const memberContribs = await db.select().from(contributions)
        .innerJoin(membersCircles, eq(contributions.memberCircleId, membersCircles.id))
        .where(and(eq(membersCircles.userId, m.userId), eq(membersCircles.circleId, id)));

      const totalPaid = memberContribs.reduce((s, c) => s + c.contributions.amountKobo, 0);

      const receivedCycles = cycleRows.filter((c) => {
        const recip = memberMap.get(c.recipientMemberId);
        return recip && recip.userId === m.userId;
      });
      const totalReceived = receivedCycles.reduce((s, c) => s + c.actualTotalKobo, 0);

      const debtsAsDebtor = allDebts.filter((d) => {
        const debtor = memberMap.get(d.debts.debtorMemberId);
        return debtor && debtor.userId === m.userId && d.debts.status === "active";
      }).map((d) => {
        const creditor = memberMap.get(d.debts.creditorMemberId);
        return { to: creditor?.name || "Unknown", amountKobo: d.debts.amountKobo - d.debts.paidKobo, cycle: d.cycles.cycleNumber };
      });

      const debtsAsCreditor = allDebts.filter((d) => {
        const creditor = memberMap.get(d.debts.creditorMemberId);
        return creditor && creditor.userId === m.userId && d.debts.status === "active";
      }).map((d) => {
        const debtor = memberMap.get(d.debts.debtorMemberId);
        return { from: debtor?.name || "Unknown", amountKobo: d.debts.amountKobo - d.debts.paidKobo, cycle: d.cycles.cycleNumber };
      });

      return {
        name: m.name,
        role: m.role,
        status: m.status,
        trustScore: m.trustScore,
        totalPaidKobo: totalPaid,
        totalReceivedKobo: totalReceived,
        missedCycles: m.missedCycles,
        activeDebtsAsDebtor: debtsAsDebtor,
        activeDebtsAsCreditor: debtsAsCreditor,
      };
    }));

    const cycleReports = cycleRows.map((c) => {
      const recip = memberMap.get(c.recipientMemberId);
      return {
        cycleNumber: c.cycleNumber,
        recipient: recip?.name || "Unknown",
        expectedKobo: c.expectedTotalKobo,
        actualKobo: c.actualTotalKobo,
        status: c.status,
        shortfallKobo: c.expectedTotalKobo - c.actualTotalKobo,
        cycleDebts: allDebts.filter((d) => d.cycles.id === c.id && d.debts.status === "active").map((d) => {
          const debtor = memberMap.get(d.debts.debtorMemberId);
          return { debtor: debtor?.name || "Unknown", amountKobo: d.debts.amountKobo - d.debts.paidKobo };
        }),
      };
    });

    return success({
      circleName: circle.name,
      contributionAmountKobo: circle.contributionAmountKobo,
      frequency: circle.frequency,
      totalCycles: circle.cycleCount,
      completedCycles,
      summary: {
        totalCollectedKobo: totalCollected,
        totalPaidOutKobo: totalPaidOut,
        totalFinesKobo: totalFines,
        totalOutstandingDebtsKobo: totalOutstandingDebts,
        defaultRate: `${defaultRate}%`,
      },
      members: memberReports,
      cycles: cycleReports,
    });
  } catch (e) {
    return error((e as Error).message);
  }
}