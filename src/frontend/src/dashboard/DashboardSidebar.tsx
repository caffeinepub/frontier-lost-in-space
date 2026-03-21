import { memo } from "react";
import type { DashboardTab } from "../hooks/useDashboardStore";
import { useDashboardStore } from "../hooks/useDashboardStore";

const TABS: { id: DashboardTab; label: string; short: string }[] = [
  { id: "command", label: "COMMAND", short: "CMD" },
  { id: "navigation", label: "NAVIGATION", short: "NAV" },
  { id: "weapons", label: "WEAPONS", short: "WPN" },
  { id: "shields", label: "SHIELDS", short: "SHD" },
  { id: "scanner", label: "SCANNER", short: "SCN" },
  { id: "engineering", label: "ENGINEERING", short: "ENG" },
  { id: "missions", label: "MISSIONS", short: "MSN" },
  { id: "alerts", label: "ALERTS", short: "ALT" },
  { id: "logs", label: "LOGS", short: "LOG" },
  { id: "campaign", label: "CAMPAIGN", short: "CMP" },
];

const DashboardSidebar = memo(function DashboardSidebar({
  horizontal,
}: { horizontal?: boolean }) {
  const { activeDashboardTab, setTab, alerts } = useDashboardStore();
  const alertCount = alerts.filter((a) => !a.acknowledged).length;

  if (horizontal) {
    return (
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          borderBottom: "1px solid rgba(0,220,255,0.15)",
          background: "rgba(0,4,14,0.8)",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        {TABS.map((tab) => {
          const active = activeDashboardTab === tab.id;
          const isCampaign = tab.id === "campaign";
          return (
            <button
              key={tab.id}
              type="button"
              data-ocid={`dashboard.${tab.id}.tab`}
              onClick={() => setTab(tab.id)}
              style={{
                flexShrink: 0,
                padding: "10px 14px",
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.15em",
                fontWeight: active ? 700 : 400,
                color: active
                  ? isCampaign
                    ? "#ffcc44"
                    : "#00ffcc"
                  : "rgba(0,180,255,0.5)",
                background: active ? "rgba(0,40,60,0.6)" : "transparent",
                border: "none",
                borderBottom: active
                  ? `2px solid ${isCampaign ? "#ffcc44" : "#00ffcc"}`
                  : "2px solid transparent",
                cursor: "pointer",
                minHeight: 44,
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              {tab.short}
              {tab.id === "alerts" && alertCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 4,
                    background: "#ff4444",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 14,
                    height: 14,
                    fontSize: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 110,
        flexShrink: 0,
        borderRight: "1px solid rgba(0,220,255,0.15)",
        background: "rgba(0,4,14,0.5)",
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >
      {TABS.map((tab) => {
        const active = activeDashboardTab === tab.id;
        const isCampaign = tab.id === "campaign";
        return (
          <button
            key={tab.id}
            type="button"
            data-ocid={`dashboard.${tab.id}.tab`}
            onClick={() => setTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "12px 10px",
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.15em",
              fontWeight: active ? 700 : 400,
              color: active
                ? isCampaign
                  ? "#ffcc44"
                  : "#00ffcc"
                : "rgba(0,180,255,0.5)",
              background: active ? "rgba(0,40,60,0.5)" : "transparent",
              border: "none",
              borderLeft: active
                ? `2px solid ${isCampaign ? "#ffcc44" : "#00ffcc"}`
                : "2px solid transparent",
              cursor: "pointer",
              minHeight: 44,
              textAlign: "left",
              transition: "all 0.2s ease",
              position: "relative",
              boxShadow: active
                ? "inset 0 0 12px rgba(0,255,200,0.08)"
                : "none",
            }}
          >
            {tab.label}
            {tab.id === "alerts" && alertCount > 0 && (
              <span
                style={{
                  marginLeft: 4,
                  background: "#ff4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 14,
                  height: 14,
                  fontSize: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {alertCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default DashboardSidebar;
