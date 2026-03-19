import { useCombatState } from "../../combat/useCombatState";
import { useWeaponsStore } from "../../combat/useWeapons";
import type { Weapon } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";

function WeaponSlotCard({
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

  const borderColor = engaged
    ? weapon.color
    : ready
      ? `${weapon.color}99`
      : reloading
        ? "#ffee4466"
        : "rgba(0,40,60,0.4)";

  const showAmmo = weapon.ammo !== undefined && weapon.maxAmmo !== undefined;

  return (
    <button
      type="button"
      onClick={ready ? onFire : undefined}
      disabled={!ready}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 80,
        padding: "9px 6px 8px",
        background:
          ready || engaged ? "rgba(0,10,28,0.98)" : "rgba(0,5,16,0.82)",
        border: `1px solid ${borderColor}`,
        borderRadius: 5,
        cursor: ready ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        boxShadow: engaged
          ? `0 0 18px ${weapon.glowColor}`
          : ready
            ? `0 0 10px ${weapon.glowColor}`
            : reloading
              ? "0 0 6px rgba(255,238,68,0.25)"
              : "none",
        transition: "all 0.15s ease",
        outline: "none",
        overflow: "hidden",
        pointerEvents: "auto",
        WebkitTapHighlightColor: "transparent",
        position: "relative",
      }}
    >
      {/* Type icon */}
      <div
        style={{
          fontSize: 16,
          lineHeight: 1,
          opacity: !hasTarget ? 0.3 : reloading ? 0.6 : ready ? 1 : 0.45,
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

      {/* Name */}
      <div
        style={{
          fontSize: 7,
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          color: !hasTarget
            ? "rgba(80,60,60,0.5)"
            : ready || engaged
              ? weapon.color
              : "rgba(0,100,130,0.5)",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {weapon.shortLabel}
      </div>

      {/* Ammo / status */}
      <div
        style={{
          fontSize: 7,
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          fontWeight: 700,
          color: reloading
            ? "#ffee44"
            : !hasTarget
              ? "rgba(80,60,60,0.4)"
              : engaged
                ? weapon.color
                : ready
                  ? `${weapon.color}99`
                  : "rgba(0,100,150,0.5)",
          lineHeight: 1,
        }}
      >
        {!hasTarget
          ? "NO LOCK"
          : engaged
            ? "FIRING"
            : reloading
              ? "RELOAD"
              : showAmmo
                ? `${weapon.ammo}/${weapon.maxAmmo}`
                : ready
                  ? "READY"
                  : "COOL"}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "100%",
          height: 2,
          background: "rgba(0,20,40,0.8)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: reloading
              ? `${(weapon.reloadProgress ?? 0) * 100}%`
              : weapon.status === "COOLDOWN"
                ? `${(1 - weapon.currentCooldown) * 100}%`
                : ready
                  ? "100%"
                  : "0%",
            background: reloading
              ? "#ffee44"
              : `linear-gradient(90deg, ${weapon.color}66, ${weapon.color})`,
            boxShadow: ready ? `0 0 4px ${weapon.color}` : "none",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* Tap hint overlay */}
      {ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${weapon.color}08, transparent 70%)`,
            pointerEvents: "none",
            borderRadius: 4,
          }}
        />
      )}
    </button>
  );
}

export default function WeaponActionModule() {
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const weapons = useWeaponsStore((s) => s.weapons);
  const fire = useWeaponsStore((s) => s.fire);
  const firingEffect = useCombatState((s) => s.firingEffect);
  const empStunnedNode = useCombatState((s) => s.empStunnedNode);

  return (
    <div
      style={{
        background: "rgba(0,4,14,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(0,200,255,0.15)",
        padding: "10px 12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        pointerEvents: "auto",
        flexShrink: 0,
      }}
    >
      {/* Target status */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.18em",
          color: selectedNode
            ? empStunnedNode
              ? "#ff8800"
              : "rgba(0,200,255,0.7)"
            : "rgba(0,180,255,0.3)",
          textShadow:
            selectedNode && !empStunnedNode
              ? "0 0 6px rgba(0,200,255,0.3)"
              : "none",
          pointerEvents: "none",
          lineHeight: 1,
        }}
      >
        {selectedNode
          ? empStunnedNode
            ? `▸ ${selectedNode} — EMP STUNNED`
            : `▸ TARGET LOCKED — ${selectedNode}`
          : "TAP GLOBE TO ACQUIRE TARGET"}
      </div>

      {/* 3 weapon slots — tap to fire */}
      <div style={{ display: "flex", gap: 6 }}>
        {weapons.map((weapon) => (
          <WeaponSlotCard
            key={weapon.id}
            weapon={weapon}
            hasTarget={!!selectedNode}
            onFire={() => fire(weapon.id)}
          />
        ))}
      </div>

      {/* Active firing indicator */}
      {firingEffect && (
        <div
          style={{
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.2em",
            color: "#ff4444",
            textShadow: "0 0 8px #ff444466",
            animation: "firingPulse 0.3s ease-in-out infinite alternate",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          ● FIRING — {firingEffect.weaponId.toUpperCase()}
        </div>
      )}

      <style>{`
        @keyframes firingPulse {
          from { opacity: 1; }
          to { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
