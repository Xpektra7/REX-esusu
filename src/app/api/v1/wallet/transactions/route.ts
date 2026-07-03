import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";
import { db } from "@/db";
import { walletTransactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const rows = await db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, auth.user!.userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, auth.user!.userId));

    return success({
      transactions: rows.map((t) => ({
        id: t.id,
        type: t.type,
        amountKobo: t.amountKobo,
        reference: t.reference,
        status: t.status,
        metadata: t.metadata,
        createdAt: t.createdAt,
      })),
      pagination: { total: Number(count), limit, offset },
    });
  } catch (e) {
    return error((e as Error).message);
  }
}
