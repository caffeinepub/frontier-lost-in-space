/**
 * useIntroStore — Section 1: First-run gating + intro state
 *
 * Persisted to localStorage. Controls whether the cinematic intro
 * should play. Intro plays on:
 *   1. First launch (introComplete === false)
 *   2. New Game (triggerNewGame() called)
 *   3. Replay (replayIntro() called)
 *
 * Returning players skip straight to the main game.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "tci_intro_v1";

interface IntroState {
  /** Has the player ever completed (or skipped) the intro? */
  introComplete: boolean;
  /** Is the intro currently playing right now? */
  introPlaying: boolean;
  /** Was the intro skipped (vs watched to completion)? */
  introSkipped: boolean;
  /** Timestamp of first ever launch */
  firstLaunchAt: number | null;
  /** Whether the tutorial should start after the intro closes */
  pendingTutorialStart: boolean;

  // Actions
  /** Called by the intro component when the sequence finishes naturally */
  completeIntro: () => void;
  /** Called by the SKIP button */
  skipIntro: () => void;
  /** Start a new game — triggers intro again + resets tutorial/story (Section 2/3 will hook in) */
  triggerNewGame: () => void;
  /** Replay intro from settings/menu without resetting progress */
  replayIntro: () => void;
  /** Called by App on first mount to decide whether to show intro */
  initIntroGating: () => void;
  /** Consume the pendingTutorialStart flag */
  consumeTutorialStart: () => void;
}

export const useIntroStore = create<IntroState>()(
  persist(
    (set, get) => ({
      introComplete: false,
      introPlaying: false,
      introSkipped: false,
      firstLaunchAt: null,
      pendingTutorialStart: false,

      initIntroGating: () => {
        const state = get();
        // First ever launch
        if (!state.introComplete) {
          set({
            introPlaying: true,
            firstLaunchAt: state.firstLaunchAt ?? Date.now(),
          });
        }
        // Returning player — intro skipped automatically
      },

      completeIntro: () => {
        set({
          introPlaying: false,
          introComplete: true,
          introSkipped: false,
          pendingTutorialStart: true,
        });
      },

      skipIntro: () => {
        set({
          introPlaying: false,
          introComplete: true,
          introSkipped: true,
          pendingTutorialStart: true,
        });
      },

      triggerNewGame: () => {
        set({
          introPlaying: true,
          introComplete: false,
          introSkipped: false,
          pendingTutorialStart: false,
        });
      },

      replayIntro: () => {
        // Replay without resetting completion state
        set({ introPlaying: true });
      },

      consumeTutorialStart: () => {
        set({ pendingTutorialStart: false });
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist fields that should survive reload
      partialize: (state) => ({
        introComplete: state.introComplete,
        introSkipped: state.introSkipped,
        firstLaunchAt: state.firstLaunchAt,
      }),
    },
  ),
);
