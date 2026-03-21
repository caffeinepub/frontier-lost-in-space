/**
 * CEPStatusPanel — Dedicated CEP level indicator anchored to the
 * left edge of the globe viewport, mid-screen.
 *
 * Displays:
 *  - Current CEP level code (L0–L5)
 *  - Short label (DORMANT, PASSIVE SCAN, etc.)
 *  - A 6-pip progress bar
 *  - Pulses / glows at L4–L5
 *
 * STABLE SELECTOR RULES: raw primitives only.
 */
import { CEP_LEVELS } from "../../cep/useCEPStore";
import { useCEPStore } from "../../cep/useCEPStore";

export default function CEPStatusPanel() {
  const level = useCEPStore((s) => s.level);
  const def = CEP_LEVELS[level];
  const isCritical = level >= 4;
  const isWarning = level === 3;

  const borderColor = isCritical
    ? "rgba(255,60,30,0.7)"
    : isWarning
      ? "rgba(255,160,30,0.55)"
      : "rgba(0,180,200,0.25)";

  const labelColor = def.color;

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 20,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        background: "rgba(0,5,14,0.72)",
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        padding: "7px 10px",
        backdropFilter: "blur(4px)",
        minWidth: 68,
        animation: isCritical
          ? "cep-panel-blink 1.2s ease-in-out infinite"
          : undefined,
      }}
    >
      <style>{`
        @keyframes cep-panel-blink {
          0%, 100% { box-shadow: 0 0 6px rgba(255,50,20,0.3); }
          50%       { box-shadow: 0 0 14px rgba(255,50,20,0.7); }
        }
      `}</style>

      {/* Header label */}
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "0.42rem",
          letterSpacing: "0.2em",
          color: "rgba(0,180,200,0.45)",
          lineHeight: 1,
        }}
      >
        CEP
      </span>

      {/* Level code */}
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: labelColor,
          lineHeight: 1,
        }}
      >
        {def.code}
      </span>

      {/* Short label */}
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "0.38rem",
          letterSpacing: "0.12em",
          color: labelColor,
          opacity: 0.8,
          lineHeight: 1,
          maxWidth: 60,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {def.label}
      </span>

      {/* 6-pip bar */}
      <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
        {CEP_LEVELS.map((d) => (
          <div
            key={d.level}
            style={{
              width: 6,
              height: 4,
              borderRadius: 1,
              background: d.level <= level ? d.color : "rgba(0,80,100,0.3)",
              transition: "background 0.4s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
