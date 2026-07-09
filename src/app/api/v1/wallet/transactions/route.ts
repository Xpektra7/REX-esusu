import { desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { walletTransactions } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50", 10),
      100,
    );
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const rows = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, auth.user?.userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, auth.user?.userId));

    const CREDIT_TYPES = new Set([
      "topup",
      "debt_payment",
      "cycle_payment",
      "refund",
    ]);

    const deriveDescription = (type: string): string => {
      switch (type) {
        case "topup":
          return "Wallet Top-Up";
        case "withdrawal":
          return "Withdrawal";
        case "debt_payment":
          return "Debt Payment";
        case "cycle_payment":
          return "Cycle Payout";
        case "refund":
          return "Refund";
        default:
          return "Transaction";
      }
    };

    return success({
      transactions: rows.map((t) => ({
        id: t.id,
        type: CREDIT_TYPES.has(t.type) ? "credit" : "debit",
        amountKobo: t.amountKobo,
        reference: t.reference,
        status: t.status,
        description: deriveDescription(t.type),
        metadata: t.metadata,
        createdAt: t.createdAt,
      })),
      pagination: { total: Number(count), limit, offset },
    });
  } catch (e) {
    return error((e as Error).message);
  }
}
