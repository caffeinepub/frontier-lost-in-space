/**
 * GlobeHitPulse — expanding ring on the globe surface when a shot lands.
 *
 * ROTATION FIX (this pass):
 * ────────────────────────────────────
 * globeTarget.lat/lng are now stored in globe-local coordinates (accounting
 * for globe rotation at time of tap). To render the ring at the correct
 * world-space position, we must apply the CURRENT globe rotation to the
 * computed surface vector.
 *
 * latLngToVec3Surface gives globe-local position → apply globeState.rotationY
 * to convert to world-space each frame. This keeps the ring locked to the
 * globe surface as it rotates.
 */
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useCombatState } from "../../combat/useCombatState";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { globeState, toGlobeWorld } from "../../motion/globeState";

const PULSE_DURATION = 900; // ms

interface PulseEvent {
  id: number;
  startTime: number;
  /** Position in GLOBE-LOCAL space. Converted to world-space in HitRing. */
  localPos: THREE.Vector3;
  color: string;
}

let _id = 0;

/**
 * Convert lat/lng (globe-local coords) to a globe-local surface Vector3.
 * This does NOT apply globe rotation — call toGlobeWorld() on the result
 * inside useFrame to get the current world-space position.
 */
function latLngToLocalVec3(
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
  const groupRef = useRef<THREE.Group>(null);

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

    // Update world-space position every frame to follow the rotating globe
    if (groupRef.current) {
      const lp = event.localPos;
      const [wx, wy, wz] = toGlobeWorld(lp.x, lp.y, lp.z);
      groupRef.current.position.set(wx, wy, wz);

      // Re-orient the group so rings face outward from globe center
      const worldPos = new THREE.Vector3(wx, wy, wz);
      const outward = worldPos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion();
      if (Math.abs(outward.dot(up)) < 0.99) {
        quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward);
      }
      groupRef.current.quaternion.copy(quat);
    }
  });

  // Compute initial world-space position for first frame
  const lp = event.localPos;
  const [iwx, iwy, iwz] = toGlobeWorld(lp.x, lp.y, lp.z);
  const initialPos = new THREE.Vector3(iwx, iwy, iwz);
  const outward0 = initialPos.clone().normalize();
  const initQuat = new THREE.Quaternion();
  if (Math.abs(outward0.dot(new THREE.Vector3(0, 1, 0))) < 0.99) {
    initQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward0);
  }

  return (
    <group ref={groupRef} position={initialPos.toArray()} quaternion={initQuat}>
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

  const prevPulse = useRef(false);
  const prevRail = useRef(false);
  const prevTarget = useRef(false);

  useFrame(() => {
    const now = performance.now();

    if (pulseHitFlash && !prevPulse.current) {
      const gt = globeTarget;
      // Use globe-local position (lat/lng are rotation-corrected since this pass)
      const localPos = gt
        ? latLngToLocalVec3(gt.lat, gt.lng)
        : new THREE.Vector3(0, 1.51, 0);
      setEvents((prev) => [
        ...prev.filter((e) => now - e.startTime < PULSE_DURATION),
        { id: _id++, startTime: now, localPos, color: "#00ffcc" },
      ]);
    }
    if (railHitFlash && !prevRail.current) {
      const gt = globeTarget;
      const localPos = gt
        ? latLngToLocalVec3(gt.lat, gt.lng)
        : new THREE.Vector3(0, 1.51, 0);
      setEvents((prev) => [
        ...prev.filter((e) => now - e.startTime < PULSE_DURATION),
        { id: _id++, startTime: now, localPos, color: "#aaddff" },
      ]);
    }
    if (targetHitFlash && !prevTarget.current) {
      const gt = globeTarget;
      const localPos = gt
        ? latLngToLocalVec3(gt.lat, gt.lng)
        : new THREE.Vector3(0, 1.51, 0);
      setEvents((prev) => [
        ...prev.filter((e) => now - e.startTime < PULSE_DURATION),
        { id: _id++, startTime: now, localPos, color: "#ff8844" },
      ]);
    }

    prevPulse.current = pulseHitFlash;
    prevRail.current = railHitFlash;
    prevTarget.current = targetHitFlash;

    setEvents((prev) => prev.filter((e) => now - e.startTime < PULSE_DURATION));
  });

  // Suppress unused-variable lint — globeState is used for the rotation helper
  void globeState;

  return (
    <group>
      {events.map((e) => (
        <HitRing key={e.id} event={e} />
      ))}
    </group>
  );
}
