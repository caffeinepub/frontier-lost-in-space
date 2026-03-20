/**
 * useWeaponZoneStore.ts — Zustand store for weapon zone intent, dwell, and hit/miss metrics.
 * V22.1: COMBAT FEELS REAL LAYER
 *
 * STABLE SELECTORS ONLY — no .filter()/.map() or new objects/arrays inside selectors.
 * Persists assistTargetingUI to localStorage.
 */
import { create } from "zustand";

const WEAPON_IDS = ["pulse", "rail", "missile", "emp"] as const;

interface WeaponZoneState {
  /** Per-weapon intent levels 0–3 */
  intentLevels: Record<string, number>;
  /** Per-weapon dwell accumulation in ms */
  dwellTimes: Record<string, number>;
  /** Session hit counts per weapon */
  hitCounts: Record<string, number>;
  /** Session miss counts per weapon (near-miss, didn't fire) */
  missCounts: Record<string, number>;
  /** Total missed taps in the console region (not per weapon) */
  consoleMissCount: number;
  /** Accessibility: widens zone sensitivity and dwell forgiveness */
  assistTargetingUI: boolean;

  setIntentLevel: (weaponId: string, level: number) => void;
  setDwellTime: (weaponId: string, ms: number) => void;
  recordHit: (weaponId: string) => void;
  recordMiss: (weaponId: string) => void;
  recordConsoleMiss: () => void;
  setAssistTargetingUI: (enabled: boolean) => void;
}

function zeroRecord(): Record<string, number> {
  const r: Record<string, number> = {};
  for (const id of WEAPON_IDS) r[id] = 0;
  return r;
}

const storedAssist = localStorage.getItem("frontier_assist_targeting");
const initialAssist = storedAssist !== null ? storedAssist === "true" : true;

export const useWeaponZoneStore = create<WeaponZoneState>((set) => ({
  intentLevels: zeroRecord(),
  dwellTimes: zeroRecord(),
  hitCounts: zeroRecord(),
  missCounts: zeroRecord(),
  consoleMissCount: 0,
  assistTargetingUI: initialAssist,

  setIntentLevel: (weaponId, level) =>
    set((s) => ({ intentLevels: { ...s.intentLevels, [weaponId]: level } })),

  setDwellTime: (weaponId, ms) =>
    set((s) => ({ dwellTimes: { ...s.dwellTimes, [weaponId]: ms } })),

  recordHit: (weaponId) =>
    set((s) => ({
      hitCounts: {
        ...s.hitCounts,
        [weaponId]: (s.hitCounts[weaponId] ?? 0) + 1,
      },
    })),

  recordMiss: (weaponId) =>
    set((s) => ({
      missCounts: {
        ...s.missCounts,
        [weaponId]: (s.missCounts[weaponId] ?? 0) + 1,
      },
    })),

  recordConsoleMiss: () =>
    set((s) => ({ consoleMissCount: s.consoleMissCount + 1 })),

  setAssistTargetingUI: (enabled) => {
    try {
      localStorage.setItem("frontier_assist_targeting", String(enabled));
    } catch {
      /* ignore */
    }
    set({ assistTargetingUI: enabled });
  },
}));
