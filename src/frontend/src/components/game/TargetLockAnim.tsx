/**
 * TargetLockAnim — animated target acquisition ring that plays when a node/target is selected.
 * Shows a tightening bracket animation then settles into a steady locked state.
 * pointer-events: none. Renders over the cockpit view, centered in the front window.
 */
import { useEffect, useRef, useState } from "react";
import { useTacticalStore } from "../../hooks/useTacticalStore";

export default function TargetLockAnim() {
  const selectedNode = useTacticalStore((s) => s.selectedNode);
  const globeTarget = useTacticalStore((s) => s.globeTarget);

  // hasTarget drives the phase check via targetId
  const [phase, setPhase] = useState<"idle" | "acquiring" | "locked">("idle");
  const prevTarget = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetId = selectedNode ?? globeTarget?.id ?? null;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (targetId && targetId !== prevTarget.current) {
      prevTarget.current = targetId;
      setPhase("acquiring");
      timerRef.current = setTimeout(() => setPhase("locked"), 480);
    } else if (!targetId) {
      prevTarget.current = null;
      setPhase("idle");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [targetId]);

  if (phase === "idle") return null;

  const isAcquiring = phase === "acquiring";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        <defs>
          <style>{`
            @keyframes lock-acquire {
              0%   { opacity: 0; transform-origin: 80px 80px; transform: scale(1.6); }
              40%  { opacity: 1; transform-origin: 80px 80px; transform: scale(1.08); }
              100% { opacity: 1; transform-origin: 80px 80px; transform: scale(1.0); }
            }
            @keyframes lock-bracket-tl {
              0%   { transform: translate(-18px,-18px); opacity: 0; }
              100% { transform: translate(0,0); opacity: 1; }
            }
            @keyframes lock-bracket-tr {
              0%   { transform: translate(18px,-18px); opacity: 0; }
              100% { transform: translate(0,0); opacity: 1; }
            }
            @keyframes lock-bracket-bl {
              0%   { transform: translate(-18px,18px); opacity: 0; }
              100% { transform: translate(0,0); opacity: 1; }
            }
            @keyframes lock-bracket-br {
              0%   { transform: translate(18px,18px); opacity: 0; }
              100% { transform: translate(0,0); opacity: 1; }
            }
            @keyframes lock-pulse {
              0%, 100% { opacity: 0.7; }
              50%       { opacity: 1.0; }
            }
            .tl { animation: lock-bracket-tl 0.38s cubic-bezier(0.22,1,0.36,1) both; }
            .tr { animation: lock-bracket-tr 0.38s cubic-bezier(0.22,1,0.36,1) both; }
            .bl { animation: lock-bracket-bl 0.38s cubic-bezier(0.22,1,0.36,1) both; }
            .br { animation: lock-bracket-br 0.38s cubic-bezier(0.22,1,0.36,1) both; }
            .lock-outer { animation: lock-acquire 0.48s cubic-bezier(0.22,1,0.36,1) both; }
            .lock-steady { animation: lock-pulse 1.6s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* Outer acquisition ring */}
        <g className={isAcquiring ? "lock-outer" : "lock-steady"}>
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="none"
            stroke={
              isAcquiring ? "rgba(0,255,200,0.6)" : "rgba(0,255,180,0.35)"
            }
            strokeWidth={isAcquiring ? "1.2" : "0.7"}
            strokeDasharray={isAcquiring ? "12 8" : "4 10"}
          />
        </g>

        {/* Corner brackets — tighten inward during acquisition */}
        {/* Top-left */}
        <g className="tl">
          <polyline
            points="46,60 46,46 60,46"
            fill="none"
            stroke="rgba(0,255,200,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
        {/* Top-right */}
        <g className="tr">
          <polyline
            points="100,46 114,46 114,60"
            fill="none"
            stroke="rgba(0,255,200,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
        {/* Bottom-left */}
        <g className="bl">
          <polyline
            points="46,100 46,114 60,114"
            fill="none"
            stroke="rgba(0,255,200,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
        {/* Bottom-right */}
        <g className="br">
          <polyline
            points="100,114 114,114 114,100"
            fill="none"
            stroke="rgba(0,255,200,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* LOCKED label — only when settled */}
        {!isAcquiring && (
          <>
            <text
              x="80"
              y="136"
              textAnchor="middle"
              fontSize="7"
              fill="rgba(0,255,180,0.75)"
              fontFamily="monospace"
              letterSpacing="2"
              className="lock-steady"
            >
              TARGET LOCKED
            </text>
            {/* Center cross */}
            <line
              x1="74"
              y1="80"
              x2="86"
              y2="80"
              stroke="rgba(0,255,200,0.6)"
              strokeWidth="0.7"
            />
            <line
              x1="80"
              y1="74"
              x2="80"
              y2="86"
              stroke="rgba(0,255,200,0.6)"
              strokeWidth="0.7"
            />
            <circle
              cx="80"
              cy="80"
              r="2"
              fill="rgba(0,255,200,0.7)"
              className="lock-steady"
            />
          </>
        )}

        {/* ACQUIRING label during animation */}
        {isAcquiring && (
          <text
            x="80"
            y="136"
            textAnchor="middle"
            fontSize="7"
            fill="rgba(0,220,255,0.8)"
            fontFamily="monospace"
            letterSpacing="2"
          >
            ACQUIRING...
          </text>
        )}
      </svg>
    </div>
  );
}
