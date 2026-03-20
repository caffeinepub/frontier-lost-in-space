import { useMemo } from "react";

// Particle data generated once per mount — no JS animation loop
interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  variant: "a" | "b" | "c";
}

export default function CockpitAmbientFx() {
  const particles = useMemo<Particle[]>(() => {
    // Seeded deterministic-ish distribution so SSR / hydration stays stable
    const rng = (seed: number) => {
      const x = Math.sin(seed + 1) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${5 + rng(i * 7.3) * 90}%`,
      top: `${10 + rng(i * 3.7) * 80}%`,
      size: 1 + rng(i * 11.1) * 2,
      duration: 10 + rng(i * 5.9) * 12,
      delay: rng(i * 2.3) * 10,
      opacity: 0.04 + rng(i * 9.1) * 0.1,
      color:
        i % 3 === 0
          ? "rgba(120,220,255,1)"
          : i % 3 === 1
            ? "rgba(255,255,255,1)"
            : "rgba(255,200,100,1)",
      variant: (["a", "b", "c"] as const)[i % 3],
    }));
  }, []);

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
        /* ── Existing ambient effects ── */
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

        /* ── Dust particle drift variants ── */
        @keyframes dust-drift-a {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 0.7; }
          100% { transform: translate(12px, -28px) scale(0.7); opacity: 0; }
        }
        @keyframes dust-drift-b {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          15%  { opacity: 0.8; }
          85%  { opacity: 0.5; }
          100% { transform: translate(-8px, -22px) scale(0.8); opacity: 0; }
        }
        @keyframes dust-drift-c {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.3; }
          100% { transform: translate(20px, -35px) scale(0.6); opacity: 0; }
        }

        /* ── Breath condensation on upper glass ── */
        @keyframes breath-fog {
          0%, 100% { opacity: 0; }
          50%      { opacity: 0.03; }
        }

        /* ── Chromatic aberration edges ── */
        @keyframes ca-pulse {
          0%, 100% { opacity: 0.018; }
          50%      { opacity: 0.03; }
        }

        /* ── LED corner blink variants ── */
        @keyframes led-blink-a {
          0%, 100% { opacity: 0.15; }
          40%, 60% { opacity: 0.48; }
        }
        @keyframes led-blink-b {
          0%, 100% { opacity: 0.1; }
          30%, 70% { opacity: 0.38; }
        }
        @keyframes led-blink-c {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 0.5; }
        }

        /* ── Heat shimmer on weapon area (periodic) ── */
        @keyframes heat-shimmer {
          0%, 88%  { filter: blur(0px); opacity: 1; }
          91%      { filter: blur(0.5px); opacity: 0.96; }
          93%      { filter: blur(0px); opacity: 1; }
          95%      { filter: blur(0.4px); opacity: 0.97; }
          97%, 100% { filter: blur(0px); opacity: 1; }
        }

        /* ── Micro-turbulence jitter (periodic) ── */
        @keyframes micro-jitter {
          0%, 90%  { transform: translate(0, 0); }
          91%      { transform: translate(0.3px, -0.2px); }
          92%      { transform: translate(-0.2px, 0.3px); }
          93%      { transform: translate(0.15px, 0.1px); }
          94%, 100% { transform: translate(0, 0); }
        }
      `}</style>

      {/* ─── Existing breathing glow panels ─────────────────── */}
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

      {/* ─── Power flow accents ──────────────────────────────── */}
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

      {/* ─── Canopy reflection drift ─────────────────────────── */}
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

      {/* ─── Active system flicker ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,180,255,0.04)",
          animation: "system-flicker 8s linear infinite",
          willChange: "opacity",
        }}
      />

      {/* ─── Dust / cabin particles ──────────────────────────── */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.id % 5 === 0 ? p.size * 2.5 : p.size, // occasional elongated mote
            borderRadius:
              p.id % 5 === 0 ? "50% 50% 50% 50% / 30% 30% 70% 70%" : "50%",
            background: p.color,
            opacity: p.opacity,
            animation: `dust-drift-${p.variant} ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: "transform, opacity",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* ─── Breath condensation — upper glass ──────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "30%",
          width: "40%",
          height: 80,
          background:
            "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(200,230,255,0.06) 0%, transparent 100%)",
          animation: "breath-fog 4s ease-in-out infinite",
          willChange: "opacity",
          pointerEvents: "none",
        }}
      />

      {/* ─── Chromatic aberration — left edge ───────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 24,
          height: "100%",
          background:
            "linear-gradient(90deg, rgba(255,0,0,0.022) 0%, transparent 100%)",
          transform: "translateX(-2px)",
          animation: "ca-pulse 6s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* ─── Chromatic aberration — right edge ──────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 24,
          height: "100%",
          background:
            "linear-gradient(270deg, rgba(0,0,255,0.022) 0%, transparent 100%)",
          transform: "translateX(2px)",
          animation: "ca-pulse 6s ease-in-out infinite 3s",
          pointerEvents: "none",
        }}
      />

      {/* ─── Vignette ────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 85% at 50% 45%, transparent 50%, rgba(0,0,8,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ─── Heat shimmer layer — weapon console area ────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "28%",
          animation: "heat-shimmer 15s linear infinite",
          willChange: "filter",
          pointerEvents: "none",
        }}
      />

      {/* ─── Micro-turbulence wrapper ─────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: "micro-jitter 20s linear infinite",
          willChange: "transform",
          pointerEvents: "none",
        }}
      />

      {/* ─── LED corner indicators ───────────────────────────── */}
      {/* Top-left */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "rgba(0,220,180,1)",
          boxShadow: "0 0 5px rgba(0,220,180,0.7)",
          animation: "led-blink-a 5s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* Top-right */}
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "rgba(0,180,255,1)",
          boxShadow: "0 0 5px rgba(0,180,255,0.7)",
          animation: "led-blink-b 7s ease-in-out infinite 1.2s",
          pointerEvents: "none",
        }}
      />
      {/* Bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          right: 18,
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: "rgba(255,180,60,1)",
          boxShadow: "0 0 4px rgba(255,180,60,0.6)",
          animation: "led-blink-c 4s ease-in-out infinite 0.6s",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
