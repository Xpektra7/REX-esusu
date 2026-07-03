import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { circles, membersCircles, inviteCodes } from "@/db/schema";
import { eq, and, count, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  const memberships = await db.select().from(membersCircles)
    .where(eq(membersCircles.userId, auth.user!.userId));

  if (memberships.length === 0) return success({ circles: [] });

  const circleIds = memberships.map((m) => m.circleId);
  const circlesData = await db.select().from(circles).where(inArray(circles.id, circleIds));

  const memberCountRows = await db.select({
    circleId: membersCircles.circleId,
    value: count(),
  }).from(membersCircles)
    .where(and(inArray(membersCircles.circleId, circleIds), eq(membersCircles.status, "active")))
    .groupBy(membersCircles.circleId);

  const memberCountMap = new Map(memberCountRows.map((r) => [r.circleId, r.value]));

  const circlesList = circlesData.map((circle) => {
    const mc = memberships.find((m) => m.circleId === circle.id);
    return {
      id: circle.id,
      name: circle.name,
      status: circle.status,
      contributionAmount: circle.contributionAmountKobo,
      frequency: circle.frequency,
      type: "Rotating Savings Group",
      currentCycle: circle.currentCycle,
      cycleCount: circle.cycleCount,
      memberPosition: mc?.rotationOrder ?? undefined,
      totalMembers: memberCountMap.get(circle.id) ?? 0,
    };
  });
  return success({ circles: circlesList });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { name, contributionAmountKobo, frequency, cycleCount, defaultResolutionRule, gracePeriodHours } = await req.json();
    if (!name || !contributionAmountKobo || !frequency || !cycleCount) {
      return error("name, contributionAmountKobo, frequency, and cycleCount are required");
    }

    const cyclePeriodDays = frequency === "weekly" ? 7 : 30;
    const grace = gracePeriodHours || (frequency === "weekly" ? 24 : 72);
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const [circle] = await db.insert(circles).values({
      creatorId: auth.user!.userId,
      name,
      contributionAmountKobo,
      frequency,
      cyclePeriodDays,
      cycleCount,
      defaultResolutionRule: defaultResolutionRule || "absorb",
      gracePeriodHours: grace,
    }).returning();

    await db.insert(membersCircles).values({
      userId: auth.user!.userId,
      circleId: circle.id,
      role: "admin",
      status: "active",
    });

    await db.insert(inviteCodes).values({
      circleId: circle.id,
      createdBy: auth.user!.userId,
      code,
    });

    return success({
      id: circle.id,
      name: circle.name,
      inviteCode: code,
      contributionAmountKobo: circle.contributionAmountKobo,
      frequency: circle.frequency,
      cyclePeriodDays: circle.cyclePeriodDays,
      cycleCount: circle.cycleCount,
      members: 1,
      status: circle.status,
    }, "Circle created");
  } catch (e) {
    return error((e as Error).message);
  }
}
