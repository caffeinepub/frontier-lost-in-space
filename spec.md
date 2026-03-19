# Frontier - Lost In Space

## Current State

- Core loop stable: globe targeting, weapons cooldown tick, intro bypass, tutorial opt-in
- Tutorial: opt-in via CMD panel, EXIT always visible, stuck guards on all guarded steps
- CommandPanel: functional with tutorial launch and system status
- smokeTests: added tutorial, weapon/targeting, and globe suites
- Globe, RadarSystem, SpaceBackground had performance and correctness issues

## Requested Changes (Diff)

### Add
- `GlobeErrorBoundary` — React error boundary wrapping the Three.js Canvas; renders a dark fallback text if globe fails, never black-screens the app
- `data-tutorial-target="globe-area"` DOM overlay over the canvas (pointer-events:none) for tutorial spotlight without stealing input
- `runGlobeSmokeTests()` suite in smokeTests.ts: canvas present, WebGL context, no duplicate canvas, hit zone, tactical store, no blocking input layers
- CoreLoopDebug strip in TacticalStage (localStorage.debug_coreloop='1')

### Modify
- **EarthGlobe**: all materials memoized (no per-render allocations); globe segments 64→48, atmo 32→28, glow 24→20; invisible wide hit-mesh (radius 1.72) for forgiving mobile tap; atmosphere/glow shells have `raycast={() => undefined}` so they never steal pointer events; texture cached at module level (no re-creation on hot reload)
- **RadarSystem**: rAF loop now reads from `threatsRef`/`selectedRef` — no longer restarts on every render (was restarting because `sorted` was a new array each time). rAF started once with empty deps array.
- **SpaceBackground**: star counts halved on narrow screens (<480px); geometry+material disposed on unmount; DustParticles count 70→50 (30 on mobile); ShootingStars count 5→3 on mobile
- **TacticalStage**: Canvas `dpr={[1,2]}` to cap pixel ratio; GlobeErrorBoundary wraps Canvas; globe-area DOM overlay added
- **smokeTests.ts**: Rewrote to use static top-level imports (removed dynamic `require() as typeof import()` pattern that broke TS parser when biome reformatted it); added `runGlobeSmokeTests()` and `runWeaponTargetingSmokeTests()`; `runAllSmokeTests` now includes all 10 suites

### Remove
- Biome-incompatible dynamic `require()` casts from smokeTests

## Implementation Plan

1. GlobeErrorBoundary.tsx — new class component
2. EarthGlobe.tsx — memoize materials, reduce segments, add hit-mesh, disable raycasting on visual shells
3. RadarSystem.tsx — fix rAF dep array (use refs, empty deps)
4. SpaceBackground.tsx — disposal, mobile counts, IS_NARROW constant
5. TacticalStage.tsx — dpr cap, error boundary, globe-area overlay, CoreLoopDebug
6. smokeTests.ts — static imports, add globe suite
