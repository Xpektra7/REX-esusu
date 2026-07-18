export const LOCALE = "en-NG" as const;
export const CURRENCY = "NGN" as const;

export const FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export const RESOLUTION_RULES = ["absorb", "shrink", "end_early"] as const;
export const CYCLE_STATUSES = [
  "pending",
  "active",
  "settling",
  "paid_out",
  "closed",
] as const;
export const PAYOUT_STATUSES = [
  "pending",
  "initiated",
  "completed",
  "failed",
] as const;
export const TRANSACTION_TYPES = ["credit", "debit"] as const;
export const CLASSIFICATIONS = [
  "exact",
  "underpayment",
  "overpayment",
  "misdirected",
] as const;
export const CONTRIBUTION_DISPLAY_STATUSES = [
  "paid",
  "pending",
  "defaulted",
] as const;

export const VIRTUAL_ACCOUNT_TYPE_PERSONAL = "personal" as const;

export const UI = {
  locale: LOCALE,
  currency: CURRENCY,
} as const;

export const API = {
  base: "/api/v1",
} as const;
