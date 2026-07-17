import { success } from "@/lib/api-response";
import { clearAuthCookie } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const res = success({ message: "Logged out" });
  clearAuthCookie(res);
  return res;
}
