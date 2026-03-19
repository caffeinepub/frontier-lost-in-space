import { useCombatState } from "../../combat/useCombatState";
import type { Weapon } from "../../combat/useWeapons";
import { useWeaponsStore } from "../../combat/useWeapons";

export default function WeaponButton({ weapon }: { weapon: Weapon }) {
  const fire = useWeaponsStore((s) => s.fire);
  const firingEffect = useCombatState((s) => s.firingEffect);
  const ready = weapon.status === "READY";
  const engaged = firingEffect?.weaponId === weapon.id;
  const cooldownPct = ready ? 0 : (1 - weapon.currentCooldown) * 100;

  let stateLabel = "DISABLED";
  let stateColor = "rgba(0,80,100,0.5)";
  if (engaged) {
    stateLabel = "ENGAGED";
    stateColor = weapon.color;
  } else if (ready) {
    stateLabel = "READY";
    stateColor = weapon.color;
  } else {
    stateLabel = "COOLDOWN";
    stateColor = "rgba(0,140,180,0.7)";
  }

  return (
    <button
      type="button"
      onClick={() => fire(weapon.id)}
      disabled={!ready}
      style={{
        position: "relative",
        flex: 1,
        minWidth: "72px",
        minHeight: "54px",
        padding: "6px 6px 5px",
        background: engaged
          ? "rgba(0,12,26,0.96)"
          : ready
            ? "rgba(0,8,20,0.92)"
            : "rgba(0,4,12,0.88)",
        border: `1px solid ${engaged ? weapon.color : ready ? `${weapon.color}88` : "rgba(0,60,80,0.4)"}`,
        borderRadius: 2,
        cursor: ready ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        boxShadow: engaged
          ? `0 0 18px ${weapon.glowColor}, 0 0 6px ${weapon.glowColor}`
          : ready
            ? `0 0 8px ${weapon.glowColor}88`
            : "none",
        transition: "all 0.15s ease",
        outline: "none",
        overflow: "hidden",
        pointerEvents: "auto",
        animation: engaged
          ? "engagedPulse 0.2s ease-in-out infinite alternate"
          : "none",
      }}
    >
      {/* Weapon short name */}
      <div
        style={{
          fontSize: "8px",
          fontFamily: "monospace",
          letterSpacing: "0.16em",
          color: ready ? weapon.color : "rgba(0,120,150,0.5)",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {weapon.shortLabel}
      </div>

      {/* State badge */}
      <div
        style={{
          fontSize: "8px",
          fontFamily: "monospace",
          letterSpacing: "0.16em",
          fontWeight: 700,
          color: stateColor,
          textShadow: ready || engaged ? `0 0 8px ${weapon.color}` : "none",
        }}
      >
        {stateLabel}
      </div>

      {/* Cooldown bar */}
      <div
        style={{
          width: "100%",
          height: "2px",
          background: "rgba(0,30,50,0.8)",
          borderRadius: "1px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: ready ? "100%" : `${cooldownPct}%`,
            background: ready
              ? `linear-gradient(90deg, ${weapon.color}66, ${weapon.color})`
              : "linear-gradient(90deg, rgba(0,100,140,0.5), rgba(0,150,180,0.7))",
            boxShadow: ready ? `0 0 4px ${weapon.color}` : "none",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* Cooldown time */}
      {!ready && (
        <div
          style={{
            fontSize: "7px",
            fontFamily: "monospace",
            color: "rgba(0,140,180,0.6)",
            letterSpacing: "0.08em",
          }}
        >
          {(weapon.currentCooldown * (weapon.cooldownTime / 1000)).toFixed(1)}s
        </div>
      )}

      {/* Engaged flash overlay */}
      {engaged && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${weapon.color}18, transparent)`,
            pointerEvents: "none",
            animation: "engagedGlow 0.15s ease-in-out infinite alternate",
          }}
        />
      )}
    </button>
  );
}
