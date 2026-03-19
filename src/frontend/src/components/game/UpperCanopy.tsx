export default function UpperCanopy() {
  const W = 1440;
  const H = 900;

  const edgeDepth = 110;
  const centerDip = 20;
  const innerEdgeLeft = edgeDepth;
  const innerEdgeRight = edgeDepth;
  const innerEdgeCenter = centerDip;

  const canopyPath = [
    "M 0 0",
    `L ${W} 0`,
    `L ${W} ${innerEdgeRight}`,
    `Q ${W * 0.5} ${innerEdgeCenter} 0 ${innerEdgeLeft}`,
    "Z",
  ].join(" ");

  const glowStripPath = [
    `M 0 ${innerEdgeLeft}`,
    `Q ${W * 0.5} ${innerEdgeCenter} ${W} ${innerEdgeRight}`,
  ].join(" ");

  // Secondary depth arc 8px below main strip
  const secondaryArcPath = [
    `M 0 ${innerEdgeLeft + 8}`,
    `Q ${W * 0.5} ${innerEdgeCenter + 8} ${W} ${innerEdgeRight + 8}`,
  ].join(" ");

  const bevelPath = [
    `M 4 ${innerEdgeLeft - 6}`,
    `Q ${W * 0.5} ${innerEdgeCenter - 8} ${W - 4} ${innerEdgeRight - 6}`,
  ].join(" ");

  // Glass reflection diagonal band
  const glassReflectPath = [
    `M ${W * 0.25} 0`,
    `L ${W * 0.45} 0`,
    `Q ${W * 0.48} ${innerEdgeCenter * 0.6} ${W * 0.38} ${innerEdgeLeft * 0.7}`,
    `L ${W * 0.2} ${innerEdgeLeft * 0.5}`,
    "Z",
  ].join(" ");

  const notchCount = 4;
  const notches = Array.from({ length: notchCount }, (_, i) => {
    const t = (i + 1) / (notchCount + 1);
    const x = W * t;
    const arcY =
      innerEdgeLeft + (innerEdgeCenter - innerEdgeLeft) * Math.sin(t * Math.PI);
    return { x, y: arcY, id: `notch-${i}` };
  });

  const lights = [
    { x: W * 0.88, y: 22, color: "rgba(0,220,255,0.95)", id: "lt-0" },
    { x: W * 0.9, y: 18, color: "rgba(255,180,0,0.9)", id: "lt-1" },
    { x: W * 0.92, y: 22, color: "rgba(0,220,255,0.95)", id: "lt-2" },
    { x: W * 0.08, y: 22, color: "rgba(0,220,255,0.7)", id: "lt-3" },
    { x: W * 0.1, y: 18, color: "rgba(255,180,0,0.6)", id: "lt-4" },
  ];

  const panelLines = [
    { x1: W * 0.12, y1: 28, x2: W * 0.38, y2: 22, id: "pl-0" },
    { x1: W * 0.62, y1: 22, x2: W * 0.82, y2: 26, id: "pl-1" },
    { x1: W * 0.15, y1: 36, x2: W * 0.32, y2: 32, id: "pl-2" },
    { x1: W * 0.68, y1: 32, x2: W * 0.78, y2: 34, id: "pl-3" },
  ];

  const bracketLen = 44;

  return (
    <>
      <svg
        className="cockpit-canopy-desktop"
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Cockpit upper canopy"
      >
        <title>Cockpit upper canopy</title>
        <defs>
          <filter id="canopy-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="strip-glow-wide"
            x="-10%"
            y="-400%"
            width="120%"
            height="900%"
          >
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="strip-glow-tight"
            x="-10%"
            y="-300%"
            width="120%"
            height="700%"
          >
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @media (max-width: 767px) {
              .cockpit-canopy-desktop { display: none; }
              .cockpit-canopy-mobile { display: block !important; }
            }
            @media (min-width: 768px) {
              .cockpit-canopy-mobile { display: none !important; }
            }
          `}</style>
        </defs>

        {/* Main fill */}
        <path d={canopyPath} fill="rgba(1, 5, 18, 0.96)" stroke="none" />
        <path
          d={canopyPath}
          fill="none"
          stroke="rgba(1,6,20,0.6)"
          strokeWidth="8"
        />

        {/* Glass reflection */}
        <path
          d={glassReflectPath}
          fill="rgba(255,255,255,0.018)"
          stroke="none"
        />

        {panelLines.map((l) => (
          <line
            key={l.id}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="rgba(0,120,180,0.22)"
            strokeWidth="0.5"
            strokeDasharray="6,4"
          />
        ))}

        <path
          d={bevelPath}
          fill="none"
          stroke="rgba(0,100,160,0.28)"
          strokeWidth="0.5"
        />

        {/* Wide soft glow strip */}
        <path
          d={glowStripPath}
          fill="none"
          stroke="rgba(0,200,255,0.35)"
          strokeWidth="3"
          filter="url(#strip-glow-wide)"
        />
        {/* Tight bright inner line */}
        <path
          d={glowStripPath}
          fill="none"
          stroke="rgba(0,230,255,0.92)"
          strokeWidth="0.7"
          filter="url(#strip-glow-tight)"
        />
        {/* Crisp sharp top line */}
        <path
          d={glowStripPath}
          fill="none"
          stroke="rgba(80,240,255,1.0)"
          strokeWidth="0.4"
        />

        {/* Secondary depth arc */}
        <path
          d={secondaryArcPath}
          fill="none"
          stroke="rgba(0,180,220,0.2)"
          strokeWidth="0.5"
        />

        {notches.map((n) => (
          <g key={n.id} stroke="rgba(0,220,255,0.7)" strokeWidth="1">
            <line x1={n.x} y1={n.y - 8} x2={n.x} y2={n.y + 4} />
            <line
              x1={n.x - 3}
              y1={n.y + 4}
              x2={n.x + 3}
              y2={n.y + 4}
              strokeWidth="0.5"
              strokeOpacity="0.5"
            />
          </g>
        ))}

        {lights.map((lt) => (
          <g key={lt.id}>
            <circle cx={lt.x} cy={lt.y} r={2.5} fill={lt.color} />
            <circle cx={lt.x} cy={lt.y} r={5} fill={lt.color} opacity={0.25} />
            <circle cx={lt.x} cy={lt.y} r={8} fill={lt.color} opacity={0.08} />
          </g>
        ))}

        {/* Sharper vector corner brackets */}
        <g stroke="rgba(0,190,230,0.65)" strokeWidth="1.5" fill="none">
          <line x1={0} y1={0} x2={bracketLen} y2={0} />
          <line x1={0} y1={0} x2={0} y2={bracketLen * 0.6} />
          {/* inner bracket marks */}
          <line
            x1={8}
            y1={bracketLen * 0.2}
            x2={22}
            y2={bracketLen * 0.2}
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <line
            x1={bracketLen * 0.2}
            y1={8}
            x2={bracketLen * 0.2}
            y2={22}
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />

          <line x1={W} y1={0} x2={W - bracketLen} y2={0} />
          <line x1={W} y1={0} x2={W} y2={bracketLen * 0.6} />
          <line
            x1={W - 8}
            y1={bracketLen * 0.2}
            x2={W - 22}
            y2={bracketLen * 0.2}
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <line
            x1={W - bracketLen * 0.2}
            y1={8}
            x2={W - bracketLen * 0.2}
            y2={22}
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
        </g>

        <text
          x={W * 0.5}
          y={14}
          textAnchor="middle"
          fill="rgba(0,180,220,0.4)"
          fontSize="8"
          fontFamily="monospace"
          letterSpacing="4"
        >
          COMMAND CANOPY
        </text>
      </svg>

      <div
        className="cockpit-canopy-mobile"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 32,
          background: "rgba(1, 5, 18, 0.96)",
          borderBottom: "1px solid rgba(0,220,255,0.55)",
          boxShadow: "0 2px 12px rgba(0,180,255,0.25)",
          pointerEvents: "none",
          display: "none",
        }}
      />
    </>
  );
}
