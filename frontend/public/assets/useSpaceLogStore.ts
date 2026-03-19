/**
 * useSpaceLogStore — Section 3
 *
 * Commander journal / narrative log. SEPARATE from Tactical Log.
 * Tactical Log = live ops feed (combat, radar, alerts).
 * Space Log = narrative milestones, decisions, major story moments.
 *
 * Persisted key: tci_spacelog_v1
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoryPhase } from "./useStoryStore";

export type SpaceLogEntryType =
  | "milestone"
  | "decision"
  | "discovery"
  | "aegis"
  | "survival";

export interface SpaceLogEntry {
  id: string;
  ts: number;
  type: SpaceLogEntryType;
  title: string;
  body: string;
  phase: StoryPhase;
}

export const SPACE_LOG_ICON: Record<SpaceLogEntryType, string> = {
  milestone: "\u2605",
  decision: "\u25c6",
  discovery: "\u2725",
  aegis: "\u25cb",
  survival: "\u2665",
};

export const SPACE_LOG_COLOR: Record<SpaceLogEntryType, string> = {
  milestone: "#ffcc44",
  decision: "#00ccff",
  discovery: "#aa66ff",
  aegis: "#00ffcc",
  survival: "#ff6644",
};

const SEED_ENTRIES: SpaceLogEntry[] = [
  {
    id: "seed-sl-1",
    ts: Date.now() - 180000,
    type: "milestone",
    title: "CATASTROPHIC FAILURE",
    body: "Unknown event destroyed primary drives. Ship adrift. A.E.G.I.S. partially restored.",
    phase: 1,
  },
  {
    id: "seed-sl-2",
    ts: Date.now() - 90000,
    type: "aegis",
    title: "A.E.G.I.S. FIRST CONTACT",
    body: "A.E.G.I.S. core rebooted on backup power. Commander identity confirmed. Calibration initiated.",
    phase: 1,
  },
  {
    id: "seed-sl-3",
    ts: Date.now() - 30000,
    type: "survival",
    title: "SYSTEMS CRITICAL",
    body: "Oxygen at 72%. Hull at 68%. Power reserves minimal. Survival window: unknown.",
    phase: 1,
  },
];

interface SpaceLogState {
  entries: SpaceLogEntry[];
  panelOpen: boolean;

  addEntry: (entry: Omit<SpaceLogEntry, "id" | "ts">) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

export const useSpaceLogStore = create<SpaceLogState>()(
  persist(
    (set) => ({
      entries: SEED_ENTRIES,
      panelOpen: false,

      addEntry: (entry) =>
        set((s) => ({
          entries: [
            {
              id: `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              ts: Date.now(),
              ...entry,
            },
            ...s.entries,
          ].slice(0, 80),
        })),

      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
    }),
    {
      name: "tci_spacelog_v1",
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);
