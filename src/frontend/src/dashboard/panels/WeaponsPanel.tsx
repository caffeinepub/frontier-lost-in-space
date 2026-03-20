import { useWeaponsStore } from "../../combat/useWeapons";
import { useCreditsStore } from "../../credits/useCreditsStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";

const WEAPON_ICONS: Record<string, string> = {
  pulse: "\u26a1",
  railgun: "\u2192",
  missile: "\u25b2",
  emp: "\u27bf",
};

const WEAPON_DESCRIPTIONS: Record<string, string> = {
  pulse: "Rapid-fire energy bolt. Medium range, sustained damage.",
  railgun: "Precision kinetic slug. High damage, limited ammo.",
  missile: "Guided heat-seeker. Massive damage on impact.",
  emp: "Electromagnetic pulse. Disables shields and electronics.",
};

function WeaponRow({
  weapon,
  selected,
  onSelect,
}: {
  weapon: ReturnType<typeof useWeaponsStore.getState>["weapons"][0];
  selected: boolean;
  onSelect: () => void;
}) {
  const cooldownFrac =
    weapon.status === "COOLDOWN"
      ? 1 - (weapon.currentCooldown ?? 0)
      : weapon.status === "RELOADING"
        ? (weapon.reloadProgress ?? 0)
        : 1;
  const heat =
    weapon.type === "railgun" && weapon.status === "COOLDOWN"
      ? Math.round((1 - cooldownFrac) * 100)
      : 0;

  const statusColor =
    weapon.status === "READY"
      ? "rgba(0,220,180,0.9)"
      : weapon.status === "COOLDOWN"
        ? "rgba(255,160,40,0.9)"
        : "rgba(255,200,60,0.9)";

  return (
    <button
      type="button"
      onClick={onSelect}
      data-ocid={`weapons.${weapon.id}.button`}
      style={{
        width: "100%",
        background: selected ? "rgba(0,40,60,0.8)" : "rgba(0,10,20,0.6)",
        border: `1px solid ${selected ? `${weapon.color}66` : "rgba(0,100,140,0.3)"}`,
        borderRadius: 4,
        padding: "8px 10px",
        cursor: "pointer",
        fontFamily: "monospace",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        boxShadow: selected ? `0 0 10px ${weapon.color}22` : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 14, color: weapon.color }}>
          {WEAPON_ICONS[weapon.type] ?? "\u25cf"}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 9,
            letterSpacing: "0.15em",
            color: selected
              ? "rgba(255,255,255,0.95)"
              : "rgba(180,200,220,0.8)",
          }}
        >
          {weapon.name}
        </span>
        <span
          style={{
            fontSize: 8,
            letterSpacing: "0.12em",
            color: statusColor,
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}44`,
            borderRadius: 2,
            padding: "1px 5px",
          }}
        >
          {weapon.status}
        </span>
      </div>
      {/* Charge / ammo bar */}
      <div style={{ marginBottom: 3 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 7, color: "rgba(0,160,200,0.5)" }}>
            {weapon.status === "RELOADING" ? "RELOADING" : "CHARGE"}
          </span>
          {weapon.ammo !== undefined && (
            <span style={{ fontSize: 7, color: weapon.color }}>
              {weapon.ammo}/{weapon.maxAmmo} ROUNDS
            </span>
          )}
        </div>
        <div
          style={{
            height: 3,
            background: "rgba(0,0,0,0.5)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round(cooldownFrac * 100)}%`,
              background: `linear-gradient(90deg, ${weapon.color}88, ${weapon.color})`,
              borderRadius: 2,
              transition: "width 0.3s linear",
              boxShadow: `0 0 4px ${weapon.color}80`,
            }}
          />
        </div>
      </div>
      {weapon.type === "railgun" && heat > 0 && (
        <div style={{ marginBottom: 3 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <span style={{ fontSize: 7, color: "rgba(255,140,40,0.5)" }}>
              HEAT
            </span>
            <span style={{ fontSize: 7, color: "rgba(255,140,40,0.8)" }}>
              {heat}%
            </span>
          </div>
          <div
            style={{
              height: 2,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${heat}%`,
                background: "linear-gradient(90deg, #ff6600, #ffcc00)",
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      )}
      <div
        style={{ fontSize: 7, color: "rgba(0,140,180,0.4)", lineHeight: 1.4 }}
      >
        {WEAPON_DESCRIPTIONS[weapon.type]}
      </div>
    </button>
  );
}

export default function WeaponsPanel() {
  const weapons = useWeaponsStore((s) => s.weapons);
  const selectedWeaponId = useWeaponsStore((s) => s.selectedWeaponId);
  const selectWeapon = useWeaponsStore((s) => s.selectWeapon);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const credits = useCreditsStore((s) => s.balance);

  const selectedWeapon = weapons.find((w) => w.id === selectedWeaponId);

  // Weapon AI recommendation based on target
  const getRecommendation = () => {
    if (!selectedNode) return "LOCK TARGET to receive weapon recommendation";
    if (selectedNode.startsWith("SAT-"))
      return "RECOMMENDATION: PULSE CANNON or RAIL GUN for satellite targets";
    if (selectedNode.startsWith("BASE-"))
      return "RECOMMENDATION: RAIL GUN or HEAT MISSILE for base targets";
    if (selectedNode.startsWith("THREAT-"))
      return "RECOMMENDATION: EMP BURST to disable shields, then PULSE";
    return "RECOMMENDATION: PULSE CANNON — general purpose engagement";
  };

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
      {/* Armed weapon indicator */}
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
          WEAPON SYSTEMS
        </span>
        <span style={{ fontSize: 8, color: "rgba(255,200,60,0.7)" }}>
          CREDITS: {credits}cr
        </span>
      </div>

      {selectedWeapon && (
        <div
          style={{
            background: "rgba(0,30,50,0.7)",
            border: `1px solid ${selectedWeapon.color}44`,
            borderRadius: 3,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, color: selectedWeapon.color }}>
            {WEAPON_ICONS[selectedWeapon.type] ?? "\u25cf"}
          </span>
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              ARMED: {selectedWeapon.name}
            </div>
            <div
              style={{
                fontSize: 8,
                color: selectedNode
                  ? "rgba(0,220,180,0.7)"
                  : "rgba(0,160,200,0.5)",
              }}
            >
              TARGET: {selectedNode ?? "NONE"}
            </div>
          </div>
        </div>
      )}

      {/* Weapon list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {weapons.map((w) => (
          <WeaponRow
            key={w.id}
            weapon={w}
            selected={selectedWeaponId === w.id}
            onSelect={() => selectWeapon(w.id)}
          />
        ))}
      </div>

      {/* A.E.G.I.S. Recommendation */}
      <div
        style={{ borderTop: "1px solid rgba(0,150,200,0.15)", paddingTop: 8 }}
      >
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.2em",
            color: "rgba(0,140,180,0.5)",
            marginBottom: 4,
          }}
        >
          A.E.G.I.S. ADVISORY
        </div>
        <div
          style={{
            fontSize: 8,
            color: "rgba(0,200,180,0.7)",
            lineHeight: 1.5,
            borderLeft: "1px solid rgba(0,200,180,0.2)",
            paddingLeft: 8,
          }}
        >
          {getRecommendation()}
        </div>
      </div>
    </div>
  );
}
