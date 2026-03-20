import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NODE_POSITIONS } from "../../GlobeCore";
import { useCombatState } from "../../combat/useCombatState";
import { useEnemyStore } from "../../combat/useEnemyStore";
import { useThreatStore } from "../../combat/useThreatStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useShipStore } from "../../motion/useShipStore";
import DestructionEffects from "./DestructionEffects";
import {
  EMPImpact,
  MissileExplosion,
  PulseImpact,
  RailImpact,
} from "./ImpactEffects";
import {
  EMPWave,
  MissileTracer,
  PulseBolt,
  RailSlug,
  getShipOriginWorld,
} from "./ProjectileSystem";

/**
 * Resolve a targetId to a world-space THREE.Vector3.
 * Handles four target types:
 *  - NODE-xx    → fixed globe surface node
 *  - TGT-xxxx   → coordinate target from globe tap
 *  - THREAT-xxx → asteroid threat interpolated world position
 *  - SAT-xxx    → enemy satellite (position from useEnemyStore)
 *  - BASE-xxx   → planetary base (position from useEnemyStore)
 */
function resolveTargetPos(nodeId: string): THREE.Vector3 | null {
  // Fixed globe nodes (Record<id, Vec3>)
  const nodePos = NODE_POSITIONS[nodeId];
  if (nodePos) {
    return nodePos.clone().multiplyScalar(1.53);
  }

  // Globe coordinate target (TGT-xxxx)
  if (nodeId.startsWith("TGT-")) {
    const gt = useTacticalStore.getState().globeTarget;
    if (gt?.lat !== undefined && gt?.lng !== undefined) {
      // Use same formula as GlobeCore.latLngToVec3
      const phi = (90 - gt.lat) * (Math.PI / 180);
      const theta = (gt.lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -1.53 * Math.sin(phi) * Math.cos(theta),
        1.53 * Math.cos(phi),
        1.53 * Math.sin(phi) * Math.sin(theta),
      );
    }
    // Fallback: fire toward globe center from ship
    const ship = useShipStore.getState();
    const r = ship.orbitalRadius;
    const cx = r * Math.cos(ship.orbitalPhi) * Math.sin(ship.orbitalTheta);
    const cy = r * Math.sin(ship.orbitalPhi);
    const cz = r * Math.cos(ship.orbitalPhi) * Math.cos(ship.orbitalTheta);
    return new THREE.Vector3(-cx, -cy, -cz).normalize().multiplyScalar(1.5);
  }

  // Threat target (THREAT-xxx)
  if (nodeId.startsWith("THREAT-")) {
    const threat = useThreatStore
      .getState()
      .threats.find((t) => t.id === nodeId);
    if (threat) {
      const endPos = new THREE.Vector3(
        1.55 *
          Math.cos(threat.impactElevation) *
          Math.cos(threat.impactAzimuth),
        1.55 * Math.sin(threat.impactElevation),
        1.55 *
          Math.cos(threat.impactElevation) *
          Math.sin(threat.impactAzimuth),
      );
      const startPos = new THREE.Vector3(
        threat.startRadius *
          Math.cos(threat.startElevation) *
          Math.cos(threat.startAzimuth),
        threat.startRadius * Math.sin(threat.startElevation),
        threat.startRadius *
          Math.cos(threat.startElevation) *
          Math.sin(threat.startAzimuth),
      );
      return new THREE.Vector3().lerpVectors(startPos, endPos, threat.progress);
    }
  }

  // Enemy satellite or base (SAT-xxx / BASE-xxx)
  if (nodeId.startsWith("SAT-") || nodeId.startsWith("BASE-")) {
    const enemy = useEnemyStore.getState().enemies.find((e) => e.id === nodeId);
    if (enemy) {
      return new THREE.Vector3(enemy.px, enemy.py, enemy.pz);
    }
  }

  return null;
}

export default function CombatEffectsLayer() {
  const firingEffect = useCombatState((s) => s.firingEffect);
  const tick = useWeaponsStore((s) => s.tick);

  // Advance weapon cooldowns every frame
  useFrame((_, delta) => {
    tick(delta * 1000);
  });

  const targetPos = firingEffect
    ? resolveTargetPos(firingEffect.targetId)
    : null;

  const originPos = firingEffect ? getShipOriginWorld() : undefined;

  return (
    <group>
      <DestructionEffects />

      {firingEffect && targetPos && (
        <>
          {firingEffect.type === "pulse" && (
            <PulseBolt
              targetPos={targetPos}
              originPos={originPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "railgun" && (
            <RailSlug
              targetPos={targetPos}
              originPos={originPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "emp" && (
            <EMPWave
              targetPos={targetPos}
              originPos={originPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "missile" && (
            <MissileTracer
              targetPos={targetPos}
              originPos={originPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}

          {firingEffect.type === "pulse" && (
            <PulseImpact
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "railgun" && (
            <RailImpact
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "emp" && (
            <EMPImpact
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
          {firingEffect.type === "missile" && (
            <MissileExplosion
              targetPos={targetPos}
              startTime={firingEffect.startTime}
              duration={firingEffect.duration}
            />
          )}
        </>
      )}
    </group>
  );
}
