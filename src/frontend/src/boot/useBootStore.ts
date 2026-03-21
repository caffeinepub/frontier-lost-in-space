import { create } from "zustand";

export type BootPhase =
  | "idle"
  | "initializing_core"
  | "connecting_network"
  | "hydrating_data"
  | "initializing_engine"
  | "loading_assets"
  | "ready"
  | "error";

export interface BootState {
  phase: BootPhase;
  statusMessage: string;
  progress: number;
  errorInfo: { message: string; stack: string } | null;
  setPhase: (
    phase: BootPhase,
    statusMessage?: string,
    progress?: number,
  ) => void;
  setError: (message: string, stack: string) => void;
  reset: () => void;
}

export const useBootStore = create<BootState>((set) => ({
  phase: "idle",
  statusMessage: "System standby",
  progress: 0,
  errorInfo: null,

  setPhase: (phase, statusMessage = "", progress = 0) =>
    set({ phase, statusMessage, progress }),

  setError: (message, stack) =>
    set({ phase: "error", errorInfo: { message, stack }, progress: 0 }),

  reset: () =>
    set({
      phase: "idle",
      statusMessage: "System standby",
      progress: 0,
      errorInfo: null,
    }),
}));
