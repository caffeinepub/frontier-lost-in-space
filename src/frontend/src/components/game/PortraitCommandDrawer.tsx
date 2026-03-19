import { useEffect, useRef } from "react";
import AlertPanel from "../../alerts/AlertPanel";
import CommandPanel from "../../dashboard/panels/CommandPanel";
import EngineeringPanel from "../../dashboard/panels/EngineeringPanel";
import LogsPanel from "../../dashboard/panels/LogsPanel";
import ScannerPanel from "../../dashboard/panels/ScannerPanel";
import WeaponsPanel from "../../dashboard/panels/WeaponsPanel";
import { useDashboardStore } from "../../hooks/useDashboardStore";
import CampaignPanel from "./CampaignPanel";
import MarketPanel from "./MarketPanel";
import ShipStatusCards from "./ShipStatusCards";
import UpgradesPanel from "./UpgradesPanel";

const DRAWER_TABS = [
  { id: "command", label: "CMD" },
  { id: "ship", label: "SHIP" },
  { id: "weapons", label: "WPN" },
  { id: "scan", label: "SCAN" },
  { id: "upgrades", label: "UPGRADES" },
  { id: "system", label: "SYSTEM" },
  { id: "market", label: "MARKET" },
  { id: "alerts", label: "ALERTS" },
  { id: "logs", label: "LOG" },
  { id: "campaign", label: "CAMPAIGN" },
] as const;

function TabContent({ tab }: { tab: string }) {
  switch (tab) {
    case "command":
      return <CommandPanel />;
    case "ship":
      return <ShipStatusCards />;
    case "weapons":
      return <WeaponsPanel />;
    case "scan":
      return <ScannerPanel />;
    case "upgrades":
      return <UpgradesPanel />;
    case "system":
      return <EngineeringPanel />;
    case "market":
      return <MarketPanel />;
    case "alerts":
      return <AlertPanel />;
    case "logs":
      return <LogsPanel />;
    case "campaign":
      return <CampaignPanel />;
    default:
      return <CommandPanel />;
  }
}

export default function PortraitCommandDrawer() {
  const portraitDrawerOpen = useDashboardStore((s) => s.portraitDrawerOpen);
  const portraitDrawerTab = useDashboardStore((s) => s.portraitDrawerTab);
  const setPortraitDrawerTab = useDashboardStore((s) => s.setPortraitDrawerTab);
  const closePortraitDrawer = useDashboardStore((s) => s.closePortraitDrawer);
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeBtn = tabBarRef.current.querySelector(
      `[data-tab-id="${portraitDrawerTab}"]`,
    ) as HTMLElement | null;
    activeBtn?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [portraitDrawerTab]);

  const handleKeyClose = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape")
      closePortraitDrawer();
  };

  return (
    <>
      {portraitDrawerOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close drawer"
          onClick={closePortraitDrawer}
          onKeyDown={handleKeyClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 61,
            background: "rgba(0,0,0,0.4)",
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
          zIndex: 62,
          transform: portraitDrawerOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          maxHeight: "80dvh",
          height: "80dvh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(0,4,14,0.97)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(0,200,255,0.25)",
          borderRadius: "12px 12px 0 0",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          aria-label="Close drawer"
          onClick={closePortraitDrawer}
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 6px",
            cursor: "pointer",
            flexShrink: 0,
            background: "transparent",
            border: "none",
            width: "100%",
            outline: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,200,255,0.3)",
            }}
          />
        </button>

        <div
          ref={tabBarRef}
          style={{
            display: "flex",
            overflowX: "auto",
            borderBottom: "1px solid rgba(0,200,255,0.12)",
            flexShrink: 0,
            scrollbarWidth: "none",
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          {DRAWER_TABS.map((tab) => {
            const isActive = portraitDrawerTab === tab.id;
            const isCampaign = tab.id === "campaign";
            return (
              <button
                key={tab.id}
                type="button"
                data-tab-id={tab.id}
                onClick={() => setPortraitDrawerTab(tab.id)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                  color: isActive
                    ? isCampaign
                      ? "#ffcc44"
                      : "#00ffcc"
                    : "rgba(0,180,255,0.45)",
                  background: "transparent",
                  border: "none",
                  borderBottom: isActive
                    ? `2px solid ${isCampaign ? "#ffcc44" : "#00ffcc"}`
                    : "2px solid transparent",
                  cursor: "pointer",
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch" as unknown as undefined,
            overscrollBehavior: "contain",
          }}
        >
          <TabContent tab={portraitDrawerTab} />
        </div>
      </div>
    </>
  );
}
