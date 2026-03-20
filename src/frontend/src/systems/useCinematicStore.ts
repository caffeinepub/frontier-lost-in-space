import { create } from "zustand";

interface CinematicState {
  hostileContactActive: boolean;
  hostileContactTargetId: string | null;
  cinematicPhase: number; // 0=idle 1=entry 2=peak 3=exit

  triggerHostileContact: (targetId: string) => void;
  clearHostileContact: () => void;
  setCinematicPhase: (phase: number) => void;
}

export const useCinematicStore = create<CinematicState>((set) => ({
  hostileContactActive: false,
  hostileContactTargetId: null,
  cinematicPhase: 0,

  triggerHostileContact: (targetId) => {
    set({
      hostileContactActive: true,
      hostileContactTargetId: targetId,
      cinematicPhase: 1,
    });
  },
  clearHostileContact: () => {
    set({
      hostileContactActive: false,
      hostileContactTargetId: null,
      cinematicPhase: 0,
    });
  },
  setCinematicPhase: (phase) => set({ cinematicPhase: phase }),
}));
