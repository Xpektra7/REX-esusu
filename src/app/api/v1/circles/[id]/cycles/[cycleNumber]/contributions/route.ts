import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { circles, cycles, membersCircles, users, contributions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cycleNumber: string }> }
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id, cycleNumber } = await params;
    const cycleNum = parseInt(cycleNumber, 10);
    if (isNaN(cycleNum)) return error("Invalid cycle number");

    const [membership] = await db.select().from(membersCircles)
      .where(and(eq(membersCircles.circleId, id), eq(membersCircles.userId, auth.user!.userId)))
      .limit(1);
    if (!membership) return error("Not a member of this circle", "03", 403);

    const [circle] = await db.select().from(circles)
      .where(eq(circles.id, id))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [cycle] = await db.select().from(cycles)
      .where(and(eq(cycles.circleId, id), eq(cycles.cycleNumber, cycleNum)))
      .limit(1);
    if (!cycle) return error("Cycle not found", "04", 404);

    const contribRows = await db.select({
      id: contributions.id,
      amountKobo: contributions.amountKobo,
      appliedKobo: contributions.appliedKobo,
      status: contributions.status,
      ourReference: contributions.ourReference,
      nombaTransactionRef: contributions.nombaTransactionRef,
      createdAt: contributions.createdAt,
      memberName: users.name,
      memberId: membersCircles.userId,
      memberStatus: membersCircles.status,
    }).from(contributions)
      .innerJoin(membersCircles, eq(contributions.memberCircleId, membersCircles.id))
      .innerJoin(users, eq(membersCircles.userId, users.id))
      .where(eq(contributions.cycleId, cycle.id));

    return success({
      circleName: circle.name,
      cycleNumber: cycleNum,
      cycleStatus: cycle.status,
      expectedTotalKobo: cycle.expectedTotalKobo,
      actualTotalKobo: cycle.actualTotalKobo,
      contributions: contribRows.map((c) => ({
        memberName: c.memberName,
        amountKobo: c.amountKobo,
        appliedKobo: c.appliedKobo,
        status: c.status,
        ourReference: c.ourReference,
        nombaTransactionRef: c.nombaTransactionRef,
        date: c.createdAt,
      })),
    });
  } catch (e) {
    return error((e as Error).message);
  }
}