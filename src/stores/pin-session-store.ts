import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PinSessionState {
  appUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const usePinSessionStore = create<PinSessionState>()(
  persist(
    (set) => ({
      appUnlocked: false,
      unlock: () => set({ appUnlocked: true }),
      lock: () => set({ appUnlocked: false }),
    }),
    {
      name: "esusu-pin-session",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
