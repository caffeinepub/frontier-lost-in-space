import { create } from "zustand";

export interface EventLogEntry {
  id: string;
  msg: string;
  type: "fire" | "destroy" | "alert" | "info" | "lock";
  ts: number;
}

export interface GlobeTarget {
  id: string;
  lat?: number;
  lng?: number;
  sector?: string;
  threatLevel?: number;
  [key: string]: unknown;
}

export interface NodeData {
  id?: string;
  label?: string;
  status?: string;
  energy?: number;
  signal?: number;
  stability?: number;
  [key: string]: unknown;
}

interface TacticalState {
  selectedNode: string | null;
  scanMode: boolean;
  eventLog: EventLogEntry[];
  phase: "idle" | "combat" | "briefing";
  globeTarget: GlobeTarget | null;
  nodeData: NodeData | null;

  selectNode: (id: string | null) => void;
  clearNode: () => void;
  toggleScanMode: () => void;
  setScanMode: (v: boolean) => void;
  setPhase: (phase: TacticalState["phase"]) => void;
  pushEventLog: (entry: Omit<EventLogEntry, "ts" | "id">) => void;
  setGlobeTarget: (target: GlobeTarget | null) => void;
  setNodeData: (data: NodeData | null) => void;
}

export const useTacticalStore = create<TacticalState>((set) => ({
  selectedNode: null,
  scanMode: false,
  eventLog: [],
  phase: "idle",
  globeTarget: null,
  nodeData: null,

  selectNode: (id) => set({ selectedNode: id }),
  clearNode: () =>
    set({ selectedNode: null, globeTarget: null, nodeData: null }),
  toggleScanMode: () => set((s) => ({ scanMode: !s.scanMode })),
  setScanMode: (v) => set({ scanMode: v }),
  setPhase: (phase) => set({ phase }),
  pushEventLog: (entry) =>
    set((s) => ({
      eventLog: [
        {
          ...entry,
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          ts: Date.now(),
        },
        ...s.eventLog,
      ].slice(0, 200),
    })),
  setGlobeTarget: (target) => set({ globeTarget: target }),
  setNodeData: (data) => set({ nodeData: data }),
}));
