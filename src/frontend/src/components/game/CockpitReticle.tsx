/**
 * CockpitReticle — faint CSS/SVG targeting scope overlay on the front window.
 * Renders a subtle sci-fi crosshair with range rings and hardpoint cue marks.
 * pointer-events: none at all times.
 */
export default function CockpitReticle({
  portrait = false,
}: { portrait?: boolean }) {
  const size = portrait ? 120 : 180;
  const cx = size / 2;
  const cy = size / 2;
  const r1 = portrait ? 46 : 70; // outer ring
  const r2 = portrait ? 22 : 33; // inner ring
  const dashLen = portrait ? 10 : 15;

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
      {/* Main targeting scope */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ opacity: 0.28, overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          <style>{`
            @keyframes reticle-spin {
              from { transform-origin: ${cx}px ${cy}px; transform: rotate(0deg); }
              to   { transform-origin: ${cx}px ${cy}px; transform: rotate(360deg); }
            }
            @keyframes reticle-pulse {
              0%, 100% { opacity: 0.55; }
              50%       { opacity: 0.85; }
            }
            .reticle-slow-spin { animation: reticle-spin 18s linear infinite; }
            .reticle-pulse     { animation: reticle-pulse 3s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* Outer ring — slow rotation */}
        <g className="reticle-slow-spin">
          <circle
            cx={cx}
            cy={cy}
            r={r1}
            fill="none"
            stroke="rgba(0,220,255,0.7)"
            strokeWidth="0.6"
            strokeDasharray={`${dashLen} ${r1 * 0.22}`}
          />
          {/* Tick marks on outer ring at 12/3/6/9 */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const tx = cx + Math.cos(rad) * r1;
            const ty = cy + Math.sin(rad) * r1;
            const nx = Math.cos(rad);
            const ny = Math.sin(rad);
            return (
              <line
                key={deg}
                x1={tx - nx * 6}
                y1={ty - ny * 6}
                x2={tx + nx * 6}
                y2={ty + ny * 6}
                stroke="rgba(0,255,200,0.9)"
                strokeWidth="1"
              />
            );
          })}
        </g>

        {/* Inner ring — pulsing */}
        <circle
          cx={cx}
          cy={cy}
          r={r2}
          fill="none"
          stroke="rgba(0,220,255,0.5)"
          strokeWidth="0.5"
          strokeDasharray="2 4"
          className="reticle-pulse"
        />

        {/* Center dot */}
        <circle
          cx={cx}
          cy={cy}
          r={1.5}
          fill="rgba(0,255,200,0.7)"
          className="reticle-pulse"
        />

        {/* Crosshair arms — stop short of center */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const inner = r2 + 4;
          const outer = r1 - 6;
          return (
            <line
              key={`arm-${deg}`}
              x1={cx + Math.cos(rad) * inner}
              y1={cy + Math.sin(rad) * inner}
              x2={cx + Math.cos(rad) * outer}
              y2={cy + Math.sin(rad) * outer}
              stroke="rgba(0,200,255,0.45)"
              strokeWidth="0.6"
            />
          );
        })}

        {/* Diagonal hash marks between rings */}
        {[45, 135, 225, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const mid = (r1 + r2) / 2;
          const tx = cx + Math.cos(rad) * mid;
          const ty = cy + Math.sin(rad) * mid;
          const nx = Math.cos(rad);
          const ny = Math.sin(rad);
          return (
            <line
              key={`hash-${deg}`}
              x1={tx - nx * 4}
              y1={ty - ny * 4}
              x2={tx + nx * 4}
              y2={ty + ny * 4}
              stroke="rgba(0,200,255,0.3)"
              strokeWidth="0.7"
            />
          );
        })}
      </svg>

      {/* Hardpoint cue marks — left and right lower edges */}
      {!portrait && (
        <>
          {/* Left hardpoint emitter */}
          <svg
            width="36"
            height="20"
            viewBox="0 0 36 20"
            style={{
              position: "absolute",
              bottom: "18%",
              left: "calc(50% - 130px)",
              opacity: 0.32,
            }}
            aria-hidden="true"
          >
            {/* Barrel silhouette pointing right */}
            <rect
              x="2"
              y="8"
              width="22"
              height="3"
              fill="rgba(0,200,255,0.6)"
              rx="1"
            />
            <rect
              x="20"
              y="6"
              width="14"
              height="7"
              fill="none"
              stroke="rgba(0,200,255,0.5)"
              strokeWidth="0.7"
              rx="1"
            />
            <circle cx="3" cy="9.5" r="2" fill="rgba(0,200,255,0.4)" />
            {/* Energy emitter glow */}
            <circle cx="34" cy="9.5" r="1.5" fill="rgba(0,255,200,0.8)">
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>

          {/* Right hardpoint emitter */}
          <svg
            width="36"
            height="20"
            viewBox="0 0 36 20"
            style={{
              position: "absolute",
              bottom: "18%",
              right: "calc(50% - 130px)",
              opacity: 0.32,
              transform: "scaleX(-1)",
            }}
            aria-hidden="true"
          >
            <rect
              x="2"
              y="8"
              width="22"
              height="3"
              fill="rgba(0,200,255,0.6)"
              rx="1"
            />
            <rect
              x="20"
              y="6"
              width="14"
              height="7"
              fill="none"
              stroke="rgba(0,200,255,0.5)"
              strokeWidth="0.7"
              rx="1"
            />
            <circle cx="3" cy="9.5" r="2" fill="rgba(0,200,255,0.4)" />
            <circle cx="34" cy="9.5" r="1.5" fill="rgba(0,255,200,0.8)">
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="2.1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>

          {/* Center missile bay indicator */}
          <svg
            width="28"
            height="14"
            viewBox="0 0 28 14"
            style={{
              position: "absolute",
              bottom: "14%",
              left: "50%",
              transform: "translateX(-50%)",
              opacity: 0.25,
            }}
            aria-hidden="true"
          >
            <rect
              x="2"
              y="2"
              width="24"
              height="10"
              fill="none"
              stroke="rgba(255,100,68,0.6)"
              strokeWidth="0.7"
              rx="1"
              strokeDasharray="3 2"
            />
            <circle cx="14" cy="7" r="2" fill="rgba(255,100,68,0.4)" />
          </svg>
        </>
      )}
    </div>
  );
}
