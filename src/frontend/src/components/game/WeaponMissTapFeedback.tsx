/**
 * WeaponMissTapFeedback.tsx — Missed tap correction scoped to weapon console region.
 * V22.1: COMBAT FEELS REAL LAYER
 *
 * Only triggers when a tap lands inside console.panel AND is close (~60px)
 * to a weapon zone but doesn't land on one.
 * Rate-limited to 1 pulse per 800ms.
 * All visual elements are pointerEvents: none.
 */
import { useEffect, useRef, useState } from "react";
import { useWeaponZoneStore } from "../../combat/useWeaponZoneStore";

const WEAPON_BUTTON_OCIDS = [
  "console.pulse_button",
  "console.missile_button",
  "console.rail_button",
  "console.emp_button",
];

interface MissPulse {
  id: number;
  x: number;
  y: number;
}

function getButtonCenter(ocid: string): { x: number; y: number } | null {
  const el = document.querySelector<HTMLElement>(`[data-ocid="${ocid}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export default function WeaponMissTapFeedback() {
  const [pulses, setPulses] = useState<MissPulse[]>([]);
  const lastPulseTime = useRef(0);
  const pulseCounter = useRef(0);
  const recordConsoleMiss = useWeaponZoneStore((s) => s.recordConsoleMiss);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const panel = document.querySelector<HTMLElement>(
        '[data-ocid="console.panel"]',
      );
      if (!panel) return;

      const panelRect = panel.getBoundingClientRect();
      const { clientX, clientY } = e;

      // Must be within panel bounds
      if (
        clientX < panelRect.left ||
        clientX > panelRect.right ||
        clientY < panelRect.top ||
        clientY > panelRect.bottom
      )
        return;

      // Direct hit on a weapon button — no miss feedback needed
      for (const ocid of WEAPON_BUTTON_OCIDS) {
        const el = document.querySelector<HTMLElement>(`[data-ocid="${ocid}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (
          clientX >= r.left &&
          clientX <= r.right &&
          clientY >= r.top &&
          clientY <= r.bottom
        ) {
          return;
        }
      }

      // Find nearest weapon button center
      let nearestDist = Number.POSITIVE_INFINITY;
      for (const ocid of WEAPON_BUTTON_OCIDS) {
        const center = getButtonCenter(ocid);
        if (!center) continue;
        const dx = clientX - center.x;
        const dy = clientY - center.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < nearestDist) nearestDist = d;
      }

      // Only trigger if close to a zone (within 60px)
      if (nearestDist > 60) return;

      // Rate limit: 1 pulse per 800ms
      const now = Date.now();
      if (now - lastPulseTime.current < 800) return;
      lastPulseTime.current = now;

      // Position relative to console panel
      const pulseX = clientX - panelRect.left;
      const pulseY = clientY - panelRect.top;

      recordConsoleMiss();
      const id = ++pulseCounter.current;
      setPulses((prev) => [...prev, { id, x: pulseX, y: pulseY }]);
      setTimeout(() => {
        setPulses((prev) => prev.filter((p) => p.id !== id));
      }, 440);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [recordConsoleMiss]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes missPulseExpand {
          0%   { width: 10px; height: 10px; opacity: 0.65; margin-left: -5px; margin-top: -5px; }
          100% { width: 44px; height: 44px; opacity: 0;   margin-left: -22px; margin-top: -22px; }
        }
      `}</style>
      {pulses.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            borderRadius: "50%",
            border: "1.5px solid rgba(0,200,255,0.55)",
            animation: "missPulseExpand 0.42s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
