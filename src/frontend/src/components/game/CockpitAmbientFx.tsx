export default function CockpitAmbientFx() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 16,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes cockpit-breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes power-flow {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes reflection-drift {
          0%, 100% { opacity: 0.01; transform: translateX(-3px); }
          50% { opacity: 0.04; transform: translateX(3px); }
        }
        @keyframes system-flicker {
          0%   { opacity: 0; }
          94%  { opacity: 0; }
          95%  { opacity: 0.015; }
          96%  { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Breathing glow panels — left side */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: 0,
          width: 80,
          height: "60%",
          background: "rgba(0,180,255,0.08)",
          boxShadow: "4px 0 18px rgba(0,180,255,0.12) inset",
          animation: "cockpit-breathe 3s ease-in-out infinite",
          willChange: "opacity",
        }}
      />

      {/* Breathing glow panels — right side */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: 0,
          width: 80,
          height: "60%",
          background: "rgba(0,180,255,0.08)",
          boxShadow: "-4px 0 18px rgba(0,180,255,0.12) inset",
          animation: "cockpit-breathe 3s ease-in-out infinite 1.5s",
          willChange: "opacity",
        }}
      />

      {/* Power flow accent — top trim */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 0,
          right: 0,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(0,220,255,0.6), transparent)",
          backgroundSize: "200% 100%",
          animation: "power-flow 2.5s linear infinite",
          willChange: "background-position",
          opacity: 0.55,
        }}
      />

      {/* Power flow accent — bottom trim */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 0,
          right: 0,
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(0,220,255,0.6), transparent)",
          backgroundSize: "200% 100%",
          animation: "power-flow 2.5s linear infinite 1.25s",
          willChange: "background-position",
          opacity: 0.45,
        }}
      />

      {/* Canopy reflection drift */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "35%",
          width: "30%",
          height: "40%",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, transparent 60%)",
          animation: "reflection-drift 5s ease-in-out infinite",
          willChange: "opacity, transform",
          pointerEvents: "none",
        }}
      />

      {/* Active system flicker — full screen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,180,255,0.04)",
          animation: "system-flicker 8s linear infinite",
          willChange: "opacity",
        }}
      />
    </div>
  );
}
