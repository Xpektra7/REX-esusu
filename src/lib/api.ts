import { useAuthStore } from "@/stores/auth-store";
import type { ApiResponse, CircleListItem, CycleContribution } from "@/types";

let mockPinAttempts = 0;
const MOCK_CORRECT_PIN = "0000";

const mockMembers = [
  {
    id: "cm_mock_001",
    user_id: "user_mock_001",
    role: "admin",
    status: "active",
    rotationOrder: 1,
    missedCycles: 0,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_001",
      name: "Chioma Okafor",
      phone: "+2348012345678",
      email: "chioma@example.com",
      trustScore: 85,
      bvn_last4: "1234",
      createdAt: "",
      updatedAt: "",
    },
  },
  {
    id: "cm_mock_002",
    user_id: "user_mock_002",
    role: "member",
    status: "invited",
    rotationOrder: 2,
    missedCycles: 0,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_002",
      name: "Emeka Nwosu",
      phone: "+2348123456789",
      email: "emeka@example.com",
      trustScore: 72,
      bvn_last4: "5678",
      createdAt: "",
      updatedAt: "",
    },
  },
  {
    id: "cm_mock_003",
    user_id: "user_mock_003",
    role: "member",
    status: "active",
    rotationOrder: 3,
    missedCycles: 0,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_003",
      name: "Aisha Bello",
      phone: "+2348034567890",
      email: "aisha@example.com",
      trustScore: 91,
      bvn_last4: "9012",
      createdAt: "",
      updatedAt: "",
    },
  },
  {
    id: "cm_mock_004",
    user_id: "user_mock_004",
    role: "member",
    status: "completed",
    rotationOrder: 4,
    missedCycles: 1,
    joined_at: "2025-01-20T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_004",
      name: "Tunde Balogun",
      phone: "+2348055555555",
      email: "tunde@example.com",
      trustScore: 45,
      bvn_last4: "3456",
      createdAt: "",
      updatedAt: "",
    },
  },
  {
    id: "cm_mock_005",
    user_id: "user_mock_005",
    role: "member",
    status: "defaulted",
    rotationOrder: 5,
    missedCycles: 3,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_005",
      name: "Funke Adeyemi",
      phone: "+2348166666666",
      email: "funke@example.com",
      trustScore: 28,
      bvn_last4: "7890",
      createdAt: "",
      updatedAt: "",
    },
  },
];

const BASE_URL = "/api/v1";

// Mock mode — when true, returns fake data so the UI works without a backend.
let mockMode = false;

export function setMockMode(enabled: boolean) {
  mockMode = enabled;
}

/** Fake delay to simulate network latency. */
function delay(ms = 600): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Generates a plausible fake token that looks like a JWT.
 * Used only in mock mode so auth flows can test redirects/layouts.
 */
function fakeToken(): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "user_mock_001",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  );
  return `${header}.${payload}.fake_signature_for_mock`;
}

/**
 * Routes a mock request and returns a fake response.
 * Each case matches a path + method pattern used elsewhere in this file.
 */
async function mockRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  await delay();

  // --- Auth endpoints ---
  if (path === "/auth/send-otp" && method === "POST") {
    // Every phone number gets an OTP — no validation on our side
    return {
      code: "00",
      description: "OTP sent successfully",
      data: { expires_in_seconds: 300, isNewUser: false } as T,
    };
  }

  if (path === "/auth/verify" && method === "POST") {
    // Accept any OTP (len >= 4) + password (len >= 8). Returns tokens + user.
    // If name+email provided → signup (needs onboarding). Otherwise → login (onboarding done).
    const isSignup = !!body.name && !!body.email;
    return {
      code: "00",
      description: "Verification successful",
      data: {
        token: fakeToken(),
        refreshToken: fakeToken(),
        user: {
          id: "user_mock_001",
          phone: body.phone || "+2348012345678",
          name: body.name || "Chioma Okafor",
          email: body.email || "chioma@example.com",
        },
        needsBvn: isSignup,
        pinSet: !isSignup,
      } as T,
    };
  }

  if (path === "/auth/verify-bvn" && method === "POST") {
    // Mock: any 11-digit BVN passes
    const isValid = /^\d{11}$/.test(body.bvn);
    if (!isValid) {
      return {
        code: "02",
        description: "Invalid BVN",
        data: null as T,
      };
    }
    return {
      code: "00",
      description: "BVN verified",
      data: { verified: true, name: "Chioma Okafor", dob: "15-03-1990" } as T,
    };
  }

  if (path === "/auth/set-pin" && method === "POST") {
    return { code: "00", description: "PIN set", data: {} as T };
  }

  if (path === "/auth/verify-pin" && method === "POST") {
    if (body.pin !== MOCK_CORRECT_PIN) {
      mockPinAttempts++;
      if (mockPinAttempts >= 3) {
        throw new Error("Too many failed attempts");
      }
      throw new Error("Wrong PIN");
    }
    return { code: "00", description: "PIN verified", data: { verified: true } as T };
  }

  if (path === "/auth/logout" && method === "POST") {
    return { code: "00", description: "Logged out", data: {} as T };
  }

  if (path === "/auth/refresh" && method === "POST") {
    return {
      code: "00",
      description: "Token refreshed",
      data: { token: fakeToken() } as T,
    };
  }

  // --- Circles ---
  if (path === "/circles" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        circles: [
          {
            id: "circle_mock_001",
            name: "Weekend Travelers",
            status: "active",
            contributionAmount: 500000,
            frequency: "weekly",
            type: "Rotating Savings Group",
            currentCycle: 4,
            cycleCount: 12,
            memberPosition: 3,
            totalMembers: 10,
          },
          {
            id: "circle_mock_002",
            name: "Rent Savers",
            status: "active",
            contributionAmount: 2500000,
            frequency: "monthly",
            type: "Annual Contribution",
            currentCycle: 2,
            cycleCount: 10,
            memberPosition: 1,
            totalMembers: 5,
          },
        ],
      } as T,
    };
  }

  if (path === "/circles" && method === "POST") {
    const body = options.body ? JSON.parse(options.body as string) : {};
    return {
      code: "00",
      description: "Circle created",
      data: { id: "circle_mock_001", inviteCode: "ESUSU-XYZ", ...body } as T,
    };
  }

  // Check specific paths BEFORE the generic /circles/{id} catch-all
  if (path.endsWith("/report") && method === "GET") {
    const _circleId = path.split("/")[2];
    return {
      code: "00",
      description: "OK",
      data: {
        totalContributionsKobo: 5000000,
        totalPayoutsKobo: 4500000,
        defaultRate: 2.5,
        members: 8,
        cycles: [
          {
            cycleNumber: 1,
            status: "paid_out",
            totalKobo: 5000000,
            completedAt: "2025-02-15T00:00:00Z",
          },
          {
            cycleNumber: 2,
            status: "paid_out",
            totalKobo: 4900000,
            completedAt: "2025-03-15T00:00:00Z",
          },
          {
            cycleNumber: 3,
            status: "active",
            totalKobo: 4500000,
            completedAt: null,
          },
        ],
        debts: [
          {
            memberName: "Funke Adeyemi",
            amountKobo: 500000,
            cycle: 3,
            status: "active",
            createdAt: "2025-02-10T00:00:00Z",
          },
          {
            memberName: "Tunde Balogun",
            amountKobo: 250000,
            cycle: 2,
            status: "cleared",
            createdAt: "2025-01-20T00:00:00Z",
          },
        ],
      } as T,
    };
  }

  if (path.endsWith("/activate") && method === "POST") {
    return { code: "00", description: "Circle activated", data: {} as T };
  }

  if (path.endsWith("/join") && method === "POST") {
    return { code: "00", description: "Joined circle", data: {} as T };
  }

  if (path.endsWith("/leave") && method === "POST") {
    return { code: "00", description: "Left circle", data: {} as T };
  }

  if (path.endsWith("/invite") && method === "POST") {
    return {
      code: "00",
      description: "Invite generated",
      data: {
        inviteCode: "ESUSU-XYZ",
        link: "https://esusu.app/join/ESUSU-XYZ",
      } as T,
    };
  }

  if (path.endsWith("/remind") && method === "POST") {
    return {
      code: "00",
      description: "Reminders sent to pending members",
      data: { notified: 2 } as T,
    };
  }

  // Circle settings — matches /circles/{id}/settings
  const settingsMatch = path.match(/^\/circles\/([^/]+)\/settings$/);
  if (settingsMatch && method === "PATCH") {
    return {
      code: "00",
      description: "Settings updated",
      data: {} as T,
    };
  }

  // Circle detail with members — matches /circles/{id} but NOT /circles/{id}/cycles/{num}
  const circlesDetailMatch = path.match(/^\/circles\/([^/]+)$/);
  if (circlesDetailMatch && method === "GET") {
    const circleId = circlesDetailMatch[1];
    return {
      code: "00",
      description: "OK",
      data: {
        id: circleId,
        creatorId: "user_mock_001",
        name: "Weekend Travelers",
        contributionAmount: 500000,
        frequency: "weekly",
        cyclePeriodDays: 7,
        cycleCount: 12,
        currentCycle: 4,
        defaultResolutionRule: "absorb",
        gracePeriodHours: 24,
        allowMidCycleJoin: false,
        status: "active",
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: new Date().toISOString(),
        inviteCode: "ESUSU-XYZ",
        members: mockMembers,
      } as T,
    };
  }

  // Cycle by circle + number — matches /circles/{id}/cycles/{num}
  const cycleByCircleMatch = path.match(/^\/circles\/([^/]+)\/cycles\/(\d+)$/);
  if (cycleByCircleMatch && method === "GET") {
    const cycleNum = parseInt(cycleByCircleMatch[2], 10);
    return {
      code: "00",
      description: "OK",
      data: {
        id: `cycle_mock_00${cycleNum}`,
        circleId: cycleByCircleMatch[1],
        recipientMemberId:
          cycleNum <= 3 ? mockMembers[cycleNum - 1]?.user_id : "user_mock_001",
        cycleNumber: cycleNum,
        expectedTotalKobo: 5000000,
        actualTotalKobo: cycleNum <= 2 ? 5000000 : 4500000,
        status:
          cycleNum <= 2 ? "paid_out" : cycleNum === 3 ? "active" : "pending",
        startsAt: new Date(
          Date.now() - (12 - cycleNum) * 7 * 86400000,
        ).toISOString(),
        deadlineAt: new Date(
          Date.now() + (cycleNum - 3) * 7 * 86400000,
        ).toISOString(),
        closedAt:
          cycleNum <= 2
            ? new Date(
                Date.now() - (12 - cycleNum) * 7 * 86400000 + 86400000,
              ).toISOString()
            : null,
        contributions: [
          {
            memberId: "user_mock_001",
            memberName: "Chioma Okafor",
            amountKobo: 500000,
            status: "paid" as const,
            paidAt: new Date(
              Date.now() - (12 - cycleNum) * 7 * 86400000,
            ).toISOString(),
          },
          {
            memberId: "user_mock_002",
            memberName: "Emeka Nwosu",
            amountKobo: 500000,
            status: "paid" as const,
            paidAt: new Date(
              Date.now() - (12 - cycleNum) * 7 * 86400000,
            ).toISOString(),
          },
          {
            memberId: "user_mock_003",
            memberName: "Aisha Bello",
            amountKobo: 500000,
            status: "paid" as const,
            paidAt: new Date(
              Date.now() - (12 - cycleNum) * 7 * 86400000,
            ).toISOString(),
          },
          {
            memberId: "user_mock_004",
            memberName: "Tunde Balogun",
            amountKobo: 500000,
            status: cycleNum >= 4 ? ("defaulted" as const) : ("paid" as const),
            paidAt:
              cycleNum < 4
                ? new Date(
                    Date.now() - (12 - cycleNum) * 7 * 86400000,
                  ).toISOString()
                : undefined,
          },
          {
            memberId: "user_mock_005",
            memberName: "Funke Adeyemi",
            amountKobo: 500000,
            status: cycleNum >= 2 ? ("defaulted" as const) : ("paid" as const),
            paidAt:
              cycleNum === 1
                ? new Date(
                    Date.now() - (12 - cycleNum) * 7 * 86400000,
                  ).toISOString()
                : undefined,
          },
        ] as CycleContribution[],
      } as T,
    };
  }

  // --- Cycles ---
  if (path.startsWith("/cycles/") && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        id: "cycle_mock_001",
        circleId: "circle_mock_001",
        recipientMemberId: "user_mock_002",
        cycleNumber: 1,
        expectedTotalKobo: 4000000,
        actualTotalKobo: 3800000,
        status: "active",
        startsAt: new Date().toISOString(),
        deadlineAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        closedAt: null,
      } as T,
    };
  }

  if (path.endsWith("/close") && method === "POST") {
    return { code: "00", description: "Cycle closed", data: {} as T };
  }

  // --- Contributions ---
  if (path === "/contributions/initiate" && method === "POST") {
    return {
      code: "00",
      description: "Initiated",
      data: { ref: `TXN${Date.now()}` } as T,
    };
  }

  if (path === "/contributions/confirm" && method === "POST") {
    return { code: "00", description: "Confirmed", data: {} as T };
  }

  if (path === "/contributions/history" && method === "GET") {
    return { code: "00", description: "OK", data: [] as T };
  }

  // --- Payouts ---
  if (path === "/payouts/history" && method === "GET") {
    return { code: "00", description: "OK", data: [] as T };
  }

  // --- Wallet ---
  if (path === "/wallet" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        balanceKobo: 45000000,
        virtualAccount: {
          accountNumber: "1234567890",
          accountName: "Chioma Okafor",
          bankCode: "Nomba",
        },
        pendingReconciliationKobo: 0,
      } as T,
    };
  }

  if (path === "/wallet/transactions" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: [
        {
          id: "tx_mock_001",
          type: "credit",
          amountKobo: 5000000,
          reference: "PAYOUT_MOCK_001",
          status: "completed",
          description: "Received Payout — Weekend Travelers",
          metadata: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "tx_mock_002",
          type: "debit",
          amountKobo: 2500000,
          reference: "CONTRIB_MOCK_001",
          status: "completed",
          description: "Contribution — Rent Savers",
          metadata: null,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "tx_mock_003",
          type: "credit",
          amountKobo: 1500000,
          reference: "TOPUP_MOCK_001",
          status: "completed",
          description: "Top-up via Wema Bank",
          metadata: null,
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: "tx_mock_004",
          type: "debit",
          amountKobo: 750000,
          reference: "WITHDRAW_MOCK_001",
          status: "completed",
          description: "Withdrawal to GTBank",
          metadata: null,
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ] as T,
    };
  }

  if (path === "/wallet/withdraw" && method === "POST") {
    return {
      code: "00",
      description: "Withdrawal initiated",
      data: { ref: `WTH${Date.now()}` } as T,
    };
  }

  // --- Notifications ---
  if (path === "/notifications" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: [
        {
          id: "notif_001",
          title: "Payout Received",
          body: "You received ₦50,000 from Weekend Travelers cycle #4.",
          type: "payout",
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "notif_002",
          title: "Contribution Due",
          body: "Your ₦25,000 contribution to Rent Savers is due tomorrow.",
          type: "contribution_due",
          read: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: "notif_003",
          title: "Member Joined",
          body: "Tunde Balogun has joined Weekend Travelers.",
          type: "member_join",
          read: false,
          createdAt: new Date(Date.now() - 604800000).toISOString(),
        },
        {
          id: "notif_004",
          title: "Circle Completed",
          body: "Weekly Savers has completed all 12 cycles. Congratulations!",
          type: "circle_completed",
          read: true,
          createdAt: new Date(Date.now() - 1209600000).toISOString(),
        },
      ] as T,
    };
  }

  if (path.includes("/read") && (method === "PATCH" || method === "POST")) {
    return { code: "00", description: "Marked as read", data: {} as T };
  }

  if (path === "/notifications/send-remind" && method === "POST") {
    return { code: "00", description: "Reminder sent", data: {} as T };
  }

  // --- Users ---
  if (path === "/users/me" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        id: "user_mock_001",
        phone: "+2348012345678",
        email: "chioma@example.com",
        name: "Chioma Okafor",
        bvn_last4: "1234",
        trustScore: 85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as T,
    };
  }

  if (path === "/users/me" && method === "PATCH") {
    return { code: "00", description: "Updated", data: {} as T };
  }

  // --- User Settings ---
  const defaultSettings = {
    autoPay: false,
    pushEnabled: true,
    reminder24h: true,
    reminder6h: true,
    reminderDeadline: true,
    reminderGraceExpiry: false,
    notifyPaymentReceived: true,
    notifyDebtCleared: true,
    notifyCycleReminders: true,
    notifyPayout: true,
    notifyDefaultAlert: true,
    notifyCircleInvite: true,
    notifyTrustScore: true,
    notifyWithdrawal: true,
  };

  if (path === "/users/settings" && method === "GET") {
    return { code: "00", description: "OK", data: defaultSettings as T };
  }

  if (path === "/users/settings" && method === "PATCH") {
    const merged = { ...defaultSettings, ...body };
    return { code: "00", description: "Settings updated", data: merged as T };
  }

  if (path === "/users/me" && method === "DELETE") {
    if (body.password !== "password123") {
      throw new Error("Password is incorrect");
    }
    return { code: "00", description: "Account deleted", data: {} as T };
  }

  if (path === "/auth/change-password" && method === "POST") {
    if (body.currentPassword === body.newPassword) {
      throw new Error("New password must be different");
    }
    if (body.currentPassword !== "OldPass1") {
      throw new Error("Current password is incorrect");
    }
    return { code: "00", description: "Password changed", data: {} as T };
  }

  if (path === "/auth/change-pin" && method === "POST") {
    if (body.currentPin !== "0000") {
      throw new Error("Current PIN is incorrect");
    }
    return { code: "00", description: "PIN changed", data: {} as T };
  }

  // --- Referrals ---
  if (path === "/referrals" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: { code: "CHIOMA", referred: [] } as T,
    };
  }

  // --- Debts ---
  if (path === "/debts" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: { outgoing: [], incoming: [] } as T,
    };
  }

  if (path.endsWith("/pay") && method === "POST") {
    return { code: "00", description: "Debt paid", data: {} as T };
  }

  if (path === "/contact" && method === "POST") {
    console.log("[contact form submission]", body);
    return {
      code: "00",
      description: "Message received. We'll get back to you shortly.",
      data: {} as T,
    };
  }

  if (path === "/activity" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        items: [
          {
            id: "act_001",
            type: "contribution",
            description: "Contributed ₦5,000 to Weekend Travelers",
            amountKobo: 500000,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "act_002",
            type: "payout",
            description: "Received ₦50,000 from Rent Savers",
            amountKobo: 5000000,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "act_003",
            type: "circle_join",
            description: "Joined Weekend Travelers circle",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: "act_004",
            type: "circle_create",
            description: "Created Rent Savers circle",
            createdAt: new Date(Date.now() - 604800000).toISOString(),
          },
          {
            id: "act_005",
            type: "topup",
            description: "Topped up wallet with ₦20,000",
            amountKobo: 2000000,
            createdAt: new Date(Date.now() - 1209600000).toISOString(),
          },
        ] as import("@/types").ActivityItem[],
      } as T,
    };
  }

  // --- Bank search ---
  if (path === "/bank-search" && method === "POST") {
    const MOCK_BANKS: { code: string; name: string; prefix: string; accountName: string }[] = [
      { code: "058", name: "GTBank", prefix: "01", accountName: "CHIOMA OKAFOR" },
      { code: "044", name: "Access Bank", prefix: "02", accountName: "CHIOMA OKAFOR" },
      { code: "011", name: "First Bank", prefix: "03", accountName: "AMARA OBI" },
      { code: "033", name: "UBA", prefix: "04", accountName: "EMEKA NWOSU" },
      { code: "057", name: "Zenith Bank", prefix: "05", accountName: "TUNDE BALOGUN" },
      { code: "035", name: "Wema Bank", prefix: "06", accountName: "FUNKE ADEYEMI" },
      { code: "214", name: "FCMB", prefix: "07", accountName: "DAVID ADELEKE" },
      { code: "232", name: "Sterling Bank", prefix: "08", accountName: "NGOZI EZE" },
      { code: "032", name: "Union Bank", prefix: "09", accountName: "CHIOMA OKAFOR" },
      { code: "070", name: "Fidelity Bank", prefix: "10", accountName: "CHIOMA OKAFOR" },
      { code: "221", name: "Stanbic IBTC", prefix: "11", accountName: "AMARA OBI" },
      { code: "502", name: "Kuda Bank", prefix: "12", accountName: "EMEKA NWOSU" },
      { code: "999", name: "OPay", prefix: "13", accountName: "TUNDE BALOGUN" },
      { code: "505", name: "Moniepoint", prefix: "14", accountName: "FUNKE ADEYEMI" },
    ];

    const { accountNumber } = body;
    if (!accountNumber || accountNumber.length !== 10) {
      return { code: "05", description: "Account number must be 10 digits", data: null as T };
    }

    const prefix = accountNumber.slice(0, 2);
    const exactMatches = MOCK_BANKS.filter((b) => b.prefix === prefix).map((b) => ({
      bankCode: b.code,
      bankName: b.name,
      accountName: b.accountName,
    }));
    const matches = exactMatches.length > 0
      ? exactMatches
      : MOCK_BANKS.slice(0, 2).map((b) => ({
          bankCode: b.code,
          bankName: b.name,
          accountName: b.accountName,
        }));

    return { code: "00", description: "OK", data: { matches } as T };
  }

  // --- Bank lookup ---
  if (path === "/bank-lookup" && method === "POST") {
    const { accountNumber, bankCode } = body;
    if (!accountNumber || !bankCode) {
      return { code: "05", description: "accountNumber and bankCode are required", data: null as T };
    }
    return {
      code: "00",
      description: "OK",
      data: { accountName: "CHIOMA OKAFOR" } as T,
    };
  }

  // --- Bank codes ---
  if (path === "/bank-codes" && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        banks: [
          { code: "058", name: "GTBank" },
          { code: "044", name: "Access Bank" },
          { code: "011", name: "First Bank" },
          { code: "033", name: "UBA" },
          { code: "057", name: "Zenith Bank" },
          { code: "035", name: "Wema Bank" },
          { code: "214", name: "FCMB" },
          { code: "232", name: "Sterling Bank" },
          { code: "032", name: "Union Bank" },
          { code: "070", name: "Fidelity Bank" },
          { code: "221", name: "Stanbic IBTC" },
          { code: "502", name: "Kuda Bank" },
          { code: "999", name: "OPay" },
          { code: "505", name: "Moniepoint" },
          { code: "068", name: "Ecobank" },
          { code: "082", name: "Keystone Bank" },
          { code: "063", name: "Heritage Bank" },
          { code: "076", name: "Polaris Bank" },
          { code: "215", name: "Unity Bank" },
        ],
      } as T,
    };
  }

  // Fallback: unknown route
  throw new Error(`[mock] No handler for ${method} ${path}`);
}

function redirectToAuth() {
  if (typeof window !== "undefined") {
    window.location.href = "/auth";
  }
}

/**
 * Core request function.
 * In mock mode it returns fake data; in live mode it calls the real API.
 * Automatically attaches the JWT from auth-store and refreshes on 401.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // Mock mode returns fake responses so the UI works end-to-end.
  if (mockMode) {
    return mockRequest<T>(path, options);
  }

  // Attach auth token from zustand store
  const { accessToken, refreshToken } = useAuthStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  // Live mode — real HTTP call.
  const url = `${BASE_URL}${path}`;
  let res = await fetch(url, {
    ...options,
    headers,
  });

  // Token expired — try refreshing
  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (refreshRes.ok) {
      const refreshJson = await refreshRes.json();
      const newToken = refreshJson.data?.accessToken ?? refreshJson.data?.token;
      if (newToken) {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          useAuthStore.getState().clearAuth();
          redirectToAuth();
          throw new Error("Session expired");
        }
        useAuthStore.getState().setAuth({
          access_token: newToken,
          refresh_token: refreshToken,
          user: currentUser,
          needs_bvn: useAuthStore.getState().needsBvn,
          pin_set: useAuthStore.getState().pinSet,
        });
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    } else {
      useAuthStore.getState().clearAuth();
      redirectToAuth();
    }
  } else if (res.status === 401) {
    useAuthStore.getState().clearAuth();
    redirectToAuth();
  }

  const json: ApiResponse<T> = await res.json();

  if (json.code !== "00") {
    throw new Error(json.description);
  }

  return json;
}

// ---------------------------------------------------------------------------
// Public API surface
// ---------------------------------------------------------------------------
export const api = {
  auth: {
    /** Sends a 6-digit OTP to the given phone number. */
    sendOtp: (phone: string) =>
      request<{ expires_in_seconds: number; isNewUser: boolean }>(
        "/auth/send-otp",
        {
          method: "POST",
          body: JSON.stringify({ phone }),
        },
      ),

    /** Verifies OTP + password, returns auth tokens + user data. */
    verify: (payload: {
      phone: string;
      otp: string;
      password: string;
      name?: string;
      email?: string;
      bvn?: string;
    }) =>
      request<{ token: string; refresh_token: string; user: unknown }>(
        "/auth/verify",
        { method: "POST", body: JSON.stringify(payload) },
      ),

    /** Sets a 4-digit PIN for quick-login. */
    setPin: (pin: string) =>
      request<Record<string, unknown>>("/auth/set-pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      }),

    /** Verifies the 4-digit PIN server-side. */
    verifyPin: (pin: string) =>
      request<Record<string, unknown>>("/auth/verify-pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      }),

    /** Logs out the current session. */
    logout: () =>
      request<Record<string, unknown>>("/auth/logout", { method: "POST" }),

    /** Refreshes the access token using a refresh token. */
    refresh: (refreshToken: string) =>
      request<{ token: string }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),

    /** Verifies a BVN via NIBSS (mocked for now). */
    verifyBvn: (bvn: string) =>
      request<{ verified: boolean; name: string; dob: string }>(
        "/auth/verify-bvn",
        { method: "POST", body: JSON.stringify({ bvn }) },
      ),

    /** Changes password (requires current password). */
    changePassword: (payload: { currentPassword: string; newPassword: string }) =>
      request<Record<string, unknown>>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /** Changes PIN (requires current PIN). */
    changePin: (payload: { currentPin: string; newPin: string }) =>
      request<Record<string, unknown>>("/auth/change-pin", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  circles: {
    /** Lists all circles the current user belongs to. */
    list: () => request<{ circles: CircleListItem[] }>("/circles"),

    /** Gets a single circle by ID. */
    get: (id: string) => request<unknown>(`/circles/${id}`),

    /** Creates a new circle. Returns the circle ID + invite code. */
    create: (payload: {
      name: string;
      contributionAmount: number;
      frequency: string;
      cycleCount: number;
    }) =>
      request<{ id: string; inviteCode: string }>("/circles", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /** Activates a pending circle so members can start contributing. */
    activate: (id: string) =>
      request<Record<string, unknown>>(`/circles/${id}/activate`, {
        method: "POST",
      }),

    /** Joins a circle using an invite code. */
    join: (id: string, inviteCode: string) =>
      request<Record<string, unknown>>(`/circles/${id}/join`, {
        method: "POST",
        body: JSON.stringify({ inviteCode: inviteCode }),
      }),

    /** Leaves a circle (only possible if no outstanding debts). */
    leave: (id: string) =>
      request<Record<string, unknown>>(`/circles/${id}/leave`, {
        method: "POST",
      }),

    /** Generates an invite link for a circle. */
    invite: (id: string) =>
      request<{ inviteCode: string; link: string }>(`/circles/${id}/invite`, {
        method: "POST",
      }),

    /** Returns a report on circle health, contributions, and defaults. */
    report: (id: string) => request<unknown>(`/circles/${id}/report`),

    /** Sends reminders to pending members. */
    remind: (id: string) =>
      request<{ notified: number }>(`/circles/${id}/remind`, {
        method: "POST",
      }),

    /** Updates circle settings. */
    updateSettings: (id: string, payload: { allowMidCycleJoin?: boolean }) =>
      request<unknown>(`/circles/${id}/settings`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },

  cycles: {
    /** Gets cycle details including recipient and status. */
    get: (id: string) => request<unknown>(`/cycles/${id}`),

    /** Gets cycle by circle ID + cycle number. Returns cycle + member contributions. */
    getByCircleAndNumber: (circleId: string, cycleNum: number) =>
      request<{
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
        contributions: import("@/types").CycleContribution[];
      }>(`/circles/${circleId}/cycles/${cycleNum}`),

    /** Manually closes a cycle (admin only). */
    close: (id: string) =>
      request<Record<string, unknown>>(`/cycles/${id}/close`, {
        method: "POST",
      }),
  },

  contributions: {
    /** Initiates a contribution (generates a payment reference). */
    initiate: (payload: { cycleId: string; amountKobo: number }) =>
      request<{ ref: string }>("/contributions/initiate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /** Confirms a contribution after payment is received. */
    confirm: (ref: string) =>
      request<Record<string, unknown>>("/contributions/confirm", {
        method: "POST",
        body: JSON.stringify({ ref }),
      }),

    /** Past contributions made by the current user. */
    history: () => request<unknown[]>("/contributions/history"),
  },

  payouts: {
    /** Past payouts received by the current user. */
    history: () => request<unknown[]>("/payouts/history"),
  },

  wallet: {
    /** Wallet balance + recent transactions. */
    get: () =>
      request<{
        balanceKobo: number;
        virtualAccount: {
          accountNumber: string;
          accountName: string;
          bankCode: string;
        };
        pendingReconciliationKobo: number;
      }>("/wallet"),

    /** Full transaction history. */
    transactions: () => request<unknown[]>("/wallet/transactions"),

    /** Withdraws funds to a bank account. */
    withdraw: (payload: {
      amountKobo: number;
      bankCode: string;
      accountNumber: string;
    }) =>
      request<{ ref: string }>("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /** Generates a payment reference for wallet top-up. */
    topup: (payload: { amountKobo: number }) =>
      request<{
        virtualAccount: {
          accountNumber: string;
          accountName: string;
          bankCode: string;
        };
        amountKobo: number;
        reference: string;
        instructions: string;
      }>("/wallet/topup", { method: "POST", body: JSON.stringify(payload) }),
  },

  notifications: {
    /** Lists all notifications for the current user. */
    list: () => request<unknown[]>("/notifications"),

    /** Marks a single notification as read. */
    markRead: (id: string) =>
      request<Record<string, unknown>>(`/notifications/${id}/read`, {
        method: "PATCH",
      }),

    /** Marks all notifications as read. */
    markAllRead: () =>
      request<Record<string, unknown>>("/notifications/read-all", {
        method: "POST",
      }),

    /** Sends a debt reminder notification to a member. */
    sendRemind: (memberName: string, amountKobo: number, cycle: number) =>
      request<Record<string, unknown>>("/notifications/send-remind", {
        method: "POST",
        body: JSON.stringify({ memberName, amountKobo, cycle }),
      }),
  },

  users: {
    /** Gets the current user's profile. */
    me: () => request<unknown>("/users/me"),

    /** Updates name / email. */
    update: (payload: { name?: string; email?: string }) =>
      request<Record<string, unknown>>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),

    /** User settings (notifications, auto-pay, etc.). */
    settings: {
      get: () => request<import("@/types").UserSettings>("/users/settings"),
      update: (payload: Partial<import("@/types").UserSettings>) =>
        request<import("@/types").UserSettings>("/users/settings", {
          method: "PATCH",
          body: JSON.stringify(payload),
        }),
    },

    /** Deletes the user's account permanently. */
    deleteAccount: (password: string) =>
      request<Record<string, unknown>>("/users/me", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      }),
  },

  contact: {
    /** Sends a contact form message. */
    send: (payload: {
      name: string;
      email: string;
      subject: string;
      message: string;
    }) =>
      request<Record<string, unknown>>("/contact", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  activity: {
    /** Recent activity feed for the dashboard. */
    list: () =>
      request<{ items: import("@/types").ActivityItem[] }>("/activity"),
  },

  bankCodes: () =>
    request<{ banks: { code: string; name: string }[] }>("/bank-codes"),

  bankLookup: (payload: { accountNumber: string; bankCode: string }) =>
    request<{ accountName: string }>("/bank-lookup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Searches for banks matching an account number. */
  bankSearch: (accountNumber: string) =>
    request<{ matches: { bankCode: string; bankName: string; accountName: string }[] }>(
      "/bank-search",
      { method: "POST", body: JSON.stringify({ accountNumber }) },
    ),

  referrals: {
    /** Gets the user's referral code and referred users. */
    list: () => request<{ code: string; referred: unknown[] }>("/referrals"),
  },

  debts: {
    /** Lists debts the user owes and is owed. */
    list: () => request<{ outgoing: unknown[]; incoming: unknown[] }>("/debts"),

    /** Pays a specific debt. */
    pay: (id: string) =>
      request<Record<string, unknown>>(`/debts/${id}/pay`, { method: "POST" }),
  },
};
