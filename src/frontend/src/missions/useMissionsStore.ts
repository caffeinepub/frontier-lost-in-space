import { create } from "zustand";
import { enqueueVoice, interruptVoice } from "../systems/useAudioQueue";

export interface MissionLogEntry {
  id: string;
  timestamp: number;
  type: "system" | "mission" | "combat" | "repair" | "purchase" | "decision";
  message: string;
}

export interface Milestone {
  id: string;
  label: string;
  achieved: boolean;
  achievedAt?: number;
}

export interface Campaign {
  id: string;
  name: string;
  milestones: Milestone[];
  currentMilestoneIndex: number;
}

export interface ActiveMission {
  id: string;
  title: string;
  campaign: string;
  objective: string;
  optionalObjective?: string;
  status: "active" | "complete" | "failed";
  progress: number;
  target: number;
}

export interface CombatStats {
  hostilesDestroyed: number;
  successfulLocks: number;
  repairsCompleted: number;
  scansCompleted: number;
  marketPurchases: number;
  majorDecisions: number;
}

const now = Date.now();
const SESSION_START = now;

const INITIAL_LOG: MissionLogEntry[] = [
  {
    id: "seed-3",
    timestamp: SESSION_START,
    type: "system",
    message:
      "A.E.G.I.S. ONLINE — Tactical overlay active. All subsystems initialized.",
  },
  {
    id: "seed-2",
    timestamp: SESSION_START - 60000,
    type: "mission",
    message:
      "SECTOR 7 CLEARANCE — Campaign initiated. Primary objective received.",
  },
  {
    id: "seed-1",
    timestamp: SESSION_START - 120000,
    type: "system",
    message: "Orbital insertion complete. All systems check. Standing by.",
  },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "campaign-001",
    name: "SECTOR 7 CLEARANCE",
    currentMilestoneIndex: 0,
    milestones: [
      { id: "m1", label: "First Contact", achieved: false },
      { id: "m2", label: "Sector Sweep", achieved: false },
      { id: "m3", label: "Anomaly Scan", achieved: false },
      { id: "m4", label: "Deep Orbit", achieved: false },
    ],
  },
];

function loadStats(): CombatStats {
  try {
    const raw = localStorage.getItem("frontier_combat_stats");
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    hostilesDestroyed: 0,
    successfulLocks: 0,
    repairsCompleted: 0,
    scansCompleted: 0,
    marketPurchases: 0,
    majorDecisions: 0,
  };
}

function loadLog(): MissionLogEntry[] {
  try {
    const raw = localStorage.getItem("frontier_mission_log");
    if (raw) {
      const saved: MissionLogEntry[] = JSON.parse(raw);
      return [
        ...INITIAL_LOG,
        ...saved.filter((e) => !e.id.startsWith("seed-")),
      ];
    }
  } catch {
    /* ignore */
  }
  return INITIAL_LOG;
}

interface MissionsState {
  activeMission: ActiveMission;
  missionLog: MissionLogEntry[];
  combatStats: CombatStats;
  campaigns: Campaign[];
  addLogEntry: (entry: Omit<MissionLogEntry, "id" | "timestamp">) => void;
  incrementStat: (key: keyof CombatStats) => void;
  updateMissionProgress: (amount?: number) => void;
  completeMission: () => void;
}

export const useMissionsStore = create<MissionsState>((set, get) => ({
  activeMission: {
    id: "MISSION-001",
    title: "HOSTILE INTERCEPT",
    campaign: "SECTOR 7 CLEARANCE",
    objective: "Destroy 3 hostile drones in Sector 7",
    optionalObjective: "Scan debris field at coordinates 7-Alpha",
    status: "active",
    progress: 0,
    target: 3,
  },
  missionLog: loadLog(),
  combatStats: loadStats(),
  campaigns: INITIAL_CAMPAIGNS,

  addLogEntry: (entry) => {
    const newEntry: MissionLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(),
      ...entry,
    };
    set((s) => {
      const updated = [newEntry, ...s.missionLog].slice(0, 200);
      try {
        localStorage.setItem(
          "frontier_mission_log",
          JSON.stringify(updated.filter((e) => !e.id.startsWith("seed-"))),
        );
      } catch {
        /* ignore */
      }
      return { missionLog: updated };
    });
  },

  incrementStat: (key) => {
    set((s) => {
      const updated = { ...s.combatStats, [key]: s.combatStats[key] + 1 };
      try {
        localStorage.setItem("frontier_combat_stats", JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return { combatStats: updated };
    });
    // Update mission progress when hostilesDestroyed increments
    if (key === "hostilesDestroyed") {
      get().updateMissionProgress();
    }
  },

  updateMissionProgress: (amount = 1) => {
    const prevMission = get().activeMission;
    set((s) => {
      const mission = s.activeMission;
      if (mission.status !== "active") return {};
      const newProgress = Math.min(mission.target, mission.progress + amount);
      const complete = newProgress >= mission.target;
      return {
        activeMission: {
          ...mission,
          progress: newProgress,
          status: complete ? "complete" : "active",
        },
      };
    });
    const updated = get().activeMission;
    if (updated.status === "complete" && prevMission.status !== "complete") {
      interruptVoice("mission_complete");
    } else if (updated.status === "active") {
      enqueueVoice("mission_progress");
    }
  },

  completeMission: () => {
    set((s) => ({ activeMission: { ...s.activeMission, status: "complete" } }));
    get().addLogEntry({
      type: "mission",
      message: `MISSION COMPLETE: ${get().activeMission.title}`,
    });
    interruptVoice("mission_complete");
  },
}));
