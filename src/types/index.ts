export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  bvnLast4: string;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Circle {
  id: string;
  creatorId: string;
  name: string;
  contributionAmount: number;
  frequency: "weekly" | "monthly";
  cyclePeriodDays: number;
  cycleCount: number;
  currentCycle: number;
  defaultResolutionRule: "absorb" | "shrink" | "end_early";
  gracePeriodHours: number;
  allowMidCycleJoin: boolean;
  capacityEnabled: boolean;
  maxMembers: number | null;
  status: "pending" | "active" | "completed" | "dissolved";
  createdAt: string;
  updatedAt: string;
}

export interface CircleMember {
  id: string;
  userId: string;
  circleId: string;
  role: "admin" | "member";
  status: "invited" | "active" | "defaulted" | "removed" | "left" | "completed";
  rotationOrder: number | null;
  missedCycles: number;
  joinedAt: string;
  leftAt: string | null;
  user?: User;
}

export interface VirtualAccount {
  id: string;
  userId: string;
  circleId: string | null;
  type: "personal" | "circle";
  accountNumber: string;
  accountName: string;
  bankCode: string;
  accountRef: string;
  currency: string;
  balanceKobo: number;
  expiresAt: string;
  createdAt: string;
}

export interface Cycle {
  id: string;
  circleId: string;
  recipientMemberId: string;
  cycleNumber: number;
  expectedTotalKobo: number;
  actualTotalKobo: number;
  status: "pending" | "active" | "settling" | "paid_out" | "closed";
  startsAt: string;
  deadlineAt: string;
  closedAt: string | null;
}

export interface Contribution {
  id: string;
  memberCircleId: string;
  cycleId: string;
  virtualAccountId: string;
  amountKobo: number;
  appliedKobo: number;
  status: "pending" | "reconciled" | "partial" | "fully_applied";
  classification:
    | "exact"
    | "underpayment"
    | "overpayment"
    | "misdirected"
    | null;
  nombaTransactionRef: string | null;
  ourReference: string;
  createdAt: string;
  reconciledAt: string | null;
}

export interface Debt {
  id: string;
  cycleId: string;
  debtorMemberId: string;
  creditorMemberId: string;
  amountKobo: number;
  paidKobo: number;
  fineKobo: number;
  status: "active" | "cleared" | "redirected";
  createdAt: string;
  clearedAt: string | null;
}

export interface Payout {
  id: string;
  cycleId: string;
  memberId: string;
  amountKobo: number;
  status: "pending" | "initiated" | "completed" | "failed";
  nombaTransactionRef: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amountKobo: number;
  reference: string;
  status: "pending" | "completed" | "failed";
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  status: "pending" | "joined" | "completed_circle";
  bonusKobo: number | null;
  createdAt: string;
}

export interface CircleListItem {
  id: string;
  name: string;
  status: "active" | "inactive" | "pending" | "completed" | "dissolved";
  contributionAmount: number;
  frequency: "weekly" | "monthly";
  type: string;
  currentCycle: number;
  cycleCount: number;
  memberPosition?: number;
  totalMembers?: number;
  debtAmountKobo?: number;
}

export interface CircleDetail extends Circle {
  members: CircleMember[];
  inviteCode?: string;
}

export interface CycleContribution {
  memberId: string;
  memberName: string;
  amountKobo: number;
  status: "paid" | "pending" | "defaulted";
  paidAt?: string;
}

export interface CycleDetailData {
  id: string;
  circleId: string;
  recipientMemberId: string;
  cycleNumber: number;
  expectedTotalKobo: number;
  actualTotalKobo: number;
  status: string;
  startsAt: string;
  deadlineAt: string;
  closedAt: string | null;
  contributions: CycleContribution[];
}

export interface ReportData {
  totalContributionsKobo: number;
  totalPayoutsKobo: number;
  defaultRate: number;
  members: number;
  cycles: Array<{
    cycleNumber: number;
    status: string;
    totalKobo: number;
    completedAt: string | null;
  }>;
  debts: Array<{
    memberName: string;
    amountKobo: number;
    cycle: number;
    status: string;
    createdAt: string;
  }>;
}

export interface MemberItem {
  id: string;
  role: string;
  status: string;
  rotationOrder?: number | null;
  missedCycles?: number;
  user?: {
    name: string;
    phone?: string;
    trustScore?: number;
  } | null;
}

export interface CirclePageData {
  id: string;
  name: string;
  status: string;
  contributionAmount: number;
  frequency: string;
  cycleCount: number;
  currentCycle: number;
  gracePeriodHours: number;
  allowMidCycleJoin: boolean;
  capacityEnabled: boolean;
  maxMembers: number | null;
  inviteCode?: string;
  cyclePeriodDays?: number;
  deadlineAt?: string;
  members?: MemberItem[];
}

export interface ApiResponse<T> {
  code: string;
  description: string;
  data: T;
}

export interface ActivityItem {
  id: string;
  type: "contribution" | "payout" | "circle_join" | "circle_create" | "topup";
  description: string;
  amountKobo?: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSettings {
  autoPay: boolean;
  pushEnabled: boolean;
  reminder24h: boolean;
  reminder6h: boolean;
  reminderDeadline: boolean;
  reminderGraceExpiry: boolean;
  notifyPaymentReceived: boolean;
  notifyDebtCleared: boolean;
  notifyCycleReminders: boolean;
  notifyPayout: boolean;
  notifyDefaultAlert: boolean;
  notifyCircleInvite: boolean;
  notifyTrustScore: boolean;
  notifyWithdrawal: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bvnLast4: string;
  trustScore: number;
}
