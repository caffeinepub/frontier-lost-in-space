/**
 * useIntroPhaseStore.ts — FSM for intro phase progression
 * Drives 5 named intro phases, each with a duration before auto-advance.
 * Fires narrative events via IntroPhaseController (not directly here).
 */
import { create } from "zustand";
import type { IntroPhaseName } from "../narrative/GameEvent";

export const INTRO_PHASE_ORDER: IntroPhaseName[] = [
  "INTRO_DRIFT",
  "INTRO_SYSTEMS",
  "INTRO_RECOVERY",
  "INTRO_ANOMALY",
  "INTRO_HANDOFF",
];

export const PHASE_DURATIONS: Record<IntroPhaseName, number> = {
  INTRO_DRIFT: 18000, // 18s
  INTRO_SYSTEMS: 20000, // 20s
  INTRO_RECOVERY: 15000, // 15s
  INTRO_ANOMALY: 25000, // 25s
  INTRO_HANDOFF: 12000, // 12s — final phase before game
};

interface IntroPhaseState {
  // Raw primitives — selector-safe
  currentPhase: IntroPhaseName | null;
  phaseComplete: boolean;
  phaseHistoryCount: number; // length of history, not the array

  // Private raw array (read in component, not in selectors)
  phaseHistory: IntroPhaseName[];

  // Actions
  startPhases: () => void;
  advancePhase: () => void;
}

export const useIntroPhaseStore = create<IntroPhaseState>((set, get) => ({
  currentPhase: null,
  phaseComplete: false,
  phaseHistoryCount: 0,
  phaseHistory: [],

  startPhases: () => {
    const first = INTRO_PHASE_ORDER[0];
    console.log(`[INTRO-PHASE] Starting: ${first}`);
    set({
      currentPhase: first,
      phaseHistory: [first],
      phaseHistoryCount: 1,
    });
  },

  advancePhase: () => {
    const state = get();
    if (!state.currentPhase) return;
    const idx = INTRO_PHASE_ORDER.indexOf(state.currentPhase);
    const next = INTRO_PHASE_ORDER[idx + 1];
    if (!next) {
      console.log("[INTRO-PHASE] All phases complete");
      set({ phaseComplete: true });
      return;
    }
    console.log(`[INTRO-PHASE] Advancing: ${state.currentPhase} → ${next}`);
    const newHistory = [...state.phaseHistory, next];
    set({
      currentPhase: next,
      phaseHistory: newHistory,
      phaseHistoryCount: newHistory.length,
    });
  },
}));
