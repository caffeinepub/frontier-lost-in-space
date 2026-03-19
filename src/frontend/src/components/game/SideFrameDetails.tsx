const LEFT_DIAGONALS = [
  { id: "ld-0", x1: 2, y1: 225, x2: 58, y2: 288 },
  { id: "ld-1", x1: 2, y1: 540, x2: 58, y2: 603 },
];

const LEFT_DOTS_DEF = [
  { id: "ldot-0", yFrac: 0.2, color: "rgba(0,220,255,0.75)" },
  { id: "ldot-1", yFrac: 0.5, color: "rgba(255,180,0,0.7)" },
  { id: "ldot-2", yFrac: 0.76, color: "rgba(0,220,255,0.65)" },
];

export default function SideFrameDetails() {
  const W = 1440;
  const H = 900;
  const panelW = 64;

  const ventSlots = [
    { y: H * 0.3, id: "v-0" },
    { y: H * 0.42, id: "v-1" },
    { y: H * 0.54, id: "v-2" },
  ];
  const ventH = 18;
  const ventGap = 4;

  const leftSeams = [
    { x1: 16, y1: H * 0.15, x2: 16, y2: H * 0.75, id: "ls-0" },
    { x1: 32, y1: H * 0.2, x2: 32, y2: H * 0.72, id: "ls-1" },
    { x1: 10, y1: H * 0.35, x2: panelW - 4, y2: H * 0.35, id: "ls-2" },
    { x1: 10, y1: H * 0.5, x2: panelW - 4, y2: H * 0.5, id: "ls-3" },
    { x1: 10, y1: H * 0.65, x2: panelW - 4, y2: H * 0.65, id: "ls-4" },
  ];
  const rightSeams = leftSeams.map((s) => ({
    x1: W - s.x1,
    y1: s.y1,
    x2: W - s.x2,
    y2: s.y2,
    id: s.id.replace("ls", "rs"),
  }));

  const rightDiagonals = LEFT_DIAGONALS.map((d) => ({
    id: d.id.replace("ld-", "rd-"),
    x1: W - d.x1,
    y1: d.y1,
    x2: W - d.x2,
    y2: d.y2,
  }));

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cockpit side frame panels"
    >
      <title>Cockpit side frame panels</title>
      <defs>
        <filter
          id="side-accent-glow"
          x="-150%"
          y="-10%"
          width="400%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="side-accent-tight"
          x="-100%"
          y="-10%"
          width="300%"
          height="120%"
        >
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="left-panel-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(1,5,18,0.92)" />
          <stop offset="100%" stopColor="rgba(1,5,18,0.0)" />
        </linearGradient>
        <linearGradient id="right-panel-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(1,5,18,0.0)" />
          <stop offset="100%" stopColor="rgba(1,5,18,0.92)" />
        </linearGradient>
        <style>{`
          @media (max-width: 767px) {
            .side-panels { display: none; }
          }
        `}</style>
      </defs>

      <g className="side-panels">
        {/* LEFT PANEL */}
        <rect
          x={0}
          y={0}
          width={panelW}
          height={H}
          fill="url(#left-panel-fill)"
        />
        <rect
          x={0}
          y={0}
          width={panelW * 0.6}
          height={H}
          fill="rgba(2, 8, 28, 0.55)"
        />

        {LEFT_DIAGONALS.map((d) => (
          <line
            key={d.id}
            x1={d.x1}
            y1={d.y1}
            x2={d.x2}
            y2={d.y2}
            stroke="rgba(0,120,180,0.12)"
            strokeWidth="0.8"
          />
        ))}

        {leftSeams.map((s) => (
          <line
            key={s.id}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="rgba(0,80,130,0.3)"
            strokeWidth="0.5"
            strokeDasharray="4,6"
          />
        ))}

        {ventSlots.map((v) => (
          <g key={`lv${v.id}`}>
            {[0, 1, 2].map((j) => (
              <rect
                key={j}
                x={14}
                y={v.y - (ventH + ventGap) + j * (ventH / 3 + ventGap / 2)}
                width={2}
                height={ventH / 3}
                fill="rgba(0,10,25,0.9)"
                stroke="rgba(0,120,160,0.35)"
                strokeWidth="0.4"
                rx={0.5}
              />
            ))}
          </g>
        ))}

        <line
          x1={panelW}
          y1={H * 0.08}
          x2={panelW}
          y2={H * 0.92}
          stroke="rgba(0,180,220,0.3)"
          strokeWidth="2"
          filter="url(#side-accent-glow)"
        />
        <line
          x1={panelW}
          y1={H * 0.08}
          x2={panelW}
          y2={H * 0.92}
          stroke="rgba(0,220,255,0.65)"
          strokeWidth="0.8"
          filter="url(#side-accent-tight)"
        />
        <line
          x1={panelW}
          y1={H * 0.08}
          x2={panelW}
          y2={H * 0.92}
          stroke="rgba(80,240,255,0.85)"
          strokeWidth="0.4"
        />
        <line
          x1={panelW - 4}
          y1={H * 0.12}
          x2={panelW - 4}
          y2={H * 0.88}
          stroke="rgba(0,200,230,0.2)"
          strokeWidth="0.4"
        />

        {LEFT_DOTS_DEF.map((d) => (
          <g key={d.id}>
            <circle cx={panelW * 0.45} cy={H * d.yFrac} r={2} fill={d.color} />
            <circle
              cx={panelW * 0.45}
              cy={H * d.yFrac}
              r={4}
              fill={d.color}
              opacity={0.18}
            />
          </g>
        ))}

        {/* RIGHT PANEL */}
        <rect
          x={W - panelW}
          y={0}
          width={panelW}
          height={H}
          fill="url(#right-panel-fill)"
        />
        <rect
          x={W - panelW * 0.6}
          y={0}
          width={panelW * 0.6}
          height={H}
          fill="rgba(2, 8, 28, 0.55)"
        />

        {rightDiagonals.map((d) => (
          <line
            key={d.id}
            x1={d.x1}
            y1={d.y1}
            x2={d.x2}
            y2={d.y2}
            stroke="rgba(0,120,180,0.12)"
            strokeWidth="0.8"
          />
        ))}

        {rightSeams.map((s) => (
          <line
            key={s.id}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="rgba(0,80,130,0.3)"
            strokeWidth="0.5"
            strokeDasharray="4,6"
          />
        ))}

        {ventSlots.map((v) => (
          <g key={`rv${v.id}`}>
            {[0, 1, 2].map((j) => (
              <rect
                key={j}
                x={W - 16}
                y={v.y - (ventH + ventGap) + j * (ventH / 3 + ventGap / 2)}
                width={2}
                height={ventH / 3}
                fill="rgba(0,10,25,0.9)"
                stroke="rgba(0,120,160,0.35)"
                strokeWidth="0.4"
                rx={0.5}
              />
            ))}
          </g>
        ))}

        <line
          x1={W - panelW}
          y1={H * 0.08}
          x2={W - panelW}
          y2={H * 0.92}
          stroke="rgba(0,180,220,0.3)"
          strokeWidth="2"
          filter="url(#side-accent-glow)"
        />
        <line
          x1={W - panelW}
          y1={H * 0.08}
          x2={W - panelW}
          y2={H * 0.92}
          stroke="rgba(0,220,255,0.65)"
          strokeWidth="0.8"
          filter="url(#side-accent-tight)"
        />
        <line
          x1={W - panelW}
          y1={H * 0.08}
          x2={W - panelW}
          y2={H * 0.92}
          stroke="rgba(80,240,255,0.85)"
          strokeWidth="0.4"
        />
        <line
          x1={W - panelW + 4}
          y1={H * 0.12}
          x2={W - panelW + 4}
          y2={H * 0.88}
          stroke="rgba(0,200,230,0.2)"
          strokeWidth="0.4"
        />

        {LEFT_DOTS_DEF.map((d) => (
          <g key={`r${d.id}`}>
            <circle
              cx={W - panelW * 0.45}
              cy={H * d.yFrac}
              r={2}
              fill={d.color}
            />
            <circle
              cx={W - panelW * 0.45}
              cy={H * d.yFrac}
              r={4}
              fill={d.color}
              opacity={0.18}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
