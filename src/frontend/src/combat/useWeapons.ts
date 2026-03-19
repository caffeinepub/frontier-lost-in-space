import { create } from "zustand";
import { useTacticalStore } from "../hooks/useTacticalStore";
import { triggerBattleJolt } from "../motion/shipMotionEngine";
import { useCombatState } from "./useCombatState";
import type { WeaponType } from "./useCombatState";
import { useThreatStore } from "./useThreatStore";

export type WeaponStatus = "READY" | "COOLDOWN" | "RELOADING";

export interface Weapon {
  id: string;
  name: string;
  shortLabel: string;
  cooldownTime: number;
  currentCooldown: number;
  status: WeaponStatus;
  type: WeaponType;
  color: string;
  glowColor: string;
  /** Rail gun ammo */
  ammo?: number;
  maxAmmo?: number;
  reloadTime?: number;
  reloadProgress?: number;
  /** Requires a locked target (all do, but explicit for missile UI hint) */
  requiresLock?: boolean;
}

/** Active 3-slot loadout */
const INITIAL_WEAPONS: Weapon[] = [
  {
    id: "pulse",
    name: "PULSE CANNON",
    shortLabel: "PULSE",
    cooldownTime: 1200,
    currentCooldown: 0,
    status: "READY",
    type: "pulse",
    color: "#00ffcc",
    glowColor: "rgba(0,255,200,0.4)",
  },
  {
    id: "rail",
    name: "RAIL GUN",
    shortLabel: "RAIL GUN",
    cooldownTime: 900,
    currentCooldown: 0,
    status: "READY",
    type: "railgun",
    color: "#44aaff",
    glowColor: "rgba(68,170,255,0.4)",
    ammo: 5,
    maxAmmo: 5,
    reloadTime: 3000,
    reloadProgress: 0,
  },
  {
    id: "missile",
    name: "HEAT MISSILE",
    shortLabel: "MISSILE",
    cooldownTime: 4500,
    currentCooldown: 0,
    status: "READY",
    type: "missile",
    color: "#ff6644",
    glowColor: "rgba(255,100,68,0.4)",
    requiresLock: true,
  },
];

/** Inventory weapons (not in active slots — available for loadout swapping) */
export const INVENTORY_WEAPONS: Weapon[] = [
  {
    id: "emp",
    name: "EMP BURST",
    shortLabel: "EMP",
    cooldownTime: 5000,
    currentCooldown: 0,
    status: "READY",
    type: "emp",
    color: "#ff8800",
    glowColor: "rgba(255,136,0,0.4)",
  },
];

interface WeaponsStore {
  weapons: Weapon[];
  selectedWeaponId: string;
  selectWeapon: (weaponId: string) => void;
  fire: (weaponId: string) => void;
  fireSelected: () => void;
  tick: (dtMs: number) => void;
}

export const useWeaponsStore = create<WeaponsStore>((set, get) => ({
  weapons: INITIAL_WEAPONS,
  selectedWeaponId: "pulse",

  selectWeapon: (weaponId: string) => {
    set({ selectedWeaponId: weaponId });
  },

  fireSelected: () => {
    const { selectedWeaponId, fire } = get();
    fire(selectedWeaponId);
  },

  fire: (weaponId: string) => {
    const { selectedNode } = useTacticalStore.getState();
    if (!selectedNode) return;

    const weapon = get().weapons.find((w) => w.id === weaponId);
    if (!weapon) return;
    if (weapon.status !== "READY") return;
    // Rail gun ammo check
    if (weapon.type === "railgun" && (weapon.ammo ?? 1) <= 0) return;

    const {
      setFiringEffect,
      setTargetHitFlash,
      setEmpStunnedNode,
      setScreenFlash,
      setCameraShake,
      setDestructionEvent,
    } = useCombatState.getState();

    const duration =
      weapon.type === "pulse"
        ? 350
        : weapon.type === "railgun"
          ? 550
          : weapon.type === "missile"
            ? 900
            : 1100;

    setFiringEffect({
      weaponId,
      type: weapon.type,
      targetId: selectedNode,
      startTime: performance.now(),
      duration,
    });

    setCameraShake({
      intensity:
        weapon.type === "railgun"
          ? 0.06
          : weapon.type === "missile"
            ? 0.05
            : weapon.type === "emp"
              ? 0.04
              : 0.025,
      weaponType: weapon.type,
      startTime: performance.now(),
      duration:
        weapon.type === "railgun"
          ? 400
          : weapon.type === "missile"
            ? 500
            : weapon.type === "emp"
              ? 350
              : 250,
    });

    triggerBattleJolt(weapon.type);

    setTargetHitFlash(true);
    setScreenFlash(true);

    setTimeout(() => setTargetHitFlash(false), duration);
    setTimeout(() => setScreenFlash(false), 120);
    setTimeout(() => setFiringEffect(null), duration + 100);

    if (weapon.type === "emp") {
      setEmpStunnedNode(selectedNode);
      setTimeout(() => setEmpStunnedNode(null), 3000);
    }

    // Log the fire event
    useTacticalStore.getState().pushEventLog({
      msg: `${weapon.name} FIRED → ${selectedNode}`,
      type: "fire",
    });

    // Push to tactical log store (lazy import avoids circular)
    import("../tacticalLog/useTacticalLogStore").then(
      ({ useTacticalLogStore }) => {
        useTacticalLogStore.getState().addEntry({
          type: "combat",
          message: `${weapon.name} FIRED → ${selectedNode}`,
        });
      },
    );

    if (selectedNode.startsWith("THREAT-")) {
      const { interceptThreat } = useThreatStore.getState();
      interceptThreat(selectedNode, weapon.type as "pulse" | "railgun" | "emp");

      const updatedThreat = useThreatStore
        .getState()
        .threats.find((t) => t.id === selectedNode);
      if (updatedThreat?.status === "DESTROYED") {
        setDestructionEvent({
          targetId: selectedNode,
          startTime: performance.now(),
          weaponType: weapon.type,
        });
        triggerBattleJolt(weapon.type, true);
        useTacticalStore.getState().pushEventLog({
          msg: `TARGET DESTROYED: ${selectedNode}`,
          type: "destroy",
        });
        import("../tacticalLog/useTacticalLogStore").then(
          ({ useTacticalLogStore }) => {
            useTacticalLogStore.getState().addEntry({
              type: "combat",
              message: `TARGET DESTROYED: ${selectedNode}`,
            });
          },
        );
      }
    }

    // Update weapon state after firing
    set((state) => ({
      weapons: state.weapons.map((w) => {
        if (w.id !== weaponId) return w;
        // Rail gun: decrement ammo, trigger reload if empty
        if (w.type === "railgun") {
          const newAmmo = (w.ammo ?? 1) - 1;
          if (newAmmo <= 0) {
            import("../tacticalLog/useTacticalLogStore").then(
              ({ useTacticalLogStore }) => {
                useTacticalLogStore.getState().addEntry({
                  type: "system",
                  message: "RAIL GUN AMMO DEPLETED — RELOADING",
                });
              },
            );
            return {
              ...w,
              ammo: 0,
              status: "RELOADING" as WeaponStatus,
              reloadProgress: 0,
            };
          }
          return {
            ...w,
            ammo: newAmmo,
            status: "COOLDOWN" as WeaponStatus,
            currentCooldown: 1,
          };
        }
        return { ...w, status: "COOLDOWN" as WeaponStatus, currentCooldown: 1 };
      }),
    }));
  },

  tick: (dtMs: number) => {
    set((state) => ({
      weapons: state.weapons.map((w) => {
        // Handle reloading (rail gun)
        if (w.status === "RELOADING" && w.reloadTime) {
          const nextProgress = (w.reloadProgress ?? 0) + dtMs / w.reloadTime;
          if (nextProgress >= 1) {
            import("../tacticalLog/useTacticalLogStore").then(
              ({ useTacticalLogStore }) => {
                useTacticalLogStore.getState().addEntry({
                  type: "system",
                  message: "RAIL GUN RELOAD COMPLETE",
                });
              },
            );
            return {
              ...w,
              status: "READY" as WeaponStatus,
              ammo: w.maxAmmo,
              reloadProgress: 0,
              currentCooldown: 0,
            };
          }
          return { ...w, reloadProgress: nextProgress };
        }
        // Handle cooldown
        if (w.status !== "COOLDOWN") return w;
        const next = w.currentCooldown - dtMs / w.cooldownTime;
        if (next <= 0)
          return { ...w, currentCooldown: 0, status: "READY" as WeaponStatus };
        return { ...w, currentCooldown: next };
      }),
    }));
  },
}));
