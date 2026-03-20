/**
 * WeaponHologramLayer
 *
 * A purely additive holographic projection layer that floats ABOVE the physical
 * WeaponConsole. It does NOT modify WeaponConsole in any way.
 *
 * Layout mirrors the console clusters:
 *   [ LEFT HOLOGRAM (Pulse + Missile) ]  [ CENTER (reticle) ]  [ RIGHT HOLOGRAM (Rail + EMP) ]
 */
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCombatState } from "../../combat/useCombatState";
import { useWeaponsStore } from "../../combat/useWeapons";
import type { Weapon } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";

// ── Constants ────────────────────────────────────────────────────────────────
const LOCK_DURATION = 2800;

// ── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Interpolate hex colors at t ∈ [0,1] */
function lerpColor(fromHex: string, toHex: string, t: number): string {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const r = Math.round(lerp(from.r, to.r, t));
  const g = Math.round(lerp(from.g, to.g, t));
  const b = Math.round(lerp(from.b, to.b, t));
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconLightning({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M8 1L2 9h5l-1 6 7-9H8L9 1z"
        fill={color}
        opacity={0.9}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

function IconMissile({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M7 1L11 7H8v6H6V7H3L7 1z"
        fill={color}
        opacity={0.9}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

function IconRail({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="10"
      viewBox="0 0 16 10"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      {[0, 3.5, 7].map((y) => (
        <rect
          key={y}
          x="1"
          y={y}
          width="14"
          height="1.5"
          fill={color}
          opacity={0.85}
        />
      ))}
      <rect x="11" y="3.5" width="4" height="3" fill={color} opacity={0.5} />
    </svg>
  );
}

function IconEMP({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <circle cx="7" cy="7" r="2" fill={color} opacity={0.9} />
      {[4, 6, 8].map((r) => (
        <circle
          key={r}
          cx="7"
          cy="7"
          r={r}
          stroke={color}
          strokeWidth="0.8"
          opacity={0.5 - r * 0.04}
          fill="none"
        />
      ))}
    </svg>
  );
}

// ── Lock Dot ─────────────────────────────────────────────────────────────────
function LockDot({ locked }: { locked: boolean }) {
  return (
    <div
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        backgroundColor: locked ? "#00ff88" : "#ff3030",
        boxShadow: locked ? "0 0 6px #00ff88" : "0 0 4px #ff3030",
        transition: "all 0.3s ease",
        flexShrink: 0,
      }}
    />
  );
}

// ── Single Weapon Sub-panel ───────────────────────────────────────────────────
interface WeaponSubPanelProps {
  weapon: Weapon;
  isLocked: boolean;
}

function WeaponSubPanel({ weapon, isLocked }: WeaponSubPanelProps) {
  const cooldownFraction = weapon.currentCooldown / (weapon.cooldownTime || 1);
  const chargeFraction = 1 - cooldownFraction; // 1 = fully charged/ready
  const isReady = weapon.status === "READY";
  const isReloading = weapon.status === "RELOADING";

  const accentColor = weapon.color;
  const glowColor = weapon.glowColor;

  const isPulse = weapon.type === "pulse";
  const isRail = weapon.type === "railgun";
  const isMissile = weapon.type === "missile";
  const isEmp = weapon.type === "emp";

  const icon = isPulse ? (
    <IconLightning color={accentColor} />
  ) : isMissile ? (
    <IconMissile color={accentColor} />
  ) : isRail ? (
    <IconRail color={accentColor} />
  ) : (
    <IconEMP color={accentColor} />
  );

  const labelText = weapon.shortLabel;
  const stateText = isReloading ? "CHRG" : isReady ? "READY" : "COOL";

  const overallOpacity = weapon.status === "READY" ? 0.92 : 0.65;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "4px 6px",
        opacity: overallOpacity,
        transition: "opacity 0.3s ease",
        animation: isReady
          ? "holo-breathe 3.2s ease-in-out infinite"
          : undefined,
      }}
    >
      {/* Header row: icon + label + lock dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {icon}
        <span
          style={{
            fontSize: "0.48rem",
            letterSpacing: "0.12em",
            color: accentColor,
            opacity: 0.8,
            textTransform: "uppercase",
            fontFamily: "monospace",
            lineHeight: 1,
          }}
        >
          {labelText}
        </span>
        <div style={{ flex: 1 }} />
        <LockDot locked={isLocked} />
      </div>

      {/* Energy / cooldown bar (pulse + missile) */}
      {(isPulse || isMissile) && (
        <div
          style={{
            height: 3,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 2,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round(chargeFraction * 100)}%`,
              background: accentColor,
              boxShadow: `0 0 6px ${glowColor}`,
              borderRadius: 2,
              transition: `width ${isReady ? "0s" : `${weapon.cooldownTime}ms`} linear`,
            }}
          />
        </div>
      )}

      {/* Ammo pips (missile shows uses) */}
      {isMissile && (
        <div style={{ display: "flex", gap: 2 }}>
          {(["p0", "p1", "p2", "p3"] as const).map((pid, i) => (
            <div
              key={pid}
              style={{
                width: 4,
                height: 4,
                background:
                  isReady && i < 4 ? accentColor : "rgba(255,255,255,0.12)",
                boxShadow:
                  isReady && i < 4 ? `0 0 4px ${glowColor}` : undefined,
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      )}

      {/* Rail: ammo pips + heat bar */}
      {isRail && (
        <>
          <div style={{ display: "flex", gap: 2 }}>
            {[0, 1, 2, 3, 4].slice(0, weapon.maxAmmo ?? 5).map((pipNum) => (
              <div
                key={`rail-${pipNum}`}
                style={{
                  width: 4,
                  height: 4,
                  background:
                    (weapon.ammo ?? 0) > pipNum
                      ? accentColor
                      : "rgba(255,255,255,0.1)",
                  boxShadow:
                    (weapon.ammo ?? 0) > pipNum
                      ? `0 0 4px ${glowColor}`
                      : undefined,
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          {/* Heat bar (amber when in cooldown) */}
          <div
            style={{
              height: 3,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(cooldownFraction * 100)}%`,
                background: cooldownFraction > 0 ? "#ffaa00" : "#44aaff",
                boxShadow:
                  cooldownFraction > 0
                    ? "0 0 6px rgba(255,170,0,0.6)"
                    : "0 0 6px rgba(68,170,255,0.3)",
                borderRadius: 2,
                transition: `width ${weapon.cooldownTime}ms linear`,
              }}
            />
          </div>
        </>
      )}

      {/* EMP: charge ring + state text */}
      {isEmp && (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            aria-hidden="true"
            role="img"
          >
            <circle
              cx="9"
              cy="9"
              r="7"
              stroke="rgba(255,136,0,0.2)"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="9"
              cy="9"
              r="7"
              stroke={accentColor}
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${Math.round(44 * chargeFraction)} 44`}
              strokeLinecap="round"
              transform="rotate(-90 9 9)"
              style={{
                filter: `drop-shadow(0 0 3px ${glowColor})`,
                transition: `stroke-dasharray ${weapon.cooldownTime}ms linear`,
              }}
            />
          </svg>
          <span
            style={{
              fontSize: "0.4rem",
              letterSpacing: "0.1em",
              color: isReady ? accentColor : "rgba(255,136,0,0.4)",
              fontFamily: "monospace",
            }}
          >
            {stateText}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Cluster Panel (Left or Right) ─────────────────────────────────────────────
interface ClusterPanelProps {
  primaryWeapon: Weapon | undefined;
  secondaryWeapon: Weapon | undefined;
  targetLocked: boolean;
}

function ClusterPanel({
  primaryWeapon,
  secondaryWeapon,
  targetLocked,
}: ClusterPanelProps) {
  return (
    <div
      style={{
        width: "30%",
        background: "rgba(0, 18, 28, 0.58)",
        border: "1px solid rgba(0, 200, 180, 0.18)",
        borderBottom: "none",
        borderRadius: "6px 6px 0 0",
        backdropFilter: "blur(3px)",
        boxShadow:
          "0 0 14px rgba(0,200,180,0.1), inset 0 0 10px rgba(0,180,255,0.04)",
        transform: "translateY(-2px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {primaryWeapon && (
        <WeaponSubPanel weapon={primaryWeapon} isLocked={targetLocked} />
      )}
      {secondaryWeapon && (
        <>
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(0,200,180,0.2), transparent)",
              margin: "0 6px",
            }}
          />
          <WeaponSubPanel weapon={secondaryWeapon} isLocked={targetLocked} />
        </>
      )}
    </div>
  );
}

// ── Center Hologram ───────────────────────────────────────────────────────────
interface CenterHologramProps {
  lockProgress: number;
  selectedNode: string | null;
  firingWeaponType: string | null;
}

function CenterHologram({
  lockProgress,
  selectedNode,
  firingWeaponType,
}: CenterHologramProps) {
  const [showFirePulse, setShowFirePulse] = useState(false);
  const prevFiringRef = useRef<string | null>(null);

  useEffect(() => {
    if (firingWeaponType && firingWeaponType !== prevFiringRef.current) {
      setShowFirePulse(true);
      const t = setTimeout(() => setShowFirePulse(false), 400);
      prevFiringRef.current = firingWeaponType;
      return () => clearTimeout(t);
    }
    if (!firingWeaponType) {
      prevFiringRef.current = null;
    }
  }, [firingWeaponType]);

  const RADIUS = 26;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const ringColor = lerpColor("#ff3030", "#00ff88", lockProgress);
  const lockText = !selectedNode
    ? "NO TARGET"
    : lockProgress >= 1
      ? "LOCKED"
      : "TRACKING";
  const lockTextColor = !selectedNode
    ? "rgba(180,180,180,0.4)"
    : lockProgress >= 1
      ? "#00ff88"
      : "#ff4444";

  const fireColor =
    firingWeaponType === "pulse"
      ? "rgba(0,255,200,0.7)"
      : firingWeaponType === "railgun"
        ? "rgba(68,170,255,0.7)"
        : firingWeaponType === "missile"
          ? "rgba(255,100,68,0.7)"
          : "rgba(255,136,0,0.7)";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 8,
        background: "transparent",
        pointerEvents: "none",
        position: "relative",
        minHeight: 80,
      }}
    >
      {/* Reticle + lock ring composite */}
      <div style={{ position: "relative", width: 60, height: 60 }}>
        {/* Lock-on progress ring */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          style={{ position: "absolute", inset: 0 }}
          aria-hidden="true"
          role="img"
        >
          {/* Track circle */}
          <circle
            cx="30"
            cy="30"
            r={RADIUS}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx="30"
            cy="30"
            r={RADIUS}
            stroke={ringColor}
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE * lockProgress} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
            style={{
              filter: `drop-shadow(0 0 4px ${ringColor})`,
              transition: "stroke 0.1s ease",
            }}
          />
        </svg>

        {/* Rotating reticle tick marks */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          style={{
            position: "absolute",
            inset: 0,
            animation: "reticle-spin 10s linear infinite",
            opacity: selectedNode ? 0.8 : 0.3,
            transition: "opacity 0.4s ease",
          }}
          aria-hidden="true"
          role="img"
        >
          {/* 4 corner tick marks */}
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 30 + 18 * Math.cos(rad);
            const cy = 30 + 18 * Math.sin(rad);
            const ex = 30 + 24 * Math.cos(rad);
            const ey = 30 + 24 * Math.sin(rad);
            return (
              <line
                key={angle}
                x1={cx}
                y1={cy}
                x2={ex}
                y2={ey}
                stroke={ringColor}
                strokeWidth="1"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 2px ${ringColor})` }}
              />
            );
          })}
        </svg>

        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 0 8px rgba(255,255,255,0.9)",
            }}
          />
        </div>

        {/* Fire pulse ring */}
        <AnimatePresence>
          {showFirePulse && (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `1.5px solid ${fireColor}`,
                boxShadow: `0 0 12px ${fireColor}`,
                pointerEvents: "none",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Lock state text */}
      <div
        style={{
          marginTop: 5,
          fontSize: "0.45rem",
          letterSpacing: "0.14em",
          color: lockTextColor,
          fontFamily: "monospace",
          textTransform: "uppercase",
          transition: "color 0.3s ease",
        }}
      >
        {lockText}
      </div>
    </div>
  );
}

// ── Main Hologram Layer ───────────────────────────────────────────────────────
export default function WeaponHologramLayer() {
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const firingEffect = useCombatState((s) => s.firingEffect);

  // Lock-on progress
  const lockStartRef = useRef<number | null>(null);
  const [lockProgress, setLockProgress] = useState(0);

  useEffect(() => {
    if (!selectedNode) {
      lockStartRef.current = null;
      setLockProgress(0);
      return;
    }
    lockStartRef.current = Date.now();
    setLockProgress(0);
    const interval = setInterval(() => {
      if (!lockStartRef.current) return;
      const elapsed = Date.now() - lockStartRef.current;
      const p = Math.min(elapsed / LOCK_DURATION, 1);
      setLockProgress(p);
      if (p >= 1) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [selectedNode]);

  const pulse = weapons.find((w) => w.id === "pulse");
  const missile = weapons.find((w) => w.id === "missile");
  const rail = weapons.find((w) => w.id === "rail");
  const emp = weapons.find((w) => w.id === "emp");
  const targetLocked = lockProgress >= 1;

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes holo-breathe {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.88; }
        }
        @keyframes reticle-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: 0,
          right: 0,
          pointerEvents: "none",
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          padding: "0 8px",
          zIndex: 10,
        }}
      >
        {/* LEFT CLUSTER — Pulse Cannon (primary) + Heat Missile (secondary) */}
        <ClusterPanel
          primaryWeapon={pulse}
          secondaryWeapon={missile}
          targetLocked={targetLocked}
        />

        {/* CENTER — Targeting reticle + lock ring */}
        <CenterHologram
          lockProgress={lockProgress}
          selectedNode={selectedNode}
          firingWeaponType={firingEffect?.type ?? null}
        />

        {/* RIGHT CLUSTER — Rail Gun (primary) + EMP Burst (secondary) */}
        <ClusterPanel
          primaryWeapon={rail}
          secondaryWeapon={emp}
          targetLocked={targetLocked}
        />
      </div>
    </>
  );
}
