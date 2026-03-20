/**
 * EarthGlobe — 3D Earth sphere with NASA runtime textures.
 *
 * RAYCAST FIX (this pass):
 * ────────────────────────────────────
 * Problem 1 — Hit sphere intercept:
 *   A secondary invisible sphere (r=1.72, 16 segments) sat in front of the globe
 *   and received ALL clicks before the globe mesh. Its low poly count caused
 *   imprecise hit normals. Removed entirely.
 *
 * Problem 2 — Globe rotation not compensated in lat/lng:
 *   e.point is in world-space. Globe rotates by autoRotOffset every frame.
 *   Without inverse-rotating the hit point, stored lat/lng described world-space
 *   direction rather than globe-surface texture coordinates. Fixed by inverse
 *   Y-rotating e.point by autoRotOffset before computing lat/lng.
 *
 * Problem 3 — Target reticle not following globe rotation:
 *   Previous reticle was rendered in world-space (GlobeHitPulse), so it stayed
 *   fixed as the globe rotated under it. New TargetReticle component is a child
 *   of the globe mesh — it auto-rotates with it, always staying on the correct
 *   surface point.
 *
 * Problem 4 — Shared rotation state:
 *   autoRotOffset is now written to globeState.rotationY every frame so
 *   GlobeHitPulse and CombatEffectsLayer can correct their world positions.
 *
 * DIAGNOSTIC LOGGING:
 *   Every click logs: canvas element, pointer coords, canvas rect, NDC,
 *   intersection object name/uuid/type/material, world hit point, globe
 *   rotation, and rotation-corrected lat/lng.
 *   ERROR is logged if the intersected object is not the globe mesh.
 *
 * V15 hardening (preserved):
 * - Fallback texture built eagerly for first-frame coverage.
 * - Texture load success/failure logged.
 *
 * V19 hardening (preserved):
 * - FSM transitions, interactionBus events, useInteractionStore updates.
 */
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { interactionBus } from "../../interaction/InteractionEventBus";
import {
  InteractionState,
  globalFSM,
} from "../../interaction/InteractionStateMachine";
import { useInteractionStore } from "../../interaction/useInteractionStore";
import { globeState, toGlobeLocal } from "../../motion/globeState";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

const EARTH_RADIUS = 1.5;
const ATMO_RADIUS = 1.62;
const GLOW_RADIUS = 1.78;

const NASA_DAY_URL =
  "https://unpkg.com/three@0.165.0/examples/textures/planets/earth_atmos_2048.jpg";
const NASA_NIGHT_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png";

// ── Fallback texture built eagerly so the first frame is never blank ─────────
function buildFallbackTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#071830";
  ctx.fillRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(
    size * 0.35,
    size * 0.3,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.52,
  );
  grad.addColorStop(0, "rgba(60,140,255,0.38)");
  grad.addColorStop(0.4, "rgba(20,80,180,0.22)");
  grad.addColorStop(1, "rgba(0,20,80,0.08)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const hexR = size / 14;
  const hexH = hexR * Math.sqrt(3);
  ctx.strokeStyle = "rgba(0,180,255,0.22)";
  ctx.lineWidth = 0.8;
  for (let row = -1; row < size / hexH + 2; row++) {
    for (let col = -1; col < size / (hexR * 1.5) + 2; col++) {
      const x = col * hexR * 3;
      const y = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + hexR * Math.cos(angle);
        const py = y + hexR * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  const blobs = [
    { x: 0.35, y: 0.38, rx: 0.12, ry: 0.09, rot: 0.3 },
    { x: 0.55, y: 0.42, rx: 0.09, ry: 0.14, rot: -0.2 },
    { x: 0.22, y: 0.55, rx: 0.08, ry: 0.07, rot: 0.6 },
    { x: 0.68, y: 0.35, rx: 0.07, ry: 0.05, rot: 0.1 },
    { x: 0.48, y: 0.65, rx: 0.06, ry: 0.08, rot: 0.4 },
  ];
  for (const b of blobs) {
    ctx.save();
    ctx.translate(b.x * size, b.y * size);
    ctx.rotate(b.rot);
    ctx.scale(1, b.ry / b.rx);
    ctx.beginPath();
    ctx.arc(0, 0, b.rx * size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,100,60,0.55)";
    ctx.fill();
    ctx.restore();
  }
  return new THREE.CanvasTexture(canvas);
}

const EAGER_FALLBACK = buildFallbackTexture();

// ── TargetReticle — parented to globe mesh, auto-rotates with it ─────────────
//
// Positioned in globe-LOCAL space so it stays locked to the globe surface
// as the globe rotates. Ring is oriented perpendicular to the surface normal
// (Z-axis of the group faces outward from the sphere center).
function TargetReticle({ localPos }: { localPos: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  // Orient group so +Z faces outward from sphere center
  const quaternion = useMemo(() => {
    const outward = localPos.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      outward,
    );
  }, [localPos]);

  // Pulse animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 5) * 0.06;
    if (outerRingRef.current) outerRingRef.current.scale.setScalar(pulse);
    if (innerRingRef.current) {
      const mat = innerRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.6 + Math.sin(t * 5) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={localPos.toArray()} quaternion={quaternion}>
      {/* Outer targeting ring */}
      <mesh ref={outerRingRef} renderOrder={110}>
        <ringGeometry args={[0.058, 0.075, 48]} />
        <meshBasicMaterial
          color="#ff2200"
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {/* Inner dot */}
      <mesh renderOrder={111}>
        <circleGeometry args={[0.012, 24]} />
        <meshBasicMaterial
          ref={innerRingRef}
          color="#ff5500"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {/* Tick marks at N/S/E/W of ring */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle) => {
        const tx = Math.cos(angle) * 0.09;
        const ty = Math.sin(angle) * 0.09;
        return (
          <mesh key={angle} position={[tx, ty, 0]} renderOrder={110}>
            <planeGeometry args={[0.004, 0.016]} />
            <meshBasicMaterial
              color="#ff3300"
              transparent
              opacity={0.75}
              side={THREE.DoubleSide}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function EarthGlobe() {
  const { gl } = useThree();

  const globeRef = useRef<THREE.Mesh>(null!);
  const atmoRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [dayTexture, setDayTexture] = useState<THREE.Texture>(EAGER_FALLBACK);
  const [nightTexture, setNightTexture] = useState<THREE.Texture | null>(null);

  // Globe-local position of the last confirmed hit — drives TargetReticle
  const [hitLocalPos, setHitLocalPos] = useState<THREE.Vector3 | null>(null);

  const autoRotOffset = useRef(0);
  const lastTime = useRef(0);

  const selectNode = useTacticalStore((s) => s.selectNode);
  const setGlobeTarget = useTacticalStore((s) => s.setGlobeTarget);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const setTargetDetected = useTutorialStore((s) => s.setTargetDetected);

  // Load NASA textures at runtime
  useMemo(() => {
    const loader = new THREE.TextureLoader();
    console.log("[EarthGlobe] Loading NASA day texture …");
    loader.load(
      NASA_DAY_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        console.log("[EarthGlobe] NASA day texture loaded \u2714");
        setDayTexture(tex);
      },
      undefined,
      (err) => {
        console.warn(
          "[EarthGlobe] NASA day texture failed, using fallback:",
          err,
        );
      },
    );
    console.log("[EarthGlobe] Loading NASA night texture …");
    loader.load(
      NASA_NIGHT_URL,
      (tex) => {
        console.log("[EarthGlobe] NASA night texture loaded \u2714");
        setNightTexture(tex);
      },
      undefined,
      (err) => {
        console.warn("[EarthGlobe] NASA night texture failed (optional):", err);
      },
    );
  }, []);

  const globeMat = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        map: dayTexture,
        emissive: new THREE.Color("#000a20"),
        emissiveIntensity: 0.2,
        shininess: 25,
        specular: new THREE.Color("#113366"),
      }),
    [dayTexture],
  );

  const nightMat = useMemo(
    () =>
      nightTexture
        ? new THREE.MeshBasicMaterial({
            map: nightTexture,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        : null,
    [nightTexture],
  );

  const atmoMat = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: new THREE.Color("#2277ff"),
        transparent: true,
        opacity: 0.18,
        side: THREE.FrontSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#4499ff"),
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dt = t - lastTime.current;
    lastTime.current = t;
    autoRotOffset.current += dt * 0.004;

    if (globeRef.current) {
      globeRef.current.rotation.y = autoRotOffset.current;
    }
    if (atmoRef.current) {
      atmoRef.current.rotation.y = autoRotOffset.current * 0.6;
    }
    if (glowRef.current) {
      glowMat.opacity = (0.85 + 0.08 * Math.sin(t * 0.5)) * 0.22;
    }
    if (atmoMat) {
      atmoMat.opacity = hovered ? 0.22 : 0.18;
    }

    // Publish current rotation so GlobeHitPulse + CombatEffectsLayer can
    // convert world-space coordinates correctly.
    globeState.rotationY = autoRotOffset.current;
  });

  // ── Click handler — R3F ThreeEvent with full diagnostic logging ────────────
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    // ─ Section 5: Log intersection object details ───────────────────────────
    const obj = e.object;
    const mesh = obj as THREE.Mesh;
    const mat = Array.isArray(mesh.material)
      ? (mesh.material as THREE.Material[])[0]
      : mesh.material;
    console.log("[RAYCAST] Object name  :", obj.name || "(unnamed)");
    console.log("[RAYCAST] Object uuid  :", obj.uuid.slice(0, 12));
    console.log("[RAYCAST] Object type  :", obj.type);
    console.log(
      "[RAYCAST] Material     :",
      mat?.name || "(unnamed)",
      mat?.type || "",
    );

    // Verify the hit object is the globe mesh (not an overlay or stale mesh)
    if (globeRef.current && obj !== globeRef.current) {
      console.error(
        "[RAYCAST] ERROR: RAYCAST NOT HITTING GLOBE — unexpected object:",
        obj.name || obj.type,
        obj.uuid.slice(0, 12),
      );
    } else {
      console.log("[RAYCAST] Globe mesh confirmed \u2714");
    }

    // ─ Section 3: Pointer → NDC using gl.domElement ─────────────────────
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const nativeEvt = e.nativeEvent;
    const ndcX = ((nativeEvt.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((nativeEvt.clientY - rect.top) / rect.height) * 2 + 1;

    console.log(
      "[RAYCAST] Canvas       :",
      `${canvas.tagName} ${canvas.offsetWidth}x${canvas.offsetHeight}`,
    );
    console.log(
      "[RAYCAST] Canvas rect  :",
      `L:${rect.left.toFixed(1)} T:${rect.top.toFixed(1)} W:${rect.width.toFixed(1)} H:${rect.height.toFixed(1)}`,
    );
    console.log(
      "[RAYCAST] Pointer      :",
      `${nativeEvt.clientX.toFixed(1)}, ${nativeEvt.clientY.toFixed(1)}`,
    );
    console.log(
      "[RAYCAST] NDC          :",
      `${ndcX.toFixed(4)}, ${ndcY.toFixed(4)}`,
    );

    if (!e.point) {
      console.error("[RAYCAST] ERROR: no hit point — miss");
      interactionBus.emit({
        type: "lockFailure",
        source: "EarthGlobe",
        data: { reason: "no-hit-point" },
      });
      useInteractionStore.getState().setLastTargetLockResult({
        success: false,
        reason: "no-hit-point",
        ts: Date.now(),
      });
      globalFSM.transition(InteractionState.idle, "globe click: no hit point");
      return;
    }

    console.log(
      "[RAYCAST] World hit    :",
      `${e.point.x.toFixed(4)}, ${e.point.y.toFixed(4)}, ${e.point.z.toFixed(4)}`,
    );

    // ─ Section 3 fix: Inverse-rotate hit point into globe-local space ──────
    //
    // e.point is in world-space. The globe mesh rotates by autoRotOffset every
    // frame. To get the surface texture coordinate (lat/lng) we must inverse-
    // rotate by that same offset, bringing the point back into the globe's
    // initial coordinate system.
    const rotY = autoRotOffset.current;
    const [lx, ly, lz] = toGlobeLocal(e.point.x, e.point.y, e.point.z);
    const localPoint = new THREE.Vector3(lx, ly, lz);

    const norm = localPoint.normalize();
    const lat = (Math.asin(Math.max(-1, Math.min(1, norm.y))) * 180) / Math.PI;
    const lng = (Math.atan2(norm.x, norm.z) * 180) / Math.PI;

    console.log("[RAYCAST] Globe rotY   :", rotY.toFixed(4), "rad");
    console.log(
      "[RAYCAST] Local point  :",
      `${lx.toFixed(4)}, ${ly.toFixed(4)}, ${lz.toFixed(4)}`,
    );
    console.log(
      "[RAYCAST] Lat/Lng      :",
      `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
    );

    const targetId = `TGT-${Date.now().toString(36)}`;

    // Globe-local surface position for the reticle (slightly above surface)
    const reticleLocal = norm.clone().multiplyScalar(EARTH_RADIUS + 0.018);
    setHitLocalPos(reticleLocal);

    // V19: Interaction bus + store events
    interactionBus.emit({
      type: "raycastHit",
      source: "EarthGlobe",
      data: { lat, lng },
    });
    useInteractionStore.getState().setLastRaycastResult({
      hit: true,
      lat,
      lng,
      ts: Date.now(),
    });

    interactionBus.emit({
      type: "lockAttempt",
      source: "EarthGlobe",
      data: { targetId, lat, lng },
    });

    setGlobeTarget({ id: targetId, lat, lng });
    selectNode(targetId);
    if (tutorialActive) setTargetDetected();

    interactionBus.emit({
      type: "lockSuccess",
      source: "EarthGlobe",
      data: { targetId, lat, lng },
    });
    useInteractionStore.getState().setLastTargetLockResult({
      success: true,
      targetId,
      ts: Date.now(),
    });
    globalFSM.transition(
      InteractionState.targetLocked,
      `globe hit: ${targetId} lat=${lat.toFixed(1)} lng=${lng.toFixed(1)}`,
    );
  };

  // Log which canvas R3F is actually using on mount
  useEffect(() => {
    const canvas = gl.domElement;
    console.log(
      "[EarthGlobe] R3F canvas element:",
      canvas.tagName,
      canvas.className || "(no class)",
      `${canvas.offsetWidth}x${canvas.offsetHeight}`,
    );
    const rect = canvas.getBoundingClientRect();
    console.log(
      "[EarthGlobe] Canvas rect on mount:",
      `L:${rect.left.toFixed(0)} T:${rect.top.toFixed(0)} W:${rect.width.toFixed(0)} H:${rect.height.toFixed(0)}`,
    );
  }, [gl]);

  return (
    <group position={[0, 0, 0]}>
      {/*
       * GLOBE MESH — sole raycast target.
       *
       * The previous "hit sphere" (r=1.72, 16 segments) has been removed.
       * It intercepted ALL clicks before this mesh due to its larger radius,
       * and its low poly count produced imprecise intersection normals.
       * This 64-segment globe mesh is now the only click surface.
       *
       * TargetReticle is a direct child of this mesh so it inherits the
       * globe's rotation transform and stays locked to the globe surface.
       */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        ref={globeRef}
        name="EarthGlobeMesh"
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        material={globeMat}
      >
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />

        {/* Target reticle — rendered in globe-local space, auto-rotates with globe */}
        {hitLocalPos && <TargetReticle localPos={hitLocalPos} />}
      </mesh>

      {/* Night lights — no raycast, additive blend over day texture */}
      {nightMat && (
        <mesh material={nightMat} raycast={() => undefined}>
          <sphereGeometry args={[EARTH_RADIUS + 0.002, 48, 48]} />
        </mesh>
      )}

      {/* Atmosphere halo */}
      <mesh ref={atmoRef} material={atmoMat} raycast={() => undefined}>
        <sphereGeometry args={[ATMO_RADIUS, 28, 28]} />
      </mesh>

      {/* Outer glow backface */}
      <mesh ref={glowRef} material={glowMat} raycast={() => undefined}>
        <sphereGeometry args={[GLOW_RADIUS, 20, 20]} />
      </mesh>

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 4]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-4, 0, 0]} intensity={0.05} color="#001040" />
    </group>
  );
}
