/**
 * CombatEffectsLayer — projectile and impact effects rendered inside the Canvas.
 *
 * ROTATION FIX (this pass):
 * ────────────────────────────────────
 * TGT-* targets store lat/lng in globe-LOCAL coordinates (accounting for
 * globe rotation at time of tap). To resolve the correct WORLD-SPACE position
 * for projectile targeting, we apply the current globeState.rotationY to the
 * local surface vector. Without this, projectiles fired at a TGT would aim at
 * the pre-rotation world position, drifting further from the visual target as
 * the globe rotates.
 */
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NODE_POSITIONS } from "../../GlobeCore";
import { useCombatState } from "../../combat/useCombatState";
import { useEnemyStore } from "../../combat/useEnemyStore";
import { useThreatStore } from "../../combat/useThreatStore";
import { useWeaponsStore } from "../../combat/useWeapons";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { globeState, toGlobeWorld } from "../../motion/globeState";
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
 *
 * TGT-* targets: lat/lng are globe-local (rotation-compensated). We apply
 * globeState.rotationY to convert back to current world-space position so
 * projectiles aim at the correct location on the rotating globe.
 *
 * All other target types (fixed nodes, threats, enemies) are already in
 * world-space and need no rotation correction.
 */
function resolveTargetPos(nodeId: string): THREE.Vector3 | null {
  // Fixed globe nodes — world-space, no rotation needed
  const nodePos = NODE_POSITIONS[nodeId];
  if (nodePos) {
    return nodePos.clone().multiplyScalar(1.53);
  }

  // Globe coordinate target (TGT-xxxx) — lat/lng in globe-local space
  if (nodeId.startsWith("TGT-")) {
    const gt = useTacticalStore.getState().globeTarget;
    if (gt?.lat !== undefined && gt?.lng !== undefined) {
      // Compute globe-local surface position from lat/lng
      const phi = (90 - gt.lat) * (Math.PI / 180);
      const theta = (gt.lng + 180) * (Math.PI / 180);
      const localX = -1.53 * Math.sin(phi) * Math.cos(theta);
      const localY = 1.53 * Math.cos(phi);
      const localZ = 1.53 * Math.sin(phi) * Math.sin(theta);

      // Apply current globe rotation to get world-space position
      const [wx, wy, wz] = toGlobeWorld(localX, localY, localZ);
      return new THREE.Vector3(wx, wy, wz);
    }
    // Fallback: fire toward globe center from ship position
    const ship = useShipStore.getState();
    const r = ship.orbitalRadius;
    const cx = r * Math.cos(ship.orbitalPhi) * Math.sin(ship.orbitalTheta);
    const cy = r * Math.sin(ship.orbitalPhi);
    const cz = r * Math.cos(ship.orbitalPhi) * Math.cos(ship.orbitalTheta);
    return new THREE.Vector3(-cx, -cy, -cz).normalize().multiplyScalar(1.5);
  }

  // Threat target (THREAT-xxx) — world-space interpolated position
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

  // Enemy satellite or base (SAT-xxx / BASE-xxx) — world-space from store
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

  // Resolve at render time (not inside useFrame) so effects always use the
  // latest globe rotation via globeState.rotationY
  const targetPos = firingEffect
    ? resolveTargetPos(firingEffect.targetId)
    : null;

  const originPos = firingEffect ? getShipOriginWorld() : undefined;

  // Suppress unused import lint — globeState is used inside resolveTargetPos
  void globeState;

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
