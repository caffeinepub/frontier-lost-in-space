import { create } from "zustand";

export type SubsystemStatus = "nominal" | "degrading" | "warning" | "critical";

export interface Subsystem {
  id: string;
  name: string;
  health: number; // 0-100
  status: SubsystemStatus;
  degradationRate: number; // % per minute
  lastAlert?: number;
  floor: number; // minimum health floor
}

function seedHealth(min = 70, max = 100): number {
  return Math.round(min + Math.random() * (max - min));
}

function getStatus(health: number): SubsystemStatus {
  if (health < 25) return "critical";
  if (health < 50) return "warning";
  if (health < 80) return "degrading";
  return "nominal";
}

const INITIAL_SUBSYSTEMS: Subsystem[] = [
  {
    id: "hull",
    name: "HULL INTEGRITY",
    health: seedHealth(82, 100),
    status: "nominal",
    degradationRate: 0.02,
    floor: 0,
  },
  {
    id: "armor",
    name: "ARMOR PLATING",
    health: seedHealth(78, 100),
    status: "nominal",
    degradationRate: 0.02,
    floor: 0,
  },
  {
    id: "shields",
    name: "SHIELD ARRAY",
    health: seedHealth(75, 100),
    status: "nominal",
    degradationRate: 0.03,
    floor: 10,
  },
  {
    id: "oxygen_recycler",
    name: "OXYGEN RECYCLER",
    health: 78,
    status: "degrading",
    degradationRate: 0.05,
    floor: 40,
  },
  {
    id: "reactor",
    name: "REACTOR CORE",
    health: seedHealth(85, 100),
    status: "nominal",
    degradationRate: 0.01,
    floor: 20,
  },
  {
    id: "nav_array",
    name: "NAV ARRAY",
    health: seedHealth(80, 100),
    status: "nominal",
    degradationRate: 0.04,
    floor: 30,
  },
  {
    id: "sensor_suite",
    name: "SENSOR SUITE",
    health: seedHealth(75, 100),
    status: "nominal",
    degradationRate: 0.04,
    floor: 20,
  },
  {
    id: "weapon_cooling",
    name: "WEAPON COOLING",
    health: 82,
    status: "degrading",
    degradationRate: 0.06,
    floor: 20,
  },
  {
    id: "missile_rack",
    name: "MISSILE RACK",
    health: seedHealth(80, 100),
    status: "nominal",
    degradationRate: 0.03,
    floor: 0,
  },
  {
    id: "life_support",
    name: "LIFE SUPPORT",
    health: seedHealth(80, 100),
    status: "nominal",
    degradationRate: 0.05,
    floor: 40,
  },
  {
    id: "cargo_seals",
    name: "CARGO SEALS",
    health: seedHealth(70, 100),
    status: "nominal",
    degradationRate: 0.03,
    floor: 0,
  },
  {
    id: "comms_relay",
    name: "COMMS RELAY",
    health: 85,
    status: "degrading",
    degradationRate: 0.04,
    floor: 10,
  },
];

interface ShipSystemsState {
  subsystems: Subsystem[];
  tick: (deltaMs: number) => void;
  repair: (id: string) => void;
  getSubsystem: (id: string) => Subsystem | undefined;
  getAverageHealth: () => number;
}

export const useShipSystemsStore = create<ShipSystemsState>((set, get) => ({
  subsystems: INITIAL_SUBSYSTEMS.map((s) => ({
    ...s,
    status: getStatus(s.health),
  })),

  tick: (deltaMs: number) => {
    set((state) => ({
      subsystems: state.subsystems.map((s) => {
        const degradeAmount = s.degradationRate * (deltaMs / 60000);
        const newHealth = Math.max(s.floor, s.health - degradeAmount);
        return { ...s, health: newHealth, status: getStatus(newHealth) };
      }),
    }));
  },

  repair: (id: string) => {
    set((state) => ({
      subsystems: state.subsystems.map((s) =>
        s.id === id
          ? { ...s, health: 100, status: "nominal" as SubsystemStatus }
          : s,
      ),
    }));
  },

  getSubsystem: (id: string) => get().subsystems.find((s) => s.id === id),

  getAverageHealth: () => {
    const { subsystems } = get();
    return Math.round(
      subsystems.reduce((sum, s) => sum + s.health, 0) / subsystems.length,
    );
  },
}));
