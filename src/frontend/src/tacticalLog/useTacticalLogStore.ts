import { create } from "zustand";

export type LogEntryType =
  | "combat"
  | "radar"
  | "alert"
  | "system"
  | "mission"
  | "repair";

export type LogFilter = "ALL" | "COMBAT" | "RADAR" | "ALERTS" | "SYSTEM";

export interface TacticalLogEntry {
  id: string;
  ts: number;
  type: LogEntryType;
  message: string;
}

export const LOG_ICON: Record<LogEntryType, string> = {
  combat: "⚡",
  radar: "📡",
  alert: "⚠️",
  system: "🔧",
  mission: "🎯",
  repair: "🛠️",
};

export const LOG_COLOR: Record<LogEntryType, string> = {
  combat: "#00ffcc",
  radar: "#00aaff",
  alert: "#ff8800",
  system: "#8899aa",
  mission: "#44ff88",
  repair: "#ffee44",
};

const now = Date.now();
const SEED_ENTRIES: TacticalLogEntry[] = [
  {
    id: "seed-5",
    ts: now - 5000,
    type: "system",
    message: "AEGIS COMMAND INTERFACE ONLINE",
  },
  {
    id: "seed-4",
    ts: now - 4500,
    type: "system",
    message: "ALL SUBSYSTEMS NOMINAL",
  },
  {
    id: "seed-3",
    ts: now - 3800,
    type: "radar",
    message: "SENSOR ARRAY CALIBRATED — 14 NODES DETECTED",
  },
  {
    id: "seed-2",
    ts: now - 2000,
    type: "alert",
    message: "THREAT LEVEL: ELEVATED — SECTOR ALPHA-7",
  },
  {
    id: "seed-1",
    ts: now - 1000,
    type: "mission",
    message: "MISSION ACTIVE: DEFEND ORBITAL PERIMETER",
  },
];

interface TacticalLogStore {
  entries: TacticalLogEntry[];
  panelOpen: boolean;
  filter: LogFilter;
  addEntry: (entry: Omit<TacticalLogEntry, "id" | "ts">) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setFilter: (f: LogFilter) => void;
}

export const useTacticalLogStore = create<TacticalLogStore>((set) => ({
  entries: SEED_ENTRIES,
  panelOpen: false,
  filter: "ALL",

  addEntry: (entry) =>
    set((s) => ({
      entries: [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: Date.now(),
          ...entry,
        },
        ...s.entries,
      ].slice(0, 120),
    })),

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setFilter: (f) => set({ filter: f }),
}));
