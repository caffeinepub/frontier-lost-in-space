import { useState } from "react";
import { usePlayerStore } from "../../combat/usePlayerStore";
import { useCreditsStore } from "../../credits/useCreditsStore";
import { useMissionsStore } from "../../missions/useMissionsStore";
import { useShipSystemsStore } from "../../systems/useShipSystemsStore";
import { usePersistenceStore } from "../../utils/usePersistenceStore";

const STATUS_COLOR: Record<string, string> = {
  nominal: "rgba(0,220,180,0.8)",
  degrading: "rgba(255,200,60,0.8)",
  warning: "rgba(255,140,40,0.9)",
  critical: "rgba(255,60,60,0.95)",
};

const REPAIR_COST = 75;

function SubsystemRow({
  sys,
  onRepair,
}: {
  sys: ReturnType<typeof useShipSystemsStore.getState>["subsystems"][0];
  onRepair: (id: string) => void;
}) {
  const color = STATUS_COLOR[sys.status] ?? "rgba(0,200,255,0.7)";
  const barColor =
    sys.health > 70
      ? "rgba(0,200,180,0.8)"
      : sys.health > 40
        ? "rgba(255,180,40,0.8)"
        : "rgba(255,60,60,0.8)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 0",
        borderBottom: "1px solid rgba(0,100,140,0.1)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              letterSpacing: "0.08em",
              color: "rgba(180,200,220,0.7)",
            }}
          >
            {sys.name}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 8, color }}>
            {sys.status.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              flex: 1,
              height: 3,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(sys.health)}%`,
                background: barColor,
                borderRadius: 2,
                transition: "width 0.5s",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 8,
              color: barColor,
              width: 28,
              textAlign: "right",
            }}
          >
            {Math.round(sys.health)}%
          </span>
        </div>
      </div>
      {(sys.status === "warning" || sys.status === "critical") && (
        <button
          type="button"
          onClick={() => onRepair(sys.id)}
          data-ocid={`ship.${sys.id}.repair_button`}
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.1em",
            color: "rgba(255,200,60,0.9)",
            background: "rgba(40,30,0,0.6)",
            border: "1px solid rgba(255,200,60,0.3)",
            borderRadius: 2,
            padding: "2px 6px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          FIX {REPAIR_COST}cr
        </button>
      )}
    </div>
  );
}

export default function EngineeringPanel() {
  const shield = usePlayerStore((s) => s.shield);
  const hull = usePlayerStore((s) => s.hull);
  const subsystems = useShipSystemsStore((s) => s.subsystems);
  const repairSys = useShipSystemsStore((s) => s.repair);
  const credits = useCreditsStore((s) => s.balance);
  const spendCredits = useCreditsStore((s) => s.spendCredits);
  const avgHealth = useShipSystemsStore((s) => s.getAverageHealth());
  const [ownedParts] = useState(() => usePersistenceStore.loadOwnedParts());
  const [installedUpgrades] = useState(() =>
    usePersistenceStore.loadInstalledUpgrades(),
  );

  const handleRepair = (id: string) => {
    if (spendCredits(REPAIR_COST)) {
      repairSys(id);
      import("../../missions/useMissionsStore").then(({ useMissionsStore }) => {
        useMissionsStore.getState().incrementStat("repairsCompleted");
        useMissionsStore.getState().addLogEntry({
          type: "repair",
          message: `SYSTEM REPAIRED: ${id.replace(/_/g, " ").toUpperCase()}`,
        });
      });
    }
  };

  const shieldBarColor =
    shield > 60
      ? "rgba(0,180,255,0.8)"
      : shield > 30
        ? "rgba(255,180,40,0.8)"
        : "rgba(255,60,60,0.8)";
  const hullBarColor =
    hull > 60
      ? "rgba(0,220,180,0.8)"
      : hull > 30
        ? "rgba(255,180,40,0.8)"
        : "rgba(255,60,60,0.8)";

  const combatItems = [
    { label: "SHIELDS", value: shield, color: shieldBarColor },
    { label: "HULL", value: hull, color: hullBarColor },
  ];

  return (
    <div
      style={{
        padding: "12px 10px",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 8,
            letterSpacing: "0.25em",
            color: "rgba(0,160,200,0.5)",
          }}
        >
          SHIP SYSTEMS
        </span>
        <span
          style={{
            fontSize: 8,
            color:
              avgHealth > 70 ? "rgba(0,220,180,0.7)" : "rgba(255,180,40,0.7)",
          }}
        >
          AVG HEALTH: {avgHealth}%
        </span>
      </div>

      {/* Combat integrity */}
      <div
        style={{
          background: "rgba(0,15,30,0.6)",
          borderRadius: 4,
          padding: "8px 10px",
          border: "1px solid rgba(0,100,140,0.2)",
        }}
      >
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.2em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 6,
          }}
        >
          COMBAT INTEGRITY
        </div>
        {combatItems.map((item) => (
          <div key={item.label} style={{ marginBottom: 5 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: "0.1em",
                  color: "rgba(0,160,200,0.6)",
                }}
              >
                {item.label}
              </span>
              <span style={{ fontSize: 8, color: item.color }}>
                {Math.round(item.value)}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(0,0,0,0.5)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${item.value}%`,
                  background: item.color,
                  borderRadius: 2,
                  transition: "width 0.5s",
                  boxShadow: `0 0 4px ${item.color}80`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Credits */}
      <div
        style={{
          fontSize: 8,
          color: "rgba(255,200,60,0.7)",
          textAlign: "right",
        }}
      >
        CREDITS: {credits}cr
      </div>

      {/* Subsystems */}
      <div>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.2em",
            color: "rgba(0,160,200,0.5)",
            marginBottom: 6,
          }}
        >
          SUBSYSTEM STATUS
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {subsystems.map((sys) => (
            <SubsystemRow key={sys.id} sys={sys} onRepair={handleRepair} />
          ))}
        </div>
      </div>

      {/* Upgrades */}
      {installedUpgrades.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 8,
              letterSpacing: "0.2em",
              color: "rgba(0,160,200,0.5)",
              marginBottom: 4,
            }}
          >
            INSTALLED UPGRADES
          </div>
          {installedUpgrades.map((u) => (
            <div
              key={u}
              style={{
                fontSize: 8,
                color: "rgba(0,200,180,0.7)",
                marginBottom: 3,
                paddingLeft: 8,
                borderLeft: "1px solid rgba(0,200,180,0.2)",
              }}
            >
              ✓ {u}
            </div>
          ))}
        </div>
      )}

      {/* Parts */}
      <div
        style={{ borderTop: "1px solid rgba(0,100,140,0.15)", paddingTop: 8 }}
      >
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.15em",
            color: "rgba(0,140,180,0.4)",
          }}
        >
          SPARE PARTS: {ownedParts.length > 0 ? ownedParts.length : "0 units"}
        </div>
      </div>
    </div>
  );
}
