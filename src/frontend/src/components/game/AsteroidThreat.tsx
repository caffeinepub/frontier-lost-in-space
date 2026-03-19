import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { AsteroidThreat as AsteroidThreatType } from "../../combat/useThreatStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";

function sphericalToCart(
  azimuth: number,
  elevation: number,
  radius: number,
): [number, number, number] {
  return [
    radius * Math.cos(elevation) * Math.sin(azimuth),
    radius * Math.sin(elevation),
    radius * Math.cos(elevation) * Math.cos(azimuth),
  ];
}

export default function AsteroidThreat({
  threat,
}: { threat: AsteroidThreatType }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pulseRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const selectNode = useTacticalStore((s) => s.selectNode);

  const startPos = new THREE.Vector3(
    ...sphericalToCart(
      threat.startAzimuth,
      threat.startElevation,
      threat.startRadius,
    ),
  );
  const impactPos = new THREE.Vector3(
    ...sphericalToCart(threat.impactAzimuth, threat.impactElevation, 1.5),
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const pos = new THREE.Vector3().lerpVectors(
      startPos,
      impactPos,
      threat.progress,
    );
    meshRef.current.position.copy(pos);

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const t = clock.elapsedTime;

    if (threat.status === "DESTROYED") {
      // Expand and fade on destroy
      meshRef.current.scale.setScalar(1 + (1 - threat.health) * 3);
      mat.opacity = Math.max(0, threat.health * 2);
      mat.emissiveIntensity = 2.0;
      mat.emissive.set("#ff4400");
    } else {
      meshRef.current.scale.setScalar(1 + (hovered ? 0.5 : 0));
      const intensity =
        threat.status === "INTERCEPT_WINDOW"
          ? 1.5
          : threat.status === "PRIORITY_TARGET"
            ? 0.8
            : 0.3;
      mat.emissiveIntensity = intensity + 0.3 * Math.sin(t * 4);
    }

    // Pulse ring
    if (pulseRef.current) {
      pulseRef.current.position.copy(pos);
      const pMat = pulseRef.current.material as THREE.MeshBasicMaterial;
      const urgency =
        threat.status === "INTERCEPT_WINDOW"
          ? 5
          : threat.status === "PRIORITY_TARGET"
            ? 3
            : 2;
      pMat.opacity =
        (0.3 + 0.3 * Math.sin(t * urgency)) *
        (threat.status === "DESTROYED" ? 0 : 1);
      const scale = 1.5 + 0.5 * Math.sin(t * urgency * 0.7);
      pulseRef.current.scale.setScalar(scale);
      // Look at camera
      pulseRef.current.lookAt(0, 0, 0);
    }
  });

  if (threat.status === "SURVIVED") return null;

  const color =
    threat.status === "DESTROYED"
      ? "#ff4400"
      : threat.status === "INTERCEPT_WINDOW"
        ? "#ff2200"
        : threat.status === "PRIORITY_TARGET"
          ? "#ff6600"
          : "#cc8822";

  return (
    <>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh
        ref={meshRef}
        onClick={() => selectNode(threat.id)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow={false}
      >
        <dodecahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial
          color="#3a2a18"
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.9}
          metalness={0.1}
          transparent
          opacity={1}
        />
      </mesh>

      {/* Warning pulse ring */}
      <mesh ref={pulseRef}>
        <ringGeometry args={[0.07, 0.1, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}
