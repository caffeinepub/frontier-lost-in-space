/**
 * useInteractionStore.ts — Zustand store for the interaction observability system.
 *
 * STABLE SELECTOR RULES:
 * - All selectors return raw primitive or raw array values only.
 * - No .filter(), .map(), or derived objects inside selectors.
 * - Derive in component body.
 *
 * V20 Production Hardening:
 * - Tuning params persist to localStorage (key: frontier_interaction_tuning).
 * - Initial fsmState reads from globalFSM.current (not hardcoded idle).
 * - Telemetry buffer: last 50 events flushed to localStorage on pointerup.
 * - stuckDurationMs updated every second via interval.
 */

import { create } from "zustand";
import type { InteractionEvent } from "./InteractionEventBus";
import { interactionBus } from "./InteractionEventBus";
import { type InteractionState, globalFSM } from "./InteractionStateMachine";
import type { AssertionResult } from "./interactionAssertions";
import { runInteractionAssertions } from "./interactionAssertions";

const TUNING_STORAGE_KEY = "frontier_interaction_tuning";
const TELEMETRY_STORAGE_KEY = "frontier_interaction_telemetry";

const DEFAULT_TUNING = {
  dragThresholdPx: 8,
  tapDurationMs: 300,
  reticleSensitivity: 1.0,
  lockSensitivity: 1.0,
};

function loadPersistedTuning(): typeof DEFAULT_TUNING {
  try {
    const raw = localStorage.getItem(TUNING_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TUNING };
    const parsed = JSON.parse(raw) as Partial<typeof DEFAULT_TUNING>;
    return {
      dragThresholdPx:
        typeof parsed.dragThresholdPx === "number"
          ? parsed.dragThresholdPx
          : DEFAULT_TUNING.dragThresholdPx,
      tapDurationMs:
        typeof parsed.tapDurationMs === "number"
          ? parsed.tapDurationMs
          : DEFAULT_TUNING.tapDurationMs,
      reticleSensitivity:
        typeof parsed.reticleSensitivity === "number"
          ? parsed.reticleSensitivity
          : DEFAULT_TUNING.reticleSensitivity,
      lockSensitivity:
        typeof parsed.lockSensitivity === "number"
          ? parsed.lockSensitivity
          : DEFAULT_TUNING.lockSensitivity,
    };
  } catch {
    return { ...DEFAULT_TUNING };
  }
}

function saveTuning(tuning: typeof DEFAULT_TUNING): void {
  try {
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(tuning));
  } catch {
    /* storage quota or private mode */
  }
}

/** Flush last 50 interaction events to localStorage for post-session replay. */
export function flushTelemetry(events: InteractionEvent[]): void {
  try {
    const payload = {
      ts: Date.now(),
      session: sessionStorage.getItem("frontier_session_id") ?? "unknown",
      events: events.slice(-50),
    };
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

/** Load last telemetry snapshot from localStorage. */
export function loadLastTelemetry(): {
  ts: number;
  session: string;
  events: InteractionEvent[];
} | null {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      ts: number;
      session: string;
      events: InteractionEvent[];
    };
  } catch {
    return null;
  }
}

interface InteractionStoreState {
  fsmState: InteractionState;
  recentEvents: InteractionEvent[]; // last 10, updated by bus subscription
  telemetryBuffer: InteractionEvent[]; // last 50, flushed on pointerup
  pointerOwner: string; // 'globe-canvas' | 'joystick' | 'overlay' | 'none'
  stuckDurationMs: number; // ms elapsed in current FSM state
  lastRaycastResult: {
    hit: boolean;
    lat?: number;
    lng?: number;
    ts: number;
  } | null;
  lastTargetLockResult: {
    success: boolean;
    targetId?: string;
    reason?: string;
    ts: number;
  } | null;
  joystickActive: boolean;
  assertionResults: AssertionResult[];
  tapVsDragClassification: "tap" | "drag" | "unknown";
  tuning: typeof DEFAULT_TUNING;
  tuningPersisted: boolean; // true if current tuning matches what's saved
  // Actions
  setFsmState: (s: InteractionState) => void;
  setPointerOwner: (owner: string) => void;
  setLastRaycastResult: (r: InteractionStoreState["lastRaycastResult"]) => void;
  setLastTargetLockResult: (
    r: InteractionStoreState["lastTargetLockResult"],
  ) => void;
  setJoystickActive: (v: boolean) => void;
  setAssertionResults: (r: AssertionResult[]) => void;
  setTapVsDragClassification: (v: "tap" | "drag" | "unknown") => void;
  pushEvent: (e: InteractionEvent) => void;
  setTuning: (partial: Partial<typeof DEFAULT_TUNING>) => void;
  resetTuning: () => void;
  runAssertions: () => void;
}

export const useInteractionStore = create<InteractionStoreState>((set, get) => {
  const initialTuning = loadPersistedTuning();

  // Subscribe to the global bus and mirror last 10 events + telemetry buffer into store
  const unsubBus = interactionBus.subscribe((event) => {
    const s = get();
    const updated = [...s.recentEvents, event].slice(-10);
    const telemetry = [...s.telemetryBuffer, event].slice(-50);
    set({ recentEvents: updated, telemetryBuffer: telemetry });

    // Mirror pointer owner from source
    if (event.type === "pointerdown" && event.source) {
      set({ pointerOwner: event.source });
    }
    if (event.type === "pointerup") {
      // Flush telemetry on session end
      flushTelemetry(get().telemetryBuffer);
      set({ pointerOwner: "none" });
    }
  });

  // Mirror FSM state changes into store
  const unsubFSM = globalFSM.onStateChange((s) => {
    set({ fsmState: s });
  });

  // Stuck-state timer: update stuckDurationMs every second
  const stuckInterval = setInterval(() => {
    set({ stuckDurationMs: globalFSM.stuckDurationMs });
  }, 1000);

  // Cleanup registrations (store lives for app lifetime, but we register for completeness)
  void unsubBus;
  void unsubFSM;
  void stuckInterval;

  return {
    fsmState: globalFSM.current, // V20: read from FSM, not hardcoded
    recentEvents: [],
    telemetryBuffer: [],
    pointerOwner: "none",
    stuckDurationMs: 0,
    lastRaycastResult: null,
    lastTargetLockResult: null,
    joystickActive: false,
    assertionResults: [],
    tapVsDragClassification: "unknown",
    tuning: initialTuning,
    tuningPersisted: true, // loaded from storage, so already persisted

    setFsmState: (s) => set({ fsmState: s }),
    setPointerOwner: (owner) => set({ pointerOwner: owner }),
    setLastRaycastResult: (r) => set({ lastRaycastResult: r }),
    setLastTargetLockResult: (r) => set({ lastTargetLockResult: r }),
    setJoystickActive: (v) => set({ joystickActive: v }),
    setAssertionResults: (r) => set({ assertionResults: r }),
    setTapVsDragClassification: (v) => set({ tapVsDragClassification: v }),
    pushEvent: (e) => {
      const current = get().recentEvents;
      set({ recentEvents: [...current, e].slice(-10) });
    },
    setTuning: (partial) => {
      const next = { ...get().tuning, ...partial };
      saveTuning(next);
      set({ tuning: next, tuningPersisted: true });
    },
    resetTuning: () => {
      saveTuning(DEFAULT_TUNING);
      set({ tuning: { ...DEFAULT_TUNING }, tuningPersisted: true });
    },
    runAssertions: () => {
      const results = runInteractionAssertions();
      set({ assertionResults: results });
    },
  };
});

/** Convenience: get the current tuning values from anywhere. */
export function getInteractionTuning() {
  return useInteractionStore.getState().tuning;
}

/** Reset tuning to defaults from anywhere (e.g., test cleanup). */
export function resetInteractionTuning() {
  useInteractionStore.getState().resetTuning();
}
