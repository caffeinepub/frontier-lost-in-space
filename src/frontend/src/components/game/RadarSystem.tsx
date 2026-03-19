/**
 * RadarSystem — tactical radar with ship-heading-relative blip positioning.
 *
 * Blip angle is computed as:
 *   worldAngle - shipOrbitalTheta
 * so contacts always appear relative to the ship's current heading,
 * not as fixed world-space angles.
 */
import { useEffect, useRef } from "react";
import type { AsteroidThreat } from "../../combat/useThreatStore";
import { useThreatStore } from "../../combat/useThreatStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useShipStore } from "../../motion/useShipStore";

const SIZE = 110;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = SIZE / 2 - 8;

const PRIORITY_LABEL: Record<string, string> = {
  INTERCEPT_WINDOW: "T1",
  PRIORITY_TARGET: "T2",
  IMPACT_RISK: "T3",
  INCOMING: "T4",
};

const PRIORITY_COLOR: Record<string, string> = {
  INTERCEPT_WINDOW: "#ff3300",
  PRIORITY_TARGET: "#ff7700",
  IMPACT_RISK: "#ffaa00",
  INCOMING: "#00ccff",
};

function getThreatAngle(t: AsteroidThreat, shipTheta: number): number {
  // Relative bearing: world azimuth minus ship orbital theta
  return t.startAzimuth - shipTheta;
}

function getThreatRadius(t: AsteroidThreat): number {
  return MAX_R * (1 - t.progress * 0.85);
}

export default function RadarSystem() {
  const threats = useThreatStore((s) => s.threats);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const active = threats.filter(
    (t) => t.status !== "DESTROYED" && t.status !== "SURVIVED",
  );

  const sorted = [...active].sort((a, b) => {
    const order = [
      "INTERCEPT_WINDOW",
      "PRIORITY_TARGET",
      "IMPACT_RISK",
      "INCOMING",
    ];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  useEffect(() => {
    let raf: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (ts: number) => {
      const sweep = (ts * 0.001 * 0.65) % (Math.PI * 2);
      // Read ship heading each frame for heading-relative blips
      const shipTheta = useShipStore.getState().orbitalTheta;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // BG circle
      ctx.fillStyle = "rgba(0,6,16,0.88)";
      ctx.beginPath();
      ctx.arc(CX, CY, MAX_R + 6, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(0,200,255,0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(CX, CY, MAX_R + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Range rings
      for (const r of [MAX_R * 0.35, MAX_R * 0.65, MAX_R]) {
        ctx.strokeStyle = "rgba(0,180,255,0.18)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = "rgba(0,180,255,0.12)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(CX - MAX_R - 4, CY);
      ctx.lineTo(CX + MAX_R + 4, CY);
      ctx.moveTo(CX, CY - MAX_R - 4);
      ctx.lineTo(CX, CY + MAX_R + 4);
      ctx.stroke();

      // Sweep sector
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(sweep);
      const grad = ctx.createLinearGradient(0, 0, 0, -MAX_R);
      grad.addColorStop(0, "rgba(0,255,200,0.28)");
      grad.addColorStop(1, "rgba(0,255,200,0.0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, MAX_R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,255,200,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -MAX_R);
      ctx.stroke();
      ctx.restore();

      // Heading indicator (forward tick at top)
      ctx.strokeStyle = "rgba(0,255,200,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(CX, CY - MAX_R + 2);
      ctx.lineTo(CX, CY - MAX_R - 4);
      ctx.stroke();

      // Threat blips — heading-relative
      for (const t of sorted) {
        const angle = getThreatAngle(t, shipTheta) - Math.PI / 2;
        const r = getThreatRadius(t);
        const bx = CX + Math.cos(angle) * r;
        const by = CY + Math.sin(angle) * r;
        const color = PRIORITY_COLOR[t.status] ?? "#00ccff";
        const isSelected = selectedNode === t.id;
        const priority = PRIORITY_LABEL[t.status] ?? "T?";

        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 8);
        grd.addColorStop(0, `${color}cc`);
        grd.addColorStop(1, `${color}00`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSelected ? "#ffffff" : color;
        ctx.beginPath();
        ctx.arc(bx, by, isSelected ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = "bold 7px monospace";
        ctx.fillText(priority, bx + 4, by - 2);

        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(bx, by, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Center dot (Earth)
      ctx.fillStyle = "rgba(0,220,255,0.9)";
      ctx.beginPath();
      ctx.arc(CX, CY, 2, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [sorted, selectedNode]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "clamp(6%, 8vh, 10%)",
        right: "clamp(10px, 2.5vw, 30px)",
        zIndex: 22,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          letterSpacing: "0.2em",
          color: "rgba(0,180,255,0.45)",
          marginBottom: 1,
        }}
      >
        E-RADAR
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ display: "block", borderRadius: "50%" }}
      />
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          letterSpacing: "0.18em",
          color: active.length > 0 ? "#ff8800" : "rgba(0,180,255,0.4)",
          textAlign: "center",
        }}
      >
        {active.length > 0
          ? `${active.length} THREAT${active.length > 1 ? "S" : ""}`
          : "CLEAR"}
      </div>
    </div>
  );
}
