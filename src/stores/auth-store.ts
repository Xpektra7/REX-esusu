import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the authenticated user object stored in the store. */
interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email: string;
}

/** Full auth-store state + actions. */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  pinSet: boolean;
  needsBvn: boolean;
  pinAttempts: number;

  // Actions
  setAuth: (payload: {
    access_token?: string;
    refresh_token?: string;
    user: AuthUser;
    token?: string;
    refreshToken?: string;
    needsBvn?: boolean;
    needs_bvn?: boolean;
    pinSet?: boolean;
    pin_set?: boolean;
  }) => void;
  setBvnVerified: () => void;
  setPinSet: (value: boolean) => void;
  incrementPinAttempt: () => void;
  resetPinAttempts: () => void;
  clearAuth: () => void;
}

// ---------------------------------------------------------------------------
// SSR-safe storage adapter
// ---------------------------------------------------------------------------

/**
 * Zustand persist expects localStorage, but that crashes during SSR / build.
 * This adapter falls back to a no-op storage on the server.
 */
const ssrSafeStorage = createJSONStorage(() =>
  typeof window !== "undefined"
    ? localStorage
    : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // --- Initial state ---
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      pinSet: false,
      needsBvn: true,
      pinAttempts: 0,

      // --- Actions ---

      /**
       * Called after a successful OTP + password verify.
       * Saves tokens + user and flips isAuthenticated to true.
       * needsBvn / pinSet tell the app which onboarding step is next.
       */
      setAuth: (payload) =>
        set({
          accessToken: payload.access_token ?? payload.token ?? null,
          refreshToken: payload.refresh_token ?? payload.refreshToken ?? null,
          user: payload.user,
          isAuthenticated: true,
          needsBvn: payload.needs_bvn ?? payload.needsBvn ?? true,
          pinSet: payload.pin_set ?? payload.pinSet ?? false,
        }),

      /** Marks BVN verification as done so we skip the KYC step. */
      setBvnVerified: () => set({ needsBvn: false }),

      /** Tracks whether the user has set a PIN (stays true after set). */
      setPinSet: (value) => set({ pinSet: value }),

      /** Counts wrong PIN attempts (3+ forces re-login). */
      incrementPinAttempt: () =>
        set((state) => ({ pinAttempts: state.pinAttempts + 1 })),

      /** Resets the PIN attempt counter after a successful unlock. */
      resetPinAttempts: () => set({ pinAttempts: 0 }),

      /** Full logout — wipes everything back to defaults. */
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          needsBvn: true,
          pinSet: false,
          pinAttempts: 0,
        }),
    }),

    // --- Persist config ---
    {
      name: "esusu-auth",
      storage: ssrSafeStorage,

      // Only persist these fields (skip the action functions).
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        needsBvn: state.needsBvn,
        pinSet: state.pinSet,
        pinAttempts: state.pinAttempts,
      }),
    },
  ),
);
