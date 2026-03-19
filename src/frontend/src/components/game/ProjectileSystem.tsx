/**
 * ProjectileSystem — self-animating Three.js projectile VFX.
 * Each component captures originPos at mount time (fixed firing origin).
 * originPos is passed from CombatEffectsLayer which computes it dynamically
 * from the ship's current orbital position at fire time.
 *
 * Missile upgrade: uses a quadratic Bezier curve path so it arcs
 * slightly sideways/upward before correcting to target, giving a believable
 * launch kick rather than a flat straight line.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useShipStore } from "../../motion/useShipStore";

/**
 * Compute the ship's current world-space firing origin.
 */
export function getShipOriginWorld(): THREE.Vector3 {
  const { orbitalTheta, orbitalPhi, orbitalRadius } = useShipStore.getState();
  const r = orbitalRadius;
  const camX = r * Math.cos(orbitalPhi) * Math.sin(orbitalTheta);
  const camY = r * Math.sin(orbitalPhi);
  const camZ = r * Math.cos(orbitalPhi) * Math.cos(orbitalTheta);
  const camPos = new THREE.Vector3(camX, camY, camZ);
  const toGlobe = new THREE.Vector3(-camX, -camY, -camZ).normalize();
  return camPos.clone().addScaledVector(toGlobe, r * 0.5);
}

/** Legacy fallback */
export const SHIP_ORIGIN = new THREE.Vector3(0, -0.35, 2.2);

/** Quadratic Bezier: P = (1-t)²*P0 + 2(1-t)t*P1 + t²*P2 */
function bezierPoint(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
): void {
  const mt = 1 - t;
  out.set(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
  );
}

// ─── Pulse Bolt ───────────────────────────────────────────────────────────────
export function PulseBolt({
  targetPos,
  startTime,
  duration,
  originPos,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
  originPos?: THREE.Vector3;
}) {
  const origin = useRef<THREE.Vector3>(originPos ?? getShipOriginWorld());
  const groupRef = useRef<THREE.Group>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trail0Ref = useRef<THREE.Mesh>(null);
  const trail1Ref = useRef<THREE.Mesh>(null);
  const trail0MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trail1MatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);
    const pos = new THREE.Vector3().lerpVectors(
      origin.current,
      targetPos,
      progress,
    );
    if (groupRef.current) groupRef.current.position.copy(pos);

    const fadeIn = Math.min(1, progress * 8);
    const fadeOut =
      progress > 0.85 ? Math.max(0, 1 - (progress - 0.85) * 6.67) : 1;
    const opacity = fadeIn * fadeOut;

    if (coreMatRef.current) coreMatRef.current.opacity = opacity * 0.98;
    if (glowMatRef.current) glowMatRef.current.opacity = opacity * 0.55;

    const offsets = [0.06, 0.12];
    const trailMats = [trail0MatRef, trail1MatRef];
    const trailMeshes = [trail0Ref, trail1Ref];
    offsets.forEach((offset, i) => {
      const tp = Math.max(0, progress - offset);
      const trailPos = new THREE.Vector3().lerpVectors(
        origin.current,
        targetPos,
        tp,
      );
      if (trailMeshes[i].current)
        trailMeshes[i].current!.position.copy(trailPos);
      if (trailMats[i].current)
        trailMats[i].current!.opacity = opacity * (0.45 - i * 0.15);
    });
  });

  return (
    <group>
      <group ref={groupRef} renderOrder={100}>
        <mesh renderOrder={100}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial
            ref={glowMatRef}
            color="#00ffcc"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        <mesh renderOrder={101}>
          <sphereGeometry args={[0.072, 8, 8]} />
          <meshBasicMaterial
            ref={coreMatRef}
            color="#aaffee"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
      <mesh ref={trail0Ref} renderOrder={99}>
        <sphereGeometry args={[0.048, 6, 6]} />
        <meshBasicMaterial
          ref={trail0MatRef}
          color="#00ffaa"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh ref={trail1Ref} renderOrder={98}>
        <sphereGeometry args={[0.032, 5, 5]} />
        <meshBasicMaterial
          ref={trail1MatRef}
          color="#00ffaa"
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

// ─── Rail Slug ────────────────────────────────────────────────────────────────
export function RailSlug({
  targetPos,
  startTime,
  duration,
  originPos,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
  originPos?: THREE.Vector3;
}) {
  const origin = useRef<THREE.Vector3>(originPos ?? getShipOriginWorld());
  const groupRef = useRef<THREE.Group>(null);
  const outerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const tipMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const trailMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);
    const pos = new THREE.Vector3().lerpVectors(
      origin.current,
      targetPos,
      progress,
    );
    const dir = new THREE.Vector3()
      .subVectors(targetPos, origin.current)
      .normalize();

    if (groupRef.current) {
      groupRef.current.position.copy(pos);
      const quat = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(dir.dot(up)) < 0.999) quat.setFromUnitVectors(up, dir);
      groupRef.current.quaternion.copy(quat);
    }

    const fadeIn = Math.min(1, progress * 12);
    const fadeOut = progress > 0.5 ? Math.max(0, 1 - (progress - 0.5) * 4) : 1;
    const opacity = fadeIn * fadeOut;

    if (outerMatRef.current) outerMatRef.current.opacity = opacity * 0.45;
    if (coreMatRef.current) coreMatRef.current.opacity = opacity * 0.98;
    if (tipMatRef.current) tipMatRef.current.opacity = opacity * 0.95;

    const tp = Math.max(0, progress - 0.08);
    const trailPos = new THREE.Vector3().lerpVectors(
      origin.current,
      targetPos,
      tp,
    );
    if (trailRef.current) trailRef.current.position.copy(trailPos);
    if (trailMatRef.current) trailMatRef.current.opacity = opacity * 0.35;
  });

  return (
    <group>
      <group ref={groupRef} renderOrder={100}>
        <mesh renderOrder={100}>
          <cylinderGeometry args={[0.036, 0.036, 0.52, 6]} />
          <meshBasicMaterial
            ref={outerMatRef}
            color="#2266cc"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        <mesh renderOrder={101}>
          <cylinderGeometry args={[0.011, 0.011, 0.52, 6]} />
          <meshBasicMaterial
            ref={coreMatRef}
            color="#aaddff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        <mesh position={[0, 0.28, 0]} renderOrder={102}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshBasicMaterial
            ref={tipMatRef}
            color="#ffffff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
      <mesh ref={trailRef} renderOrder={99}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshBasicMaterial
          ref={trailMatRef}
          color="#6699ff"
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

// ─── EMP Wave ─────────────────────────────────────────────────────────────────
export function EMPWave({
  targetPos,
  startTime,
  duration,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
  originPos?: THREE.Vector3;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const ring1MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ring2MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const sphereMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const quat = new THREE.Quaternion();
  const normal = targetPos.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(normal.dot(up)) < 0.99) {
    quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }

  const maxRadius = 0.9;

  useFrame(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);
    const opacity = (1 - progress) ** 0.7 * 0.85;

    if (ring1Ref.current) ring1Ref.current.scale.setScalar(progress);
    if (ring2Ref.current) ring2Ref.current.scale.setScalar(progress * 0.6);
    if (ring1MatRef.current) ring1MatRef.current.opacity = opacity;
    if (ring2MatRef.current) ring2MatRef.current.opacity = opacity * 0.6;

    if (sphereRef.current && sphereMatRef.current) {
      if (progress < 0.25) {
        sphereRef.current.visible = true;
        sphereRef.current.scale.setScalar((0.25 - progress) * 2.4);
        sphereMatRef.current.opacity = (0.25 - progress) * 4 * 0.7;
      } else {
        sphereRef.current.visible = false;
      }
    }
  });

  return (
    <group position={targetPos} quaternion={quat}>
      <mesh ref={ring1Ref} scale={0.001} renderOrder={100}>
        <torusGeometry args={[maxRadius, 0.022, 8, 64]} />
        <meshBasicMaterial
          ref={ring1MatRef}
          color="#ff8800"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh ref={ring2Ref} scale={0.001} renderOrder={100}>
        <torusGeometry args={[maxRadius, 0.012, 8, 48]} />
        <meshBasicMaterial
          ref={ring2MatRef}
          color="#ffcc44"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh ref={sphereRef} renderOrder={101}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial
          ref={sphereMatRef}
          color="#ffaa00"
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

// ─── Missile Tracer (curved Bezier path) ─────────────────────────────────────
export function MissileTracer({
  targetPos,
  startTime,
  duration,
  originPos,
}: {
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
  originPos?: THREE.Vector3;
}) {
  const origin = useRef<THREE.Vector3>(originPos ?? getShipOriginWorld());

  // Compute Bezier control point at construction time (not in a factory)
  // Offset perpendicular to the flight path for a believable arc/kick
  const _computeControlPoint = (): THREE.Vector3 => {
    const org = origin.current;
    const tgt = targetPos;
    const mid = new THREE.Vector3().addVectors(org, tgt).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(tgt, org);
    const worldUp = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, worldUp).normalize();
    const kickDist = dir.length() * 0.2;
    return mid
      .clone()
      .addScaledVector(perp, (Math.random() > 0.5 ? 1 : -1) * kickDist * 0.6)
      .addScaledVector(worldUp, kickDist * 0.4);
  };
  const controlPoint = useRef<THREE.Vector3>(_computeControlPoint());

  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const tipMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const heatMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trail0Ref = useRef<THREE.Mesh>(null);
  const trail1Ref = useRef<THREE.Mesh>(null);
  const trail2Ref = useRef<THREE.Mesh>(null);
  const trail0MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trail1MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trail2MatRef = useRef<THREE.MeshBasicMaterial>(null);

  const pos = useRef(new THREE.Vector3());
  const prevPos = useRef(new THREE.Vector3());

  useFrame(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);

    // Current position on Bezier curve
    bezierPoint(
      origin.current,
      controlPoint.current,
      targetPos,
      progress,
      pos.current,
    );

    // Direction: derivative of bezier (approximate by small step ahead)
    const nextT = Math.min(1, progress + 0.02);
    bezierPoint(
      origin.current,
      controlPoint.current,
      targetPos,
      nextT,
      prevPos.current,
    );
    const dir = new THREE.Vector3()
      .subVectors(prevPos.current, pos.current)
      .normalize();

    if (groupRef.current) {
      groupRef.current.position.copy(pos.current);
      // Orient missile body along flight direction
      const quat = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(dir.dot(up)) < 0.999) quat.setFromUnitVectors(up, dir);
      groupRef.current.quaternion.copy(quat);
    }

    const fadeIn = Math.min(1, progress * 10);
    const fadeOut =
      progress > 0.75 ? Math.max(0, 1 - (progress - 0.75) * 4) : 1;
    const opacity = fadeIn * fadeOut;

    if (bodyMatRef.current) bodyMatRef.current.opacity = opacity * 0.88;
    if (tipMatRef.current) tipMatRef.current.opacity = opacity * 0.98;
    if (heatMatRef.current) heatMatRef.current.opacity = opacity * 0.45;

    const offsets = [0.05, 0.11, 0.19];
    const trailMeshes = [trail0Ref, trail1Ref, trail2Ref];
    const trailMats = [trail0MatRef, trail1MatRef, trail2MatRef];
    offsets.forEach((offset, i) => {
      const tp = Math.max(0, progress - offset);
      const tPos = new THREE.Vector3();
      bezierPoint(origin.current, controlPoint.current, targetPos, tp, tPos);
      if (trailMeshes[i].current) trailMeshes[i].current!.position.copy(tPos);
      if (trailMats[i].current)
        trailMats[i].current!.opacity = opacity * (0.55 - i * 0.14);
    });
  });

  return (
    <group>
      <group ref={groupRef} renderOrder={100}>
        {/* Missile body */}
        <mesh renderOrder={100}>
          <cylinderGeometry args={[0.024, 0.016, 0.32, 6]} />
          <meshBasicMaterial
            ref={bodyMatRef}
            color="#ff6644"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        {/* Nose tip */}
        <mesh position={[0, 0.18, 0]} renderOrder={101}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial
            ref={tipMatRef}
            color="#ffffff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        {/* Exhaust plume */}
        <mesh position={[0, -0.18, 0]} renderOrder={99}>
          <sphereGeometry args={[0.095, 8, 8]} />
          <meshBasicMaterial
            ref={heatMatRef}
            color="#ff4400"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
      {/* Smoke trail particles */}
      <mesh ref={trail0Ref} renderOrder={98}>
        <sphereGeometry args={[0.038, 6, 6]} />
        <meshBasicMaterial
          ref={trail0MatRef}
          color="#ff8844"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh ref={trail1Ref} renderOrder={97}>
        <sphereGeometry args={[0.026, 5, 5]} />
        <meshBasicMaterial
          ref={trail1MatRef}
          color="#ff6633"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh ref={trail2Ref} renderOrder={96}>
        <sphereGeometry args={[0.018, 5, 5]} />
        <meshBasicMaterial
          ref={trail2MatRef}
          color="#ff4422"
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
