import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NODE_IDS, NODE_POSITIONS, latLngToVec3 } from "../../GlobeCore";
import { useCombatState } from "../../combat/useCombatState";
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
 * Handles three target types:
 *  - NODE-xx   → fixed globe surface node
 *  - TGT-xxxx  → coordinate target from globe tap (via globeTarget in tactical store)
 *  - THREAT-xxx → asteroid threat interpolated world position
 */
function resolveTargetPos(nodeId: string): THREE.Vector3 | null {
  // Fixed globe nodes
  const nodeIdx = NODE_IDS.indexOf(nodeId);
  if (nodeIdx >= 0) {
    const [lat, lng] = NODE_POSITIONS[nodeIdx];
    const [x, y, z] = latLngToVec3(lat, lng, 1.53);
    return new THREE.Vector3(x, y, z);
  }

  // Globe coordinate target (TGT-xxxx)
  if (nodeId.startsWith("TGT-")) {
    const gt = useTacticalStore.getState().globeTarget;
    if (gt) {
      const [x, y, z] = latLngToVec3(gt.lat, gt.lng, 1.53);
      return new THREE.Vector3(x, y, z);
    }
    // Fallback: fire forward toward globe center
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

  // Compute ship origin once per render (captured by projectile components via originPos prop)
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
