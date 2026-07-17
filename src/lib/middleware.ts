import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { unauthorized } from "./api-response";
import type { TokenPayload } from "./auth";
import { verifyToken } from "./auth";

export async function getAuthUser(
  request: Request,
): Promise<TokenPayload | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = verifyToken(auth.slice(7));
  // Old tokens (no purpose field) are valid auth tokens for backward compatibility.
  // Pin tokens (purpose: "pin_verification") must NOT authenticate API requests.
  if (!payload) return null;
  if (payload.purpose && payload.purpose !== "auth") return null;

  // Verify session version is current. Gracefully fall back if the column
  // doesn't exist yet (pre-migration dev environments).
  if (typeof payload.sessionVersion === "number") {
    try {
      const [user] = await db
        .select({ sessionVersion: users.sessionVersion })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);
      if (!user || user.sessionVersion !== payload.sessionVersion) return null;
    } catch {
      // Column doesn't exist yet — skip check
    }
  }

  return {
    userId: payload.userId,
    email: payload.email,
    sessionVersion: payload.sessionVersion,
  };
}

export async function requireAuth(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return { error: unauthorized() };
  return { user };
}

export function requirePageAuth(
  request: NextRequest,
): { userId: string; email: string } | null {
  const token = request.cookies.get("esusu-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
