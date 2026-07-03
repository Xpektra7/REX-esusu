import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles, cycles, membersCircles } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { reconcileCycle } from "@/lib/reconciliation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const [cycle] = await db
      .select()
      .from(cycles)
      .where(eq(cycles.id, id))
      .limit(1);
    if (!cycle) return error("Cycle not found", "04", 404);

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
    if (!membership || membership.role !== "admin")
      return error("Only admin can close cycles", "03", 403);

    const result = await reconcileCycle(id);

    return success(result, "Cycle closed");
  } catch (e) {
    return error((e as Error).message);
  }
}
