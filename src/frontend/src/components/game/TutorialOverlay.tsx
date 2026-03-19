/**
 * TutorialOverlay — Opt-in tutorial UI.
 *
 * Guardrails:
 *   - EXIT button is ALWAYS visible — player is never trapped
 *   - SKIP STEP unlocks for all guarded steps via stuck timer
 *   - target step: CONTINUE bypass after 8s or 3 taps
 *   - pointer-events: none on outer wrapper so background UI remains usable
 *   - z-index 200 on card only (not full screen)
 */
import { useEffect, useRef, useState } from "react";
import { speak, stopSpeech } from "../../audio/aegisVoice";
import { useSubtitleStore } from "../../subtitle/useSubtitleStore";
import { speakEleven } from "../../systems/ElevenVoice";
import {
  type TutorialStep,
  useTutorialStore,
} from "../../tutorial/useTutorialStore";

const STEP_VOICE: Partial<Record<TutorialStep, string>> = {
  intro: "Commander. Systems damaged. Calibration sequence initiating.",
  movement: "Adjust heading. Use controls to move your ship.",
  scan: "Scan surrounding space. Activate sensor sweep.",
  target: "Select a target. Tap the globe to designate a strike coordinate.",
  lock: "Target acquired. Weapons arming.",
  fire: "Fire primary weapon.",
  radar: "Observe radar sweep. Monitor for contacts.",
  control_panel: "Open system panel.",
  complete: "Calibration complete. All systems operational.",
};

const BACK_SAFE: Set<TutorialStep> = new Set([
  "intro",
  "radar",
  "control_panel",
]);

interface StepConfig {
  title: string;
  instruction: string;
  subtext?: string;
  targetAttr?: string;
  autoAdvance?: number;
}

const STEP_CONFIG: Record<TutorialStep, StepConfig> = {
  intro: {
    title: "SYSTEMS DAMAGED",
    instruction:
      "Commander — A.E.G.I.S. is partially operational. Your ship has suffered catastrophic failure.",
    subtext: "Calibration sequence initiating...",
    autoAdvance: 4000,
  },
  movement: {
    title: "ADJUST HEADING",
    instruction:
      "Use the joystick (mobile) or WASD keys (desktop) to move your ship.",
    subtext: "Move to continue.",
    targetAttr: "joystick-zone",
  },
  scan: {
    title: "SCAN SURROUNDING SPACE",
    instruction: "Tap the SCAN button to activate your sensor sweep.",
    subtext: "Scanning reveals nearby contacts and targets.",
    targetAttr: "scan-btn",
  },
  target: {
    title: "SELECT A TARGET",
    instruction:
      "Tap anywhere on the glowing globe to designate a target. Tap a land mass or ocean region.",
    subtext: "iPhone: tap firmly in the center of the globe.",
    targetAttr: "globe-area",
  },
  lock: {
    title: "TARGET ACQUIRED",
    instruction: "Lock confirmed. Weapons are arming.",
    subtext: "Preparing firing solution...",
    autoAdvance: 2000,
  },
  fire: {
    title: "FIRE PRIMARY WEAPON",
    instruction: "Tap a weapon slot to fire at the locked target.",
    subtext: "Pulse Cannon fires immediately.",
    targetAttr: "weapon-deck",
  },
  radar: {
    title: "OBSERVE RADAR SWEEP",
    instruction: "Monitor the tactical radar. Contacts appear as blips.",
    subtext: "Red blips indicate inbound threats.",
    autoAdvance: 3000,
  },
  control_panel: {
    title: "OPEN SYSTEM PANEL",
    instruction: "Tap CMD to access the command dashboard.",
    subtext: "All ship systems are managed here.",
    targetAttr: "cmd-btn",
  },
  complete: {
    title: "CALIBRATION COMPLETE",
    instruction: "All systems operational. Good luck, Commander.",
  },
};

const STEP_LABELS: Record<TutorialStep, string> = {
  intro: "01 / INIT",
  movement: "02 / MOVEMENT",
  scan: "03 / SCAN",
  target: "04 / TARGET",
  lock: "05 / LOCK",
  fire: "06 / FIRE",
  radar: "07 / RADAR",
  control_panel: "08 / PANEL",
  complete: "COMPLETE",
};

const SPOTLIGHT_CLASS = "tutorial-spotlight";

function injectSpotlightStyles() {
  if (document.getElementById("tutorial-spotlight-style")) return;
  const style = document.createElement("style");
  style.id = "tutorial-spotlight-style";
  style.textContent = `
    .tutorial-spotlight {
      outline: 2px solid rgba(0,255,200,0.85) !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 4px rgba(0,255,200,0.18), 0 0 18px 4px rgba(0,255,200,0.28) !important;
      animation: tutorialSpotlight 1.4s ease-in-out infinite !important;
      position: relative;
      z-index: 201 !important;
    }
    @keyframes tutorialSpotlight {
      0%, 100% { outline-color: rgba(0,255,200,0.85); box-shadow: 0 0 0 4px rgba(0,255,200,0.18), 0 0 18px 4px rgba(0,255,200,0.28); }
      50%       { outline-color: rgba(0,255,200,1);    box-shadow: 0 0 0 6px rgba(0,255,200,0.28), 0 0 28px 8px rgba(0,255,200,0.42); }
    }
  `;
  document.head.appendChild(style);
}

function applySpotlight(attr: string | undefined) {
  removeAllSpotlights();
  if (!attr) return;
  const el = document.querySelector<HTMLElement>(
    `[data-tutorial-target="${attr}"]`,
  );
  el?.classList.add(SPOTLIGHT_CLASS);
}

function removeAllSpotlights() {
  for (const el of document.querySelectorAll<HTMLElement>(
    `.${SPOTLIGHT_CLASS}`,
  )) {
    el.classList.remove(SPOTLIGHT_CLASS);
  }
}

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

export default function TutorialOverlay() {
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const currentStep = useTutorialStore((s) => s.currentStep);
  const canSkipCurrentStep = useTutorialStore((s) => s.canSkipCurrentStep);
  const skipTutorial = useTutorialStore((s) => s.skipTutorial);
  const advanceStep = useTutorialStore((s) => s.advanceStep);
  const goBack = useTutorialStore((s) => s.goBack);
  const skipCurrentStep = useTutorialStore((s) => s.skipCurrentStep);

  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spokenStepRef = useRef<TutorialStep | null>(null);
  const [showTargetBypass, setShowTargetBypass] = useState(false);

  useEffect(() => {
    if (currentStep !== "target" || !tutorialActive) {
      setShowTargetBypass(false);
      return;
    }
    const t = setTimeout(() => setShowTargetBypass(true), 8000);
    return () => clearTimeout(t);
  }, [currentStep, tutorialActive]);

  const config = STEP_CONFIG[currentStep];
  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length - 1;
  const canGoBack = BACK_SAFE.has(currentStep);
  const showContinueBypass =
    currentStep === "target" && (showTargetBypass || canSkipCurrentStep);
  // SKIP STEP is available for all guarded steps once stuck timer fires
  const showSkipStep = canSkipCurrentStep && currentStep !== "target";

  useEffect(() => {
    injectSpotlightStyles();
    return () => removeAllSpotlights();
  }, []);

  useEffect(() => {
    if (!tutorialActive || currentStep === "complete") {
      removeAllSpotlights();
      return;
    }
    applySpotlight(config.targetAttr);
    if (voiceTimerRef.current) {
      clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    useSubtitleStore.getState().clear();
    stopSpeech();
    if (spokenStepRef.current !== currentStep) {
      spokenStepRef.current = currentStep;
      const voiceLine = STEP_VOICE[currentStep];
      if (voiceLine) {
        voiceTimerRef.current = setTimeout(() => {
          if (useTutorialStore.getState().currentStep !== currentStep) return;
          if (currentStep === "intro") {
            speakEleven(voiceLine).catch(() => speak(voiceLine));
          } else {
            speak(voiceLine);
          }
        }, 350);
      }
    }
    if (config.autoAdvance) {
      autoTimerRef.current = setTimeout(
        () => advanceStep(),
        config.autoAdvance,
      );
    }
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
      useSubtitleStore.getState().clear();
    };
  }, [tutorialActive, currentStep, config, advanceStep]);

  if (!tutorialActive) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        pointerEvents: "none",
      }}
    >
      {/* dim overlay — pointer-events none so background UI stays accessible */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,8,0.38)",
          pointerEvents: "none",
        }}
      />

      {/* Tutorial card */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(70px, 14vh, 120px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(480px, 92vw)",
          background: "rgba(0,4,14,0.94)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,220,200,0.28)",
          borderRadius: 8,
          padding: "clamp(14px, 2.5vw, 22px) clamp(16px, 3vw, 28px)",
          boxShadow:
            "0 0 30px rgba(0,200,180,0.15), inset 0 0 20px rgba(0,100,150,0.06)",
          pointerEvents: "auto",
          animation: "tutCardIn 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <style>
          {
            "@keyframes tutCardIn { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }"
          }
        </style>

        {/* Header row: step label + progress dots + EXIT */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(7px, 1vw, 9px)",
              letterSpacing: "0.22em",
              color: "rgba(0,220,200,0.6)",
            }}
          >
            {STEP_LABELS[currentStep]}
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {STEP_ORDER.slice(0, totalSteps).map((s, i) => (
              <div
                key={s}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background:
                    i < stepIndex
                      ? "rgba(0,255,200,0.8)"
                      : i === stepIndex
                        ? "rgba(0,255,200,1)"
                        : "rgba(0,100,120,0.4)",
                  boxShadow:
                    i === stepIndex ? "0 0 6px rgba(0,255,200,0.8)" : "none",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
          {/* GUARDRAIL: EXIT is always visible — player is never trapped */}
          <button
            type="button"
            onClick={skipTutorial}
            data-ocid="tutorial.exit.button"
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(7px, 0.9vw, 9px)",
              letterSpacing: "0.2em",
              color: "rgba(255,80,80,0.7)",
              background: "transparent",
              border: "1px solid rgba(255,80,80,0.35)",
              borderRadius: 3,
              padding: "3px 8px",
              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            EXIT
          </button>
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(7px, 0.9vw, 8px)",
            letterSpacing: "0.3em",
            color: "rgba(0,200,255,0.45)",
            marginBottom: 6,
          }}
        >
          A.E.G.I.S.
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(11px, 1.6vw, 15px)",
            letterSpacing: "0.2em",
            fontWeight: 700,
            color: "rgba(0,230,220,0.95)",
            textShadow: "0 0 10px rgba(0,200,200,0.4)",
            marginBottom: 8,
          }}
        >
          {config.title}
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(10px, 1.3vw, 13px)",
            letterSpacing: "0.08em",
            color: "rgba(180,220,255,0.85)",
            lineHeight: 1.55,
            marginBottom: config.subtext ? 6 : 0,
          }}
        >
          {config.instruction}
        </div>
        {config.subtext && (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(8px, 1vw, 10px)",
              letterSpacing: "0.1em",
              color: "rgba(0,180,200,0.5)",
              lineHeight: 1.4,
              marginBottom: 10,
            }}
          >
            {config.subtext}
          </div>
        )}

        {config.autoAdvance && (
          <div
            style={{
              marginTop: 8,
              height: 2,
              background: "rgba(0,80,100,0.3)",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background:
                  "linear-gradient(90deg, rgba(0,200,180,0.5), rgba(0,255,200,0.8))",
                animation: `tutProgress ${config.autoAdvance}ms linear forwards`,
              }}
            />
            <style>
              {
                "@keyframes tutProgress { from { width: 0%; } to { width: 100%; } }"
              }
            </style>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 12,
            flexWrap: "wrap" as const,
          }}
        >
          {canGoBack && stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              style={navBtnStyle("rgba(0,140,160,0.5)")}
            >
              &#8592; BACK
            </button>
          )}
          {showContinueBypass && (
            <button
              type="button"
              onClick={skipCurrentStep}
              data-ocid="tutorial.target.button"
              style={navBtnStyle("rgba(255,180,40,0.9)")}
            >
              CONTINUE &#8594;
            </button>
          )}
          {showSkipStep && (
            <button
              type="button"
              onClick={skipCurrentStep}
              style={navBtnStyle("rgba(255,160,40,0.6)")}
            >
              SKIP STEP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function navBtnStyle(color: string): React.CSSProperties {
  return {
    flex: 1,
    minWidth: 80,
    fontFamily: "monospace",
    fontSize: "clamp(8px, 1vw, 10px)",
    letterSpacing: "0.2em",
    color,
    background: "transparent",
    border: `1px solid ${color}`,
    borderRadius: 4,
    padding: "7px 0",
    cursor: "pointer",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  };
}
