import { useEffect, useState } from "react";
import { useThreatStore } from "../../combat/useThreatStore";
import type { ThreatStatus } from "../../combat/useThreatStore";
import { useDashboardStore } from "../../hooks/useDashboardStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";

const STATUS_LABELS: Partial<Record<ThreatStatus, string>> = {
  INCOMING: "INCOMING OBJECT",
  IMPACT_RISK: "IMPACT RISK",
  PRIORITY_TARGET: "PRIORITY TARGET",
  INTERCEPT_WINDOW: "INTERCEPT WINDOW",
};
const STATUS_COLORS: Partial<Record<ThreatStatus, string>> = {
  INCOMING: "rgba(255,160,0,0.9)",
  IMPACT_RISK: "rgba(255,100,0,0.95)",
  PRIORITY_TARGET: "rgba(255,50,0,0.95)",
  INTERCEPT_WINDOW: "rgba(255,0,0,1.0)",
};

export default function PortraitStatusBar() {
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const scanMode = useTacticalStore((s) => s.toggleScanMode);
  const isScanMode = useTacticalStore((s) => s.scanMode);
  const clearNode = useTacticalStore((s) => s.clearNode);
  const toggleScanMode = useTacticalStore((s) => s.toggleScanMode);
  const openPortraitDrawer = useDashboardStore((s) => s.openPortraitDrawer);
  const threats = useThreatStore((s) => s.threats);
  const [pulse, setPulse] = useState(true);

  void scanMode;

  const activeThreats = threats.filter(
    (t) => t.status !== "DESTROYED" && t.status !== "SURVIVED",
  );
  const worstPriority: ThreatStatus[] = [
    "INTERCEPT_WINDOW",
    "PRIORITY_TARGET",
    "IMPACT_RISK",
    "INCOMING",
  ];
  const worst = worstPriority.find((s) =>
    activeThreats.some((t) => t.status === s),
  );

  useEffect(() => {
    if (!worst) return;
    const interval = setInterval(() => setPulse((p) => !p), 500);
    return () => clearInterval(interval);
  }, [worst]);

  const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: "0 14px",
    height: 44,
    minWidth: 64,
    fontFamily: "monospace",
    fontSize: 9,
    letterSpacing: "0.18em",
    fontWeight: 700,
    color: active ? color : "rgba(0,200,255,0.75)",
    background: active ? "rgba(0,50,70,0.9)" : "rgba(0,8,20,0.82)",
    border: `1px solid ${active ? `${color}99` : "rgba(0,200,255,0.3)"}`,
    borderRadius: 3,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    boxShadow: active ? `0 0 10px ${color}44` : "none",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap" as const,
    pointerEvents: "auto" as const,
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <div
      style={{
        paddingTop: "env(safe-area-inset-top, 8px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "rgba(0,3,12,0.75)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(0,200,255,0.1)",
        padding: "calc(env(safe-area-inset-top, 8px) + 6px) 12px 8px",
        position: "relative",
        zIndex: 45,
      }}
    >
      {/* AEGIS Warning Banner */}
      {worst && activeThreats.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: pulse ? "rgba(180,20,0,0.22)" : "rgba(80,8,0,0.15)",
              border: `1px solid ${STATUS_COLORS[worst] ?? "rgba(255,100,0,0.9)"}`,
              borderRadius: 2,
              padding: "3px 12px",
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.22em",
              color: STATUS_COLORS[worst] ?? "rgba(255,100,0,0.9)",
              transition: "background 0.25s",
              boxShadow: pulse
                ? `0 0 8px ${STATUS_COLORS[worst]}, 0 0 3px ${STATUS_COLORS[worst]}`
                : "none",
              whiteSpace: "nowrap",
              maxWidth: "90vw",
              textAlign: "center",
            }}
          >
            ⚠ A.E.G.I.S — {STATUS_LABELS[worst] ?? worst}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              color: "rgba(255,180,100,0.7)",
              letterSpacing: "0.14em",
            }}
          >
            {activeThreats.length} OBJECT{activeThreats.length > 1 ? "S" : ""}{" "}
            TRACKED
          </div>
        </div>
      )}

      {/* Control row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          pointerEvents: "auto",
        }}
      >
        {/* Target indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.16em",
              color: selectedNode ? "#00ffcc" : "rgba(0,180,255,0.4)",
              textShadow: selectedNode ? "0 0 8px #00ffcc88" : "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedNode ? `▸ ${selectedNode}` : "▸ NO TARGET"}
          </span>
          {selectedNode && (
            <button
              type="button"
              onClick={clearNode}
              style={{
                fontFamily: "monospace",
                fontSize: 7,
                letterSpacing: "0.1em",
                color: "rgba(0,160,200,0.5)",
                background: "transparent",
                border: "1px solid rgba(0,160,200,0.2)",
                borderRadius: 2,
                cursor: "pointer",
                padding: "2px 6px",
                minHeight: 28,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              CLR
            </button>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={toggleScanMode}
            style={btnStyle(isScanMode, "#00ffcc")}
          >
            {isScanMode ? "◉ SCAN" : "◎ SCAN"}
          </button>
          <button
            type="button"
            onClick={() => openPortraitDrawer("command")}
            style={btnStyle(false, "#00ccff")}
          >
            ⬡ CMD
          </button>
        </div>
      </div>
    </div>
  );
}
