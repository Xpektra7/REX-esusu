import { and, count, eq, ne } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { membersCircles, referrals, users, virtualAccounts } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  const userId = auth.user?.userId;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return error("User not found", "04", 404);

  const vas = await db
    .select()
    .from(virtualAccounts)
    .where(
      and(
        eq(virtualAccounts.userId, userId),
        eq(virtualAccounts.type, "personal"),
      ),
    )
    .limit(1);

  const activeCircles = await db
    .select({ count: count() })
    .from(membersCircles)
    .where(
      and(
        eq(membersCircles.userId, userId),
        eq(membersCircles.status, "active"),
      ),
    );

  const referralCount = await db
    .select({ count: count() })
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));

  return success({
    id: user.id,
    phone: user.phone ?? undefined,
    name: user.name,
    email: user.email,
    bvnLast4: user.bvnLast4,
    trustScore: user.trustScore,
    balanceKobo: vas[0]?.balanceKobo ?? 0,
    virtualAccount: vas[0]
      ? {
          accountNumber: vas[0].accountNumber,
          accountName: vas[0].accountName,
          bankName: "Nomba",
        }
      : null,
    stats: {
      activeCircles: activeCircles[0]?.count ?? 0,
      referralCount: referralCount[0]?.count ?? 0,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { name, email } = await req.json();
    if (!name && !email) return error("Nothing to update");

    const userId = auth.user?.userId;
    const updates: Record<string, string> = {};

    if (name) updates.name = name;
    if (email) {
      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, userId)))
        .limit(1);
      if (existing) return error("Email already in use", "05", 409);
      updates.email = email;
    }

    await db.update(users).set(updates).where(eq(users.id, userId));
    return success({ message: "Profile updated" });
  } catch (e) {
    return error((e as Error).message);
  }
}
