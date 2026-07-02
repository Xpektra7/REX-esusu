import type {
  ApiResponse,
  CircleListItem,
  CircleDetail,
  CycleContribution,
} from "@/types";
import { useAuthStore } from "@/stores/auth-store";

const mockMembers = [
  {
    id: "cm_mock_001",
    user_id: "user_mock_001",
    role: "admin",
    status: "active",
    rotation_order: 1,
    missed_cycles: 0,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_001",
      name: "Chioma Okafor",
      phone: "+2348012345678",
      email: "chioma@example.com",
      trust_score: 85,
      bvn_last4: "1234",
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "cm_mock_002",
    user_id: "user_mock_002",
    role: "member",
    status: "invited",
    rotation_order: 2,
    missed_cycles: 0,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_002",
      name: "Emeka Nwosu",
      phone: "+2348123456789",
      email: "emeka@example.com",
      trust_score: 72,
      bvn_last4: "5678",
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "cm_mock_003",
    user_id: "user_mock_003",
    role: "member",
    status: "active",
    rotation_order: 3,
    missed_cycles: 0,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_003",
      name: "Aisha Bello",
      phone: "+2348034567890",
      email: "aisha@example.com",
      trust_score: 91,
      bvn_last4: "9012",
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "cm_mock_004",
    user_id: "user_mock_004",
    role: "member",
    status: "completed",
    rotation_order: 4,
    missed_cycles: 1,
    joined_at: "2025-01-20T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_004",
      name: "Tunde Balogun",
      phone: "+2348055555555",
      email: "tunde@example.com",
      trust_score: 45,
      bvn_last4: "3456",
      created_at: "",
      updated_at: "",
    },
  },
  {
    id: "cm_mock_005",
    user_id: "user_mock_005",
    role: "member",
    status: "defaulted",
    rotation_order: 5,
    missed_cycles: 3,
    joined_at: "2025-01-15T00:00:00Z",
    left_at: null,
    user: {
      id: "user_mock_005",
      name: "Funke Adeyemi",
      phone: "+2348166666666",
      email: "funke@example.com",
      trust_score: 28,
      bvn_last4: "7890",
      created_at: "",
      updated_at: "",
    },
  },
];

const BASE_URL = "/api/v1";

// Mock mode — when true, returns fake data so the UI works without a backend.
// Call setMockMode(false) once the real API is ready.
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
      data: { expires_in_seconds: 300 } as T,
    };
  }

  if (path === "/auth/verify" && method === "POST") {
    // Accept any OTP (len >= 4) + password (len >= 8). Returns tokens + user.
    return {
      code: "00",
      description: "Verification successful",
      data: {
        token: fakeToken(),
        refresh_token: fakeToken(),
        user: {
          id: "user_mock_001",
          phone: body.phone || "+2348012345678",
          name: body.name || "Chioma Okafor",
          email: body.email || "chioma@example.com",
        },
        needs_bvn: true,
        pin_set: false,
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
    // Accept any 4-digit PIN in mock mode
    return { code: "00", description: "PIN verified", data: {} as T };
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
      data: [
        {
          id: "circle_mock_001",
          name: "Weekend Travelers",
          status: "active",
          contribution_amount: 500000,
          frequency: "weekly",
          type: "Rotating Savings Group",
          current_cycle: 4,
          cycle_count: 12,
          member_position: 3,
          total_members: 10,
        },
        {
          id: "circle_mock_002",
          name: "Rent Savers",
          status: "active",
          contribution_amount: 2500000,
          frequency: "monthly",
          type: "Annual Contribution",
          current_cycle: 2,
          cycle_count: 10,
          member_position: 1,
          total_members: 5,
        },
      ] as T,
    };
  }

  if (path === "/circles" && method === "POST") {
    const body = options.body ? JSON.parse(options.body as string) : {};
    return {
      code: "00",
      description: "Circle created",
      data: { id: "circle_mock_001", invite_code: "ESUSU-XYZ", ...body } as T,
    };
  }

  // Check specific paths BEFORE the generic /circles/{id} catch-all
  if (path.endsWith("/report") && method === "GET") {
    const circleId = path.split("/")[2];
    return {
      code: "00",
      description: "OK",
      data: {
        total_contributions_kobo: 5000000,
        total_payouts_kobo: 4500000,
        default_rate: 2.5,
        members: 8,
        cycles: [
          {
            cycle_number: 1,
            status: "paid_out",
            total_kobo: 5000000,
            completed_at: "2025-02-15T00:00:00Z",
          },
          {
            cycle_number: 2,
            status: "paid_out",
            total_kobo: 4900000,
            completed_at: "2025-03-15T00:00:00Z",
          },
          {
            cycle_number: 3,
            status: "active",
            total_kobo: 4500000,
            completed_at: null,
          },
        ],
        debts: [
          {
            member_name: "Funke Adeyemi",
            amount_kobo: 500000,
            cycle: 3,
            status: "active",
          },
          {
            member_name: "Tunde Balogun",
            amount_kobo: 250000,
            cycle: 2,
            status: "cleared",
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
        invite_code: "ESUSU-XYZ",
        link: "https://esusu.app/join/ESUSU-XYZ",
      } as T,
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
        creator_id: "user_mock_001",
        name: "Weekend Travelers",
        contribution_amount: 500000,
        frequency: "weekly",
        cycle_period_days: 7,
        cycle_count: 12,
        current_cycle: 4,
        default_resolution_rule: "absorb",
        grace_period_hours: 24,
        status: "active",
        created_at: "2025-01-15T00:00:00Z",
        updated_at: new Date().toISOString(),
        invite_code: "ESUSU-XYZ",
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
        circle_id: cycleByCircleMatch[1],
        recipient_member_id:
          cycleNum <= 3 ? mockMembers[cycleNum - 1]?.user_id : "user_mock_001",
        cycle_number: cycleNum,
        expected_total_kobo: 5000000,
        actual_total_kobo: cycleNum <= 2 ? 5000000 : 4500000,
        status:
          cycleNum <= 2 ? "paid_out" : cycleNum === 3 ? "active" : "pending",
        starts_at: new Date(
          Date.now() - (12 - cycleNum) * 7 * 86400000,
        ).toISOString(),
        deadline_at: new Date(
          Date.now() + (cycleNum - 3) * 7 * 86400000,
        ).toISOString(),
        closed_at:
          cycleNum <= 2
            ? new Date(
                Date.now() - (12 - cycleNum) * 7 * 86400000 + 86400000,
              ).toISOString()
            : null,
        contributions: [
          {
            member_id: "user_mock_001",
            member_name: "Chioma Okafor",
            amount_kobo: 500000,
            status: "paid" as const,
            paid_at: new Date(
              Date.now() - (12 - cycleNum) * 7 * 86400000,
            ).toISOString(),
          },
          {
            member_id: "user_mock_002",
            member_name: "Emeka Nwosu",
            amount_kobo: 500000,
            status: "paid" as const,
            paid_at: new Date(
              Date.now() - (12 - cycleNum) * 7 * 86400000,
            ).toISOString(),
          },
          {
            member_id: "user_mock_003",
            member_name: "Aisha Bello",
            amount_kobo: 500000,
            status: "paid" as const,
            paid_at: new Date(
              Date.now() - (12 - cycleNum) * 7 * 86400000,
            ).toISOString(),
          },
          {
            member_id: "user_mock_004",
            member_name: "Tunde Balogun",
            amount_kobo: 500000,
            status: cycleNum >= 4 ? ("defaulted" as const) : ("paid" as const),
            paid_at:
              cycleNum < 4
                ? new Date(
                    Date.now() - (12 - cycleNum) * 7 * 86400000,
                  ).toISOString()
                : undefined,
          },
          {
            member_id: "user_mock_005",
            member_name: "Funke Adeyemi",
            amount_kobo: 500000,
            status: cycleNum >= 2 ? ("defaulted" as const) : ("paid" as const),
            paid_at:
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
        circle_id: "circle_mock_001",
        recipient_member_id: "user_mock_002",
        cycle_number: 1,
        expected_total_kobo: 4000000,
        actual_total_kobo: 3800000,
        status: "active",
        starts_at: new Date().toISOString(),
        deadline_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        closed_at: null,
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
        balance: 45000000,
        transactions: [
          {
            type: "credit",
            amount: 5000000,
            description: "Received Payout — Weekend Travelers",
            date: new Date().toISOString(),
          },
          {
            type: "debit",
            amount: 2500000,
            description: "Contribution — Rent Savers",
            date: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            type: "credit",
            amount: 1500000,
            description: "Top-up via Wema Bank",
            date: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
          {
            type: "debit",
            amount: 750000,
            description: "Withdrawal to GTBank",
            date: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
        ],
      } as unknown as T,
    };
  }

  if (path === "/wallet/transactions" && method === "GET") {
    return { code: "00", description: "OK", data: [] as T };
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
          read_at: null,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "notif_002",
          title: "Contribution Due",
          body: "Your ₦25,000 contribution to Rent Savers is due tomorrow.",
          read_at: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: "notif_003",
          title: "Member Joined",
          body: "Tunde Balogun has joined Weekend Travelers.",
          read_at: null,
          created_at: new Date(Date.now() - 604800000).toISOString(),
        },
        {
          id: "notif_004",
          title: "Circle Completed",
          body: "Weekly Savers has completed all 12 cycles. Congratulations!",
          read_at: new Date(Date.now() - 1209600000).toISOString(),
          created_at: new Date(Date.now() - 1209600000).toISOString(),
        },
      ] as T,
    };
  }

  if (path.includes("/read") && (method === "PATCH" || method === "POST")) {
    return { code: "00", description: "Marked as read", data: {} as T };
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
        trust_score: 85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T,
    };
  }

  if (path === "/users/me" && method === "PATCH") {
    return { code: "00", description: "Updated", data: {} as T };
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

  // Fallback: unknown route
  throw new Error(`[mock] No handler for ${method} ${path}`);
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
    headers["Authorization"] = `Bearer ${accessToken}`;
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
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (refreshRes.ok) {
      const refreshJson = await refreshRes.json();
      const newToken = refreshJson.data?.token;
      if (newToken) {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) { useAuthStore.getState().clearAuth(); throw new Error("Session expired"); }
        useAuthStore.getState().setAuth({
          access_token: newToken,
          refresh_token: refreshToken,
          user: currentUser,
          needs_bvn: useAuthStore.getState().needsBvn,
          pin_set: useAuthStore.getState().pinSet,
        });
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    } else {
      useAuthStore.getState().clearAuth();
    }
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
      request<{ expires_in_seconds: number }>("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      }),

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
      request<{}>("/auth/set-pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      }),

    /** Verifies the 4-digit PIN server-side. */
    verifyPin: (pin: string) =>
      request<{}>("/auth/verify-pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      }),

    /** Logs out the current session. */
    logout: () => request<{}>("/auth/logout", { method: "POST" }),

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
  },

  circles: {
    /** Lists all circles the current user belongs to. */
    list: () => request<unknown[]>("/circles"),

    /** Gets a single circle by ID. */
    get: (id: string) => request<unknown>(`/circles/${id}`),

    /** Creates a new circle. Returns the circle ID + invite code. */
    create: (payload: {
      name: string;
      contribution_amount: number;
      frequency: string;
      cycle_count: number;
    }) =>
      request<{ id: string; invite_code: string }>("/circles", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /** Activates a pending circle so members can start contributing. */
    activate: (id: string) =>
      request<{}>(`/circles/${id}/activate`, { method: "POST" }),

    /** Joins a circle using an invite code. */
    join: (id: string, inviteCode: string) =>
      request<{}>(`/circles/${id}/join`, {
        method: "POST",
        body: JSON.stringify({ invite_code: inviteCode }),
      }),

    /** Leaves a circle (only possible if no outstanding debts). */
    leave: (id: string) =>
      request<{}>(`/circles/${id}/leave`, { method: "POST" }),

    /** Generates an invite link for a circle. */
    invite: (id: string) =>
      request<{ invite_code: string; link: string }>(`/circles/${id}/invite`, {
        method: "POST",
      }),

    /** Returns a report on circle health, contributions, and defaults. */
    report: (id: string) => request<unknown>(`/circles/${id}/report`),
  },

  cycles: {
    /** Gets cycle details including recipient and status. */
    get: (id: string) => request<unknown>(`/cycles/${id}`),

    /** Gets cycle by circle ID + cycle number. Returns cycle + member contributions. */
    getByCircleAndNumber: (circleId: string, cycleNum: number) =>
      request<{
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
        contributions: import("@/types").CycleContribution[];
      }>(`/circles/${circleId}/cycles/${cycleNum}`),

    /** Manually closes a cycle (admin only). */
    close: (id: string) =>
      request<{}>(`/cycles/${id}/close`, { method: "POST" }),
  },

  contributions: {
    /** Initiates a contribution (generates a payment reference). */
    initiate: (payload: { cycle_id: string; amount_kobo: number }) =>
      request<{ ref: string }>("/contributions/initiate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    /** Confirms a contribution after payment is received. */
    confirm: (ref: string) =>
      request<{}>("/contributions/confirm", {
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
    get: () => request<{ balance: number; transactions: unknown[] }>("/wallet"),

    /** Full transaction history. */
    transactions: () => request<unknown[]>("/wallet/transactions"),

    /** Withdraws funds to a bank account. */
    withdraw: (payload: {
      amount_kobo: number;
      bank_code: string;
      account_number: string;
    }) =>
      request<{ ref: string }>("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  notifications: {
    /** Lists all notifications for the current user. */
    list: () => request<unknown[]>("/notifications"),

    /** Marks a single notification as read. */
    markRead: (id: string) =>
      request<{}>(`/notifications/${id}/read`, { method: "PATCH" }),

    /** Marks all notifications as read. */
    markAllRead: () =>
      request<{}>("/notifications/read-all", { method: "POST" }),
  },

  users: {
    /** Gets the current user's profile. */
    me: () => request<unknown>("/users/me"),

    /** Updates name / email. */
    update: (payload: { name?: string; email?: string }) =>
      request<{}>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },

  referrals: {
    /** Gets the user's referral code and referred users. */
    list: () => request<{ code: string; referred: unknown[] }>("/referrals"),
  },

  debts: {
    /** Lists debts the user owes and is owed. */
    list: () => request<{ outgoing: unknown[]; incoming: unknown[] }>("/debts"),

    /** Pays a specific debt. */
    pay: (id: string) => request<{}>(`/debts/${id}/pay`, { method: "POST" }),
  },
};
