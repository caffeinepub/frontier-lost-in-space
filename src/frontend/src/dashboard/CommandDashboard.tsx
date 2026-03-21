import { useEffect, useState } from "react";
import { useDashboardStore } from "../hooks/useDashboardStore";
import DashboardContent from "./DashboardContent";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return vp;
}

export default function CommandDashboard() {
  const { dashboardOpen, closeDashboard } = useDashboardStore();
  const { w, h } = useViewport();
  const isMobileLandscape = h < 500 && w > h;
  const isMobilePortrait = w <= 768 && !isMobileLandscape;
  const isDesktop = w > 768 && !isMobileLandscape;
  if (!dashboardOpen) return null;

  if (isDesktop) {
    return (
      <div
        data-ocid="dashboard.panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "clamp(380px, 35vw, 480px)",
          zIndex: 50,
          background: "rgba(0,8,20,0.97)",
          backdropFilter: "blur(16px)",
          borderLeft: "1px solid rgba(0,220,255,0.3)",
          boxShadow:
            "-4px 0 40px rgba(0,100,200,0.2), inset 1px 0 0 rgba(0,220,255,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <style>
          {
            "@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }"
          }
        </style>
        <DashboardTopBar onClose={closeDashboard} />
        <div
          style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
        >
          <DashboardSidebar />
          <DashboardContent />
        </div>
      </div>
    );
  }

  if (isMobilePortrait) {
    return (
      <div
        data-ocid="dashboard.panel"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(0,8,20,0.99)",
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          maxHeight: "100dvh",
          overflow: "hidden",
          animation: "fadeInUp 0.25s ease",
        }}
      >
        <style>
          {
            "@keyframes fadeInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }"
          }
        </style>
        <DashboardTopBar onClose={closeDashboard} />
        <DashboardSidebar horizontal />
        <div
          style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
        >
          <DashboardContent />
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="dashboard.panel"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,8,20,0.99)",
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <DashboardTopBar onClose={closeDashboard} />
      </div>
      <div
        style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
      >
        <div
          style={{
            width: 52,
            flexShrink: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <DashboardSidebar />
        </div>
        <DashboardContent landscape />
      </div>
    </div>
  );
}
