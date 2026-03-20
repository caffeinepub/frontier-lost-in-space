/**
 * useEnemyStore — enemy targets (satellites + planetary bases) + return fire.
 *
 * Satellites orbit the globe with smooth circular orbits.
 * Bases are anchored to the globe surface (static).
 * Both fire at the player at random 3–6 second intervals.
 */
import { create } from "zustand";

export type EnemyType = "satellite" | "base";
export type EnemyStatus = "active" | "destroyed";

export interface EnemyTarget {
  id: string;
  type: EnemyType;
  label: string;
  health: number; // 0–1
  status: EnemyStatus;
  destroyedAt?: number;
  // Orbit params (satellites)
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  orbitInclination: number;
  // World position (updated each frame for satellites, fixed for bases)
  px: number;
  py: number;
  pz: number;
  // Base surface coords
  lat?: number;
  lng?: number;
  // Return fire
  nextFireTime: number;
  hitFlash: boolean;
  hitFlashAt?: number;
}

export interface IncomingProjectile {
  id: string;
  sourceId: string;
  startPx: number;
  startPy: number;
  startPz: number;
  startTime: number;
  duration: number;
  hit: boolean;
}

/** Same formula as GlobeCore.latLngToVec3 (radius 1.0 default). */
function latLngToXYZ(
  lat: number,
  lng: number,
  r = 1.0,
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

/** Compute satellite world position from orbit params + elapsed time (seconds). */
function calcSatPos(
  orbitRadius: number,
  orbitSpeed: number,
  orbitPhase: number,
  orbitInclination: number,
  time: number,
): [number, number, number] {
  const angle = orbitPhase + time * orbitSpeed;
  const bx = orbitRadius * Math.cos(angle);
  const bz = orbitRadius * Math.sin(angle);
  // Apply inclination tilt (rotate around X axis)
  return [bx, bz * Math.sin(orbitInclination), bz * Math.cos(orbitInclination)];
}

const BASE_SURFACE_RADIUS = 1.55;

const BASES_DATA: Array<[string, string, number, number]> = [
  ["BASE-001", "OMEGA-BASE", 28.5, 45.2],
  ["BASE-002", "DELTA-STATION", -35.0, -120.0],
  ["BASE-003", "VEGA-OUTPOST", 52.0, -3.0],
];

const INITIAL_ENEMIES: EnemyTarget[] = [
  // Satellites
  {
    id: "SAT-001",
    type: "satellite",
    label: "SENTINEL-1",
    health: 1,
    status: "active",
    orbitRadius: 2.3,
    orbitSpeed: 0.22,
    orbitPhase: 0,
    orbitInclination: 0.3,
    px: 2.3,
    py: 0,
    pz: 0,
    nextFireTime: Date.now() + 4000 + Math.random() * 2000,
    hitFlash: false,
  },
  {
    id: "SAT-002",
    type: "satellite",
    label: "SENTINEL-2",
    health: 1,
    status: "active",
    orbitRadius: 2.5,
    orbitSpeed: 0.17,
    orbitPhase: Math.PI * 0.6,
    orbitInclination: -0.5,
    px: 2.5,
    py: 0,
    pz: 0,
    nextFireTime: Date.now() + 5500 + Math.random() * 2000,
    hitFlash: false,
  },
  {
    id: "SAT-003",
    type: "satellite",
    label: "REAPER-X",
    health: 1,
    status: "active",
    orbitRadius: 2.1,
    orbitSpeed: 0.28,
    orbitPhase: Math.PI * 1.3,
    orbitInclination: 0.6,
    px: 2.1,
    py: 0,
    pz: 0,
    nextFireTime: Date.now() + 3000 + Math.random() * 2000,
    hitFlash: false,
  },
  // Bases — positioned on surface
  ...BASES_DATA.map(([id, label, lat, lng]) => {
    const [px, py, pz] = latLngToXYZ(lat, lng, BASE_SURFACE_RADIUS);
    return {
      id,
      type: "base" as EnemyType,
      label,
      health: 1,
      status: "active" as EnemyStatus,
      orbitRadius: 0,
      orbitSpeed: 0,
      orbitPhase: 0,
      orbitInclination: 0,
      px,
      py,
      pz,
      lat,
      lng,
      nextFireTime: Date.now() + 6000 + Math.random() * 3000,
      hitFlash: false,
    };
  }),
];

// How much damage each weapon type deals to enemies
const ENEMY_WEAPON_DAMAGE: Record<string, number> = {
  pulse: 0.3,
  railgun: 0.6,
  emp: 0.4,
  missile: 0.8,
};

interface EnemyStore {
  enemies: EnemyTarget[];
  incoming: IncomingProjectile[];
  updatePositions: (time: number) => void;
  checkReturnFire: () => void;
  damageEnemy: (id: string, weaponType: string) => void;
  markProjectileHit: (projId: string) => void;
  removeExpired: () => void;
}

export const useEnemyStore = create<EnemyStore>((set, get) => ({
  enemies: INITIAL_ENEMIES,
  incoming: [],

  updatePositions: (time: number) => {
    set((state) => ({
      enemies: state.enemies.map((e) => {
        if (e.type !== "satellite" || e.status === "destroyed") return e;
        const [px, py, pz] = calcSatPos(
          e.orbitRadius,
          e.orbitSpeed,
          e.orbitPhase,
          e.orbitInclination,
          time,
        );
        return { ...e, px, py, pz };
      }),
    }));
  },

  checkReturnFire: () => {
    const now = Date.now();
    const { enemies, incoming } = get();
    // Cap total incoming projectiles to prevent crowding
    if (incoming.filter((p) => !p.hit).length >= 4) return;

    const newProjectiles: IncomingProjectile[] = [];
    const updatedEnemies = enemies.map((e) => {
      if (e.status !== "active") return e;
      if (now >= e.nextFireTime) {
        newProjectiles.push({
          id: `INC-${now}-${e.id}-${Math.floor(Math.random() * 9999)}`,
          sourceId: e.id,
          startPx: e.px,
          startPy: e.py,
          startPz: e.pz,
          startTime: now,
          duration: 2000 + Math.random() * 1000,
          hit: false,
        });
        return { ...e, nextFireTime: now + 3000 + Math.random() * 3000 };
      }
      return e;
    });

    if (newProjectiles.length > 0) {
      set({
        enemies: updatedEnemies,
        incoming: [...incoming, ...newProjectiles],
      });
    }
  },

  damageEnemy: (id: string, weaponType: string) => {
    const damage = ENEMY_WEAPON_DAMAGE[weaponType] ?? 0.3;
    set((state) => ({
      enemies: state.enemies.map((e) => {
        if (e.id !== id) return e;
        const newHealth = Math.max(0, e.health - damage);
        return {
          ...e,
          health: newHealth,
          status: newHealth <= 0 ? "destroyed" : e.status,
          destroyedAt: newHealth <= 0 ? Date.now() : e.destroyedAt,
          hitFlash: true,
          hitFlashAt: Date.now(),
        };
      }),
    }));
    // Clear hit flash after 300 ms
    setTimeout(() => {
      set((state) => ({
        enemies: state.enemies.map((e) =>
          e.id === id ? { ...e, hitFlash: false } : e,
        ),
      }));
    }, 300);
  },

  markProjectileHit: (projId: string) => {
    set((state) => ({
      incoming: state.incoming.map((p) =>
        p.id === projId ? { ...p, hit: true } : p,
      ),
    }));
  },

  removeExpired: () => {
    const now = Date.now();
    set((state) => ({
      // Remove old projectiles (hit or timed out)
      incoming: state.incoming.filter(
        (p) => now - p.startTime < p.duration + 800,
      ),
      // Respawn destroyed enemies after 12 seconds
      enemies: state.enemies.map((e) => {
        if (
          e.status === "destroyed" &&
          e.destroyedAt &&
          now - e.destroyedAt > 12000
        ) {
          return {
            ...e,
            status: "active",
            health: 1,
            destroyedAt: undefined,
            nextFireTime: now + 3000 + Math.random() * 3000,
            hitFlash: false,
          };
        }
        return e;
      }),
    }));
  },
}));
