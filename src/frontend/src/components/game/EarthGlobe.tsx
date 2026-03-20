/**
 * EarthGlobe — 3D Earth sphere with NASA runtime textures.
 *
 * HOTFIX — Earth Material & Atmosphere Correction
 * ────────────────────────────────────────────────
 * FIX 1 — TEXTURE
 *   - NASA day map (sRGB, anisotropy x4, mipmaps default-on)
 *   - NASA night lights (opacity 0.22, additive — subtle only)
 *   - Removed shield-glow BackSide sphere entirely
 *
 * FIX 2 — REMOVE OVER-GLOW
 *   - emissive near-zero (#000308, intensity 0.04)
 *   - night map opacity lowered to 0.22
 *   - full-planet additive glow sphere removed
 *   - atmosphere FrontSide sphere removed; replaced by thin BackSide rim only
 *
 * FIX 3 — ATMOSPHERE (SUBTLE RIM)
 *   - single BackSide sphere at radius 1.55 (5% above surface)
 *   - opacity 0.13 — visible only at horizon/limb
 *   - no FrontSide atmosphere covering continents
 *
 * FIX 4 — TARGETING (preserved from V20/V21)
 *   - raycast targets globe mesh only
 *   - gl.domElement used for NDC mapping
 *   - inverse-rotation applied to hit point
 *   - TargetReticle is child of globe mesh
 *
 * V21 — NAVIGATION MODE TARGETING GATE (preserved)
 * V20 — RAYCAST PIPELINE FIX (preserved)
 * V15/V19 hardening preserved.
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
import { globalNavMode } from "../../navigation/NavigationModeController";
import { useNavGateStore } from "../../navigation/useNavGateStore";
import { useNavigationModeStore } from "../../navigation/useNavigationModeStore";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

const EARTH_RADIUS = 1.5;
// Atmosphere rim: thin BackSide sphere just outside surface
const ATMO_RIM_RADIUS = 1.56;

// ── NASA texture CDN URLs ─────────────────────────────────────────────────────
const NASA_DAY_URL =
  "https://unpkg.com/three@0.165.0/examples/textures/planets/earth_atmos_2048.jpg";
const NASA_NIGHT_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png";
const NASA_SPECULAR_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg";

// ── Fallback texture — eager so first frame is never blank ───────────────────
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
function TargetReticle({ localPos }: { localPos: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  const quaternion = useMemo(() => {
    const outward = localPos.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      outward,
    );
  }, [localPos]);

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
  const [hovered, setHovered] = useState(false);
  const [dayTexture, setDayTexture] = useState<THREE.Texture>(EAGER_FALLBACK);
  const [nightTexture, setNightTexture] = useState<THREE.Texture | null>(null);
  const [specularTexture, setSpecularTexture] = useState<THREE.Texture | null>(
    null,
  );
  const [hitLocalPos, setHitLocalPos] = useState<THREE.Vector3 | null>(null);

  const autoRotOffset = useRef(0);
  const lastTime = useRef(0);

  const selectNode = useTacticalStore((s) => s.selectNode);
  const setGlobeTarget = useTacticalStore((s) => s.setGlobeTarget);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const setTargetDetected = useTutorialStore((s) => s.setTargetDetected);

  // ── V21: Navigation mode gate selectors (stable primitives only) ──────────
  const globeOwnsDrag = useNavigationModeStore((s) => s.globeOwnsTap);
  const currentMode = useNavigationModeStore((s) => s.currentMode);

  // Gate store actions (stable function refs)
  const recordTapRejection = useNavGateStore((s) => s.recordTapRejection);
  const recordTapAccepted = useNavGateStore((s) => s.recordTapAccepted);
  const recordAutoTransition = useNavGateStore((s) => s.recordAutoTransition);

  // ── FIX 1 — Load NASA textures with correct encoding + anisotropy ─────────
  useMemo(() => {
    const loader = new THREE.TextureLoader();
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    const aniso = Math.min(4, maxAniso);

    console.log("[EarthGlobe] Loading NASA day texture …");
    loader.load(
      NASA_DAY_URL,
      (tex) => {
        // sRGB encoding — critical for correct colour reproduction
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = aniso;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        console.log(`[EarthGlobe] NASA day texture loaded ✔ (aniso x${aniso})`);
        setDayTexture(tex);
      },
      undefined,
      (err) =>
        console.warn(
          "[EarthGlobe] NASA day texture failed, using fallback:",
          err,
        ),
    );

    console.log("[EarthGlobe] Loading NASA night texture …");
    loader.load(
      NASA_NIGHT_URL,
      (tex) => {
        // Night lights are NOT sRGB — keep linear colour space
        tex.colorSpace = THREE.LinearSRGBColorSpace;
        tex.anisotropy = aniso;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.needsUpdate = true;
        console.log("[EarthGlobe] NASA night texture loaded ✔");
        setNightTexture(tex);
      },
      undefined,
      (err) =>
        console.warn("[EarthGlobe] NASA night texture failed (optional):", err),
    );

    console.log("[EarthGlobe] Loading NASA specular texture …");
    loader.load(
      NASA_SPECULAR_URL,
      (tex) => {
        tex.colorSpace = THREE.LinearSRGBColorSpace;
        tex.anisotropy = aniso;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.needsUpdate = true;
        console.log("[EarthGlobe] NASA specular texture loaded ✔");
        setSpecularTexture(tex);
      },
      undefined,
      (err) =>
        console.warn(
          "[EarthGlobe] NASA specular texture failed (optional):",
          err,
        ),
    );
    // biome-ignore lint/correctness/useExhaustiveDependencies: gl stable after mount
  }, [gl]);

  // ── FIX 2 — Globe material: minimal emissive, proper specular ────────────
  const globeMat = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        map: dayTexture,
        // Near-zero emissive — only enough to lift pure-black shadow side
        // slightly above void. NO self-glow.
        emissive: new THREE.Color("#000308"),
        emissiveIntensity: 0.04,
        shininess: 60,
        // Specular map drives per-pixel shine (ocean bright, land dull)
        specularMap: specularTexture ?? undefined,
        specular: specularTexture
          ? new THREE.Color("#ffffff")
          : new THREE.Color("#0a1a33"),
      }),
    [dayTexture, specularTexture],
  );

  // ── FIX 2 — Night lights: reduced opacity, still additive but subtle ──────
  const nightMat = useMemo(
    () =>
      nightTexture
        ? new THREE.MeshBasicMaterial({
            map: nightTexture,
            transparent: true,
            // Reduced from 0.4 → 0.22 — visible but not overpowering
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        : null,
    [nightTexture],
  );

  // ── FIX 3 — Atmosphere: thin BackSide rim only ───────────────────────────
  //
  // BackSide renders only the horizon limb of the sphere, producing a
  // natural blue edge-glow without coating the entire day-side surface.
  // No FrontSide atmosphere sphere — that was the source of the shield look.
  const atmoRimMat = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: new THREE.Color("#3388ff"),
        transparent: true,
        // Low opacity — visible only at the horizon, not over continents
        opacity: 0.13,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        emissive: new THREE.Color("#1144aa"),
        emissiveIntensity: 0.3,
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

    // Very subtle atmospheric shimmer — ±0.01 only
    if (atmoRimMat) {
      atmoRimMat.opacity = 0.12 + 0.01 * Math.sin(t * 0.4);
    }

    globeState.rotationY = autoRotOffset.current;

    // Suppress hover-based material updates that caused extra glow
    void hovered;
  });

  // ── Click handler — Navigation mode gate enforced (V21 preserved) ─────────
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    // ── V21 PHASE 1: NAVIGATION MODE TARGETING GATE ───────────────────────
    const modeDef = globalNavMode.currentDefinition;
    const navMode = globalNavMode.currentMode;
    const targetingAllowed = modeDef.globe.targetingEnabled;

    if (!targetingAllowed) {
      const reason = `mode=${navMode} globeTargetingEnabled=false`;
      console.log(
        `[NAV-GATE] REJECTED — tap blocked by navigation mode. ${reason}`,
      );
      recordTapRejection(navMode, reason);
      interactionBus.emit({
        type: "lockFailure",
        source: "EarthGlobe",
        data: { reason: `nav-gate: ${navMode}` },
      });
      useInteractionStore.getState().setLastTargetLockResult({
        success: false,
        reason: `nav-gate blocked: ${navMode}`,
        ts: Date.now(),
      });
      window.dispatchEvent(
        new CustomEvent("frontier:targetingBlocked", {
          detail: { mode: navMode },
        }),
      );
      return;
    }

    // ── TARGETING ALLOWED ────────────────────────────────────────────────────
    console.log(`[NAV-GATE] ACCEPTED — targeting enabled in mode: ${navMode}`);

    // FIX 4 — Validate we hit the actual globe mesh
    const obj = e.object;
    if (globeRef.current && obj !== globeRef.current) {
      console.error(
        "[RAYCAST] ERROR: RAYCAST NOT HITTING GLOBE — unexpected object:",
        obj.name || obj.type,
        obj.uuid.slice(0, 12),
      );
      // Abort — do not lock a target if raycast hit the wrong layer
      return;
    }
    console.log("[RAYCAST] Globe mesh confirmed ✔");

    // NDC mapping via gl.domElement (correct canvas)
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

    // Inverse-rotate hit point into globe-local space
    const rotY = autoRotOffset.current;
    const [lx, ly, lz] = toGlobeLocal(e.point.x, e.point.y, e.point.z);
    const localPoint = new THREE.Vector3(lx, ly, lz);

    const norm = localPoint.normalize();
    const lat = (Math.asin(Math.max(-1, Math.min(1, norm.y))) * 180) / Math.PI;
    const lng = (Math.atan2(norm.x, norm.z) * 180) / Math.PI;

    console.log("[RAYCAST] Globe rotY   :", rotY.toFixed(4), "rad");
    console.log(
      "[RAYCAST] Lat/Lng      :",
      `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
    );

    const targetId = `TGT-${Date.now().toString(36)}`;
    const reticleLocal = norm.clone().multiplyScalar(EARTH_RADIUS + 0.018);
    setHitLocalPos(reticleLocal);

    interactionBus.emit({
      type: "raycastHit",
      source: "EarthGlobe",
      data: { lat, lng },
    });
    useInteractionStore
      .getState()
      .setLastRaycastResult({ hit: true, lat, lng, ts: Date.now() });
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
    useInteractionStore
      .getState()
      .setLastTargetLockResult({ success: true, targetId, ts: Date.now() });
    globalFSM.transition(
      InteractionState.targetLocked,
      `globe hit: ${targetId} lat=${lat.toFixed(1)} lng=${lng.toFixed(1)}`,
    );

    recordTapAccepted(targetId);

    // ── V21 PHASE 3: AUTO MODE TRANSITION ────────────────────────────────
    if (navMode === "orbitObservation") {
      const transitioned = globalNavMode.transitionTo(
        "tacticalLock",
        `auto: target selected ${targetId} lat=${lat.toFixed(1)} lng=${lng.toFixed(1)}`,
      );
      if (transitioned) {
        console.log(
          `[NAV-MODE] AUTO TRANSITION orbitObservation -> tacticalLock | target: ${targetId} lat=${lat.toFixed(2)}° lng=${lng.toFixed(2)}°`,
        );
        recordAutoTransition("orbitObservation", "tacticalLock", targetId);
      }
    }
  };

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

  // Suppress unused variable warning — used by drag system
  void globeOwnsDrag;
  void currentMode;

  return (
    <group position={[0, 0, 0]}>
      {/* Globe mesh — sole raycast target */}
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
        {hitLocalPos && <TargetReticle localPos={hitLocalPos} />}
      </mesh>

      {/* Night lights — subtle additive layer, no raycast */}
      {nightMat && (
        <mesh material={nightMat} raycast={() => undefined}>
          <sphereGeometry args={[EARTH_RADIUS + 0.002, 48, 48]} />
        </mesh>
      )}

      {/* FIX 3 — Atmosphere: thin BackSide rim ONLY
           BackSide renders the outer shell of the sphere, so only the
           horizon edge is visible — no coverage over continent surfaces. */}
      <mesh ref={atmoRef} material={atmoRimMat} raycast={() => undefined}>
        <sphereGeometry args={[ATMO_RIM_RADIUS, 32, 32]} />
      </mesh>

      {/* Lighting: sun-side key + subtle fill only, no point light adding rim glow */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 3, 4]} intensity={1.8} color="#fff8f0" />
    </group>
  );
}
