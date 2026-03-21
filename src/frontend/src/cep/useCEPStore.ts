/**
 * useCEPStore.ts — Consequence Execution Protocol (CEP) System
 * Frontier V23.1 — 6-level escalation model
 *
 * Level definitions:
 *   0  DORMANT        — system inactive, no detection
 *   1  PASSIVE SCAN   — low-level monitoring, player presence logged
 *   2  ACTIVE PROBE   — pattern analysis underway
 *   3  INTERFERENCE   — signal disruption begins, targeting affected
 *   4  PROTOCOL BREACH — active countermeasures deployed
 *   5  FULL EXECUTION  — maximum system response
 *
 * Escalation inputs:
 *   - Presence score  (time near planet, passive tick)
 *   - Interaction score (targeting locks, weapon fire, movement)
 *
 * STABLE SELECTOR RULES (FRONTIER mandate):
 *   All selectors return raw primitives only — no derived arrays/objects.
 */

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CEPLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type CEPInteractionType = "target" | "fire" | "move" | "scan";

export interface CEPLevelDef {
  level: CEPLevel;
  label: string;
  code: string; // Short code for HUD
  description: string;
  threshold: number; // totalScore required to reach this level
  color: string; // RGBA string
  logPrefix: string; // Prefix for log trace entries
}

export interface CEPHistoryEntry {
  level: CEPLevel;
  ts: number;
  reason: string;
}

// ─── Level definitions ────────────────────────────────────────────────────────

export const CEP_LEVELS: CEPLevelDef[] = [
  {
    level: 0,
    label: "DORMANT",
    code: "L0",
    description: "No anomalous activity. System baseline.",
    threshold: 0,
    color: "rgba(0,140,180,0.45)",
    logPrefix: "SYS",
  },
  {
    level: 1,
    label: "PASSIVE SCAN",
    code: "L1",
    description: "Monitoring signature detected. Presence logged.",
    threshold: 20,
    color: "rgba(0,200,180,0.65)",
    logPrefix: "SCN",
  },
  {
    level: 2,
    label: "ACTIVE PROBE",
    code: "L2",
    description: "Pattern analysis initiated. Behavioural profile building.",
    threshold: 50,
    color: "rgba(180,210,40,0.75)",
    logPrefix: "PRB",
  },
  {
    level: 3,
    label: "INTERFERENCE",
    code: "L3",
    description: "Signal disruption active. Targeting fidelity reduced.",
    threshold: 100,
    color: "rgba(255,180,30,0.85)",
    logPrefix: "INT",
  },
  {
    level: 4,
    label: "PROTOCOL BREACH",
    code: "L4",
    description: "Active countermeasures deployed. System integrity at risk.",
    threshold: 165,
    color: "rgba(255,100,30,0.9)",
    logPrefix: "BRX",
  },
  {
    level: 5,
    label: "FULL EXECUTION",
    code: "L5",
    description: "Maximum system response. All protocols active.",
    threshold: 250,
    color: "rgba(255,40,40,1.0)",
    logPrefix: "EXE",
  },
];

// Interaction score weights
export const CEP_INTERACTION_WEIGHT: Record<CEPInteractionType, number> = {
  target: 6,
  fire: 10,
  move: 1,
  scan: 3,
};

// Presence score per tick (added every 8 s)
export const CEP_PRESENCE_TICK = 2.5;

// ─── Store interface ──────────────────────────────────────────────────────────

interface CEPStoreState {
  // Core state — raw, selector-safe
  level: CEPLevel;
  presenceScore: number;
  interactionScore: number;
  totalScore: number;
  levelHistory: CEPHistoryEntry[]; // last 20 entries, raw array
  lastLevelUpTs: number | null;
  lastInteractionTs: number | null;
  lastInteractionType: CEPInteractionType | null;

  // Convenience flags (raw primitives)
  isActive: boolean; // level >= 1
  isDisrupting: boolean; // level >= 3
  isExecuting: boolean; // level >= 5

  // Actions
  tickPresence: () => void;
  recordInteraction: (type: CEPInteractionType) => void;
  _forceLevel: (level: CEPLevel, reason: string) => void; // debug only
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextLevel(totalScore: number): CEPLevel {
  let result: CEPLevel = 0;
  for (const def of CEP_LEVELS) {
    if (totalScore >= def.threshold) result = def.level;
  }
  return result;
}

function derivedFlags(level: CEPLevel) {
  return {
    isActive: level >= 1,
    isDisrupting: level >= 3,
    isExecuting: level >= 5,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCEPStore = create<CEPStoreState>((set, get) => ({
  level: 0,
  presenceScore: 0,
  interactionScore: 0,
  totalScore: 0,
  levelHistory: [],
  lastLevelUpTs: null,
  lastInteractionTs: null,
  lastInteractionType: null,
  isActive: false,
  isDisrupting: false,
  isExecuting: false,

  tickPresence: () => {
    const state = get();
    const newPresence = state.presenceScore + CEP_PRESENCE_TICK;
    const newTotal = newPresence + state.interactionScore;
    const newLevel = nextLevel(newTotal);

    const updates: Partial<CEPStoreState> = {
      presenceScore: newPresence,
      totalScore: newTotal,
    };

    if (newLevel > state.level) {
      const def = CEP_LEVELS[newLevel];
      const entry: CEPHistoryEntry = {
        level: newLevel,
        ts: Date.now(),
        reason: "presence-threshold",
      };
      console.log(
        `[CEP] Level ${newLevel} — ${def.label} | score: ${newTotal.toFixed(1)}`,
      );
      updates.level = newLevel;
      updates.lastLevelUpTs = Date.now();
      updates.levelHistory = [entry, ...state.levelHistory].slice(0, 20);
      updates.isActive = newLevel >= 1;
      updates.isDisrupting = newLevel >= 3;
      updates.isExecuting = newLevel >= 5;
    }

    set(updates as CEPStoreState);
  },

  recordInteraction: (type) => {
    const state = get();
    const weight = CEP_INTERACTION_WEIGHT[type];
    const newInt = state.interactionScore + weight;
    const newTotal = state.presenceScore + newInt;
    const newLevel = nextLevel(newTotal);

    console.log(
      `[CEP] Interaction: ${type} +${weight} | total: ${newTotal.toFixed(1)} | level: ${newLevel}`,
    );

    const updates: Partial<CEPStoreState> = {
      interactionScore: newInt,
      totalScore: newTotal,
      lastInteractionTs: Date.now(),
      lastInteractionType: type,
    };

    if (newLevel > state.level) {
      const def = CEP_LEVELS[newLevel];
      const entry: CEPHistoryEntry = {
        level: newLevel,
        ts: Date.now(),
        reason: `interaction:${type}`,
      };
      console.log(
        `[CEP] Level ${newLevel} — ${def.label} | triggered by: ${type}`,
      );
      updates.level = newLevel;
      updates.lastLevelUpTs = Date.now();
      updates.levelHistory = [entry, ...state.levelHistory].slice(0, 20);
      updates.isActive = newLevel >= 1;
      updates.isDisrupting = newLevel >= 3;
      updates.isExecuting = newLevel >= 5;
    }

    set(updates as CEPStoreState);
  },

  _forceLevel: (level, reason) => {
    const def = CEP_LEVELS[level];
    const entry: CEPHistoryEntry = { level, ts: Date.now(), reason };
    console.log(
      `[CEP] FORCE level ${level} — ${def.label} | reason: ${reason}`,
    );
    set({
      level,
      lastLevelUpTs: Date.now(),
      levelHistory: [entry, ...get().levelHistory].slice(0, 20),
      ...derivedFlags(level),
    });
  },
}));

/** Singleton accessor for non-React code (e.g. combat events) */
export function getCEPState() {
  return useCEPStore.getState();
}
