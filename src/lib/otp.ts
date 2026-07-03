import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

const WHITELIST: Array<{ phone: string; otp: string }> = JSON.parse(
  process.env.OTP_WHITELIST || "[]",
);

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getFixedOtp(phone: string): string | null {
  const entry = WHITELIST.find((w) => w.phone === phone);
  return entry ? entry.otp : null;
}

export async function storeOtp(phone: string, otp: string): Promise<void> {
  await db.insert(otpCodes).values({
    phone,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const fixed = getFixedOtp(phone);
  if (fixed) return fixed === otp;

  if (process.env.NODE_ENV === "development" && otp === "9999") return true;

  const [entry] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
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
