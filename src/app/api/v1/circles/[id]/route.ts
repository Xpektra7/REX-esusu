import { and, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import {
  circles,
  contributions,
  cycles,
  inviteCodes,
  membersCircles,
  users,
} from "@/db/schema";
import { error, handleApiError, notFound, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(
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
    if (!circle) return notFound("Circle not found");

    const [myMembership] = await db
      .select({ role: membersCircles.role })
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, id),
          eq(membersCircles.userId, auth.user?.userId),
        ),
      )
      .limit(1);

    const [inviteRecord] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.circleId, id))
      .limit(1);

    const [currentCycle] = await db
      .select()
      .from(cycles)
      .where(and(eq(cycles.circleId, id), eq(cycles.status, "active")))
      .limit(1);

    // Has the current user already contributed to the active cycle?
    let userContributedThisCycle = false;
    if (currentCycle) {
      const existing = await db
        .select({ id: contributions.id })
        .from(contributions)
        .innerJoin(
          membersCircles,
          eq(contributions.memberCircleId, membersCircles.id),
        )
        .where(
          and(
            eq(membersCircles.userId, auth.user?.userId),
            eq(contributions.cycleId, currentCycle.id),
          ),
        )
        .limit(1);
      userContributedThisCycle = existing.length > 0;
    }

    // Total the user has contributed across all cycles in this circle.
    const [totalContributedRow] = await db
      .select({
        sum: sql<number>`coalesce(sum(${contributions.amountKobo}), 0)`,
      })
      .from(contributions)
      .innerJoin(
        membersCircles,
        eq(contributions.memberCircleId, membersCircles.id),
      )
      .where(
        and(
          eq(membersCircles.userId, auth.user?.userId),
          eq(membersCircles.circleId, id),
        ),
      );

    const rows = await db
      .select({
        id: membersCircles.id,
        userId: membersCircles.userId,
        name: users.name,
        phone: users.phone,
        role: membersCircles.role,
        status: membersCircles.status,
        trustScore: users.trustScore,
        missedCycles: membersCircles.missedCycles,
        rotationOrder: membersCircles.rotationOrder,
      })
      .from(membersCircles)
      .innerJoin(users, eq(users.id, membersCircles.userId))
      .where(eq(membersCircles.circleId, id));

    const members = rows.map((r) => ({
      id: r.id,
      role: r.role,
      status: r.status,
      rotationOrder: r.rotationOrder,
      missedCycles: r.missedCycles,
      user: {
        name: r.name,
        phone: r.phone ?? undefined,
        trustScore: r.trustScore,
      },
    }));

    return success({
      id: circle.id,
      name: circle.name,
      status: circle.status,
      role: myMembership?.role ?? null,
      contributionAmount: circle.contributionAmountKobo,
      frequency: circle.frequency,
      cycleCount: circle.cycleCount,
      currentCycle: circle.currentCycle,
      currentCycleId: currentCycle?.id ?? null,
      inviteCode: inviteRecord?.code,
      cyclePeriodDays: circle.cyclePeriodDays,
      deadlineAt: currentCycle?.deadlineAt?.toISOString(),
      userContributedThisCycle,
      totalContributedKobo: Number(totalContributedRow?.sum) || 0,
      gracePeriodHours: circle.gracePeriodHours,
      members,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

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
    if (!circle) return notFound("Circle not found");

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
      return error("Only admin can update circle", "03", 403);

    const {
      name,
      defaultResolutionRule,
      gracePeriodHours,
      allowMidCycleJoin,
      capacityEnabled,
    } = await req.json();
    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (defaultResolutionRule)
      updates.defaultResolutionRule = defaultResolutionRule;
    if (gracePeriodHours) updates.gracePeriodHours = gracePeriodHours;
    if (typeof allowMidCycleJoin === "boolean")
      updates.allowMidCycleJoin = allowMidCycleJoin;
    if (typeof capacityEnabled === "boolean")
      updates.capacityEnabled = capacityEnabled;

    if (circle.currentCycle > 0) {
      if (name) delete updates.name;
    }

    if (Object.keys(updates).length === 0) return error("Nothing to update");
    await db.update(circles).set(updates).where(eq(circles.id, id));

    return success({ message: "Circle updated" });
  } catch (e) {
    return handleApiError(e);
  }
}
