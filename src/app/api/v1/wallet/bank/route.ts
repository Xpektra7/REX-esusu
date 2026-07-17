import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { virtualAccounts } from "@/db/schema";
import { error, handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { nombaPost } from "@/lib/nomba";

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { bankCode, accountNumber } = await req.json();
    if (!bankCode) return error("Bank code is required");

    // Verify the bank account exists with Nomba
    if (accountNumber) {
      try {
        const lookup = await nombaPost("/v1/transfers/bank/lookup", {
          accountNumber,
          bankCode,
        });
        const accountName = lookup?.data?.accountName;
        if (!accountName) return error("Could not verify bank account number");
      } catch {
        return error(
          "Could not verify bank account. Check the account number and bank code.",
        );
      }
    }

    const [va] = await db
      .update(virtualAccounts)
      .set({ bankCode })
      .where(
        and(
          eq(virtualAccounts.userId, auth.user?.userId),
          eq(virtualAccounts.type, "personal"),
        ),
      )
      .returning();

    if (!va) return error("No virtual account found");

    return success({ bankCode: va.bankCode });
  } catch (e) {
    return handleApiError(e);
  }
}
