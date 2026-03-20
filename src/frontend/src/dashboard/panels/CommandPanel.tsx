import { useState } from "react";
import { useAlertsStore } from "../../alerts/useAlertsStore";
import { usePlayerStore } from "../../combat/usePlayerStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useCreditsStore } from "../../credits/useCreditsStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useMissionsStore } from "../../missions/useMissionsStore";
import { useShipSystemsStore } from "../../systems/useShipSystemsStore";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

function MiniBar({
  value,
  color,
  label,
}: { value: number; color: string; label: string }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.1em",
          color: "rgba(0,160,200,0.6)",
          width: 80,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 3,
          background: "rgba(0,0,0,0.5)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.round(value)}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.5s",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color,
          width: 28,
          textAlign: "right",
        }}
      >
        {Math.round(value)}%
      </span>
    </div>
  );
}

function AegisRecommendations() {
  const weapons = useWeaponsStore((s) => s.weapons);
  const shield = usePlayerStore((s) => s.shield);
  const hull = usePlayerStore((s) => s.hull);
  // FIX: was using s.alerts.filter(...) in selector → new array ref every render
  // → Zustand v5 useSyncExternalStore infinite re-render = Error #185.
  // Fix: select raw array (stable ref), filter in component body.
  const allAlerts = useAlertsStore((s) => s.alerts);
  const now = Date.now();
  const alerts = allAlerts.filter((a) => now < a.expiresAt && !a.resolved);

  const tips: string[] = [];
  const allReady = weapons.every((w) => w.status === "READY");
  if (!allReady)
    tips.push("STANDBY: Weapon systems cycling. Await READY status.");
  if (shield < 40)
    tips.push("WARNING: Shield integrity critical. Reduce engagement range.");
  if (hull < 60)
    tips.push("WARNING: Hull integrity degraded. Prioritize evasive action.");
  const critAlerts = alerts.filter((a) => a.severity === "CRITICAL");
  if (critAlerts.length > 0)
    tips.push(
      `CRITICAL: ${critAlerts.length} system(s) require immediate attention.`,
    );
  if (tips.length === 0)
    tips.push("STATUS: All systems nominal. Continue standard patrol.");
  if (tips.length < 3)
    tips.push("RECOMMENDATION: Initiate active scan sweep — sector clear.");
  if (tips.length < 3)
    tips.push(
      "TACTICAL: Maintain orbital altitude. Next target window in 40s.",
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {tips.slice(0, 3).map((tip) => (
        <div
          key={tip}
          style={{
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.08em",
            color:
              tip.startsWith("CRITICAL") || tip.startsWith("WARNING")
                ? "rgba(255,140,40,0.8)"
                : "rgba(0,200,180,0.7)",
            lineHeight: 1.5,
            paddingLeft: 8,
            borderLeft: `1px solid ${
              tip.startsWith("CRITICAL") || tip.startsWith("WARNING")
                ? "rgba(255,140,40,0.3)"
                : "rgba(0,200,180,0.2)"
            }`,
          }}
        >
          {tip}
        </div>
      ))}
    </div>
  );
}

export default function CommandPanel() {
  const startTutorial = useTutorialStore((s) => s.startTutorial);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const tutorialComplete = useTutorialStore((s) => s.tutorialComplete);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const shield = usePlayerStore((s) => s.shield);
  const hull = usePlayerStore((s) => s.hull);
  const credits = useCreditsStore((s) => s.balance);
  const activeMission = useMissionsStore((s) => s.activeMission);
  const combatStats = useMissionsStore((s) => s.combatStats);
  const campaigns = useMissionsStore((s) => s.campaigns);
  // FIX: same Zustand v5 infinite re-render fix — select raw array, filter below
  const allAlerts = useAlertsStore((s) => s.alerts);
  const subsystems = useShipSystemsStore((s) => s.subsystems);
  const [notesOpen, setNotesOpen] = useState(false);

  const now = Date.now();
  const alerts = allAlerts.filter((a) => now < a.expiresAt && !a.resolved);

  const reactor = subsystems.find((s) => s.id === "reactor");
  const weaponsList = useWeaponsStore((s) => s.weapons);
  const allWeaponsReady = weaponsList.every((w) => w.status === "READY");
  const campaign = campaigns[0];
  const milestoneCount =
    campaign?.milestones.filter((m) => m.achieved).length ?? 0;
  const totalMilestones = campaign?.milestones.length ?? 4;
  const missionProgress = Math.round(
    (activeMission.progress / activeMission.target) * 100,
  );

  const critical = alerts.filter((a) => a.severity === "CRITICAL");
  const warning = alerts.filter((a) => a.severity === "WARNING");
  const info = alerts.filter((a) => a.severity === "INFO");

  return (
    <div
      style={{
        padding: "clamp(10px, 2vw, 14px)",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        color: "rgba(0,200,255,0.85)",
      }}
    >
      {/* Credits */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.15em",
            color: "rgba(255,200,60,0.8)",
          }}
        >
          CREDITS: {credits}cr
        </span>
      </div>

      {/* Mission Summary */}
      <Section label="ACTIVE MISSION">
        <div style={{ marginBottom: 6 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "rgba(0,230,180,0.9)",
              marginBottom: 2,
            }}
          >
            {activeMission.title}
          </div>
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.08em",
              color: "rgba(180,200,220,0.7)",
              lineHeight: 1.5,
              marginBottom: 4,
            }}
          >
            {activeMission.objective}
          </div>
          {activeMission.optionalObjective && (
            <div
              style={{
                fontSize: 8,
                color: "rgba(0,180,220,0.5)",
                lineHeight: 1.4,
                marginBottom: 4,
              }}
            >
              OPT: {activeMission.optionalObjective}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 3,
                background: "rgba(0,0,0,0.5)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${missionProgress}%`,
                  background:
                    activeMission.status === "complete"
                      ? "rgba(0,220,180,0.9)"
                      : "rgba(0,180,255,0.8)",
                  borderRadius: 2,
                  transition: "width 0.5s",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 8,
                color: "rgba(0,200,255,0.7)",
                whiteSpace: "nowrap",
              }}
            >
              {activeMission.progress}/{activeMission.target}
            </span>
            <span
              style={{
                fontSize: 8,
                color:
                  activeMission.status === "complete"
                    ? "rgba(0,220,180,0.9)"
                    : "rgba(0,180,255,0.7)",
                letterSpacing: "0.1em",
              }}
            >
              {activeMission.status === "complete" ? "COMPLETE" : "ACTIVE"}
            </span>
          </div>
        </div>
        {campaign && (
          <div>
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.15em",
                color: "rgba(0,160,200,0.5)",
                marginBottom: 4,
              }}
            >
              CAMPAIGN: {campaign.name}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {campaign.milestones.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    flex: 1,
                    height: 3,
                    background:
                      i <= milestoneCount - 1
                        ? "rgba(0,220,180,0.8)"
                        : "rgba(0,60,80,0.6)",
                    borderRadius: 1,
                    position: "relative",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontSize: 8,
                color: "rgba(0,160,200,0.4)",
                marginTop: 3,
              }}
            >
              {milestoneCount}/{totalMilestones} MILESTONES
            </div>
          </div>
        )}
      </Section>

      {/* Alerts Summary */}
      <Section label="ALERTS SUMMARY">
        {alerts.length === 0 ? (
          <div
            style={{
              fontSize: 8,
              color: "rgba(0,220,180,0.5)",
              letterSpacing: "0.1em",
            }}
          >
            ✓ ALL SYSTEMS NOMINAL
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              {critical.length > 0 && (
                <Badge color="#ff3030" label={`${critical.length} CRITICAL`} />
              )}
              {warning.length > 0 && (
                <Badge color="#ff8800" label={`${warning.length} WARNING`} />
              )}
              {info.length > 0 && (
                <Badge color="#00ccff" label={`${info.length} INFO`} />
              )}
            </div>
            {alerts.slice(0, 3).map((a) => (
              <div
                key={a.id}
                style={{
                  fontSize: 8,
                  letterSpacing: "0.08em",
                  color:
                    a.severity === "CRITICAL"
                      ? "rgba(255,80,80,0.8)"
                      : a.severity === "WARNING"
                        ? "rgba(255,160,60,0.8)"
                        : "rgba(0,180,220,0.7)",
                  lineHeight: 1.5,
                  marginBottom: 3,
                }}
              >
                ▸ {a.title}
              </div>
            ))}
          </>
        )}
      </Section>

      {/* Ship Overview */}
      <Section label="SHIP OVERVIEW">
        <MiniBar value={shield} color="rgba(0,180,255,0.8)" label="SHIELDS" />
        <MiniBar
          value={hull}
          color={hull > 50 ? "rgba(0,220,180,0.8)" : "rgba(255,120,40,0.8)"}
          label="HULL"
        />
        <MiniBar
          value={reactor?.health ?? 100}
          color="rgba(255,200,60,0.8)"
          label="REACTOR"
        />
        <div style={{ marginTop: 4, display: "flex", gap: 10 }}>
          <span
            style={{
              fontSize: 8,
              color: allWeaponsReady
                ? "rgba(0,220,180,0.7)"
                : "rgba(255,160,40,0.7)",
            }}
          >
            WPN: {allWeaponsReady ? "READY" : "CYCLING"}
          </span>
          <span
            style={{
              fontSize: 8,
              color: selectedNode
                ? "rgba(0,220,180,0.7)"
                : "rgba(0,160,200,0.5)",
            }}
          >
            TGT: {selectedNode ?? "NONE"}
          </span>
          <span style={{ fontSize: 8, color: "rgba(0,200,255,0.5)" }}>
            KIL: {combatStats.hostilesDestroyed}
          </span>
        </div>
      </Section>

      {/* A.E.G.I.S. Recommendations */}
      <Section label="A.E.G.I.S. COMMAND">
        <AegisRecommendations />
      </Section>

      {/* Tutorial (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontFamily: "monospace",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span
            style={{
              fontSize: 8,
              letterSpacing: "0.2em",
              color: "rgba(0,160,200,0.4)",
            }}
          >
            CALIBRATION
          </span>
          <span
            style={{
              fontSize: 8,
              color: "rgba(0,140,180,0.4)",
              transform: notesOpen ? "rotate(180deg)" : "none",
              display: "inline-block",
              transition: "transform 0.2s",
            }}
          >
            ▾
          </span>
        </button>
        {notesOpen && (
          <div style={{ marginTop: 6 }}>
            {tutorialComplete ? (
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(0,220,180,0.6)",
                  letterSpacing: "0.1em",
                }}
              >
                TUTORIAL COMPLETE
              </div>
            ) : tutorialActive ? (
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,200,40,0.8)",
                  letterSpacing: "0.1em",
                }}
              >
                TUTORIAL RUNNING...
              </div>
            ) : (
              <button
                type="button"
                data-ocid="cmd.launch-tutorial.button"
                onClick={startTutorial}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "rgba(0,220,200,0.9)",
                  background: "rgba(0,40,50,0.5)",
                  border: "1px solid rgba(0,200,180,0.4)",
                  borderRadius: 4,
                  padding: "8px 0",
                  cursor: "pointer",
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                LAUNCH TUTORIAL
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(0,150,200,0.12)",
        paddingBottom: 10,
      }}
    >
      <div
        style={{
          fontSize: 8,
          letterSpacing: "0.3em",
          color: "rgba(0,160,200,0.5)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        fontSize: 8,
        color,
        background: `${color}18`,
        border: `1px solid ${color}44`,
        borderRadius: 2,
        padding: "1px 5px",
        letterSpacing: "0.1em",
      }}
    >
      {label}
    </span>
  );
}
