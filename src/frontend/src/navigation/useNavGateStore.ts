/**
 * useNavGateStore.ts — Lightweight store for navigation mode gate events.
 *
 * Tracks:
 * - Last tap rejection (mode, reason, timestamp)
 * - Last tap acceptance
 * - Last auto mode transition (from, to, targetId)
 * - Applied camera offsets (written by CameraController each frame via mutable ref)
 *
 * STABLE SELECTOR RULES:
 * - All selectors return raw primitives or null.
 * - No .filter(), .map(), or derived objects inside selectors.
 *
 * V21 — New system for Phase 1 targeting gate observability.
 */

import { create } from "zustand";
import type { NavigationMode } from "./NavigationModeController";

export interface TapRejection {
  mode: NavigationMode;
  reason: string;
  ts: number;
}

export interface AutoTransitionRecord {
  from: NavigationMode;
  to: NavigationMode;
  targetId: string;
  ts: number;
}

interface NavGateStoreState {
  // ── Gate event records ───────────────────────────────────────────────────
  lastTapRejection: TapRejection | null;
  lastTapAccepted: { targetId: string; ts: number } | null;
  lastAutoTransition: AutoTransitionRecord | null;

  // ── Actions ──────────────────────────────────────────────────────────────
  recordTapRejection: (mode: NavigationMode, reason: string) => void;
  recordTapAccepted: (targetId: string) => void;
  recordAutoTransition: (
    from: NavigationMode,
    to: NavigationMode,
    targetId: string,
  ) => void;
}

export const useNavGateStore = create<NavGateStoreState>((set) => ({
  lastTapRejection: null,
  lastTapAccepted: null,
  lastAutoTransition: null,

  recordTapRejection: (mode, reason) =>
    set({ lastTapRejection: { mode, reason, ts: Date.now() } }),

  recordTapAccepted: (targetId) =>
    set({ lastTapAccepted: { targetId, ts: Date.now() } }),

  recordAutoTransition: (from, to, targetId) =>
    set({ lastAutoTransition: { from, to, targetId, ts: Date.now() } }),
}));

/**
 * Mutable observer object — written by CameraController every frame.
 * Read by InteractionDebugShell without triggering Zustand rerenders.
 */
export const cameraOffsetObserver = {
  appliedFov: 60,
  appliedDistOffset: 0,
  currentMode: "orbitObservation" as NavigationMode,
};
