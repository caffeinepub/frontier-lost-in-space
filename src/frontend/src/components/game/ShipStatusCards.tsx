const SHIP_STATS = [
  { key: "hull", label: "HULL INTEGRITY", value: 87, color: "#00ff80" },
  { key: "shields", label: "SHIELD LEVEL", value: 64, color: "#00c8ff" },
  { key: "power", label: "POWER OUTPUT", value: 91, color: "#ffcc00" },
  { key: "speed", label: "DRIVE SPEED", value: 78, color: "#ff6600" },
];

const SUBSYSTEMS = [
  { label: "HULL", status: "OK" as const },
  { label: "SHIELDS", status: "WARN" as const },
  { label: "COMMS", status: "OK" as const },
  { label: "ENGINES", status: "OK" as const },
];

const STATUS_COLOR = { OK: "#00ff80", WARN: "#ffcc00", FAIL: "#ff3030" };

export default function ShipStatusCards() {
  return (
    <div
      style={{
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as unknown as undefined,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.2em",
          color: "rgba(0,200,255,0.5)",
          borderBottom: "1px solid rgba(0,200,255,0.1)",
          paddingBottom: 8,
        }}
      >
        VESSEL-7742 — ISV PHANTOM WRAITH
      </div>

      {/* Stat bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SHIP_STATS.map((stat) => (
          <div key={stat.key}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  color: "rgba(0,200,255,0.6)",
                }}
              >
                {stat.label}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  color: stat.color,
                  textShadow: `0 0 6px ${stat.color}88`,
                }}
              >
                {stat.value}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(0,20,40,0.8)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${stat.value}%`,
                  background: `linear-gradient(90deg, ${stat.color}44, ${stat.color})`,
                  boxShadow: `0 0 6px ${stat.color}`,
                  borderRadius: 3,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Threat level */}
      <div
        style={{
          marginTop: 4,
          padding: "8px 10px",
          background: "rgba(0,10,30,0.6)",
          border: "1px solid rgba(0,200,255,0.12)",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.16em",
            color: "rgba(0,200,255,0.5)",
            marginBottom: 6,
          }}
        >
          THREAT LEVEL — SECTOR ALPHA-7
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 2,
                background:
                  level <= 3
                    ? level <= 2
                      ? "rgba(255,80,0,0.8)"
                      : "rgba(255,160,0,0.7)"
                    : "rgba(0,40,60,0.6)",
                boxShadow: level <= 3 ? "0 0 4px rgba(255,100,0,0.5)" : "none",
              }}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: "monospace",
            fontSize: 7,
            color: "rgba(255,120,0,0.8)",
            letterSpacing: "0.12em",
          }}
        >
          ELEVATED — 3/5
        </div>
      </div>

      {/* Subsystems */}
      <div
        style={{
          padding: "8px 10px",
          background: "rgba(0,10,30,0.6)",
          border: "1px solid rgba(0,200,255,0.12)",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.16em",
            color: "rgba(0,200,255,0.5)",
            marginBottom: 8,
          }}
        >
          SUBSYSTEM STATUS
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SUBSYSTEMS.map((sys) => (
            <div
              key={sys.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: STATUS_COLOR[sys.status],
                  boxShadow: `0 0 4px ${STATUS_COLOR[sys.status]}`,
                }}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: "rgba(0,200,255,0.6)",
                  letterSpacing: "0.1em",
                }}
              >
                {sys.label}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 7,
                  color: STATUS_COLOR[sys.status],
                  letterSpacing: "0.08em",
                }}
              >
                {sys.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
