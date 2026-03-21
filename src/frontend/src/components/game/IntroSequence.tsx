import { useIntroPhaseStore } from "../../intro/useIntroPhaseStore";
/**
 * IntroSequence.tsx
 * BUG FIX: background changed from solid #000010 to rgba(0,0,16,0.65)
 * so TacticalStage (cockpit) shows through underneath.
 */
import { useGameState } from "../../state/useGameState";
import IntroPhaseController from "./IntroPhaseController";
import NarrativeEventPanel from "./NarrativeEventPanel";

export default function IntroSequence() {
  const currentPhase = useIntroPhaseStore((s) => s.currentPhase);
  const phaseComplete = useIntroPhaseStore((s) => s.phaseComplete);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,16,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        fontFamily: "monospace",
        zIndex: 200,
      }}
    >
      <IntroPhaseController />

      <div
        style={{
          color: "rgba(0,200,255,0.55)",
          letterSpacing: "0.5em",
          fontSize: "clamp(9px, 1.3vw, 13px)",
        }}
      >
        FRONTIER
      </div>

      <div
        style={{
          color: "rgba(0,150,180,0.35)",
          fontSize: "clamp(7px, 0.9vw, 9px)",
          letterSpacing: "0.3em",
          minHeight: 14,
        }}
      >
        {phaseComplete
          ? "INITIALIZING TACTICAL SYSTEMS…"
          : currentPhase
            ? currentPhase.replace("INTRO_", "").replace("_", " ")
            : "BOOTING"}
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[
          "INTRO_DRIFT",
          "INTRO_SYSTEMS",
          "INTRO_RECOVERY",
          "INTRO_ANOMALY",
          "INTRO_HANDOFF",
        ].map((phase) => {
          const isActive = currentPhase === phase;
          const phaseOrder = [
            "INTRO_DRIFT",
            "INTRO_SYSTEMS",
            "INTRO_RECOVERY",
            "INTRO_ANOMALY",
            "INTRO_HANDOFF",
          ];
          const isDone =
            currentPhase !== null &&
            phaseOrder.indexOf(currentPhase) > phaseOrder.indexOf(phase);
          return (
            <div
              key={phase}
              style={{
                width: isActive ? 16 : 5,
                height: 3,
                borderRadius: 2,
                background: isActive
                  ? "rgba(0,200,220,0.7)"
                  : isDone
                    ? "rgba(0,160,180,0.4)"
                    : "rgba(0,80,100,0.25)",
                transition: "all 0.4s ease",
              }}
            />
          );
        })}
      </div>

      <button
        type="button"
        data-ocid="intro.skip_button"
        onClick={() => useGameState.getState().setMode("game")}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "transparent",
          border: "none",
          color: "rgba(0,140,160,0.28)",
          fontFamily: "monospace",
          fontSize: "clamp(7px, 0.9vw, 9px)",
          letterSpacing: "0.2em",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          padding: "4px 8px",
        }}
      >
        SKIP INTRO
      </button>

      <NarrativeEventPanel />
    </div>
  );
}
