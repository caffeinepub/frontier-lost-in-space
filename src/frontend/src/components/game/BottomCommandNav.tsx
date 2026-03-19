import { useDashboardStore } from "../../hooks/useDashboardStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useTacticalLogStore } from "../../tacticalLog/useTacticalLogStore";

const TABS = [
  { id: "command", label: "CMD", icon: "⬡" },
  { id: "scan", label: "SCAN", icon: "◎" },
  { id: "weapons", label: "WPN", icon: "⚡" },
  { id: "ship", label: "SHIP", icon: "◈" },
  { id: "log", label: "LOG", icon: "≡" },
] as const;

export default function BottomCommandNav() {
  const portraitDrawerOpen = useDashboardStore((s) => s.portraitDrawerOpen);
  const portraitDrawerTab = useDashboardStore((s) => s.portraitDrawerTab);
  const openPortraitDrawer = useDashboardStore((s) => s.openPortraitDrawer);
  const closePortraitDrawer = useDashboardStore((s) => s.closePortraitDrawer);
  const toggleScanMode = useTacticalStore((s) => s.toggleScanMode);
  const logPanelOpen = useTacticalLogStore((s) => s.panelOpen);
  const toggleLogPanel = useTacticalLogStore((s) => s.togglePanel);
  const closeLogPanel = useTacticalLogStore((s) => s.closePanel);

  const handleTab = (tabId: string) => {
    if (tabId === "log") {
      // Close the drawer if open, then toggle log panel
      if (portraitDrawerOpen) closePortraitDrawer();
      toggleLogPanel();
      return;
    }
    // Close log panel if open
    if (logPanelOpen) closeLogPanel();

    if (tabId === "scan") toggleScanMode();
    if (portraitDrawerOpen && portraitDrawerTab === tabId) {
      closePortraitDrawer();
    } else {
      openPortraitDrawer(tabId);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 65,
        background: "rgba(0,3,12,0.97)",
        borderTop: "1px solid rgba(0,200,255,0.2)",
        backdropFilter: "blur(12px)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        flexShrink: 0,
      }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.id === "log"
            ? logPanelOpen
            : portraitDrawerOpen && portraitDrawerTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTab(tab.id)}
            style={{
              flex: 1,
              height: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              background: "transparent",
              border: "none",
              borderTop: isActive
                ? "2px solid #00ffcc"
                : "2px solid transparent",
              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: isActive ? "#00ffcc" : "rgba(0,180,255,0.45)",
                lineHeight: 1,
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 7,
                letterSpacing: "0.16em",
                fontWeight: 700,
                color: isActive ? "#00ffcc" : "rgba(0,180,255,0.45)",
                textShadow: isActive ? "0 0 8px #00ffcc88" : "none",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
