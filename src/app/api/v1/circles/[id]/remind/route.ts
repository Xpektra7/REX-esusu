import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles, membersCircles, notifications, users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
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

    const [membership] = await db
      .select()
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, id),
          eq(membersCircles.userId, auth.user.userId),
        ),
      )
      .limit(1);
    if (!membership || membership.role !== "admin") {
      return error("Only circle admin can send reminders", "03", 403);
    }

    const activeMembers = await db
      .select({
        id: membersCircles.id,
        userId: membersCircles.userId,
        name: users.name,
      })
      .from(membersCircles)
      .innerJoin(users, eq(users.id, membersCircles.userId))
      .where(
        and(
          eq(membersCircles.circleId, id),
          eq(membersCircles.status, "active"),
        ),
      );

    if (activeMembers.length === 0) {
      return error("No active members to remind");
    }

    const memberIds = activeMembers.map((m) => m.userId);

    await db.insert(notifications).values(
      activeMembers.map((m) => ({
        userId: m.userId,
        title: `Reminder: ${circle.name}`,
        body: `Please make your contribution of ₦${(circle.contributionAmountKobo / 100).toLocaleString()} for ${circle.name}. The deadline is approaching.`,
        type: "reminder",
      })),
    );

    return success({ notified: memberIds.length }, "Reminders sent");
  } catch (e) {
    return error((e as Error).message);
  }
}
