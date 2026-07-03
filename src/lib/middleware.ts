import { verifyToken } from "./auth";
import { unauthorized } from "./api-response";

export function getAuthUser(request: Request): { userId: string; phone: string } | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

export function requireAuth(request: Request) {
  const user = getAuthUser(request);
  if (!user) return { error: unauthorized() };
  return { user };
}
