import { useState } from "react";

interface MarketItem {
  id: string;
  name: string;
  type: "ammo" | "module" | "repair";
  stock: number;
  price: number;
  unit: string;
  description: string;
}

const MARKET_ITEMS: MarketItem[] = [
  {
    id: "pulse-ammo",
    name: "PULSE AMMO PACK",
    type: "ammo",
    stock: 12,
    price: 200,
    unit: "x50 rounds",
    description: "Standard pulse cannon energy cells.",
  },
  {
    id: "rail-slug",
    name: "RAIL SLUG PACK",
    type: "ammo",
    stock: 5,
    price: 500,
    unit: "x10 slugs",
    description: "High-density ferromagnetic projectiles.",
  },
  {
    id: "emp-cartridge",
    name: "EMP CARTRIDGE",
    type: "ammo",
    stock: 8,
    price: 350,
    unit: "x5 charges",
    description: "Electromagnetic pulse burst charges.",
  },
  {
    id: "shield-cell",
    name: "SHIELD CELL",
    type: "module",
    stock: 3,
    price: 800,
    unit: "unit",
    description: "Emergency shield recharge module.",
  },
  {
    id: "repair-kit",
    name: "HULL REPAIR KIT",
    type: "repair",
    stock: 2,
    price: 1200,
    unit: "kit",
    description: "Field-deployable hull patch system.",
  },
  {
    id: "sensor-boost",
    name: "SENSOR BOOST",
    type: "module",
    stock: 4,
    price: 650,
    unit: "unit",
    description: "Temporary radar range enhancement.",
  },
];

const TYPE_COLOR: Record<string, string> = {
  ammo: "#00c8ff",
  module: "#ff9900",
  repair: "#00ff80",
};

export default function MarketPanel() {
  const [credits, setCredits] = useState(4200);
  const [purchased, setPurchased] = useState<Record<string, boolean>>({});

  const handleBuy = (item: MarketItem) => {
    if (credits < item.price) return;
    setCredits((c) => c - item.price);
    setPurchased((p) => ({ ...p, [item.id]: true }));
    setTimeout(
      () =>
        setPurchased((p) => {
          const n = { ...p };
          delete n[item.id];
          return n;
        }),
      1500,
    );
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
      {/* Header */}
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
          MARKET
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            color: "#00c8ff",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textShadow: "0 0 6px #00c8ff66",
          }}
        >
          ◈ {credits.toLocaleString()} CR
        </span>
      </div>

      {/* Market rows */}
      {MARKET_ITEMS.map((item) => {
        const typeColor = TYPE_COLOR[item.type] ?? "#00c8ff";
        const lowStock = item.stock <= 2;
        const canAfford = credits >= item.price;
        const justBought = purchased[item.id];

        return (
          <div
            key={item.id}
            style={{
              background: "rgba(0,8,22,0.8)",
              border: "1px solid rgba(0,200,255,0.12)",
              borderLeft: `3px solid ${typeColor}66`,
              borderRadius: 4,
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {/* Top row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "rgba(0,220,255,0.9)",
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 7,
                    color: "rgba(0,180,255,0.45)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {item.unit}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {lowStock && (
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 7,
                      color: "#ff3030",
                      background: "rgba(255,0,0,0.1)",
                      border: "1px solid rgba(255,0,0,0.3)",
                      borderRadius: 2,
                      padding: "1px 4px",
                      letterSpacing: "0.1em",
                    }}
                  >
                    LOW
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 7,
                    color: "rgba(0,180,255,0.5)",
                    letterSpacing: "0.1em",
                  }}
                >
                  STK: {item.stock}
                </span>
              </div>
            </div>

            {/* Bottom row: description + price + buy */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 7,
                  color: "rgba(0,160,200,0.4)",
                  letterSpacing: "0.05em",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {item.description}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    color: canAfford ? typeColor : "rgba(100,100,100,0.6)",
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                  }}
                >
                  ◈ {item.price}
                </span>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    padding: "5px 12px",
                    minHeight: 36,
                    minWidth: 48,
                    borderRadius: 3,
                    border: `1px solid ${
                      justBought
                        ? "rgba(0,255,128,0.5)"
                        : canAfford
                          ? "rgba(0,200,255,0.4)"
                          : "rgba(0,60,80,0.4)"
                    }`,
                    background: justBought
                      ? "rgba(0,40,20,0.8)"
                      : canAfford
                        ? "rgba(0,20,50,0.8)"
                        : "rgba(0,5,15,0.7)",
                    color: justBought
                      ? "#00ff80"
                      : canAfford
                        ? "#00c8ff"
                        : "rgba(0,100,120,0.5)",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    WebkitTapHighlightColor: "transparent",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {justBought ? "✓" : "BUY"}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Refill hint */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          color: "rgba(0,160,200,0.3)",
          letterSpacing: "0.1em",
          textAlign: "center",
          paddingTop: 4,
        }}
      >
        MARKET REFRESHES AT NEXT SECTOR JUMP
      </div>
    </div>
  );
}
