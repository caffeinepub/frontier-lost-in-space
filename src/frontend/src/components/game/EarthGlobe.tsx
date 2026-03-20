/**
 * EarthGlobe — 3D Earth sphere with NASA runtime textures.
 *
 * V15 hardening:
 * - Fallback texture is created eagerly (not lazily) so there is always
 *   something to render before network textures arrive.
 * - Texture load success / failure is logged to the console.
 * - activeTexture starts as the fallback immediately so the first frame
 *   is never transparent or black.
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

const EARTH_RADIUS = 1.5;
const ATMO_RADIUS = 1.62;
const GLOW_RADIUS = 1.78;
const HIT_RADIUS = 1.72;

const NASA_DAY_URL =
  "https://unpkg.com/three@0.165.0/examples/textures/planets/earth_atmos_2048.jpg";
const NASA_NIGHT_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png";

// Build the fallback hex-grid canvas texture eagerly so it is always available
// for the very first render frame without waiting for any network request.
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

// Eagerly built once — always available for the first render
const EAGER_FALLBACK = buildFallbackTexture();

export default function EarthGlobe() {
  const globeRef = useRef<THREE.Mesh>(null!);
  const atmoRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  // Start with the eager fallback so the first frame is never blank
  const [dayTexture, setDayTexture] = useState<THREE.Texture>(EAGER_FALLBACK);
  const [nightTexture, setNightTexture] = useState<THREE.Texture | null>(null);
  const autoRotOffset = useRef(0);
  const lastTime = useRef(0);

  const selectNode = useTacticalStore((s) => s.selectNode);
  const setGlobeTarget = useTacticalStore((s) => s.setGlobeTarget);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const setTargetDetected = useTutorialStore((s) => s.setTargetDetected);

  // Load NASA textures at runtime; fall back to the already-set eager texture
  useMemo(() => {
    const loader = new THREE.TextureLoader();

    console.log("[EarthGlobe] Loading NASA day texture …");
    loader.load(
      NASA_DAY_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        console.log("[EarthGlobe] NASA day texture loaded ✔");
        setDayTexture(tex);
      },
      undefined,
      (err) => {
        console.warn(
          "[EarthGlobe] NASA day texture failed, using fallback:",
          err,
        );
        // dayTexture is already the eager fallback — nothing to do
      },
    );

    console.log("[EarthGlobe] Loading NASA night texture …");
    loader.load(
      NASA_NIGHT_URL,
      (tex) => {
        console.log("[EarthGlobe] NASA night texture loaded ✔");
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

  const hitMat = useMemo(
    () => new THREE.MeshBasicMaterial({ visible: false }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dt = t - lastTime.current;
    lastTime.current = t;
    autoRotOffset.current += dt * 0.004;
    if (globeRef.current) globeRef.current.rotation.y = autoRotOffset.current;
    if (atmoRef.current)
      atmoRef.current.rotation.y = autoRotOffset.current * 0.6;
    if (glowRef.current) {
      glowMat.opacity = (0.85 + 0.08 * Math.sin(t * 0.5)) * 0.22;
    }
    if (atmoMat) atmoMat.opacity = hovered ? 0.22 : 0.18;
  });

  const handleClick = (e: {
    stopPropagation?: () => void;
    point?: THREE.Vector3;
  }) => {
    e.stopPropagation?.();
    if (!e.point) return;
    const norm = e.point.clone().normalize();
    const lat = (Math.asin(norm.y) * 180) / Math.PI;
    const lng = (Math.atan2(norm.x, norm.z) * 180) / Math.PI;
    const targetId = `TGT-${Date.now().toString(36)}`;
    setGlobeTarget({ id: targetId, lat, lng });
    selectNode(targetId);
    if (tutorialActive) setTargetDetected();
  };

  return (
    <group position={[0, 0, 0]}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        ref={globeRef}
        onClick={handleClick as unknown as () => void}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        material={globeMat}
      >
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
      </mesh>

      {nightMat && (
        <mesh material={nightMat} raycast={() => undefined}>
          <sphereGeometry args={[EARTH_RADIUS + 0.002, 48, 48]} />
        </mesh>
      )}

      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh onClick={handleClick as unknown as () => void} material={hitMat}>
        <sphereGeometry args={[HIT_RADIUS, 16, 16]} />
      </mesh>

      <mesh ref={atmoRef} material={atmoMat} raycast={() => undefined}>
        <sphereGeometry args={[ATMO_RADIUS, 28, 28]} />
      </mesh>

      <mesh ref={glowRef} material={glowMat} raycast={() => undefined}>
        <sphereGeometry args={[GLOW_RADIUS, 20, 20]} />
      </mesh>

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 4]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-4, 0, 0]} intensity={0.05} color="#001040" />
    </group>
  );
}
