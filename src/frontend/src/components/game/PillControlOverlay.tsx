/**
 * PillControlOverlay.tsx
 *
 * Frosted-glass pill HUD anchored to the bottom-center of the screen.
 * Replaces the old side panel entirely — globe fills 100% of screen,
 * this floats above it with pointer-events only on interactive zones.
 *
 * Layout (always visible):
 *
 *   ╔══════════════════════════════════════════╗
 *   ║  [PULSE] [RAIL] [MISS] [EMP]  ← weapon pills (top row)  ║
 *   ╠══════════════════════════════════════════╣
 *   ║  SHLD   HULL  │  [FIRE]  │  THRT  AMMO  ║
 *   ║         [CLR TARGET]  (if locked)        ║
 *   ╚══════════════════════════════════════════╝
 *
 * Design language: frosted glass (backdrop-filter: blur), cyan glow,
 * dark translucent background — matches Frontier cockpit aesthetic.
 *
 * RULES:
 *   - pointer-events: none on wrapper; auto only on buttons
 *   - No setState during render
 *   - Stable Zustand selectors (primitives only)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useEnemyStore } from "../../combat/useEnemyStore";
import { usePlayerStore } from "../../combat/usePlayerStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";

// ─── Colour helpers ────────────────────────────────────────────────────────────

function barColor(pct: number): string {
  if (pct < 30) return "#ff4444";
  if (pct < 60) return "#ffb830";
  return "#00e5ff";
}

function weaponLabel(id: string | null): string {
  if (!id) return "NONE";
  switch (id) {
    case "pulse":
      return "PULSE";
    case "railgun":
      return "RAIL";
    case "missile":
      return "MISS";
    case "emp":
      return "EMP";
    default:
      return id.slice(0, 5).toUpperCase();
  }
}

function ammoStatus(status: string): { text: string; color: string } {
  switch (status) {
    case "COOLDOWN":
      return { text: "COOL", color: "#ffb830" };
    case "RELOADING":
      return { text: "RELD", color: "#ffb830" };
    default:
      return { text: "READY", color: "#00ff88" };
  }
}

// ─── Mini stat chip ────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: 44,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "clamp(7px,0.9vw,10px)",
          letterSpacing: "0.12em",
          color: "rgba(0,200,255,0.45)",
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: "clamp(9px,1.1vw,13px)",
          letterSpacing: "0.08em",
          color: color ?? "rgba(0,220,255,0.85)",
          lineHeight: 1,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Weapon selector pills ─────────────────────────────────────────────────────

function WeaponPills({
  weapons,
  selectedId,
  onSelect,
}: {
  weapons: { id: string; type: string; status: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
        flexWrap: "nowrap",
      }}
    >
      {weapons.map((w) => {
        const selected = w.id === selectedId;
        const ready = w.status === "READY";
        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelect(w.id)}
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(7px,0.85vw,10px)",
              letterSpacing: "0.14em",
              padding: "4px 10px",
              borderRadius: 20,
              border: selected
                ? "1px solid rgba(0,220,255,0.7)"
                : "1px solid rgba(0,180,220,0.2)",
              background: selected
                ? "rgba(0,180,255,0.18)"
                : "rgba(0,8,20,0.55)",
              color: selected
                ? "rgba(0,220,255,0.95)"
                : ready
                  ? "rgba(0,160,200,0.6)"
                  : "rgba(255,160,0,0.65)",
              cursor: "pointer",
              pointerEvents: "auto",
              WebkitTapHighlightColor: "transparent",
              boxShadow: selected ? "0 0 8px rgba(0,200,255,0.25)" : "none",
              transition: "all 0.15s ease",
              minHeight: 28,
              minWidth: 44,
            }}
          >
            {weaponLabel(w.type)}
          </button>
        );
      })}
    </div>
  );
}

// ─── FIRE button ───────────────────────────────────────────────────────────────

function FireButton({
  hasTarget,
  onFire,
  disabled,
}: {
  hasTarget: boolean;
  onFire: () => void;
  disabled: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(() => {
    if (disabled) return;
    setPressed(true);
    onFire();
    pressTimer.current = setTimeout(() => setPressed(false), 300);
  }, [disabled, onFire]);

  useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    },
    [],
  );

  const ringColor = hasTarget
    ? disabled
      ? "rgba(255,160,0,0.5)"
      : "rgba(255,60,30,0.85)"
    : "rgba(0,180,255,0.5)";

  return (
    <button
      type="button"
      aria-label="FIRE"
      onClick={handlePress}
      style={{
        width: "clamp(64px,8vw,82px)",
        height: "clamp(64px,8vw,82px)",
        borderRadius: "50%",
        border: `2px solid ${ringColor}`,
        background: pressed
          ? "rgba(255,40,0,0.55)"
          : hasTarget
            ? disabled
              ? "rgba(40,20,0,0.7)"
              : "rgba(180,20,0,0.45)"
            : "rgba(0,20,50,0.6)",
        boxShadow: pressed
          ? "0 0 30px rgba(255,40,0,0.8), 0 0 60px rgba(255,40,0,0.35)"
          : hasTarget
            ? `0 0 18px ${ringColor}, 0 0 40px rgba(255,60,0,0.2)`
            : "0 0 12px rgba(0,180,255,0.2)",
        color: hasTarget
          ? disabled
            ? "rgba(255,160,0,0.6)"
            : "rgba(255,100,80,0.95)"
          : "rgba(0,200,255,0.7)",
        fontFamily: "monospace",
        fontSize: "clamp(11px,1.4vw,16px)",
        letterSpacing: "0.22em",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: "auto",
        WebkitTapHighlightColor: "transparent",
        transform: pressed ? "scale(0.94)" : "scale(1)",
        transition: "all 0.12s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        outline: "none",
      }}
    >
      {/* outer ring pulse when targeting */}
      {hasTarget && !disabled && (
        <span
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: "1px solid rgba(255,60,30,0.4)",
            animation: "fireRingPulse 1.2s ease-out infinite",
            pointerEvents: "none",
          }}
        />
      )}
      FIRE
    </button>
  );
}

// ─── Main overlay ──────────────────────────────────────────────────────────────

export default function PillControlOverlay() {
  // ── Stable primitive selectors ──
  const shield = usePlayerStore((s) => s.shield);
  const hull = usePlayerStore((s) => s.hull);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const clearNode = useTacticalStore((s) => s.clearNode);
  const selectNode = useTacticalStore((s) => s.selectNode);

  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedWeaponId = useWeaponsStore((s) => s.selectedWeaponId);
  const selectWeapon = useWeaponsStore((s) => s.selectWeapon);
  const fireSelected = useWeaponsStore((s) => s.fireSelected);

  const enemies = useEnemyStore((s) => s.enemies);

  // ── Derived values (in component body — not in selectors) ──
  const hasTarget = !!selectedNode;
  const activeEnemies = enemies.filter((e) => e.status === "active");
  const threatCount = activeEnemies.length;

  const selectedWeapon = weapons.find((w) => w.id === selectedWeaponId);
  const isDisabled =
    selectedWeapon?.status === "COOLDOWN" ||
    selectedWeapon?.status === "RELOADING" ||
    false;

  const ammo = ammoStatus(selectedWeapon?.status ?? "READY");

  const shieldStr = `${Math.round(shield)}%`;
  const hullStr = `${Math.round(hull)}%`;
  const threatStr = String(threatCount).padStart(2, "0");

  const handleFire = useCallback(() => {
    if (!selectedNode) {
      // Auto-acquire nearest enemy
      const nearest = activeEnemies.reduce(
        (best, e) => {
          if (!best) return e;
          const d = Math.sqrt(e.px * e.px + e.py * e.py + e.pz * e.pz);
          const bd = Math.sqrt(
            best.px * best.px + best.py * best.py + best.pz * best.pz,
          );
          return d < bd ? e : best;
        },
        null as (typeof activeEnemies)[0] | null,
      );
      if (nearest) {
        selectNode(nearest.id);
        setTimeout(() => useWeaponsStore.getState().fireSelected(), 50);
      } else {
        fireSelected();
      }
    } else {
      fireSelected();
    }
  }, [selectedNode, activeEnemies, selectNode, fireSelected]);

  return (
    <>
      <style>{`
        @keyframes fireRingPulse {
          0%   { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.4); }
        }
        @keyframes pillGlow {
          0%, 100% { box-shadow: 0 0 16px rgba(0,180,255,0.12), 0 8px 32px rgba(0,0,0,0.55); }
          50%       { box-shadow: 0 0 24px rgba(0,200,255,0.2),  0 8px 32px rgba(0,0,0,0.55); }
        }
      `}</style>

      {/* Outer wrapper — no pointer-events, just positioning */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          paddingLeft: "max(8px, env(safe-area-inset-left))",
          paddingRight: "max(8px, env(safe-area-inset-right))",
          gap: 6,
          pointerEvents: "none",
        }}
      >
        {/* ── Weapon selector pill row ────────────────────────────────── */}
        <div
          style={{
            pointerEvents: "auto",
            background: "rgba(0,6,18,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 32,
            border: "1px solid rgba(0,180,220,0.18)",
            padding: "5px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <WeaponPills
            weapons={weapons.map((w) => ({
              id: w.id,
              type: w.type,
              status: w.status,
            }))}
            selectedId={selectedWeaponId}
            onSelect={selectWeapon}
          />
        </div>

        {/* ── Main frosted-glass pill ──────────────────────────────────── */}
        <div
          style={{
            pointerEvents: "none",
            width: "min(560px, 95vw)",
            background: "rgba(0,5,16,0.62)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderRadius: 52,
            border: "1px solid rgba(0,190,255,0.22)",
            padding: "10px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            animation: "pillGlow 3s ease-in-out infinite",
          }}
        >
          {/* Stats + FIRE row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px,2vw,20px)",
              width: "100%",
              justifyContent: "center",
            }}
          >
            {/* Left stats */}
            <div
              style={{
                display: "flex",
                gap: "clamp(10px,2vw,18px)",
                pointerEvents: "none",
              }}
            >
              <StatChip
                label="SHLD"
                value={shieldStr}
                color={barColor(shield)}
              />
              <StatChip label="HULL" value={hullStr} color={barColor(hull)} />
              <StatChip
                label="THRT"
                value={threatStr}
                color={threatCount > 0 ? "#ff8800" : "rgba(0,200,255,0.45)"}
              />
            </div>

            {/* Divider */}
            <div
              style={{
                width: 1,
                height: 40,
                background: "rgba(0,190,255,0.2)",
                flexShrink: 0,
                pointerEvents: "none",
              }}
            />

            {/* FIRE button */}
            <div style={{ pointerEvents: "auto", flexShrink: 0 }}>
              <FireButton
                hasTarget={hasTarget}
                onFire={handleFire}
                disabled={!!isDisabled}
              />
            </div>

            {/* Divider */}
            <div
              style={{
                width: 1,
                height: 40,
                background: "rgba(0,190,255,0.2)",
                flexShrink: 0,
                pointerEvents: "none",
              }}
            />

            {/* Right stats */}
            <div
              style={{
                display: "flex",
                gap: "clamp(10px,2vw,18px)",
                pointerEvents: "none",
              }}
            >
              <StatChip
                label="WPN"
                value={weaponLabel(selectedWeaponId)}
                color="rgba(0,220,255,0.85)"
              />
              <StatChip label="AMMO" value={ammo.text} color={ammo.color} />
              <StatChip
                label="TGT"
                value={hasTarget ? "LOCK" : "NONE"}
                color={hasTarget ? "#ffb830" : "rgba(0,180,220,0.4)"}
              />
            </div>
          </div>

          {/* CLR TARGET — only visible when locked */}
          {hasTarget && (
            <button
              type="button"
              onClick={clearNode}
              style={{
                fontFamily: "monospace",
                fontSize: "clamp(8px,0.9vw,11px)",
                letterSpacing: "0.18em",
                color: "rgba(255,100,100,0.8)",
                background: "rgba(40,0,0,0.45)",
                border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 20,
                cursor: "pointer",
                padding: "4px 20px",
                pointerEvents: "auto",
                WebkitTapHighlightColor: "transparent",
                minHeight: 28,
                transition: "all 0.15s ease",
              }}
            >
              CLR TARGET
            </button>
          )}
        </div>
      </div>
    </>
  );
}
