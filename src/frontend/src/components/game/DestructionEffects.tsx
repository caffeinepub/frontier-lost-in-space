import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { NODE_IDS, NODE_POSITIONS, latLngToVec3 } from "../../GlobeCore";
import type { WeaponType } from "../../combat/useCombatState";
import { useCombatState } from "../../combat/useCombatState";
import { useThreatStore } from "../../combat/useThreatStore";

function getNodePos(nodeId: string): THREE.Vector3 | null {
  const idx = NODE_IDS.indexOf(nodeId);
  if (idx < 0) return null;
  const [lat, lng] = NODE_POSITIONS[idx];
  const [x, y, z] = latLngToVec3(lat, lng, 1.53);
  return new THREE.Vector3(x, y, z);
}

function getThreatPos(threatId: string): THREE.Vector3 | null {
  const { threats } = useThreatStore.getState();
  const threat = threats.find((t) => t.id === threatId);
  if (!threat) return null;
  const sr = threat.startRadius;
  const sx =
    sr * Math.cos(threat.startElevation) * Math.sin(threat.startAzimuth);
  const sy = sr * Math.sin(threat.startElevation);
  const sz =
    sr * Math.cos(threat.startElevation) * Math.cos(threat.startAzimuth);
  const er = 1.55;
  const ex =
    er * Math.cos(threat.impactElevation) * Math.sin(threat.impactAzimuth);
  const ey = er * Math.sin(threat.impactElevation);
  const ez =
    er * Math.cos(threat.impactElevation) * Math.cos(threat.impactAzimuth);
  const p = threat.progress;
  return new THREE.Vector3(
    sx + (ex - sx) * p,
    sy + (ey - sy) * p,
    sz + (ez - sz) * p,
  );
}

function getTargetPos(id: string): THREE.Vector3 | null {
  if (id.startsWith("THREAT-")) return getThreatPos(id);
  return getNodePos(id);
}

const FRAGMENTS = [
  { dir: new THREE.Vector3(1, 0.5, 0).normalize(), key: "frag-0", even: true },
  {
    dir: new THREE.Vector3(-0.8, 0.6, 0.4).normalize(),
    key: "frag-1",
    even: false,
  },
  {
    dir: new THREE.Vector3(0.2, -0.9, 0.6).normalize(),
    key: "frag-2",
    even: true,
  },
  {
    dir: new THREE.Vector3(-0.5, -0.4, -0.8).normalize(),
    key: "frag-3",
    even: false,
  },
];

function weaponColor(wt: WeaponType): string {
  if (wt === "railgun") return "#4488ff";
  if (wt === "emp") return "#ff8800";
  if (wt === "missile") return "#ff6644";
  return "#00ffcc";
}

export default function DestructionEffects() {
  const destructionEvent = useCombatState((s) => s.destructionEvent);
  const setDestructionEvent = useCombatState((s) => s.setDestructionEvent);

  const posRef = useRef<THREE.Vector3 | null>(null);
  const activeRef = useRef(false);
  const cleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedMsRef = useRef(0);

  useEffect(() => {
    if (destructionEvent) {
      posRef.current = getTargetPos(destructionEvent.targetId);
      elapsedMsRef.current = 0;
      activeRef.current = true;
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
      cleanupRef.current = setTimeout(() => {
        activeRef.current = false;
        setDestructionEvent(null);
      }, 1200);
    }
  }, [destructionEvent, setDestructionEvent]);

  useFrame((_, delta) => {
    if (activeRef.current) {
      elapsedMsRef.current += delta * 1000;
    }
  });

  if (!destructionEvent || !activeRef.current) return null;

  const pos = posRef.current;
  if (!pos) return null;

  const elapsed = elapsedMsRef.current;
  const wColor = weaponColor(destructionEvent.weaponType);

  const burstT = Math.min(1, elapsed / 400);
  const burstRadius = burstT * 0.25;
  const burstOpacity =
    burstT < 0.4 ? burstT / 0.4 : Math.max(0, 1 - (burstT - 0.4) / 0.6);

  const debrisT = Math.min(1, elapsed / 600);
  const debrisRadius = 0.1 + debrisT * 0.4;
  const debrisOpacity = Math.max(0, 1 - debrisT * 1.2);

  const fragT = Math.min(1, elapsed / 800);
  const fragOpacity = Math.max(0, 1 - fragT * 1.1);

  const glowT = Math.min(1, elapsed / 600);
  const glowOpacity = Math.max(0, 1 - glowT * 1.4);

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color={wColor}
          transparent
          opacity={glowOpacity * 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[Math.max(0.001, burstRadius), 12, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={burstOpacity * 0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[debrisRadius, 0.018, 6, 48]} />
        <meshBasicMaterial
          color={wColor}
          transparent
          opacity={debrisOpacity * 0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 5, Math.PI / 4]}>
        <torusGeometry args={[debrisRadius * 0.7, 0.01, 6, 32]} />
        <meshBasicMaterial
          color="#ff9933"
          transparent
          opacity={debrisOpacity * 0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {FRAGMENTS.map((frag) => (
        <mesh
          key={frag.key}
          position={frag.dir.clone().multiplyScalar(fragT * 0.35)}
        >
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial
            color={frag.even ? wColor : "#ff9933"}
            transparent
            opacity={fragOpacity * 0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
