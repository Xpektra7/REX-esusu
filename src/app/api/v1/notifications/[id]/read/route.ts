import type { NextRequest } from "next/server";
import { success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function PATCH(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  return success({ message: "Marked as read" });
}
