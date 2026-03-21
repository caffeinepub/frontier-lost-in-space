/**
 * DiagnosticHUD.tsx — Live floating diagnostic overlay
 * Activation: localStorage.setItem('debug_diag', '1') + reload
 */
import { useEffect } from "react";
import { useCEPStore } from "../../cep/useCEPStore";
import { useIntroPhaseStore } from "../../intro/useIntroPhaseStore";
import { useNarrativeStore } from "../../narrative/useNarrativeStore";
import { useGameState } from "../../state/useGameState";

export default function DiagnosticHUD() {
  const isEnabled =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("debug_diag") === "1";

  const mode = useGameState((s) => s.mode);
  const currentPhase = useIntroPhaseStore((s) => s.currentPhase);
  const activeEventId = useNarrativeStore((s) => s.activeEventId);
  const eventQueueLength = useNarrativeStore((s) => s.eventQueue.length);
  const cepLevel = useCEPStore((s) => s.level);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).frontierDiag = () => {
      const game = useGameState.getState();
      const intro = useIntroPhaseStore.getState();
      const narrative = useNarrativeStore.getState();
      const cep = useCEPStore.getState();
      console.table({
        mode: game.mode,
        introPhase: intro.currentPhase,
        phaseComplete: intro.phaseComplete,
        activeEvent: narrative.activeEventId,
        eventQueue: narrative.eventQueue.length,
        triggeredEvents: narrative.triggeredEventIds.length,
        cepLevel: cep.level,
      });
    };
  }, []);

  if (!isEnabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 32,
        left: 8,
        fontFamily: "monospace",
        fontSize: 9,
        lineHeight: 1.7,
        letterSpacing: "0.1em",
        color: "rgba(0,220,255,0.85)",
        background: "rgba(0,0,12,0.82)",
        border: "1px solid rgba(0,160,200,0.25)",
        borderRadius: 3,
        padding: "5px 9px",
        pointerEvents: "none",
        zIndex: 99990,
        minWidth: 160,
      }}
    >
      <div style={{ color: "rgba(0,180,220,0.5)", marginBottom: 3 }}>
        ◈ FRONTIER DIAG
      </div>
      <div>
        <span style={{ color: "rgba(0,140,160,0.6)" }}>MODE: </span>
        <span style={{ color: "rgba(0,230,255,0.9)" }}>
          {mode.toUpperCase()}
        </span>
      </div>
      <div>
        <span style={{ color: "rgba(0,140,160,0.6)" }}>PHASE: </span>
        <span style={{ color: "rgba(0,200,220,0.85)" }}>
          {currentPhase ?? "—"}
        </span>
      </div>
      <div>
        <span style={{ color: "rgba(0,140,160,0.6)" }}>EVENT: </span>
        <span style={{ color: "rgba(0,200,220,0.85)" }}>
          {activeEventId ?? "none"}
        </span>
      </div>
      <div>
        <span style={{ color: "rgba(0,140,160,0.6)" }}>CEP: </span>
        <span
          style={{
            color:
              cepLevel >= 4
                ? "rgba(255,80,60,0.95)"
                : cepLevel >= 2
                  ? "rgba(255,180,40,0.9)"
                  : "rgba(0,210,180,0.85)",
          }}
        >
          L{cepLevel}
        </span>
      </div>
      <div>
        <span style={{ color: "rgba(0,140,160,0.6)" }}>QUEUE: </span>
        <span style={{ color: "rgba(0,200,220,0.85)" }}>
          {eventQueueLength}
        </span>
      </div>
    </div>
  );
}
