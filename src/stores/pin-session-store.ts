import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface PinSessionState {
  appUnlocked: boolean;
  _hydrated: boolean;
  unlock: () => void;
  lock: () => void;
}

export const usePinSessionStore = create<PinSessionState>()(
  persist(
    (set) => ({
      appUnlocked: false,
      _hydrated: false,
      unlock: () => set({ appUnlocked: true }),
      lock: () => set({ appUnlocked: false }),
    }),
    {
      name: "esusu-pin-session",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => () => {
        usePinSessionStore.setState({ _hydrated: true });
      },
    },
  ),
);
