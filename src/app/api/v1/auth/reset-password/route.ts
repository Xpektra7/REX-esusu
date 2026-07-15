import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { error, success } from "@/lib/api-response";
import { findUserByEmail, hashPassword } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return error("Email, OTP, and newPassword are required");
    }
    if (newPassword.length < 8) {
      return error("New password must be at least 8 characters", "01", 422);
    }

    const user = await findUserByEmail(email);
    if (!user) return error("Invalid or expired OTP");

    if (!(await verifyOtp(email, otp))) return error("Invalid or expired OTP");

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash, loginAttempts: 0, lockedUntil: null })
      .where(eq(users.id, user.id));

    return success({}, "Password reset successfully");
  } catch (e) {
    return error((e as Error).message);
  }
}
