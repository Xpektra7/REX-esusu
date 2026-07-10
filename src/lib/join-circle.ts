import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { circles, inviteCodes, membersCircles } from "@/db/schema";

export class JoinError extends Error {
  constructor(
    message: string,
    public code = "05",
    public status = 409,
  ) {
    super(message);
    this.name = "JoinError";
  }
}

export interface JoinResult {
  circleId: string;
  circleName: string;
  rotationOrder: number;
}

type CircleRow = typeof circles.$inferSelect;
type InviteRow = typeof inviteCodes.$inferSelect;

/**
 * Resolves an invite code to its linked circle. Returns null when the code
 * does not exist (or its circle was deleted). This is the key that binds a
 * code-only join request to a specific circle.
 */
export async function resolveCircleFromCode(rawCode: string): Promise<{
  invite: InviteRow;
  circle: CircleRow;
} | null> {
  const code = rawCode.trim().toUpperCase();
  const [invite] = await db
    .select()
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code))
    .limit(1);
  if (!invite) return null;

  const [circle] = await db
    .select()
    .from(circles)
    .where(eq(circles.id, invite.circleId))
    .limit(1);
  if (!circle) return null;

  return { invite, circle };
}

/**
 * Shared membership-creation logic used by every join entry point. Validates
 * the invite code, the circle's join-safety (mid-cycle, capacity), and the
 * caller's existing relationship to the circle, then creates (or reactivates)
 * the membership with an appended rotation order.
 */
export async function performJoin(
  userId: string,
  circle: CircleRow,
  invite: InviteRow,
): Promise<JoinResult> {
  if (circle.status === "completed" || circle.status === "dissolved") {
    throw new JoinError("This circle is no longer accepting members");
  }

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    throw new JoinError("This invite code has expired");
  }
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    throw new JoinError("This invite code has reached its maximum uses");
  }

  if (circle.status === "active" && !circle.allowMidCycleJoin) {
    throw new JoinError("Joining mid-cycle is disabled for this circle");
  }

  if (circle.capacityEnabled && circle.maxMembers != null) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, circle.id),
          eq(membersCircles.status, "active"),
        ),
      );
    if (count >= circle.maxMembers) {
      throw new JoinError("This circle is at full capacity");
    }
  }

  const [existing] = await db
    .select()
    .from(membersCircles)
    .where(
      and(
        eq(membersCircles.circleId, circle.id),
        eq(membersCircles.userId, userId),
      ),
    )
    .limit(1);

  const ordered = await db
    .select({ rotationOrder: membersCircles.rotationOrder })
    .from(membersCircles)
    .where(eq(membersCircles.circleId, circle.id))
    .orderBy(membersCircles.rotationOrder);
  const rotationOrder = (ordered.at(-1)?.rotationOrder ?? ordered.length) + 1;

  if (existing) {
    if (existing.status === "active" || existing.status === "invited") {
      throw new JoinError("You are already a member of this circle");
    }
    // Rejoin after leaving/being removed: reactivate the old membership.
    await db
      .update(membersCircles)
      .set({
        status: "active",
        role: "member",
        rotationOrder,
        joinedAtCycle: circle.currentCycle,
        leftAt: null,
      })
      .where(eq(membersCircles.id, existing.id));
  } else {
    await db.insert(membersCircles).values({
      userId,
      circleId: circle.id,
      role: "member",
      status: "active",
      rotationOrder,
      joinedAtCycle: circle.currentCycle,
    });
  }

  await db
    .update(inviteCodes)
    .set({ useCount: invite.useCount + 1 })
    .where(eq(inviteCodes.id, invite.id));

  return {
    circleId: circle.id,
    circleName: circle.name,
    rotationOrder,
  };
}
