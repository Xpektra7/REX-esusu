import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { cycles, membersCircles, users } from "@/db/schema";
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

    const cycleRows = await db
      .select({
        id: cycles.id,
        cycleNumber: cycles.cycleNumber,
        status: cycles.status,
        expectedTotalKobo: cycles.expectedTotalKobo,
        actualTotalKobo: cycles.actualTotalKobo,
        startsAt: cycles.startsAt,
        deadlineAt: cycles.deadlineAt,
        closedAt: cycles.closedAt,
        recipientName: users.name,
      })
      .from(cycles)
      .innerJoin(
        membersCircles,
        eq(cycles.recipientMemberId, membersCircles.id),
      )
      .innerJoin(users, eq(membersCircles.userId, users.id))
      .where(eq(cycles.circleId, id))
      .orderBy(cycles.cycleNumber);

    return success({
      cycles: cycleRows.map((c) => ({
        cycleNumber: c.cycleNumber,
        recipient: { name: c.recipientName },
        status: c.status,
        expectedKobo: c.expectedTotalKobo,
        actualKobo: c.actualTotalKobo,
        startsAt: c.startsAt,
        deadlineAt: c.deadlineAt,
        closedAt: c.closedAt,
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
