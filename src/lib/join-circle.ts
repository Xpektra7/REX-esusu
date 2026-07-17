import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  circles,
  inviteCodes,
  membersCircles,
  notifications,
  users,
} from "@/db/schema";

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
 *
 * The entire join is wrapped in a serializable transaction with FOR UPDATE
 * locks to prevent TOCTOU races on capacity checks.
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

  // Atomically check capacity and create membership in one transaction
  const result = await db.transaction(async (tx) => {
    // Lock the circle row to serialize concurrent joins
    const [lockedCircle] = await tx
      .select()
      .from(circles)
      .where(eq(circles.id, circle.id))
      .for("update");

    if (!lockedCircle) {
      throw new JoinError("Circle not found", "04", 404);
    }

    if (lockedCircle.capacityEnabled && lockedCircle.maxMembers != null) {
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(membersCircles)
        .where(
          and(
            eq(membersCircles.circleId, circle.id),
            eq(membersCircles.status, "active"),
          ),
        )
        .for("update");

      if (count >= lockedCircle.maxMembers) {
        throw new JoinError("This circle is at full capacity");
      }
    }

    const [existing] = await tx
      .select()
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, circle.id),
          eq(membersCircles.userId, userId),
        ),
      )
      .limit(1)
      .for("update");

    const ordered = await tx
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
      await tx
        .update(membersCircles)
        .set({
          status: "active",
          role: "member",
          rotationOrder,
          joinedAtCycle: lockedCircle.currentCycle,
          leftAt: null,
        })
        .where(eq(membersCircles.id, existing.id));
    } else {
      await tx.insert(membersCircles).values({
        userId,
        circleId: lockedCircle.id,
        role: "member",
        status: "active",
        rotationOrder,
        joinedAtCycle: lockedCircle.currentCycle,
      });
    }

    await tx
      .update(inviteCodes)
      .set({ useCount: invite.useCount + 1 })
      .where(eq(inviteCodes.id, invite.id));

    return {
      circleId: lockedCircle.id,
      circleName: lockedCircle.name,
      rotationOrder,
    };
  });

  // Notify the joiner and the circle's admins (non-fatal — a notification
  // failure must not roll back the join itself).
  try {
    const [joiner] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const joinerName = joiner?.name ?? "A member";

    const admins = await db
      .select({ userId: membersCircles.userId })
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, circle.id),
          eq(membersCircles.role, "admin"),
        ),
      );

    const notifs: (typeof notifications.$inferInsert)[] = [
      {
        userId,
        title: "You joined a circle",
        body: `You're now a member of ${circle.name}.`,
        type: "circle_joined",
        data: { circleId: circle.id },
      },
    ];
    for (const admin of admins) {
      if (admin.userId === userId) continue;
      notifs.push({
        userId: admin.userId,
        title: "New member joined",
        body: `${joinerName} joined ${circle.name}.`,
        type: "circle_joined",
        data: { circleId: circle.id },
      });
    }
    if (notifs.length) await db.insert(notifications).values(notifs);
  } catch (nErr) {
    console.error("[performJoin] failed to send join notifications:", nErr);
  }

  return result;
}
