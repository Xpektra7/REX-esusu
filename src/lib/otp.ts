import { and, eq, gte, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!resend) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }
  await resend.emails.send({
    from: "Esusu <onboarding@resend.dev>",
    to: email,
    subject: "Your Esusu verification code",
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p>`,
  });
}

export async function storeOtp(email: string, otp: string): Promise<void> {
  await db.insert(otpCodes).values({
    email,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const [entry] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.otp, otp),
        gte(otpCodes.expiresAt, new Date()),
        isNull(otpCodes.verifiedAt),
      ),
    )
    .orderBy(otpCodes.createdAt)
    .limit(1);

  if (!entry) return false;

  await db
    .update(otpCodes)
    .set({ verifiedAt: new Date() })
    .where(eq(otpCodes.id, entry.id));
  return true;
}
