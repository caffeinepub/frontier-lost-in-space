/**
 * FireControlGrid.tsx — 3×3 HUD grid wrapping the FIRE button.
 *
 * Layout:
 *   [ SHLD ]  [ TGT  ]  [ THRT ]
 *   [ WPN  ]  [ FIRE ]  [ AMMO ]
 *   [ PROX ]  [ NAV  ]  [ HULL ]
 *
 * CEP moved to a dedicated left-side panel (CEPStatusPanel).
 * Bottom-left cell now shows PROX (enemy proximity / distance).
 *
 * STABLE SELECTOR RULES (FRONTIER mandate):
 *   All selectors return raw primitives only — no derived arrays/objects.
 *   Arrays are derived in component body.
 */

import type React from "react";
import { useEnemyStore } from "../../combat/useEnemyStore";
import { usePlayerStore } from "../../combat/usePlayerStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useNavigationModeStore } from "../../navigation/useNavigationModeStore";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FireControlGridProps {
  hasTarget: boolean;
  onFire: () => void;
  onAutoAcquireAndFire: () => void;
  selectedWeaponStatus: string;
  /** The FireButton child rendered in the center cell */
  children: React.ReactNode;
}

// ─── Data cell sub-component ───────────────────────────────────────────────────

interface DataCellProps {
  label: string;
  value: string;
  valueColor?: string;
  blink?: boolean;
}

function DataCell({ label, value, valueColor, blink }: DataCellProps) {
  return (
    <div
      style={{
        background: "rgba(0,8,16,0.7)",
        border: "1px solid rgba(0,180,200,0.12)",
        borderRadius: 3,
        padding: "3px 5px",
        minWidth: 38,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontSize: "0.45rem",
          letterSpacing: "0.15em",
          color: "rgba(0,180,200,0.4)",
          fontFamily: "monospace",
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          fontFamily: "monospace",
          color: valueColor ?? "rgba(0,220,255,0.75)",
          lineHeight: 1,
          animation: blink ? "cep-blink 1s step-start infinite" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Nav mode abbreviation ─────────────────────────────────────────────────────

type NavMode =
  | "orbitObservation"
  | "tacticalLock"
  | "approach"
  | "breakaway"
  | "cruise"
  | string;

function navAbbr(mode: NavMode): string {
  switch (mode) {
    case "orbitObservation":
      return "ORB";
    case "tacticalLock":
      return "TACT";
    case "approach":
      return "APPR";
    case "breakaway":
      return "BRK";
    case "cruise":
      return "CRS";
    default:
      return mode.slice(0, 4).toUpperCase();
  }
}

// ─── Weapon short name ────────────────────────────────────────────────────────

function weaponShort(id: string | null): string {
  if (!id) return "----";
  switch (id) {
    case "pulse":
      return "PLSE";
    case "rail":
      return "RAIL";
    case "missile":
      return "MISS";
    case "emp":
      return "EMP";
    default:
      return id.slice(0, 4).toUpperCase();
  }
}

// ─── Ammo/status display ──────────────────────────────────────────────────────

function ammoDisplay(status: string): { text: string; color: string } {
  switch (status) {
    case "COOLDOWN":
      return { text: "COOL", color: "#ffb830" };
    case "RELOADING":
      return { text: "RELD", color: "#ffb830" };
    case "EMPTY":
      return { text: "EMPT", color: "rgba(255,80,60,0.85)" };
    default:
      return { text: "RDY", color: "rgba(80,255,180,0.85)" };
  }
}

// ─── FireControlGrid ──────────────────────────────────────────────────────────

export default function FireControlGrid({
  hasTarget,
  selectedWeaponStatus,
  children,
}: FireControlGridProps) {
  // ── Stable primitive selectors (Frontier mandate) ──
  const shield = usePlayerStore((s) => s.shield);
  const hull = usePlayerStore((s) => s.hull);

  // enemies is a raw array reference — derive active count in body
  const enemies = useEnemyStore((s) => s.enemies);
  const activeEnemies = enemies.filter((e) => e.status === "active");
  const threatCount = activeEnemies.length;

  // Proximity: closest active enemy distance (0–100 scale for display)
  const closestDist = activeEnemies.reduce((min, e) => {
    const d = Math.sqrt(e.px * e.px + e.py * e.py + e.pz * e.pz);
    return d < min ? d : min;
  }, Number.POSITIVE_INFINITY);
  const proxStr =
    closestDist === Number.POSITIVE_INFINITY
      ? "----"
      : `${Math.min(99, Math.round(closestDist * 10))
          .toString()
          .padStart(2, "0")}u`;
  const proxColor =
    closestDist < 3
      ? "rgba(255,80,60,0.9)"
      : closestDist < 6
        ? "#ffb830"
        : "rgba(0,220,255,0.75)";

  const navMode = useNavigationModeStore((s) => s.currentMode);
  const selectedWeaponId = useWeaponsStore((s) => s.selectedWeaponId);

  // ── Derived display values ──
  const shieldStr = `${String(Math.round(shield)).padStart(3, "0")}%`;
  const hullStr = `${String(Math.round(hull)).padStart(3, "0")}%`;
  const threatStr = String(threatCount).padStart(2, "0");
  const navStr = navAbbr(navMode);
  const wpnStr = weaponShort(selectedWeaponId);
  const ammo = ammoDisplay(selectedWeaponStatus);

  const tgtText = hasTarget ? "LOCKD" : "NO TGT";
  const tgtColor = hasTarget ? "#ffb830" : "rgba(0,180,200,0.3)";

  const shieldColor =
    shield < 30 ? "rgba(255,80,60,0.85)" : "rgba(0,220,255,0.75)";
  const hullColor = hull < 30 ? "rgba(255,80,60,0.85)" : "rgba(0,220,255,0.75)";

  return (
    <>
      <style>{`
        @keyframes cep-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
      `}</style>
      <div
        data-ocid="console.fire_grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateRows: "auto auto auto",
          gap: 3,
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        {/* Row 0 */}
        <DataCell label="SHLD" value={shieldStr} valueColor={shieldColor} />
        <DataCell label="TGT" value={tgtText} valueColor={tgtColor} />
        <DataCell label="THRT" value={threatStr} />

        {/* Row 1 — center is FIRE button */}
        <DataCell label="WPN" value={wpnStr} />
        <div style={{ pointerEvents: "auto" }}>{children}</div>
        <DataCell label="AMMO" value={ammo.text} valueColor={ammo.color} />

        {/* Row 2 — CEP replaced by PROX (proximity to nearest threat) */}
        <DataCell label="PROX" value={proxStr} valueColor={proxColor} />
        <DataCell label="NAV" value={navStr} />
        <DataCell label="HULL" value={hullStr} valueColor={hullColor} />
      </div>
    </>
  );
}
