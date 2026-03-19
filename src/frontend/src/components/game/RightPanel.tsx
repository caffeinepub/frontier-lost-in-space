import { useEffect, useRef } from "react";
import type { AsteroidThreat } from "../../combat/useThreatStore";
import { useThreatStore } from "../../combat/useThreatStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";

const GLASS: React.CSSProperties = {
  background: "rgba(0, 8, 22, 0.72)",
  border: "1px solid rgba(0, 200, 255, 0.25)",
  backdropFilter: "blur(10px)",
  borderRadius: 3,
  boxShadow:
    "0 0 18px rgba(0,180,255,0.08), inset 0 1px 0 rgba(0,200,255,0.12)",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: 8,
        letterSpacing: "0.28em",
        color: "rgba(0,200,255,0.5)",
        paddingBottom: 4,
        marginBottom: 3,
        borderBottom: "1px solid rgba(0,200,255,0.15)",
      }}
    >
      {title}
    </div>
  );
}

const SIZE = 96;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = SIZE / 2 - 6;

const PRIORITY_COLOR: Record<string, string> = {
  INTERCEPT_WINDOW: "#ff3300",
  PRIORITY_TARGET: "#ff7700",
  IMPACT_RISK: "#ffaa00",
  INCOMING: "#00ccff",
};

function getThreatAngle(t: AsteroidThreat): number {
  return t.startAzimuth;
}
function getThreatRadius(t: AsteroidThreat): number {
  return MAX_R * (1 - t.progress * 0.85);
}

function MiniRadar() {
  const threats = useThreatStore((s) => s.threats);
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const active = threats.filter(
    (t) => t.status !== "DESTROYED" && t.status !== "SURVIVED",
  );

  useEffect(() => {
    let raf: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (ts: number) => {
      const sweep = (ts * 0.001 * 0.65) % (Math.PI * 2);
      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.fillStyle = "rgba(0,6,16,0.9)";
      ctx.beginPath();
      ctx.arc(CX, CY, MAX_R + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(0,200,255,0.5)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(CX, CY, MAX_R + 4, 0, Math.PI * 2);
      ctx.stroke();

      for (const r of [MAX_R * 0.35, MAX_R * 0.65, MAX_R]) {
        ctx.strokeStyle = "rgba(0,180,255,0.15)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(0,180,255,0.1)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(CX - MAX_R, CY);
      ctx.lineTo(CX + MAX_R, CY);
      ctx.moveTo(CX, CY - MAX_R);
      ctx.lineTo(CX, CY + MAX_R);
      ctx.stroke();

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(sweep);
      const grad = ctx.createLinearGradient(0, 0, 0, -MAX_R);
      grad.addColorStop(0, "rgba(0,255,200,0.3)");
      grad.addColorStop(1, "rgba(0,255,200,0.0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, MAX_R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,255,200,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -MAX_R);
      ctx.stroke();
      ctx.restore();

      for (const t of active) {
        const angle = getThreatAngle(t) - Math.PI / 2;
        const r = getThreatRadius(t);
        const bx = CX + Math.cos(angle) * r;
        const by = CY + Math.sin(angle) * r;
        const color = PRIORITY_COLOR[t.status] ?? "#00ccff";
        const isSelected = selectedNode === t.id;

        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 7);
        grd.addColorStop(0, `${color}cc`);
        grd.addColorStop(1, `${color}00`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSelected ? "#ffffff" : color;
        ctx.beginPath();
        ctx.arc(bx, by, isSelected ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(bx, by, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(0,220,255,0.9)";
      ctx.beginPath();
      ctx.arc(CX, CY, 2, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, selectedNode]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      style={{ display: "block", borderRadius: "50%", margin: "0 auto" }}
    />
  );
}

const STATUS_COLOR: Record<string, string> = {
  INTERCEPT_WINDOW: "#ff3300",
  PRIORITY_TARGET: "#ff7700",
  IMPACT_RISK: "#ffaa00",
  INCOMING: "#00ccff",
};

const STATUS_LABEL: Record<string, string> = {
  INTERCEPT_WINDOW: "INTERCEPT",
  PRIORITY_TARGET: "PRIORITY",
  IMPACT_RISK: "IMPACT RISK",
  INCOMING: "INCOMING",
};

export default function RightPanel() {
  const threats = useThreatStore((s) => s.threats);
  const eventLog = useTacticalStore((s) => s.eventLog);

  const active = threats
    .filter((t) => t.status !== "DESTROYED" && t.status !== "SURVIVED")
    .sort((a, b) => {
      const order = [
        "INTERCEPT_WINDOW",
        "PRIORITY_TARGET",
        "IMPACT_RISK",
        "INCOMING",
      ];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });

  return (
    <div
      style={{
        position: "absolute",
        right: "clamp(6px, 1.5vw, 20px)",
        top: "18%",
        width: "clamp(140px, 14vw, 180px)",
        zIndex: 30,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* RADAR */}
      <div style={{ ...GLASS, padding: "10px 12px" }}>
        <SectionHeader title="RADAR" />
        <MiniRadar />
        <div
          style={{
            marginTop: 4,
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.2em",
            color: active.length > 0 ? "#ff8800" : "rgba(0,180,255,0.4)",
            textAlign: "center",
          }}
        >
          {active.length > 0
            ? `${active.length} THREAT${active.length > 1 ? "S" : ""} TRACKED`
            : "SPACE CLEAR"}
        </div>
      </div>

      {/* INCOMING OBJECTS */}
      <div style={{ ...GLASS, padding: "10px 12px" }}>
        <SectionHeader title="INCOMING" />
        {active.length === 0 ? (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.15em",
              color: "rgba(0,160,200,0.35)",
              textAlign: "center",
              padding: "4px 0",
            }}
          >
            CLEAR
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {active.slice(0, 4).map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "2px 0",
                  borderBottom: "1px solid rgba(0,200,255,0.06)",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    color: STATUS_COLOR[t.status] ?? "#00ccff",
                    maxWidth: "70%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.id.replace("THREAT-", "T-").slice(0, 14)}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 7,
                    color: STATUS_COLOR[t.status] ?? "#00ccff",
                    letterSpacing: "0.1em",
                  }}
                >
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SYSTEM STATUS + EVENT LOG */}
      <div style={{ ...GLASS, padding: "10px 12px" }}>
        <SectionHeader title="EVENT LOG" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {eventLog.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              style={{
                fontFamily: "monospace",
                fontSize: 7.5,
                letterSpacing: "0.08em",
                color:
                  entry.type === "destroy"
                    ? "#ff4444"
                    : entry.type === "fire"
                      ? "#ffaa00"
                      : entry.type === "lock"
                        ? "#00ffcc"
                        : "rgba(0,180,220,0.6)",
                padding: "2px 0",
                borderBottom: "1px solid rgba(0,200,255,0.04)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {entry.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
