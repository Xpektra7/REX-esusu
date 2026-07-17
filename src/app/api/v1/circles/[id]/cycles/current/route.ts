import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import {
  circles,
  contributions,
  cycles,
  membersCircles,
  users,
} from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const [membership] = await db
      .select()
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, id),
          eq(membersCircles.userId, auth.user?.userId),
        ),
      )
      .limit(1);
    if (!membership) return error("Not a member of this circle", "03", 403);

    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [currentCycle] = await db
      .select()
      .from(cycles)
      .where(and(eq(cycles.circleId, id), eq(cycles.status, "active")))
      .orderBy(cycles.cycleNumber)
      .limit(1);
    if (!currentCycle) return success({ cycle: null });

    const [recipient] = await db
      .select({
        id: membersCircles.id,
        userId: membersCircles.userId,
        name: users.name,
      })
      .from(membersCircles)
      .innerJoin(users, eq(users.id, membersCircles.userId))
      .where(eq(membersCircles.id, currentCycle.recipientMemberId))
      .limit(1);

    const memberRows = await db
      .select({
        id: membersCircles.id,
        userId: membersCircles.userId,
        name: users.name,
      })
      .from(membersCircles)
      .innerJoin(users, eq(users.id, membersCircles.userId))
      .where(
        and(
          eq(membersCircles.circleId, id),
          eq(membersCircles.status, "active"),
        ),
      );

    const contribRows = await db
      .select({
        id: contributions.id,
        memberCircleId: contributions.memberCircleId,
        amountKobo: contributions.amountKobo,
        appliedKobo: contributions.appliedKobo,
        status: contributions.status,
        ourReference: contributions.ourReference,
        createdAt: contributions.createdAt,
      })
      .from(contributions)
      .where(eq(contributions.cycleId, currentCycle.id));

    const memberContributions = [];
    for (const m of memberRows) {
      const userContribs = contribRows.filter((c) => c.memberCircleId === m.id);
      const totalPaid = userContribs.reduce((s, c) => s + c.amountKobo, 0);
      const totalApplied = userContribs.reduce((s, c) => s + c.appliedKobo, 0);
      memberContributions.push({
        memberName: m.name,
        amountKobo: totalPaid,
        appliedKobo: totalApplied,
        status:
          totalPaid >= circle.contributionAmountKobo
            ? "fully_applied"
            : totalPaid > 0
              ? "partial"
              : "pending",
        contributions: userContribs.map((c) => ({
          id: c.id,
          amountKobo: c.amountKobo,
          appliedKobo: c.appliedKobo,
          status: c.status,
          ourReference: c.ourReference,
          createdAt: c.createdAt,
        })),
      });
    }

    const paidKobo = contribRows.reduce((s, c) => s + c.amountKobo, 0);

    return success({
      cycleNumber: currentCycle.cycleNumber,
      recipient: recipient
        ? { id: recipient.userId, name: recipient.name }
        : null,
      status: currentCycle.status,
      expectedTotalKobo: currentCycle.expectedTotalKobo,
      paidKobo,
      deadlineAt: currentCycle.deadlineAt,
      memberContributions,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
