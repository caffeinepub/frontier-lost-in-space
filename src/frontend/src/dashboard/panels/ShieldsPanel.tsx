import { useDashboardStore } from "../../hooks/useDashboardStore";

function ShieldBar({
  label,
  value,
  color,
}: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            color: "rgba(0,180,255,0.5)",
            letterSpacing: "0.12em",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            color,
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          {value}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(0,180,255,0.1)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            borderRadius: 3,
            boxShadow: `0 0 8px ${color}60`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function ShieldsPanel() {
  const { shipStatus } = useDashboardStore();

  const shieldColor =
    shipStatus.shields > 60
      ? "#00e8ff"
      : shipStatus.shields > 30
        ? "#ffaa00"
        : "#ff3333";

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
        SHIELD SYSTEMS
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: shieldColor,
            textShadow: `0 0 20px ${shieldColor}80`,
            letterSpacing: "0.05em",
            lineHeight: 1,
          }}
        >
          {shipStatus.shields}%
        </div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(0,180,255,0.4)",
            letterSpacing: "0.2em",
            marginTop: 4,
          }}
        >
          OVERALL SHIELD INTEGRITY
        </div>
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
          EMITTER STATUS
        </div>
        <ShieldBar label="EMITTER #1 — BOW" value={82} color="#00e8ff" />
        <ShieldBar label="EMITTER #2 — STERN" value={78} color="#00e8ff" />
        <ShieldBar
          label="EMITTER #3 — PORT"
          value={shipStatus.shields}
          color={shieldColor}
        />
        <ShieldBar label="EMITTER #4 — STARBOARD" value={74} color="#00e8ff" />
      </div>

      <div
        style={{
          background: "rgba(255,170,0,0.05)",
          border: "1px solid rgba(255,170,0,0.2)",
          borderRadius: 2,
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "#ffaa00",
            letterSpacing: "0.12em",
            marginBottom: 4,
          }}
        >
          ⚠ ACTIVE ALERT
        </div>
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,200,100,0.7)",
            lineHeight: 1.4,
          }}
        >
          Emitter #3 flux instability — resonance drift 0.4% above nominal.
          Recommend recalibration within 2 cycles.
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
          REGEN RATE
        </div>
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
              color: "rgba(0,180,255,0.4)",
              letterSpacing: "0.12em",
            }}
          >
            PASSIVE REGEN
          </span>
          <span
            style={{
              fontSize: 10,
              color: "rgba(0,220,255,0.85)",
              letterSpacing: "0.1em",
            }}
          >
            +0.8% / 10s
          </span>
        </div>
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
              color: "rgba(0,180,255,0.4)",
              letterSpacing: "0.12em",
            }}
          >
            BOOST MODE
          </span>
          <span
            style={{
              fontSize: 10,
              color: "rgba(0,220,255,0.85)",
              letterSpacing: "0.1em",
            }}
          >
            STANDBY
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 0",
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: "rgba(0,180,255,0.4)",
              letterSpacing: "0.12em",
            }}
          >
            COLLAPSE RISK
          </span>
          <span
            style={{ fontSize: 10, color: "#00ff88", letterSpacing: "0.1em" }}
          >
            MINIMAL
          </span>
        </div>
      </div>
    </div>
  );
}
