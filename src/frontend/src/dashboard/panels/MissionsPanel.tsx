import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#00ffcc",
  PENDING: "#ffaa00",
  COMPLETE: "#00ff88",
  FAILED: "#ff3333",
};

const THREAT_COLORS: Record<string, string> = {
  NOMINAL: "#00ff88",
  ELEVATED: "#ffaa00",
  CRITICAL: "#ff3333",
};

const MISSIONS = [
  {
    id: "m1",
    title: "SECURE SECTOR DELTA",
    status: "ACTIVE",
    priority: "CRITICAL",
    description:
      "Eliminate hostile presence in Sector Delta and establish a defensive perimeter around grid coordinates 14-C.",
    progress: 42,
    threat: "CRITICAL",
    objectives: [
      "Neutralize hostile ships (3/7)",
      "Establish perimeter beacons (0/4)",
      "Confirm sector clear",
    ],
  },
  {
    id: "m2",
    title: "SCAN ANOMALY CLUSTER",
    status: "ACTIVE",
    priority: "HIGH",
    description:
      "Investigate the anomalous signal cluster detected at beacon NEXUS-7. Determine origin and threat level.",
    progress: 65,
    threat: "ELEVATED",
    objectives: [
      "Reach NEXUS-7 coordinates ✓",
      "Deploy scan probes (2/3)",
      "Transmit analysis to command",
    ],
  },
  {
    id: "m3",
    title: "ESCORT CONVOY R-7",
    status: "PENDING",
    priority: "MEDIUM",
    description:
      "Rendezvous with civilian convoy R-7 at waypoint BRAVO and provide armed escort through hostile transit zone.",
    progress: 0,
    threat: "ELEVATED",
    objectives: [
      "Rendezvous at BRAVO",
      "Escort through transit zone",
      "Confirm safe arrival",
    ],
  },
  {
    id: "m4",
    title: "EXTRACT BEACON DATA",
    status: "PENDING",
    priority: "LOW",
    description:
      "Retrieve navigational data from abandoned beacon array OMEGA-3 before hostile salvage teams arrive.",
    progress: 0,
    threat: "NOMINAL",
    objectives: ["Locate OMEGA-3 array", "Download nav data", "Return to base"],
  },
];

export default function MissionsPanel() {
  const [expanded, setExpanded] = useState<string | null>("m1");

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
        ACTIVE MISSIONS — {MISSIONS.filter((m) => m.status === "ACTIVE").length}{" "}
        / {MISSIONS.length}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {MISSIONS.map((mission, idx) => {
          const isOpen = expanded === mission.id;
          const statusColor = STATUS_COLORS[mission.status] ?? "#aaa";
          const threatColor = THREAT_COLORS[mission.threat] ?? "#aaa";
          return (
            <div
              key={mission.id}
              data-ocid={`missions.item.${idx + 1}`}
              style={{
                border: `1px solid ${isOpen ? "rgba(0,220,255,0.3)" : "rgba(0,220,255,0.1)"}`,
                background: isOpen ? "rgba(0,20,40,0.5)" : "rgba(0,10,24,0.4)",
                borderRadius: 2,
              }}
            >
              <button
                type="button"
                data-ocid={`missions.item.${idx + 1}.toggle`}
                onClick={() => setExpanded(isOpen ? null : mission.id)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: statusColor,
                    boxShadow: `0 0 6px ${statusColor}`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(0,220,255,0.9)",
                      letterSpacing: "0.12em",
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    {mission.title}
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: statusColor,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {mission.status}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "rgba(0,180,255,0.4)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      ·
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: threatColor,
                        letterSpacing: "0.08em",
                      }}
                    >
                      THREAT: {mission.threat}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(0,180,255,0.4)",
                    letterSpacing: "0.1em",
                    flexShrink: 0,
                  }}
                >
                  {mission.status === "ACTIVE"
                    ? `${mission.progress}%`
                    : mission.status}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(0,180,255,0.4)",
                    marginLeft: 4,
                  }}
                >
                  {isOpen ? "▲" : "▼"}
                </div>
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: "0 12px 12px",
                    borderTop: "1px solid rgba(0,220,255,0.08)",
                  }}
                >
                  {mission.status === "ACTIVE" && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          height: 3,
                          background: "rgba(0,180,255,0.1)",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${mission.progress}%`,
                            background:
                              "linear-gradient(90deg, #00b4ff, #00ffcc)",
                            borderRadius: 2,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "rgba(0,180,255,0.4)",
                          marginTop: 3,
                          letterSpacing: "0.08em",
                        }}
                      >
                        PROGRESS: {mission.progress}%
                      </div>
                    </div>
                  )}
                  <p
                    style={{
                      fontSize: 10,
                      color: "rgba(0,200,255,0.6)",
                      lineHeight: 1.5,
                      margin: "8px 0",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {mission.description}
                  </p>
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgba(0,180,255,0.4)",
                      letterSpacing: "0.12em",
                      marginBottom: 6,
                      marginTop: 8,
                    }}
                  >
                    OBJECTIVES
                  </div>
                  {mission.objectives.map((obj) => (
                    <div
                      key={obj}
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "flex-start",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: obj.endsWith("✓")
                            ? "#00ff88"
                            : "rgba(0,180,255,0.4)",
                          fontSize: 9,
                          lineHeight: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        {obj.endsWith("✓") ? "✓" : "○"}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: obj.endsWith("✓")
                            ? "rgba(0,255,136,0.6)"
                            : "rgba(0,200,255,0.55)",
                          letterSpacing: "0.05em",
                          lineHeight: 1.5,
                        }}
                      >
                        {obj.replace(" ✓", "")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
