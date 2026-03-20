/**
 * usePlayerStore — player defense state.
 *
 * Shield absorbs damage first; once depleted, hull takes damage.
 * hitFlash drives visual screen-pulse feedback.
 * shieldFlash drives the shield bar flash.
 */
import { create } from "zustand";

interface PlayerState {
  shield: number; // 0–100
  hull: number; // 0–100
  hitFlash: boolean;
  shieldFlash: boolean;
}

interface PlayerActions {
  takeDamage: (amount: number) => void;
  repair: () => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>(
  (set, get) => ({
    shield: 100,
    hull: 100,
    hitFlash: false,
    shieldFlash: false,

    takeDamage: (amount: number) => {
      const { shield, hull } = get();
      if (shield > 0) {
        const newShield = Math.max(0, shield - amount);
        set({ shield: newShield, shieldFlash: true, hitFlash: true });
      } else {
        const newHull = Math.max(0, hull - amount);
        set({ hull: newHull, hitFlash: true, shieldFlash: false });
      }
      setTimeout(() => set({ hitFlash: false, shieldFlash: false }), 420);
    },

    repair: () =>
      set({ shield: 100, hull: 100, hitFlash: false, shieldFlash: false }),
  }),
);
