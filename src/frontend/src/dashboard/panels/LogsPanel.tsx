import { useCallback, useEffect, useRef, useState } from "react";
import { useAlertsStore } from "../../alerts/useAlertsStore";
import {
  type CEPInteractionType,
  type CEPLevel,
  CEP_LEVELS,
  useCEPStore,
} from "../../cep/useCEPStore";
import { useMissionsStore } from "../../missions/useMissionsStore";
import {
  LOG_COLOR,
  LOG_ICON,
  type LogEntryType,
  useTacticalLogStore,
} from "../../tacticalLog/useTacticalLogStore";

type LogTab = "MISSION" | "COMBAT" | "ALERTS" | "PURCHASES" | "AI" | "SYSTEM";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

const SESSION_START = Date.now();

function sessionTs(ts: number): string {
  const s = Math.floor((ts - SESSION_START) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `T+${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Trace entry ─────────────────────────────────────────────────────────────────

type TraceKind = "boot" | "presence" | "interaction" | "levelup" | "score";

interface TraceEntry {
  id: string;
  ts: number;
  kind: TraceKind;
  text: string;
  level?: CEPLevel;
}

const KIND_COLOR: Record<TraceKind, string> = {
  boot: "rgba(0,140,180,0.5)",
  presence: "rgba(0,180,200,0.55)",
  score: "rgba(0,160,200,0.55)",
  interaction: "rgba(180,210,40,0.75)",
  levelup: "rgba(255,80,80,0.95)",
};

const INTERACTION_LABEL: Record<CEPInteractionType, string> = {
  target: "TARGET LOCK",
  fire: "WEAPON DISCHARGE",
  move: "MOVEMENT",
  scan: "ACTIVE SCAN",
};

// ── CEP SYSTEM TRACE component ────────────────────────────────────────────

function CEPSystemTrace() {
  const level = useCEPStore((s) => s.level);
  const presenceScore = useCEPStore((s) => s.presenceScore);
  const interactionScore = useCEPStore((s) => s.interactionScore);
  const totalScore = useCEPStore((s) => s.totalScore);
  const levelHistory = useCEPStore((s) => s.levelHistory);
  const lastInteractionType = useCEPStore((s) => s.lastInteractionType);
  const lastInteractionTs = useCEPStore((s) => s.lastInteractionTs);

  const def = CEP_LEVELS[level];
  const nextDef = level < 5 ? CEP_LEVELS[level + 1] : null;
  const pct = nextDef
    ? Math.min(
        100,
        ((totalScore - def.threshold) / (nextDef.threshold - def.threshold)) *
          100,
      )
    : 100;

  // Trace log — built reactively from store events
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const traceRef = useRef<TraceEntry[]>([]);
  const countRef = useRef(0);
  const prevHistLen = useRef(0);
  const prevIntTs = useRef<number | null>(null);

  // push is stable: only touches refs + stable setTrace
  const push = useCallback((kind: TraceKind, text: string, lvl?: CEPLevel) => {
    const entry: TraceEntry = {
      id: `tr-${countRef.current++}`,
      ts: Date.now(),
      kind,
      text,
      level: lvl,
    };
    traceRef.current = [entry, ...traceRef.current].slice(0, 80);
    setTrace([...traceRef.current]);
  }, []);

  // Boot
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount
  useEffect(() => {
    push("boot", "SYSTEM TRACE ONLINE");
    push("presence", "MONITORING INITIALISED — PRESENCE SCORE: 0");
    push("boot", "CEP SCANNER IDLE — AWAITING THRESHOLD");
  }, [push]);

  // Level-up events (watch levelHistory length)
  // biome-ignore lint/correctness/useExhaustiveDependencies: prevHistLen is a stable ref
  useEffect(() => {
    if (
      levelHistory.length === 0 ||
      levelHistory.length === prevHistLen.current
    )
      return;
    prevHistLen.current = levelHistory.length;
    const entry = levelHistory[0];
    const d = CEP_LEVELS[entry.level];
    push("levelup", `▲ ESCALATION: ${d.label} (${d.code})`, entry.level);
    const delay = setTimeout(() => {
      push("levelup", d.description, entry.level);
    }, 1400);
    return () => clearTimeout(delay);
  }, [levelHistory, push]);

  // Interaction events
  // biome-ignore lint/correctness/useExhaustiveDependencies: prevIntTs is a stable ref
  useEffect(() => {
    if (!lastInteractionTs || lastInteractionTs === prevIntTs.current) return;
    prevIntTs.current = lastInteractionTs;
    if (!lastInteractionType) return;
    const label = INTERACTION_LABEL[lastInteractionType];
    const w = { target: 6, fire: 10, move: 1, scan: 3 }[lastInteractionType];
    push("interaction", `${label} RECORDED — +${w} PTS`);
  }, [lastInteractionTs, lastInteractionType, push]);

  // Periodic score updates (every ~20 pts)
  const lastLoggedScore = useRef(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: lastLoggedScore is a stable ref
  useEffect(() => {
    if (totalScore - lastLoggedScore.current < 20) return;
    lastLoggedScore.current = totalScore;
    const p = Math.round(presenceScore);
    const i = Math.round(interactionScore);
    push("score", `SCORE: ${Math.round(totalScore)} (P:${p} I:${i})`);
  }, [totalScore, presenceScore, interactionScore, push]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* ─── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 10px",
          borderBottom: "1px solid rgba(0,100,140,0.2)",
          background: "rgba(0,6,16,0.7)",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.2em",
            color: "rgba(0,160,200,0.5)",
          }}
        >
          CONSEQUENCE EXECUTION PROTOCOL
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.15em",
            color: def.color,
            padding: "1px 6px",
            border: `1px solid ${def.color}`,
            borderRadius: 2,
          }}
        >
          {def.code} — {def.label}
        </span>
      </div>

      {/* ─── Level pip bar ──────────────────────────────────────── */}
      <div style={{ padding: "0 10px 8px" }}>
        <div style={{ display: "flex", gap: 3, marginBottom: 5 }}>
          {CEP_LEVELS.map((d) => (
            <div
              key={d.level}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 1,
                background:
                  level >= d.level && d.level > 0
                    ? d.color
                    : d.level === 0
                      ? "rgba(0,40,60,0.4)"
                      : "rgba(0,30,50,0.35)",
                transition: "background 0.8s ease",
                boxShadow:
                  level === d.level && d.level > 0
                    ? `0 0 6px ${d.color}`
                    : "none",
              }}
            />
          ))}
        </div>

        {/* Progress to next level */}
        {nextDef && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 6,
                  color: "rgba(0,140,180,0.45)",
                }}
              >
                NEXT: {nextDef.code} {nextDef.label}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 6,
                  color: "rgba(0,160,200,0.5)",
                }}
              >
                {pct.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: 2,
                background: "rgba(0,40,60,0.5)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: nextDef.color,
                  transition: "width 1.5s ease",
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        )}
        {!nextDef && (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 6,
              color: "rgba(255,40,40,0.7)",
              letterSpacing: "0.15em",
            }}
          >
            MAXIMUM PROTOCOL ACTIVE
          </div>
        )}
      </div>

      {/* ─── Score strip ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "4px 10px 8px",
          borderBottom: "1px solid rgba(0,80,120,0.1)",
          marginBottom: 4,
        }}
      >
        {[
          {
            label: "PRESENCE",
            val: presenceScore.toFixed(0),
            color: "rgba(0,200,180,0.65)",
          },
          {
            label: "INTERACT",
            val: interactionScore.toFixed(0),
            color: "rgba(180,210,40,0.75)",
          },
          { label: "TOTAL", val: totalScore.toFixed(0), color: def.color },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: "rgba(0,10,20,0.5)",
              border: "1px solid rgba(0,80,120,0.2)",
              borderRadius: 2,
              padding: "3px 5px",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 6,
                color: "rgba(0,140,180,0.4)",
                marginBottom: 1,
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: item.color,
              }}
            >
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Trace header ─────────────────────────────────────────── */}
      <div
        style={{
          padding: "0 10px 5px",
          fontFamily: "monospace",
          fontSize: 6,
          letterSpacing: "0.15em",
          color: "rgba(0,100,140,0.4)",
        }}
      >
        ── SYS TRACE ─────────────────────────────────
      </div>

      {/* ─── Trace entries ───────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          padding: "0 10px",
        }}
      >
        {trace.map((entry) => {
          const entryColor =
            entry.level !== undefined
              ? CEP_LEVELS[entry.level].color
              : KIND_COLOR[entry.kind];
          const prefix =
            entry.level !== undefined
              ? CEP_LEVELS[entry.level].logPrefix
              : entry.kind === "boot"
                ? "SYS"
                : entry.kind === "score"
                  ? "SCR"
                  : entry.kind === "interaction"
                    ? "INT"
                    : "TRC";

          return (
            <div
              key={entry.id}
              style={{
                display: "flex",
                gap: 5,
                alignItems: "flex-start",
                padding: "2px 0",
                borderBottom: "1px solid rgba(0,60,100,0.07)",
                animation: "cepFadeIn 0.5s ease forwards",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 6,
                  color: "rgba(0,100,140,0.45)",
                  flexShrink: 0,
                  paddingTop: 1,
                  minWidth: 36,
                }}
              >
                {sessionTs(entry.ts)}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 6,
                  color: entryColor,
                  flexShrink: 0,
                  paddingTop: 1,
                  minWidth: 24,
                  letterSpacing: "0.04em",
                }}
              >
                [{prefix}]
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 7,
                  color: entryColor,
                  lineHeight: 1.4,
                  flex: 1,
                  letterSpacing: "0.04em",
                }}
              >
                {entry.text}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes cepFadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main LogsPanel ─────────────────────────────────────────────────────────

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

  const tabs: LogTab[] = [
    "MISSION",
    "COMBAT",
    "ALERTS",
    "PURCHASES",
    "AI",
    "SYSTEM",
  ];

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
                tab === "SYSTEM"
                  ? activeTab === tab
                    ? "rgba(255,80,80,0.95)"
                    : "rgba(160,50,50,0.55)"
                  : activeTab === tab
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
          padding: activeTab === "SYSTEM" ? "8px 0 16px" : "8px 10px",
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

        {activeTab === "SYSTEM" && <CEPSystemTrace />}
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
