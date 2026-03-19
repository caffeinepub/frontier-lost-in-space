import { useCombatState } from "../../combat/useCombatState";
import { useWeaponsStore } from "../../combat/useWeapons";
import type { Weapon, WeaponStatus } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";

// Slot card sizing
const SLOT_W = 108;
const SLOT_H = 92;

function statusColor(w: Weapon): string {
  if (w.status === "RELOADING") return "#ffee44";
  if (w.status === "READY") return w.color;
  return "rgba(0,80,110,0.5)";
}

function statusLabel(w: Weapon, noTarget: boolean): string {
  if (noTarget) return "NO LOCK";
  if (w.status === "RELOADING") return "RELOADING";
  if (w.status === "READY") return "READY";
  return "COOLDOWN";
}

function ProgressBar({
  value,
  color,
  bg = "rgba(0,20,40,0.8)",
}: {
  value: number;
  color: string;
  bg?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: 3,
        background: bg,
        borderRadius: 2,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, value * 100))}%`,
          background: color,
          boxShadow: `0 0 4px ${color}`,
          transition: "width 0.1s linear",
        }}
      />
    </div>
  );
}

function WeaponSlot({
  weapon,
  hasTarget,
  onFire,
}: {
  weapon: Weapon;
  hasTarget: boolean;
  onFire: () => void;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const engaged = firingEffect?.weaponId === weapon.id;
  const ready = weapon.status === "READY" && hasTarget;
  const reloading = weapon.status === "RELOADING";
  const noTarget = !hasTarget;

  const borderColor = engaged
    ? weapon.color
    : ready
      ? `${weapon.color}99`
      : reloading
        ? "#ffee4466"
        : "rgba(0,40,60,0.4)";

  const glowShadow = engaged
    ? `0 0 22px ${weapon.glowColor}, 0 0 6px ${weapon.glowColor}`
    : ready
      ? `0 0 10px ${weapon.glowColor}`
      : reloading
        ? "0 0 8px rgba(255,238,68,0.3)"
        : "none";

  const sLabel = statusLabel(weapon, noTarget);
  const sColor = noTarget ? "rgba(80,60,60,0.6)" : statusColor(weapon);

  // Ammo display (rail gun)
  const showAmmo = weapon.ammo !== undefined && weapon.maxAmmo !== undefined;

  return (
    <button
      type="button"
      onClick={ready ? onFire : undefined}
      disabled={!ready}
      style={{
        width: SLOT_W,
        height: SLOT_H,
        position: "relative",
        padding: "8px 7px 7px",
        background:
          engaged || ready ? "rgba(0,10,28,0.96)" : "rgba(0,5,16,0.82)",
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        cursor: ready ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        boxShadow: glowShadow,
        transition: "all 0.15s ease",
        outline: "none",
        overflow: "hidden",
        pointerEvents: "auto",
        WebkitTapHighlightColor: "transparent",
        animation: engaged
          ? "slotEngaged 0.22s ease-in-out infinite alternate"
          : ready
            ? "slotReady 2.5s ease-in-out infinite"
            : "none",
      }}
    >
      {/* Weapon name */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.14em",
          fontWeight: 700,
          color: noTarget ? "rgba(100,80,80,0.5)" : weapon.color,
          textShadow: ready ? `0 0 8px ${weapon.color}66` : "none",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {weapon.shortLabel}
      </div>

      {/* Weapon type icon (text symbol) */}
      <div
        style={{
          fontSize: 18,
          lineHeight: 1,
          opacity: noTarget ? 0.3 : reloading ? 0.6 : ready ? 1 : 0.45,
          filter: ready ? `drop-shadow(0 0 4px ${weapon.color})` : "none",
        }}
      >
        {weapon.type === "pulse"
          ? "⚡"
          : weapon.type === "railgun"
            ? "▶▶"
            : weapon.type === "missile"
              ? "🚀"
              : "◎"}
      </div>

      {/* Ammo count (rail gun) */}
      {showAmmo && (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.1em",
            color: reloading ? "#ffee44" : weapon.color,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {reloading
            ? "RELOADING"
            : `${weapon.ammo ?? 0}/${weapon.maxAmmo ?? 0}`}
        </div>
      )}

      {/* Status badge */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: sColor,
          lineHeight: 1,
          textShadow: ready ? `0 0 6px ${weapon.color}88` : "none",
        }}
      >
        {sLabel}
      </div>

      {/* Progress bar */}
      {weapon.status === "COOLDOWN" && (
        <ProgressBar value={1 - weapon.currentCooldown} color={weapon.color} />
      )}
      {reloading && (
        <ProgressBar value={weapon.reloadProgress ?? 0} color="#ffee44" />
      )}
      {weapon.status === "READY" && !noTarget && (
        <ProgressBar value={1} color={weapon.color} />
      )}

      {/* Engaged overlay */}
      {engaged && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${weapon.color}14, transparent 70%)`,
            pointerEvents: "none",
            borderRadius: 3,
          }}
        />
      )}
    </button>
  );
}

/** Landscape bottom-anchored 3-slot tap-to-fire weapon HUD */
export default function WeaponSlotHUD() {
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const weapons = useWeaponsStore((s) => s.weapons);
  const fire = useWeaponsStore((s) => s.fire);
  const screenFlash = useCombatState((s) => s.screenFlash);
  const shieldHit = useCombatState((s) => s.shieldHit);
  const empStunnedNode = useCombatState((s) => s.empStunnedNode);
  const firingEffect = useCombatState((s) => s.firingEffect);

  const flashColor =
    firingEffect?.type === "emp"
      ? "rgba(255,120,0,0.10)"
      : firingEffect?.type === "missile"
        ? "rgba(255,80,40,0.11)"
        : firingEffect?.type === "railgun"
          ? "rgba(80,160,255,0.12)"
          : "rgba(0,255,180,0.08)";

  return (
    <>
      {/* Screen flash */}
      {screenFlash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: flashColor,
            pointerEvents: "none",
            zIndex: 36,
            animation: "weaponFlash 0.12s ease-out forwards",
          }}
        />
      )}
      {shieldHit && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,60,0,0.07)",
            pointerEvents: "none",
            zIndex: 37,
            animation: "shieldFlash 0.4s ease-out forwards",
          }}
        />
      )}
      {empStunnedNode && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,80,0,0.03)",
            pointerEvents: "none",
            zIndex: 36,
            animation: "empFlicker 3s ease-out forwards",
          }}
        />
      )}

      {/* No-target hint */}
      {!selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: "clamp(100px, 14vh, 130px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 35,
            pointerEvents: "none",
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(0,180,255,0.25)",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          CLICK GLOBE TO ACQUIRE TARGET
        </div>
      )}

      {/* 3-slot HUD */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(10px, 2.5vh, 28px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 35,
          pointerEvents: "auto",
          display: "flex",
          gap: 8,
        }}
      >
        {weapons.map((weapon) => (
          <WeaponSlot
            key={weapon.id}
            weapon={weapon}
            hasTarget={!!selectedNode}
            onFire={() => fire(weapon.id)}
          />
        ))}
      </div>

      {/* Target label above slots */}
      {selectedNode && (
        <div
          style={{
            position: "absolute",
            bottom: `calc(clamp(10px, 2.5vh, 28px) + ${SLOT_H}px + 8px)`,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 35,
            pointerEvents: "none",
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.2em",
            color: empStunnedNode ? "#ff8800" : "rgba(0,200,255,0.7)",
            textShadow: empStunnedNode
              ? "0 0 8px #ff880088"
              : "0 0 6px rgba(0,200,255,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {empStunnedNode
            ? `▸ ${selectedNode} — EMP STUNNED`
            : `▸ TARGET LOCKED — ${selectedNode}`}
        </div>
      )}

      <style>{`
        @keyframes weaponFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes empFlicker { 0%,100%{opacity:1}10%{opacity:0.3}20%{opacity:0.9}30%{opacity:0.2}40%{opacity:0.8}60%{opacity:0.5}80%{opacity:0.2} }
        @keyframes shieldFlash { 0%{opacity:1}30%{opacity:0.6}100%{opacity:0} }
        @keyframes slotEngaged {
          from { box-shadow: 0 0 18px var(--sc, #00ffcc44); }
          to   { box-shadow: 0 0 6px var(--sc, #00ffcc22); }
        }
        @keyframes slotReady {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.88; }
        }
      `}</style>
    </>
  );
}

export type { WeaponStatus };
