import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaGet } from "@/lib/nomba";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const banks = await nombaGet("/v1/transfers/banks");
    return success(banks);
  } catch (e) {
    return error((e as Error).message);
  }
}