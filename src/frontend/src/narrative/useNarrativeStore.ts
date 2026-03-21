/**
 * useNarrativeStore.ts — Narrative event state management
 * V27: Auto-records to player memory on choice. Notifies intro engine on dismiss.
 * STABLE SELECTOR RULE: all selectors return raw primitives only.
 */

import { create } from "zustand";
import type { CEPLevel } from "../cep/useCEPStore";
import { useCEPStore } from "../cep/useCEPStore";
import { getEventById } from "./narrativeEvents";

interface NarrativeState {
  activeEventId: string | null;
  resultChoiceIndex: number;
  isDismissed: boolean;
  eventQueue: string[];
  triggeredEventIds: string[];

  triggerEvent: (eventId: string) => void;
  selectChoice: (choiceIndex: number) => void;
  dismissEvent: () => void;
  queueEvent: (eventId: string) => void;
}

let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useNarrativeStore = create<NarrativeState>((set, get) => ({
  activeEventId: null,
  resultChoiceIndex: -1,
  isDismissed: false,
  eventQueue: [],
  triggeredEventIds: [],

  triggerEvent: (eventId: string) => {
    const state = get();

    if (state.triggeredEventIds.includes(eventId)) {
      console.log(`[NARRATIVE] Event ${eventId} already triggered — skipping`);
      return;
    }

    if (state.activeEventId !== null) {
      console.log(
        `[NARRATIVE] Event ${eventId} queued — ${state.activeEventId} is active`,
      );
      set({
        eventQueue: [...state.eventQueue, eventId],
        triggeredEventIds: [...state.triggeredEventIds, eventId],
      });
      return;
    }

    console.log(`[NARRATIVE] Triggering event: ${eventId}`);
    set({
      activeEventId: eventId,
      resultChoiceIndex: -1,
      isDismissed: false,
      triggeredEventIds: [...state.triggeredEventIds, eventId],
    });

    // Notify memory store that an event was shown
    _notifyEventShown(eventId);
  },

  selectChoice: (choiceIndex: number) => {
    const state = get();
    if (!state.activeEventId) return;

    const event = getEventById(state.activeEventId);
    if (!event) return;

    const choice = event.choices[choiceIndex];
    if (!choice) return;

    console.log(
      `[NARRATIVE] Choice ${choice.label} selected for ${state.activeEventId}: ${choice.text}`,
    );

    set({ resultChoiceIndex: choiceIndex });

    const cepDelta = choice.cepDelta ?? 0;

    // Apply CEP delta
    if (cepDelta > 0) {
      const cepStore = useCEPStore.getState();
      for (let i = 0; i < cepDelta; i++) {
        cepStore.recordInteraction("target");
      }
    } else if (cepDelta < 0) {
      const cepStore = useCEPStore.getState();
      const currentLevel = cepStore.level;
      const newLevel = Math.max(0, currentLevel + cepDelta) as CEPLevel;
      if (newLevel < currentLevel) {
        cepStore._forceLevel(newLevel, "narrative-choice");
      }
    }

    // V27: Auto-record to player memory
    _recordChoiceToMemory(
      state.activeEventId,
      choice.label,
      choice.text,
      cepDelta,
      event.tags ?? [],
    );

    // V27: Notify intro engine of CEP delta
    _notifyEngineChoice(cepDelta, choice.label);

    if (autoDismissTimer) clearTimeout(autoDismissTimer);
    autoDismissTimer = setTimeout(() => {
      get().dismissEvent();
    }, 4000);
  },

  dismissEvent: () => {
    const state = get();
    const dismissedId = state.activeEventId;
    const queue = [...state.eventQueue];
    const next = queue.shift() ?? null;

    console.log(
      `[NARRATIVE] Dismissing ${dismissedId}. Next: ${next ?? "none"}`,
    );

    set({
      activeEventId: null,
      resultChoiceIndex: -1,
      isDismissed: true,
      eventQueue: queue,
    });

    // V27: Notify intro engine that this event was dismissed
    if (dismissedId) {
      _notifyEngineEventDismissed(dismissedId);
    }

    setTimeout(() => {
      set({ isDismissed: false });
      if (next) {
        set((s) => ({
          activeEventId: next,
          resultChoiceIndex: -1,
          triggeredEventIds: s.triggeredEventIds.includes(next)
            ? s.triggeredEventIds
            : [...s.triggeredEventIds, next],
        }));
        _notifyEventShown(next);
      }
    }, 400);
  },

  queueEvent: (eventId: string) => {
    const state = get();
    if (state.triggeredEventIds.includes(eventId)) return;
    set({
      eventQueue: [...state.eventQueue, eventId],
      triggeredEventIds: [...state.triggeredEventIds, eventId],
    });
  },
}));

// ── V27 side-effect helpers (lazy imports to avoid circular deps) ──────────────

function _notifyEventShown(_eventId: string): void {
  import("../memory/usePlayerMemoryStore")
    .then(({ usePlayerMemoryStore }) => {
      usePlayerMemoryStore.getState().incrementEventsShown();
    })
    .catch(() => {});
}

function _recordChoiceToMemory(
  eventId: string,
  choiceLabel: string,
  choiceText: string,
  cepDelta: number,
  tags: string[],
): void {
  import("../memory/usePlayerMemoryStore")
    .then(({ usePlayerMemoryStore }) => {
      usePlayerMemoryStore.getState().recordDecision({
        eventId,
        choiceLabel,
        choiceText,
        cepDelta,
        tags,
      });
      import("../intro/useIntroEventEngine")
        .then(({ useIntroEventEngine }) => {
          useIntroEventEngine.getState().setMemoryWriteSuccess(true);
        })
        .catch(() => {});
    })
    .catch(() => {
      import("../intro/useIntroEventEngine")
        .then(({ useIntroEventEngine }) => {
          useIntroEventEngine.getState().setMemoryWriteSuccess(false);
        })
        .catch(() => {});
    });
}

function _notifyEngineChoice(cepDelta: number, choiceLabel: string): void {
  import("../intro/useIntroEventEngine")
    .then(({ useIntroEventEngine }) => {
      useIntroEventEngine.getState().setLastCEPDelta(cepDelta, choiceLabel);
    })
    .catch(() => {});
}

function _notifyEngineEventDismissed(eventId: string): void {
  import("../intro/useIntroEventEngine")
    .then(({ useIntroEventEngine }) => {
      useIntroEventEngine.getState().onEventDismissed(eventId);
    })
    .catch(() => {});
}
