import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useCreditsStore } from "../credits/useCreditsStore";
import { useAlertsStore } from "./useAlertsStore";
import type { AlertEntry, AlertOption } from "./useAlertsStore";

class AlertErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("AlertPanel error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 16,
            fontFamily: "monospace",
            fontSize: 10,
            color: "rgba(255,100,0,0.7)",
          }}
        >
          ⚠ ALERT SYSTEM ERROR — Please reload to restore
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              display: "block",
              marginTop: 8,
              color: "rgba(0,200,255,0.8)",
              background: "transparent",
              border: "1px solid rgba(0,200,255,0.3)",
              padding: "4px 8px",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "#ff3030",
  WARNING: "#ff8800",
  INFO: "#00ccff",
};

function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(
    Math.max(0, expiresAt - Date.now()),
  );
  // FIX: was using useState(() => setInterval(...)) which leaked intervals
  // and returned the cleanup fn as state value instead of running it as cleanup.
  useEffect(() => {
    const iv = setInterval(
      () => setRemaining(Math.max(0, expiresAt - Date.now())),
      10000,
    );
    return () => clearInterval(iv);
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  if (remaining <= 0)
    return <span style={{ color: "rgba(255,60,60,0.7)" }}>EXPIRED</span>;
  return (
    <span style={{ color: "rgba(200,200,200,0.6)" }}>
      {mins}m {secs}s
    </span>
  );
}

function AlertOptionButton({
  option,
  onResolve,
  insufficientCredits,
}: {
  option: AlertOption;
  onResolve: (optionId: string) => void;
  insufficientCredits: boolean;
}) {
  const isIgnore = option.action === "ignore";
  const hasCost = (option.cost ?? 0) > 0;
  const disabled = hasCost && insufficientCredits;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onResolve(option.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: isIgnore ? "rgba(40,20,0,0.6)" : "rgba(0,30,50,0.7)",
        border: `1px solid ${isIgnore ? "rgba(120,60,0,0.4)" : "rgba(0,180,255,0.3)"}`,
        borderRadius: 3,
        padding: "5px 10px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "monospace",
        fontSize: 9,
        letterSpacing: "0.15em",
        color: disabled
          ? "rgba(120,120,120,0.5)"
          : isIgnore
            ? "rgba(200,140,60,0.8)"
            : "rgba(0,200,255,0.9)",
        width: "100%",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ flex: 1 }}>{option.label}</span>
      {hasCost && (
        <span
          style={{
            color: insufficientCredits
              ? "rgba(255,60,60,0.7)"
              : "rgba(255,200,60,0.9)",
          }}
        >
          {option.cost}cr
        </span>
      )}
      {!hasCost && !isIgnore && (
        <span style={{ color: "rgba(0,220,180,0.7)" }}>FREE</span>
      )}
    </button>
  );
}

function AlertCard({ alert }: { alert: AlertEntry }) {
  const resolveAlert = useAlertsStore((s) => s.resolveAlert);
  const credits = useCreditsStore((s) => s.balance);
  const [expanded, setExpanded] = useState(alert.severity !== "INFO");

  const color = SEVERITY_COLOR[alert.severity] ?? "#00ccff";

  if (alert.resolved) {
    const option = alert.options?.find((o) => o.id === alert.resolvedBy);
    return (
      <div
        style={{
          padding: "6px 10px",
          borderLeft: "2px solid rgba(0,180,100,0.3)",
          background: "rgba(0,20,10,0.4)",
          borderRadius: 2,
          opacity: 0.5,
        }}
      >
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
              letterSpacing: "0.1em",
              color: "rgba(0,200,120,0.7)",
            }}
          >
            ✓ {alert.title}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              color: "rgba(0,180,100,0.5)",
            }}
          >
            RESOLVED via {option?.label ?? alert.resolvedBy}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderLeft: `2px solid ${color}88`,
        background: `rgba(${alert.severity === "CRITICAL" ? "40,0,0" : alert.severity === "WARNING" ? "30,15,0" : "0,20,35"},0.7)`,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "monospace",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color,
            textShadow: `0 0 6px ${color}80`,
          }}
        >
          [{alert.severity}]
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "rgba(220,220,240,0.9)",
            textAlign: "left",
          }}
        >
          {alert.title}
        </span>
        <CountdownTimer expiresAt={alert.expiresAt} />
        <span style={{ color: "rgba(0,180,220,0.5)", fontSize: 8 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 10px 10px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontFamily: "monospace",
              fontSize: 9,
              color: "rgba(180,200,220,0.8)",
              lineHeight: 1.6,
            }}
          >
            {alert.message}
          </p>
          {alert.consequence && (
            <p
              style={{
                margin: "0 0 8px",
                fontFamily: "monospace",
                fontSize: 8,
                color: "rgba(255,160,60,0.7)",
                lineHeight: 1.5,
              }}
            >
              ⚠ IF IGNORED: {alert.consequence}
            </p>
          )}
          {alert.options && alert.options.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.2em",
                  color: "rgba(0,160,200,0.5)",
                  marginBottom: 4,
                }}
              >
                AVAILABLE ACTIONS
              </div>
              {alert.options.map((opt) => (
                <AlertOptionButton
                  key={opt.id}
                  option={opt}
                  onResolve={(optId) => resolveAlert(alert.id, optId)}
                  insufficientCredits={credits < (opt.cost ?? 0)}
                />
              ))}
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: "rgba(0,180,220,0.4)",
                  marginTop: 4,
                }}
              >
                CREDITS:{" "}
                <span style={{ color: "rgba(255,200,60,0.9)" }}>
                  {credits}cr
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertPanelContent() {
  // FIX: was using s.alerts.filter(...) directly in the selector, which returns a
  // new array reference on every call in Zustand v5 (useSyncExternalStore),
  // causing Object.is comparison to fail → infinite re-render loop → Error #185.
  // Fix: select the raw array (stable reference), filter in component body.
  const allAlerts = useAlertsStore((s) => s.alerts);
  const now = Date.now();
  const alerts = allAlerts.filter((a) => now < a.expiresAt || a.resolved);

  const active = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved).slice(0, 5);

  const critical = active.filter((a) => a.severity === "CRITICAL");
  const warning = active.filter((a) => a.severity === "WARNING");
  const info = active.filter((a) => a.severity === "INFO");

  const ordered = [...critical, ...warning, ...info];

  return (
    <div
      style={{
        padding: "12px 10px",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            color: "rgba(0,160,200,0.6)",
          }}
        >
          SHIP ALERTS
        </span>
        {active.length > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            {critical.length > 0 && (
              <span
                style={{
                  fontSize: 8,
                  color: "#ff3030",
                  background: "rgba(255,0,0,0.1)",
                  border: "1px solid rgba(255,0,0,0.3)",
                  borderRadius: 2,
                  padding: "1px 5px",
                }}
              >
                {critical.length} CRIT
              </span>
            )}
            {warning.length > 0 && (
              <span
                style={{
                  fontSize: 8,
                  color: "#ff8800",
                  background: "rgba(255,136,0,0.1)",
                  border: "1px solid rgba(255,136,0,0.3)",
                  borderRadius: 2,
                  padding: "1px 5px",
                }}
              >
                {warning.length} WARN
              </span>
            )}
            {info.length > 0 && (
              <span
                style={{
                  fontSize: 8,
                  color: "#00ccff",
                  background: "rgba(0,200,255,0.1)",
                  border: "1px solid rgba(0,200,255,0.3)",
                  borderRadius: 2,
                  padding: "1px 5px",
                }}
              >
                {info.length} INFO
              </span>
            )}
          </div>
        )}
      </div>

      {ordered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 0",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 20 }}>✓</div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "rgba(0,220,180,0.6)",
            }}
          >
            ALL SYSTEMS NOMINAL
          </div>
          <div style={{ fontSize: 8, color: "rgba(0,160,180,0.4)" }}>
            No active alerts detected
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ordered.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div
          style={{
            marginTop: 8,
            borderTop: "1px solid rgba(0,150,200,0.15)",
            paddingTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.2em",
              color: "rgba(0,140,180,0.4)",
              marginBottom: 6,
            }}
          >
            RECENT RESOLUTIONS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {resolved.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertPanel() {
  return (
    <AlertErrorBoundary>
      <AlertPanelContent />
    </AlertErrorBoundary>
  );
}
