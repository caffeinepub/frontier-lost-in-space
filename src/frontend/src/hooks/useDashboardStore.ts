import { create } from "zustand";

interface DashboardState {
  activePanel: string | null;
  portraitDrawerOpen: boolean;
  portraitDrawerTab: string;
  dashboardOpen: boolean;

  setActivePanel: (panel: string | null) => void;
  openPortraitDrawer: (tab: string) => void;
  closePortraitDrawer: () => void;
  setPortraitDrawerTab: (tab: string) => void;
  openDashboard: () => void;
  closeDashboard: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activePanel: null,
  portraitDrawerOpen: false,
  portraitDrawerTab: "command",
  dashboardOpen: false,

  setActivePanel: (panel) => set({ activePanel: panel }),
  openPortraitDrawer: (tab) =>
    set({ portraitDrawerOpen: true, portraitDrawerTab: tab }),
  closePortraitDrawer: () => set({ portraitDrawerOpen: false }),
  setPortraitDrawerTab: (tab) => set({ portraitDrawerTab: tab }),
  openDashboard: () => set({ dashboardOpen: true }),
  closeDashboard: () => set({ dashboardOpen: false }),
}));
