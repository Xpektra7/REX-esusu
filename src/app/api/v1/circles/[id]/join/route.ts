import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { circles, membersCircles, inviteCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { inviteCode } = await req.json();
    const [circle] = await db.select().from(circles).where(eq(circles.id, id)).limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const [code] = await db.select().from(inviteCodes)
      .where(and(eq(inviteCodes.circleId, id), eq(inviteCodes.code, inviteCode)))
      .limit(1);
    if (!code) return error("Invalid invite code");

    const existing = await db.select().from(membersCircles)
      .where(and(eq(membersCircles.userId, auth.user!.userId), eq(membersCircles.circleId, id)))
      .limit(1);
    if (existing.length > 0) return error("Already a member of this circle", "05", 409);

    const memberCount = await db.select().from(membersCircles)
      .where(eq(membersCircles.circleId, id));
    const rotationOrder = memberCount.length + 1;

    await db.insert(membersCircles).values({
      userId: auth.user!.userId,
      circleId: id,
      role: "member",
      status: "active",
      rotationOrder,
    });

    await db.update(inviteCodes).set({ useCount: code.useCount + 1 }).where(eq(inviteCodes.id, code.id));

    return success({ circleId: id, circleName: circle.name, rotationOrder });
  } catch (e) {
    return error((e as Error).message);
  }
}