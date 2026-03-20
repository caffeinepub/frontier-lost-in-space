/**
 * useWeaponAnimState — shared weapon animation state machine.
 *
 * Manages per-weapon visual state (IDLE → HOVER → LOCK → FIRE → COOLDOWN → DISABLED)
 * and exposes named animation hooks consumed by WeaponConsole.
 *
 * Performance: only stores hover + disabled flags.
 * All other states are DERIVED from existing stores (weapons, tactical, combat)
 * to avoid state duplication and keep updates deterministic.
 */
import { create } from "zustand";

export type WeaponAnimState =
  | "idle"
  | "hover"
  | "lock"
  | "fire"
  | "cooldown"
  | "disabled";

export type WeaponStatus = "READY" | "COOLDOWN" | "RELOADING";

// ─── Per-weapon animation config tokens ──────────────────────────────────────

export interface WeaponAnimTokens {
  /** Overall panel opacity */
  opacity: number;
  /** CSS filter brightness multiplier */
  brightness: number;
  /** Primary glow color stop opacity */
  glowAlpha: number;
  /** Edge highlight width (px virtual) */
  edgeHighlight: boolean;
  /** Label text opacity */
  labelOpacity: number;
  /** Readiness bar visible */
  readyBarVisible: boolean;
  /** Lock signal line visible */
  showLockLine: boolean;
  /** Discharge flash visible */
  dischargeFlash: boolean;
  /** Heat emphasis (rail gun cooldown) */
  heatEmphasis: boolean;
}

export const ANIM_TOKENS: Record<WeaponAnimState, WeaponAnimTokens> = {
  idle: {
    opacity: 1,
    brightness: 0.85,
    glowAlpha: 0.28,
    edgeHighlight: false,
    labelOpacity: 0.65,
    readyBarVisible: false,
    showLockLine: false,
    dischargeFlash: false,
    heatEmphasis: false,
  },
  hover: {
    opacity: 1,
    brightness: 1.05,
    glowAlpha: 0.55,
    edgeHighlight: true,
    labelOpacity: 1,
    readyBarVisible: true,
    showLockLine: false,
    dischargeFlash: false,
    heatEmphasis: false,
  },
  lock: {
    opacity: 1,
    brightness: 1.1,
    glowAlpha: 0.72,
    edgeHighlight: true,
    labelOpacity: 1,
    readyBarVisible: true,
    showLockLine: true,
    dischargeFlash: false,
    heatEmphasis: false,
  },
  fire: {
    opacity: 1,
    brightness: 1.25,
    glowAlpha: 1.0,
    edgeHighlight: true,
    labelOpacity: 1,
    readyBarVisible: true,
    showLockLine: false,
    dischargeFlash: true,
    heatEmphasis: false,
  },
  cooldown: {
    opacity: 0.82,
    brightness: 0.8,
    glowAlpha: 0.18,
    edgeHighlight: false,
    labelOpacity: 0.72,
    readyBarVisible: false,
    showLockLine: false,
    dischargeFlash: false,
    heatEmphasis: true,
  },
  disabled: {
    opacity: 0.32,
    brightness: 0.5,
    glowAlpha: 0,
    edgeHighlight: false,
    labelOpacity: 0.38,
    readyBarVisible: false,
    showLockLine: false,
    dischargeFlash: false,
    heatEmphasis: false,
  },
};

// ─── Zustand store (only hover + disabled — all else derived) ─────────────────

interface WeaponAnimStore {
  hoveredWeaponId: string | null;
  disabledWeaponIds: Set<string>;

  // Named animation hooks
  onHoverWeapon: (id: string | null) => void;
  onSelectWeapon: (id: string) => void;
  onTargetLock: () => void;
  onFire: () => void;
  onCooldownStart: () => void;
  onCooldownComplete: () => void;
  onDisableWeapon: (id: string) => void;
  onEnableWeapon: (id: string) => void;
}

export const useWeaponAnimStore = create<WeaponAnimStore>((set) => ({
  hoveredWeaponId: null,
  disabledWeaponIds: new Set<string>(),

  onHoverWeapon: (id) => set({ hoveredWeaponId: id }),
  onSelectWeapon: (_id) => {}, // visual selection handled by useWeaponsStore
  onTargetLock: () => {}, // visual lock handled via derived state
  onFire: () => {}, // visual fire handled via firingEffect
  onCooldownStart: () => {}, // visual cooldown handled via weapon.status
  onCooldownComplete: () => {}, // visual complete handled via weapon.status → READY
  onDisableWeapon: (id) =>
    set((s) => ({ disabledWeaponIds: new Set([...s.disabledWeaponIds, id]) })),
  onEnableWeapon: (id) =>
    set((s) => {
      const next = new Set(s.disabledWeaponIds);
      next.delete(id);
      return { disabledWeaponIds: next };
    }),
}));

// ─── Pure derivation function (no hooks, call anywhere) ──────────────────────

export function deriveWeaponAnimState(opts: {
  weaponId: string;
  weaponStatus: WeaponStatus;
  isSelected: boolean;
  hasTarget: boolean;
  isFiring: boolean;
  isHovered: boolean;
  isDisabled: boolean;
}): WeaponAnimState {
  const {
    weaponStatus,
    isSelected,
    hasTarget,
    isFiring,
    isHovered,
    isDisabled,
  } = opts;
  if (isDisabled) return "disabled";
  if (isFiring) return "fire";
  if (weaponStatus === "COOLDOWN" || weaponStatus === "RELOADING")
    return "cooldown";
  if (isSelected && hasTarget) return "lock";
  if (isHovered || isSelected) return "hover";
  return "idle";
}
