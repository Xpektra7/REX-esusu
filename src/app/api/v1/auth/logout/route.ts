import { success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  return success({ message: "Logged out" });
}
