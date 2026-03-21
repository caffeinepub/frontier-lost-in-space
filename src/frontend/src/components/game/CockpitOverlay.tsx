export default function CockpitOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        pointerEvents: "none",
      }}
    >
      {/* Layer 1 — CRT scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.10) 2px, rgba(0,0,0,0.10) 3px)",
        }}
      />

      {/* Layer 2 — Vignette (curved cockpit glass effect) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,4,0.55) 75%, rgba(0,0,8,0.82) 100%)",
        }}
      />
    </div>
  );
}
