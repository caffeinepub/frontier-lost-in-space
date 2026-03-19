/**
 * VelocityIndicator — compact HUD readout for ship orbital speed + heading.
 * Reads velTheta/velPhi from useShipStore.
 * Shows: speed value (scaled to readable units) + direction arrow.
 * pointer-events: none at all times.
 */
import { useShipStore } from "../../motion/useShipStore";

const RAD_TO_DEG = 180 / Math.PI;

export default function VelocityIndicator() {
  const velTheta = useShipStore((s) => s.velTheta);
  const velPhi = useShipStore((s) => s.velPhi);

  const speed = Math.sqrt(velTheta * velTheta + velPhi * velPhi);
  const displaySpeed = Math.min(999, Math.round(speed * 2200));
  const isMoving = speed > 0.00005;

  // Compass bearing: 0° = North (decreasing phi)
  const headingRad = Math.atan2(velTheta, -velPhi);
  const headingDeg = ((headingRad * RAD_TO_DEG + 360) % 360).toFixed(0);

  // Arrow rotation in SVG (rotate from up/north)
  const arrowDeg = isMoving ? headingRad * RAD_TO_DEG : 0;

  const activeColor = isMoving ? "#00ffcc" : "rgba(0,200,255,0.3)";
  const dimColor = "rgba(0,180,255,0.35)";

  return (
    <div
      style={{
        pointerEvents: "none",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 3,
        background: "rgba(0,5,18,0.78)",
        border: "1px solid rgba(0,200,255,0.16)",
        borderRadius: 3,
        padding: "5px 8px",
        backdropFilter: "blur(8px)",
        minWidth: 72,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 6,
          letterSpacing: "0.22em",
          color: "rgba(0,200,255,0.45)",
          lineHeight: 1,
        }}
      >
        VEL
      </div>

      {/* Speed + arrow row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Direction arrow SVG */}
        <svg
          width={18}
          height={18}
          viewBox="-9 -9 18 18"
          style={{ flexShrink: 0, overflow: "visible" }}
          aria-hidden="true"
        >
          {/* Range ring */}
          <circle
            cx={0}
            cy={0}
            r={7}
            fill="none"
            stroke="rgba(0,200,255,0.18)"
            strokeWidth={0.6}
          />
          {/* Arrow group — rotated to heading */}
          <g
            transform={`rotate(${arrowDeg})`}
            style={{ transition: "transform 0.15s ease" }}
          >
            {/* Shaft */}
            <line
              x1={0}
              y1={5}
              x2={0}
              y2={-4}
              stroke={activeColor}
              strokeWidth={1.4}
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <polygon points="0,-7 2.2,-3 -2.2,-3" fill={activeColor} />
          </g>
          {/* Center dot */}
          <circle cx={0} cy={0} r={1} fill={activeColor} />
        </svg>

        {/* Speed value */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: activeColor,
              lineHeight: 1,
              textShadow: isMoving ? "0 0 6px rgba(0,255,200,0.4)" : "none",
            }}
          >
            {String(displaySpeed).padStart(3, "0")}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 5,
              letterSpacing: "0.14em",
              color: dimColor,
              lineHeight: 1,
            }}
          >
            KM/S
          </div>
        </div>
      </div>

      {/* Heading row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontFamily: "monospace",
          fontSize: 6,
          letterSpacing: "0.1em",
          color: isMoving ? "rgba(0,200,255,0.65)" : "rgba(0,180,255,0.22)",
          lineHeight: 1,
        }}
      >
        <span>HDG</span>
        <span>{headingDeg}\u00b0</span>
      </div>
    </div>
  );
}
