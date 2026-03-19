/**
 * GlobeHitPulse — a brief expanding ring on the globe surface when a shot lands.
 * Subscribes to combat state hit flashes (pulseHitFlash, railHitFlash, targetHitFlash).
 * Lightweight: two expanding torus rings that fade out, placed near globe surface.
 */
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useCombatState } from "../../combat/useCombatState";
import { useTacticalStore } from "../../hooks/useTacticalStore";

const PULSE_DURATION = 900; // ms

interface PulseEvent {
  id: number;
  startTime: number;
  pos: THREE.Vector3;
  color: string;
}

let _id = 0;

function latLngToVec3Surface(
  lat: number | undefined,
  lng: number | undefined,
  r = 1.51,
): THREE.Vector3 {
  const la = lat ?? 0;
  const lo = lng ?? 0;
  const phi = (90 - la) * (Math.PI / 180);
  const theta = (lo + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

// Single pulse ring instance
function HitRing({ event }: { event: PulseEvent }) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const mat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const mat2Ref = useRef<THREE.MeshBasicMaterial>(null);

  // Orient ring to face outward from globe center
  const normal = event.pos.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion();
  if (Math.abs(normal.dot(up)) < 0.99) {
    quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }

  useFrame(() => {
    const progress = Math.min(
      1,
      (performance.now() - event.startTime) / PULSE_DURATION,
    );
    const opacity = (1 - progress) ** 1.5;
    const scale = 0.02 + progress * 0.55;
    const scale2 = 0.01 + progress * 0.35;

    if (ring1Ref.current) ring1Ref.current.scale.setScalar(scale);
    if (ring2Ref.current) ring2Ref.current.scale.setScalar(scale2);
    if (mat1Ref.current) mat1Ref.current.opacity = opacity * 0.85;
    if (mat2Ref.current) mat2Ref.current.opacity = opacity * 0.5;
  });

  return (
    <group position={event.pos} quaternion={quat}>
      {/* Primary expanding ring */}
      <mesh ref={ring1Ref} scale={0.02} renderOrder={105}>
        <torusGeometry args={[1, 0.06, 6, 48]} />
        <meshBasicMaterial
          ref={mat1Ref}
          color={event.color}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Secondary inner ring */}
      <mesh ref={ring2Ref} scale={0.01} renderOrder={104}>
        <torusGeometry args={[1, 0.09, 6, 32]} />
        <meshBasicMaterial
          ref={mat2Ref}
          color={event.color}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

export default function GlobeHitPulse() {
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const pulseHitFlash = useCombatState((s) => s.pulseHitFlash);
  const railHitFlash = useCombatState((s) => s.railHitFlash);
  const targetHitFlash = useCombatState((s) => s.targetHitFlash);
  const globeTarget = useTacticalStore((s) => s.globeTarget);

  // When any hit flash fires, spawn a pulse event at the globe target position
  const prevPulse = useRef(false);
  const prevRail = useRef(false);
  const prevTarget = useRef(false);

  useFrame(() => {
    const now = performance.now();

    // Detect rising edges
    if (pulseHitFlash && !prevPulse.current) {
      const gt = globeTarget;
      const pos = gt
        ? latLngToVec3Surface(gt.lat, gt.lng)
        : new THREE.Vector3(0, 1.51, 0);
      setEvents((prev) => [
        ...prev.filter((e) => now - e.startTime < PULSE_DURATION),
        { id: _id++, startTime: now, pos, color: "#00ffcc" },
      ]);
    }
    if (railHitFlash && !prevRail.current) {
      const gt = globeTarget;
      const pos = gt
        ? latLngToVec3Surface(gt.lat, gt.lng)
        : new THREE.Vector3(0, 1.51, 0);
      setEvents((prev) => [
        ...prev.filter((e) => now - e.startTime < PULSE_DURATION),
        { id: _id++, startTime: now, pos, color: "#aaddff" },
      ]);
    }
    if (targetHitFlash && !prevTarget.current) {
      const gt = globeTarget;
      const pos = gt
        ? latLngToVec3Surface(gt.lat, gt.lng)
        : new THREE.Vector3(0, 1.51, 0);
      setEvents((prev) => [
        ...prev.filter((e) => now - e.startTime < PULSE_DURATION),
        { id: _id++, startTime: now, pos, color: "#ff8844" },
      ]);
    }

    prevPulse.current = pulseHitFlash;
    prevRail.current = railHitFlash;
    prevTarget.current = targetHitFlash;

    // Expire old events
    setEvents((prev) => prev.filter((e) => now - e.startTime < PULSE_DURATION));
  });

  return (
    <group>
      {events.map((e) => (
        <HitRing key={e.id} event={e} />
      ))}
    </group>
  );
}
