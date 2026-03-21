/**
 * CEPHudAlert.tsx
 * Non-interactive HUD banner. Appears briefly when CEP level increases.
 * Pointer-events: none — never blocks gameplay.
 */
import { useEffect, useRef, useState } from "react";
import { CEP_LEVELS, useCEPStore } from "./useCEPStore";

export default function CEPHudAlert() {
  const level = useCEPStore((s) => s.level);
  const [visible, setVisible] = useState(false);
  const [shownDef, setShownDef] = useState(CEP_LEVELS[0]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLevelRef = useRef(0);

  useEffect(() => {
    // Only show on actual level-up, not on initial render
    if (level === 0 || level === prevLevelRef.current) return;
    prevLevelRef.current = level;

    const def = CEP_LEVELS[level];
    setShownDef(def);
    setVisible(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 4500);
    // biome-ignore lint/correctness/useExhaustiveDependencies: prevLevelRef is a stable ref
  }, [level]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "clamp(12px, 4vh, 32px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 500,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        animation: "cepAlertIn 0.35s ease forwards",
      }}
    >
      {/* Level code pill */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.25em",
          color: shownDef.color,
          background: "rgba(0,0,0,0.55)",
          border: `1px solid ${shownDef.color}`,
          borderRadius: 2,
          padding: "2px 8px",
        }}
      >
        CEP {shownDef.code} — {shownDef.label}
      </div>

      {/* Description */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 7,
          letterSpacing: "0.12em",
          color: "rgba(180,200,220,0.7)",
          background: "rgba(0,0,0,0.45)",
          borderRadius: 2,
          padding: "2px 10px",
          maxWidth: 260,
          textAlign: "center",
        }}
      >
        {shownDef.description}
      </div>

      <style>{`
        @keyframes cepAlertIn {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
