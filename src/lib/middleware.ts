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
