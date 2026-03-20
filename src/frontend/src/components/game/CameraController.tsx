/**
 * CameraController — positions the Three.js camera at the ship's orbital position.
 *
 * V21 — NAVIGATION MODE CAMERA WIRING
 * ─────────────────────────────────────────────────────────────────
 * Reads FOV offset and distance offset from the current NavigationModeDefinition.
 * Applies smooth lerp transitions so every mode produces a visible camera difference:
 *
 *   orbitObservation : FOV +0°  dist +0.0  (neutral patrol view)
 *   tacticalLock     : FOV -3°  dist -0.3  (tighter, more focused)
 *   approach         : FOV -6°  dist -0.6  (tightest, closing on target)
 *   breakaway        : FOV +8°  dist +1.2  (wide pullback)
 *   cruise           : FOV +4°  dist +0.5  (wider than tactical)
 *
 * Transitions are smooth (lerp factor 0.04–0.06) — never snap.
 * pullback mode (breakaway) uses a faster easing to sell the retreat feel.
 *
 * cameraOffsetObserver (mutable shared ref) is updated each frame so
 * InteractionDebugShell can read applied offsets without Zustand overhead.
 *
 * Original smooth lag + camera shake preserved.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCombatState } from "../../combat/useCombatState";
import { useShipStore } from "../../motion/useShipStore";
import { globalNavMode } from "../../navigation/NavigationModeController";
import { cameraOffsetObserver } from "../../navigation/useNavGateStore";

/** Base FOV for the perspective camera. All offsets are relative to this. */
const BASE_FOV = 60;

export default function CameraController() {
  const { camera } = useThree();

  // Smoothed camera position — lerps toward target each frame
  const smoothPos = useRef(new THREE.Vector3(0, 0.9, 5.0));
  const smoothLook = useRef(new THREE.Vector3(0, 0, 0));

  // Smoothed nav mode offsets
  const smoothFov = useRef(BASE_FOV);
  const smoothDistOffset = useRef(0);

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

    // ── V21: Read nav mode camera parameters ─────────────────────────────
    const modeDef = globalNavMode.currentDefinition;
    const targetFov = BASE_FOV + modeDef.camera.fovOffset;
    const targetDistOffset = modeDef.camera.distanceOffset;

    // Breakaway uses a faster easing to sell the pullback sensation
    const lerpSpeed = modeDef.camera.pullback ? 0.08 : 0.045;

    smoothFov.current = THREE.MathUtils.lerp(
      smoothFov.current,
      targetFov,
      lerpSpeed,
    );
    smoothDistOffset.current = THREE.MathUtils.lerp(
      smoothDistOffset.current,
      targetDistOffset,
      lerpSpeed,
    );

    // Apply FOV if it changed meaningfully
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(smoothFov.current - cam.fov) > 0.05) {
      cam.fov = smoothFov.current;
      cam.updateProjectionMatrix();
    }

    // Update debug observer (mutable, no Zustand cost)
    cameraOffsetObserver.appliedFov = smoothFov.current;
    cameraOffsetObserver.appliedDistOffset = smoothDistOffset.current;
    cameraOffsetObserver.currentMode = globalNavMode.currentMode;

    // ── Original orbital camera logic ────────────────────────────────────
    // Apply distance offset to orbital radius (mode-driven near/far)
    const effectiveRadius = orbitalRadius + smoothDistOffset.current;

    const x = effectiveRadius * Math.cos(orbitalPhi) * Math.sin(orbitalTheta);
    const y = effectiveRadius * Math.sin(orbitalPhi);
    const z = effectiveRadius * Math.cos(orbitalPhi) * Math.cos(orbitalTheta);
    const targetPos = new THREE.Vector3(x, y, z);

    // Velocity magnitude — used to scale lag (G-force impression)
    const velMag = Math.sqrt(velTheta * velTheta + velPhi * velPhi);
    const maxVel = 0.004;
    const velNorm = Math.min(1, velMag / maxVel);
    const lagFactor = 0.18 - velNorm * 0.1;

    smoothPos.current.lerp(targetPos, lagFactor);
    camera.position.copy(smoothPos.current);

    // Look toward Earth + heading offset
    const lookTarget = new THREE.Vector3(0, 0, 0);
    if (headingYaw !== 0 || headingPitch !== 0) {
      const forward = new THREE.Vector3(-x, -y, -z).normalize();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3()
        .crossVectors(forward, worldUp)
        .normalize();
      const up = new THREE.Vector3().crossVectors(right, forward).normalize();
      lookTarget.addScaledVector(right, headingYaw * effectiveRadius * 0.6);
      lookTarget.addScaledVector(up, headingPitch * effectiveRadius * 0.6);
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
