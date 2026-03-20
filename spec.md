# Frontier - Lost In Space

## Current State

V19 delivered a formally modeled interaction system: explicit FSM, diagnostic shell, runtime assertions, smoke test harness, and structured observability hooks. The interaction architecture is stable.

This pass (V20) fixes the raycast pipeline and rendering stack. The FSM, event bus, and debug system are untouched.

## Requested Changes (Diff)

### Add
- `src/frontend/src/motion/globeState.ts` — shared mutable rotation ref (`globeState.rotationY`) updated by EarthGlobe every frame and read by GlobeHitPulse + CombatEffectsLayer for world-space coordinate correction.
- `toGlobeLocal()` and `toGlobeWorld()` utility functions in globeState.ts for Y-rotation-only coordinate transforms.
- `TargetReticle` component inside EarthGlobe (child of globe mesh): animated ring + dot + tick marks positioned in globe-local space, auto-rotates with globe.
- Comprehensive `[RAYCAST]` console diagnostics: canvas element, size, rect, pointer coords, NDC, object name/uuid/type/material, world hit point, globe rotation, corrected lat/lng.

### Modify
- **EarthGlobe.tsx** — (1) Removed secondary hit sphere (r=1.72, 16-seg) that intercepted all clicks before the globe mesh. (2) Added `useThree()` for `gl.domElement` reference. (3) Typed `handleClick` as `ThreeEvent<MouseEvent>`. (4) Inverse-rotates `e.point` by `autoRotOffset.current` (Y-axis) before computing lat/lng — converts world-space hit to globe-surface texture coordinates. (5) Sets `globeState.rotationY` every frame. (6) Globe mesh named `"EarthGlobeMesh"` and upgraded to 64x64 segments. (7) Logs canvas identity on mount.
- **GlobeHitPulse.tsx** — Stores pulse events with `localPos` (globe-local Vector3) instead of world-space. In `useFrame` of each HitRing, applies `toGlobeWorld()` every frame so rings follow the rotating globe surface.
- **CombatEffectsLayer.tsx** — TGT target resolution now applies `toGlobeWorld()` to convert globe-local lat/lng to current world-space position, so projectiles aim at the correct rotating surface location.
- **TacticalStage.tsx** — (1) Removed `cockpit-planet-tactical.dim_800x800.png` img: this AI-generated PNG had a hex-grid baked in and bled through the alpha:true canvas as vertical stripes. (2) Added `data-layer="hud-decoration"` to HUD overlay img. (3) Reduced HUD overlay opacity 0.15 → 0.08 (scan-line artifact reduction).
- **useGlobeControls.ts** — All three `document.querySelector('canvas')` fallbacks removed. Hook now requires explicit `canvasElement: HTMLElement | null | undefined`. Logs a warning if null. Module is currently unused by any component.

### Remove
- `HIT_RADIUS` constant and associated `hitMat` invisible sphere mesh from EarthGlobe.tsx.
- `cockpit-planet-tactical` img from GlobeViewport in TacticalStage.tsx.
- All `document.querySelector('canvas')` calls from useGlobeControls.ts.

## Implementation Plan

1. Create `globeState.ts` with shared rotation ref and transform utilities.
2. Rewrite EarthGlobe.tsx: remove hit sphere, use ThreeEvent typing, add rotation compensation, add TargetReticle as globe child, add diagnostic logging.
3. Fix GlobeHitPulse.tsx: switch to globe-local pulse positions, apply world rotation per-frame in HitRing.
4. Fix CombatEffectsLayer.tsx: apply globe rotation to TGT target world-space resolution.
5. Fix TacticalStage.tsx: remove tactical-planet img, add data-layer attr, reduce HUD overlay opacity.
6. Fix useGlobeControls.ts: remove document.querySelector fallbacks, require explicit canvas.
7. Validate with frontend build.

## Validation Checklist

- [ ] Different taps produce different `[RAYCAST] Lat/Lng` log entries
- [ ] Reticle ring appears and follows tapped globe surface location as globe rotates
- [ ] No vertical stripe artifact from tactical-planet grid overlay
- [ ] HUD overlay scan lines are below perception threshold at 8% opacity
- [ ] `[RAYCAST] Globe mesh confirmed ✔` logged on every tap (no hit-sphere intercept)
- [ ] `[RAYCAST] Canvas` logs show correct R3F gl.domElement dimensions
- [ ] GlobeHitPulse rings stay on globe surface as globe rotates
- [ ] Projectile effects (CombatEffectsLayer) aim at correct surface location after globe rotation
- [ ] FSM, event bus, and debug shell unchanged
