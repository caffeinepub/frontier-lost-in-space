/**
 * WeaponConsole — Grouped weapon system panel.
 *
 * LAYOUT:
 *   [ LEFT CLUSTER ]  [ FIRE CENTER ]  [ RIGHT CLUSTER ]
 *     Pulse Cannon       (dominant)       Rail Gun
 *     Heat Missile                        EMP Burst
 *
 * Each cluster is a single unified housing — not separate cards.
 * Only lighting, indicators, bars, and button behavior change between states.
 * Mobile-first. Zero 3D / globe visuals.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useCombatState } from "../../combat/useCombatState";
import { usePlayerStore } from "../../combat/usePlayerStore";
import { type AiMode, useWeaponAI } from "../../combat/useWeaponAI";
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

// ─── Utility helpers ──────────────────────────────────────────────────────────
function cooldownFraction(w: Weapon): number {
  if (w.status === "RELOADING") return w.reloadProgress ?? 0;
  if (w.status === "COOLDOWN") return 1 - (w.currentCooldown ?? 0);
  return 1;
}
function weaponReady(w: Weapon): boolean {
  return w.status === "READY" && (w.ammo === undefined || w.ammo > 0);
}

// ─── CSS keyframes ────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes wc-idle-glow {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }
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
  @keyframes wc-fire-burst {
    0%   { opacity: 1; transform: scale(0.75); }
    100% { opacity: 0; transform: scale(2.2); }
  }
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
  @keyframes wc-lock-led {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.3); }
  }
  @keyframes wc-lock-signal {
    0%   { opacity: 0.4; }
    50%  { opacity: 1;   }
    100% { opacity: 0.4; }
  }
  @keyframes wc-discharge {
    0%   { opacity: 0.9; }
    100% { opacity: 0;   }
  }
  @keyframes wc-recoil-flash {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes wc-amber-led {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1;   }
  }
  @keyframes wc-ready-bar-in {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  @keyframes wc-strip-glow {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }
  @keyframes console-edge-glow {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }
  @keyframes fire-lock-pulse {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1;   }
  }
  @keyframes fire-dot-blink {
    from { opacity: 0.4; }
    to   { opacity: 1;   }
  }
  @keyframes ai-badge-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}
@keyframes cluster-pulse {
    0%, 100% { opacity: 0.85; }
    50%       { opacity: 1; }
  }
  @keyframes emp-charge {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }
`;

// ─── Screw detail ─────────────────────────────────────────────────────────────
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
      }}
    />
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

// ─── Cooldown progress bar ─────────────────────────────────────────────────────
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
        height: 2,
        background: "rgba(0,10,20,0.8)",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.round(fraction * 100)}%`,
          background: isRailCooldown
            ? "linear-gradient(90deg, #ff6600, #ffcc00)"
            : reloading
              ? "linear-gradient(90deg, #ffcc44, #ff8800)"
              : `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 3px ${color}`,
          transition: `width ${transitionTime} ${
            weaponType === "missile" ? "steps(6)" : "linear"
          }`,
          borderRadius: 1,
        }}
      />
    </div>
  );
}

// ─── Compact weapon slot (inside cluster) ─────────────────────────────────────
/**
 * A single weapon station inside the cluster housing.
 * Background is transparent — the cluster housing provides the surface.
 */
function WeaponSlot({
  weapon,
  isPrimary,
  isSelected,
  hasTarget,
  ocid,
  onSelect,
  onFire,
  isRecommended = false,
}: {
  weapon: Weapon;
  isPrimary: boolean;
  isSelected: boolean;
  hasTarget: boolean;
  ocid: string;
  onSelect: () => void;
  onFire: () => void;
  isRecommended?: boolean;
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

  // Per-weapon accent color
  const accentColor =
    weapon.type === "pulse"
      ? "#00ffcc"
      : weapon.type === "railgun"
        ? "#44aaff"
        : weapon.type === "missile"
          ? "#ff6644"
          : "#ff8800"; // emp

  const statusDotColor =
    animState === "cooldown"
      ? "#ffaa00"
      : animState === "disabled"
        ? "rgba(60,40,40,0.5)"
        : ready
          ? accentColor
          : "#ff4444";

  const slotHighlight =
    isSelected || isHovered ? "rgba(0,200,180,0.06)" : "transparent";

  const handleClick = () => {
    if (isDisabled) return;
    if (!isSelected) onSelect();
    else if (ready && hasTarget) onFire();
    else onSelect();
  };

  return (
    <button
      type="button"
      data-ocid={ocid}
      aria-label={`${weapon.name} — ${animState}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      onMouseEnter={() => onHover(weapon.id)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(weapon.id)}
      onTouchEnd={() => onHover(null)}
      style={{
        flex: isPrimary ? "0 0 55%" : "0 0 45%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "5px 7px 4px",
        background: slotHighlight,
        border: "none",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: tokens.opacity,
        filter: `brightness(${tokens.brightness})`,
        transition:
          "opacity 0.15s ease, filter 0.15s ease, background 0.15s ease",
        position: "relative",
        overflow: "hidden",
        animation:
          animState === "idle"
            ? "cluster-pulse 3.2s ease-in-out infinite"
            : undefined,
      }}
    >
      {/* Discharge flash (fire state) */}
      {animState === "fire" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${accentColor}22 0%, transparent 70%)`,
            animation: "wc-discharge 0.2s ease-out forwards",
            pointerEvents: "none",
            zIndex: 8,
          }}
        />
      )}

      {/* AI recommendation badge */}
      {isRecommended && (
        <span
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            fontSize: "0.45rem",
            color: "#00ffcc",
            border: "1px solid rgba(0,255,200,0.4)",
            padding: "1px 3px",
            borderRadius: 2,
            letterSpacing: "0.08em",
            fontFamily: "monospace",
            fontWeight: 700,
            animation: "ai-badge-pulse 1.5s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          AI
        </span>
      )}

      {/* Top row: label + status dot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.12em",
            fontWeight: 700,
            textTransform: "uppercase",
            color:
              animState === "disabled"
                ? "rgba(80,60,60,0.5)"
                : isSelected
                  ? accentColor
                  : "rgba(160,190,200,0.75)",
            textShadow:
              isSelected || animState === "lock"
                ? `0 0 6px ${accentColor}66`
                : "none",
            transition: "color 0.15s ease",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {weapon.name}
        </span>

        {/* Status dot */}
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            flexShrink: 0,
            background:
              animState === "disabled" ? "rgba(30,20,20,0.8)" : statusDotColor,
            boxShadow:
              animState === "disabled"
                ? "none"
                : `0 0 4px ${statusDotColor}, 0 0 8px ${statusDotColor}55`,
            animation:
              animState === "cooldown"
                ? "wc-amber-led 1.4s ease-in-out infinite"
                : animState === "lock"
                  ? "wc-lock-led 0.8s ease-in-out infinite"
                  : undefined,
            transition: "background 0.2s ease, box-shadow 0.2s ease",
          }}
        />
      </div>

      {/* Middle: weapon-specific charge indicator */}
      <WeaponSlotMeter
        weapon={weapon}
        fraction={fraction}
        animState={animState}
        accentColor={accentColor}
      />

      {/* Readiness underline (hover/lock) */}
      {tokens.readyBarVisible && (
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 3px ${accentColor}66`,
            animation: "wc-ready-bar-in 0.16s ease-out forwards",
            borderRadius: 1,
            marginBottom: 2,
          }}
        />
      )}

      {/* Bottom progress bar — 2px, fills during cooldown refill */}
      <CooldownStrip
        fraction={fraction}
        color={accentColor}
        reloading={weapon.status === "RELOADING"}
        animState={animState}
        weaponType={weapon.type}
      />
    </button>
  );
}

// ─── Per-weapon meter inside slot ─────────────────────────────────────────────
function WeaponSlotMeter({
  weapon,
  fraction,
  animState,
  accentColor,
}: {
  weapon: Weapon;
  fraction: number;
  animState: WeaponAnimState;
  accentColor: string;
}) {
  if (weapon.type === "pulse") {
    // Vertical energy bar (compact)
    const fillColor = animState === "cooldown" ? "#ffaa00" : accentColor;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div
          style={{
            width: 5,
            height: 28,
            background: "rgba(0,10,20,0.9)",
            border: `1px solid ${accentColor}33`,
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${Math.round(fraction * 100)}%`,
              background: `linear-gradient(0deg, ${fillColor}88, ${fillColor})`,
              boxShadow: `0 0 4px ${fillColor}`,
              transition: "height 1.8s linear",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 5,
            color: `${accentColor}88`,
            letterSpacing: "0.1em",
          }}
        >
          {Math.round(fraction * 100)}%
        </span>
      </div>
    );
  }

  if (weapon.type === "railgun") {
    // Segmented charge bar (compact, 5 segs)
    const segments = 5;
    const filled = Math.round(fraction * segments);
    const isHeat = animState === "cooldown";
    return (
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: segments }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 1,
              background:
                i < filled
                  ? isHeat
                    ? "linear-gradient(180deg, #ff8800, #ff4400)"
                    : `linear-gradient(180deg, ${accentColor}cc, ${accentColor})`
                  : "rgba(0,20,40,0.6)",
              boxShadow:
                i < filled
                  ? `0 0 3px ${isHeat ? "#ff6600" : accentColor}`
                  : "none",
              border: `1px solid ${
                i < filled
                  ? isHeat
                    ? "rgba(255,100,0,0.4)"
                    : `${accentColor}44`
                  : "rgba(0,40,80,0.3)"
              }`,
              transition: "all 0.25s",
            }}
          />
        ))}
        {weapon.ammo !== undefined && (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 5,
              color: `${accentColor}88`,
              letterSpacing: "0.1em",
              marginLeft: 2,
              alignSelf: "center",
            }}
          >
            {weapon.ammo}/{weapon.maxAmmo}
          </span>
        )}
      </div>
    );
  }

  if (weapon.type === "missile") {
    // Missile count dots
    const total = 4;
    const active = weaponReady(weapon)
      ? total
      : Math.max(0, Math.round(fraction * total));
    return (
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional
            key={i}
            style={{
              width: 5,
              height: 9,
              borderRadius: 1,
              background: i < active ? accentColor : "rgba(40,10,10,0.6)",
              boxShadow: i < active ? `0 0 3px ${accentColor}` : "none",
              border: `1px solid ${
                i < active ? `${accentColor}55` : "rgba(80,20,20,0.3)"
              }`,
              transition: "all 0.6s steps(4)",
            }}
          />
        ))}
      </div>
    );
  }

  // EMP — radial charge ring (compact)
  const isCharging = animState === "cooldown";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: isCharging
            ? "rgba(40,20,0,0.9)"
            : weaponReady(weapon)
              ? "radial-gradient(circle, rgba(255,136,0,0.3) 0%, rgba(255,80,0,0.1) 60%, transparent 100%)"
              : "rgba(20,10,0,0.5)",
          border: `1px solid ${
            animState === "disabled" ? "rgba(40,20,0,0.3)" : `${accentColor}55`
          }`,
          boxShadow:
            weaponReady(weapon) && !isCharging
              ? `0 0 6px ${accentColor}66, inset 0 0 4px ${accentColor}33`
              : "none",
          animation:
            weaponReady(weapon) && animState !== "disabled"
              ? "emp-charge 2.2s ease-in-out infinite"
              : undefined,
          transition: "all 0.3s ease",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 5,
          color:
            animState === "disabled"
              ? "rgba(60,40,20,0.4)"
              : isCharging
                ? "#ffaa00"
                : `${accentColor}99`,
          letterSpacing: "0.1em",
        }}
      >
        {isCharging ? "CHRG" : weaponReady(weapon) ? "READY" : "OFFL"}
      </span>
    </div>
  );
}

// ─── Weapon cluster (unified housing for 2 weapons) ───────────────────────────
function WeaponCluster({
  topWeapon,
  bottomWeapon,
  selectedWeaponId,
  hasTarget,
  side,
  onSelect,
  onFire,
  recommendedWeaponId = null,
}: {
  topWeapon: Weapon;
  bottomWeapon: Weapon;
  selectedWeaponId: string;
  hasTarget: boolean;
  side: "left" | "right";
  onSelect: (id: string) => void;
  onFire: (id: string) => void;
  recommendedWeaponId?: string | null;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const hoveredId = useWeaponAnimStore((s) => s.hoveredWeaponId);

  const topSelected = selectedWeaponId === topWeapon.id;
  const bottomSelected = selectedWeaponId === bottomWeapon.id;
  const topFiring = firingEffect?.weaponId === topWeapon.id;
  const bottomFiring = firingEffect?.weaponId === bottomWeapon.id;
  const topHovered = hoveredId === topWeapon.id;
  const bottomHovered = hoveredId === bottomWeapon.id;

  // Cluster activates when any weapon inside is selected/hovered/firing
  const clusterActive =
    topSelected ||
    bottomSelected ||
    topFiring ||
    bottomFiring ||
    topHovered ||
    bottomHovered;

  const edgeDir = side === "left" ? "inset 2px 0 8px" : "inset -2px 0 8px";
  const clusterShadow = clusterActive
    ? `0 0 18px rgba(0,200,180,0.18), ${edgeDir} rgba(0,180,255,0.12)`
    : `${edgeDir} rgba(0,180,255,0.06)`;

  return (
    <div
      style={{
        flex: "0 0 30%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #080c10 0%, #0a0f14 100%)",
        borderRadius: "5px",
        boxShadow: clusterShadow,
        border: "1px solid rgba(0,120,140,0.18)",
        overflow: "hidden",
        transition: "box-shadow 200ms ease",
        position: "relative",
        // Scan-line texture
        backgroundImage:
          "linear-gradient(180deg, #080c10 0%, #0a0f14 100%), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,180,0.012) 3px, rgba(0,200,180,0.012) 4px)",
      }}
    >
      {/* Top weapon slot (primary — 55%) */}
      <WeaponSlot
        weapon={topWeapon}
        isPrimary
        isSelected={topSelected}
        hasTarget={hasTarget}
        ocid={`console.${topWeapon.id}_button`}
        onSelect={() => onSelect(topWeapon.id)}
        onFire={() => onFire(topWeapon.id)}
        isRecommended={recommendedWeaponId === topWeapon.id}
      />

      {/* Internal seam divider */}
      <div
        style={{
          height: 1,
          background: "rgba(0,200,180,0.15)",
          boxShadow: "0 0 4px rgba(0,200,180,0.08)",
          flexShrink: 0,
          margin: "0 6px",
        }}
      />

      {/* Bottom weapon slot (secondary — 45%) */}
      <WeaponSlot
        weapon={bottomWeapon}
        isPrimary={false}
        isSelected={bottomSelected}
        hasTarget={hasTarget}
        ocid={`console.${bottomWeapon.id}_button`}
        onSelect={() => onSelect(bottomWeapon.id)}
        onFire={() => onFire(bottomWeapon.id)}
        isRecommended={recommendedWeaponId === bottomWeapon.id}
      />

      {/* Cluster label plate */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #3d2e1a 0%, #5a3e20 50%, #3d2e1a 100%)",
          borderTop: "1px solid rgba(154,120,64,0.4)",
          padding: "2px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Screw />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 5,
            letterSpacing: "0.2em",
            fontWeight: 700,
            color: "rgba(180,140,70,0.7)",
            textTransform: "uppercase",
          }}
        >
          {side === "left" ? "SYSTEM A" : "SYSTEM B"}
        </span>
        <Screw />
      </div>
    </div>
  );
}

// ─── Lock signal path ─────────────────────────────────────────────────────────
function LockSignalLine({
  side,
  visible,
}: { side: "left" | "right"; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "38%",
        ...(side === "left"
          ? { left: "31%", right: "38%" }
          : { left: "38%", right: "31%" }),
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

// ─── Center FIRE button ────────────────────────────────────────────────────────
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
        flex: "0 0 auto",
        minWidth: 110,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        background: "linear-gradient(180deg, #0d0808 0%, #080505 100%)",
        border: "1px solid rgba(120,40,20,0.25)",
        borderRadius: 5,
        padding: "6px 8px",
        boxShadow: "inset 0 0 12px rgba(0,0,0,0.6)",
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
        {hasTarget ? "TGT LOCK" : "NO TGT"}
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
      <LabelPlate label="FIRE CTRL" animState={fireAnimState} />
    </div>
  );
}

// ─── Lower status strip ───────────────────────────────────────────────────────
function StatusStrip({
  hasTarget,
  isFiring,
  isInCooldown,
  missileWeapon,
  empWeapon,
}: {
  hasTarget: boolean;
  isFiring: boolean;
  isInCooldown: boolean;
  missileWeapon?: Weapon;
  empWeapon?: Weapon;
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

  const mslReady = missileWeapon ? weaponReady(missileWeapon) : false;
  const mslFraction = missileWeapon ? cooldownFraction(missileWeapon) : 0;
  const totalMissiles = 4;
  const activeMissiles = mslReady
    ? totalMissiles
    : Math.round(mslFraction * totalMissiles);

  const empReady = empWeapon ? weaponReady(empWeapon) : false;

  const Divider = () => (
    <div
      style={{
        width: 1,
        height: 12,
        background: "rgba(0,80,100,0.3)",
        flexShrink: 0,
      }}
    />
  );

  return (
    <div
      data-ocid="console.status_strip"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
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

      <Divider />

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

      <Divider />

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

      <Divider />

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

      <Divider />

      {/* MSL */}
      <div style={indicatorBase}>
        <StripLabel label="MSL" />
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: totalMissiles }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: positional
              key={i}
              style={{
                width: 4,
                height: 7,
                borderRadius: 1,
                background:
                  i < activeMissiles ? "#ff6644" : "rgba(40,10,0,0.5)",
                boxShadow:
                  i < activeMissiles ? "0 0 3px rgba(255,100,68,0.7)" : "none",
                border: `1px solid ${
                  i < activeMissiles
                    ? "rgba(255,100,68,0.4)"
                    : "rgba(60,20,0,0.3)"
                }`,
                transition: "all 0.6s steps(4)",
              }}
            />
          ))}
        </div>
      </div>

      <Divider />

      {/* EMP */}
      <div style={indicatorBase}>
        <StripLabel label="EMP" />
        <StripDot
          on={empReady}
          color="#ff8800"
          anim="emp-charge 2.2s ease-in-out infinite"
        />
      </div>

      <Divider />

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

// ─── Main WeaponConsole ────────────────────────────────────────────────────────
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
  const empWeapon = weapons.find((w) => w.type === "emp");

  const selectedWeapon = weapons.find((w) => w.id === selectedWeaponId);
  const isFiring = !!firingEffect;
  const isInCooldown =
    selectedWeapon?.status === "COOLDOWN" ||
    selectedWeapon?.status === "RELOADING" ||
    false;

  // Weapon AI
  const recommendedWeaponId = useWeaponAI((s) => s.recommendedWeaponId);
  const aiMode = useWeaponAI((s) => s.aiMode);
  const setAiMode = useWeaponAI((s) => s.setAiMode);

  // Left cluster: pulse, missile. Right cluster: rail, emp.
  const selectedPanelSide: "left" | "right" | null =
    selectedWeaponId === "pulse" || selectedWeaponId === "missile"
      ? "left"
      : selectedWeaponId === "rail" || selectedWeaponId === "emp"
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
        }}
      >
        {/* AI MODE indicator */}
        <button
          type="button"
          data-ocid="console.ai_mode_toggle"
          onClick={() => setAiMode(aiMode === "manual" ? "assisted" : "manual")}
          style={{
            position: "absolute",
            top: 3,
            right: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            zIndex: 20,
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
          title={
            aiMode === "assisted" ? "Switch to Manual" : "Switch to AI Assist"
          }
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.5rem",
              letterSpacing: "0.12em",
              fontWeight: 700,
              color: aiMode === "assisted" ? "#00ff88" : "rgba(0,180,200,0.45)",
              textShadow: aiMode === "assisted" ? "0 0 6px #00ff8866" : "none",
              transition: "color 0.25s ease, text-shadow 0.25s ease",
            }}
          >
            {aiMode === "assisted" ? "AI ASSIST" : "MANUAL"}
          </span>
        </button>

        {/* Top edge cyan glow strip */}
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

        {/* Scan-line texture */}
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
            minHeight: 110,
          }}
        >
          {/* LEFT CLUSTER — Pulse Cannon (top) + Heat Missile (bottom) */}
          {pulseWeapon && missileWeapon ? (
            <WeaponCluster
              topWeapon={pulseWeapon}
              bottomWeapon={missileWeapon}
              selectedWeaponId={selectedWeaponId}
              hasTarget={hasTarget}
              side="left"
              onSelect={selectWeapon}
              onFire={fire}
              recommendedWeaponId={recommendedWeaponId}
            />
          ) : (
            <div
              style={{
                flex: "0 0 30%",
                border: "1px solid rgba(0,80,100,0.1)",
                borderRadius: 5,
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

          {/* RIGHT CLUSTER — Rail Gun (top) + EMP Burst (bottom) */}
          {railWeapon && empWeapon ? (
            <WeaponCluster
              topWeapon={railWeapon}
              bottomWeapon={empWeapon}
              selectedWeaponId={selectedWeaponId}
              hasTarget={hasTarget}
              side="right"
              onSelect={selectWeapon}
              onFire={fire}
              recommendedWeaponId={recommendedWeaponId}
            />
          ) : (
            <div
              style={{
                flex: "0 0 30%",
                border: "1px solid rgba(0,80,100,0.1)",
                borderRadius: 5,
                background: "rgba(0,10,18,0.5)",
              }}
            />
          )}

          {/* Lock signal line overlay */}
          {showLockLine && selectedPanelSide && (
            <LockSignalLine side={selectedPanelSide} visible />
          )}
        </div>

        {/* STATUS STRIP */}
        <StatusStrip
          hasTarget={hasTarget}
          isFiring={isFiring}
          isInCooldown={isInCooldown}
          missileWeapon={missileWeapon}
          empWeapon={empWeapon}
        />
      </div>
    </>
  );
}
