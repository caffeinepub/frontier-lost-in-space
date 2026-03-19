/**
 * SpaceLogPanel — Section 3
 *
 * Commander journal / narrative log. Separate from TacticalLogPanel.
 * Slides up from bottom, glass style with amber/gold accents.
 */
import { useState } from "react";
import {
  SPACE_LOG_COLOR,
  SPACE_LOG_ICON,
  type SpaceLogEntryType,
  useSpaceLogStore,
} from "../../story/useSpaceLogStore";

const FILTERS: { label: string; value: SpaceLogEntryType | "ALL" }[] = [
  { label: "ALL", value: "ALL" },
  { label: "DECISIONS", value: "decision" },
  { label: "A.E.G.I.S.", value: "aegis" },
  { label: "MILESTONES", value: "milestone" },
];

function formatTs(ts: number): string {
  return new Date(ts).toTimeString().slice(0, 8);
}

export default function SpaceLogPanel() {
  const panelOpen = useSpaceLogStore((s) => s.panelOpen);
  const closePanel = useSpaceLogStore((s) => s.closePanel);
  const entries = useSpaceLogStore((s) => s.entries);
  const [activeFilter, setActiveFilter] = useState<SpaceLogEntryType | "ALL">(
    "ALL",
  );

  const handleFilter = (v: SpaceLogEntryType | "ALL") => {
    setActiveFilter(v);
  };

  const filtered =
    activeFilter === "ALL"
      ? entries
      : entries.filter((e) => e.type === activeFilter);

  const handleKeyClose = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") closePanel();
  };

  return (
    <>
      {panelOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close space log"
          onClick={closePanel}
          onKeyDown={handleKeyClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 250,
            background: "rgba(0,0,8,0.5)",
            cursor: "default",
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 251,
          height: "78dvh",
          maxHeight: "78dvh",
          transform: panelOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          background: "rgba(4,2,12,0.97)",
          backdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(200,160,0,0.22)",
          borderRadius: "12px 12px 0 0",
          boxShadow: "0 -8px 40px rgba(180,120,0,0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {/* Handle */}
        <button
          type="button"
          aria-label="Close space log"
          onClick={closePanel}
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 6px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            outline: "none",
            WebkitTapHighlightColor: "transparent",
            width: "100%",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(200,160,0,0.3)",
            }}
          />
        </button>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 16px 8px",
            borderBottom: "1px solid rgba(200,160,0,0.12)",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(10px, 1.4vw, 13px)",
                letterSpacing: "0.25em",
                fontWeight: 700,
                color: "rgba(220,180,60,0.9)",
                textShadow: "0 0 10px rgba(200,140,0,0.4)",
              }}
            >
              SPACE LOG
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(7px, 0.9vw, 9px)",
                letterSpacing: "0.2em",
                color: "rgba(160,120,0,0.55)",
                marginTop: 2,
              }}
            >
              COMMANDER JOURNAL
            </div>
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(7px, 0.9vw, 9px)",
              letterSpacing: "0.15em",
              color: "rgba(180,140,0,0.45)",
            }}
          >
            {entries.length} ENTRIES
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            overflowX: "auto",
            borderBottom: "1px solid rgba(200,160,0,0.1)",
            flexShrink: 0,
            scrollbarWidth: "none",
            padding: "0 8px",
          }}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFilter(f.value)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                  color: isActive ? "#ffcc44" : "rgba(160,120,0,0.45)",
                  background: "transparent",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #ffcc44"
                    : "2px solid transparent",
                  cursor: "pointer",
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Entries */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch" as unknown as undefined,
            overscrollBehavior: "contain",
            padding: "8px 0",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                fontFamily: "monospace",
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "rgba(140,100,0,0.35)",
                textAlign: "center",
              }}
            >
              NO ENTRIES
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(200,160,0,0.06)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1,
                    marginTop: 1,
                    flexShrink: 0,
                    color: SPACE_LOG_COLOR[entry.type],
                    textShadow: `0 0 6px ${SPACE_LOG_COLOR[entry.type]}88`,
                  }}
                >
                  {SPACE_LOG_ICON[entry.type]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Phase + timestamp */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 7,
                        letterSpacing: "0.18em",
                        color: "rgba(180,130,0,0.5)",
                        background: "rgba(200,140,0,0.1)",
                        border: "1px solid rgba(200,140,0,0.15)",
                        borderRadius: 2,
                        padding: "1px 5px",
                        flexShrink: 0,
                      }}
                    >
                      PH.{entry.phase}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 7,
                        letterSpacing: "0.12em",
                        color: "rgba(140,100,0,0.4)",
                      }}
                    >
                      {formatTs(entry.ts)}
                    </span>
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "clamp(9px, 1.2vw, 11px)",
                      letterSpacing: "0.14em",
                      fontWeight: 700,
                      color: SPACE_LOG_COLOR[entry.type],
                      marginBottom: 4,
                    }}
                  >
                    {entry.title}
                  </div>

                  {/* Body */}
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "clamp(9px, 1.1vw, 11px)",
                      letterSpacing: "0.05em",
                      color: "rgba(180,150,80,0.75)",
                      lineHeight: 1.55,
                      fontStyle: "italic",
                    }}
                  >
                    {entry.body}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
