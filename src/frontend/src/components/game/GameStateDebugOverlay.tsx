/**
 * GameStateDebugOverlay.tsx
 * Real-time game state debug overlay — activate via:
 *   localStorage.setItem('debug_gamestate', '1')
 *
 * Shows: mode, scene/phase, intro engine index, narrative event active,
 *        input handler active, CEP level
 *
 * Position: top-left (offset to avoid overlap with other debug overlays)
 * Style: dark bg, green monospace, 0.68rem font
 * pointer-events: none — never blocks gameplay
 */
import { useCEPStore } from "../../cep/useCEPStore";
import { useIntroEventEngine } from "../../intro/useIntroEventEngine";
import { useIntroPhaseStore } from "../../intro/useIntroPhaseStore";
import { useNarrativeStore } from "../../narrative/useNarrativeStore";
import { useGameState } from "../../state/useGameState";

export default function GameStateDebugOverlay() {
  // Guard: only show when debug flag is set
  if (typeof localStorage !== "undefined") {
    if (localStorage.getItem("debug_gamestate") !== "1") return null;
  } else {
    return null;
  }

  return <GameStateDebugInner />;
}

function GameStateDebugInner() {
  const mode = useGameState((s) => s.mode);
  const currentPhase = useIntroPhaseStore((s) => s.currentPhase);
  const phaseComplete = useIntroPhaseStore((s) => s.phaseComplete);
  const introEventIndex = useIntroEventEngine((s) => s.introEventIndex);
  const introSequenceComplete = useIntroEventEngine(
    (s) => s.introSequenceComplete,
  );
  const activeEventId = useNarrativeStore((s) => s.activeEventId);
  const isDismissed = useNarrativeStore((s) => s.isDismissed);
  const cepLevel = useCEPStore((s) => s.level);

  const eventActive = activeEventId !== null && !isDismissed;

  // Log to console on each render for easy debugging
  console.log("[GameStateDebug]", {
    mode,
    currentPhase,
    phaseComplete,
    introEventIndex,
    introSequenceComplete,
    activeEventId,
    eventActive,
    cepLevel,
  });

  const row = (label: string, value: string | number | boolean | null) => (
    <div
      key={label}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        borderBottom: "1px solid rgba(0,255,136,0.06)",
        paddingBottom: 2,
      }}
    >
      <span style={{ color: "rgba(0,200,100,0.55)", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          color:
            value === null
              ? "rgba(255,80,80,0.7)"
              : value === true
                ? "rgba(0,255,136,0.9)"
                : value === false
                  ? "rgba(200,100,100,0.8)"
                  : "rgba(0,255,136,0.8)",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value === null
          ? "null"
          : value === true
            ? "true"
            : value === false
              ? "false"
              : String(value)}
      </span>
    </div>
  );

  return (
    <div
      data-ocid="debug.gamestate.panel"
      style={{
        position: "fixed",
        top: 42,
        left: 8,
        zIndex: 99997,
        pointerEvents: "none",
        background: "rgba(0,6,14,0.88)",
        border: "1px solid rgba(0,255,136,0.18)",
        borderLeft: "2px solid rgba(0,255,136,0.5)",
        borderRadius: 3,
        padding: "6px 10px",
        fontFamily: "monospace",
        fontSize: "0.68rem",
        lineHeight: 1.75,
        width: 210,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          color: "rgba(0,255,136,0.45)",
          letterSpacing: "0.2em",
          fontSize: "0.58rem",
          marginBottom: 5,
          borderBottom: "1px solid rgba(0,255,136,0.12)",
          paddingBottom: 4,
        }}
      >
        GAME STATE DEBUG
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {row("MODE", mode)}
        {row("SCENE", currentPhase ?? "none")}
        {row("PHASE_DONE", phaseComplete)}
        {row("EVENT_IDX", introEventIndex)}
        {row("SEQ_DONE", introSequenceComplete)}
        {row("EVENT_ID", activeEventId)}
        {row("INPUT_ACTIVE", eventActive)}
        {row("CEP_LEVEL", cepLevel)}
      </div>
    </div>
  );
}
