import { create } from "zustand";

export interface NodeData {
  energy: number;
  signal: number;
  stability: number;
}

function hashId(id: string): number[] {
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ c;
    h2 = ((h2 << 5) + h2) ^ c;
  }
  const h3 = h1 ^ h2;
  return [Math.abs(h1) % 101, Math.abs(h2) % 101, Math.abs(h3) % 101];
}

export type ControlMode = "orbit" | "turret";

export interface GlobeTarget {
  lat: number;
  lng: number;
  sector: string;
  id: string;
  threatLevel: number;
}

export interface EventLogEntry {
  id: string;
  msg: string;
  ts: number;
  type: "fire" | "lock" | "destroy" | "incoming" | "system";
}

interface TacticalStore {
  selectedNode: string | null;
  scanMode: boolean;
  nodeData: NodeData | null;
  smokeTestResults: Record<string, boolean> | null;
  controlMode: ControlMode;
  hoveredCoords: { lat: number; lng: number; sector: string } | null;
  globeTarget: GlobeTarget | null;
  eventLog: EventLogEntry[];
  selectNode: (id: string) => void;
  clearNode: () => void;
  toggleScanMode: () => void;
  setSmokeResults: (r: Record<string, boolean>) => void;
  setControlMode: (mode: ControlMode) => void;
  setHoveredCoords: (
    coords: { lat: number; lng: number; sector: string } | null,
  ) => void;
  setGlobeTarget: (target: GlobeTarget | null) => void;
  pushEventLog: (entry: Omit<EventLogEntry, "id" | "ts">) => void;
}

let _targetCounter = 1;

export const useTacticalStore = create<TacticalStore>((set) => ({
  selectedNode: null,
  scanMode: false,
  nodeData: null,
  smokeTestResults: null,
  controlMode: "orbit",
  hoveredCoords: null,
  globeTarget: null,
  eventLog: [
    { id: "boot-1", msg: "SYSTEM ONLINE", ts: Date.now(), type: "system" },
    {
      id: "boot-2",
      msg: "AEGIS ACTIVE",
      ts: Date.now() - 1000,
      type: "system",
    },
  ],

  selectNode: (id: string) => {
    const [energy, signal, stability] = hashId(id);
    set({ selectedNode: id, nodeData: { energy, signal, stability } });
  },

  clearNode: () =>
    set({ selectedNode: null, nodeData: null, globeTarget: null }),

  toggleScanMode: () => set((s) => ({ scanMode: !s.scanMode })),

  setSmokeResults: (r) => set({ smokeTestResults: r }),

  setControlMode: (mode) => set({ controlMode: mode }),

  setHoveredCoords: (coords) => set({ hoveredCoords: coords }),

  setGlobeTarget: (target) => {
    if (!target) {
      set({ globeTarget: null });
      return;
    }
    set({ globeTarget: target });
  },

  pushEventLog: (entry) => {
    set((s) => ({
      eventLog: [
        {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: Date.now(),
          ...entry,
        },
        ...s.eventLog,
      ].slice(0, 40),
    }));
  },
}));

export function generateTargetId(): string {
  const id = String(_targetCounter).padStart(4, "0");
  _targetCounter++;
  return `TGT-${id}`;
}
