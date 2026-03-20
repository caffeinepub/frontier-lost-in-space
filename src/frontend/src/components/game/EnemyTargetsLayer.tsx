/**
 * EnemyTargetsLayer — R3F component rendering enemy satellites and planetary bases.
 *
 * Satellites:
 *   - 3D box body + flat solar panel wings + glow sphere
 *   - Smoothly orbit the globe (positions updated from useEnemyStore via EnemyTick)
 *   - Selectable via click → selectNode
 *
 * Bases:
 *   - Octahedron marker anchored to globe surface (static)
 *   - Pulsing glow + selection ring
 *
 * EnemyTick (inside Canvas):
 *   - Updates satellite positions each frame (clock.getElapsedTime)
 *   - Checks return fire intervals
 *   - Cleans up expired projectiles / respawns destroyed enemies
 */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useEnemyStore } from "../../combat/useEnemyStore";
import { useTacticalStore } from "../../hooks/useTacticalStore";

// ─── Enemy Tick (runs inside Canvas rAF) ─────────────────────────────────────
function EnemyTick() {
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    useEnemyStore.getState().updatePositions(time);
    useEnemyStore.getState().checkReturnFire();
    useEnemyStore.getState().removeExpired();
  });
  return null;
}

// ─── Satellite Node ───────────────────────────────────────────────────────────
function SatelliteNode({ id }: { id: string }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const panel1Ref = useRef<THREE.Mesh>(null);
  const panel2Ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const bodyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const enemy = useEnemyStore.getState().enemies.find((e) => e.id === id);
    if (!enemy) return;

    const selected = useTacticalStore.getState().selectedNode === id;
    const pos = new THREE.Vector3(enemy.px, enemy.py, enemy.pz);
    const alive = enemy.status !== "destroyed";

    if (bodyRef.current) {
      bodyRef.current.position.copy(pos);
      bodyRef.current.rotation.y = t * 0.6;
      bodyRef.current.rotation.z = t * 0.2;
      bodyRef.current.visible = alive;
    }
    // Solar panels — offset sideways from body
    const sideOffset = new THREE.Vector3(0.12, 0, 0);
    const panelPos1 = pos.clone().add(sideOffset);
    const panelPos2 = pos.clone().sub(sideOffset);
    if (panel1Ref.current) {
      panel1Ref.current.position.copy(panelPos1);
      panel1Ref.current.visible = alive;
    }
    if (panel2Ref.current) {
      panel2Ref.current.position.copy(panelPos2);
      panel2Ref.current.visible = alive;
    }
    if (glowRef.current) {
      glowRef.current.position.copy(pos);
      glowRef.current.visible = alive;
    }
    if (ringRef.current) {
      ringRef.current.position.copy(pos);
      ringRef.current.visible = selected && alive;
    }

    // Body colour: white on hit flash, orange when selected, red otherwise
    if (bodyMatRef.current) {
      bodyMatRef.current.color.set(
        enemy.hitFlash ? "#ffffff" : selected ? "#ff8800" : "#ff3300",
      );
    }
    // Glow pulse
    if (glowMatRef.current) {
      const base = 0.12 + 0.07 * Math.sin(t * 2.5);
      glowMatRef.current.opacity = enemy.hitFlash ? 0.6 : base;
    }
  });

  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff4400",
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  const handleClick = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    useTacticalStore.getState().selectNode(id);
    useTacticalStore.getState().setGlobeTarget({ id });
  };

  return (
    <group>
      {/* Body */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh ref={bodyRef} onClick={handleClick as unknown as () => void}>
        <boxGeometry args={[0.065, 0.065, 0.065]} />
        <meshBasicMaterial ref={bodyMatRef} color="#ff3300" />
      </mesh>
      {/* Solar panel 1 */}
      <mesh ref={panel1Ref}>
        <boxGeometry args={[0.1, 0.018, 0.042]} />
        <meshBasicMaterial color="#223355" />
      </mesh>
      {/* Solar panel 2 */}
      <mesh ref={panel2Ref}>
        <boxGeometry args={[0.1, 0.018, 0.042]} />
        <meshBasicMaterial color="#223355" />
      </mesh>
      {/* Glow */}
      <mesh ref={glowRef} material={glowMat}>
        <sphereGeometry args={[0.16, 8, 8]} />
      </mesh>
      {/* Selection ring */}
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[0.22, 0.008, 8, 32]} />
        <meshBasicMaterial
          color="#00ffcc"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Base Node ────────────────────────────────────────────────────────────────
function BaseNode({ id }: { id: string }) {
  const markerRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const markerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const enemy = useEnemyStore.getState().enemies.find((e) => e.id === id);
    if (!enemy) return;

    const selected = useTacticalStore.getState().selectedNode === id;
    const pos = new THREE.Vector3(enemy.px, enemy.py, enemy.pz);
    const alive = enemy.status !== "destroyed";

    if (markerRef.current) {
      markerRef.current.position.copy(pos);
      markerRef.current.visible = alive;
    }
    if (glowRef.current) {
      glowRef.current.position.copy(pos);
      glowRef.current.visible = alive;
    }
    if (ringRef.current) {
      // Orient ring flat against globe surface (outward normal)
      ringRef.current.position.copy(pos);
      const outward = pos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(outward.dot(up)) < 0.999) {
        ringRef.current.quaternion.setFromUnitVectors(up, outward);
      }
      ringRef.current.visible = selected && alive;
    }
    if (markerMatRef.current) {
      markerMatRef.current.color.set(
        enemy.hitFlash ? "#ffffff" : selected ? "#ff8800" : "#cc2200",
      );
    }
    if (glowMatRef.current) {
      const pulse = 0.18 + 0.1 * Math.sin(t * 1.8);
      glowMatRef.current.opacity = enemy.hitFlash ? 0.55 : pulse;
    }
  });

  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ff2200",
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  const handleClick = (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    useTacticalStore.getState().selectNode(id);
    useTacticalStore.getState().setGlobeTarget({ id });
  };

  return (
    <group>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Three.js mesh */}
      <mesh ref={markerRef} onClick={handleClick as unknown as () => void}>
        <octahedronGeometry args={[0.055, 0]} />
        <meshBasicMaterial ref={markerMatRef} color="#cc2200" />
      </mesh>
      <mesh ref={glowRef} material={glowMat}>
        <sphereGeometry args={[0.13, 8, 8]} />
      </mesh>
      <mesh ref={ringRef} visible={false}>
        <torusGeometry args={[0.17, 0.008, 8, 32]} />
        <meshBasicMaterial
          color="#00ffcc"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function EnemyTargetsLayer() {
  const enemies = useEnemyStore((s) => s.enemies);

  return (
    <>
      <EnemyTick />
      {enemies.map((e) =>
        e.type === "satellite" ? (
          <SatelliteNode key={e.id} id={e.id} />
        ) : (
          <BaseNode key={e.id} id={e.id} />
        ),
      )}
    </>
  );
}
