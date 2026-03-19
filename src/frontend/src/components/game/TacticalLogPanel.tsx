import { useEffect, useRef } from "react";
import {
  LOG_COLOR,
  LOG_ICON,
  type LogEntryType,
  type LogFilter,
  useTacticalLogStore,
} from "../../tacticalLog/useTacticalLogStore";

const FILTERS: { label: string; value: LogFilter }[] = [
  { label: "ALL", value: "ALL" },
  { label: "COMBAT", value: "COMBAT" },
  { label: "RADAR", value: "RADAR" },
  { label: "ALERTS", value: "ALERTS" },
  { label: "SYSTEM", value: "SYSTEM" },
];

const FILTER_TYPES: Record<LogFilter, LogEntryType[]> = {
  ALL: ["combat", "radar", "alert", "system", "mission", "repair"],
  COMBAT: ["combat"],
  RADAR: ["radar"],
  ALERTS: ["alert"],
  SYSTEM: ["system", "repair", "mission"],
};

function formatTs(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function TacticalLogPanel() {
  const panelOpen = useTacticalLogStore((s) => s.panelOpen);
  const entries = useTacticalLogStore((s) => s.entries);
  const filter = useTacticalLogStore((s) => s.filter);
  const closePanel = useTacticalLogStore((s) => s.closePanel);
  const setFilter = useTacticalLogStore((s) => s.setFilter);

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const allowedTypes = FILTER_TYPES[filter];
  const visible = entries.filter((e) => allowedTypes.includes(e.type));

  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef is a stable ref
  useEffect(() => {
    if (panelOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [panelOpen, filter]);

  return (
    <>
      {/* Backdrop */}
      {panelOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={closePanel}
          onKeyDown={(e) => e.key === "Escape" && closePanel()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            cursor: "default",
          }}
        />
      )}

      {/* Panel */}
      <div
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          if (dy > 60) closePanel();
        }}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 71,
          height: "78dvh",
          background: "rgba(0,4,16,0.97)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(0,200,255,0.25)",
          borderRadius: "12px 12px 0 0",
          display: "flex",
          flexDirection: "column",
          transform: panelOpen ? "translateY(0)" : "translateY(105%)",
          transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 -4px 32px rgba(0,200,255,0.12)",
          pointerEvents: panelOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px 10px",
            borderBottom: "1px solid rgba(0,200,255,0.12)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                fontWeight: 700,
                color: "#00ffcc",
                textShadow: "0 0 10px #00ffcc66",
              }}
            >
              ≡ TACTICAL LOG
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                color: "rgba(0,180,255,0.45)",
                letterSpacing: "0.12em",
              }}
            >
              {visible.length} ENTRIES
            </span>
          </div>
          <button
            type="button"
            onClick={closePanel}
            style={{
              background: "transparent",
              border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: 3,
              color: "rgba(0,200,255,0.55)",
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.16em",
              cursor: "pointer",
              padding: "4px 10px",
              minHeight: 32,
              outline: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: "8px 12px",
            borderBottom: "1px solid rgba(0,200,255,0.08)",
            flexShrink: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                letterSpacing: "0.14em",
                fontWeight: 700,
                color: filter === f.value ? "#00ffcc" : "rgba(0,180,255,0.4)",
                background:
                  filter === f.value ? "rgba(0,50,70,0.9)" : "transparent",
                border: `1px solid ${
                  filter === f.value
                    ? "rgba(0,255,200,0.4)"
                    : "rgba(0,180,255,0.15)"
                }`,
                borderRadius: 3,
                cursor: "pointer",
                padding: "5px 10px",
                minHeight: 28,
                whiteSpace: "nowrap",
                outline: "none",
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                transition: "all 0.15s ease",
                boxShadow:
                  filter === f.value ? "0 0 8px rgba(0,255,200,0.2)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Entries */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            padding: "6px 0",
          }}
        >
          {visible.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                fontFamily: "monospace",
                fontSize: 9,
                color: "rgba(0,180,255,0.3)",
                letterSpacing: "0.18em",
              }}
            >
              NO ENTRIES
            </div>
          )}
          {visible.map((entry, i) => {
            const color = LOG_COLOR[entry.type];
            const icon = LOG_ICON[entry.type];
            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "7px 14px",
                  borderBottom:
                    i < visible.length - 1
                      ? "1px solid rgba(0,180,255,0.06)"
                      : "none",
                  background: i === 0 ? "rgba(0,255,200,0.02)" : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.4,
                    flexShrink: 0,
                    width: 18,
                    textAlign: "center",
                  }}
                >
                  {icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      fontWeight: 600,
                      color,
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {entry.message}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 7,
                    color: "rgba(0,160,200,0.4)",
                    letterSpacing: "0.1em",
                    flexShrink: 0,
                    lineHeight: 1.6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatTs(entry.ts)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Drag indicator */}
        <div
          style={{
            position: "absolute",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 32,
            height: 3,
            borderRadius: 2,
            background: "rgba(0,200,255,0.2)",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}
