import type { NextRequest } from "next/server";
import { unauthorized } from "./api-response";
import { verifyToken } from "./auth";

export function getAuthUser(
  request: Request,
): { userId: string; email: string } | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

export function requireAuth(request: Request) {
  const user = getAuthUser(request);
  if (!user) return { error: unauthorized() };
  return { user };
}

/** Reads the JWT from the HttpOnly cookie (set by auth routes) for page-route protection. */
export function requirePageAuth(request: NextRequest): { userId: string; email: string } | null {
  const token = request.cookies.get("esusu-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
