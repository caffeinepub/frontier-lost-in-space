import { useCombatState } from "../../combat/useCombatState";
import { useWeaponsStore } from "../../combat/useWeapons";
import type { Weapon } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
/**
 * WeaponControlDeck — compact weapon pill labels.
 * Two-tap: select then fire. Also signals tutorial on fire.
 */
import { useTutorialStore } from "../../tutorial/useTutorialStore";

function weaponIcon(type: Weapon["type"]) {
  if (type === "pulse") return "\u26a1";
  if (type === "railgun") return "\u25b6\u25b6";
  if (type === "missile") return "\ud83d\ude80";
  return "\u25ce";
}

function getStatus(w: Weapon, hasTarget: boolean): string {
  if (!hasTarget) return "NO LOCK";
  if (w.status === "RELOADING") return "RELOAD";
  if (w.status === "COOLDOWN") return "COOL";
  if (w.ammo !== undefined && w.ammo <= 0) return "EMPTY";
  return "READY";
}

function getStatusColor(status: string, weaponColor: string): string {
  if (status === "READY") return weaponColor;
  if (status === "RELOAD") return "#ffee44";
  if (status === "EMPTY") return "#ff4444";
  return "rgba(0,120,160,0.55)";
}

function AmmoBar({ weapon }: { weapon: Weapon }) {
  if (weapon.status === "RELOADING" && weapon.reloadTime) {
    return (
      <div
        style={{
          width: "100%",
          height: 2,
          background: "rgba(0,20,40,0.8)",
          borderRadius: 1,
          overflow: "hidden",
          marginTop: 1,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.round((weapon.reloadProgress ?? 0) * 100)}%`,
            background: "#ffee44",
            boxShadow: "0 0 3px #ffee44",
            transition: "width 0.1s linear",
          }}
        />
      </div>
    );
  }
  if (weapon.ammo !== undefined && weapon.maxAmmo !== undefined) {
    return (
      <div
        style={{
          display: "flex",
          gap: 1,
          marginTop: 1,
          justifyContent: "center",
        }}
      >
        {Array.from({ length: weapon.maxAmmo }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional ammo dot
            key={`dot-${i}`}
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background:
                i < (weapon.ammo ?? 0) ? weapon.color : "rgba(0,60,80,0.4)",
              boxShadow:
                i < (weapon.ammo ?? 0) ? `0 0 2px ${weapon.color}` : "none",
            }}
          />
        ))}
      </div>
    );
  }
  return null;
}

function WeaponPill({
  weapon,
  isSelected,
  hasTarget,
}: {
  weapon: Weapon;
  isSelected: boolean;
  hasTarget: boolean;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const isFiring = firingEffect?.weaponId === weapon.id;
  const selectWeapon = useWeaponsStore((s) => s.selectWeapon);
  const fire = useWeaponsStore((s) => s.fire);

  const status = getStatus(weapon, hasTarget);
  const statusColor = getStatusColor(status, weapon.color);
  const canFire = isSelected && hasTarget && weapon.status === "READY";

  const handleTap = () => {
    if (!isSelected) {
      selectWeapon(weapon.id);
    } else if (canFire) {
      fire(weapon.id);
      // Signal tutorial
      useTutorialStore.getState().setFireDetected();
    } else {
      selectWeapon(weapon.id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label={`${weapon.name} \u2014 ${status}`}
      style={{
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        padding: "5px 10px",
        background: isFiring
          ? "rgba(0,15,35,0.98)"
          : isSelected
            ? "rgba(0,10,28,0.95)"
            : "rgba(0,5,16,0.72)",
        border: `1px solid ${
          isFiring
            ? weapon.color
            : isSelected
              ? `${weapon.color}77`
              : "rgba(0,140,180,0.18)"
        }`,
        borderRadius: 4,
        cursor: "pointer",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        pointerEvents: "auto",
        minHeight: 44,
        minWidth: 64,
        boxShadow: isFiring
          ? `0 0 16px ${weapon.glowColor}, 0 0 4px ${weapon.glowColor}`
          : isSelected && canFire
            ? `0 0 8px ${weapon.color}44`
            : isSelected
              ? `0 0 4px ${weapon.color}22`
              : "none",
        transition: "all 0.12s ease",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <span
        style={{
          fontSize: 12,
          lineHeight: 1,
          opacity: isSelected ? 1 : 0.45,
          filter: isSelected ? `drop-shadow(0 0 3px ${weapon.color})` : "none",
        }}
      >
        {weaponIcon(weapon.type)}
      </span>
      <span
        style={{
          fontSize: 6,
          letterSpacing: "0.1em",
          fontWeight: 700,
          color: isSelected ? weapon.color : "rgba(0,150,190,0.5)",
          whiteSpace: "nowrap",
          lineHeight: 1,
          textShadow: isSelected ? `0 0 5px ${weapon.color}55` : "none",
        }}
      >
        {weapon.shortLabel}
      </span>
      <span
        style={{
          fontSize: 6,
          letterSpacing: "0.08em",
          fontWeight: 700,
          color: isFiring ? weapon.color : statusColor,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {isFiring ? "FIRING" : status}
      </span>
      <AmmoBar weapon={weapon} />
      {canFire && !isFiring && (
        <span
          style={{
            position: "absolute",
            top: 3,
            right: 5,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: weapon.color,
            boxShadow: `0 0 4px ${weapon.color}`,
            animation: "wpill-ready 0.9s ease-in-out infinite alternate",
          }}
        />
      )}
    </button>
  );
}

function WeaponRow({ compact }: { compact?: boolean }) {
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedWeaponId = useWeaponsStore((s) => s.selectedWeaponId);
  const firingEffect = useCombatState((s) => s.firingEffect);
  return (
    <div
      data-tutorial-target="weapon-deck"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 4 : 5,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          letterSpacing: "0.18em",
          color: selectedNode ? "rgba(0,200,255,0.7)" : "rgba(0,180,255,0.28)",
          pointerEvents: "none",
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {selectedNode
          ? `\u25b8 LOCKED \u2014 ${selectedNode} \u00b7 TAP WEAPON TO FIRE`
          : "TAP TARGET TO LOCK"}
      </div>
      <div
        style={{
          display: "flex",
          gap: compact ? 5 : 7,
          justifyContent: "center",
        }}
      >
        {weapons.map((weapon) => (
          <WeaponPill
            key={weapon.id}
            weapon={weapon}
            isSelected={selectedWeaponId === weapon.id}
            hasTarget={!!selectedNode}
          />
        ))}
      </div>
      {firingEffect && (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.18em",
            color: "#ff4444",
            animation: "wpill-firing 0.3s ease-in-out infinite alternate",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          \u25cf FIRING \u2014 {firingEffect.weaponId.toUpperCase()}
        </div>
      )}
      <style>{`
        @keyframes wpill-ready  { from { opacity: 1; } to { opacity: 0.2; } }
        @keyframes wpill-firing { from { opacity: 1; } to { opacity: 0.35; } }
      `}</style>
    </div>
  );
}

function PortraitWeaponDeck() {
  const screenFlash = useCombatState((s) => s.screenFlash);
  return (
    <div
      style={{
        background: "rgba(0,4,14,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(0,200,255,0.12)",
        padding: "7px 12px 9px",
        pointerEvents: "auto",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {screenFlash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,255,180,0.07)",
            pointerEvents: "none",
            animation: "wpill-flash 0.12s ease-out forwards",
          }}
        />
      )}
      <WeaponRow compact />
      <style>
        {"@keyframes wpill-flash { 0% { opacity: 1; } 100% { opacity: 0; } }"}
      </style>
    </div>
  );
}

/**
 * LandscapeWeaponDeck — rendered inside the right control panel as a
 * normal-flow child (no absolute positioning) so it is always visible
 * in fullscreen landscape mode.
 */
function LandscapeWeaponDeck() {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const screenFlash = useCombatState((s) => s.screenFlash);
  const shieldHit = useCombatState((s) => s.shieldHit);
  const flashColor =
    firingEffect?.type === "emp"
      ? "rgba(255,120,0,0.09)"
      : firingEffect?.type === "missile"
        ? "rgba(255,80,40,0.10)"
        : firingEffect?.type === "railgun"
          ? "rgba(80,160,255,0.11)"
          : "rgba(0,255,180,0.07)";
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        zIndex: 35,
        padding: "4px 0",
        pointerEvents: "auto",
      }}
    >
      {screenFlash && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: flashColor,
            pointerEvents: "none",
            zIndex: 36,
            animation: "wpill-flash 0.12s ease-out forwards",
          }}
        />
      )}
      {shieldHit && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,60,0,0.06)",
            pointerEvents: "none",
            zIndex: 37,
            animation: "wpill-shield 0.4s ease-out forwards",
          }}
        />
      )}
      <WeaponRow />
      <style>{`
        @keyframes wpill-flash  { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes wpill-shield { 0% { opacity: 1; } 30% { opacity: 0.5; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

export default function WeaponControlDeck({
  portrait = false,
}: { portrait?: boolean }) {
  return portrait ? <PortraitWeaponDeck /> : <LandscapeWeaponDeck />;
}
