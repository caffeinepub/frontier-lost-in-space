import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getSway } from "../../motion/shipMotionEngine";

function spherePositions(count: number, rMin: number, rMax: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = rMin + Math.random() * (rMax - rMin);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

function StarLayer({
  count,
  rMin,
  rMax,
  size,
  opacity,
  driftSpeed,
  parallaxFactor,
  color,
}: {
  count: number;
  rMin: number;
  rMax: number;
  size: number;
  opacity: number;
  driftSpeed: number;
  parallaxFactor: number;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const positions = useMemo(
    () => spherePositions(count, rMin, rMax),
    [count, rMin, rMax],
  );
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    [color, size, opacity],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += driftSpeed;
    const sway = getSway();
    groupRef.current.position.x = sway.x * parallaxFactor;
    groupRef.current.position.y = -sway.y * parallaxFactor;
  });

  return (
    <group ref={groupRef}>
      <points geometry={geom} material={mat} frustumCulled={false} />
    </group>
  );
}

function GalaxyDrift() {
  const ref0 = useRef<THREE.Mesh>(null!);
  const ref1 = useRef<THREE.Mesh>(null!);
  const ref2 = useRef<THREE.Mesh>(null!);
  const ref3 = useRef<THREE.Mesh>(null!);

  const refs = useMemo(
    () => [ref0, ref1, ref2, ref3],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const seed = useMemo(() => Math.random() * 100, []);
  const cfg = useMemo(
    () => [
      {
        size: [30, 20] as [number, number],
        color: "#080820",
        opacity: 0.13,
        basePos: [4, 2, -15] as [number, number, number],
        baseRot: [0.08, 0.25, 0] as [number, number, number],
        fx: 0.007,
        fy: 0.005,
        ax: 1.8,
        ay: 0.9,
        pf: 0.002,
      },
      {
        size: [28, 22] as [number, number],
        color: "#04041a",
        opacity: 0.09,
        basePos: [-5, -2.5, -17] as [number, number, number],
        baseRot: [-0.06, -0.18, 0.08] as [number, number, number],
        fx: 0.006,
        fy: 0.008,
        ax: 1.4,
        ay: 0.7,
        pf: 0.0015,
      },
      {
        size: [22, 16] as [number, number],
        color: "#06030f",
        opacity: 0.07,
        basePos: [1.5, -3.5, -13] as [number, number, number],
        baseRot: [0.12, 0.08, -0.04] as [number, number, number],
        fx: 0.009,
        fy: 0.006,
        ax: 1.1,
        ay: 0.6,
        pf: 0.001,
      },
      {
        size: [36, 14] as [number, number],
        color: "#020210",
        opacity: 0.06,
        basePos: [-2, 3, -18] as [number, number, number],
        baseRot: [0.03, 0.1, 0.06] as [number, number, number],
        fx: 0.005,
        fy: 0.004,
        ax: 2.0,
        ay: 0.5,
        pf: 0.001,
      },
    ],
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + seed;
    const sway = getSway();
    refs.forEach((r, i) => {
      if (!r.current) return;
      const p = cfg[i];
      r.current.position.x =
        p.basePos[0] + Math.sin(t * p.fx) * p.ax + sway.x * p.pf;
      r.current.position.y =
        p.basePos[1] + Math.cos(t * p.fy) * p.ay - sway.y * p.pf;
      r.current.rotation.z = Math.sin(t * 0.003 + i) * 0.03;
    });
  });

  return (
    <>
      <mesh ref={ref0} position={cfg[0].basePos} rotation={cfg[0].baseRot}>
        <planeGeometry args={cfg[0].size} />
        <meshBasicMaterial
          color={cfg[0].color}
          transparent
          opacity={cfg[0].opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ref1} position={cfg[1].basePos} rotation={cfg[1].baseRot}>
        <planeGeometry args={cfg[1].size} />
        <meshBasicMaterial
          color={cfg[1].color}
          transparent
          opacity={cfg[1].opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ref2} position={cfg[2].basePos} rotation={cfg[2].baseRot}>
        <planeGeometry args={cfg[2].size} />
        <meshBasicMaterial
          color={cfg[2].color}
          transparent
          opacity={cfg[2].opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ref3} position={cfg[3].basePos} rotation={cfg[3].baseRot}>
        <planeGeometry args={cfg[3].size} />
        <meshBasicMaterial
          color={cfg[3].color}
          transparent
          opacity={cfg[3].opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

interface StreakState {
  active: boolean;
  progress: number;
  speed: number;
  tailLen: number;
  maxOpacity: number;
  sx: number;
  sy: number;
  sz: number;
  dx: number;
  dy: number;
  dz: number;
}

function ShootingStars() {
  const COUNT = 5;
  const nextSpawn = useRef(6 + Math.random() * 10);

  const entries = useMemo(
    () =>
      Array.from({ length: COUNT }, () => {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(6);
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const m = new THREE.LineBasicMaterial({
          color: 0x99ccff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        return {
          line: new THREE.Line(g, m),
          state: null as StreakState | null,
        };
      }),
    [],
  );

  function spawnStreak(entry: (typeof entries)[0]) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 28 + Math.random() * 12;
    const sx = r * Math.sin(phi) * Math.cos(theta);
    const sy = r * Math.sin(phi) * Math.sin(theta);
    const sz = r * Math.cos(phi);
    const tx = -Math.sin(theta);
    const ty = Math.cos(phi) * Math.cos(theta);
    const tz = (Math.random() - 0.5) * 0.3;
    const tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
    entry.state = {
      active: true,
      progress: 0,
      speed: 4 + Math.random() * 6,
      tailLen: 1.5 + Math.random() * 3.5,
      maxOpacity: 0.25 + Math.random() * 0.35,
      sx,
      sy,
      sz,
      dx: tx / tl,
      dy: ty / tl,
      dz: tz / tl,
    };
  }

  useFrame((_, delta) => {
    nextSpawn.current -= delta;
    if (nextSpawn.current <= 0) {
      const slot = entries.find((e) => !e.state?.active);
      if (slot) spawnStreak(slot);
      nextSpawn.current = 5 + Math.random() * 14;
    }
    for (const entry of entries) {
      const s = entry.state;
      const mat = entry.line.material as THREE.LineBasicMaterial;
      if (!s?.active) {
        mat.opacity = 0;
        continue;
      }
      s.progress += delta * s.speed;
      const totalTravel = s.tailLen + 0.6;
      if (s.progress >= totalTravel) {
        s.active = false;
        mat.opacity = 0;
        continue;
      }
      const hx = s.sx + s.dx * s.progress;
      const hy = s.sy + s.dy * s.progress;
      const hz = s.sz + s.dz * s.progress;
      const tOffset = Math.min(s.progress, s.tailLen);
      const tail = entry.line.geometry.attributes
        .position as THREE.BufferAttribute;
      const arr = tail.array as Float32Array;
      arr[0] = hx - s.dx * tOffset;
      arr[1] = hy - s.dy * tOffset;
      arr[2] = hz - s.dz * tOffset;
      arr[3] = hx;
      arr[4] = hy;
      arr[5] = hz;
      tail.needsUpdate = true;
      const fadeIn = Math.min(s.progress / 0.25, 1);
      const fadeOut =
        s.progress > s.tailLen ? 1 - (s.progress - s.tailLen) / 0.6 : 1;
      mat.opacity = s.maxOpacity * fadeIn * fadeOut;
    }
  });

  return (
    <>
      <primitive object={entries[0].line} />
      <primitive object={entries[1].line} />
      <primitive object={entries[2].line} />
      <primitive object={entries[3].line} />
      <primitive object={entries[4].line} />
    </>
  );
}

function DustParticles() {
  const groupRef = useRef<THREE.Group>(null!);
  const COUNT = 70;
  const { geom, velocities } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 11;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 4;
      vel[i * 3] = (Math.random() - 0.5) * 0.0018;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.0004;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geom: g, velocities: vel };
  }, []);

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#99bbee",
        size: 0.014,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((_, delta) => {
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const dt = delta * 60;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] += velocities[i * 3] * dt;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * dt;
      if (arr[i * 3] > 9) arr[i * 3] = -9;
      else if (arr[i * 3] < -9) arr[i * 3] = 9;
      if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -5.5;
      else if (arr[i * 3 + 1] < -5.5) arr[i * 3 + 1] = 5.5;
    }
    pos.needsUpdate = true;
    if (groupRef.current) {
      const sway = getSway();
      groupRef.current.position.x = sway.x * 0.025;
      groupRef.current.position.y = -sway.y * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geom} material={mat} frustumCulled={false} />
    </group>
  );
}

export default function SpaceBackground() {
  return (
    <>
      <StarLayer
        count={700}
        rMin={58}
        rMax={80}
        size={0.022}
        opacity={0.42}
        driftSpeed={0.000045}
        parallaxFactor={0.003}
        color="#c0d8ff"
      />
      <StarLayer
        count={450}
        rMin={40}
        rMax={58}
        size={0.048}
        opacity={0.62}
        driftSpeed={0.0001}
        parallaxFactor={0.009}
        color="#d4e8ff"
      />
      <StarLayer
        count={180}
        rMin={26}
        rMax={40}
        size={0.09}
        opacity={0.88}
        driftSpeed={0.00018}
        parallaxFactor={0.02}
        color="#ffffff"
      />
      <StarLayer
        count={35}
        rMin={44}
        rMax={60}
        size={0.13}
        opacity={0.95}
        driftSpeed={0.000055}
        parallaxFactor={0.006}
        color="#ffffff"
      />
      <GalaxyDrift />
      <ShootingStars />
      <DustParticles />
    </>
  );
}
