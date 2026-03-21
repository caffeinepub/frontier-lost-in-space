import { create } from "zustand";
import { ProjectileSystem } from "./ProjectileSystem";
import { SpacePhysics } from "./SpacePhysics";

// Module-level singletons — one instance for the lifetime of the app
const physics = new SpacePhysics();
const projectileSystem = new ProjectileSystem();

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface SpacePhysicsState {
  shipPosition: Vec3;
  planetPosition: Vec3;
  velocitySnapshot: Vec3;
  projectileCount: number;
  isActive: boolean;
  gravityVector: Vec3;
  applyThrust: (direction: Vec3) => void;
  fireProjectile: (origin: Vec3, direction: Vec3) => void;
  tick: () => void;
}

// Guard against multiple RAF loops (e.g. HMR or double-import)
let rafStarted = false;

export const useSpacePhysicsStore = create<SpacePhysicsState>((set, get) => {
  if (!rafStarted) {
    rafStarted = true;
    const loop = () => {
      get().tick();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return {
    shipPosition: { x: 0, y: 0, z: 0 },
    planetPosition: { x: 0, y: 50, z: -200 },
    velocitySnapshot: { x: 0, y: 0, z: 0 },
    projectileCount: 0,
    isActive: false,
    gravityVector: { x: 0, y: 0, z: 0 },

    applyThrust: (direction: Vec3) => {
      physics.applyThrust(direction);
    },

    fireProjectile: (origin: Vec3, direction: Vec3) => {
      projectileSystem.fire(origin, direction);
      set({ projectileCount: projectileSystem.getCount() });
    },

    tick: () => {
      const { shipPosition, planetPosition } = get();
      const pos = { ...shipPosition };

      // Capture gravity vector before applying (for debug display)
      const dx = planetPosition.x - pos.x;
      const dy = planetPosition.y - pos.y;
      const dz = planetPosition.z - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.0001;
      const gv: Vec3 = {
        x: (dx / dist) * physics.gravityStrength,
        y: (dy / dist) * physics.gravityStrength,
        z: (dz / dist) * physics.gravityStrength,
      };

      physics.applyGravity(pos, planetPosition);
      physics.update(pos);
      projectileSystem.update();

      set({
        shipPosition: pos,
        velocitySnapshot: { ...physics.velocity },
        projectileCount: projectileSystem.getCount(),
        isActive: true,
        gravityVector: gv,
      });
    },
  };
});
