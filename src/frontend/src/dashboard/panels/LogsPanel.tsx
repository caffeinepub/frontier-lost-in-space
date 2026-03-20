import { useState } from "react";
import { useAlertsStore } from "../../alerts/useAlertsStore";
import { useMissionsStore } from "../../missions/useMissionsStore";
import {
  LOG_COLOR,
  LOG_ICON,
  type LogEntryType,
  useTacticalLogStore,
} from "../../tacticalLog/useTacticalLogStore";

type LogTab = "MISSION" | "COMBAT" | "ALERTS" | "PURCHASES" | "AI";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function LogsPanel() {
  const [activeTab, setActiveTab] = useState<LogTab>("MISSION");
  const tacEntries = useTacticalLogStore((s) => s.entries);
  const missionLog = useMissionsStore((s) => s.missionLog);
  const alerts = useAlertsStore((s) => s.alerts);

  const combatEntries = tacEntries.filter(
    (e) => e.type === "combat" || e.type === "mission" || e.type === "repair",
  );
  const aiEntries = tacEntries.filter(
    (e) => e.type === "system" || e.type === "radar",
  );
  const resolvedAlerts = alerts.filter((a) => a.resolved);
  const purchaseEntries = missionLog.filter((e) => e.type === "purchase");

  const tabs: LogTab[] = ["MISSION", "COMBAT", "ALERTS", "PURCHASES", "AI"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "monospace",
      }}
    >
      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(0,150,200,0.2)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            data-ocid={`logs.${tab.toLowerCase()}.tab`}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              background:
                activeTab === tab ? "rgba(0,40,60,0.8)" : "transparent",
              border: "none",
              borderBottom:
                activeTab === tab ? "1px solid rgba(0,200,255,0.6)" : "none",
              color:
                activeTab === tab
                  ? "rgba(0,200,255,0.9)"
                  : "rgba(0,140,180,0.4)",
              fontFamily: "monospace",
              fontSize: 7,
              letterSpacing: "0.1em",
              padding: "6px 0",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {activeTab === "MISSION" &&
          (missionLog.length === 0 ? (
            <EmptyState msg="No mission log entries yet" />
          ) : (
            missionLog.map((e) => (
              <LogRow
                key={e.id}
                icon="\uD83C\uDFAF"
                color="#44ff88"
                time={timeAgo(e.timestamp)}
                message={e.message}
                type={e.type}
              />
            ))
          ))}
        {activeTab === "COMBAT" &&
          (combatEntries.length === 0 ? (
            <EmptyState msg="No combat events recorded" />
          ) : (
            combatEntries
              .slice(0, 50)
              .map((e) => (
                <LogRow
                  key={e.id}
                  icon={LOG_ICON[e.type as LogEntryType] ?? "\u26a1"}
                  color={LOG_COLOR[e.type as LogEntryType] ?? "#00ffcc"}
                  time={timeAgo(e.ts)}
                  message={e.message}
                  type={e.type}
                />
              ))
          ))}
        {activeTab === "ALERTS" &&
          (resolvedAlerts.length === 0 ? (
            <EmptyState msg="No resolved alerts in this session" />
          ) : (
            resolvedAlerts.map((a) => (
              <LogRow
                key={a.id}
                icon="\u26a0\ufe0f"
                color={
                  a.severity === "CRITICAL"
                    ? "#ff3030"
                    : a.severity === "WARNING"
                      ? "#ff8800"
                      : "#00ccff"
                }
                time={a.resolvedAt ? timeAgo(a.resolvedAt) : ""}
                message={`${a.title} \u2014 Resolved: ${a.resolvedBy ?? "unknown"}`}
                type="alert"
              />
            ))
          ))}
        {activeTab === "PURCHASES" &&
          (purchaseEntries.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <EmptyState msg="No market purchases this session" />
              <LogRow
                icon="\uD83D\uDED2"
                color="rgba(255,200,60,0.7)"
                time="session start"
                message="Market terminal online. Browse upgrades in WPN panel."
                type="purchase"
              />
            </div>
          ) : (
            purchaseEntries.map((e) => (
              <LogRow
                key={e.id}
                icon="\uD83D\uDED2"
                color="rgba(255,200,60,0.7)"
                time={timeAgo(e.timestamp)}
                message={e.message}
                type="purchase"
              />
            ))
          ))}
        {activeTab === "AI" &&
          (aiEntries.length === 0 ? (
            <EmptyState msg="No A.E.G.I.S. notes" />
          ) : (
            aiEntries
              .slice(0, 50)
              .map((e) => (
                <LogRow
                  key={e.id}
                  icon={LOG_ICON[e.type as LogEntryType] ?? "\uD83E\uDD16"}
                  color={LOG_COLOR[e.type as LogEntryType] ?? "#8899aa"}
                  time={timeAgo(e.ts)}
                  message={e.message}
                  type={e.type}
                />
              ))
          ))}
      </div>
    </div>
  );
}

function LogRow({
  icon,
  color,
  time,
  message,
  type,
}: {
  icon: string;
  color: string;
  time: string;
  message: string;
  type: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "4px 0",
        borderBottom: "1px solid rgba(0,100,140,0.1)",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 10, flexShrink: 0, color }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.06em",
            color: "rgba(180,200,220,0.8)",
            lineHeight: 1.5,
          }}
        >
          {message}
        </div>
        <div
          style={{ fontSize: 7, color: "rgba(0,140,180,0.4)", marginTop: 2 }}
        >
          {time} {time ? "\u2022" : ""} {type.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div
      style={{
        padding: "16px 0",
        textAlign: "center",
        fontFamily: "monospace",
        fontSize: 8,
        color: "rgba(0,140,180,0.4)",
        letterSpacing: "0.1em",
      }}
    >
      {msg}
    </div>
  );
}
