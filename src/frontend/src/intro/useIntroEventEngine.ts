/**
 * useIntroEventEngine.ts — Frontier V27
 * Runtime engine for the locked 15-event intro sequence.
 *
 * Rules:
 *  - Events 0–14 (introIndex) are the authoritative intro sequence.
 *  - Adaptive randomization is DISABLED until all 15 events complete.
 *  - Events are phase-gated: no event fires before its phase is active.
 *  - When event index 14 is dismissed, introSequenceComplete = true
 *    and adaptiveUnlocked = true.
 *
 * STABLE SELECTOR RULE: all selectors return raw primitives.
 */

import { create } from "zustand";
import type { IntroPhaseName } from "../narrative/GameEvent";
import {
  INTRO_EVENT_IDS,
  getIntroEventByIndex,
} from "../narrative/introEventCatalog";

const INTRO_PHASE_ORDER: IntroPhaseName[] = [
  "INTRO_DRIFT",
  "INTRO_SYSTEMS",
  "INTRO_RECOVERY",
  "INTRO_ANOMALY",
  "INTRO_HANDOFF",
];

function phaseRank(phase: IntroPhaseName): number {
  return INTRO_PHASE_ORDER.indexOf(phase);
}

interface IntroEventEngineState {
  introEventIndex: number;
  introSequenceComplete: boolean;
  adaptiveUnlocked: boolean;
  currentIntroPhase: IntroPhaseName | null;
  lastEventId: string | null;
  lastChoiceLabel: string | null;
  lastCEPDelta: number;
  memoryWriteSuccess: boolean;
  voiceActive: boolean;
  isInitialized: boolean;

  initEngine: () => void;
  onPhaseEnter: (phase: IntroPhaseName) => void;
  onEventDismissed: (eventId: string) => void;
  setLastCEPDelta: (delta: number, choiceLabel: string) => void;
  setVoiceActive: (active: boolean) => void;
  setMemoryWriteSuccess: (ok: boolean) => void;
  completeSequence: () => void;
}

export const useIntroEventEngine = create<IntroEventEngineState>(
  (set, get) => ({
    introEventIndex: 0,
    introSequenceComplete: false,
    adaptiveUnlocked: false,
    currentIntroPhase: null,
    lastEventId: null,
    lastChoiceLabel: null,
    lastCEPDelta: 0,
    memoryWriteSuccess: false,
    voiceActive: false,
    isInitialized: false,

    initEngine: () => {
      if (get().isInitialized) return;
      console.log(
        "[INTRO-ENGINE] Initialized — locked intro sequence: 15 events",
      );
      set({ isInitialized: true, introEventIndex: 0 });
    },

    onPhaseEnter: (phase: IntroPhaseName) => {
      const state = get();
      if (state.introSequenceComplete) return;

      console.log(
        `[INTRO-ENGINE] Phase entered: ${phase} | next index: ${state.introEventIndex}`,
      );
      set({ currentIntroPhase: phase });

      _fireNextEligibleEvent(phase, state.introEventIndex);
    },

    onEventDismissed: (eventId: string) => {
      const state = get();
      if (state.introSequenceComplete) return;

      const dismissedIndex = INTRO_EVENT_IDS.indexOf(eventId);
      if (dismissedIndex < 0) return;

      console.log(
        `[INTRO-ENGINE] Dismissed: ${eventId} (introIndex ${dismissedIndex})`,
      );

      if (dismissedIndex >= 14) {
        get().completeSequence();
        return;
      }

      const nextIndex = dismissedIndex + 1;
      set({ introEventIndex: nextIndex, lastEventId: eventId });

      const nextEvent = getIntroEventByIndex(nextIndex);
      if (nextEvent?.phaseTrigger && state.currentIntroPhase) {
        const nextRank = phaseRank(nextEvent.phaseTrigger as IntroPhaseName);
        const currentRank = phaseRank(state.currentIntroPhase);
        if (currentRank >= nextRank) {
          _fireNextEligibleEvent(state.currentIntroPhase, nextIndex);
        }
      }
    },

    setLastCEPDelta: (delta: number, choiceLabel: string) => {
      set({ lastCEPDelta: delta, lastChoiceLabel: choiceLabel });
    },

    setVoiceActive: (active: boolean) => {
      set({ voiceActive: active });
    },

    setMemoryWriteSuccess: (ok: boolean) => {
      set({ memoryWriteSuccess: ok });
    },

    completeSequence: () => {
      console.log(
        "[INTRO-ENGINE] ✅ Intro sequence complete (15/15) — adaptive pool UNLOCKED",
      );
      set({
        introSequenceComplete: true,
        adaptiveUnlocked: true,
        introEventIndex: 15,
      });
    },
  }),
);

/**
 * Internal helper: fire the next eligible intro event for the given phase.
 * Uses lazy import to avoid circular deps at module load time.
 */
function _fireNextEligibleEvent(
  phase: IntroPhaseName,
  fromIndex: number,
): void {
  const event = getIntroEventByIndex(fromIndex);
  if (!event) return;
  if (event.phaseTrigger !== phase) return;

  import("../narrative/useNarrativeStore")
    .then(({ useNarrativeStore }) => {
      const narrativeState = useNarrativeStore.getState();
      if (narrativeState.triggeredEventIds.includes(event.id)) {
        console.log(`[INTRO-ENGINE] Already triggered: ${event.id} — skipping`);
        return;
      }
      console.log(
        `[INTRO-ENGINE] Firing [${fromIndex}/${INTRO_EVENT_IDS.length - 1}]: ${event.id}`,
      );
      narrativeState.triggerEvent(event.id);
    })
    .catch(() => {});
}
