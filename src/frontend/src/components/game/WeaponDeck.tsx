import { useCombatState } from "../../combat/useCombatState";
import { useWeaponsStore } from "../../combat/useWeapons";
import type { Weapon } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";

const GLASS: React.CSSProperties = {
  background: "rgba(0, 5, 16, 0.85)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(0, 200, 255, 0.2)",
  borderRadius: 4,
  boxShadow: "0 0 24px rgba(0,180,255,0.1), inset 0 1px 0 rgba(0,200,255,0.1)",
};

function WeaponSelectButton({
  weapon,
  isSelected,
  onSelect,
}: {
  weapon: Weapon;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const engaged = firingEffect?.weaponId === weapon.id;
  const ready = weapon.status === "READY";
  const cooldownPct = ready ? 0 : (1 - weapon.currentCooldown) * 100;

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        position: "relative",
        flex: 1,
        minWidth: 80,
        padding: "7px 8px 6px",
        background: isSelected ? "rgba(0,10,28,0.98)" : "rgba(0,5,16,0.88)",
        border: `1px solid ${
          engaged
            ? weapon.color
            : isSelected
              ? `${weapon.color}99`
              : ready
                ? `${weapon.color}44`
                : "rgba(0,40,60,0.4)"
        }`,
        borderRadius: 3,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        boxShadow: isSelected
          ? `0 0 14px ${weapon.glowColor}, 0 0 4px ${weapon.glowColor}`
          : engaged
            ? `0 0 20px ${weapon.glowColor}`
            : "none",
        transition: "all 0.15s ease",
        outline: "none",
        overflow: "hidden",
        pointerEvents: "auto",
        transform: isSelected ? "scale(0.97)" : "scale(1)",
        animation: engaged
          ? "wpnEngaged 0.2s ease-in-out infinite alternate"
          : "none",
      }}
    >
      <div
        style={{
          fontSize: 7,
          fontFamily: "monospace",
          letterSpacing: "0.14em",
          color: ready || isSelected ? weapon.color : "rgba(0,100,130,0.5)",
          fontWeight: 700,
          whiteSpace: "nowrap",
          textShadow: isSelected ? `0 0 8px ${weapon.color}88` : "none",
        }}
      >
        {weapon.shortLabel}
      </div>

      <div
        style={{
          fontSize: 7,
          fontFamily: "monospace",
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: engaged
            ? weapon.color
            : ready
              ? isSelected
                ? weapon.color
                : `${weapon.color}99`
              : "rgba(0,100,150,0.6)",
        }}
      >
        {engaged ? "ENGAGED" : ready ? "READY" : "COOLDOWN"}
      </div>

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
            width: ready ? "100%" : `${cooldownPct}%`,
            background: ready
              ? `linear-gradient(90deg, ${weapon.color}66, ${weapon.color})`
              : "linear-gradient(90deg, rgba(0,80,120,0.5), rgba(0,120,160,0.7))",
            boxShadow: ready ? `0 0 4px ${weapon.color}` : "none",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {isSelected && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${weapon.color}10, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );
}

interface WeaponDeckProps {
  /** Portrait mode: render only screen flash overlays, not the full weapon UI */
  portraitFlashOnly?: boolean;
}

export default function WeaponDeck({
  portraitFlashOnly = false,
}: WeaponDeckProps) {
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedWeaponId = useWeaponsStore((s) => s.selectedWeaponId);
  const selectWeapon = useWeaponsStore((s) => s.selectWeapon);
  const fireSelected = useWeaponsStore((s) => s.fireSelected);
  const screenFlash = useCombatState((s) => s.screenFlash);
  const firingEffect = useCombatState((s) => s.firingEffect);
  const empStunnedNode = useCombatState((s) => s.empStunnedNode);
  const shieldHit = useCombatState((s) => s.shieldHit);

  const visible = !!selectedNode;
  const selectedWeapon = weapons.find((w) => w.id === selectedWeaponId);
  const canFire = !!selectedNode && selectedWeapon?.status === "READY";

  const flashColor =
    firingEffect?.type === "emp"
      ? "rgba(255,120,0,0.10)"
      : firingEffect?.type === "railgun"
        ? "rgba(80,160,255,0.12)"
        : "rgba(0,255,180,0.08)";

  // In portrait mode, only render the flash overlay divs (they are full-screen and z-independent)
  const flashOverlays = (
    <>
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
    </>
  );

  if (portraitFlashOnly) {
    return (
      <>
        {flashOverlays}
        <style>{`
          @keyframes weaponFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes empFlicker { 0%,100%{opacity:1}10%{opacity:0.3}20%{opacity:0.9}30%{opacity:0.2}40%{opacity:0.8}60%{opacity:0.5}80%{opacity:0.2} }
          @keyframes shieldFlash { 0%{opacity:1}30%{opacity:0.6}100%{opacity:0} }
        `}</style>
      </>
    );
  }

  return (
    <>
      {flashOverlays}

      {/* No-target hint */}
      {!visible && (
        <div
          style={{
            position: "absolute",
            bottom: "clamp(5%, 7vh, 9%)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 35,
            pointerEvents: "none",
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.22em",
            color: "rgba(0,180,255,0.28)",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          CLICK GLOBE TO ACQUIRE TARGET
        </div>
      )}

      {/* WEAPON DECK */}
      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: "clamp(4%, 6vh, 8%)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 35,
            pointerEvents: "auto",
          }}
        >
          <div style={{ ...GLASS, padding: "10px 14px 12px" }}>
            <div
              style={{
                textAlign: "center",
                marginBottom: 8,
                fontFamily: "monospace",
                fontSize: 8,
                letterSpacing: "0.2em",
                color: empStunnedNode ? "#ff8800" : "rgba(0,200,255,0.7)",
                textShadow: empStunnedNode
                  ? "0 0 8px #ff880088"
                  : "0 0 6px rgba(0,200,255,0.3)",
              }}
            >
              {empStunnedNode
                ? `▸ ${selectedNode} — EMP STUNNED`
                : `▸ TARGET LOCKED — ${selectedNode}`}
            </div>

            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              {weapons.map((weapon) => (
                <WeaponSelectButton
                  key={weapon.id}
                  weapon={weapon}
                  isSelected={selectedWeaponId === weapon.id}
                  onSelect={() => selectWeapon(weapon.id)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={fireSelected}
              disabled={!canFire}
              style={{
                width: "100%",
                padding: "9px 20px",
                fontFamily: "monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.28em",
                color: canFire ? "#fff" : "rgba(80,40,40,0.6)",
                background: canFire
                  ? "linear-gradient(180deg, rgba(160,0,0,0.9) 0%, rgba(100,0,0,0.95) 100%)"
                  : "rgba(30,5,5,0.8)",
                border: `1px solid ${
                  canFire ? "rgba(255,60,60,0.8)" : "rgba(80,20,20,0.4)"
                }`,
                borderRadius: 3,
                cursor: canFire ? "pointer" : "not-allowed",
                boxShadow: canFire
                  ? "0 0 20px rgba(220,0,0,0.5), 0 0 8px rgba(255,60,60,0.4), inset 0 1px 0 rgba(255,80,80,0.2)"
                  : "none",
                transition: "all 0.15s ease",
                outline: "none",
                animation: canFire
                  ? "launchReady 1.5s ease-in-out infinite"
                  : "none",
                pointerEvents: "auto",
              }}
            >
              ⚡ LAUNCH
            </button>

            <div
              style={{
                marginTop: 8,
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(0,200,255,0.3), rgba(0,200,255,0.3), transparent)",
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes weaponFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes empFlicker { 0%,100%{opacity:1}10%{opacity:0.3}20%{opacity:0.9}30%{opacity:0.2}40%{opacity:0.8}60%{opacity:0.5}80%{opacity:0.2} }
        @keyframes shieldFlash { 0%{opacity:1}30%{opacity:0.6}100%{opacity:0} }
        @keyframes wpnEngaged { from{box-shadow:0 0 16px var(--wc,#00ffcc)}to{box-shadow:0 0 4px var(--wc,#00ffcc)} }
        @keyframes launchReady {
          0%, 100% { box-shadow: 0 0 20px rgba(220,0,0,0.5), 0 0 8px rgba(255,60,60,0.4), inset 0 1px 0 rgba(255,80,80,0.2); }
          50% { box-shadow: 0 0 32px rgba(255,0,0,0.7), 0 0 14px rgba(255,80,80,0.6), inset 0 1px 0 rgba(255,120,120,0.3); }
        }
      `}</style>
    </>
  );
}
