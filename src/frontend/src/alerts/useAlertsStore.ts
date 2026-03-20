import { create } from "zustand";
import { useCreditsStore } from "../credits/useCreditsStore";
import { enqueueVoice } from "../systems/useAudioQueue";
import { usePersistenceStore } from "../utils/usePersistenceStore";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AlertOption {
  id: string;
  label: string;
  cost?: number;
  action: "repair" | "replace" | "ignore" | "reroute" | "buy";
  description?: string;
  consequence?: string;
}

export interface AlertEntry {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  expiresAt: number;
  acknowledged: boolean;
  options?: AlertOption[];
  resolved?: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  consequence?: string;
  system?: string;
}

const ALERT_TEMPLATES: Record<
  string,
  Omit<AlertEntry, "id" | "timestamp" | "expiresAt" | "acknowledged">
> = {
  oxygen_recycler_degrading: {
    type: "oxygen_recycler_degrading",
    severity: "WARNING",
    title: "OXYGEN RECYCLER DEGRADING",
    message:
      "Oxygen recycler efficiency dropping below threshold. Estimated breathable atmosphere: 4 hours.",
    system: "oxygen_recycler",
    consequence:
      "Oxygen levels will continue to drop. Risk increases over time.",
    options: [
      {
        id: "repair",
        label: "MANUAL REPAIR",
        cost: 50,
        action: "repair",
        description: "Restore recycler to full efficiency",
      },
      {
        id: "vent",
        label: "VENT RESERVES",
        action: "reroute",
        description: "Extends time but causes hull stress",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Risk level increases",
      },
    ],
  },
  shield_frequency_drift: {
    type: "shield_frequency_drift",
    severity: "WARNING",
    title: "SHIELD FREQUENCY DRIFT",
    message:
      "Shield frequency drifting from optimal range. Defensive effectiveness reduced by 22%.",
    system: "shields",
    consequence: "Shield effectiveness will continue to degrade.",
    options: [
      {
        id: "recalibrate",
        label: "RECALIBRATE",
        cost: 30,
        action: "repair",
        description: "Restore shield frequency",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Risk increases gradually",
      },
    ],
  },
  cooling_loop_blockage: {
    type: "cooling_loop_blockage",
    severity: "WARNING",
    title: "COOLING LOOP BLOCKAGE",
    message:
      "Weapon cooling loop partially blocked. Thermal buildup detected in starboard conduits.",
    system: "weapon_cooling",
    consequence: "Weapons may overheat and lock out.",
    options: [
      {
        id: "flush",
        label: "FLUSH SYSTEM",
        cost: 40,
        action: "repair",
        description: "Clear blockage completely",
      },
      {
        id: "reroute",
        label: "EMERGENCY REROUTE",
        action: "reroute",
        description: "Free, but reduces weapon performance",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Overheat risk builds",
      },
    ],
  },
  missile_rack_jam: {
    type: "missile_rack_jam",
    severity: "WARNING",
    title: "MISSILE RACK JAM",
    message: "Missile rack tracking mechanism jammed. Reload cycle blocked.",
    system: "missile_rack",
    consequence: "Missiles unavailable until cleared.",
    options: [
      {
        id: "clear",
        label: "MANUAL CLEAR",
        cost: 25,
        action: "repair",
        description: "Clear jam and restore rack",
      },
      {
        id: "leave",
        label: "LEAVE JAMMED",
        action: "ignore",
        description: "Missiles remain offline",
      },
      {
        id: "bypass",
        label: "BYPASS RACK",
        action: "reroute",
        description: "Reroute launcher control",
      },
    ],
  },
  radar_ghost_contacts: {
    type: "radar_ghost_contacts",
    severity: "INFO",
    title: "RADAR GHOST CONTACTS",
    message:
      "Sensor suite detecting anomalous ghost signals. May indicate cloaked contacts or interference.",
    system: "sensor_suite",
    consequence: "Target accuracy reduced.",
    options: [
      {
        id: "diagnostic",
        label: "RUN DIAGNOSTIC",
        cost: 20,
        action: "repair",
        description: "Clear false contacts",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Ghost contacts persist",
      },
    ],
  },
  armor_breach_sector4: {
    type: "armor_breach_sector4",
    severity: "CRITICAL",
    title: "ARMOR BREACH — SECTOR 4",
    message:
      "Critical armor breach detected in sector 4. Hull exposure risk elevated. Immediate attention required.",
    system: "armor",
    consequence:
      "Hull integrity at risk. Further hits cause direct hull damage.",
    options: [
      {
        id: "patch",
        label: "EMERGENCY PATCH",
        cost: 80,
        action: "repair",
        description: "Seal breach temporarily",
      },
      {
        id: "reinforce",
        label: "REINFORCE SECTOR",
        cost: 120,
        action: "replace",
        description: "Full reinforcement — permanent fix",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Hull exposure continues",
      },
    ],
  },
  cargo_seal_decay: {
    type: "cargo_seal_decay",
    severity: "INFO",
    title: "CARGO SEAL DECAY",
    message:
      "Cargo bay pressure seals showing wear. Minor atmospheric loss detected.",
    system: "cargo_seals",
    consequence: "Cargo integrity at risk over time.",
    options: [
      {
        id: "reseal",
        label: "RESEAL CARGO",
        cost: 35,
        action: "repair",
        description: "Restore seal integrity",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Gradual decay continues",
      },
    ],
  },
  reactor_instability: {
    type: "reactor_instability",
    severity: "CRITICAL",
    title: "REACTOR INSTABILITY",
    message:
      "Reactor core oscillation outside nominal parameters. Power grid fluctuating. Immediate stabilization recommended.",
    system: "reactor",
    consequence: "Uncontrolled cascade possible. All systems at risk.",
    options: [
      {
        id: "stabilize",
        label: "STABILIZE CORE",
        cost: 100,
        action: "repair",
        description: "Return reactor to nominal",
      },
      {
        id: "reduce_power",
        label: "REDUCE POWER",
        action: "reroute",
        description: "Free — limits all systems output",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Cascade risk increases rapidly",
      },
    ],
  },
  nav_array_drift: {
    type: "nav_array_drift",
    severity: "INFO",
    title: "NAV ARRAY DRIFT",
    message:
      "Navigation array showing 0.4 degree orbital drift. Course correction advised.",
    system: "nav_array",
    consequence: "Orbital positioning becomes imprecise.",
    options: [
      {
        id: "recalibrate",
        label: "RECALIBRATE NAV",
        cost: 15,
        action: "repair",
        description: "Restore navigation precision",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Drift accumulates over time",
      },
    ],
  },
  comms_relay_static: {
    type: "comms_relay_static",
    severity: "INFO",
    title: "COMMS RELAY STATIC",
    message:
      "Communications relay degrading. Signal clarity at 67%. Long-range comms affected.",
    system: "comms_relay",
    consequence: "Command network access degraded.",
    options: [
      {
        id: "boost",
        label: "BOOST SIGNAL",
        cost: 20,
        action: "repair",
        description: "Restore relay clarity",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Signal continues to degrade",
      },
    ],
  },
  life_support_stress: {
    type: "life_support_stress",
    severity: "WARNING",
    title: "LIFE SUPPORT STRESS",
    message:
      "Life support systems showing elevated stress indicators. Thermal management suboptimal.",
    system: "life_support",
    consequence: "Crew safety at risk if stress continues.",
    options: [
      {
        id: "repair",
        label: "REPAIR SYSTEMS",
        cost: 45,
        action: "repair",
        description: "Restore nominal life support",
      },
      {
        id: "conserve",
        label: "CONSERVE MODE",
        action: "reroute",
        description: "Free — limits mobility systems",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Stress levels rise",
      },
    ],
  },
  weapon_cooling_overtemp: {
    type: "weapon_cooling_overtemp",
    severity: "WARNING",
    title: "WEAPON COOLING OVERTEMP",
    message:
      "Weapon cooling systems at 94% thermal capacity. Sustained fire risk triggering automatic lockout.",
    system: "weapon_cooling",
    consequence: "Weapons will lock out if temperature exceeds limit.",
    options: [
      {
        id: "flush",
        label: "EMERGENCY FLUSH",
        cost: 30,
        action: "repair",
        description: "Clear thermal buildup",
      },
      {
        id: "forced_cooldown",
        label: "FORCED COOLDOWN",
        action: "reroute",
        description: "Free — weapons offline 60s",
      },
      {
        id: "ignore",
        label: "IGNORE",
        action: "ignore",
        description: "Auto-lockout imminent",
      },
    ],
  },
  // Legacy templates for backwards compatibility
  oxygen_leak: {
    type: "oxygen_leak",
    severity: "CRITICAL",
    title: "OXYGEN LEAK",
    message: "Oxygen reserves dropping rapidly. Immediate action required.",
    options: [
      { id: "seal", label: "SEAL LEAK", cost: 60, action: "repair" },
      { id: "ignore", label: "IGNORE", action: "ignore" },
    ],
  },
  recycler_malfunction: {
    type: "recycler_malfunction",
    severity: "WARNING",
    title: "RECYCLER MALFUNCTION",
    message: "Air recycler efficiency below threshold.",
    options: [
      { id: "repair", label: "REPAIR", cost: 40, action: "repair" },
      { id: "ignore", label: "IGNORE", action: "ignore" },
    ],
  },
  shield_overload: {
    type: "shield_overload",
    severity: "WARNING",
    title: "SHIELD OVERLOAD",
    message: "Shield generators overloading. Reducing power draw.",
    options: [
      { id: "reduce", label: "REDUCE POWER", action: "reroute" },
      { id: "ignore", label: "IGNORE", action: "ignore" },
    ],
  },
  radar_outage: {
    type: "radar_outage",
    severity: "WARNING",
    title: "RADAR OUTAGE",
    message: "Long-range radar offline. Short-range only.",
    options: [
      { id: "repair", label: "REPAIR RADAR", cost: 35, action: "repair" },
      { id: "ignore", label: "IGNORE", action: "ignore" },
    ],
  },
  power_conduit: {
    type: "power_conduit",
    severity: "INFO",
    title: "POWER CONDUIT",
    message: "Power conduit stress detected in sector 4.",
    options: [
      { id: "inspect", label: "INSPECT", cost: 10, action: "repair" },
      { id: "ignore", label: "IGNORE", action: "ignore" },
    ],
  },
  anomaly_contamination: {
    type: "anomaly_contamination",
    severity: "INFO",
    title: "ANOMALY DETECTED",
    message: "Unknown energy signature detected at current heading.",
    options: [
      { id: "scan", label: "FULL SCAN", cost: 15, action: "repair" },
      { id: "ignore", label: "IGNORE", action: "ignore" },
    ],
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
  resolveAlert: (id: string, optionId: string) => void;
  seedDegradationAlerts: () => void;
  tickDegradationCheck: () => void;
}

let _seeded = false;

const ALERT_VOICE_MAP: Record<string, string> = {
  oxygen_recycler: "alert_oxygen_warning",
  oxygen_recycler_degrading: "alert_oxygen_warning",
  shield_frequency: "alert_shield_drift",
  shield_frequency_drift: "alert_shield_drift",
  cooling_loop: "alert_cooling_loop",
  cooling_loop_blockage: "alert_cooling_loop",
  weapon_cooling_overtemp: "alert_cooling_loop",
  missile_rack: "alert_missile_jam",
  missile_rack_jam: "alert_missile_jam",
  reactor_instability: "alert_reactor_instability",
  hull_breach: "alert_hull_breach",
};

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
          expiresAt: Date.now() + 300000,
          acknowledged: false,
        },
      ],
    })),

  triggerAlert: (type) => {
    const template = ALERT_TEMPLATES[type];
    if (!template) return;
    const existing = get().alerts.find(
      (a) => a.type === type && Date.now() < a.expiresAt && !a.resolved,
    );
    if (existing) return;
    set((s) => ({
      alerts: [
        ...s.alerts,
        {
          ...template,
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          expiresAt: Date.now() + 600000,
          acknowledged: false,
          resolved: false,
        },
      ],
    }));
    // Voice line for this alert type
    const voiceKey =
      ALERT_VOICE_MAP[type] ??
      (template.severity === "CRITICAL" ? "alert_hull_breach" : null);
    if (voiceKey) enqueueVoice(voiceKey);
  },

  tickAlerts: () => {
    const now = Date.now();
    set((s) => ({
      alerts: s.alerts.filter((a) => now < a.expiresAt || a.resolved),
    }));
  },

  getCriticalAlerts: () =>
    get().alerts.filter(
      (a) =>
        a.severity === "CRITICAL" && Date.now() < a.expiresAt && !a.resolved,
    ),

  getActiveAlerts: () =>
    get().alerts.filter((a) => Date.now() < a.expiresAt && !a.resolved),

  acknowledgeAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a,
      ),
    })),

  clearAlerts: () => set({ alerts: [] }),

  resolveAlert: (id, optionId) => {
    const alert = get().alerts.find((a) => a.id === id);
    if (!alert) return;
    const option = alert.options?.find((o) => o.id === optionId);
    if (!option) return;
    // Deduct credits if cost
    if (option.cost && option.cost > 0) {
      const ok = useCreditsStore.getState().spendCredits(option.cost);
      if (!ok) return; // insufficient credits
    }
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              resolved: true,
              resolvedAt: Date.now(),
              resolvedBy: optionId,
              acknowledged: true,
            }
          : a,
      ),
    }));
    // Voice feedback on resolve
    enqueueVoice("alert_resolved");
    // Persist decision
    usePersistenceStore.saveAlertDecision(id, optionId);
    // Increment major decisions stat
    import("../missions/useMissionsStore").then(({ useMissionsStore }) => {
      useMissionsStore.getState().incrementStat("majorDecisions");
      useMissionsStore.getState().addLogEntry({
        type: "decision",
        message: `ALERT RESOLVED: ${alert.title} — Action: ${option.label}`,
      });
    });
  },

  seedDegradationAlerts: () => {
    if (_seeded) return;
    _seeded = true;
    const types = [
      "oxygen_recycler_degrading",
      "comms_relay_static",
      "weapon_cooling_overtemp",
    ];
    for (const type of types) {
      get().triggerAlert(type);
    }
  },

  tickDegradationCheck: () => {
    // Check ship systems and create alerts at thresholds
    import("../systems/useShipSystemsStore").then(({ useShipSystemsStore }) => {
      const subsystems = useShipSystemsStore.getState().subsystems;
      for (const sys of subsystems) {
        if (sys.status === "critical" || sys.status === "warning") {
          // Map subsystem id to alert type
          const alertMap: Record<string, string> = {
            oxygen_recycler: "oxygen_recycler_degrading",
            shields: "shield_frequency_drift",
            weapon_cooling: "weapon_cooling_overtemp",
            missile_rack: "missile_rack_jam",
            sensor_suite: "radar_ghost_contacts",
            armor: "armor_breach_sector4",
            cargo_seals: "cargo_seal_decay",
            reactor: "reactor_instability",
            nav_array: "nav_array_drift",
            comms_relay: "comms_relay_static",
            life_support: "life_support_stress",
          };
          const alertType = alertMap[sys.id];
          if (alertType) get().triggerAlert(alertType);
        }
      }
    });
  },
}));
