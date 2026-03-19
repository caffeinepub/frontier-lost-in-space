/**
 * useTutorialStore — Tutorial state machine with back navigation + stuck recovery.
 *
 * Safe-back steps: intro, radar, control_panel
 * Forward-only/guarded: movement, scan, target, lock, fire
 *
 * Stuck recovery:
 *   - General guarded steps: STUCK_THRESHOLD_MS (18s)
 *   - "target" step specifically: 8s (more forgiving — iPhone touch is tricky)
 *   - After 3 target taps that don't advance: immediately show skip
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TutorialStep =
  | "intro"
  | "movement"
  | "scan"
  | "target"
  | "lock"
  | "fire"
  | "radar"
  | "control_panel"
  | "complete";

const STEP_ORDER: TutorialStep[] = [
  "intro",
  "movement",
  "scan",
  "target",
  "lock",
  "fire",
  "radar",
  "control_panel",
  "complete",
];

// Steps where backward navigation is allowed
const BACK_SAFE: Set<TutorialStep> = new Set([
  "intro",
  "radar",
  "control_panel",
]);

// Guarded steps: stuck timer + skip allowed after timeout
const GUARDED: Set<TutorialStep> = new Set([
  "movement",
  "scan",
  "target",
  "lock",
  "fire",
]);

// Default time in ms before SKIP becomes available on a stuck guarded step
const STUCK_THRESHOLD_MS = 18000;
// Shorter threshold specifically for the "target" step (iPhone touch is unreliable)
const TARGET_STUCK_THRESHOLD_MS = 8000;
// After this many target tap attempts without advancing, show skip immediately
const TARGET_TAP_BYPASS_COUNT = 3;

function nextStep(current: TutorialStep): TutorialStep {
  const idx = STEP_ORDER.indexOf(current);
  return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
}

function prevStep(current: TutorialStep): TutorialStep {
  const idx = STEP_ORDER.indexOf(current);
  return STEP_ORDER[Math.max(idx - 1, 0)];
}

/** Unlock flags that are true when tutorial is complete or inactive */
const ALL_UNLOCKED = {
  canMove: true,
  canScan: true,
  canTarget: true,
  canLock: true,
  canFire: true,
  canUseRadar: true,
  canOpenPanel: true,
  fullUIUnlocked: true,
};

function unlocksForStep(step: TutorialStep) {
  return {
    canMove: STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf("movement"),
    canScan: STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf("scan"),
    canTarget: STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf("target"),
    canLock: STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf("lock"),
    canFire: STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf("fire"),
    canUseRadar: STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf("radar"),
    canOpenPanel:
      STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf("control_panel"),
    fullUIUnlocked: step === "complete",
  };
}

interface TutorialState {
  tutorialActive: boolean;
  tutorialComplete: boolean;
  tutorialSkipped: boolean;
  currentStep: TutorialStep;
  stepStartedAt: number | null;
  canSkipCurrentStep: boolean;
  /** Count of times setTargetDetected was called while on the target step */
  targetTapCount: number;

  // Progressive unlock flags
  canMove: boolean;
  canScan: boolean;
  canTarget: boolean;
  canLock: boolean;
  canFire: boolean;
  canUseRadar: boolean;
  canOpenPanel: boolean;
  fullUIUnlocked: boolean;

  // Actions
  startTutorial: () => void;
  skipTutorial: () => void;
  advanceStep: () => void;
  goBack: () => void;
  skipCurrentStep: () => void;
  completeTutorial: () => void;
  markStepStuck: () => void;

  // Interaction detectors — called by game systems
  setMovementDetected: () => void;
  setScanDetected: () => void;
  setTargetDetected: () => void;
  setLockDetected: () => void;
  setFireDetected: () => void;
  setRadarObserved: () => void;
  setPanelOpened: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      tutorialActive: false,
      tutorialComplete: false,
      tutorialSkipped: false,
      currentStep: "intro",
      stepStartedAt: null,
      canSkipCurrentStep: false,
      targetTapCount: 0,

      // All locks start open; will be constrained when tutorial starts
      ...ALL_UNLOCKED,

      startTutorial: () => {
        set({
          tutorialActive: true,
          currentStep: "intro",
          stepStartedAt: Date.now(),
          canSkipCurrentStep: false,
          targetTapCount: 0,
          ...unlocksForStep("intro"),
          fullUIUnlocked: false,
        });
      },

      skipTutorial: () => {
        // Only allowed if already completed once
        if (!get().tutorialComplete) return;
        set({
          tutorialActive: false,
          tutorialSkipped: true,
          ...ALL_UNLOCKED,
        });
      },

      advanceStep: () => {
        const current = get().currentStep;
        if (current === "complete") return;
        const step = nextStep(current);
        if (step === "complete") {
          get().completeTutorial();
          return;
        }
        set({
          currentStep: step,
          stepStartedAt: Date.now(),
          canSkipCurrentStep: false,
          targetTapCount: 0,
          ...unlocksForStep(step),
        });
        // Start stuck timer for guarded steps
        if (GUARDED.has(step)) {
          const threshold =
            step === "target" ? TARGET_STUCK_THRESHOLD_MS : STUCK_THRESHOLD_MS;
          const startedAt = Date.now();
          setTimeout(() => {
            const s = get();
            if (
              s.tutorialActive &&
              s.currentStep === step &&
              s.stepStartedAt === startedAt
            ) {
              set({ canSkipCurrentStep: true });
            }
          }, threshold);
        }
      },

      goBack: () => {
        const current = get().currentStep;
        if (!BACK_SAFE.has(current)) return; // guarded steps cannot go back
        const step = prevStep(current);
        if (step === current) return;
        set({
          currentStep: step,
          stepStartedAt: Date.now(),
          canSkipCurrentStep: false,
          targetTapCount: 0,
          ...unlocksForStep(step),
        });
      },

      skipCurrentStep: () => {
        const current = get().currentStep;
        if (!GUARDED.has(current)) return; // only guarded steps can be skipped
        if (!get().canSkipCurrentStep) return;
        get().advanceStep();
      },

      completeTutorial: () => {
        set({
          tutorialActive: false,
          tutorialComplete: true,
          currentStep: "complete",
          canSkipCurrentStep: false,
          targetTapCount: 0,
          ...ALL_UNLOCKED,
        });
      },

      markStepStuck: () => {
        const current = get().currentStep;
        if (GUARDED.has(current)) {
          set({ canSkipCurrentStep: true });
        }
      },

      setMovementDetected: () => {
        if (get().currentStep !== "movement") return;
        get().advanceStep();
      },

      setScanDetected: () => {
        if (get().currentStep !== "scan") return;
        get().advanceStep();
      },

      setTargetDetected: () => {
        const step = get().currentStep;

        // Always increment tap counter regardless of current step
        // so repeated taps on a stuck step eventually show the bypass
        if (step === "target") {
          const newCount = get().targetTapCount + 1;
          set({ targetTapCount: newCount });

          // After N taps with no progress, show skip immediately
          if (newCount >= TARGET_TAP_BYPASS_COUNT) {
            set({ canSkipCurrentStep: true });
          }

          get().advanceStep(); // -> lock
          // Auto-advance lock -> fire after 2s
          const lockStartedAt = Date.now();
          setTimeout(() => {
            const s = get();
            if (s.currentStep === "lock" && s.stepStartedAt === lockStartedAt) {
              s.advanceStep();
            } else if (s.currentStep === "lock") {
              s.advanceStep();
            }
          }, 2000);
        }
      },

      setLockDetected: () => {
        // lock auto-advances; external callers can still call this safely
      },

      setFireDetected: () => {
        if (get().currentStep !== "fire") return;
        get().advanceStep(); // -> radar
        // Auto-advance radar -> control_panel after 3s
        setTimeout(() => {
          if (get().currentStep === "radar") get().advanceStep();
        }, 3000);
      },

      setRadarObserved: () => {
        // Handled by auto-advance timer in setFireDetected
      },

      setPanelOpened: () => {
        if (get().currentStep !== "control_panel") return;
        get().completeTutorial();
      },
    }),
    {
      name: "tci_tutorial_v2",
      partialize: (s) => ({
        tutorialComplete: s.tutorialComplete,
        tutorialSkipped: s.tutorialSkipped,
      }),
    },
  ),
);
