/**
 * ImpactParticleOverlay — CSS-based expanding ring + particle burst on weapon hit.
 * Triggered by pulseHitFlash / railHitFlash / targetHitFlash from combat state.
 * Lightweight, mobile-safe, no Three.js.
 */
import { useEffect, useRef, useState } from "react";
import { useCombatState } from "../../combat/useCombatState";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  dist: number;
}

let particleIdCounter = 0;

export default function ImpactParticleOverlay() {
  const pulseHitFlash = useCombatState((s) => s.pulseHitFlash);
  const railHitFlash = useCombatState((s) => s.railHitFlash);
  const targetHitFlash = useCombatState((s) => s.targetHitFlash);
  const firingEffect = useCombatState((s) => s.firingEffect);

  const [rings, setRings] = useState<
    { id: number; color: string; key: string }[]
  >([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevFlashRef = useRef(false);

  const anyFlash = pulseHitFlash || railHitFlash || targetHitFlash;

  useEffect(() => {
    if (!anyFlash || prevFlashRef.current) return;
    prevFlashRef.current = true;

    const weapType = firingEffect?.type ?? "pulse";
    const color =
      weapType === "railgun"
        ? "#88ccff"
        : weapType === "missile"
          ? "#ffaa44"
          : "#00ffcc";

    // Add expanding rings
    const ringId = particleIdCounter++;
    setRings((prev) => [...prev, { id: ringId, color, key: `ring-${ringId}` }]);
    setTimeout(() => {
      setRings((prev) => prev.filter((r) => r.id !== ringId));
    }, 700);

    // Add burst particles
    const newParticles: Particle[] = Array.from({ length: 10 }, () => ({
      id: particleIdCounter++,
      x: 50 + (Math.random() - 0.5) * 10,
      y: 50 + (Math.random() - 0.5) * 10,
      color,
      size: 2 + Math.random() * 3,
      angle: Math.random() * 360,
      dist: 30 + Math.random() * 60,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      const ids = new Set(newParticles.map((p) => p.id));
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 600);
  }, [anyFlash, firingEffect]);

  useEffect(() => {
    if (!anyFlash) {
      prevFlashRef.current = false;
    }
  }, [anyFlash]);

  if (rings.length === 0 && particles.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9,
        overflow: "hidden",
      }}
    >
      {/* Expanding rings */}
      {rings.map((ring) => (
        <div
          key={ring.key}
          style={{
            position: "absolute",
            left: "50%",
            top: "42%",
            transform: "translate(-50%, -50%)",
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: `2px solid ${ring.color}`,
            animation: "impactRingExpand 0.65s ease-out forwards",
            opacity: 0.8,
          }}
        />
      ))}

      {/* Burst particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            boxShadow: `0 0 4px ${p.color}`,
            animation: "impactParticle 0.55s ease-out forwards",
            // CSS custom property workaround — use inline transform directly
            transform: `translate(-50%, -50%) rotate(${p.angle}deg)`,
          }}
        />
      ))}

      <style>{`
        @keyframes impactRingExpand {
          from { width: 40px; height: 40px; opacity: 0.9; }
          to   { width: 180px; height: 180px; opacity: 0; }
        }
        @keyframes impactParticle {
          from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          to   { transform: translate(-50%, -50%) translateY(-40px) scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
