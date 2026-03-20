/**
 * IncomingFireLayer — R3F component rendering enemy projectiles flying toward the player.
 *
 * Each incoming bolt:
 *   - Travels from its source enemy position to the ship's current orbital position
 *   - Uses orange/red colours to contrast with player's cyan/green shots
 *   - At ~90% progress → deals damage to usePlayerStore (shield first, then hull)
 *   - Auto-fades out on arrival
 *
 * Runs inside the R3F Canvas.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  type IncomingProjectile,
  useEnemyStore,
} from "../../combat/useEnemyStore";
import { usePlayerStore } from "../../combat/usePlayerStore";
import { useShipStore } from "../../motion/useShipStore";

function IncomingBolt({ proj }: { proj: IncomingProjectile }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trail1Ref = useRef<THREE.Mesh>(null);
  const trail2Ref = useRef<THREE.Mesh>(null);
  const trail1MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const trail2MatRef = useRef<THREE.MeshBasicMaterial>(null);
  const hasHit = useRef(false);

  // Capture start position once at mount
  const startPos = useRef(
    new THREE.Vector3(proj.startPx, proj.startPy, proj.startPz),
  );

  useFrame(() => {
    const elapsed = performance.now() - proj.startTime;
    const progress = Math.min(1, elapsed / proj.duration);

    // Player (ship) world position
    const ship = useShipStore.getState();
    const r = ship.orbitalRadius;
    const targetX = r * Math.cos(ship.orbitalPhi) * Math.sin(ship.orbitalTheta);
    const targetY = r * Math.sin(ship.orbitalPhi);
    const targetZ = r * Math.cos(ship.orbitalPhi) * Math.cos(ship.orbitalTheta);

    const x = startPos.current.x + (targetX - startPos.current.x) * progress;
    const y = startPos.current.y + (targetY - startPos.current.y) * progress;
    const z = startPos.current.z + (targetZ - startPos.current.z) * progress;

    if (groupRef.current) groupRef.current.position.set(x, y, z);

    const fadeIn = Math.min(1, progress * 8);
    const fadeOut =
      progress > 0.75 ? Math.max(0, 1 - (progress - 0.75) * 4) : 1;
    const opacity = fadeIn * fadeOut;

    if (coreMatRef.current) coreMatRef.current.opacity = opacity * 0.95;
    if (glowMatRef.current) glowMatRef.current.opacity = opacity * 0.35;

    // Trail
    const offsets = [0.07, 0.14];
    const trailMeshes = [trail1Ref, trail2Ref];
    const trailMats = [trail1MatRef, trail2MatRef];
    offsets.forEach((off, i) => {
      const tp = Math.max(0, progress - off);
      const tx = startPos.current.x + (targetX - startPos.current.x) * tp;
      const ty = startPos.current.y + (targetY - startPos.current.y) * tp;
      const tz = startPos.current.z + (targetZ - startPos.current.z) * tp;
      if (trailMeshes[i].current)
        trailMeshes[i].current!.position.set(tx, ty, tz);
      if (trailMats[i].current)
        trailMats[i].current!.opacity = opacity * (0.38 - i * 0.14);
    });

    // Impact — deal damage once when bolt reaches player
    if (progress >= 0.9 && !hasHit.current && !proj.hit) {
      hasHit.current = true;
      usePlayerStore.getState().takeDamage(8 + Math.random() * 7);
      useEnemyStore.getState().markProjectileHit(proj.id);
    }
  });

  return (
    <group>
      <group ref={groupRef} renderOrder={100}>
        <mesh renderOrder={101}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial
            ref={coreMatRef}
            color="#ff2200"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
        <mesh renderOrder={100}>
          <sphereGeometry args={[0.17, 8, 8]} />
          <meshBasicMaterial
            ref={glowMatRef}
            color="#ff5500"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      </group>
      <mesh ref={trail1Ref} renderOrder={99}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshBasicMaterial
          ref={trail1MatRef}
          color="#ff3300"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh ref={trail2Ref} renderOrder={98}>
        <sphereGeometry args={[0.03, 5, 5]} />
        <meshBasicMaterial
          ref={trail2MatRef}
          color="#ff2200"
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

export default function IncomingFireLayer() {
  const incoming = useEnemyStore((s) => s.incoming);
  return (
    <>
      {incoming
        .filter((p) => !p.hit)
        .map((p) => (
          <IncomingBolt key={p.id} proj={p} />
        ))}
    </>
  );
}
