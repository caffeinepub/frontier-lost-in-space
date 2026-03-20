/**
 * useTutorialStore — Tutorial state machine with back navigation + stuck recovery.
 *
 * Safe-back steps: intro, radar, control_panel
 * Forward-only/guarded: movement, scan, target, lock, fire
 *
 * Stuck recovery:
 *   - All guarded steps: 18s timeout → canSkipCurrentStep=true
 *   - "target" step: 8s (more forgiving — iPhone touch is tricky)
 *   - After 3 target taps that don't advance: immediately show skip
 *
 * Exit guardrail:
 *   - skipTutorial() now works at ANY time (no longer requires tutorialComplete)
 *   - This ensures a player is never trapped behind the overlay
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { enqueueVoice } from "../systems/useAudioQueue";

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
const BACK_SAFE: Set<TutorialStep> = new Set([
  "intro",
  "radar",
  "control_panel",
]);
const GUARDED: Set<TutorialStep> = new Set([
  "movement",
  "scan",
  "target",
  "lock",
  "fire",
]);
const STUCK_THRESHOLD_MS = 18000;
const TARGET_STUCK_THRESHOLD_MS = 8000;
const TARGET_TAP_BYPASS_COUNT = 3;

function nextStep(current: TutorialStep): TutorialStep {
  const idx = STEP_ORDER.indexOf(current);
  return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
}
function prevStep(current: TutorialStep): TutorialStep {
  const idx = STEP_ORDER.indexOf(current);
  return STEP_ORDER[Math.max(idx - 1, 0)];
}

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
  targetTapCount: number;
  canMove: boolean;
  canScan: boolean;
  canTarget: boolean;
  canLock: boolean;
  canFire: boolean;
  canUseRadar: boolean;
  canOpenPanel: boolean;
  fullUIUnlocked: boolean;
  startTutorial: () => void;
  skipTutorial: () => void;
  advanceStep: () => void;
  goBack: () => void;
  skipCurrentStep: () => void;
  completeTutorial: () => void;
  markStepStuck: () => void;
  setMovementDetected: () => void;
  setScanDetected: () => void;
  setTargetDetected: () => void;
  setLockDetected: () => void;
  setFireDetected: () => void;
  setRadarObserved: () => void;
  setPanelOpened: () => void;
}

const TUTORIAL_VOICE_MAP: Record<string, string> = {
  intro: "tutorial_intro",
  movement: "tutorial_movement",
  scan: "tutorial_scan",
  target: "tutorial_target",
  lock: "tutorial_lock",
  fire: "tutorial_fire",
  radar: "tutorial_radar",
  control_panel: "tutorial_control_panel",
  complete: "tutorial_complete",
};

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

      // GUARDRAIL: Exit is allowed at ANY time — player is never trapped
      skipTutorial: () => {
        set({ tutorialActive: false, tutorialSkipped: true, ...ALL_UNLOCKED });
      },

      advanceStep: () => {
        const current = get().currentStep;
        if (current === "complete") return;
        const step = nextStep(current);
        if (step === "complete") {
          get().completeTutorial();
          return;
        }
        const startedAt = Date.now();
        set({
          currentStep: step,
          stepStartedAt: startedAt,
          canSkipCurrentStep: false,
          targetTapCount: 0,
          ...unlocksForStep(step),
        });
        // Voice line for new step
        const stepVoiceKey = TUTORIAL_VOICE_MAP[step];
        if (stepVoiceKey) enqueueVoice(stepVoiceKey);
        // GUARDRAIL: all guarded steps get a stuck timer
        if (GUARDED.has(step)) {
          const threshold =
            step === "target" ? TARGET_STUCK_THRESHOLD_MS : STUCK_THRESHOLD_MS;
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
        if (!BACK_SAFE.has(current)) return;
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

      // GUARDRAIL: skip is unlocked by stuck timer for every guarded step
      skipCurrentStep: () => {
        const current = get().currentStep;
        if (!GUARDED.has(current)) return;
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
        if (GUARDED.has(get().currentStep)) {
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
        if (step === "target") {
          const newCount = get().targetTapCount + 1;
          set({ targetTapCount: newCount });
          if (newCount >= TARGET_TAP_BYPASS_COUNT) {
            set({ canSkipCurrentStep: true });
          }
          get().advanceStep();
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

      setLockDetected: () => {},
      setFireDetected: () => {
        if (get().currentStep !== "fire") return;
        get().advanceStep();
        setTimeout(() => {
          if (get().currentStep === "radar") get().advanceStep();
        }, 3000);
      },
      setRadarObserved: () => {},
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
