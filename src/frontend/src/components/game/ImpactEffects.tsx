/**
 * ImpactEffects — animated impact VFX that fire near end of projectile flight.
 * Each component tracks its own animation via useState+useFrame.
 *
 * Duration increased for better visibility.
 * Missile explosion significantly enlarged.
 * All impacts use depthTest:false so they can't be occluded.
 */
import { useFrame } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";

const IMPACT_DELAY_FRAC = 0.72;
// Longer durations so impacts are actually visible before they vanish
const PULSE_DURATION = 680; // ms
const RAIL_DURATION = 780;
const EMP_DURATION = 900;
const MISSILE_DURATION = 1100;

function useImpactProgress(
  startTime: number,
  duration: number,
  impactMs: number,
) {
  const [local, setLocal] = useState(0);
  useFrame(() => {
    const impactStart = startTime + duration * IMPACT_DELAY_FRAC;
    const now = performance.now();
    if (now < impactStart) return;
    setLocal(Math.min(1, (now - impactStart) / impactMs));
  });
  return local;
}

const SPARK_ANGLES = [
  { angle: 0, key: "spark-0" },
  { angle: Math.PI * 0.4, key: "spark-1" },
  { angle: Math.PI * 0.8, key: "spark-2" },
  { angle: Math.PI * 1.2, key: "spark-3" },
  { angle: Math.PI * 1.6, key: "spark-4" },
];

// ─── Pulse Impact ───────────────────────────────────────────────────────────────
export function PulseImpact({
  targetPos,
  startTime,
  duration,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
}) {
  const local = useImpactProgress(startTime, duration, PULSE_DURATION);
  if (local <= 0) return null;

  const flashOpacity = Math.max(0, 1 - local * 2.5);
  const ringRadius = Math.max(0.001, local * 0.32);
  const ring2Radius = Math.max(0.001, local * 0.22);
  const ringOpacity = Math.max(0, 1 - local * 2);

  return (
    <group position={targetPos}>
      {/* Core flash */}
      <mesh renderOrder={110}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={flashOpacity * 0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Outer glow */}
      <mesh renderOrder={109}>
        <sphereGeometry args={[0.28, 8, 8]} />
        <meshBasicMaterial
          color="#00ddaa"
          transparent
          opacity={flashOpacity * 0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Expanding ring 1 */}
      <mesh renderOrder={110}>
        <torusGeometry args={[ringRadius, 0.013, 6, 32]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={ringOpacity * 0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Expanding ring 2 (slightly behind) */}
      <mesh renderOrder={109}>
        <torusGeometry args={[ring2Radius, 0.008, 6, 24]} />
        <meshBasicMaterial
          color="#44ffdd"
          transparent
          opacity={ringOpacity * 0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

// ─── Rail Impact ────────────────────────────────────────────────────────────────
export function RailImpact({
  targetPos,
  startTime,
  duration,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
}) {
  const local = useImpactProgress(startTime, duration, RAIL_DURATION);
  if (local <= 0) return null;

  const flashOpacity = Math.max(0, 1 - local * 2.2);

  return (
    <group position={targetPos}>
      {/* Bright piercing core */}
      <mesh renderOrder={111}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={flashOpacity * 0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Blue outer halo */}
      <mesh renderOrder={110}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={flashOpacity * 0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Spark streaks radiating outward */}
      {SPARK_ANGLES.map(({ angle, key }) => (
        <mesh
          key={key}
          position={[
            Math.cos(angle) * local * 0.2,
            Math.sin(angle) * local * 0.2,
            0,
          ]}
          rotation={[0, 0, angle]}
          renderOrder={112}
        >
          <cylinderGeometry args={[0.005, 0.001, local * 0.24 + 0.05, 3]} />
          <meshBasicMaterial
            color="#cceeff"
            transparent
            opacity={flashOpacity * 0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── EMP Impact ────────────────────────────────────────────────────────────────
export function EMPImpact({
  targetPos,
  startTime,
  duration,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
}) {
  const local = useImpactProgress(startTime, duration, EMP_DURATION);
  if (local <= 0) return null;

  const flashOpacity = Math.max(0, 1 - local * 2);
  const pulseRadius1 = Math.max(0.001, local * 0.38);
  const pulseRadius2 = Math.max(0.001, local * 0.55);

  return (
    <group position={targetPos}>
      <mesh renderOrder={110}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={flashOpacity * 0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Inner expanding ring */}
      <mesh renderOrder={111}>
        <torusGeometry args={[pulseRadius1, 0.014, 6, 32]} />
        <meshBasicMaterial
          color="#ffcc44"
          transparent
          opacity={Math.max(0, 1 - local * 1.6) * 0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Outer pulse ring */}
      <mesh renderOrder={110}>
        <torusGeometry args={[pulseRadius2, 0.009, 6, 32]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={Math.max(0, 1 - local * 1.2) * 0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

// ─── Missile Explosion ──────────────────────────────────────────────────────────────
export function MissileExplosion({
  targetPos,
  startTime,
  duration,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
}) {
  const local = useImpactProgress(startTime, duration, MISSILE_DURATION);
  if (local <= 0) return null;

  const flashOpacity = Math.max(0, 1 - local * 1.8);
  const burstRadius = Math.max(0.001, local * 0.48);
  const ringRadius1 = Math.max(0.001, local * 0.58);
  const ringRadius2 = Math.max(0.001, local * 0.38);

  return (
    <group position={targetPos}>
      {/* Core fireball */}
      <mesh renderOrder={112}>
        <sphereGeometry args={[0.28, 14, 14]} />
        <meshBasicMaterial
          color="#ff8833"
          transparent
          opacity={flashOpacity * 0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* White hot core */}
      <mesh renderOrder={113}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={flashOpacity * 0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Expanding burst sphere */}
      <mesh renderOrder={111}>
        <sphereGeometry args={[burstRadius, 10, 10]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={flashOpacity * 0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Inner shockwave ring */}
      <mesh renderOrder={112}>
        <torusGeometry args={[ringRadius2, 0.016, 6, 40]} />
        <meshBasicMaterial
          color="#ff9933"
          transparent
          opacity={Math.max(0, 1 - local * 1.5) * 0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Outer shockwave ring */}
      <mesh renderOrder={111}>
        <torusGeometry args={[ringRadius1, 0.01, 6, 40]} />
        <meshBasicMaterial
          color="#ff6622"
          transparent
          opacity={Math.max(0, 1 - local * 1.1) * 0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}
