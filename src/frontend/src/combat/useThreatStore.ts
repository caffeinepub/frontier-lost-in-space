import { create } from "zustand";
import { useTutorialStore } from "../tutorial/useTutorialStore";

export type ThreatStatus =
  | "INCOMING"
  | "IMPACT_RISK"
  | "PRIORITY_TARGET"
  | "INTERCEPT_WINDOW"
  | "DESTROYED"
  | "SURVIVED";

export interface AsteroidThreat {
  id: string;
  startAzimuth: number;
  startElevation: number;
  startRadius: number;
  impactAzimuth: number;
  impactElevation: number;
  progress: number;
  speed: number;
  status: ThreatStatus;
  health: number;
  spawnTime: number;
}

interface ThreatStore {
  threats: AsteroidThreat[];
  spawnThreat: () => void;
  updateThreats: (dt: number) => void;
  interceptThreat: (
    threatId: string,
    weaponType: "pulse" | "railgun" | "emp",
  ) => void;
  removeDestroyedThreats: () => void;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const WEAPON_DAMAGE: Record<"pulse" | "railgun" | "emp", number> = {
  pulse: 0.35,
  railgun: 0.65,
  emp: 0.5,
};

export const useThreatStore = create<ThreatStore>((set, get) => ({
  threats: [],

  spawnThreat: () => {
    const { threats } = get();
    const active = threats.filter(
      (t) => t.status !== "DESTROYED" && t.status !== "SURVIVED",
    );
    if (active.length >= 3) return;

    // Beginner assist: slower during tutorial + early-game (first 8 threats)
    const tutActive = useTutorialStore.getState().tutorialActive;
    const totalSpawned = threats.length; // includes destroyed ones
    const isEarlyGame = totalSpawned < 8;
    const speed = tutActive
      ? rand(0.01, 0.018) // ~4-5x slower during tutorial
      : isEarlyGame
        ? rand(0.022, 0.038) // ~2x slower in early game
        : rand(0.04, 0.08); // normal speed after 8 threats

    const threat: AsteroidThreat = {
      id: `THREAT-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      startAzimuth: rand(0, Math.PI * 2),
      startElevation: rand(-0.6, 0.6),
      startRadius: 6.0,
      impactAzimuth: rand(0, Math.PI * 2),
      impactElevation: rand(-0.8, 0.8),
      progress: 0,
      speed,
      status: "INCOMING",
      health: 1.0,
      spawnTime: Date.now(),
    };

    set((state) => ({ threats: [...state.threats, threat] }));
  },

  updateThreats: (dt: number) => {
    set((state) => ({
      threats: state.threats.map((t) => {
        if (t.status === "DESTROYED" || t.status === "SURVIVED") return t;

        const newProgress = Math.min(1.0, t.progress + t.speed * dt);
        let newStatus: ThreatStatus = t.status;

        if (newProgress >= 1.0) {
          newStatus = "SURVIVED";
        } else if (newProgress > 0.85) {
          newStatus = "IMPACT_RISK";
        } else if (newProgress > 0.65) {
          newStatus = "INTERCEPT_WINDOW";
        } else if (newProgress > 0.4) {
          newStatus = "PRIORITY_TARGET";
        }

        return { ...t, progress: newProgress, status: newStatus };
      }),
    }));
  },

  interceptThreat: (threatId, weaponType) => {
    const damage = WEAPON_DAMAGE[weaponType];
    set((state) => ({
      threats: state.threats.map((t) => {
        if (t.id !== threatId) return t;
        const newHealth = Math.max(0, t.health - damage);
        return {
          ...t,
          health: newHealth,
          status: newHealth <= 0 ? "DESTROYED" : t.status,
        };
      }),
    }));
  },

  removeDestroyedThreats: () => {
    set((state) => ({
      threats: state.threats.filter(
        (t) => t.status !== "DESTROYED" || Date.now() - t.spawnTime < 3000,
      ),
    }));
  },
}));
