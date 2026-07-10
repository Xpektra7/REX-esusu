import { and, eq, gte, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import {
  circles,
  contributions,
  cycles,
  membersCircles,
  virtualAccounts,
} from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { circleId, cycleNumber, amountKobo } = await req.json();
    if (!circleId || !cycleNumber || !amountKobo)
      return error("circleId, cycleNumber, and amountKobo are required");

    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, circleId))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [membership] = await db
      .select()
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, circleId),
          eq(membersCircles.userId, auth.user?.userId),
          eq(membersCircles.status, "active"),
        ),
      )
      .limit(1);
    if (!membership)
      return error("Not an active member of this circle", "03", 403);

    const [currentCycle] = await db
      .select()
      .from(cycles)
      .where(
        and(
          eq(cycles.circleId, circleId),
          eq(cycles.cycleNumber, cycleNumber),
          eq(cycles.status, "active"),
        ),
      )
      .limit(1);
    if (!currentCycle) return error("Cycle not found or not active", "04", 404);

    const existingContribution = await db
      .select()
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
    if (existingContribution.length > 0) {
      return error("Already contributed for this cycle", "05", 409);
    }

    // Atomic balance deduction — check-and-decrement in one SQL statement
    const [va] = await db
      .update(virtualAccounts)
      .set({ balanceKobo: sql`balance_kobo - ${amountKobo}` })
      .where(
        and(
          eq(virtualAccounts.userId, auth.user?.userId),
          eq(virtualAccounts.type, "personal"),
          gte(virtualAccounts.balanceKobo, amountKobo),
        ),
      )
      .returning();

    if (!va) {
      return error("Insufficient balance. Top up your VA first.", "07");
    }

    const timestamp = Date.now().toString(36);
    const ourReference = `CONTRIB_${circleId.slice(0, 8)}_${cycleNumber}_${auth.user?.userId.slice(0, 8)}_${timestamp}`;

    const [_contribution] = await db
      .insert(contributions)
      .values({
        memberCircleId: membership.id,
        cycleId: currentCycle.id,
        virtualAccountId: va.id,
        amountKobo,
        status: "pending",
        ourReference,
      })
      .returning();

    return success(
      {
        ourReference,
        amountKobo,
        virtualAccount: {
          accountNumber: va.accountNumber,
          accountName: va.accountName,
          bankCode: va.bankCode || "Nomba",
        },
        instructions: `Transfer ₦${(amountKobo / 100).toLocaleString()} to the account above. Include the reference in narration.`,
      },
      "Contribution initiated",
    );
  } catch (e) {
    return handleApiError(e);
  }
}
