/**
 * globeState.ts — Shared mutable state for the Earth globe mesh.
 *
 * This module provides a single source of truth for globe runtime state
 * that needs to be read by systems outside the EarthGlobe component:
 *   - GlobeHitPulse  (hit ring world-space positioning)
 *   - CombatEffectsLayer (TGT target world-space positioning)
 *
 * WHY a mutable ref instead of a Zustand store:
 *   Globe rotation changes every frame. Writing to Zustand every frame would
 *   trigger React re-renders across every subscriber. A plain mutable object
 *   is read once per frame by Three.js systems without React overhead.
 *
 * Update contract:
 *   EarthGlobe.tsx is the ONLY writer.
 *   All other modules are read-only consumers.
 */

export const globeState = {
  /**
   * Current Y-axis rotation of the globe mesh in radians.
   * Updated every frame by EarthGlobe via useFrame.
   * Used to convert world-space coordinates into globe-surface coordinates.
   */
  rotationY: 0,
};

/**
 * Apply the current globe rotation to a world-space THREE.Vector3.
 * Returns a new vector in globe-local coordinates.
 *
 * Usage:
 *   const localPos = applyGlobeRotation(worldPos);
 *   // localPos now describes the same surface point in the globe's
 *   // initial coordinate system, usable for lat/lng or texture mapping.
 */
export function toGlobeLocal(
  worldX: number,
  worldY: number,
  worldZ: number,
): [number, number, number] {
  const rotY = globeState.rotationY;
  const cosR = Math.cos(-rotY);
  const sinR = Math.sin(-rotY);
  return [worldX * cosR - worldZ * sinR, worldY, worldX * sinR + worldZ * cosR];
}

/**
 * Convert globe-local coordinates back to world-space.
 * Inverse of toGlobeLocal.
 */
export function toGlobeWorld(
  localX: number,
  localY: number,
  localZ: number,
): [number, number, number] {
  const rotY = globeState.rotationY;
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  return [localX * cosR - localZ * sinR, localY, localX * sinR + localZ * cosR];
}
