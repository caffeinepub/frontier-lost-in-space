export default function LowerConsoleShell() {
  const W = 1440;
  const H = 900;

  const consoleHeight = 100;
  const centerRecession = 28;

  const leftFlapEnd = W * 0.22;
  const rightFlapStart = W * 0.78;
  const bottomY = H;
  const topEdgeLeft = H - consoleHeight;
  const topEdgeRight = H - consoleHeight;
  const topEdgeCenter = H - centerRecession;

  const consolePath = [
    `M 0 ${bottomY}`,
    `L ${W} ${bottomY}`,
    `L ${W} ${topEdgeRight}`,
    `Q ${rightFlapStart} ${topEdgeRight - 8} ${W * 0.5} ${topEdgeCenter}`,
    `Q ${leftFlapEnd} ${topEdgeLeft - 8} 0 ${topEdgeLeft}`,
    "Z",
  ].join(" ");

  const trimPath = [
    `M 0 ${topEdgeLeft}`,
    `Q ${leftFlapEnd} ${topEdgeLeft - 8} ${W * 0.5} ${topEdgeCenter}`,
    `Q ${rightFlapStart} ${topEdgeRight - 8} ${W} ${topEdgeRight}`,
  ].join(" ");

  // Inner bevel line 6px above trim
  const bevelTrimPath = [
    `M 0 ${topEdgeLeft - 6}`,
    `Q ${leftFlapEnd} ${topEdgeLeft - 14} ${W * 0.5} ${topEdgeCenter - 6}`,
    `Q ${rightFlapStart} ${topEdgeRight - 14} ${W} ${topEdgeRight - 6}`,
  ].join(" ");

  const ruleLines = [
    { y: H - 62, x1: 0, x2: W * 0.18, id: "rl-0" },
    { y: H - 46, x1: 0, x2: W * 0.15, id: "rl-1" },
    { y: H - 62, x1: W * 0.82, x2: W, id: "rl-2" },
    { y: H - 46, x1: W * 0.85, x2: W, id: "rl-3" },
  ];

  const seams = [
    { x: W * 0.08, y1: H - 90, y2: H, id: "sm-0" },
    { x: W * 0.16, y1: H - 78, y2: H, id: "sm-1" },
    { x: W * 0.84, y1: H - 78, y2: H, id: "sm-2" },
    { x: W * 0.92, y1: H - 90, y2: H, id: "sm-3" },
  ];

  const indicators = [
    { x: W * 0.06, y: H - 32, color: "rgba(0,220,255,0.8)", id: "in-0" },
    { x: W * 0.09, y: H - 32, color: "rgba(255,180,0,0.7)", id: "in-1" },
    { x: W * 0.12, y: H - 32, color: "rgba(0,220,255,0.6)", id: "in-2" },
    { x: W * 0.88, y: H - 32, color: "rgba(0,220,255,0.8)", id: "in-3" },
    { x: W * 0.91, y: H - 32, color: "rgba(255,180,0,0.7)", id: "in-4" },
    { x: W * 0.94, y: H - 32, color: "rgba(0,220,255,0.6)", id: "in-5" },
  ];

  const cutoutPath = [
    `M ${W * 0.25} ${bottomY}`,
    `L ${W * 0.75} ${bottomY}`,
    `L ${W * 0.75} ${H - 12}`,
    `Q ${W * 0.5} ${topEdgeCenter + 5} ${W * 0.25} ${H - 12}`,
    "Z",
  ].join(" ");

  // Glass highlight: thin near-white line at top of side flap
  const glassHighlightLeft = `M 0 ${topEdgeLeft - 1} L ${W * 0.15} ${topEdgeLeft - 1}`;
  const glassHighlightRight = `M ${W * 0.85} ${topEdgeRight - 1} L ${W} ${topEdgeRight - 1}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cockpit lower console"
    >
      <title>Cockpit lower console</title>
      <defs>
        <filter
          id="console-trim-glow-wide"
          x="-5%"
          y="-300%"
          width="110%"
          height="700%"
        >
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="console-trim-glow-tight"
          x="-5%"
          y="-200%"
          width="110%"
          height="500%"
        >
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="console-radial-glow" cx="50%" cy="100%" r="55%">
          <stop offset="0%" stopColor="rgba(0,180,255,0.06)" />
          <stop offset="100%" stopColor="rgba(0,180,255,0)" />
        </radialGradient>
        <style>{`
          @media (max-width: 767px) {
            .console-full { display: none; }
            .console-mobile { display: block !important; }
          }
          @media (min-width: 768px) {
            .console-mobile { display: none !important; }
          }
        `}</style>
      </defs>

      <g className="console-full">
        <path d={consolePath} fill="rgba(1, 5, 18, 0.96)" stroke="none" />

        {/* Subtle radial glow overlay */}
        <path d={consolePath} fill="url(#console-radial-glow)" />

        {ruleLines.map((l) => (
          <line
            key={l.id}
            x1={l.x1}
            y1={l.y}
            x2={l.x2}
            y2={l.y}
            stroke="rgba(0,100,160,0.28)"
            strokeWidth="0.5"
          />
        ))}

        {seams.map((s) => (
          <line
            key={s.id}
            x1={s.x}
            y1={s.y1}
            x2={s.x}
            y2={s.y2}
            stroke="rgba(0,80,130,0.22)"
            strokeWidth="0.5"
            strokeDasharray="3,5"
          />
        ))}

        <path d={cutoutPath} fill="rgba(4,14,40,0.55)" />

        {indicators.map((ind) => (
          <g key={ind.id}>
            <circle cx={ind.x} cy={ind.y} r={2.5} fill={ind.color} />
            <circle
              cx={ind.x}
              cy={ind.y}
              r={5}
              fill={ind.color}
              opacity={0.18}
            />
            <circle
              cx={ind.x}
              cy={ind.y}
              r={9}
              fill={ind.color}
              opacity={0.06}
            />
          </g>
        ))}

        {/* Inner bevel line */}
        <path
          d={bevelTrimPath}
          fill="none"
          stroke="rgba(0,150,200,0.32)"
          strokeWidth="0.5"
        />

        {/* Wide blurred trim glow */}
        <path
          d={trimPath}
          fill="none"
          stroke="rgba(0,200,255,0.4)"
          strokeWidth="3"
          filter="url(#console-trim-glow-wide)"
        />
        {/* Tight medium trim */}
        <path
          d={trimPath}
          fill="none"
          stroke="rgba(0,220,255,0.7)"
          strokeWidth="1"
          filter="url(#console-trim-glow-tight)"
        />
        {/* Sharp crisp top line */}
        <path
          d={trimPath}
          fill="none"
          stroke="rgba(80,240,255,0.95)"
          strokeWidth="0.5"
        />

        {/* Glass highlights */}
        <path
          d={glassHighlightLeft}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.7"
        />
        <path
          d={glassHighlightRight}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.7"
        />

        <g stroke="rgba(0,180,220,0.42)" strokeWidth="1" fill="none">
          <line x1={0} y1={H} x2={36} y2={H} />
          <line x1={0} y1={H} x2={0} y2={H - 36} />
          <line x1={W} y1={H} x2={W - 36} y2={H} />
          <line x1={W} y1={H} x2={W} y2={H - 36} />
        </g>
      </g>

      <g className="console-mobile" style={{ display: "none" }}>
        <rect
          x={0}
          y={H - 50}
          width={W}
          height={50}
          fill="rgba(1, 5, 18, 0.96)"
        />
        <line
          x1={0}
          y1={H - 50}
          x2={W}
          y2={H - 50}
          stroke="rgba(0,220,255,0.55)"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
