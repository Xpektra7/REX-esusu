import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { signPinToken } from "@/lib/auth";
import { requireAuth } from "@/lib/middleware";
import { rateLimit } from "@/lib/rate-limit";
import { pinSchema } from "@/lib/validations";

const pinLimiter = rateLimit({ windowMs: 60_000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = pinSchema.safeParse(await req.json());
    if (!body.success) return error(body.error.issues[0].message, "02");
    const { pin } = body.data;

    const limit = pinLimiter.check(`verify-pin:${auth.user.userId}`);
    if (!limit.allowed) {
      return error("Too many attempts. Try again later.", "06", 429);
    }

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

    const pinToken = signPinToken(auth.user.userId);

    return success({ verified: true, pinToken });
  } catch (e) {
    console.error(e);
    return error("An unexpected error occurred", "01", 500);
  }
}
