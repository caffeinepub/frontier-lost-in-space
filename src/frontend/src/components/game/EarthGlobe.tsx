/**
 * EarthGlobe — 3D Earth sphere at the scene origin.
 * Renders a layered planet with atmosphere glow and hexagonal grid overlay.
 * Clickable for target designation (creates TGT-xxx targets).
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useTacticalStore } from "../../hooks/useTacticalStore";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

const EARTH_RADIUS = 1.5;
const ATMO_RADIUS = 1.62;

function buildHexTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Dark ocean base
  ctx.fillStyle = "#071830";
  ctx.fillRect(0, 0, size, size);

  // Atmosphere gradient overlay
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

  // Hexagonal grid
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

  // Continent-like landmass blobs
  const blobs = [
    { x: 0.35, y: 0.38, rx: 0.12, ry: 0.09, rot: 0.3 },
    { x: 0.55, y: 0.42, rx: 0.09, ry: 0.14, rot: -0.2 },
    { x: 0.22, y: 0.55, rx: 0.08, ry: 0.07, rot: 0.6 },
    { x: 0.68, y: 0.35, rx: 0.07, ry: 0.05, rot: 0.1 },
    { x: 0.48, y: 0.65, rx: 0.06, ry: 0.08, rot: 0.4 },
    { x: 0.78, y: 0.58, rx: 0.05, ry: 0.06, rot: -0.3 },
    { x: 0.15, y: 0.3, rx: 0.04, ry: 0.06, rot: 0.5 },
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

  // Cloud wisps
  ctx.fillStyle = "rgba(200,220,255,0.07)";
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.translate(
      (((i * 137.5) % 100) / 100) * size,
      (((i * 89.3) % 100) / 100) * size,
    );
    ctx.rotate((i * 0.7) % Math.PI);
    ctx.scale(1, 0.25);
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return new THREE.CanvasTexture(canvas);
}

export default function EarthGlobe() {
  const globeRef = useRef<THREE.Mesh>(null!);
  const atmoRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const selectNode = useTacticalStore((s) => s.selectNode);
  const setGlobeTarget = useTacticalStore((s) => s.setGlobeTarget);
  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const setTargetDetected = useTutorialStore((s) => s.setTargetDetected);

  const texture = useMemo(() => buildHexTexture(512), []);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.04;
    }
    if (atmoRef.current) {
      atmoRef.current.rotation.y = clock.getElapsedTime() * 0.025;
    }
    if (glowRef.current) {
      const pulse = 0.85 + 0.08 * Math.sin(clock.getElapsedTime() * 0.8);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        pulse * 0.18;
    }
  });

  const handleClick = (e: {
    stopPropagation?: () => void;
    point?: THREE.Vector3;
  }) => {
    e.stopPropagation?.();
    if (!e.point) return;
    const point = e.point as THREE.Vector3;
    const norm = point.clone().normalize();
    // Convert to lat/lng
    const lat = (Math.asin(norm.y) * 180) / Math.PI;
    const lng = (Math.atan2(norm.x, norm.z) * 180) / Math.PI;
    const targetId = `TGT-${Date.now().toString(36)}`;
    setGlobeTarget({ id: targetId, lat, lng });
    selectNode(targetId);
    if (tutorialActive) setTargetDetected();
  };

  return (
    <group>
      {/* Main Earth sphere */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        ref={globeRef}
        onClick={handleClick as unknown as () => void}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={texture}
          emissive="#001840"
          emissiveIntensity={0.35}
          shininess={18}
          specular="#113366"
        />
      </mesh>

      {/* Atmosphere shell */}
      <mesh ref={atmoRef}>
        <sphereGeometry args={[ATMO_RADIUS, 32, 32]} />
        <meshPhongMaterial
          color="#1a6fff"
          transparent
          opacity={hovered ? 0.14 : 0.09}
          side={THREE.FrontSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[ATMO_RADIUS + 0.12, 24, 24]} />
        <meshBasicMaterial
          color="#3388ff"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 3, 5]} intensity={1.4} color="#ffffff" />
      <pointLight position={[0, 0, 0]} intensity={0.08} color="#2255aa" />
    </group>
  );
}
