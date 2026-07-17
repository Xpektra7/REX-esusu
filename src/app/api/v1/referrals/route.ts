import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { referrals, users } from "@/db/schema";
import { handleApiError, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  const userId = auth.user.userId;

  try {
    const [me] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const firstName = (me?.name ?? "").split(" ")[0].replace(/[^a-zA-Z]/g, "");
    const code = `${firstName.toUpperCase() || "ESUSU"}${userId.slice(0, 4).toUpperCase()}`;

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

    const referred = rows.map((r) => ({
      name: r.name,
      phone: r.phone,
      status: r.status,
      bonusKobo: r.bonusKobo,
      joinedAt: r.createdAt,
    }));

    const totalReferred = rows.length;
    const pendingCount = rows.filter((r) => r.status === "pending").length;
    const totalEarnedKobo = rows
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + r.bonusKobo, 0);

    return success({
      code,
      totalReferred,
      pendingCount,
      totalEarnedKobo,
      referred,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
