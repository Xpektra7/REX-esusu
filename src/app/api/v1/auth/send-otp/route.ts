import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { generateOtp, getFixedOtp, storeOtp } from "@/lib/otp";
import { findUserByPhone } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) return error("Phone is required");

    const existing = await findUserByPhone(phone);
    const otp = getFixedOtp(phone) || generateOtp();
    storeOtp(phone, otp);

    if (!getFixedOtp(phone)) {
      // In production, send OTP via email/Gmail SMTP here
      console.log(`OTP for ${phone}: ${otp}`);
    }

    return success({ expiresInSeconds: 300, isNewUser: !existing });
  } catch (e) {
    return error((e as Error).message);
  }
}
