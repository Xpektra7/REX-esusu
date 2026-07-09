import { and, eq, gte, isNull } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  const port = Number(process.env.SMTP_PORT) || 465;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[DEV] OTP sent to ${email}`);
    return;
  }
  await t.sendMail({
    from: `"Esusu" <${process.env.SMTP_USER}>`,
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
