import type { NextRequest } from "next/server";
import { error, success } from "@/lib/api-response";
import { findUserByEmail, verifyPassword } from "@/lib/auth";
import { generateOtp, sendOtpEmail, storeOtp } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { sendOtpSchema } from "@/lib/validations";

const otpLimiter = rateLimit({ windowMs: 60_000, maxRequests: 3 });

export async function POST(req: NextRequest) {
  try {
    const body = sendOtpSchema.safeParse(await req.json());
    if (!body.success) return error(body.error.issues[0].message, "02");
    const { email, password } = body.data;

    const limit = otpLimiter.check(`send-otp:${email}`);
    if (!limit.allowed) {
      return error("Too many requests. Try again later.", "06", 429);
    }

    const existing = await findUserByEmail(email);

    if (existing && password) {
      const valid = await verifyPassword(password, existing.passwordHash);
      if (!valid) return error("Invalid password");
    }

    const otp = generateOtp();
    await storeOtp(email, otp);
    await sendOtpEmail(email, otp);

    return success({ expiresInSeconds: 300, isNewUser: !existing });
  } catch (e) {
    console.error(e);
    return error("An unexpected error occurred", "01", 500);
  }
}
