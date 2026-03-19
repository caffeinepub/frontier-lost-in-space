/**
 * AirHandlerIndicator — Compact life support / air recycler readout.
 * Placed in left tactical cluster near VelocityIndicator.
 * Reads oxygenLevel from story store (falls back to 72 if story not active).
 */
import { useStoryStore } from "../../story/useStoryStore";

export default function AirHandlerIndicator() {
  const oxygenLevel = useStoryStore((s) => s.oxygenLevel);
  const powerLevel = useStoryStore((s) => s.powerLevel);

  const oxygen = oxygenLevel ?? 72;
  const isLow = oxygen < 40;
  const isCritical = oxygen < 20;

  const barColor = isCritical ? "#ff3333" : isLow ? "#ff8800" : "#00ffcc";

  const textColor = isCritical
    ? "rgba(255,80,80,0.9)"
    : isLow
      ? "rgba(255,160,60,0.9)"
      : "rgba(0,220,200,0.8)";

  const labelColor = isCritical
    ? "rgba(255,100,100,0.6)"
    : isLow
      ? "rgba(255,160,80,0.5)"
      : "rgba(0,200,180,0.45)";

  const statusText = isCritical ? "CRITICAL" : isLow ? "LOW" : "NOMINAL";

  return (
    <div
      style={{
        pointerEvents: "none",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 3,
        background: "rgba(0,5,18,0.78)",
        border: `1px solid ${isCritical ? "rgba(255,60,60,0.35)" : isLow ? "rgba(255,140,40,0.25)" : "rgba(0,200,180,0.16)"}`,
        borderRadius: 3,
        padding: "5px 8px",
        backdropFilter: "blur(8px)",
        minWidth: 72,
        animation: isCritical
          ? "airCritical 0.9s ease-in-out infinite"
          : "none",
      }}
    >
      <style>{`
        @keyframes airCritical {
          0%, 100% { border-color: rgba(255,60,60,0.35); }
          50% { border-color: rgba(255,60,60,0.7); box-shadow: 0 0 8px rgba(255,40,40,0.3); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 6,
          letterSpacing: "0.22em",
          color: labelColor,
          lineHeight: 1,
        }}
      >
        AIR
      </div>

      {/* Icon + value row */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {/* Air/recycler icon SVG */}
        <svg
          width={14}
          height={14}
          viewBox="0 0 14 14"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle
            cx={7}
            cy={7}
            r={5.5}
            fill="none"
            stroke={barColor}
            strokeWidth={0.8}
            opacity={0.5}
          />
          <path
            d="M7 4 Q9.5 4 9.5 6.5 Q9.5 9 7 9 Q4.5 9 4.5 7"
            fill="none"
            stroke={barColor}
            strokeWidth={1}
            strokeLinecap="round"
          />
          <circle cx={7} cy={7} r={1} fill={barColor} opacity={0.8} />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: textColor,
              lineHeight: 1,
              textShadow: isLow ? `0 0 6px ${barColor}66` : "none",
            }}
          >
            {String(Math.round(oxygen)).padStart(3, "0")}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 5,
              letterSpacing: "0.12em",
              color: labelColor,
              lineHeight: 1,
            }}
          >
            %O2
          </div>
        </div>
      </div>

      {/* Bar + status */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            height: 2,
            background: "rgba(0,60,80,0.4)",
            borderRadius: 1,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${oxygen}%`,
              background: barColor,
              borderRadius: 1,
              transition: "width 1s ease, background 0.3s ease",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 5,
            letterSpacing: "0.16em",
            color: labelColor,
            lineHeight: 1,
          }}
        >
          {statusText}
        </div>
      </div>

      {/* Power row — compact secondary readout */}
      {powerLevel != null && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            fontFamily: "monospace",
            fontSize: 5,
            letterSpacing: "0.1em",
            color: "rgba(0,180,255,0.3)",
            lineHeight: 1,
          }}
        >
          <span>PWR</span>
          <span>{Math.round(powerLevel)}%</span>
        </div>
      )}
    </div>
  );
}
