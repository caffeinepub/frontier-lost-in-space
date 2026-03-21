import { useSpacePhysicsStore } from "../../physics/useSpacePhysicsStore";

/**
 * PHYSICS ENGINE debug overlay.
 * Activate via: localStorage.setItem('debug_physics', '1')
 * Positioned bottom-left, above VelocityPanel (bottom: 120px).
 */
export default function SpacePhysicsDebug() {
  const active =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("debug_physics") === "1";

  const velocitySnapshot = useSpacePhysicsStore((s) => s.velocitySnapshot);
  const gravityVector = useSpacePhysicsStore((s) => s.gravityVector);
  const projectileCount = useSpacePhysicsStore((s) => s.projectileCount);
  const isActive = useSpacePhysicsStore((s) => s.isActive);

  if (!active) return null;

  const speed = Math.sqrt(
    velocitySnapshot.x ** 2 + velocitySnapshot.y ** 2 + velocitySnapshot.z ** 2,
  );

  const fmt = (v: number) => v.toFixed(3).padStart(8);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 120,
        left: 8,
        zIndex: 8000,
        pointerEvents: "none",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 10,
        lineHeight: 1.6,
        letterSpacing: "0.06em",
        background: "rgba(0,6,14,0.82)",
        border: "1px solid rgba(0,180,220,0.18)",
        borderRadius: 4,
        padding: "7px 10px",
        minWidth: 190,
        color: "rgba(0,220,180,0.85)",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          color: "rgba(0,180,220,0.55)",
          letterSpacing: "0.2em",
          fontSize: 9,
          marginBottom: 4,
          borderBottom: "1px solid rgba(0,160,200,0.15)",
          paddingBottom: 3,
        }}
      >
        ▸ PHYSICS ENGINE
      </div>

      {/* Velocity */}
      <Row label="VEL X" value={fmt(velocitySnapshot.x)} />
      <Row label="VEL Y" value={fmt(velocitySnapshot.y)} />
      <Row label="VEL Z" value={fmt(velocitySnapshot.z)} />
      <Row label="SPEED" value={fmt(speed)} highlight={speed > 2.3} />

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid rgba(0,160,200,0.12)",
          margin: "4px 0",
        }}
      />

      {/* Gravity */}
      <Row label="GRAV X" value={fmt(gravityVector.x)} dim />
      <Row label="GRAV Y" value={fmt(gravityVector.y)} dim />
      <Row label="GRAV Z" value={fmt(gravityVector.z)} dim />

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid rgba(0,160,200,0.12)",
          margin: "4px 0",
        }}
      />

      {/* Projectiles & status */}
      <Row label="PROJ" value={String(projectileCount).padStart(8)} />
      <div
        style={{
          marginTop: 3,
          fontSize: 9,
          letterSpacing: "0.18em",
          color: isActive ? "rgba(0,255,160,0.7)" : "rgba(180,180,100,0.55)",
        }}
      >
        STATUS: {isActive ? "ACTIVE" : "IDLE"}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  dim,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        color: highlight
          ? "rgba(255,180,0,0.9)"
          : dim
            ? "rgba(0,160,140,0.55)"
            : "rgba(0,220,180,0.85)",
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
