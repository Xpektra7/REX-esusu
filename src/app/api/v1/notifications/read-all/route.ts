import { NextRequest } from "next/server";
import { success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  return success({ message: "All marked as read" });
}
