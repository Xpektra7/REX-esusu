import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaGet } from "@/lib/nomba";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    // Fetch bank codes and names from Nomba
    const banksResp = await nombaGet("/v1/transfers/banks");
    
    const banks = Array.isArray(banksResp?.data)
      ? banksResp.data
      : banksResp?.data?.results || [];
    return success({ banks }, "Bank codes retrieved successfully");
  } catch (e) {
    return error((e as Error).message);
  }
}