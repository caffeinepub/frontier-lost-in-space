# Frontier - Lost In Space

## Current State
The game has a `shipMotionEngine.ts` (DOM-layer sway/jolt/lean, RAF-based) and a full `useWeapons.ts` store (pulse, railgun, missile, EMP with cooldowns, reload, damage). There is no space physics engine driving actual 3D velocity/acceleration/gravity, and no projectile simulation — weapons fire instantly via state flags, not physical projectiles traveling through space.

## Requested Changes (Diff)

### Add
- `src/frontend/src/physics/SpacePhysics.ts` — standalone class with velocity, acceleration, drag, maxSpeed, thrustPower, gravityStrength; methods: applyThrust(direction), applyGravity(position, planetPosition), update(position)
- `src/frontend/src/physics/ProjectileSystem.ts` — manages live projectile array; each projectile has position, velocity (direction × 5), life (120 frames); fire(origin, direction) spawns one; update() advances all and filters expired
- `src/frontend/src/physics/useSpacePhysicsStore.ts` — Zustand store exposing ship position, velocity, physics tick; integrates SpacePhysics and ProjectileSystem; provides debug snapshot
- `src/frontend/src/components/debug/SpacePhysicsDebug.tsx` — on-screen debug panel (activated via localStorage `debug_physics`) showing: ship velocity (x/y/z), speed, active projectile count, gravity vector, physics active flag

### Modify
- `src/frontend/src/motion/useShipMovementSetup.ts` — wire SpacePhysics applyThrust from joystick input each frame; call physics.update() to advance ship position; feed velocity magnitude into existing setGForceAmp()
- `src/frontend/src/combat/useWeapons.ts` — after firing, call ProjectileSystem.fire(shipPosition, aimDirection) to spawn a physical projectile alongside the existing instant-hit logic

### Remove
- Nothing removed; physics layer is additive

## Implementation Plan
1. Create `SpacePhysics.ts` — pure class, no React, matches the provided spec exactly (with `life` bug fix inside object literal)
2. Create `ProjectileSystem.ts` — manages projectile array, fire() and update() methods
3. Create `useSpacePhysicsStore.ts` — Zustand store, RAF tick calling physics.update() each frame, exposes position/velocity/projectiles for debug and rendering
4. Create `SpacePhysicsDebug.tsx` — reads store, renders live values, pointer-events none, toggled by localStorage flag
5. Wire joystick → applyThrust in useShipMovementSetup.ts
6. Wire fire → ProjectileSystem.fire in useWeapons.ts
7. Mount SpacePhysicsDebug in App.tsx behind the debug flag
