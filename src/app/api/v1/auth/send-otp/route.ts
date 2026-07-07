import type { NextRequest } from "next/server";
import { error, success } from "@/lib/api-response";
import { findUserByEmail, verifyPassword } from "@/lib/auth";
import { generateOtp, sendOtpEmail, storeOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email) return error("Email is required");

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
    return error((e as Error).message);
  }
}
