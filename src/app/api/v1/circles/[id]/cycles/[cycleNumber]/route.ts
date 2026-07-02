import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { cycles, membersCircles, users, contributions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cycleNumber: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id, cycleNumber } = await params;
    const cycleNum = parseInt(cycleNumber, 10);

    const [membership] = await db.select().from(membersCircles)
      .where(and(eq(membersCircles.circleId, id), eq(membersCircles.userId, auth.user!.userId)))
      .limit(1);
    if (!membership) return error("Not a member of this circle", "03", 403);

    const [cycle] = await db.select().from(cycles)
      .where(and(eq(cycles.circleId, id), eq(cycles.cycleNumber, cycleNum)))
      .limit(1);
    if (!cycle) return error("Cycle not found", "04", 404);

    const memberRows = await db.select({
      memberId: membersCircles.id,
      userId: membersCircles.userId,
      name: users.name,
    }).from(membersCircles)
      .innerJoin(users, eq(membersCircles.userId, users.id))
      .where(eq(membersCircles.circleId, id));

    const contributionRows = await db.select().from(contributions)
      .where(eq(contributions.cycleId, cycle.id));

    const contribs = memberRows.map((m) => {
      const c = contributionRows.find((cr) => cr.memberCircleId === m.memberId);
      return {
        member_id: m.memberId,
        member_name: m.name,
        amount_kobo: c?.amountKobo ?? 0,
        status: c ? (c.status === "reconciled" || c.status === "fully_applied" ? "paid" : "pending") : "pending",
        paid_at: c?.reconciledAt ?? undefined,
      };
    });

    return success({
      id: cycle.id,
      circle_id: cycle.circleId,
      recipient_member_id: cycle.recipientMemberId,
      cycle_number: cycle.cycleNumber,
      expected_total_kobo: cycle.expectedTotalKobo,
      actual_total_kobo: cycle.actualTotalKobo,
      status: cycle.status,
      starts_at: cycle.startsAt,
      deadline_at: cycle.deadlineAt,
      closed_at: cycle.closedAt,
      contributions: contribs,
    });
  } catch (e) {
    return error((e as Error).message);
  }
}
