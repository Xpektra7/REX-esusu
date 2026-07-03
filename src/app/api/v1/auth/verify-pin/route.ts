import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { requireAuth } from "@/lib/middleware";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const { pin } = await req.json();
    if (!pin) return error("PIN is required");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.user?.userId))
      .limit(1);
    if (!user || !user.pinHash) return error("PIN not set");

    // Check lockout — same retry logic as password auth
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return error("Account locked. Try again later.");
    }

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      let lockedUntil: Date | null = null;
      if (attempts >= 15)
        lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      else if (attempts >= 10)
        lockedUntil = new Date(Date.now() + 60 * 60 * 1000);
      else if (attempts >= 5)
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      await db
        .update(users)
        .set({ loginAttempts: attempts, lockedUntil })
        .where(eq(users.id, auth.user?.userId));
      return error("Invalid PIN");
    }

    // Reset attempts on success
    await db
      .update(users)
      .set({ loginAttempts: 0, lockedUntil: null })
      .where(eq(users.id, auth.user?.userId));

    return success({ verified: true });
  } catch (e) {
    return error((e as Error).message);
  }
}
