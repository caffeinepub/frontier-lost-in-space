import { create } from "zustand";

export type DashboardTab =
  | "command"
  | "navigation"
  | "weapons"
  | "shields"
  | "scanner"
  | "engineering"
  | "missions"
  | "alerts"
  | "logs"
  | "campaign";

export interface ShipStatus {
  name: string;
  sector: string;
  threat: "NOMINAL" | "ELEVATED" | "CRITICAL";
  hull: number;
  power: number;
  shields: number;
  speed: number;
}

export interface Alert {
  id: string;
  type: "threat" | "system" | "combat" | "navigation" | "aegis";
  severity: "INFO" | "WARNING" | "CRITICAL";
  level: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  timestamp: string;
  source?: string;
  acknowledged: boolean;
  resolvedAt?: string | null;
}

export interface LogEntry {
  id: string;
  type: "event" | "combat" | "system" | "navigation" | "scan";
  timestamp: string;
  message: string;
  category: "SYS" | "SCAN" | "COMBAT" | "NAV";
  severity?: "INFO" | "WARNING" | "CRITICAL";
  source?: string;
  targetId?: string;
  data?: Record<string, unknown>;
}

interface DashboardStore {
  dashboardOpen: boolean;
  activeDashboardTab: DashboardTab;
  activePanel: string | null;
  shipStatus: ShipStatus;
  alerts: Alert[];
  logs: LogEntry[];
  portraitDrawerOpen: boolean;
  portraitDrawerTab: string;
  openDashboard: (tab?: DashboardTab) => void;
  closeDashboard: () => void;
  setTab: (tab: DashboardTab) => void;
  setActivePanel: (panel: string | null) => void;
  dismissAlert: (id: string) => void;
  addLog: (msg: string, category?: LogEntry["category"]) => void;
  addAlert: (alert: Omit<Alert, "id" | "acknowledged">) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
  openPortraitDrawer: (tab?: string) => void;
  closePortraitDrawer: () => void;
  setPortraitDrawerTab: (tab: string) => void;
}

const MOCK_SHIP: ShipStatus = {
  name: "ISV PHANTOM WRAITH",
  sector: "ALPHA-7",
  threat: "ELEVATED",
  hull: 78,
  power: 84,
  shields: 61,
  speed: 0.42,
};

const MOCK_ALERTS: Alert[] = [
  {
    id: "a1",
    type: "system",
    severity: "CRITICAL",
    level: "CRITICAL",
    title: "HULL BREACH DETECTED",
    message:
      "Micro-fracture event on deck 7 — section 14-C reporting atmospheric loss.",
    timestamp: "04:14:02",
    source: "HULL-SENSOR-14C",
    acknowledged: false,
  },
  {
    id: "a2",
    type: "navigation",
    severity: "WARNING",
    level: "WARNING",
    title: "GRAVITATIONAL ANOMALY",
    message:
      "CLASS II gravitational distortion at grid 14-C. Course correction recommended.",
    timestamp: "04:12:38",
    source: "NAVIGATION-CORE",
    acknowledged: false,
  },
  {
    id: "a3",
    type: "system",
    severity: "WARNING",
    level: "WARNING",
    title: "SHIELD EMITTER FAULT",
    message:
      "Emitter #3 flux instability — resonance drift at 0.4% above nominal.",
    timestamp: "04:09:11",
    source: "SHIELD-EMITTER-3",
    acknowledged: false,
  },
  {
    id: "a4",
    type: "navigation",
    severity: "INFO",
    level: "INFO",
    title: "JUMP DRIVE COOLDOWN",
    message:
      "Jump drive cooldown active. Next available jump window in T-MINUS 00:08:32.",
    timestamp: "04:07:55",
    source: "DRIVE-CONTROL",
    acknowledged: true,
  },
  {
    id: "a5",
    type: "system",
    severity: "WARNING",
    level: "WARNING",
    title: "SENSOR ARRAY DEGRADED",
    message: "Long-range sensor array operating at 73% capacity.",
    timestamp: "04:06:30",
    source: "SENSOR-ARRAY-LR",
    acknowledged: false,
  },
];

const MOCK_LOGS: LogEntry[] = [
  {
    id: "l1",
    type: "scan",
    timestamp: "04:12:44",
    message: "Node NEXUS-7 locked — signal acquired",
    category: "SCAN",
    severity: "INFO",
    source: "SCAN-SUBSYSTEM",
  },
  {
    id: "l2",
    type: "scan",
    timestamp: "04:11:22",
    message: "Scan sweep complete — 14 nodes catalogued",
    category: "SCAN",
    severity: "INFO",
    source: "SCAN-SUBSYSTEM",
  },
  {
    id: "l3",
    type: "system",
    timestamp: "04:09:18",
    message: "Shield emitter fault logged — monitoring",
    category: "SYS",
    severity: "WARNING",
    source: "SHIELD-EMITTER-3",
  },
  {
    id: "l4",
    type: "navigation",
    timestamp: "04:07:01",
    message: "Jump drive charge initiated",
    category: "NAV",
    severity: "INFO",
    source: "DRIVE-CONTROL",
  },
  {
    id: "l5",
    type: "navigation",
    timestamp: "04:03:55",
    message: "Sector ALPHA-7 entered — threat ELEVATED",
    category: "NAV",
    severity: "WARNING",
    source: "NAVIGATION-CORE",
  },
  {
    id: "l6",
    type: "system",
    timestamp: "04:00:00",
    message: "System boot complete — all subsystems nominal",
    category: "SYS",
    severity: "INFO",
    source: "BOOT-SEQUENCER",
  },
];

export const useDashboardStore = create<DashboardStore>((set) => ({
  dashboardOpen: false,
  activeDashboardTab: "command",
  activePanel: null,
  shipStatus: MOCK_SHIP,
  alerts: MOCK_ALERTS,
  logs: MOCK_LOGS,
  portraitDrawerOpen: false,
  portraitDrawerTab: "command",

  openDashboard: (tab) =>
    set((s) => ({
      dashboardOpen: true,
      activeDashboardTab: tab ?? s.activeDashboardTab,
    })),
  closeDashboard: () => set({ dashboardOpen: false }),
  setTab: (tab) => set({ activeDashboardTab: tab }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  dismissAlert: (id) =>
    set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  addLog: (msg, category = "SYS") =>
    set((s) => ({
      logs: [
        {
          id: `l${Date.now()}`,
          type: "system" as const,
          timestamp: new Date().toTimeString().slice(0, 8),
          message: msg,
          category,
        },
        ...s.logs,
      ].slice(0, 50),
    })),
  addAlert: (alert) =>
    set((s) => ({
      alerts: [
        { ...alert, id: `a${Date.now()}`, acknowledged: false },
        ...s.alerts,
      ],
    })),
  acknowledgeAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a,
      ),
    })),
  clearAlerts: () => set({ alerts: [] }),
  openPortraitDrawer: (tab) =>
    set((s) => ({
      portraitDrawerOpen: true,
      portraitDrawerTab: tab ?? s.portraitDrawerTab,
    })),
  closePortraitDrawer: () => set({ portraitDrawerOpen: false }),
  setPortraitDrawerTab: (tab) => set({ portraitDrawerTab: tab }),
}));
