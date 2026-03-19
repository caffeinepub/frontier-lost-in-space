import { useThreatStore } from "../../combat/useThreatStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";

const GLASS: React.CSSProperties = {
  background: "rgba(0, 8, 22, 0.72)",
  border: "1px solid rgba(0, 200, 255, 0.25)",
  backdropFilter: "blur(10px)",
  borderRadius: 3,
  boxShadow:
    "0 0 18px rgba(0,180,255,0.08), inset 0 1px 0 rgba(0,200,255,0.12)",
};

function Row({
  label,
  value,
  valueColor = "#00ddff",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "3px 0",
        borderBottom: "1px solid rgba(0,200,255,0.06)",
      }}
    >
      <span
        style={{
          color: "rgba(0,180,220,0.55)",
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.15em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: valueColor,
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.12em",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: 8,
        letterSpacing: "0.28em",
        color: "rgba(0,200,255,0.5)",
        paddingBottom: 4,
        marginBottom: 3,
        borderBottom: "1px solid rgba(0,200,255,0.15)",
        textTransform: "uppercase" as const,
      }}
    >
      {title}
    </div>
  );
}

function ThreatLevelBar({ level }: { level: number }) {
  const max = 5;
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
      {[1, 2, 3, 4, 5].slice(0, max).map((barLevel) => (
        <div
          key={`bar-${barLevel}`}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 1,
            background:
              barLevel <= level
                ? barLevel <= 2
                  ? "#00ffcc"
                  : barLevel <= 4
                    ? "#ffaa00"
                    : "#ff3333"
                : "rgba(0,60,80,0.4)",
            boxShadow:
              barLevel <= level
                ? `0 0 4px ${barLevel <= 2 ? "#00ffcc" : barLevel <= 4 ? "#ffaa00" : "#ff3333"}`
                : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function LeftPanel() {
  const globeTarget = useTacticalStore((s) => s.globeTarget);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const nodeData = useTacticalStore((s) => s.nodeData);
  const scanMode = useTacticalStore((s) => s.scanMode);
  const threats = useThreatStore((s) => s.threats);
  const clearNode = useTacticalStore((s) => s.clearNode);

  const activeThreats = threats.filter(
    (t) => t.status !== "DESTROYED" && t.status !== "SURVIVED",
  );

  const hasTarget = !!(globeTarget ?? selectedNode);
  const targetId = globeTarget?.id ?? selectedNode;
  const lat = globeTarget?.lat;
  const lng = globeTarget?.lng;
  const sector =
    globeTarget?.sector ?? (selectedNode ? "SECTOR UNKNOWN" : null);
  const threatLevel =
    globeTarget?.threatLevel ??
    (nodeData ? Math.ceil((nodeData.stability ?? 0) / 20) : 0);

  return (
    <div
      style={{
        position: "absolute",
        left: "clamp(6px, 1.5vw, 20px)",
        top: "18%",
        width: "clamp(140px, 14vw, 180px)",
        zIndex: 30,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* TARGET DATA PANEL */}
      <div style={{ ...GLASS, padding: "10px 12px" }}>
        <SectionHeader title="TARGET DATA" />

        {hasTarget ? (
          <>
            <Row label="ID" value={targetId ?? "---"} valueColor="#ff6666" />
            {lat != null && lng != null ? (
              <>
                <Row
                  label="LAT"
                  value={`${lat >= 0 ? "+" : ""}${lat.toFixed(2)}°`}
                />
                <Row
                  label="LON"
                  value={`${lng >= 0 ? "+" : ""}${lng.toFixed(2)}°`}
                />
              </>
            ) : null}
            <Row label="SECTOR" value={sector ?? "---"} />
            <div style={{ marginTop: 5 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    color: "rgba(0,180,220,0.55)",
                    fontFamily: "monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                  }}
                >
                  THREAT LVL
                </span>
                <span
                  style={{
                    color:
                      threatLevel > 3
                        ? "#ff4444"
                        : threatLevel > 1
                          ? "#ffaa00"
                          : "#00ffcc",
                    fontFamily: "monospace",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {threatLevel}/5
                </span>
              </div>
              <ThreatLevelBar level={threatLevel} />
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.18em",
                  color: "#ff4444",
                  textShadow: "0 0 8px #ff444488",
                  animation: "statusPulse 1.2s ease-in-out infinite",
                }}
              >
                ◉ LOCKED
              </div>
              <button
                type="button"
                onClick={clearNode}
                style={{
                  fontFamily: "monospace",
                  fontSize: 7,
                  letterSpacing: "0.12em",
                  color: "rgba(0,160,200,0.5)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "1px 4px",
                }}
              >
                CLR
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "rgba(0,160,200,0.35)",
              textAlign: "center",
              padding: "8px 0",
            }}
          >
            NO TARGET
          </div>
        )}
      </div>

      {/* SCAN RESULTS */}
      <div style={{ ...GLASS, padding: "10px 12px" }}>
        <SectionHeader title="SCAN" />
        {scanMode ? (
          <>
            <Row label="MODE" value="ACTIVE" valueColor="#00ffcc" />
            <Row label="NODES" value="14" />
            {nodeData && (
              <>
                <Row
                  label="ENERGY"
                  value={`${nodeData.energy}%`}
                  valueColor={
                    (nodeData.energy ?? 0) > 70
                      ? "#00ffcc"
                      : (nodeData.energy ?? 0) > 40
                        ? "#ffaa00"
                        : "#ff4444"
                  }
                />
                <Row label="SIGNAL" value={`${nodeData.signal}%`} />
                <Row label="STABILITY" value={`${nodeData.stability}%`} />
              </>
            )}
            <Row
              label="THREATS"
              value={String(activeThreats.length)}
              valueColor={activeThreats.length > 0 ? "#ff8800" : "#00ffcc"}
            />
          </>
        ) : (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "rgba(0,160,200,0.35)",
              textAlign: "center",
              padding: "6px 0",
            }}
          >
            SCAN OFFLINE
          </div>
        )}
      </div>

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
