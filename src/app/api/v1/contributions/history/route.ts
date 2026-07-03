import { and, desc, eq, inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles, contributions, cycles, membersCircles } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const circleId = searchParams.get("circle_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const userMemberships = await db
      .select()
      .from(membersCircles)
      .where(eq(membersCircles.userId, auth.user?.userId));

    if (userMemberships.length === 0)
      return success({
        contributions: [],
        pagination: { cursor: null, hasMore: false },
      });

    const memberCircleIds = userMemberships.map((m) => m.id);

    const conditions = [inArray(contributions.memberCircleId, memberCircleIds)];
    if (circleId) {
      const circleCycles = await db
        .select({ id: cycles.id })
        .from(cycles)
        .where(eq(cycles.circleId, circleId));
      const cycleIds = circleCycles.map((c) => c.id);
      if (cycleIds.length > 0) {
        conditions.push(inArray(contributions.cycleId, cycleIds));
      }
    }

    const rows = await db
      .select({
        id: contributions.id,
        amountKobo: contributions.amountKobo,
        appliedKobo: contributions.appliedKobo,
        status: contributions.status,
        ourReference: contributions.ourReference,
        createdAt: contributions.createdAt,
        cycleNumber: cycles.cycleNumber,
        circleName: circles.name,
        circleId: circles.id,
      })
      .from(contributions)
      .innerJoin(cycles, eq(contributions.cycleId, cycles.id))
      .innerJoin(circles, eq(cycles.circleId, circles.id))
      .where(and(...conditions))
      .orderBy(desc(contributions.createdAt))
      .limit(limit + 1)
      .offset((page - 1) * limit);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return success({
      contributions: items.map((r) => ({
        circleName: r.circleName,
        cycleNumber: r.cycleNumber,
        amountKobo: r.amountKobo,
        status: r.status,
        ourReference: r.ourReference,
        date: r.createdAt,
      })),
      pagination: {
        cursor: hasMore ? `page=${page + 1}` : null,
        hasMore,
      },
    });
  } catch (e) {
    return error((e as Error).message);
  }
}
