import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a Nigerian phone number to +234XXXXXXXXXX format.
 *
 * Accepted inputs:
 *   "+234 803 455 4544"  → +2348034554544
 *   "08124495387"        → +2348124495387
 *   "2348034554544"      → +2348034554544
 *   "+2348034554544"     → +2348034554544 (pass-through)
 */
export function normalizePhone(phone: string): string {
  // Strip everything except digits and leading +.
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Local format "08124495387" → add +234 prefix.
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "+234" + cleaned.slice(1);
  }
  // Bare "234..." (no +) → add +.
  if (cleaned.startsWith("234") && !cleaned.startsWith("+234")) {
    cleaned = `+${cleaned}`;
  }
  // Bare 10-digit number like "8129546723" → prepend +234.
  if (/^\d{10}$/.test(cleaned)) {
    cleaned = `+234${cleaned}`;
  }

  return cleaned;
}

// Regex for the final normalised format.
export const phoneRegex = /^\+234\d{10}$/;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Phone number: normalises then validates. */
export const phoneSchema = z.object({
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((v) => phoneRegex.test(v), {
      message: "Enter a valid Nigerian phone number (+234...)",
    }),
});

/** 6-digit OTP (split across 2 groups of 3). */
export const otpSchema = z.object({
  otp: z.string().length(4, "OTP must be 4 digits"),
});

/** Password: min 8 characters. */
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

/** 4-digit PIN for quick-login. */
export const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
});

/** Full sign-up payload (phone + OTP + password + name + email). */
export const signupSchema = phoneSchema
  .merge(otpSchema)
  .merge(passwordSchema)
  .extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    bvn: z
      .string()
      .length(11, "BVN must be 11 digits")
      .regex(/^\d{11}$/, "BVN must contain only numbers")
      .optional(),
  });

/** Login payload (phone + password, OTP optional when re-authing with PIN). */
export const loginSchema = phoneSchema.merge(passwordSchema).extend({
  otp: z.string().length(4, "OTP must be 4 digits").optional(),
});

/** Circle creation. */
export const createCircleSchema = z.object({
  name: z.string().min(2, "Circle name must be at least 2 characters"),
  contribution_amount: z
    .number()
    .min(100, "Minimum contribution is ₦100")
    .max(10_000_000),
  frequency: z.enum(["weekly", "monthly"]),
  cycle_count: z.number().min(2).max(100),
  default_resolution_rule: z
    .enum(["absorb", "shrink", "end_early"])
    .default("absorb"),
});

/** Joining via invite code. */
export const joinCircleSchema = z.object({
  invite_code: z.string().min(1, "Invite code is required"),
});

/** Bank withdrawal. */
export const withdrawSchema = z.object({
  amount_kobo: z.number().min(100, "Minimum withdrawal is ₦100"),
  bank_code: z.string().min(1, "Select a bank"),
  account_number: z
    .string()
    .length(10, "Account number must be 10 digits")
    .regex(/^\d{10}$/),
});

/** Manual contribution record. */
export const contributionSchema = z.object({
  cycle_id: z.string().uuid(),
  amount_kobo: z.number().min(1),
});
