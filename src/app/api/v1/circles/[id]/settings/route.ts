import { and, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles, membersCircles } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function PATCH(
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
      return error("Only admin can update circle settings", "03", 403);

    const body = await req.json();

    if (body.allowMidCycleJoin !== undefined) {
      await db
        .update(circles)
        .set({ allowMidCycleJoin: body.allowMidCycleJoin })
        .where(eq(circles.id, id));
    }

    // Capacity: turning joining OFF caps the circle at its current member
    // count (best-UX interpretation). Turning it ON reopens without a cap.
    if (body.capacityEnabled !== undefined) {
      if (body.capacityEnabled === true && body.maxMembers === undefined) {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(membersCircles)
          .where(
            and(
              eq(membersCircles.circleId, id),
              eq(membersCircles.status, "active"),
            ),
          );
        await db
          .update(circles)
          .set({ capacityEnabled: true, maxMembers: count })
          .where(eq(circles.id, id));
      } else {
        await db
          .update(circles)
          .set({
            capacityEnabled: body.capacityEnabled,
            maxMembers:
              body.capacityEnabled === false ? null : body.maxMembers ?? null,
          })
          .where(eq(circles.id, id));
      }
    }

    const [updated] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);

    return success(updated);
  } catch (e) {
    return error((e as Error).message);
  }
}
