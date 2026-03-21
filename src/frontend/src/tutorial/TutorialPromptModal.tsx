/**
 * TutorialPromptModal.tsx
 *
 * Gate shown when the player first enters TacticalStage.
 * Gives 3 explicit choices — nothing auto-starts without consent.
 *
 * START TUTORIAL     → calls startTutorial() immediately
 * SKIP FOR NOW       → closes modal, tutorial stays available later
 * DON'T SHOW AGAIN   → marks tutorialSkipped=true, never prompts again
 */
import { useEffect, useState } from "react";
import { useTutorialStore } from "./useTutorialStore";

interface TutorialPromptModalProps {
  onClose: () => void;
}

export default function TutorialPromptModal({
  onClose,
}: TutorialPromptModalProps) {
  const startTutorial = useTutorialStore((s) => s.startTutorial);
  const skipTutorial = useTutorialStore((s) => s.skipTutorial);
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  function handleStart() {
    startTutorial();
    onClose();
  }

  function handleSkipForNow() {
    // Don't mark as skipped permanently — just close
    onClose();
  }

  function handleNeverShow() {
    // Mark as permanently skipped via skipTutorial
    skipTutorial();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,2,10,0.72)",
        backdropFilter: "blur(4px)",
        pointerEvents: "auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}
    >
      <div
        style={{
          width: "min(420px, 90vw)",
          background: "rgba(0,4,16,0.97)",
          border: "1px solid rgba(0,200,220,0.22)",
          borderRadius: 8,
          padding: "clamp(18px, 3vw, 28px) clamp(18px, 3vw, 32px)",
          boxShadow:
            "0 0 40px rgba(0,180,200,0.12), inset 0 0 30px rgba(0,80,120,0.06)",
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "transform 0.35s ease",
        }}
      >
        {/* A.E.G.I.S. label */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(7px, 0.9vw, 9px)",
            letterSpacing: "0.3em",
            color: "rgba(0,200,255,0.4)",
            marginBottom: 10,
          }}
        >
          A.E.G.I.S. — CALIBRATION
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(13px, 2vw, 17px)",
            letterSpacing: "0.18em",
            fontWeight: 700,
            color: "rgba(0,230,220,0.95)",
            textShadow: "0 0 12px rgba(0,200,200,0.35)",
            marginBottom: 14,
          }}
        >
          RUN TRAINING SEQUENCE?
        </div>

        {/* Body */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(10px, 1.3vw, 12px)",
            letterSpacing: "0.07em",
            color: "rgba(160,210,240,0.75)",
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          A calibration sequence is available. It will walk you through
          movement, targeting, and weapons systems.
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: "clamp(8px, 1vw, 10px)",
            letterSpacing: "0.1em",
            color: "rgba(0,160,180,0.45)",
            marginBottom: 22,
          }}
        >
          You can exit the tutorial at any time.
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(0,140,180,0.15)",
            marginBottom: 18,
          }}
        />

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* PRIMARY — Start */}
          <button
            type="button"
            onClick={handleStart}
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.3vw, 12px)",
              letterSpacing: "0.2em",
              color: "rgba(0,240,220,0.95)",
              background: "rgba(0,80,100,0.35)",
              border: "1px solid rgba(0,200,200,0.45)",
              borderRadius: 5,
              padding: "12px 0",
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
              transition: "background 0.15s, border-color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,100,120,0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(0,80,100,0.35)";
            }}
          >
            START TUTORIAL
          </button>

          {/* SECONDARY — Skip for now */}
          <button
            type="button"
            onClick={handleSkipForNow}
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(10px, 1.3vw, 12px)",
              letterSpacing: "0.2em",
              color: "rgba(0,180,210,0.7)",
              background: "transparent",
              border: "1px solid rgba(0,140,180,0.28)",
              borderRadius: 5,
              padding: "11px 0",
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
              transition: "border-color 0.15s, color 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(0,220,255,0.9)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(0,180,220,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(0,180,210,0.7)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(0,140,180,0.28)";
            }}
          >
            SKIP FOR NOW
          </button>

          {/* TERTIARY — Never show again */}
          <button
            type="button"
            onClick={handleNeverShow}
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(8px, 1vw, 10px)",
              letterSpacing: "0.18em",
              color: "rgba(140,140,160,0.45)",
              background: "transparent",
              border: "none",
              padding: "8px 0",
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            DON'T SHOW AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
