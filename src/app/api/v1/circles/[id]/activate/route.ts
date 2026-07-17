import { and, count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles, cycles, membersCircles, users } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    if (circle.status !== "pending")
      return error("Circle already active or completed");

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
    if (!membership || membership.role !== "admin")
      return error("Only admin can activate circle", "03", 403);

    const [memberCount] = await db
      .select({ count: count() })
      .from(membersCircles)
      .where(eq(membersCircles.circleId, id));
    if (Number(memberCount.count) < 2)
      return error("Need at least 2 members to activate circle");

    // Assign rotation order to members if not already set
    const members = await db
      .select({
        id: membersCircles.id,
        userId: membersCircles.userId,
        circleId: membersCircles.circleId,
        role: membersCircles.role,
        status: membersCircles.status,
        rotationOrder: membersCircles.rotationOrder,
        missedCycles: membersCircles.missedCycles,
        joinedAt: membersCircles.joinedAt,
        leftAt: membersCircles.leftAt,
        name: users.name,
      })
      .from(membersCircles)
      .innerJoin(users, eq(users.id, membersCircles.userId))
      .where(eq(membersCircles.circleId, id))
      .orderBy(membersCircles.joinedAt);

    const cycle = await db.transaction(async (tx) => {
      for (let i = 0; i < members.length; i++) {
        if (!members[i].rotationOrder) {
          await tx
            .update(membersCircles)
            .set({ rotationOrder: i + 1 })
            .where(eq(membersCircles.id, members[i].id));
        }
      }

      const [c] = await tx
        .insert(cycles)
        .values({
          circleId: id,
          recipientMemberId: members[0].id,
          cycleNumber: 1,
          expectedTotalKobo:
            circle.contributionAmountKobo * Number(memberCount.count),
          actualTotalKobo: 0,
          status: "active",
          startsAt: new Date(),
          deadlineAt: new Date(
            Date.now() + circle.cyclePeriodDays * 24 * 60 * 60 * 1000,
          ),
        })
        .returning();

      await tx
        .update(circles)
        .set({
          status: "active",
          currentCycle: 1,
        })
        .where(eq(circles.id, id));

      return c;
    });

    return success(
      {
        circleId: id,
        cycleNumber: 1,
        recipientId: members[0].id,
        recipientName: members[0].name,
        startsAt: cycle.startsAt,
        deadlineAt: cycle.deadlineAt,
      },
      "Circle activated successfully",
    );
  } catch (e) {
    return handleApiError(e);
  }
}
