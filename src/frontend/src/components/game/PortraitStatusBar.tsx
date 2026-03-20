/**
 * PortraitStatusBar — true overlay, does NOT push layout.
 * Compact 36px max height, threshold-based alerts only.
 */
import { useEffect, useState } from "react";
import { useAlertsStore } from "../../alerts/useAlertsStore";
import { useThreatStore } from "../../combat/useThreatStore";
import type { ThreatStatus } from "../../combat/useThreatStore";
import { useDashboardStore } from "../../hooks/useDashboardStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";

const STATUS_COLORS: Partial<Record<ThreatStatus, string>> = {
  INCOMING: "rgba(255,160,0,0.9)",
  IMPACT_RISK: "rgba(255,100,0,0.95)",
  PRIORITY_TARGET: "rgba(255,50,0,0.95)",
  INTERCEPT_WINDOW: "rgba(255,0,0,1.0)",
};

const STATUS_LABELS: Partial<Record<ThreatStatus, string>> = {
  INCOMING: "INCOMING OBJECT",
  IMPACT_RISK: "IMPACT RISK",
  PRIORITY_TARGET: "PRIORITY TARGET",
  INTERCEPT_WINDOW: "INTERCEPT WINDOW",
};

export default function PortraitStatusBar() {
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const isScanMode = useTacticalStore((s) => s.scanMode);
  const clearNode = useTacticalStore((s) => s.clearNode);
  const toggleScanMode = useTacticalStore((s) => s.toggleScanMode);
  const openPortraitDrawer = useDashboardStore((s) => s.openPortraitDrawer);
  const threats = useThreatStore((s) => s.threats);
  // FIX: Zustand v5 infinite re-render fix — select raw array, filter below
  const allAlerts = useAlertsStore((s) => s.alerts);
  const [pulse, setPulse] = useState(true);

  const now = Date.now();
  const activeAlerts = allAlerts.filter(
    (a) =>
      now < a.expiresAt &&
      !a.resolved &&
      (a.severity === "CRITICAL" || a.severity === "WARNING"),
  );

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
    if (!worst && activeAlerts.length === 0) return;
    const interval = setInterval(() => setPulse((p) => !p), 600);
    return () => clearInterval(interval);
  }, [worst, activeAlerts.length]);

  const worstAlert =
    activeAlerts.find((a) => a.severity === "CRITICAL") ?? activeAlerts[0];
  const showAlert = worst || worstAlert;

  const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: "0 10px",
    height: 28,
    minWidth: 50,
    fontFamily: "monospace",
    fontSize: 8,
    letterSpacing: "0.15em",
    fontWeight: 700,
    color: active ? color : "rgba(0,200,255,0.6)",
    background: active ? "rgba(0,40,60,0.9)" : "rgba(0,0,0,0.5)",
    border: `1px solid ${active ? `${color}88` : "rgba(0,200,255,0.2)"}`,
    borderRadius: 2,
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    boxShadow: active ? `0 0 8px ${color}33` : "none",
    transition: "all 0.15s ease",
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
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Alert notification — only when threshold alert exists */}
      {showAlert && (
        <div
          style={{
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "3px 12px",
            background: pulse ? "rgba(120,20,0,0.35)" : "rgba(60,8,0,0.2)",
            borderBottom: `1px solid ${worst ? (STATUS_COLORS[worst] ?? "rgba(255,100,0,0.5)") : "rgba(255,80,0,0.4)"}55`,
            backdropFilter: "blur(6px)",
            transition: "background 0.3s",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              letterSpacing: "0.22em",
              color: worst
                ? (STATUS_COLORS[worst] ?? "rgba(255,100,0,0.9)")
                : worstAlert?.severity === "CRITICAL"
                  ? "rgba(255,60,60,0.95)"
                  : "rgba(255,140,40,0.9)",
              whiteSpace: "nowrap",
            }}
          >
            {worst
              ? `\u26a0 A.E.G.I.S — ${STATUS_LABELS[worst] ?? worst} \u2022 ${activeThreats.length} TRACKED`
              : `\u26a0 ${worstAlert?.title ?? "ALERT"} \u2014 ${activeAlerts.length} ACTIVE`}
          </span>
        </div>
      )}

      {/* Control row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          pointerEvents: "auto",
          background: "rgba(0,0,8,0.55)",
          backdropFilter: "blur(6px)",
        }}
      >
        {selectedNode ? (
          <>
            <div
              style={{
                flex: 1,
                fontFamily: "monospace",
                fontSize: 8,
                letterSpacing: "0.12em",
                color: "rgba(0,220,180,0.9)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              \u25cf TGT: {selectedNode}
            </div>
            <button
              type="button"
              onClick={clearNode}
              style={btnStyle(false, "rgba(255,100,60,0.9)")}
              data-ocid="hud.clear_target.button"
            >
              CLR
            </button>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: 8,
              letterSpacing: "0.1em",
              color: "rgba(0,160,200,0.45)",
            }}
          >
            FRONTIER • SECTOR 7 • ORBITAL COMMAND
          </div>
        )}
        <button
          type="button"
          onClick={() => toggleScanMode()}
          style={btnStyle(isScanMode, "rgba(0,200,255,0.9)")}
          data-ocid="hud.scan.button"
        >
          SCN
        </button>
        <button
          type="button"
          onClick={() => openPortraitDrawer("command")}
          style={btnStyle(false, "rgba(0,200,255,0.9)")}
          data-ocid="hud.cmd.button"
        >
          CMD
        </button>
      </div>
    </div>
  );
}
