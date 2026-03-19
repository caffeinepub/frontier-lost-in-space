import { create } from "zustand";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AlertEntry {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  expiresAt: number;
  acknowledged: boolean;
}

const ALERT_TEMPLATES: Record<
  string,
  Omit<AlertEntry, "id" | "timestamp" | "expiresAt" | "acknowledged">
> = {
  oxygen_leak: {
    type: "oxygen_leak",
    severity: "CRITICAL",
    title: "OXYGEN LEAK",
    message: "Oxygen reserves dropping rapidly. Immediate action required.",
  },
  recycler_malfunction: {
    type: "recycler_malfunction",
    severity: "WARNING",
    title: "RECYCLER MALFUNCTION",
    message: "Air recycler efficiency below threshold.",
  },
  shield_overload: {
    type: "shield_overload",
    severity: "WARNING",
    title: "SHIELD OVERLOAD",
    message: "Shield generators overloading. Reducing power draw.",
  },
  radar_outage: {
    type: "radar_outage",
    severity: "WARNING",
    title: "RADAR OUTAGE",
    message: "Long-range radar offline. Short-range only.",
  },
  power_conduit: {
    type: "power_conduit",
    severity: "INFO",
    title: "POWER CONDUIT",
    message: "Power conduit stress detected in sector 4.",
  },
  anomaly_contamination: {
    type: "anomaly_contamination",
    severity: "INFO",
    title: "ANOMALY DETECTED",
    message: "Unknown energy signature detected at current heading.",
  },
};

interface AlertsState {
  alerts: AlertEntry[];
  addAlert: (msg: string) => void;
  triggerAlert: (type: string) => void;
  tickAlerts: () => void;
  getCriticalAlerts: () => AlertEntry[];
  getActiveAlerts: () => AlertEntry[];
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  addAlert: (msg) =>
    set((s) => ({
      alerts: [
        ...s.alerts,
        {
          id: `alert-${Date.now()}`,
          type: "custom",
          severity: "INFO",
          title: "SYSTEM ALERT",
          message: msg,
          timestamp: Date.now(),
          expiresAt: Date.now() + 60000,
          acknowledged: false,
        },
      ],
    })),
  triggerAlert: (type) => {
    const template = ALERT_TEMPLATES[type];
    if (!template) return;
    // Don't stack duplicate active alerts of the same type
    const existing = get().alerts.find(
      (a) => a.type === type && Date.now() < a.expiresAt,
    );
    if (existing) return;
    set((s) => ({
      alerts: [
        ...s.alerts,
        {
          ...template,
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          expiresAt: Date.now() + 120000,
          acknowledged: false,
        },
      ],
    }));
  },
  tickAlerts: () => {
    const now = Date.now();
    set((s) => ({ alerts: s.alerts.filter((a) => now < a.expiresAt) }));
  },
  getCriticalAlerts: () =>
    get().alerts.filter(
      (a) => a.severity === "CRITICAL" && Date.now() < a.expiresAt,
    ),
  getActiveAlerts: () => get().alerts.filter((a) => Date.now() < a.expiresAt),
  acknowledgeAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a,
      ),
    })),
  clearAlerts: () => set({ alerts: [] }),
}));
