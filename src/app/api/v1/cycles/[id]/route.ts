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
import { reconcileCycle } from "@/lib/reconciliation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const [cycle] = await db
      .select()
      .from(cycles)
      .where(eq(cycles.id, id))
      .limit(1);
    if (!cycle) return error("Cycle not found", "04", 404);

    // Self-healing: if cycle is active and past deadline, auto-close it
    // then re-fetch so the response reflects the updated state.
    if (cycle.status === "active" && new Date() > new Date(cycle.deadlineAt)) {
      try {
        await reconcileCycle(cycle.id);
        const [updated] = await db
          .select()
          .from(cycles)
          .where(eq(cycles.id, id))
          .limit(1);
        if (updated) Object.assign(cycle, updated);
      } catch {
        // Non-blocking — if auto-close fails, still return current state
      }
    }

    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, cycle.circleId))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [membership] = await db
      .select()
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, circle.id),
          eq(membersCircles.userId, auth.user?.userId),
        ),
      )
      .limit(1);
    if (!membership) return error("Not a member of this circle", "03", 403);

    const memberRows = await db
      .select({
        id: membersCircles.id,
        userId: membersCircles.userId,
        name: users.name,
        status: membersCircles.status,
        missedCycles: membersCircles.missedCycles,
      })
      .from(membersCircles)
      .innerJoin(users, eq(users.id, membersCircles.userId))
      .where(eq(membersCircles.circleId, circle.id));

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
      .where(eq(contributions.cycleId, cycle.id));

    const [recipient] = await db
      .select({
        name: users.name,
      })
      .from(membersCircles)
      .innerJoin(users, eq(users.id, membersCircles.userId))
      .where(eq(membersCircles.id, cycle.recipientMemberId))
      .limit(1);

    const memberContributions = memberRows.map((m) => {
      const userContribs = contribRows.filter((c) => c.memberCircleId === m.id);
      const totalPaid = userContribs.reduce((s, c) => s + c.amountKobo, 0);
      return {
        memberName: m.name,
        amountKobo: totalPaid,
        status:
          totalPaid >= circle.contributionAmountKobo
            ? "fully_paid"
            : totalPaid > 0
              ? "partial"
              : "pending",
        missedCycles: m.missedCycles,
        contributions: userContribs,
      };
    });

    return success({
      circleName: circle.name,
      cycleNumber: cycle.cycleNumber,
      recipient: recipient?.name || "Unknown",
      status: cycle.status,
      startsAt: cycle.startsAt,
      deadlineAt: cycle.deadlineAt,
      closedAt: cycle.closedAt,
      expectedTotalKobo: cycle.expectedTotalKobo,
      actualTotalKobo: cycle.actualTotalKobo,
      shortageKobo: cycle.expectedTotalKobo - cycle.actualTotalKobo,
      memberContributions,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
