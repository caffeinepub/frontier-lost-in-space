/**
 * WeaponGhostLayer.tsx — Subtle ghost visualization for weapon zones.
 * V22.1: COMBAT FEELS REAL LAYER
 *
 * Sits between WeaponHologramLayer and WeaponConsole.
 * pointerEvents: none ALWAYS.
 * Renders soft radial glow when intentLevel >= 1.
 * Must NOT look like a button — soft bloom only.
 */
import { useWeaponZoneStore } from "../../combat/useWeaponZoneStore";

const WEAPON_COLORS: Record<string, string> = {
  pulse: "0, 220, 255",
  rail: "80, 120, 255",
  missile: "255, 140, 30",
  emp: "180, 80, 255",
};

// Approximate positions within the console area:
// Left cluster ~22% from left — pulse (top ~30%), missile (bottom ~68%)
// Right cluster ~78% from left — rail (top ~30%), emp (bottom ~68%)
const WEAPON_POSITIONS: Record<string, { left: string; top: string }> = {
  pulse: { left: "22%", top: "30%" },
  missile: { left: "22%", top: "68%" },
  rail: { left: "78%", top: "30%" },
  emp: { left: "78%", top: "68%" },
};

interface GhostZoneProps {
  weaponId: string;
  intentLevel: number;
}

function GhostZone({ weaponId, intentLevel }: GhostZoneProps) {
  if (intentLevel <= 0) return null;

  const color = WEAPON_COLORS[weaponId] ?? "0, 200, 200";
  const pos = WEAPON_POSITIONS[weaponId] ?? { left: "50%", top: "50%" };

  const opacity = intentLevel === 1 ? 0.12 : intentLevel === 2 ? 0.28 : 0.5;
  const radius = intentLevel === 1 ? 40 : intentLevel === 2 ? 52 : 60;
  const ringOpacity = intentLevel >= 2 ? (intentLevel === 2 ? 0.3 : 0.55) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)",
        width: radius * 2,
        height: radius * 2,
        pointerEvents: "none",
      }}
    >
      {/* Soft radial bloom — must not look like a button */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${color}, ${opacity}) 0%, transparent 70%)`,
          transition: "opacity 0.15s ease",
        }}
      />
      {/* Holographic ring — only at intent >= 2 */}
      {intentLevel >= 2 && (
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            border: `1px solid rgba(${color}, ${ringOpacity})`,
            animation: "ghostPulse 1.8s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

export default function WeaponGhostLayer() {
  const intentLevels = useWeaponZoneStore((s) => s.intentLevels);
  const weaponIds = Object.keys(intentLevels);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes ghostPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.04); }
        }
      `}</style>
      {weaponIds.map((id) => (
        <GhostZone key={id} weaponId={id} intentLevel={intentLevels[id] ?? 0} />
      ))}
    </div>
  );
}
