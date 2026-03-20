/**
 * InputLayerDebug — V17.1 Pointer-events diagnostic overlay.
 *
 * Activate with: localStorage.setItem('debug_layers', '1') then reload.
 *
 * Attaches a window 'pointerdown' listener and shows the last hit element:
 * - tagName
 * - id
 * - data-layer attribute
 * - data-tutorial-target attribute
 * - computed zIndex
 *
 * The display panel is pointer-events: none so it never blocks gameplay.
 * One interactive button (Clear) is placed outside the panel.
 */
import { useEffect, useRef, useState } from "react";

interface HitInfo {
  uid: number;
  tag: string;
  id: string;
  layer: string;
  tutTarget: string;
  zIndex: string;
}

let _uid = 0;

export default function InputLayerDebug() {
  const [hits, setHits] = useState<HitInfo[]>([]);
  const enabledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    enabledRef.current = localStorage.getItem("debug_layers") === "1";
    if (!enabledRef.current) return;

    const handler = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;
      const computed = window.getComputedStyle(el);
      const info: HitInfo = {
        uid: ++_uid,
        tag: el.tagName.toLowerCase(),
        id: el.id || "—",
        layer: el.getAttribute("data-layer") || "—",
        tutTarget: el.getAttribute("data-tutorial-target") || "—",
        zIndex: computed.zIndex,
      };
      setHits((prev) => [info, ...prev].slice(0, 6));
    };

    window.addEventListener("pointerdown", handler, { capture: true });
    return () =>
      window.removeEventListener("pointerdown", handler, { capture: true });
  }, []);

  const enabled =
    typeof window !== "undefined" &&
    localStorage.getItem("debug_layers") === "1";
  if (!enabled) return null;

  return (
    <>
      {/* Clear button — interactive, outside the panel */}
      <button
        type="button"
        onClick={() => setHits([])}
        style={{
          position: "fixed",
          top: 4,
          right: 4,
          zIndex: 9996,
          fontSize: 8,
          fontFamily: "monospace",
          background: "rgba(0,20,30,0.8)",
          border: "1px solid rgba(0,200,255,0.25)",
          color: "rgba(0,200,255,0.7)",
          padding: "2px 6px",
          borderRadius: 3,
          cursor: "pointer",
          letterSpacing: "0.1em",
        }}
      >
        CLR
      </button>

      {/* Info panel — pointer-events: none */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 4,
          zIndex: 9995,
          width: 220,
          pointerEvents: "none",
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.08em",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {hits.length === 0 && (
          <div
            style={{
              background: "rgba(0,5,15,0.85)",
              border: "1px solid rgba(0,180,220,0.2)",
              borderRadius: 3,
              padding: "4px 6px",
              color: "rgba(0,180,220,0.4)",
            }}
          >
            LAYER DEBUG ACTIVE — tap to see hit info
          </div>
        )}
        {hits.map((h, i) => (
          <div
            key={h.uid}
            style={{
              background: i === 0 ? "rgba(0,30,50,0.92)" : "rgba(0,5,15,0.75)",
              border: `1px solid ${
                i === 0 ? "rgba(0,200,255,0.4)" : "rgba(0,120,160,0.15)"
              }`,
              borderRadius: 3,
              padding: "3px 6px",
              color: i === 0 ? "rgba(0,220,255,0.9)" : "rgba(0,150,200,0.5)",
            }}
          >
            <div>
              <span style={{ color: "rgba(0,200,255,0.5)" }}>tag </span>
              {h.tag}
            </div>
            <div>
              <span style={{ color: "rgba(0,200,255,0.5)" }}>layer </span>
              {h.layer}
            </div>
            <div>
              <span style={{ color: "rgba(0,200,255,0.5)" }}>z </span>
              {h.zIndex}
            </div>
            {h.tutTarget !== "—" && (
              <div>
                <span style={{ color: "rgba(255,200,0,0.5)" }}>tut </span>
                {h.tutTarget}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
