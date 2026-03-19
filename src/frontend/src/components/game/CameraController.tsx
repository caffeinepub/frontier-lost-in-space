/**
 * CameraController — positions the Three.js camera at the ship's orbital position.
 *
 * Added smooth camera lag for G-force / cinematic feel:
 * - Camera position lerps toward target rather than snapping
 * - Lag factor scales with velocity magnitude for G-force impression
 * - headingYaw/Pitch still apply as fine look-offset
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCombatState } from "../../combat/useCombatState";
import { useShipStore } from "../../motion/useShipStore";

export default function CameraController() {
  const { camera } = useThree();
  // Smoothed camera position — lerps toward target each frame
  const smoothPos = useRef(new THREE.Vector3(0, 0.9, 5.0));
  const smoothLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const ship = useShipStore.getState();
    const {
      orbitalTheta,
      orbitalPhi,
      orbitalRadius,
      headingYaw,
      headingPitch,
      velTheta,
      velPhi,
    } = ship;

    // Target orbital position
    const x = orbitalRadius * Math.cos(orbitalPhi) * Math.sin(orbitalTheta);
    const y = orbitalRadius * Math.sin(orbitalPhi);
    const z = orbitalRadius * Math.cos(orbitalPhi) * Math.cos(orbitalTheta);
    const targetPos = new THREE.Vector3(x, y, z);

    // Velocity magnitude — used to scale lag (G-force impression)
    const velMag = Math.sqrt(velTheta * velTheta + velPhi * velPhi);
    // At rest: lag = 0.18 (smooth follow). At full speed: lag tightens to ~0.08
    // This gives a "camera catches up" G-force pull sensation
    const maxVel = 0.004;
    const velNorm = Math.min(1, velMag / maxVel);
    const lagFactor = 0.18 - velNorm * 0.1; // 0.18 → 0.08

    smoothPos.current.lerp(targetPos, lagFactor);
    camera.position.copy(smoothPos.current);

    // Look toward Earth + apply heading offset
    const lookTarget = new THREE.Vector3(0, 0, 0);
    if (headingYaw !== 0 || headingPitch !== 0) {
      const forward = new THREE.Vector3(-x, -y, -z).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3()
        .crossVectors(forward, worldUp)
        .normalize();
      const up = new THREE.Vector3().crossVectors(right, forward).normalize();
      lookTarget.addScaledVector(right, headingYaw * orbitalRadius * 0.6);
      lookTarget.addScaledVector(up, headingPitch * orbitalRadius * 0.6);
    }
    smoothLook.current.lerp(lookTarget, 0.14);
    camera.lookAt(smoothLook.current);

    // Camera shake overlay (additive)
    const shake = useCombatState.getState().cameraShake;
    if (shake) {
      const elapsed = (performance.now() - shake.startTime) / shake.duration;
      if (elapsed < 1) {
        const decay = (1 - elapsed) ** 2;
        camera.position.x += Math.sin(elapsed * 47) * shake.intensity * decay;
        camera.position.y +=
          Math.cos(elapsed * 31) * shake.intensity * decay * 0.6;
      } else {
        useCombatState.getState().setCameraShake(null);
      }
    }
  });

  return null;
}
