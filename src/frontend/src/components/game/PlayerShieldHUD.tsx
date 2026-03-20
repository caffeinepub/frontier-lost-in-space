/**
 * PlayerShieldHUD — DOM overlay showing player Shield + Hull status bars.
 *
 * Positioned at top-left of the globe viewport area.
 * Flashes on damage:
 *   - Shield bar glows blue when shield absorbs a hit
 *   - Hull bar glows red when hull takes damage
 */
import { usePlayerStore } from "../../combat/usePlayerStore";

export default function PlayerShieldHUD() {
  const shield = usePlayerStore((s) => s.shield);
  const hull = usePlayerStore((s) => s.hull);
  const hitFlash = usePlayerStore((s) => s.hitFlash);
  const shieldFlash = usePlayerStore((s) => s.shieldFlash);

  const shieldPct = Math.max(0, Math.min(100, shield));
  const hullPct = Math.max(0, Math.min(100, hull));

  const shieldColor =
    shieldPct > 50 ? "#00aaff" : shieldPct > 20 ? "#ffaa00" : "#ff3300";
  const hullColor =
    hullPct > 50 ? "#00ff88" : hullPct > 20 ? "#ffaa00" : "#ff2200";

  return (
    <div
      style={{
        position: "absolute",
        top: "clamp(8px, 1.5vh, 16px)",
        left: "clamp(10px, 2.5vw, 20px)",
        zIndex: 22,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      {/* Shield bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.12em",
            color: shieldFlash ? "#ffffff" : "rgba(0,170,255,0.75)",
            textShadow: shieldFlash ? "0 0 8px #00aaff" : "none",
            transition: "color 0.1s",
          }}
        >
          SHD {Math.round(shieldPct)}%
        </div>
        <div
          style={{
            width: 64,
            height: 3,
            background: "rgba(0,10,30,0.8)",
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${
              shieldFlash ? "#00aaff" : "rgba(0,100,180,0.35)"
            }`,
            boxShadow: shieldFlash ? "0 0 6px #00aaff" : "none",
            transition: "box-shadow 0.15s",
          }}
        >
          <div
            style={{
              width: `${shieldPct}%`,
              height: "100%",
              background: shieldColor,
              boxShadow: `0 0 4px ${shieldColor}`,
              transition: "width 0.25s ease",
            }}
          />
        </div>
      </div>

      {/* Hull bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 7,
            letterSpacing: "0.12em",
            color:
              hitFlash && !shieldFlash ? "#ffffff" : "rgba(0,255,136,0.75)",
            textShadow: hitFlash && !shieldFlash ? "0 0 8px #ff3300" : "none",
            transition: "color 0.1s",
          }}
        >
          HUL {Math.round(hullPct)}%
        </div>
        <div
          style={{
            width: 64,
            height: 3,
            background: "rgba(0,10,30,0.8)",
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${
              hitFlash && !shieldFlash ? "#ff3300" : "rgba(0,80,40,0.35)"
            }`,
            boxShadow: hitFlash && !shieldFlash ? "0 0 6px #ff3300" : "none",
            transition: "box-shadow 0.15s",
          }}
        >
          <div
            style={{
              width: `${hullPct}%`,
              height: "100%",
              background: hullColor,
              boxShadow: `0 0 4px ${hullColor}`,
              transition: "width 0.25s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
