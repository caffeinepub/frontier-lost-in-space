/**
 * WeaponConsole — Cinematic AAA-quality spacecraft weapon console.
 *
 * Layered image composite over the existing CSS console.
 * Each asset sits on its own `absolute` layer, composited on top of the
 * console base using position:absolute + CSS transforms + glow animations.
 *
 * Layout:
 *   Layer 0 — console base image (full width background)
 *   Layer 1 — Pulse Cannon panel (left, rotateY 10deg)
 *   Layer 2 — Rail Gun panel    (right, rotateY -10deg)
 *   Layer 3 — FIRE button        (center, idle/pressed swap)
 *   Layer 4 — Missile panel      (bottom center)
 *   Layer 5 — depth-of-field vignette
 *
 * Dynamic overlays (cooldown bars, missile cells, LEDs) remain as React/HTML.
 */
import { useCallback, useRef, useState } from "react";
import { useCombatState } from "../../combat/useCombatState";
import { useWeaponsStore } from "../../combat/useWeapons";
import type { Weapon } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

// ─── Asset paths ──────────────────────────────────────────────────────────────
const ASSETS = {
  // Updated to use the new rebuilt weapon console image (v2)
  base: "/assets/generated/weapon-console-rebuilt-v2.dim_1200x675.jpg",
  fireIdle:
    "/assets/generated/weapon-console-fire-idle-transparent.dim_300x300.png",
  firePressed:
    "/assets/generated/weapon-console-fire-pressed-transparent.dim_300x300.png",
  pulsePanel:
    "/assets/generated/weapon-console-pulse-panel-transparent.dim_400x500.png",
  railPanel:
    "/assets/generated/weapon-console-rail-panel-transparent.dim_400x500.png",
  missilePanel:
    "/assets/generated/weapon-console-missile-panel-transparent.dim_600x300.png",
} as const;

// ─── Utility helpers ─────────────────────────────────────────────────────────

function cooldownFraction(w: Weapon): number {
  if (w.status === "RELOADING") return w.reloadProgress ?? 0;
  if (w.status === "COOLDOWN") return 1 - (w.currentCooldown ?? 0);
  return 1;
}

function weaponReady(w: Weapon): boolean {
  return w.status === "READY" && (w.ammo === undefined || w.ammo > 0);
}

// ─── Screw detail ─────────────────────────────────────────────────────────────
function Screw() {
  return (
    <div
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #8a7a60, #3a3228)",
        border: "1px solid #5a4e3e",
        boxShadow:
          "inset 0 1px 2px rgba(0,0,0,0.7), 0 1px 0 rgba(255,200,100,0.08)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "15%",
          right: "15%",
          height: 1,
          background: "rgba(0,0,0,0.7)",
          transform: "translateY(-50%) rotate(45deg)",
        }}
      />
    </div>
  );
}

// ─── Bronze engraved label plate ──────────────────────────────────────────────
function LabelPlate({ label }: { label: string }) {
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,190,80,0.04) 2px, rgba(255,190,80,0.04) 3px)",
          pointerEvents: "none",
        }}
      />
      <Screw />
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: "0.22em",
          color: "#d4a855",
          textTransform: "uppercase",
          textShadow: "0 0 4px rgba(180,120,30,0.6), 0 1px 0 rgba(0,0,0,0.8)",
          whiteSpace: "nowrap",
          position: "relative",
        }}
      >
        {label}
      </span>
      <Screw />
    </div>
  );
}

// ─── LED status indicator ──────────────────────────────────────────────────────
function LED({
  color,
  on,
  blink,
  delay = 0,
}: {
  color: string;
  on: boolean;
  blink?: boolean;
  delay?: number;
}) {
  const animKey = Math.round(delay * 10);
  return (
    <div
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: on ? color : "rgba(20,30,40,0.8)",
        boxShadow: on
          ? `0 0 5px ${color}, 0 0 10px ${color}66`
          : "inset 0 1px 2px rgba(0,0,0,0.6)",
        border: `1px solid ${on ? `${color}88` : "rgba(40,60,80,0.6)"}`,
        animation:
          blink && on
            ? `led-blink-${animKey} 1.4s ${delay}s ease-in-out infinite`
            : undefined,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Cooldown / progress strip ────────────────────────────────────────────────
function CooldownStrip({
  fraction,
  color,
  reloading,
}: {
  fraction: number;
  color: string;
  reloading?: boolean;
}) {
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
          background: reloading
            ? "linear-gradient(90deg, #ffcc44, #ff8800)"
            : `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 4px ${color}`,
          transition: "width 0.12s linear",
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// ─── Heat vents ───────────────────────────────────────────────────────────────
const VENT_OPACITIES = [0.3, 0.4, 0.5, 0.6];
function HeatVents() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {VENT_OPACITIES.map((op, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static list
          key={i}
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

// ─── Weapon side panel (Pulse Cannon / Rail Gun) — image + dynamic overlays ───
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
  const ready = weaponReady(weapon);
  const fraction = cooldownFraction(weapon);
  const accentColor = weapon.type === "pulse" ? "#00ffcc" : "#44aaff";
  const textColor = weapon.type === "pulse" ? "#80ffe8" : "#80ccff";
  const imgSrc = side === "left" ? ASSETS.pulsePanel : ASSETS.railPanel;

  const handleClick = () => {
    if (!isSelected) onSelect();
    else if (ready && hasTarget) onFire();
    else onSelect();
  };

  return (
    <div
      style={{
        position: "absolute",
        ...(side === "left"
          ? { left: "5%", top: "10%" }
          : { right: "5%", top: "10%" }),
        width: "28%",
        transform: `rotateY(${side === "left" ? "10deg" : "-10deg"})`,
        transformOrigin: side === "left" ? "left center" : "right center",
      }}
    >
      {/* Base image for this panel */}
      <img
        src={imgSrc}
        alt={side === "left" ? "Pulse Cannon panel" : "Rail Gun panel"}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          filter: `drop-shadow(0 0 12px ${accentColor}66) ${
            isFiring ? `drop-shadow(0 0 24px ${accentColor})` : ""
          }`,
          transition: "filter 0.15s ease",
          pointerEvents: "none",
        }}
      />

      {/* Interactive overlay — sits above the image */}
      <button
        type="button"
        onClick={handleClick}
        data-ocid={
          side === "left" ? "console.pulse_button" : "console.rail_button"
        }
        aria-label={`${weapon.name} — ${weapon.status}`}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 4,
          padding: "8px 10% 14%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <LabelPlate label={weapon.name} />

        {/* Status row: LEDs + power */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2px",
          }}
        >
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <LED
              color="#00ff88"
              on={ready}
              blink={ready && isSelected}
              delay={0}
            />
            <LED
              color="#ffcc00"
              on={weapon.status === "COOLDOWN"}
              blink={weapon.status === "COOLDOWN"}
              delay={0.3}
            />
            <LED
              color="#ff4444"
              on={
                weapon.status === "RELOADING" ||
                (!ready && weapon.status !== "COOLDOWN")
              }
              blink={false}
              delay={0}
            />
          </div>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 6,
              letterSpacing: "0.12em",
              color: textColor,
              textShadow: `0 0 4px ${accentColor}66`,
              lineHeight: 1,
            }}
          >
            PWR:{" "}
            {ready
              ? "100%"
              : weapon.status === "COOLDOWN"
                ? `${Math.round(fraction * 100)}%`
                : "RELOAD"}
          </span>
        </div>

        {/* Cooldown bar */}
        <CooldownStrip
          fraction={fraction}
          color={accentColor}
          reloading={weapon.status === "RELOADING"}
        />

        {/* Ammo dots for rail gun */}
        {weapon.ammo !== undefined && weapon.maxAmmo !== undefined && (
          <div
            style={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              padding: "0 2px",
            }}
          >
            {Array.from({ length: weapon.maxAmmo }, (_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: positional ammo cells
                key={i}
                style={{
                  width: 5,
                  height: 8,
                  borderRadius: 1,
                  background:
                    i < (weapon.ammo ?? 0) ? accentColor : "rgba(0,40,60,0.5)",
                  boxShadow:
                    i < (weapon.ammo ?? 0) ? `0 0 3px ${accentColor}` : "none",
                  border: `1px solid ${
                    i < (weapon.ammo ?? 0)
                      ? `${accentColor}88`
                      : "rgba(0,80,100,0.3)"
                  }`,
                  transition: "all 0.15s",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ padding: "0 3px", marginTop: 2 }}>
          <HeatVents />
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: 6,
            letterSpacing: "0.16em",
            textAlign: "center",
            color:
              isFiring || (ready && hasTarget)
                ? accentColor
                : "rgba(80,120,150,0.7)",
            textShadow:
              isFiring || (ready && hasTarget)
                ? `0 0 6px ${accentColor}`
                : "none",
            fontWeight: 700,
          }}
        >
          {isFiring
            ? "FIRING"
            : ready && hasTarget
              ? "ARMED"
              : ready
                ? "STANDBY"
                : weapon.status}
        </div>
      </button>
    </div>
  );
}

// ─── Center FIRE button — image layer + interactive overlay ───────────────────
function FireButton({
  hasTarget,
  onFire,
}: {
  hasTarget: boolean;
  onFire: () => void;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const [pressed, setPressed] = useState(false);
  const [flash, setFlash] = useState(false);
  const isFiring = !!firingEffect;

  const handleFire = useCallback(() => {
    if (!hasTarget) return;
    setPressed(true);
    setFlash(true);
    onFire();
    useTutorialStore.getState().setFireDetected();
    setTimeout(() => setPressed(false), 300);
    setTimeout(() => setFlash(false), 300);
  }, [hasTarget, onFire]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "20%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        zIndex: 5,
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
        }}
      >
        {hasTarget ? "TARGET LOCKED" : "NO TARGET"}
      </div>

      {/* Image button */}
      <div style={{ position: "relative" }}>
        {flash && (
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,60,0,0.4) 0%, transparent 70%)",
              pointerEvents: "none",
              animation: "fire-burst 0.3s ease-out forwards",
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
          aria-label="FIRE — activate selected weapon"
          data-ocid="console.fire_button"
          disabled={!hasTarget}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: hasTarget ? "pointer" : "not-allowed",
            outline: "none",
            WebkitTapHighlightColor: "transparent",
            display: "block",
          }}
        >
          <img
            src={pressed || isFiring ? ASSETS.firePressed : ASSETS.fireIdle}
            alt="FIRE"
            style={{
              width: 160,
              height: 160,
              display: "block",
              filter: `drop-shadow(0 0 ${isFiring ? "40px" : "20px"} rgba(255,0,0,${isFiring ? "0.9" : "0.7"}))`,
              animation:
                pressed || isFiring
                  ? undefined
                  : "fireGlow 2s ease-in-out infinite",
              transform: pressed ? "scale(0.94)" : "scale(1)",
              transition: "transform 0.1s ease",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
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
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Missile system panel — image layer + dynamic overlay ────────────────────
function MissilePanel({
  weapon,
  isSelected,
  hasTarget,
  onSelect,
  onFire,
}: {
  weapon: Weapon | undefined;
  isSelected: boolean;
  hasTarget: boolean;
  onSelect: () => void;
  onFire: () => void;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);

  if (!weapon) return null;

  const ready = weaponReady(weapon);
  const isFiring = firingEffect?.weaponId === weapon.id;
  const totalMissiles = 6;
  const activeMissiles = ready
    ? totalMissiles
    : Math.round(cooldownFraction(weapon) * totalMissiles);

  const handleClick = () => {
    if (!isSelected) onSelect();
    else if (ready && hasTarget) onFire();
    else onSelect();
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "6%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "44%",
        zIndex: 4,
      }}
    >
      {/* Base image */}
      <img
        src={ASSETS.missilePanel}
        alt="Missile System panel"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          filter: `drop-shadow(0 0 10px rgba(255,180,0,${isFiring ? "0.7" : "0.3"}))`,
          transition: "filter 0.15s ease",
          pointerEvents: "none",
        }}
      />

      {/* Interactive overlay */}
      <button
        type="button"
        onClick={handleClick}
        data-ocid="console.missile_button"
        aria-label={`Missile System — ${weapon.status}`}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
          padding: "8% 10%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <LabelPlate label="MISSILE SYSTEM" />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ready ? "#ff8800" : "rgba(60,30,10,0.6)",
                boxShadow: ready
                  ? "0 0 6px #ff8800, 0 0 12px #ff660066"
                  : "none",
                animation: ready
                  ? "missile-armed 1.2s ease-in-out infinite"
                  : undefined,
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 6,
                letterSpacing: "0.18em",
                fontWeight: 700,
                color: ready ? "#ff9944" : "rgba(100,60,20,0.5)",
                textShadow: ready ? "0 0 6px rgba(255,120,30,0.7)" : "none",
              }}
            >
              {ready
                ? "ARMED"
                : weapon.status === "RELOADING"
                  ? "LOADING"
                  : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Missile cells */}
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            padding: "0 4px",
          }}
        >
          {Array.from({ length: totalMissiles }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: positional missile cells
              key={i}
              style={{
                flex: 1,
                height: 14,
                borderRadius: 2,
                background:
                  i < activeMissiles
                    ? "linear-gradient(180deg, #00e8cc, #00a890)"
                    : "rgba(0,30,40,0.5)",
                boxShadow:
                  i < activeMissiles
                    ? "0 0 4px rgba(0,200,180,0.6), inset 0 1px 0 rgba(255,255,255,0.15)"
                    : "inset 0 1px 2px rgba(0,0,0,0.4)",
                border: `1px solid ${
                  i < activeMissiles
                    ? "rgba(0,220,190,0.5)"
                    : "rgba(0,60,80,0.3)"
                }`,
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {i < activeMissiles && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              )}
            </div>
          ))}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              fontWeight: 700,
              color: ready ? "#00e8cc" : "rgba(0,100,90,0.5)",
              textShadow: ready ? "0 0 6px rgba(0,220,190,0.7)" : "none",
              minWidth: 20,
              textAlign: "right",
            }}
          >
            {activeMissiles}/{totalMissiles}
          </span>
        </div>

        {/* Cooldown strip */}
        <div style={{ padding: "0 4px" }}>
          <CooldownStrip
            fraction={cooldownFraction(weapon)}
            color="#ff6644"
            reloading={weapon.status === "RELOADING"}
          />
        </div>
      </button>
    </div>
  );
}

// ─── Main WeaponConsole component ─────────────────────────────────────────────
export default function WeaponConsole() {
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedWeaponId = useWeaponsStore((s) => s.selectedWeaponId);
  const selectWeapon = useWeaponsStore((s) => s.selectWeapon);
  const fire = useWeaponsStore((s) => s.fire);
  const fireSelected = useWeaponsStore((s) => s.fireSelected);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const hasTarget = !!selectedNode;

  const _flicker = useRef(0);
  void _flicker;

  const pulseWeapon = weapons.find((w) => w.type === "pulse");
  const railWeapon = weapons.find((w) => w.type === "railgun");
  const missileWeapon = weapons.find((w) => w.type === "missile");

  return (
    <>
      <style>{`
        @keyframes fireGlow {
          0%, 100% { filter: drop-shadow(0 0 16px rgba(255,0,0,0.6)); }
          50%       { filter: drop-shadow(0 0 40px rgba(255,0,0,1)) drop-shadow(0 0 60px rgba(255,50,50,0.5)); }
        }
        @keyframes ledBlink {
          0%, 90%, 100% { opacity: 1; }
          95%            { opacity: 0.1; }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes fire-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(220,30,0,0.5), 0 0 50px rgba(200,20,0,0.25), inset 0 0 15px rgba(180,60,40,0.15), 0 6px 16px rgba(0,0,0,0.7); }
          50%       { box-shadow: 0 0 50px rgba(255,50,0,0.85), 0 0 90px rgba(255,30,0,0.45), inset 0 0 25px rgba(255,100,70,0.25), 0 6px 16px rgba(0,0,0,0.7); }
        }
        @keyframes fire-burst {
          0%   { opacity: 1; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(2); }
        }
        @keyframes fire-lock-pulse {
          0%, 100% { opacity: 0.9; }
          50%       { opacity: 1; text-shadow: 0 0 14px rgba(255,60,0,0.9), 0 0 30px rgba(255,30,0,0.5); }
        }
        @keyframes fire-dot-blink {
          from { opacity: 0.3; }
          to   { opacity: 1; }
        }
        @keyframes missile-armed {
          0%, 100% { opacity: 0.7; box-shadow: 0 0 4px #ff8800; }
          50%       { opacity: 1;   box-shadow: 0 0 8px #ff8800, 0 0 16px #ff660066; }
        }
        @keyframes led-blink-0 {
          0%, 100% { opacity: 1; } 50% { opacity: 0.2; }
        }
        @keyframes led-blink-3 {
          0%, 100% { opacity: 1; } 50% { opacity: 0.2; }
        }
        @keyframes led-blink-8 {
          0%, 100% { opacity: 0.9; } 40% { opacity: 0.15; } 60% { opacity: 0.15; }
        }
        @keyframes led-blink-14 {
          0%, 20%, 100% { opacity: 1; } 10% { opacity: 0.1; } 15% { opacity: 0.8; }
        }
        @keyframes led-blink-21 {
          0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        @keyframes console-edge-glow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Perspective wrapper — pilot looking down at console */}
      <div
        style={{
          width: "100%",
          perspective: "800px",
          perspectiveOrigin: "50% -10%",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Depth-of-field corner blurs */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "20%",
            height: "60%",
            background:
              "radial-gradient(ellipse at bottom left, rgba(0,0,0,0.6) 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "20%",
            height: "60%",
            background:
              "radial-gradient(ellipse at bottom right, rgba(0,0,0,0.6) 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />

        {/* Console surface — tilted toward viewer */}
        <div
          style={{
            transform: "rotateX(14deg)",
            transformOrigin: "center top",
            transformStyle: "preserve-3d",
            position: "relative",
            aspectRatio: "16 / 9",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* ── Layer 0: Rebuilt console base image (v2) ─────────────── */}
          <img
            src={ASSETS.base}
            alt="Weapon console base"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Carbon fiber texture overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.012) 4px, rgba(255,255,255,0.012) 5px), repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Top edge cyan light strip */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.5) 20%, rgba(0,220,255,0.8) 50%, rgba(0,180,255,0.5) 80%, transparent 100%)",
              boxShadow:
                "0 0 12px rgba(0,200,255,0.5), 0 0 25px rgba(0,180,255,0.2)",
              animation: "console-edge-glow 3s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* Micro scratches wear overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(82deg, transparent, transparent 18px, rgba(255,255,255,0.008) 18px, rgba(255,255,255,0.008) 19px)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* ── Layer 1: Pulse Cannon panel (left) ───────────────────── */}
          {pulseWeapon && (
            <WeaponPanel
              weapon={pulseWeapon}
              isSelected={selectedWeaponId === pulseWeapon.id}
              hasTarget={hasTarget}
              side="left"
              onSelect={() => selectWeapon(pulseWeapon.id)}
              onFire={() => fire(pulseWeapon.id)}
            />
          )}

          {/* ── Layer 2: Rail Gun panel (right) ──────────────────────── */}
          {railWeapon && (
            <WeaponPanel
              weapon={railWeapon}
              isSelected={selectedWeaponId === railWeapon.id}
              hasTarget={hasTarget}
              side="right"
              onSelect={() => selectWeapon(railWeapon.id)}
              onFire={() => fire(railWeapon.id)}
            />
          )}

          {/* ── Layer 3: FIRE button (center) ────────────────────────── */}
          <FireButton hasTarget={hasTarget} onFire={fireSelected} />

          {/* ── Layer 4: Missile panel (bottom center) ───────────────── */}
          <MissilePanel
            weapon={missileWeapon}
            isSelected={selectedWeaponId === (missileWeapon?.id ?? "")}
            hasTarget={hasTarget}
            onSelect={() => missileWeapon && selectWeapon(missileWeapon.id)}
            onFire={() => missileWeapon && fire(missileWeapon.id)}
          />

          {/* ── Layer 5: Depth-of-field vignette ─────────────────────── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at 50% 110%, transparent 40%, rgba(0,0,0,0.7) 100%)",
              pointerEvents: "none",
              zIndex: 15,
            }}
          />

          {/* Bottom edge seam light */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,120,180,0.3) 30%, rgba(0,140,200,0.5) 50%, rgba(0,120,180,0.3) 70%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 16,
            }}
          />

          {/* Underglow strip */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.06) 25%, rgba(0,200,255,0.12) 50%, rgba(0,180,255,0.06) 75%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 16,
            }}
          />
        </div>
      </div>
    </>
  );
}
