import { and, eq, gte, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import {
  circles,
  contributions,
  cycles,
  membersCircles,
  virtualAccounts,
  walletTransactions,
} from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { rateLimit } from "@/lib/rate-limit";
import { contributionSchema } from "@/lib/validations";

const contributeLimiter = rateLimit({ windowMs: 60_000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limit = contributeLimiter.check(`contribute:${auth.user?.userId}`);
  if (!limit.allowed) {
    return error("Too many contribution attempts. Try again later.", "06", 429);
  }

  try {
    const body = contributionSchema.safeParse(await req.json());
    if (!body.success) return error(body.error.issues[0].message, "02");
    const { circleId, cycleNumber, amountKobo } = body.data;

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

    // Wrap all financial mutations in a single transaction so a server crash
    // cannot leave the wallet debited but the cycle total not updated.
    const result = await db.transaction(async (tx) => {
      const [va] = await tx
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
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const timestamp = Date.now().toString(36);
      const ourReference = `CONTRIB_${circleId.slice(0, 8)}_${cycleNumber}_${auth.user?.userId.slice(0, 8)}_${timestamp}`;

      const [contribution] = await tx
        .insert(contributions)
        .values({
          memberCircleId: membership.id,
          cycleId: currentCycle.id,
          virtualAccountId: va.id,
          amountKobo,
          appliedKobo: amountKobo,
          status: "fully_applied",
          ourReference,
          reconciledAt: new Date(),
        })
        .returning();

      // Issue 5 fix: update the cycle's actualTotalKobo so manual wallet
      // contributions are reflected in the same way webhook payments are.
      await tx
        .update(cycles)
        .set({ actualTotalKobo: sql`actual_total_kobo + ${amountKobo}` })
        .where(eq(cycles.id, currentCycle.id));

      await tx
        .insert(walletTransactions)
        .values({
          userId: auth.user?.userId,
          type: "contribution",
          amountKobo,
          reference: ourReference,
          status: "success",
          metadata: {
            circleId,
            cycleId: currentCycle.id,
            contributionId: contribution.id,
          },
        })
        .onConflictDoNothing();

      return { ourReference, amountKobo };
    });

    return success(result, "Contribution recorded");
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_BALANCE") {
      return error("Insufficient balance. Top up your VA first.", "07");
    }
    return handleApiError(e);
  }
}
