import type { ApiResponse } from "@/types";

const BASE_URL = "/api/v1";

// Mock mode — when true, returns fake data so the UI works without a backend.
// Call setMockMode(false) once the real API is ready.
let mockMode = true;

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
      data: [] as T,
    };
  }

  if (path === "/circles" && method === "POST") {
    return {
      code: "00",
      description: "Circle created",
      data: { id: "circle_mock_001", invite_code: "ESUSU-XYZ" } as T,
    };
  }

  if (path.startsWith("/circles/") && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        id: "circle_mock_001",
        creator_id: "user_mock_001",
        name: "My Savings Circle",
        contribution_amount: 5000,
        frequency: "weekly",
        cycle_period_days: 7,
        cycle_count: 12,
        current_cycle: 1,
        default_resolution_rule: "absorb",
        grace_period_hours: 24,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      data: { invite_code: "ESUSU-XYZ", link: "https://esusu.app/join/ESUSU-XYZ" } as T,
    };
  }

  if (path.endsWith("/report") && method === "GET") {
    return {
      code: "00",
      description: "OK",
      data: {
        total_contributions_kobo: 5000000,
        total_payouts_kobo: 4500000,
        default_rate: 2.5,
        members: 8,
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
      data: { balance: 2500000, transactions: [] } as unknown as T,
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
    return { code: "00", description: "OK", data: [] as T };
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
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  // Mock mode returns fake responses so the UI works end-to-end.
  if (mockMode) {
    return mockRequest<T>(path, options);
  }

  // Live mode — real HTTP call.
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

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
      request<{ invite_code: string; link: string }>(
        `/circles/${id}/invite`,
        { method: "POST" },
      ),

    /** Returns a report on circle health, contributions, and defaults. */
    report: (id: string) =>
      request<unknown>(`/circles/${id}/report`),
  },

  cycles: {
    /** Gets cycle details including recipient and status. */
    get: (id: string) => request<unknown>(`/cycles/${id}`),

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
    get: () =>
      request<{ balance: number; transactions: unknown[] }>("/wallet"),

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
    list: () =>
      request<{ code: string; referred: unknown[] }>("/referrals"),
  },

  debts: {
    /** Lists debts the user owes and is owed. */
    list: () =>
      request<{ outgoing: unknown[]; incoming: unknown[] }>("/debts"),

    /** Pays a specific debt. */
    pay: (id: string) =>
      request<{}>(`/debts/${id}/pay`, { method: "POST" }),
  },
};
