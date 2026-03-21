import { useEffect, useState } from "react";

const NAV_WAYPOINTS = [
  {
    id: "wp1",
    label: "NEXUS-7",
    bearing: "047°",
    distance: "1.4 AU",
    eta: "00:08:14",
    status: "ACTIVE",
  },
  {
    id: "wp2",
    label: "BRAVO-STATION",
    bearing: "182°",
    distance: "4.8 AU",
    eta: "00:31:07",
    status: "QUEUED",
  },
  {
    id: "wp3",
    label: "OMEGA-3 ARRAY",
    bearing: "291°",
    distance: "9.1 AU",
    eta: "01:02:44",
    status: "QUEUED",
  },
];

function useCountdown(initial: number) {
  const [t, setT] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setT((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function DataRow({
  label,
  value,
  color,
}: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid rgba(0,220,255,0.06)",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: "rgba(0,180,255,0.4)",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          color: color ?? "rgba(0,220,255,0.85)",
          letterSpacing: "0.1em",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function NavigationPanel() {
  const jumpCountdown = useCountdown(512);

  return (
    <div style={{ padding: "12px 14px", fontFamily: "monospace" }}>
      <div
        style={{
          fontSize: 10,
          color: "rgba(0,180,255,0.5)",
          letterSpacing: "0.2em",
          marginBottom: 12,
          borderBottom: "1px solid rgba(0,220,255,0.1)",
          paddingBottom: 8,
        }}
      >
        NAVIGATION SYSTEMS
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 9,
            color: "rgba(0,180,255,0.4)",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          CURRENT VECTOR
        </div>
        <DataRow label="HEADING" value="047° / 022°" />
        <DataRow label="SPEED" value="0.42c" />
        <DataRow label="SECTOR" value="ALPHA-7" color="#00ffcc" />
        <DataRow label="POSITION" value="14.7 / -3.2 / 0.8 AU" />
        <DataRow label="NAV MODE" value="TACTICAL" color="#ffaa00" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 9,
            color: "rgba(0,180,255,0.4)",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          JUMP DRIVE
        </div>
        <div
          style={{
            background: "rgba(0,10,24,0.6)",
            border: "1px solid rgba(0,220,255,0.15)",
            borderRadius: 2,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "rgba(0,180,255,0.5)",
                letterSpacing: "0.12em",
              }}
            >
              STATUS
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#ffaa00",
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            >
              COOLDOWN
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "rgba(0,180,255,0.4)",
                letterSpacing: "0.1em",
              }}
            >
              NEXT WINDOW
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#00e8ff",
                letterSpacing: "0.15em",
                fontWeight: 700,
                textShadow: "0 0 8px rgba(0,220,255,0.5)",
              }}
            >
              {jumpCountdown}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(0,180,255,0.4)",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          WAYPOINTS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NAV_WAYPOINTS.map((wp, idx) => (
            <div
              key={wp.id}
              data-ocid={`navigation.item.${idx + 1}`}
              style={{
                background:
                  wp.status === "ACTIVE"
                    ? "rgba(0,30,50,0.5)"
                    : "rgba(0,10,20,0.3)",
                border: `1px solid ${wp.status === "ACTIVE" ? "rgba(0,220,255,0.25)" : "rgba(0,220,255,0.08)"}`,
                borderRadius: 2,
                padding: "8px 10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color:
                      wp.status === "ACTIVE"
                        ? "rgba(0,220,255,0.9)"
                        : "rgba(0,180,255,0.5)",
                    letterSpacing: "0.1em",
                    fontWeight: wp.status === "ACTIVE" ? 700 : 400,
                  }}
                >
                  {wp.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color:
                      wp.status === "ACTIVE"
                        ? "#00ffcc"
                        : "rgba(0,180,255,0.3)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {wp.status}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 9, color: "rgba(0,180,255,0.4)" }}>
                  BRG {wp.bearing}
                </span>
                <span style={{ fontSize: 9, color: "rgba(0,180,255,0.4)" }}>
                  {wp.distance}
                </span>
                <span style={{ fontSize: 9, color: "rgba(0,180,255,0.4)" }}>
                  ETA {wp.eta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
