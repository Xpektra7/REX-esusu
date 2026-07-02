import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { circles, cycles, membersCircles, virtualAccounts, contributions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { circleId, cycleNumber, amountKobo } = await req.json();
    if (!circleId || !cycleNumber || !amountKobo) return error("circleId, cycleNumber, and amountKobo are required");

    const [circle] = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [membership] = await db.select().from(membersCircles)
      .where(and(eq(membersCircles.circleId, circleId), eq(membersCircles.userId, auth.user!.userId), eq(membersCircles.status, "active")))
      .limit(1);
    if (!membership) return error("Not an active member of this circle", "03", 403);

    const [currentCycle] = await db.select().from(cycles)
      .where(and(eq(cycles.circleId, circleId), eq(cycles.cycleNumber, cycleNumber), eq(cycles.status, "active")))
      .limit(1);
    if (!currentCycle) return error("Cycle not found or not active", "04", 404);

    const existingContribution = await db.select().from(contributions)
      .innerJoin(membersCircles, eq(contributions.memberCircleId, membersCircles.id))
      .where(and(eq(membersCircles.userId, auth.user!.userId), eq(contributions.cycleId, currentCycle.id)))
      .limit(1);
    if (existingContribution.length > 0) {
      return error("Already contributed for this cycle", "05", 409);
    }

    const [va] = await db.select().from(virtualAccounts)
      .where(and(eq(virtualAccounts.userId, auth.user!.userId), eq(virtualAccounts.type, "personal")))
      .limit(1);

    if (!va || va.balanceKobo < amountKobo) {
      return error("Insufficient balance. Top up your VA first.", "07");
    }

    const timestamp = Date.now().toString(36);
    const ourReference = `CONTRIB_${circleId.slice(0, 8)}_${cycleNumber}_${auth.user!.userId.slice(0, 8)}_${timestamp}`;

    await db.update(virtualAccounts).set({
      balanceKobo: va.balanceKobo - amountKobo,
    }).where(eq(virtualAccounts.id, va.id));

    const [contribution] = await db.insert(contributions).values({
      memberCircleId: membership.id,
      cycleId: currentCycle.id,
      virtualAccountId: va.id,
      amountKobo,
      status: "pending",
      ourReference,
    }).returning();

    return success({
      ourReference,
      amountKobo,
      virtualAccount: {
        accountNumber: va.accountNumber,
        accountName: va.accountName,
        bankCode: va.bankCode || "Nomba",
      },
      instructions: `Transfer ₦${(amountKobo / 100).toLocaleString()} to the account above. Include the reference in narration.`,
    }, "Contribution initiated");
  } catch (e) {
    return error((e as Error).message);
  }
}
