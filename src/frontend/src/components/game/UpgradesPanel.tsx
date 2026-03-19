/**
 * UpgradesPanel — real credits integration, functional install/uninstall
 */
import { useState } from "react";
import { useCreditsStore } from "../../credits/useCreditsStore";
import { useStoryStore } from "../../story/useStoryStore";
import { useTacticalLogStore } from "../../tacticalLog/useTacticalLogStore";

type Tier = 1 | 2 | 3;

interface UpgradeDef {
  id: string;
  name: string;
  tier: Tier;
  cost: number;
  statChange: string;
  description: string;
  effects: { oxygen?: number; hull?: number; power?: number };
  iconCol: number;
  iconRow: number;
}

const UPGRADES: UpgradeDef[] = [
  {
    id: "shield-gen",
    name: "SHIELD GENERATOR",
    tier: 2,
    cost: 800,
    statChange: "+15% SHIELD REGEN",
    description: "Enhances regeneration rate of energy shields.",
    effects: { hull: 10 },
    iconCol: 0,
    iconRow: 0,
  },
  {
    id: "engine-boost",
    name: "ENGINE BOOST",
    tier: 1,
    cost: 600,
    statChange: "+20% DRIVE SPEED",
    description: "Overclocked drive system for rapid repositioning.",
    effects: { power: 5 },
    iconCol: 1,
    iconRow: 0,
  },
  {
    id: "targeting",
    name: "TARGETING ARRAY",
    tier: 2,
    cost: 1000,
    statChange: "+30% LOCK SPEED",
    description: "Advanced multi-target acquisition system.",
    effects: {},
    iconCol: 2,
    iconRow: 0,
  },
  {
    id: "armor",
    name: "ARMOR PLATING",
    tier: 1,
    cost: 600,
    statChange: "+25% HULL RESIST",
    description: "Reinforced composite hull panels.",
    effects: { hull: 8 },
    iconCol: 0,
    iconRow: 1,
  },
  {
    id: "quantum-reactor",
    name: "QUANTUM REACTOR",
    tier: 3,
    cost: 1800,
    statChange: "+40% POWER OUTPUT",
    description: "Quantum-threaded power core for maximum yield.",
    effects: { power: 15 },
    iconCol: 1,
    iconRow: 1,
  },
  {
    id: "stealth",
    name: "STEALTH MODULE",
    tier: 3,
    cost: 2200,
    statChange: "-60% RADAR SIG",
    description: "Low-emission hull coating for reduced detection.",
    effects: {},
    iconCol: 2,
    iconRow: 1,
  },
];

const TIER_COLORS: Record<Tier, string> = {
  1: "#00ff80",
  2: "#00c8ff",
  3: "#ff9900",
};

export default function UpgradesPanel() {
  const balance = useCreditsStore((s) => s.balance);
  const spend = useCreditsStore((s) => s.spendCredits);
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(["engine-boost", "armor"]),
  );

  const handleInstall = (upgrade: UpgradeDef) => {
    if (installed.has(upgrade.id)) {
      // Uninstall — no refund
      setInstalled((prev) => {
        const next = new Set(prev);
        next.delete(upgrade.id);
        return next;
      });
      useTacticalLogStore.getState().addEntry({
        type: "system",
        message: `MODULE UNINSTALLED: ${upgrade.name}`,
      });
      return;
    }
    // Install — deduct credits and apply effects
    const ok = spend(upgrade.cost);
    if (!ok) return;

    setInstalled((prev) => new Set([...prev, upgrade.id]));

    // Apply system effects
    const fx = upgrade.effects;
    if (Object.keys(fx).length > 0) {
      const story = useStoryStore.getState();
      useStoryStore.setState({
        oxygenLevel: Math.max(
          0,
          Math.min(100, story.oxygenLevel + (fx.oxygen ?? 0)),
        ),
        hullIntegrity: Math.max(
          0,
          Math.min(100, story.hullIntegrity + (fx.hull ?? 0)),
        ),
        powerLevel: Math.max(
          0,
          Math.min(100, story.powerLevel + (fx.power ?? 0)),
        ),
      });
    }

    useTacticalLogStore.getState().addEntry({
      type: "system",
      message: `MODULE INSTALLED: ${upgrade.name} — ${upgrade.statChange}`,
    });
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as unknown as undefined,
      }}
    >
      {/* Header with real balance */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(0,200,255,0.1)",
          paddingBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.18em",
            color: "rgba(0,200,255,0.7)",
            fontWeight: 700,
          }}
        >
          UPGRADES &amp; MODULES
        </span>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            fontWeight: 700,
            color: "#ffee66",
            letterSpacing: "0.12em",
          }}
        >
          ◈ {balance.toLocaleString()} CR
        </div>
      </div>

      {/* Cards */}
      {UPGRADES.map((upgrade) => {
        const isInstalled = installed.has(upgrade.id);
        const canAfford = balance >= upgrade.cost;
        const tierColor = TIER_COLORS[upgrade.tier];
        const bgX = upgrade.iconCol * 100;
        const bgY = upgrade.iconRow * 100;

        return (
          <div
            key={upgrade.id}
            style={{
              background: isInstalled
                ? "rgba(0,30,20,0.6)"
                : "rgba(0,8,22,0.8)",
              border: `1px solid ${
                isInstalled ? "rgba(0,255,128,0.25)" : "rgba(0,200,255,0.15)"
              }`,
              borderRadius: 6,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  backgroundImage:
                    "url('/assets/generated/upgrade-icons-sheet.dim_480x320.png')",
                  backgroundSize: "300% 200%",
                  backgroundPosition: `${bgX}% ${bgY}%`,
                  backgroundRepeat: "no-repeat",
                  flexShrink: 0,
                  borderRadius: 3,
                  border: `1px solid ${tierColor}22`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "rgba(0,220,255,0.9)",
                    }}
                  >
                    {upgrade.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 7,
                      fontWeight: 700,
                      color: tierColor,
                      background: `${tierColor}18`,
                      border: `1px solid ${tierColor}44`,
                      borderRadius: 2,
                      padding: "1px 4px",
                      flexShrink: 0,
                    }}
                  >
                    T{upgrade.tier}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    color: "#00ff80",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  {upgrade.statChange}
                </span>
              </div>
            </div>

            {/* Description */}
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                color: "rgba(0,180,220,0.45)",
                letterSpacing: "0.06em",
                lineHeight: 1.4,
              }}
            >
              {upgrade.description}
            </div>

            {/* Bottom row: cost + action */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: canAfford
                    ? "rgba(0,200,255,0.6)"
                    : "rgba(255,80,60,0.6)",
                  letterSpacing: "0.1em",
                }}
              >
                {upgrade.cost.toLocaleString()} CR
              </div>

              <button
                type="button"
                data-ocid="upgrades.button"
                onClick={() => handleInstall(upgrade)}
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  padding: "5px 12px",
                  minHeight: 32,
                  borderRadius: 3,
                  border: `1px solid ${
                    isInstalled
                      ? "rgba(0,255,128,0.4)"
                      : canAfford
                        ? "rgba(0,200,255,0.4)"
                        : "rgba(255,60,40,0.3)"
                  }`,
                  background: isInstalled
                    ? "rgba(0,40,20,0.8)"
                    : canAfford
                      ? "rgba(0,20,50,0.8)"
                      : "rgba(20,5,5,0.7)",
                  color: isInstalled
                    ? "#00ff80"
                    : canAfford
                      ? "#00c8ff"
                      : "rgba(255,80,60,0.6)",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                  outline: "none",
                }}
              >
                {isInstalled
                  ? "✓ UNINSTALL"
                  : canAfford
                    ? "INSTALL"
                    : "NEED CR"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
