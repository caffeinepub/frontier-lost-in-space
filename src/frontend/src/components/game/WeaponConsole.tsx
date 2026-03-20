/**
 * WeaponConsole — CSS-only weapon system panel (no image assets).
 *
 * GLOBAL RULES (preserved):
 * - Exact same panel positions, scale, perspective across ALL states
 * - Only lighting, indicators, bars, and button behavior change
 * - One globe only (this component renders zero 3D)
 * - Mobile-first: prefer opacity/filter/transform only
 *
 * Animation states (per weapon): IDLE → HOVER → LOCK → FIRE → COOLDOWN → DISABLED
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useCombatState } from "../../combat/useCombatState";
import { usePlayerStore } from "../../combat/usePlayerStore";
import {
  ANIM_TOKENS,
  deriveWeaponAnimState,
  useWeaponAnimStore,
} from "../../combat/useWeaponAnimState";
import type { WeaponAnimState } from "../../combat/useWeaponAnimState";
import { useWeaponsStore } from "../../combat/useWeapons";
import type { Weapon } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

// ─── Utility helpers ─────────────────────────────────────────────────────────────
function cooldownFraction(w: Weapon): number {
  if (w.status === "RELOADING") return w.reloadProgress ?? 0;
  if (w.status === "COOLDOWN") return 1 - (w.currentCooldown ?? 0);
  return 1;
}
function weaponReady(w: Weapon): boolean {
  return w.status === "READY" && (w.ammo === undefined || w.ammo > 0);
}

// ─── All CSS keyframes ───────────────────────────────────────────────────────────
const KEYFRAMES = `
  /* IDLE — slow cyan panel shimmer */
  @keyframes wc-idle-glow {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }
  /* IDLE — fire button slow red breathe (2.5s–4s) */
  @keyframes wc-fire-breathe {
    0%, 100% {
      box-shadow:
        0 0 18px rgba(220,30,0,0.45),
        0 0 40px rgba(200,20,0,0.2),
        inset 0 0 14px rgba(160,50,30,0.12);
    }
    50% {
      box-shadow:
        0 0 46px rgba(255,55,0,0.8),
        0 0 80px rgba(255,30,0,0.38),
        inset 0 0 22px rgba(255,90,60,0.22);
    }
  }
  /* LOCK — fire button focused armed glow */
  @keyframes wc-fire-lock {
    0%, 100% {
      box-shadow:
        0 0 32px rgba(255,60,0,0.75),
        0 0 60px rgba(255,40,0,0.4),
        inset 0 0 18px rgba(255,110,80,0.2);
    }
    50% {
      box-shadow:
        0 0 50px rgba(255,80,10,0.95),
        0 0 90px rgba(255,60,0,0.55),
        inset 0 0 28px rgba(255,130,100,0.3);
    }
  }
  /* FIRE — button press bloom */
  @keyframes wc-fire-burst {
    0%   { opacity: 1; transform: scale(0.75); }
    100% { opacity: 0; transform: scale(2.2); }
  }
  /* COOLDOWN — fire button deep ember recovery */
  @keyframes wc-fire-cooldown {
    0%, 100% {
      box-shadow:
        0 0 12px rgba(140,30,0,0.4),
        0 0 24px rgba(100,20,0,0.15),
        inset 0 0 10px rgba(120,40,20,0.1);
    }
    50% {
      box-shadow:
        0 0 20px rgba(180,40,0,0.5),
        0 0 36px rgba(140,25,0,0.2),
        inset 0 0 14px rgba(160,50,30,0.15);
    }
  }
  /* LOCK — panel lock LED pulse */
  @keyframes wc-lock-led {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.3); }
  }
  /* LOCK — signal line sweep */
  @keyframes wc-lock-signal {
    0%   { opacity: 0.4; }
    50%  { opacity: 1;   }
    100% { opacity: 0.4; }
  }
  /* FIRE — panel discharge */
  @keyframes wc-discharge {
    0%   { opacity: 0.9; }
    100% { opacity: 0;   }
  }
  /* FIRE — recoil flash */
  @keyframes wc-recoil-flash {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
  /* COOLDOWN — amber LED blink */
  @keyframes wc-amber-led {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1;   }
  }
  /* HOVER — readiness bar slide in */
  @keyframes wc-ready-bar-in {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  /* Misc strip glow */
  @keyframes wc-strip-glow {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }
  /* Console top-edge glow */
  @keyframes console-edge-glow {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }
  /* Fire target lock pulse */
  @keyframes fire-lock-pulse {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }
  /* Fire dot blink */
  @keyframes fire-dot-blink {
    from { opacity: 0.4; }
    to   { opacity: 1;   }
  }
  /* Missile armed indicator */
  @keyframes missile-armed {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }
`;

// ─── Screw detail ──────────────────────────────────────────────────────────────────
function Screw() {
  return (
    <div
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 35%, #8a7860 0%, #4a3820 50%, #1a1008 100%)",
        border: "1px solid #2a1e10",
        boxShadow:
          "inset 0 1px 1px rgba(255,200,100,0.12), 0 1px 2px rgba(0,0,0,0.8)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Phillips head */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </div>
  );
}

// ─── Bronze engraved label plate ──────────────────────────────────────────────
function LabelPlate({
  label,
  animState,
}: { label: string; animState?: WeaponAnimState }) {
  const state = animState ?? "idle";
  const labelAlpha = ANIM_TOKENS[state].labelOpacity;
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #3d2e1a 0%, #6b4e2a 30%, #8a6535 50%, #6b4e2a 70%, #3d2e1a 100%)",
        border: "1px solid #9a7840",
        borderRadius: 2,
        padding: "3px 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4,
        boxShadow:
          "0 1px 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,200,100,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)",
        opacity: labelAlpha,
        transition: "opacity 0.15s ease",
      }}
    >
      <Screw />
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          letterSpacing: "0.18em",
          fontWeight: 700,
          color: "#d4a855",
          textShadow:
            state === "idle" ? "none" : "0 0 6px rgba(212,168,85,0.5)",
          whiteSpace: "nowrap",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <Screw />
    </div>
  );
}

// ─── LED indicator ─────────────────────────────────────────────────────────────────────
function LED({
  color,
  on,
  blink,
  delay = 0,
  animState,
}: {
  color: string;
  on: boolean;
  blink?: boolean;
  delay?: number;
  animState?: WeaponAnimState;
}) {
  const state = animState ?? "idle";
  const effectiveColor =
    state === "cooldown" && on
      ? "#ffaa00"
      : state === "disabled"
        ? "rgba(40,30,30,0.5)"
        : color;
  const effectiveOn = state === "disabled" ? false : on;
  const animKey = Math.round(delay * 10);
  const isAmber = state === "cooldown" && on;

  return (
    <div
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: effectiveOn ? effectiveColor : "rgba(20,30,40,0.8)",
        boxShadow: effectiveOn
          ? `0 0 5px ${effectiveColor}, 0 0 10px ${effectiveColor}66`
          : "inset 0 1px 2px rgba(0,0,0,0.6)",
        border: `1px solid ${effectiveOn ? `${effectiveColor}88` : "rgba(40,60,80,0.6)"}`,
        animation: isAmber
          ? `wc-amber-led 1.6s ${delay}s ease-in-out infinite`
          : blink && effectiveOn
            ? `led-blink-${animKey} 1.4s ${delay}s ease-in-out infinite`
            : undefined,
        flexShrink: 0,
        transition: "background 0.2s ease, box-shadow 0.2s ease",
      }}
    />
  );
}

// ─── Cooldown / progress strip ───────────────────────────────────────────────────
function CooldownStrip({
  fraction,
  color,
  reloading,
  animState,
  weaponType,
}: {
  fraction: number;
  color: string;
  reloading?: boolean;
  animState?: WeaponAnimState;
  weaponType?: string;
}) {
  const state = animState ?? "idle";
  const isRailCooldown = state === "cooldown" && weaponType === "railgun";
  const transitionTime =
    weaponType === "pulse"
      ? "1.8s"
      : weaponType === "railgun"
        ? "0.25s"
        : weaponType === "missile"
          ? "0.6s"
          : "0.12s";

  return (
    <div
      style={{
        width: "100%",
        height: 3,
        background: "rgba(0,10,20,0.8)",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(0,80,120,0.3)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.round(fraction * 100)}%`,
          background: isRailCooldown
            ? "linear-gradient(90deg, #ff6600, #ffcc00, #ff4400)"
            : reloading
              ? "linear-gradient(90deg, #ffcc44, #ff8800)"
              : `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: isRailCooldown ? "0 0 6px #ff6600" : `0 0 4px ${color}`,
          transition: `width ${transitionTime} ${weaponType === "missile" ? "steps(6)" : "linear"}`,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// ─── Heat vents (geometry preserved) ───────────────────────────────────────────────
const VENT_OPACITIES = [0.3, 0.4, 0.5, 0.6];
function HeatVents() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {VENT_OPACITIES.map((op) => (
        <div
          key={String(op)}
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(80,90,100,${op}), transparent)`,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

// ─── Lock signal path (LOCK state only) ─────────────────────────────────────────
function LockSignalLine({
  side,
  visible,
}: { side: "left" | "right"; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "35%",
        ...(side === "left"
          ? { left: "33%", right: "36%" }
          : { left: "36%", right: "33%" }),
        height: 1,
        background:
          "linear-gradient(90deg, rgba(0,220,200,0.8), rgba(0,240,220,1), rgba(0,220,200,0.8))",
        boxShadow: "0 0 4px rgba(0,220,200,0.8), 0 0 8px rgba(0,200,180,0.4)",
        animation: "wc-lock-signal 0.9s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 7,
        borderRadius: 1,
      }}
    />
  );
}

// ─── Pulse Cannon — vertical energy bar ─────────────────────────────────────────
function PulseEnergyBar({
  fraction,
  animState,
}: { fraction: number; animState: WeaponAnimState }) {
  const fillColor =
    animState === "cooldown"
      ? "#ffaa00"
      : animState === "disabled"
        ? "rgba(0,80,60,0.3)"
        : "#00ffcc";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 5,
          letterSpacing: "0.1em",
          color: "rgba(0,200,160,0.5)",
          textTransform: "uppercase",
        }}
      >
        PWR
      </span>
      <div
        style={{
          width: 6,
          height: 48,
          background: "rgba(0,10,20,0.9)",
          border: "1px solid rgba(0,100,80,0.4)",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          boxShadow: "inset 0 0 4px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: `${Math.round(fraction * 100)}%`,
            background: `linear-gradient(0deg, ${fillColor}88, ${fillColor})`,
            boxShadow: `0 0 6px ${fillColor}`,
            transition: "height 1.8s linear",
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
}

// ─── Rail Gun — segmented charge bar ────────────────────────────────────────────
function RailChargeBar({
  fraction,
  animState,
}: { fraction: number; animState: WeaponAnimState }) {
  const segments = 6;
  const filledCount = Math.round(fraction * segments);
  const isHeat = animState === "cooldown";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Charge */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 5,
            letterSpacing: "0.1em",
            color: "rgba(68,170,255,0.5)",
            textTransform: "uppercase",
          }}
        >
          CHG
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: segments }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: positional segments
              key={i}
              style={{
                width: 7,
                height: 10,
                borderRadius: 1,
                background:
                  i < filledCount
                    ? isHeat
                      ? "linear-gradient(180deg, #ff8800, #ff4400)"
                      : "linear-gradient(180deg, #80ccff, #44aaff)"
                    : "rgba(0,20,40,0.6)",
                boxShadow:
                  i < filledCount
                    ? isHeat
                      ? "0 0 4px #ff6600"
                      : "0 0 4px #44aaff"
                    : "none",
                border: `1px solid ${i < filledCount ? (isHeat ? "rgba(255,100,0,0.5)" : "rgba(68,170,255,0.4)") : "rgba(0,40,80,0.3)"}`,
                transition: "all 0.25s",
              }}
            />
          ))}
        </div>
      </div>
      {/* Heat */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 5,
            letterSpacing: "0.1em",
            color: "rgba(255,120,0,0.5)",
            textTransform: "uppercase",
          }}
        >
          HT
        </span>
        <div
          style={{
            width: "100%",
            height: 4,
            background: "rgba(0,10,20,0.8)",
            border: "1px solid rgba(80,40,0,0.3)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: isHeat ? `${Math.round((1 - fraction) * 100)}%` : "8%",
              background: "linear-gradient(90deg, #ff8800, #ff2200)",
              boxShadow: "0 0 4px #ff6600",
              transition: "width 0.25s linear",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Weapon panel (Pulse Cannon / Rail Gun) ───────────────────────────────────────
function WeaponPanel({
  weapon,
  isSelected,
  hasTarget,
  side,
  onSelect,
  onFire,
}: {
  weapon: Weapon;
  isSelected: boolean;
  hasTarget: boolean;
  side: "left" | "right";
  onSelect: () => void;
  onFire: () => void;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const isFiring = firingEffect?.weaponId === weapon.id;
  const hoveredId = useWeaponAnimStore((s) => s.hoveredWeaponId);
  const disabledIds = useWeaponAnimStore((s) => s.disabledWeaponIds);
  const onHover = useWeaponAnimStore((s) => s.onHoverWeapon);

  const isHovered = hoveredId === weapon.id;
  const isDisabled = disabledIds.has(weapon.id);

  const animState = deriveWeaponAnimState({
    weaponId: weapon.id,
    weaponStatus: weapon.status,
    isSelected,
    hasTarget,
    isFiring,
    isHovered,
    isDisabled,
  });

  const tokens = ANIM_TOKENS[animState];
  const ready = weaponReady(weapon);
  const fraction = cooldownFraction(weapon);
  const accentColor = weapon.type === "pulse" ? "#00ffcc" : "#44aaff";
  const textColor = weapon.type === "pulse" ? "#80ffe8" : "#80ccff";
  const borderColor =
    weapon.type === "pulse" ? "rgba(0,180,160,0.2)" : "rgba(68,170,255,0.2)";
  const borderActiveColor =
    weapon.type === "pulse" ? "rgba(0,200,180,0.5)" : "rgba(68,170,255,0.5)";

  const isOtherSelected = !isSelected && hasTarget;
  const dimFactor = isOtherSelected ? 0.72 : 1;

  const handleClick = () => {
    if (isDisabled) return;
    if (!isSelected) onSelect();
    else if (ready && hasTarget) onFire();
    else onSelect();
  };

  const statusLabel =
    animState === "fire"
      ? "FIRING"
      : animState === "lock"
        ? "ARMED"
        : animState === "hover"
          ? "SELECT"
          : animState === "cooldown"
            ? weapon.status
            : animState === "disabled"
              ? "OFFLINE"
              : ready
                ? "STANDBY"
                : weapon.status;

  const statusColor =
    animState === "fire" || animState === "lock"
      ? accentColor
      : animState === "cooldown"
        ? "#ffaa00"
        : animState === "disabled"
          ? "rgba(80,50,50,0.5)"
          : "rgba(80,120,150,0.7)";

  const panelGlow = tokens.edgeHighlight
    ? `0 0 0 1px ${borderActiveColor}, 0 0 8px ${accentColor}33`
    : `0 0 0 1px ${borderColor}`;

  return (
    <button
      type="button"
      style={{
        flex: "0 0 28%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 8px 6px",
        background: "linear-gradient(180deg, #0c1218 0%, #060a0d 100%)",
        border: `1px solid ${tokens.edgeHighlight ? borderActiveColor : borderColor}`,
        borderRadius: 4,
        boxShadow: panelGlow,
        opacity: tokens.opacity * dimFactor,
        filter: `brightness(${tokens.brightness})`,
        transition:
          "opacity 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        cursor: isDisabled ? "not-allowed" : "pointer",
        position: "relative",
        overflow: "hidden",
        // Scan-line texture
        backgroundImage:
          "linear-gradient(180deg, #0c1218 0%, #060a0d 100%), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,180,0.015) 3px, rgba(0,200,180,0.015) 4px)",
        animation:
          animState === "idle"
            ? "wc-idle-glow 3.2s ease-in-out infinite"
            : undefined,
      }}
      data-ocid={
        side === "left" ? "console.pulse_button" : "console.rail_button"
      }
      aria-label={`${weapon.name} — ${animState}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      onMouseEnter={() => onHover(weapon.id)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(weapon.id)}
      onTouchEnd={() => onHover(null)}
    >
      {/* Discharge flash overlay (fire state) */}
      {animState === "fire" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${accentColor}33 0%, transparent 70%)`,
            borderRadius: 4,
            animation: "wc-discharge 0.2s ease-out forwards",
            pointerEvents: "none",
            zIndex: 11,
          }}
        />
      )}

      {/* Panel header */}
      <LabelPlate label={weapon.name} animState={animState} />

      {/* Main content: meter + LEDs */}
      <div
        style={{ display: "flex", gap: 6, alignItems: "flex-start", flex: 1 }}
      >
        {/* Energy / charge meter */}
        <div style={{ flexShrink: 0 }}>
          {weapon.type === "pulse" ? (
            <PulseEnergyBar fraction={fraction} animState={animState} />
          ) : (
            <RailChargeBar fraction={fraction} animState={animState} />
          )}
        </div>

        {/* Right side: LEDs + status */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
        >
          {/* Lock indicator LED */}
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background:
                  animState === "lock" ? accentColor : "rgba(20,40,60,0.8)",
                boxShadow:
                  animState === "lock" ? `0 0 6px ${accentColor}` : "none",
                animation:
                  animState === "lock"
                    ? "wc-lock-led 0.8s ease-in-out infinite"
                    : undefined,
                transition: "all 0.18s ease",
              }}
            />
            <LED
              color="#00ff88"
              on={ready}
              blink={ready && isSelected}
              delay={0}
              animState={animState}
            />
            <LED
              color="#ffcc00"
              on={weapon.status === "COOLDOWN"}
              blink={weapon.status === "COOLDOWN"}
              delay={0.3}
              animState={animState}
            />
            <LED
              color="#ff4444"
              on={
                weapon.status === "RELOADING" ||
                (!ready && weapon.status !== "COOLDOWN")
              }
              blink={false}
              delay={0}
              animState={animState}
            />
          </div>

          {/* Ammo cells (if applicable) */}
          {weapon.ammo !== undefined && weapon.maxAmmo !== undefined && (
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {Array.from({ length: weapon.maxAmmo }, (_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional ammo cells
                  key={i}
                  style={{
                    width: 4,
                    height: 7,
                    borderRadius: 1,
                    background:
                      i < (weapon.ammo ?? 0)
                        ? accentColor
                        : "rgba(0,40,60,0.5)",
                    boxShadow:
                      i < (weapon.ammo ?? 0)
                        ? `0 0 3px ${accentColor}`
                        : "none",
                    border: `1px solid ${i < (weapon.ammo ?? 0) ? `${accentColor}88` : "rgba(0,80,100,0.3)"}`,
                    transition: "all 0.15s",
                    opacity: animState === "disabled" ? 0.3 : 1,
                  }}
                />
              ))}
            </div>
          )}

          {/* Power % text */}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 6,
              letterSpacing: "0.1em",
              color: textColor,
              textShadow: `0 0 4px ${accentColor}44`,
              opacity: tokens.labelOpacity,
              transition: "opacity 0.15s ease",
            }}
          >
            {ready
              ? "100%"
              : weapon.status === "COOLDOWN"
                ? `${Math.round(fraction * 100)}%`
                : "RELOAD"}
          </span>

          <div style={{ flex: 1 }} />

          {/* Heat vents */}
          <HeatVents />
        </div>
      </div>

      {/* Cooldown strip */}
      <CooldownStrip
        fraction={fraction}
        color={accentColor}
        reloading={weapon.status === "RELOADING"}
        animState={animState}
        weaponType={weapon.type}
      />

      {/* Readiness bar (hover / lock) */}
      {tokens.readyBarVisible && (
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 4px ${accentColor}66`,
            animation: "wc-ready-bar-in 0.16s ease-out forwards",
            borderRadius: 1,
          }}
        />
      )}

      {/* Status label */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 6,
          letterSpacing: "0.14em",
          textAlign: "center",
          color: statusColor,
          textShadow:
            animState === "fire" || animState === "lock"
              ? `0 0 6px ${accentColor}`
              : "none",
          fontWeight: 700,
          transition: "color 0.15s ease",
        }}
      >
        {statusLabel}
      </div>
    </button>
  );
}

// ─── Center FIRE button ──────────────────────────────────────────────────────────────────
function FireButton({
  hasTarget,
  onFire,
  selectedWeaponStatus,
}: {
  hasTarget: boolean;
  onFire: () => void;
  selectedWeaponStatus: string;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const [pressed, setPressed] = useState(false);
  const [flash, setFlash] = useState(false);
  const isFiring = !!firingEffect;
  const isCooldown =
    selectedWeaponStatus === "COOLDOWN" || selectedWeaponStatus === "RELOADING";

  const fireAnimState: WeaponAnimState = (
    isFiring ? "fire" : isCooldown ? "cooldown" : hasTarget ? "lock" : "idle"
  ) as WeaponAnimState;

  const handleFire = useCallback(() => {
    if (!hasTarget || isCooldown) return;
    setPressed(true);
    setFlash(true);
    onFire();
    useTutorialStore.getState().setFireDetected();
    setTimeout(() => setPressed(false), 220);
    setTimeout(() => setFlash(false), 280);
  }, [hasTarget, isCooldown, onFire]);

  const glowAnim =
    fireAnimState === "fire"
      ? undefined
      : fireAnimState === "cooldown"
        ? "wc-fire-cooldown 2.2s ease-in-out infinite"
        : fireAnimState === "lock"
          ? "wc-fire-lock 1.5s ease-in-out infinite"
          : "wc-fire-breathe 3.2s ease-in-out infinite";

  const buttonBg =
    fireAnimState === "disabled"
      ? "radial-gradient(circle, #1a0800 0%, #0a0400 60%, #050200 100%)"
      : fireAnimState === "cooldown"
        ? "radial-gradient(circle, #661100 0%, #440800 60%, #1a0400 100%)"
        : pressed
          ? "radial-gradient(circle, #ff2200 0%, #aa1100 60%, #330500 100%)"
          : "radial-gradient(circle, #cc2200 0%, #880000 60%, #220000 100%)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        flex: 1,
        justifyContent: "center",
      }}
    >
      {/* Target lock label */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          letterSpacing: "0.2em",
          color: hasTarget ? "rgba(255,80,40,0.9)" : "rgba(120,80,60,0.5)",
          textShadow: hasTarget ? "0 0 8px rgba(255,60,0,0.7)" : "none",
          fontWeight: 700,
          textAlign: "center",
          whiteSpace: "nowrap",
          animation: hasTarget
            ? "fire-lock-pulse 1.5s ease-in-out infinite"
            : undefined,
          pointerEvents: "none",
          transition: "color 0.2s ease",
        }}
      >
        {hasTarget ? "TARGET LOCKED" : "NO TARGET"}
      </div>

      {/* Housing ring */}
      <div
        style={{
          position: "relative",
          borderRadius: "50%",
          padding: 5,
          background:
            "radial-gradient(circle at 40% 35%, #2a1a18 0%, #0d0908 100%)",
          boxShadow:
            "inset 0 2px 6px rgba(0,0,0,0.9), inset 0 -1px 3px rgba(255,100,60,0.08), 0 4px 12px rgba(0,0,0,0.8)",
          border: "2px solid #4a3020",
        }}
      >
        {/* Flash bloom */}
        {flash && (
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,60,0,0.5) 0%, transparent 70%)",
              pointerEvents: "none",
              animation: "wc-fire-burst 0.28s ease-out forwards",
              zIndex: 10,
            }}
          />
        )}

        <button
          type="button"
          onClick={handleFire}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleFire();
          }}
          data-ocid="console.fire_button"
          aria-label={`FIRE — ${fireAnimState}`}
          disabled={!hasTarget || isCooldown || fireAnimState === "disabled"}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: buttonBg,
            border: "none",
            cursor: !hasTarget || isCooldown ? "not-allowed" : "pointer",
            outline: "none",
            WebkitTapHighlightColor: "transparent",
            position: "relative",
            transform: pressed ? "scale(0.93) translateY(2px)" : "scale(1)",
            transition: "transform 0.1s ease",
            animation: glowAnim,
            overflow: "hidden",
          }}
        >
          {/* Glass highlight */}
          <div
            style={{
              position: "absolute",
              top: "8%",
              left: "20%",
              right: "30%",
              height: "28%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)",
              borderRadius: "50% 50% 0 0",
              pointerEvents: "none",
              transform: "rotate(-12deg)",
            }}
          />
          {/* Internal radial glow */}
          <div
            style={{
              position: "absolute",
              inset: "20%",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,${isFiring ? "80" : "40"},0,0.25) 0%, transparent 70%)`,
              pointerEvents: "none",
              transition: "background 0.15s ease",
            }}
          />
          {/* FIRE label */}
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: "0.14em",
              color:
                fireAnimState === "disabled"
                  ? "rgba(100,30,20,0.4)"
                  : "rgba(255,180,160,0.85)",
              textShadow:
                fireAnimState === "idle" || fireAnimState === "lock"
                  ? "0 0 8px rgba(255,80,40,0.8)"
                  : "none",
              pointerEvents: "none",
            }}
          >
            FIRE
          </span>
        </button>
      </div>

      {/* Status dots row */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: hasTarget
                ? "rgba(255,60,0,0.8)"
                : "rgba(60,20,20,0.6)",
              boxShadow: hasTarget ? "0 0 4px rgba(255,40,0,0.8)" : "none",
              animation: hasTarget
                ? `fire-dot-blink 0.8s ${i * 0.12}s ease-in-out infinite alternate`
                : undefined,
              transition: "background 0.2s ease",
            }}
          />
        ))}
      </div>

      {/* FIRE CONTROL label plate */}
      <LabelPlate label="FIRE CONTROL" animState={fireAnimState} />
    </div>
  );
}

// ─── Lower status strip ───────────────────────────────────────────────────────────────
function StatusStrip({
  hasTarget,
  isFiring,
  isInCooldown,
  missileWeapon,
}: {
  hasTarget: boolean;
  isFiring: boolean;
  isInCooldown: boolean;
  missileWeapon?: Weapon;
}) {
  const shield = usePlayerStore((s) => s.shield);

  const [heatPct, setHeatPct] = useState(0);
  const [powerPct, setPowerPct] = useState(100);
  const heatRef = useRef(heatPct);
  heatRef.current = heatPct;

  useEffect(() => {
    if (isFiring) {
      setHeatPct((h) => Math.min(100, h + 40));
      setPowerPct(72);
      const t = setTimeout(() => setPowerPct(100), 600);
      return () => clearTimeout(t);
    }
    if (isInCooldown) {
      const interval = setInterval(() => {
        setHeatPct((h) => {
          if (h <= 2) {
            clearInterval(interval);
            return 0;
          }
          return h - 3;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [isFiring, isInCooldown]);

  const indicatorBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 3,
  };

  function StripLabel({ label }: { label: string }) {
    return (
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 5,
          letterSpacing: "0.16em",
          color: "rgba(100,140,160,0.7)",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    );
  }

  function StripBar({
    value,
    color,
    warningColor,
    warning,
  }: {
    value: number;
    color: string;
    warningColor?: string;
    warning?: boolean;
  }) {
    const barColor = warning && warningColor ? warningColor : color;
    return (
      <div
        style={{
          width: 28,
          height: 3,
          background: "rgba(0,10,20,0.8)",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(0,60,80,0.3)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: barColor,
            boxShadow: `0 0 3px ${barColor}`,
            borderRadius: 2,
            transition: "width 0.4s ease, background 0.3s ease",
          }}
        />
      </div>
    );
  }

  function StripDot({
    on,
    color,
    blink,
    anim,
  }: {
    on: boolean;
    color: string;
    blink?: boolean;
    anim?: string;
  }) {
    return (
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: on ? color : "rgba(20,30,40,0.8)",
          boxShadow: on ? `0 0 4px ${color}` : "none",
          animation:
            on && (blink || anim)
              ? (anim ?? "wc-strip-glow 2s ease-in-out infinite")
              : undefined,
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      />
    );
  }

  const heatWarning = heatPct > 65;

  // MSL indicator derived from missileWeapon state
  const mslReady = missileWeapon ? weaponReady(missileWeapon) : false;
  const mslFraction = missileWeapon ? cooldownFraction(missileWeapon) : 0;
  const totalMissiles = 6;
  const activeMissiles = mslReady
    ? totalMissiles
    : Math.round(mslFraction * totalMissiles);

  return (
    <div
      data-ocid="console.status_strip"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "5px 8px",
        background: "rgba(0,10,18,0.9)",
        borderTop: "1px solid rgba(0,80,100,0.25)",
        flexWrap: "wrap",
        rowGap: 4,
      }}
    >
      {/* POWER */}
      <div style={indicatorBase}>
        <StripLabel label="PWR" />
        <StripBar
          value={powerPct}
          color="linear-gradient(90deg, #00aaff, #00ffcc)"
          warningColor="linear-gradient(90deg, #ff8800, #ff4400)"
          warning={powerPct < 50}
        />
        <StripDot
          on={powerPct > 60}
          color="#00ccff"
          anim="wc-strip-glow 2.5s ease-in-out infinite"
        />
      </div>

      <div
        style={{
          width: 1,
          height: 12,
          background: "rgba(0,80,100,0.3)",
          flexShrink: 0,
        }}
      />

      {/* HEAT */}
      <div style={indicatorBase}>
        <StripLabel label="HEAT" />
        <StripBar
          value={heatPct}
          color="linear-gradient(90deg, #44aaff, #ff8800)"
          warningColor="linear-gradient(90deg, #ff6600, #ff2200)"
          warning={heatWarning}
        />
        <StripDot
          on={heatPct > 20}
          color={heatWarning ? "#ff4400" : "#ffaa00"}
          blink={heatWarning}
          anim={
            heatWarning
              ? "wc-amber-led 0.6s ease-in-out infinite"
              : "wc-strip-glow 1.8s ease-in-out infinite"
          }
        />
      </div>

      <div
        style={{
          width: 1,
          height: 12,
          background: "rgba(0,80,100,0.3)",
          flexShrink: 0,
        }}
      />

      {/* TARGET LOCK */}
      <div style={indicatorBase}>
        <StripLabel label="LOCK" />
        <StripDot
          on={hasTarget}
          color="#ff4400"
          blink={hasTarget}
          anim={
            hasTarget ? "fire-lock-pulse 1.2s ease-in-out infinite" : undefined
          }
        />
      </div>

      <div
        style={{
          width: 1,
          height: 12,
          background: "rgba(0,80,100,0.3)",
          flexShrink: 0,
        }}
      />

      {/* SHIELD LINK */}
      <div style={indicatorBase}>
        <StripLabel label="SHLD" />
        <StripBar
          value={shield}
          color="linear-gradient(90deg, #0066ff, #00aaff)"
          warningColor="linear-gradient(90deg, #ff4400, #ff8800)"
          warning={shield < 30}
        />
        <StripDot
          on={shield > 10}
          color={shield > 50 ? "#00aaff" : shield > 20 ? "#ffaa00" : "#ff4400"}
        />
      </div>

      <div
        style={{
          width: 1,
          height: 12,
          background: "rgba(0,80,100,0.3)",
          flexShrink: 0,
        }}
      />

      {/* MSL indicator */}
      <div style={indicatorBase}>
        <StripLabel label="MSL" />
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: totalMissiles }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: positional missile indicators
              key={i}
              style={{
                width: 4,
                height: 7,
                borderRadius: 1,
                background:
                  i < activeMissiles ? "#00e8cc" : "rgba(0,40,60,0.5)",
                boxShadow:
                  i < activeMissiles ? "0 0 3px rgba(0,200,180,0.7)" : "none",
                border: `1px solid ${i < activeMissiles ? "rgba(0,220,190,0.4)" : "rgba(0,60,80,0.3)"}`,
                transition: "all 0.6s steps(6)",
              }}
            />
          ))}
        </div>
        <StripDot
          on={mslReady}
          color="#00e8cc"
          anim="wc-strip-glow 2s ease-in-out infinite"
        />
      </div>

      <div
        style={{
          width: 1,
          height: 12,
          background: "rgba(0,80,100,0.3)",
          flexShrink: 0,
        }}
      />

      {/* READY */}
      <div style={indicatorBase}>
        <StripLabel label="RDY" />
        <StripDot
          on={!isInCooldown && !isFiring}
          color="#00ffcc"
          anim="wc-strip-glow 3s ease-in-out infinite"
        />
      </div>
    </div>
  );
}

// ─── Main WeaponConsole ────────────────────────────────────────────────────────────────
export default function WeaponConsole() {
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedWeaponId = useWeaponsStore((s) => s.selectedWeaponId);
  const selectWeapon = useWeaponsStore((s) => s.selectWeapon);
  const fire = useWeaponsStore((s) => s.fire);
  const fireSelected = useWeaponsStore((s) => s.fireSelected);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const firingEffect = useCombatState((s) => s.firingEffect);
  const hasTarget = !!selectedNode;

  const pulseWeapon = weapons.find((w) => w.type === "pulse");
  const railWeapon = weapons.find((w) => w.type === "railgun");
  const missileWeapon = weapons.find((w) => w.type === "missile");

  const selectedWeapon = weapons.find((w) => w.id === selectedWeaponId);
  const isFiring = !!firingEffect;
  const isInCooldown =
    selectedWeapon?.status === "COOLDOWN" ||
    selectedWeapon?.status === "RELOADING" ||
    false;

  const selectedPanelSide: "left" | "right" | null =
    selectedWeaponId === "pulse"
      ? "left"
      : selectedWeaponId === "rail"
        ? "right"
        : null;
  const showLockLine =
    selectedPanelSide !== null &&
    hasTarget &&
    selectedWeapon?.status === "READY" &&
    !isFiring;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div
        data-ocid="console.panel"
        style={{
          width: "100%",
          flexShrink: 0,
          position: "relative",
          background: "linear-gradient(180deg, #0a0e12 0%, #060a0d 100%)",
          border: "1px solid rgba(0,80,100,0.3)",
          borderTop: "1px solid rgba(0,200,180,0.4)",
          boxShadow:
            "0 0 12px rgba(0,200,180,0.08), inset 0 1px 0 rgba(0,200,180,0.06)",
          // Top edge cyan glow
        }}
      >
        {/* Top edge glow strip */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.5) 20%, rgba(0,220,255,0.8) 50%, rgba(0,180,255,0.5) 80%, transparent 100%)",
            boxShadow: "0 0 8px rgba(0,200,255,0.5)",
            animation: "console-edge-glow 3s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Scan-line texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,180,0.015) 3px, rgba(0,200,180,0.015) 4px)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* FIRE recoil flash */}
        {isFiring && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(255,40,0,0.08) 0%, transparent 60%)",
              animation: "wc-recoil-flash 0.22s ease-out forwards",
              pointerEvents: "none",
              zIndex: 8,
            }}
          />
        )}

        {/* Main console row */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 6,
            padding: "8px 8px 6px",
            position: "relative",
            zIndex: 3,
            minHeight: 100,
          }}
        >
          {/* LEFT — Pulse Cannon */}
          {pulseWeapon ? (
            <WeaponPanel
              weapon={pulseWeapon}
              isSelected={selectedWeaponId === pulseWeapon.id}
              hasTarget={hasTarget}
              side="left"
              onSelect={() => selectWeapon(pulseWeapon.id)}
              onFire={() => fire(pulseWeapon.id)}
            />
          ) : (
            <div
              style={{
                flex: "0 0 28%",
                border: "1px solid rgba(0,80,100,0.1)",
                borderRadius: 4,
                background: "rgba(0,10,18,0.5)",
              }}
            />
          )}

          {/* CENTER — FIRE control */}
          <FireButton
            hasTarget={hasTarget}
            onFire={fireSelected}
            selectedWeaponStatus={selectedWeapon?.status ?? "READY"}
          />

          {/* RIGHT — Rail Gun */}
          {railWeapon ? (
            <WeaponPanel
              weapon={railWeapon}
              isSelected={selectedWeaponId === railWeapon.id}
              hasTarget={hasTarget}
              side="right"
              onSelect={() => selectWeapon(railWeapon.id)}
              onFire={() => fire(railWeapon.id)}
            />
          ) : (
            <div
              style={{
                flex: "0 0 28%",
                border: "1px solid rgba(0,80,100,0.1)",
                borderRadius: 4,
                background: "rgba(0,10,18,0.5)",
              }}
            />
          )}

          {/* Lock signal line overlay */}
          {showLockLine && selectedPanelSide && (
            <LockSignalLine side={selectedPanelSide} visible />
          )}
        </div>

        {/* LOWER STATUS STRIP */}
        <StatusStrip
          hasTarget={hasTarget}
          isFiring={isFiring}
          isInCooldown={isInCooldown}
          missileWeapon={missileWeapon}
        />
      </div>
    </>
  );
}
