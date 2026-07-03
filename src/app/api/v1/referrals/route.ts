import type { NextRequest } from "next/server";
import { success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  return success({ code: "", referred: [] });
}
