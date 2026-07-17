import { z } from "zod";

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
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
  otp: z.string().length(6, "OTP must be 6 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
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

export const sendOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().optional(),
});

export const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
  newPin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
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
  gracePeriodHours: z.number().positive().optional(),
  capacityEnabled: z.boolean().optional(),
  maxMembers: z.number().positive().optional(),
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
  pinToken: z.string().min(1, "PIN verification is required"),
});

export const contributionSchema = z.object({
  circleId: z.string().uuid("Circle ID is required"),
  cycleNumber: z
    .number()
    .int()
    .positive("Cycle number must be a positive integer"),
  amountKobo: z.number().int().min(1, "Amount must be at least 1 kobo"),
});
