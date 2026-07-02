import { NextRequest } from "next/server";
import { success, error, notFound } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { circles, membersCircles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
    if (!circle) return notFound("Circle not found");

    const members = await db.select({
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

    return success({
      id: circle.id,
      name: circle.name,
      contributionAmountKobo: circle.contributionAmountKobo,
      frequency: circle.frequency,
      cycleCount: circle.cycleCount,
      currentCycle: circle.currentCycle,
      defaultResolutionRule: circle.defaultResolutionRule,
      gracePeriodHours: circle.gracePeriodHours,
      status: circle.status,
      members,
      createdAt: circle.createdAt,
    });
  } catch (e) {
    return error((e as Error).message);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
    if (!circle) return notFound("Circle not found");

    const [membership] = await db.select().from(membersCircles)
      .where(and(eq(membersCircles.circleId, id), eq(membersCircles.userId, auth.user!.userId)))
      .limit(1);
    if (!membership || membership.role !== "admin") return error("Only admin can update circle", "03", 403);

    const { name, defaultResolutionRule, gracePeriodHours } = await req.json();
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (defaultResolutionRule) updates.defaultResolutionRule = defaultResolutionRule;
    if (gracePeriodHours) updates.gracePeriodHours = gracePeriodHours;

    if (circle.currentCycle > 0) {
      if (name) delete updates.name;
    }

    if (Object.keys(updates).length === 0) return error("Nothing to update");
    await db.update(circles).set(updates).where(eq(circles.id, id));

    return success({ message: "Circle updated" });
  } catch (e) {
    return error((e as Error).message);
  }
}