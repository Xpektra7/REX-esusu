import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { contributions, membersCircles } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { ourReference } = await req.json();
    if (!ourReference) return error("ourReference is required");

    const [contribution] = await db
      .select({
        id: contributions.id,
        memberCircleId: contributions.memberCircleId,
        status: contributions.status,
      })
      .from(contributions)
      .where(eq(contributions.ourReference, ourReference))
      .limit(1);
    if (!contribution) return error("Contribution not found", "04", 404);

    const [mc] = await db
      .select()
      .from(membersCircles)
      .where(eq(membersCircles.id, contribution.memberCircleId))
      .limit(1);
    if (!mc || mc.userId !== auth.user?.userId)
      return error("Not your contribution", "03", 403);

    if (contribution.status !== "pending") {
      return error(`Contribution already ${contribution.status}`, "05", 409);
    }

    await db
      .update(contributions)
      .set({
        status: "pending_reconciliation",
      })
      .where(eq(contributions.id, contribution.id));

    return success(
      { status: "pending_reconciliation" },
      "Awaiting confirmation. Funds will reflect shortly.",
    );
  } catch (e) {
    return error((e as Error).message);
  }
}
