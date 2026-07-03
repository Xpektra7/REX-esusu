import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { inviteCodes, membersCircles } from "@/db/schema";
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
    const [membership] = await db
      .select()
      .from(membersCircles)
      .where(
        and(
          eq(membersCircles.circleId, id),
          eq(membersCircles.userId, auth.user?.userId),
        ),
      )
      .limit(1);
    if (!membership || membership.role !== "admin")
      return error("Only admins can invite");

    const [code] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.circleId, id))
      .limit(1);

    return success({
      inviteCode: code?.code ?? "N/A",
      link: `/circles/${id}/join?code=${code?.code}`,
    });
  } catch (e) {
    return error((e as Error).message);
  }
}
