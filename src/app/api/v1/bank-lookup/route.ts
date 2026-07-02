import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaPost } from "@/lib/nomba";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { accountNumber, bankCode } = await req.json();
    
    if (!accountNumber || !bankCode) {
      return error("accountNumber and bankCode are required");
    }

    // Lookup bank account details from Nomba
    const result = await nombaPost("/v1/transfers/bank/lookup", {
      accountNumber,
      bankCode,
    });
    
    return success(result, "Bank account lookup successful");
  } catch (e) {
    return error((e as Error).message);
  }
}