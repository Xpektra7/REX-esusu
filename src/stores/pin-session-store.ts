import { create } from "zustand";

interface PinSessionState {
  appUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const usePinSessionStore = create<PinSessionState>((set) => ({
  appUnlocked: false,
  unlock: () => set({ appUnlocked: true }),
  lock: () => set({ appUnlocked: false }),
}));
