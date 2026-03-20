/**
 * useNavigationModeStore.ts — Zustand reactive store for the navigation mode system.
 *
 * STABLE SELECTOR RULES (FRONTIER engineering mandate):
 * - All selectors return raw primitives or raw arrays only.
 * - No .filter(), .map(), or derived objects inside selectors.
 * - Derive in component body.
 *
 * Mirrors the globalNavMode singleton into React-reactive state.
 * Components subscribe here; logic writes via globalNavMode.transitionTo().
 */

import { create } from "zustand";
import {
  MODE_DEFINITIONS,
  type NavModeHistoryEntry,
  type NavigationMode,
  globalNavMode,
} from "./NavigationModeController";

interface NavigationModeStoreState {
  // ── Core state (raw primitives — selector-safe) ──────────────────────────
  currentMode: NavigationMode;
  previousMode: NavigationMode;
  transitionHistory: NavModeHistoryEntry[]; // last 50, raw array

  // ── Derived convenience flags (computed from currentMode, safe primitives)
  globeTargetingEnabled: boolean;
  globeOwnsTap: boolean;
  joystickPrimary: boolean;
  showTargetingReticle: boolean;
  showCruiseIndicator: boolean;
  alertLevel: "normal" | "elevated" | "critical";
  hudLabel: string;
  hudCode: string;

  // ── Actions ──────────────────────────────────────────────────────────────
  /** Attempt a transition via globalNavMode. Returns true if allowed. */
  transitionTo: (to: NavigationMode, reason?: string) => boolean;
  /** Force-set (bypasses validation — for init / testing only). */
  forceMode: (mode: NavigationMode, reason?: string) => void;
}

function deriveFlags(mode: NavigationMode) {
  const def = MODE_DEFINITIONS[mode];
  return {
    globeTargetingEnabled: def.globe.targetingEnabled,
    globeOwnsTap: def.input.globeOwnsTap,
    joystickPrimary: def.input.joystickPrimary,
    showTargetingReticle: def.hud.showTargetingReticle,
    showCruiseIndicator: def.hud.showCruiseIndicator,
    alertLevel: def.hud.alertLevel,
    hudLabel: def.label,
    hudCode: def.code,
  };
}

export const useNavigationModeStore = create<NavigationModeStoreState>(
  (set, _get) => {
    // Mirror globalNavMode changes into store
    const unsub = globalNavMode.onModeChange((mode, prev) => {
      set({
        currentMode: mode,
        previousMode: prev,
        transitionHistory: globalNavMode.getHistory(),
        ...deriveFlags(mode),
      });
    });
    void unsub; // Store lives for app lifetime

    const initial = globalNavMode.currentMode;

    return {
      currentMode: initial,
      previousMode: initial,
      transitionHistory: [],
      ...deriveFlags(initial),

      transitionTo: (to, reason) => {
        return globalNavMode.transitionTo(to, reason);
      },

      forceMode: (mode, reason) => {
        globalNavMode.forceMode(mode, reason);
      },
    };
  },
);

/** Convenience: get current nav mode from outside React. */
export function getNavigationMode(): NavigationMode {
  return useNavigationModeStore.getState().currentMode;
}

/** Convenience: transition from outside React (e.g. combat events). */
export function navTransitionTo(to: NavigationMode, reason?: string): boolean {
  return globalNavMode.transitionTo(to, reason);
}
