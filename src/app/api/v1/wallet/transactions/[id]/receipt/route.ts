import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users, walletTransactions } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

const OUTWARD_TYPES = ["withdrawal", "contribution", "debt_payment"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const [tx] = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.id, id),
          eq(walletTransactions.userId, auth.user?.userId),
        ),
      )
      .limit(1);
    if (!tx) return error("Transaction not found", "04", 404);
    if (!OUTWARD_TYPES.includes(tx.type)) {
      return error("Receipt is only available for outward transfers");
    }

    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, auth.user?.userId))
      .limit(1);

    const metadata = (tx.metadata ?? {}) as Record<string, unknown>;

    return success(
      {
        receiptId: tx.id,
        type: tx.type,
        direction: "outward",
        status: tx.status,
        amountKobo: tx.amountKobo,
        reference: tx.reference,
        narration: metadata.narration ?? null,
        sender: {
          name: user?.name ?? null,
          email: user?.email ?? null,
        },
        recipient: {
          accountName: metadata.accountName ?? null,
          accountNumber: metadata.accountNumber ?? null,
          bankCode: metadata.bankCode ?? null,
        },
        createdAt: tx.createdAt,
      },
      "Receipt generated",
    );
  } catch (e) {
    return error((e as Error).message);
  }
}
