// AlertPanel — stub placeholder
import { useAlertsStore } from "./useAlertsStore";

export default function AlertPanel() {
  const alerts = useAlertsStore((s) => s.getActiveAlerts());
  return (
    <div
      style={{
        padding: 12,
        fontFamily: "monospace",
        fontSize: 10,
        color: "rgba(0,200,255,0.8)",
      }}
    >
      <div
        style={{
          letterSpacing: "0.2em",
          marginBottom: 8,
          color: "rgba(0,160,200,0.5)",
        }}
      >
        ALERTS
      </div>
      {alerts.length === 0 ? (
        <div style={{ color: "rgba(0,180,220,0.4)" }}>NO ACTIVE ALERTS</div>
      ) : (
        alerts.map((a) => (
          <div
            key={a.id}
            style={{
              marginBottom: 6,
              padding: "4px 8px",
              border: "1px solid rgba(255,100,0,0.2)",
              borderRadius: 3,
            }}
          >
            <div
              style={{
                color:
                  a.severity === "CRITICAL"
                    ? "#ff5050"
                    : a.severity === "WARNING"
                      ? "#ff8800"
                      : "#00ccff",
              }}
            >
              {a.title}
            </div>
            <div
              style={{
                color: "rgba(180,200,220,0.6)",
                fontSize: 9,
                marginTop: 2,
              }}
            >
              {a.message}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
