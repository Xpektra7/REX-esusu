import type { NextRequest } from "next/server";
import { error, handleApiError, success } from "@/lib/api-response";
import {
  JoinError,
  performJoin,
  resolveCircleFromCode,
} from "@/lib/join-circle";
import { requireAuth } from "@/lib/middleware";

/**
 * Code-only join entry point. A non-member only ever has an invite code, so
 * this resolves the circle from the code and joins in a single call.
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { inviteCode } = await req.json();
    if (!inviteCode || typeof inviteCode !== "string") {
      return error("Invite code is required", "02", 422);
    }

    const resolved = await resolveCircleFromCode(inviteCode);
    if (!resolved) return error("Invalid invite code", "05", 404);

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
