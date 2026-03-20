/**
 * CockpitReticle — SVG tactical reticle with N/S/E/W markers and mode toggle.
 * Mounted to HUD layer. pointerEvents: none. Does NOT follow globe.
 */
import { useState } from "react";

type ReticleMode = "standard" | "radar" | "heatmap";

const MODE_COLORS: Record<
  ReticleMode,
  { primary: string; secondary: string; bg: string }
> = {
  standard: {
    primary: "rgba(0,220,255,0.7)",
    secondary: "rgba(0,180,255,0.4)",
    bg: "transparent",
  },
  radar: {
    primary: "rgba(0,220,100,0.8)",
    secondary: "rgba(0,180,80,0.4)",
    bg: "rgba(0,40,0,0.08)",
  },
  heatmap: {
    primary: "rgba(255,160,40,0.7)",
    secondary: "rgba(255,120,20,0.4)",
    bg: "rgba(40,10,0,0.08)",
  },
};

const COMPASS_POINTS = [
  { label: "N", dx: 0, dy: -1 },
  { label: "S", dx: 0, dy: 1 },
  { label: "E", dx: 1, dy: 0 },
  { label: "W", dx: -1, dy: 0 },
];

const CROSS_SEGMENTS = [
  { name: "left" },
  { name: "right" },
  { name: "top" },
  { name: "bottom" },
];

const TICK_DEGS = [0, 90, 180, 270];

export default function CockpitReticle({
  portrait = false,
}: { portrait?: boolean }) {
  const [mode, setMode] = useState<ReticleMode>("standard");
  const size = portrait ? 120 : 180;
  const cx = size / 2;
  const cy = size / 2;
  const r1 = portrait ? 46 : 70;
  const r2 = portrait ? 22 : 33;
  const crossLen = portrait ? 16 : 22;
  const gapLen = portrait ? 6 : 9;
  const textOff = portrait ? 12 : 15;
  const { primary, secondary, bg } = MODE_COLORS[mode];
  const modes: ReticleMode[] = ["standard", "radar", "heatmap"];

  const crossCoords = [
    [cx - gapLen - crossLen, cy, cx - gapLen, cy],
    [cx + gapLen, cy, cx + gapLen + crossLen, cy],
    [cx, cy - gapLen - crossLen, cx, cy - gapLen],
    [cx, cy + gapLen, cx, cy + gapLen + crossLen],
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Mode toggle */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 3,
          pointerEvents: "auto",
          zIndex: 4,
        }}
      >
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              fontFamily: "monospace",
              fontSize: 6,
              letterSpacing: "0.1em",
              color:
                mode === m ? MODE_COLORS[m].primary : "rgba(0,140,180,0.4)",
              background: mode === m ? "rgba(0,30,50,0.8)" : "transparent",
              border: `1px solid ${
                mode === m ? MODE_COLORS[m].primary : "rgba(0,100,140,0.2)"
              }`,
              borderRadius: 2,
              padding: "2px 4px",
              cursor: "pointer",
              textTransform: "uppercase",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", width: size, height: size }}>
        {bg !== "transparent" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: bg,
              pointerEvents: "none",
            }}
          />
        )}

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            opacity: 0.85,
            overflow: "visible",
            position: "absolute",
            inset: 0,
          }}
          aria-hidden="true"
        >
          <defs>
            <style>
              {`
                @keyframes reticle-spin {
                  from { transform-origin: ${cx}px ${cy}px; transform: rotate(0deg); }
                  to   { transform-origin: ${cx}px ${cy}px; transform: rotate(360deg); }
                }
                @keyframes reticle-scan {
                  from { transform-origin: ${cx}px ${cy}px; transform: rotate(0deg); }
                  to   { transform-origin: ${cx}px ${cy}px; transform: rotate(360deg); }
                }
                @keyframes reticle-pulse {
                  0%, 100% { opacity: 0.5; }
                  50%       { opacity: 1; }
                }
                .reticle-slow-spin { animation: reticle-spin 120s linear infinite; }
                .reticle-scan      { animation: reticle-scan 4s linear infinite; }
                .reticle-pulse     { animation: reticle-pulse 2.5s ease-in-out infinite; }
              `}
            </style>
          </defs>

          {/* Outer ring */}
          <g className="reticle-slow-spin">
            <circle
              cx={cx}
              cy={cy}
              r={r1}
              fill="none"
              stroke={primary}
              strokeWidth="0.6"
              strokeDasharray={`${portrait ? 8 : 12} ${portrait ? 6 : 9}`}
            />
          </g>

          {/* Radar sweep */}
          {mode === "radar" && (
            <g className="reticle-scan">
              <path
                d={`M ${cx} ${cy} L ${cx} ${cy - r1} A ${r1} ${r1} 0 0 1 ${
                  cx + r1 * 0.87
                } ${cy - r1 * 0.5} Z`}
                fill={`${primary}18`}
                stroke="none"
              />
            </g>
          )}

          {/* Inner ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r2}
            fill="none"
            stroke={secondary}
            strokeWidth="0.5"
            strokeDasharray="2 4"
            className="reticle-pulse"
          />

          {/* Crosshair */}
          {CROSS_SEGMENTS.map((seg, i) => {
            const [x1, y1, x2, y2] = crossCoords[i];
            return (
              <line
                key={seg.name}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={primary}
                strokeWidth="0.8"
              />
            );
          })}

          {/* Center dot */}
          <circle
            cx={cx}
            cy={cy}
            r={1.5}
            fill={primary}
            className="reticle-pulse"
          />

          {/* Compass markers */}
          {COMPASS_POINTS.map(({ label, dx, dy }) => {
            const x = cx + dx * (r1 + textOff);
            const y = cy + dy * (r1 + textOff) + 4;
            return (
              <text
                key={label}
                x={x}
                y={y}
                fill={primary}
                fontSize={portrait ? 7 : 8}
                fontFamily="monospace"
                textAnchor="middle"
                letterSpacing="0.2em"
                opacity="0.7"
              >
                {label}
              </text>
            );
          })}

          {/* Tick marks */}
          {TICK_DEGS.map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const tx = cx + Math.cos(rad) * r1;
            const ty = cy + Math.sin(rad) * r1;
            const nx = Math.cos(rad);
            const ny = Math.sin(rad);
            return (
              <line
                key={deg}
                x1={tx - nx * 5}
                y1={ty - ny * 5}
                x2={tx + nx * 5}
                y2={ty + ny * 5}
                stroke={primary}
                strokeWidth="1.2"
                opacity="0.9"
              />
            );
          })}

          {/* Heatmap gradient */}
          {mode === "heatmap" && (
            <>
              <defs>
                <radialGradient id="heatGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,60,0,0)" />
                  <stop offset="60%" stopColor="rgba(255,120,0,0)" />
                  <stop offset="85%" stopColor="rgba(255,160,40,0.08)" />
                  <stop offset="100%" stopColor="rgba(255,60,0,0.15)" />
                </radialGradient>
              </defs>
              <circle cx={cx} cy={cy} r={r1} fill="url(#heatGrad)" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
