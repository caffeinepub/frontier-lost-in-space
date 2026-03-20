/**
 * useWeaponAI — Weapon Prioritization AI
 *
 * Analyzes the selected target type and recommends the best weapon.
 * In 'assisted' mode, auto-selects the recommended weapon if it is READY.
 */

import { create } from "zustand";
import { useTacticalStore } from "../hooks/useTacticalStore";
import { useWeaponsStore } from "./useWeapons";

export type AiMode = "manual" | "assisted";

interface WeaponAIStore {
  recommendedWeaponId: string | null;
  aiMode: AiMode;
  setAiMode: (mode: AiMode) => void;
  analyzeTarget: (targetId: string | null) => void;
}

// Priority table: target prefix → [first choice, second choice]
const PRIORITY_TABLE: Record<string, [string, string]> = {
  "SAT-": ["pulse", "rail"],
  "BASE-": ["rail", "missile"],
  "THREAT-": ["emp", "pulse"],
  "TGT-": ["pulse", "emp"],
  "NODE-": ["pulse", "emp"],
};

function getPriorityForTarget(targetId: string): [string, string] | null {
  for (const prefix of Object.keys(PRIORITY_TABLE)) {
    if (targetId.startsWith(prefix)) {
      return PRIORITY_TABLE[prefix];
    }
  }
  return ["pulse", "rail"]; // generic fallback
}

export const useWeaponAI = create<WeaponAIStore>((set, get) => ({
  recommendedWeaponId: null,
  aiMode: "manual",

  setAiMode: (mode) => {
    set({ aiMode: mode });
    // Re-analyze with new mode
    const { selectedNode } = useTacticalStore.getState();
    get().analyzeTarget(selectedNode);
  },

  analyzeTarget: (targetId) => {
    if (!targetId) {
      set({ recommendedWeaponId: null });
      return;
    }

    const priority = getPriorityForTarget(targetId);
    if (!priority) {
      set({ recommendedWeaponId: null });
      return;
    }

    const [first, second] = priority;
    const { weapons } = useWeaponsStore.getState();

    // Find first-choice weapon
    const firstWeapon = weapons.find((w) => w.id === first);
    const secondWeapon = weapons.find((w) => w.id === second);

    // Pick first choice if READY, otherwise fall back to second choice
    let recommended: string | null = null;
    if (firstWeapon && firstWeapon.status === "READY") {
      recommended = first;
    } else if (secondWeapon && secondWeapon.status === "READY") {
      recommended = second;
    } else if (firstWeapon) {
      // Both unavailable — still show first choice as hint
      recommended = first;
    }

    set({ recommendedWeaponId: recommended });

    // Assisted mode: auto-arm if the recommended weapon is READY
    const { aiMode } = get();
    if (aiMode === "assisted" && recommended) {
      const recWeapon = weapons.find((w) => w.id === recommended);
      if (recWeapon && recWeapon.status === "READY") {
        useWeaponsStore.getState().selectWeapon(recommended);
      }
    }
  },
}));

// ─── Auto-trigger on selectedNode change ──────────────────────────────────────
useTacticalStore.subscribe((state) => {
  useWeaponAI.getState().analyzeTarget(state.selectedNode);
});
