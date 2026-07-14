import { z } from "zod";

export const otpSchema = z.object({
  otp: z.string().length(4, "OTP must be 4 digits"),
});

export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
});

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(4, "OTP must be 4 digits"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().min(2, "Name must be at least 2 characters"),
  bvn: z
    .string()
    .length(11, "BVN must be 11 digits")
    .regex(/^\d{11}$/, "BVN must contain only numbers")
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(4, "OTP must be 4 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const createCircleSchema = z.object({
  name: z.string().min(2, "Circle name must be at least 2 characters"),
  contributionAmount: z
    .number()
    .min(10, "Minimum contribution is ₦10")
    .max(10_000_000),
  frequency: z.enum(["weekly", "monthly"]),
  cycleCount: z.number().min(1).max(100),
  defaultResolutionRule: z
    .enum(["absorb", "shrink", "end_early"])
    .default("absorb"),
});

export const joinCircleSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export const withdrawSchema = z.object({
  amountKobo: z.number().min(10, "Minimum withdrawal is ₦10"),
  bankCode: z.string().min(1, "Select a bank"),
  accountNumber: z
    .string()
    .length(10, "Account number must be 10 digits")
    .regex(/^\d{10}$/),
});

export const contributionSchema = z.object({
  cycleId: z.string().uuid(),
  amountKobo: z.number().min(1),
});
