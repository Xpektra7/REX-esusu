import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { referrals, users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;

  try {
    const rows = await db
      .select({
        name: users.name,
        phone: users.phone,
        status: referrals.status,
        bonusKobo: referrals.bonusKobo,
        createdAt: referrals.createdAt,
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referredUserId, users.id))
      .where(eq(referrals.referrerUserId, userId))
      .orderBy(desc(referrals.createdAt));

    const totalReferred = rows.length;
    const pendingCount = rows.filter((r) => r.status === "pending").length;
    const totalEarnedKobo = rows
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + r.bonusKobo, 0);

    return success({ totalReferred, pendingCount, totalEarnedKobo, referred: rows });
  } catch (e) {
    return error((e as Error).message);
  }
}