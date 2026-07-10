import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { circles } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import {
  JoinError,
  performJoin,
  resolveCircleFromCode,
} from "@/lib/join-circle";
import { requireAuth } from "@/lib/middleware";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { inviteCode } = await req.json();

    const resolved = await resolveCircleFromCode(inviteCode);
    if (!resolved) return error("Invalid invite code", "05", 404);
    if (resolved.circle.id !== id) {
      return error("Invite code does not belong to this circle", "05", 409);
    }

    const [circle] = await db
      .select()
      .from(circles)
      .where(eq(circles.id, id))
      .limit(1);
    if (!circle) return error("Circle not found", "04", 404);

    const result = await performJoin(
      auth.user?.userId,
      resolved.circle,
      resolved.invite,
    );
    return success(result, "Joined circle");
  } catch (e) {
    if (e instanceof JoinError) return error(e.message, e.code, e.status);
    return handleApiError(e);
  }
}
