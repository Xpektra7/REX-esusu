import type { NextRequest } from "next/server";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaPost } from "@/lib/nomba";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return error("accountNumber and bankCode are required");
    }

    const result = await nombaPost("/v1/transfers/bank/lookup", {
      accountNumber,
      bankCode,
    });

    return success({ accountName: result?.data?.accountName ?? "" });
  } catch (e) {
    return handleApiError(e);
  }
}
