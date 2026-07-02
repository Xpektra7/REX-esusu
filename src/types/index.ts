export interface User {
  id: string;
  phone: string;
  email: string;
  name: string;
  bvn_last4: string;
  trust_score: number;
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  creator_id: string;
  name: string;
  contribution_amount: number;
  frequency: "weekly" | "monthly";
  cycle_period_days: number;
  cycle_count: number;
  current_cycle: number;
  default_resolution_rule: "absorb" | "shrink" | "end_early";
  grace_period_hours: number;
  status: "pending" | "active" | "completed" | "dissolved";
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  id: string;
  user_id: string;
  circle_id: string;
  role: "admin" | "member";
  status:
    | "invited"
    | "active"
    | "defaulted"
    | "removed"
    | "left"
    | "completed";
  rotation_order: number | null;
  missed_cycles: number;
  joined_at: string;
  left_at: string | null;
  user?: User;
}

export interface VirtualAccount {
  id: string;
  user_id: string;
  circle_id: string | null;
  type: "personal" | "circle";
  account_number: string;
  account_name: string;
  bank_code: string;
  account_ref: string;
  currency: string;
  balance_kobo: number;
  expires_at: string;
  created_at: string;
}

export interface Cycle {
  id: string;
  circle_id: string;
  recipient_member_id: string;
  cycle_number: number;
  expected_total_kobo: number;
  actual_total_kobo: number;
  status: "pending" | "active" | "settling" | "paid_out" | "closed";
  starts_at: string;
  deadline_at: string;
  closed_at: string | null;
}

export interface Contribution {
  id: string;
  member_circle_id: string;
  cycle_id: string;
  virtual_account_id: string;
  amount_kobo: number;
  applied_kobo: number;
  status: "pending" | "reconciled" | "partial" | "fully_applied";
  classification:
    | "exact"
    | "underpayment"
    | "overpayment"
    | "misdirected"
    | null;
  nomba_transaction_ref: string | null;
  our_reference: string;
  created_at: string;
  reconciled_at: string | null;
}

export interface Debt {
  id: string;
  cycle_id: string;
  debtor_member_id: string;
  creditor_member_id: string;
  amount_kobo: number;
  paid_kobo: number;
  status: "active" | "cleared" | "redirected";
  created_at: string;
  cleared_at: string | null;
}

export interface Payout {
  id: string;
  cycle_id: string;
  member_id: string;
  amount_kobo: number;
  status: "pending" | "initiated" | "completed" | "failed";
  nomba_transaction_ref: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: "credit" | "debit";
  amount_kobo: number;
  reference: string;
  status: "pending" | "completed" | "failed";
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  status: "pending" | "joined" | "completed_circle";
  bonus_kobo: number | null;
  created_at: string;
}

export interface CircleListItem {
  id: string;
  name: string;
  status: "active" | "inactive" | "pending" | "completed" | "dissolved";
  contribution_amount: number;
  frequency: "weekly" | "monthly";
  type: string;
  current_cycle: number;
  cycle_count: number;
  member_position?: number;
  total_members?: number;
}

export interface CircleDetail extends Circle {
  members: CircleMember[];
  invite_code?: string;
}

export interface CycleContribution {
  member_id: string;
  member_name: string;
  amount_kobo: number;
  status: "paid" | "pending" | "defaulted";
  paid_at?: string;
}

export interface CycleDetailData {
  id: string;
  circle_id: string;
  recipient_member_id: string;
  cycle_number: number;
  expected_total_kobo: number;
  actual_total_kobo: number;
  status: string;
  starts_at: string;
  deadline_at: string;
  closed_at: string | null;
  contributions: CycleContribution[];
}

export interface ReportData {
  total_contributions_kobo: number;
  total_payouts_kobo: number;
  default_rate: number;
  members: number;
  cycles: Array<{
    cycle_number: number;
    status: string;
    total_kobo: number;
    completed_at: string | null;
  }>;
  debts: Array<{
    member_name: string;
    amount_kobo: number;
    cycle: number;
    status: string;
  }>;
}

export interface MemberItem {
  id: string;
  role: string;
  status: string;
  rotation_order?: number | null;
  missed_cycles?: number;
  user?: {
    name: string;
    phone?: string;
    trust_score?: number;
  } | null;
}

export interface CirclePageData {
  id: string;
  name: string;
  status: string;
  contribution_amount: number;
  frequency: string;
  cycle_count: number;
  current_cycle: number;
  invite_code?: string;
  cycle_period_days?: number;
  deadline_at?: string;
  members?: MemberItem[];
}

export interface ApiResponse<T> {
  code: string;
  description: string;
  data: T;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
