import { useEffect, useState } from "react";
import { CEP_LEVELS, useCEPStore } from "../../cep/useCEPStore";
import { useEnemyStore } from "../../combat/useEnemyStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useMissionsStore } from "../../missions/useMissionsStore";

interface Anomaly {
  id: string;
  label: string;
  type: string;
  distance: string;
  revealed: boolean;
}

const SEEDED_ANOMALIES: Anomaly[] = [
  {
    id: "ano-1",
    label: "ENERGY SIGNATURE",
    type: "Electromagnetic burst detected at bearing 047",
    distance: "1.8 AU",
    revealed: false,
  },
  {
    id: "ano-2",
    label: "DEBRIS FIELD",
    type: "Dense orbital debris, potential salvage",
    distance: "0.4 AU",
    revealed: false,
  },
  {
    id: "ano-3",
    label: "UNKNOWN OBJECT",
    type: "Non-reflective mass moving at 2.1 km/s",
    distance: "3.2 AU",
    revealed: false,
  },
];

function RadarSweep() {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        border: "1px solid rgba(0,200,100,0.3)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {[0.3, 0.6, 1].map((r) => (
        <div
          key={r}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: `${r * 100}%`,
            height: `${r * 100}%`,
            borderRadius: "50%",
            border: "1px solid rgba(0,200,100,0.2)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(0,220,100,0.15) 60deg, transparent 60deg)",
          animation: "radarSweep 3s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 2,
          height: 2,
          background: "rgba(0,220,100,0.9)",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <style>
        {
          "@keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"
        }
      </style>
    </div>
  );
}

// ── CEP anomaly row (read-only) ───────────────────────────────────────────

function CEPAnomalyRow() {
  const level = useCEPStore((s) => s.level);
  const isActive = useCEPStore((s) => s.isActive);

  if (!isActive) return null;

  const def = CEP_LEVELS[level];
  const scanDetail =
    level === 1
      ? "Unclassified broadcast pattern. Below alert threshold."
      : level === 2
        ? "Behavioural data harvest in progress. Source unknown."
        : level === 3
          ? "Active signal disruption. Targeting fidelity degraded."
          : level === 4
            ? "Countermeasure deployment confirmed. Hull sensors affected."
            : "FULL PROTOCOL EXECUTION. All sensor channels compromised.";

  return (
    <div
      style={{
        background: "rgba(15,3,3,0.7)",
        border: `1px solid ${def.color}`,
        borderRadius: 3,
        padding: "6px 8px",
        animation: level >= 4 ? "cepPulse 2s ease-in-out infinite" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3,
        }}
      >
        <span
          style={{
            fontSize: 8,
            color: def.color,
            letterSpacing: "0.1em",
            fontFamily: "monospace",
          }}
        >
          CEP {def.code} — {def.label}
        </span>
        <span
          style={{
            fontSize: 7,
            color: "rgba(0,160,200,0.5)",
            fontFamily: "monospace",
          }}
        >
          SYSTEM
        </span>
      </div>
      <div
        style={{
          fontSize: 7,
          color: "rgba(180,200,220,0.65)",
          fontFamily: "monospace",
          letterSpacing: "0.04em",
        }}
      >
        {scanDetail}
      </div>
      <style>{`
        @keyframes cepPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(255,40,40,0.2); }
          50%       { box-shadow: 0 0 12px rgba(255,40,40,0.5); }
        }
      `}</style>
    </div>
  );
}

export default function ScannerPanel() {
  const enemies = useEnemyStore((s) => s.enemies);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const selectNode = useTacticalStore((s) => s.selectNode);
  const activeMission = useMissionsStore((s) => s.activeMission);
  const incrementStat = useMissionsStore((s) => s.incrementStat);
  const addLogEntry = useMissionsStore((s) => s.addLogEntry);
  const [anomalies, setAnomalies] = useState<Anomaly[]>(SEEDED_ANOMALIES);
  const [scanning, setScanning] = useState(false);

  const activeEnemies = enemies.filter((e) => e.status !== "destroyed");
  const satellites = activeEnemies.filter((e) => e.type === "satellite");
  const bases = activeEnemies.filter((e) => e.type === "base");

  const handleScan = () => {
    if (scanning) return;
    setScanning(true);
    // Record CEP interaction
    import("../../cep/useCEPStore")
      .then(({ useCEPStore: s }) => {
        s.getState().recordInteraction("scan");
      })
      .catch(() => {});
    setTimeout(() => {
      const unrevealed = anomalies.filter((a) => !a.revealed);
      if (unrevealed.length > 0) {
        const toReveal = unrevealed[0];
        setAnomalies((prev) =>
          prev.map((a) =>
            a.id === toReveal.id ? { ...a, revealed: true } : a,
          ),
        );
        addLogEntry({
          type: "system",
          message: `SCAN COMPLETE: ${toReveal.label} confirmed at ${toReveal.distance}`,
        });
        incrementStat("scansCompleted");
      } else {
        addLogEntry({
          type: "system",
          message: "SCAN COMPLETE: No new contacts detected",
        });
      }
      setScanning(false);
    }, 2000);
  };

  return (
    <div
      style={{
        padding: "12px 10px",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Radar + scan trigger */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <RadarSweep />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.15em",
              color: "rgba(0,200,100,0.8)",
              marginBottom: 4,
            }}
          >
            SCAN SYSTEM ONLINE
          </div>
          <div
            style={{
              fontSize: 8,
              color: "rgba(0,160,180,0.6)",
              marginBottom: 6,
            }}
          >
            {activeEnemies.length} ACTIVE CONTACTS TRACKED
          </div>
          <button
            type="button"
            data-ocid="scanner.scan.button"
            onClick={handleScan}
            disabled={scanning}
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              letterSpacing: "0.15em",
              color: scanning ? "rgba(0,140,180,0.5)" : "rgba(0,220,200,0.9)",
              background: scanning ? "rgba(0,20,30,0.5)" : "rgba(0,40,60,0.7)",
              border: `1px solid ${scanning ? "rgba(0,140,180,0.2)" : "rgba(0,200,200,0.4)"}`,
              borderRadius: 3,
              padding: "5px 12px",
              cursor: scanning ? "not-allowed" : "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {scanning ? "SCANNING..." : "INITIATE SCAN"}
          </button>
        </div>
      </div>

      {/* Active contacts */}
      <div>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.2em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 6,
          }}
        >
          ACTIVE CONTACTS
        </div>
        {activeEnemies.length === 0 ? (
          <div style={{ fontSize: 8, color: "rgba(0,220,180,0.5)" }}>
            SECTOR CLEAR
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {activeEnemies.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => selectNode(e.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    selectedNode === e.id
                      ? "rgba(0,40,60,0.8)"
                      : "rgba(0,10,20,0.5)",
                  border: `1px solid ${selectedNode === e.id ? "rgba(0,200,255,0.4)" : "rgba(0,100,140,0.25)"}`,
                  borderRadius: 3,
                  padding: "5px 8px",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    color:
                      e.type === "satellite"
                        ? "rgba(0,200,255,0.8)"
                        : "rgba(255,140,60,0.8)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {e.type === "satellite" ? "\u25cb" : "\u25a0"}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 8,
                    color: "rgba(180,200,220,0.8)",
                    letterSpacing: "0.08em",
                    textAlign: "left",
                  }}
                >
                  {e.label}
                </span>
                <span style={{ fontSize: 7, color: "rgba(0,160,200,0.5)" }}>
                  {e.type.toUpperCase()}
                </span>
                <div
                  style={{
                    width: 28,
                    height: 3,
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(e.health * 100)}%`,
                      background:
                        e.health > 0.5
                          ? "rgba(255,60,60,0.8)"
                          : "rgba(255,180,40,0.8)",
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 10 }}>
        {[
          {
            label: "SATELLITES",
            val: satellites.length,
            color: "rgba(0,180,255,0.5)",
            valColor: "rgba(0,200,255,0.9)",
          },
          {
            label: "BASES",
            val: bases.length,
            color: "rgba(255,160,60,0.5)",
            valColor: "rgba(255,160,60,0.9)",
          },
          {
            label: "CLEARED",
            val: enemies.filter((e) => e.status === "destroyed").length,
            color: "rgba(0,220,180,0.5)",
            valColor: "rgba(0,220,180,0.9)",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: "rgba(0,20,40,0.5)",
              borderRadius: 3,
              padding: "5px 8px",
              border: "1px solid rgba(0,100,140,0.2)",
            }}
          >
            <div style={{ fontSize: 7, color: item.color, marginBottom: 2 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 11, color: item.valColor }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Mission signals */}
      <div>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.2em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 6,
          }}
        >
          MISSION SIGNALS
        </div>
        <div
          style={{
            background: "rgba(0,20,40,0.5)",
            borderRadius: 3,
            padding: "6px 8px",
            border: "1px solid rgba(0,180,100,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 8,
              color: "rgba(0,200,140,0.8)",
              marginBottom: 2,
            }}
          >
            {activeMission.title}
          </div>
          <div style={{ fontSize: 7, color: "rgba(0,160,180,0.6)" }}>
            {activeMission.objective}
          </div>
        </div>
      </div>

      {/* Anomalies */}
      <div>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.2em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 6,
          }}
        >
          ANOMALIES DETECTED
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* CEP anomaly — system-only, read-only, no interaction */}
          <CEPAnomalyRow />

          {anomalies.map((ano) => (
            <div
              key={ano.id}
              style={{
                background: "rgba(0,15,30,0.6)",
                border: "1px solid rgba(0,100,140,0.25)",
                borderRadius: 3,
                padding: "5px 8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    color: ano.revealed
                      ? "rgba(255,200,60,0.9)"
                      : "rgba(0,140,180,0.4)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {ano.revealed ? ano.label : "[UNRESOLVED]"}
                </span>
                <span style={{ fontSize: 7, color: "rgba(0,160,200,0.4)" }}>
                  {ano.distance}
                </span>
              </div>
              <div
                style={{
                  fontSize: 7,
                  color: ano.revealed
                    ? "rgba(180,200,220,0.7)"
                    : "rgba(0,100,140,0.3)",
                }}
              >
                {ano.revealed ? ano.type : "Run scan to analyze"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
