import { memo } from "react";
import { useDashboardStore } from "../hooks/useDashboardStore";

const THREAT_COLORS: Record<string, string> = {
  NOMINAL: "#00ff88",
  ELEVATED: "#ffaa00",
  CRITICAL: "#ff3333",
};

function StatusPill({
  label,
  value,
  color,
}: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: "rgba(0,180,255,0.5)",
          letterSpacing: "0.15em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          color: color ?? "rgba(0,220,255,0.9)",
          letterSpacing: "0.1em",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

const DashboardTopBar = memo(function DashboardTopBar({
  onClose,
}: { onClose: () => void }) {
  const { shipStatus } = useDashboardStore();
  const threatColor = THREAT_COLORS[shipStatus.threat] ?? "#ffaa00";
  return (
    <div
      style={{
        padding: "10px 14px 10px 14px",
        borderBottom: "1px solid rgba(0,220,255,0.2)",
        background: "rgba(0,6,18,0.6)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "clamp(11px, 1.4vw, 14px)",
              fontFamily: "monospace",
              color: "#00e8ff",
              letterSpacing: "0.18em",
              fontWeight: 700,
              textShadow: "0 0 10px rgba(0,220,255,0.6)",
            }}
          >
            {shipStatus.name}
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: "rgba(0,180,255,0.5)",
              letterSpacing: "0.12em",
              marginTop: 2,
            }}
          >
            SECTOR {shipStatus.sector} &nbsp;·&nbsp;{" "}
            <span
              style={{
                color: threatColor,
                textShadow: `0 0 6px ${threatColor}`,
              }}
            >
              THREAT: {shipStatus.threat}
            </span>
          </div>
        </div>
        <button
          type="button"
          data-ocid="dashboard.close_button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "1px solid rgba(0,220,255,0.3)",
            color: "rgba(0,220,255,0.7)",
            fontFamily: "monospace",
            fontSize: 14,
            cursor: "pointer",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label="Close dashboard"
        >
          ✕
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          paddingTop: 6,
          borderTop: "1px solid rgba(0,220,255,0.1)",
        }}
      >
        <StatusPill
          label="HULL"
          value={`${shipStatus.hull}%`}
          color={
            shipStatus.hull > 60
              ? "#00ff88"
              : shipStatus.hull > 30
                ? "#ffaa00"
                : "#ff3333"
          }
        />
        <StatusPill
          label="SHIELDS"
          value={`${shipStatus.shields}%`}
          color="rgba(0,220,255,0.9)"
        />
        <StatusPill
          label="POWER"
          value={`${shipStatus.power}%`}
          color="rgba(0,220,255,0.9)"
        />
        <StatusPill label="SPEED" value={`${shipStatus.speed.toFixed(2)}c`} />
      </div>
    </div>
  );
});

export default DashboardTopBar;
