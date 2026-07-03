const WHITELIST: Array<{ phone: string; otp: string }> = JSON.parse(process.env.OTP_WHITELIST || "[]");

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getFixedOtp(phone: string): string | null {
  const entry = WHITELIST.find((w) => w.phone === phone);
  return entry ? entry.otp : null;
}

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export function storeOtp(phone: string, otp: string): void {
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
}

export function verifyOtp(phone: string, otp: string): boolean {
  const fixed = getFixedOtp(phone);
  if (fixed) return fixed === otp;

  if (process.env.NODE_ENV === "development" && otp === "9999") return true;

  const entry = otpStore.get(phone);
  if (!entry || Date.now() > entry.expiresAt) return false;
  if (entry.otp !== otp) return false;
  otpStore.delete(phone);
  return true;
}
