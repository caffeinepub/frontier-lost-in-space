/**
 * CampaignPanel — Section 3 + Mission List
 */
import { useCreditsStore } from "../../credits/useCreditsStore";
import { useSpaceLogStore } from "../../story/useSpaceLogStore";
import { useStoryStore } from "../../story/useStoryStore";
import { useTacticalLogStore } from "../../tacticalLog/useTacticalLogStore";

function ResourceBar({
  label,
  value,
  color,
  warnBelow = 30,
}: {
  label: string;
  value: number;
  color: string;
  warnBelow?: number;
}) {
  const isWarn = value <= warnBelow;
  const displayColor = isWarn ? "#ff6644" : color;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.18em",
            color: isWarn ? "#ff6644" : "rgba(180,200,220,0.6)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.12em",
            fontWeight: 700,
            color: displayColor,
          }}
        >
          {Math.round(value)}%
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(0,20,40,0.6)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: isWarn
              ? "linear-gradient(90deg, #ff4422, #ff6644)"
              : `linear-gradient(90deg, ${displayColor}88, ${displayColor})`,
            boxShadow: isWarn
              ? "0 0 4px #ff664488"
              : `0 0 4px ${displayColor}55`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

const PHASE1_OBJECTIVES = [
  {
    id: "obj1",
    text: "Stabilize life support",
    check: (s: ReturnType<typeof useStoryStore.getState>) =>
      s.oxygenLevel >= 60,
  },
  {
    id: "obj2",
    text: "Repair hull integrity",
    check: (s: ReturnType<typeof useStoryStore.getState>) =>
      s.hullIntegrity >= 60,
  },
  {
    id: "obj3",
    text: "Investigate anomalous signal",
    check: (s: ReturnType<typeof useStoryStore.getState>) =>
      s.triggeredEvents.includes("p1_aegis_first_contact"),
  },
  {
    id: "obj4",
    text: "Survive first contact",
    check: (s: ReturnType<typeof useStoryStore.getState>) =>
      s.triggeredEvents.includes("p1_first_threat"),
  },
];

type MissionStatus = "active" | "complete" | "locked";

interface MissionDef {
  id: string;
  title: string;
  objective: string;
  status: MissionStatus;
  reward: number;
  description: string;
}

const PHASE1_MISSIONS: MissionDef[] = [
  {
    id: "m1_stabilize",
    title: "SYSTEM STABILIZATION",
    objective: "Restore oxygen above 60% and hull above 50%",
    status: "active",
    reward: 300,
    description:
      "Critical systems are failing. Restore life support and hull integrity to survive.",
  },
  {
    id: "m1_first_contact",
    title: "INVESTIGATE THE SIGNAL",
    objective: "Perform a scan and detect the unknown signal",
    status: "active",
    reward: 200,
    description:
      "A.E.G.I.S. has detected an anomalous signal. Scan the sector.",
  },
  {
    id: "m1_threat_clear",
    title: "CLEAR INCOMING THREATS",
    objective: "Intercept and destroy 3 incoming threats",
    status: "active",
    reward: 250,
    description:
      "Hostile debris fields are approaching Earth. Eliminate the threat.",
  },
  {
    id: "m1_resource_recovery",
    title: "RESOURCE RECOVERY",
    objective: "Accumulate 500 credits through gameplay",
    status: "locked",
    reward: 150,
    description: "Scavenge resources from destroyed threats to fund repairs.",
  },
];

const STATUS_COLOR: Record<MissionStatus, string> = {
  active: "#00ccff",
  complete: "#00ffaa",
  locked: "rgba(100,120,140,0.5)",
};

function MissionCard({ mission }: { mission: MissionDef }) {
  const handleAccept = () => {
    useTacticalLogStore.getState().addEntry({
      type: "mission",
      message: `MISSION ACCEPTED: ${mission.title} — ${mission.objective}`,
    });
  };

  const statusColor = STATUS_COLOR[mission.status];

  return (
    <div
      style={{
        background: "rgba(0,8,22,0.7)",
        border: `1px solid ${
          mission.status === "active"
            ? "rgba(0,160,220,0.2)"
            : mission.status === "complete"
              ? "rgba(0,220,160,0.2)"
              : "rgba(40,60,80,0.2)"
        }`,
        borderRadius: 5,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        opacity: mission.status === "locked" ? 0.55 : 1,
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color:
              mission.status === "locked"
                ? "rgba(100,120,140,0.5)"
                : "rgba(0,210,255,0.9)",
          }}
        >
          {mission.title}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: statusColor,
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}44`,
            borderRadius: 2,
            padding: "1px 5px",
            flexShrink: 0,
            textTransform: "uppercase",
          }}
        >
          {mission.status}
        </span>
      </div>

      {/* Objective */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color: "rgba(0,180,220,0.65)",
          letterSpacing: "0.07em",
          lineHeight: 1.4,
        }}
      >
        ▸ {mission.objective}
      </div>

      {/* Description */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color: "rgba(0,140,180,0.4)",
          letterSpacing: "0.06em",
          lineHeight: 1.4,
        }}
      >
        {mission.description}
      </div>

      {/* Footer: reward + button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 8,
            fontWeight: 700,
            color: "#ffee66",
            letterSpacing: "0.1em",
          }}
        >
          ◈ {mission.reward} CR
        </span>
        {mission.status === "active" && (
          <button
            type="button"
            data-ocid="campaign.button"
            onClick={handleAccept}
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#00ccff",
              background: "rgba(0,20,50,0.8)",
              border: "1px solid rgba(0,160,220,0.35)",
              borderRadius: 3,
              padding: "5px 10px",
              minHeight: 30,
              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ACCEPT
          </button>
        )}
      </div>
    </div>
  );
}

export default function CampaignPanel() {
  const storyState = useStoryStore();
  const openSpaceLog = useSpaceLogStore((s) => s.openPanel);
  const credits = useCreditsStore((s) => s.balance);
  const {
    currentPhase,
    phase1Complete,
    oxygenLevel,
    hullIntegrity,
    powerLevel,
    phaseScaffolds,
    choices,
  } = storyState;

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        fontFamily: "monospace",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as unknown as undefined,
      }}
    >
      {/* Header */}
      <div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "rgba(0,200,255,0.5)",
            marginBottom: 4,
          }}
        >
          CAMPAIGN
        </div>
        <div
          style={{
            fontSize: "clamp(13px, 2vw, 16px)",
            letterSpacing: "0.18em",
            fontWeight: 700,
            color: "rgba(0,230,255,0.9)",
            textShadow: "0 0 10px rgba(0,200,255,0.3)",
          }}
        >
          LOST IN SPACE
        </div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.15em",
            color: "rgba(0,160,200,0.4)",
            marginTop: 3,
          }}
        >
          PHASE {currentPhase} — {phase1Complete ? "COMPLETE" : "ACTIVE"}
        </div>
      </div>

      {/* Resources */}
      <div
        style={{
          background: "rgba(0,8,20,0.5)",
          border: "1px solid rgba(0,180,255,0.1)",
          borderRadius: 6,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 2,
          }}
        >
          SHIP RESOURCES
        </div>
        <ResourceBar label="OXYGEN" value={oxygenLevel} color="#00ccff" />
        <ResourceBar label="HULL" value={hullIntegrity} color="#00ffcc" />
        <ResourceBar label="POWER" value={powerLevel} color="#ffcc44" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "rgba(180,200,220,0.6)",
            }}
          >
            CREDITS
          </span>
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              fontWeight: 700,
              color: "#ffee66",
            }}
          >
            ◈ {credits.toLocaleString()} CR
          </span>
        </div>
      </div>

      {/* Phase 1 objectives */}
      <div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 8,
          }}
        >
          PHASE 1 OBJECTIVES
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PHASE1_OBJECTIVES.map((obj) => {
            const done = obj.check(storyState);
            return (
              <div
                key={obj.id}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: done ? "#00ffcc" : "rgba(0,100,140,0.3)",
                    border: `1px solid ${done ? "#00ffcc" : "rgba(0,120,160,0.3)"}`,
                    boxShadow: done ? "0 0 5px #00ffcc66" : "none",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    color: done
                      ? "rgba(0,200,180,0.8)"
                      : "rgba(140,180,200,0.5)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {obj.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== ACTIVE MISSIONS ========== */}
      <div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>ACTIVE MISSIONS</span>
          <span
            style={{
              fontSize: 8,
              color: "rgba(0,200,255,0.4)",
              letterSpacing: "0.1em",
            }}
          >
            {PHASE1_MISSIONS.filter((m) => m.status === "active").length} ACTIVE
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {PHASE1_MISSIONS.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </div>
      </div>

      {/* Recent decisions */}
      {choices.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.22em",
              color: "rgba(0,160,200,0.5)",
              marginBottom: 8,
            }}
          >
            RECENT DECISIONS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {choices.slice(0, 3).map((c) => (
              <div
                key={c.id}
                style={{
                  background: "rgba(0,10,30,0.4)",
                  border: "1px solid rgba(0,140,180,0.1)",
                  borderRadius: 4,
                  padding: "7px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: "rgba(0,200,220,0.7)",
                    marginBottom: 2,
                  }}
                >
                  {c.choiceText}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.08em",
                    color: "rgba(100,160,180,0.5)",
                    fontStyle: "italic",
                  }}
                >
                  {c.consequence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase timeline */}
      <div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 10,
          }}
        >
          CAMPAIGN PHASES
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
          }}
        >
          {/* Active Phase 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              paddingBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: phase1Complete ? "#00ffcc" : "#00ccff",
                  boxShadow: phase1Complete
                    ? "0 0 8px #00ffcc"
                    : "0 0 8px #00ccff",
                  animation: phase1Complete
                    ? "none"
                    : "phasePulse 1.6s ease-in-out infinite",
                  marginTop: 2,
                }}
              />
              <div
                style={{
                  width: 1,
                  flex: 1,
                  background: "rgba(0,120,160,0.2)",
                  marginTop: 4,
                  minHeight: 20,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                  color: phase1Complete
                    ? "rgba(0,200,180,0.8)"
                    : "rgba(0,220,255,0.9)",
                }}
              >
                PH.1 — FAILURE
              </div>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.1em",
                  color: "rgba(100,160,200,0.5)",
                  marginTop: 2,
                }}
              >
                Systems damaged. Tutorial integration. Basic survival.
              </div>
            </div>
            <span
              style={{
                fontSize: 7,
                letterSpacing: "0.15em",
                color: phase1Complete ? "#00ffcc" : "rgba(0,180,220,0.5)",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {phase1Complete ? "DONE" : "ACTIVE"}
            </span>
          </div>

          {/* Phases 2-6 scaffold */}
          {phaseScaffolds.map((phase, i) => (
            <div
              key={phase.phase}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                paddingBottom: i < phaseScaffolds.length - 1 ? 14 : 0,
                opacity: 0.45,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "rgba(0,80,120,0.4)",
                    border: "1px solid rgba(0,120,160,0.3)",
                    marginTop: 2,
                  }}
                />
                {i < phaseScaffolds.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      background: "rgba(0,80,120,0.15)",
                      marginTop: 4,
                      minHeight: 18,
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    fontWeight: 700,
                    color: "rgba(80,140,180,0.55)",
                  }}
                >
                  PH.{phase.phase} — {phase.name}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.08em",
                    color: "rgba(60,100,140,0.4)",
                    marginTop: 2,
                  }}
                >
                  {phase.description}
                </div>
              </div>
              <span
                style={{
                  fontSize: 7,
                  letterSpacing: "0.12em",
                  color: "rgba(60,100,140,0.4)",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                LOCKED
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Space Log button */}
      <button
        type="button"
        onClick={openSpaceLog}
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          letterSpacing: "0.2em",
          color: "rgba(220,180,60,0.8)",
          background: "rgba(60,40,0,0.25)",
          border: "1px solid rgba(200,150,0,0.22)",
          borderRadius: 5,
          padding: "11px 0",
          cursor: "pointer",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          width: "100%",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span>★</span>
        OPEN SPACE LOG
      </button>

      <style>{`
        @keyframes phasePulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
