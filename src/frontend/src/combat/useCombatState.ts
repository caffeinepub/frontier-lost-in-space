import { create } from "zustand";

export type WeaponType = "pulse" | "railgun" | "emp" | "missile";

export interface FiringEffect {
  weaponId: string;
  type: WeaponType;
  targetId: string;
  startTime: number;
  duration: number;
}

export interface CameraShake {
  intensity: number;
  weaponType: WeaponType;
  startTime: number;
  duration: number;
}

export interface DestructionEvent {
  targetId: string;
  startTime: number;
  weaponType: WeaponType;
}

interface CombatStateStore {
  firingEffect: FiringEffect | null;
  targetHitFlash: boolean;
  empStunnedNode: string | null;
  screenFlash: boolean;
  cameraShake: CameraShake | null;
  destructionEvent: DestructionEvent | null;
  shieldHit: boolean;
  pulseHitFlash: boolean;
  railHitFlash: boolean;
  setFiringEffect: (e: FiringEffect | null) => void;
  setTargetHitFlash: (v: boolean) => void;
  setEmpStunnedNode: (id: string | null) => void;
  setScreenFlash: (v: boolean) => void;
  setCameraShake: (s: CameraShake | null) => void;
  setDestructionEvent: (e: DestructionEvent | null) => void;
  setShieldHit: (v: boolean) => void;
  setPulseHitFlash: (v: boolean) => void;
  setRailHitFlash: (v: boolean) => void;
}

export const useCombatState = create<CombatStateStore>((set) => ({
  firingEffect: null,
  targetHitFlash: false,
  empStunnedNode: null,
  screenFlash: false,
  cameraShake: null,
  destructionEvent: null,
  shieldHit: false,
  pulseHitFlash: false,
  railHitFlash: false,
  setFiringEffect: (e) => set({ firingEffect: e }),
  setTargetHitFlash: (v) => set({ targetHitFlash: v }),
  setEmpStunnedNode: (id) => set({ empStunnedNode: id }),
  setScreenFlash: (v) => set({ screenFlash: v }),
  setCameraShake: (s) => set({ cameraShake: s }),
  setDestructionEvent: (e) => set({ destructionEvent: e }),
  setShieldHit: (v) => set({ shieldHit: v }),
  setPulseHitFlash: (v) => set({ pulseHitFlash: v }),
  setRailHitFlash: (v) => set({ railHitFlash: v }),
}));
