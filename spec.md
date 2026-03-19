# Frontier — Lost In Space

## Current State

Version 4 — post globe-optimization pass. Core loop confirmed stable:
- Cinematic intro with skip bypass fallback
- 3D Earth globe (React Three Fiber) with click-to-target on nodes
- Cockpit frame + canopy overlays
- Weapon control deck (pulse/rail/missile) with cooldown loop via WeaponsTick RAF
- Radar system synced to ship orbital state
- Portrait/landscape responsive layout
- Mobile joystick + right drag zone for ship movement
- Tutorial system: opt-in only, launched from CMD panel, with step guards + safe exit
- Smoke tests: weapon fire, cooldown, targeting, tutorial launch/close, intro bypass
- Globe error boundary for graceful failure isolation
- Globe hit-mesh enlarged for fat-finger mobile targeting
- Atmosphere/glow shells have raycast disabled so they don't intercept clicks
- DPR capped at [1,2], star count halved on mobile, materials memoized

## Requested Changes (Diff)

### Add
- `PROJECT_MAP.md` — comprehensive project sitemap, flow map, responsibility map, and architecture risk flags
- Remove confirmed dead/duplicate files from the workspace

### Modify
- `spec.md` — updated to reflect Version 4 stable state and structure audit results

### Remove
- `audio/ElevenVoice.ts` — dead duplicate of `systems/ElevenVoice.ts`
- `storage/StorageClient.ts` — dead duplicate of `utils/StorageClient.ts`
- `components/game/WeaponDeck.tsx` — superseded by `WeaponControlDeck.tsx`, not imported anywhere

## Implementation Plan

1. Audit full file tree for duplicates, dead files, stubs, and orphans
2. Delete confirmed safe-to-remove duplicates (3 files)
3. Write PROJECT_MAP.md with:
   - Final folder/file structure
   - Dead/duplicate file registry
   - Human-readable sitemap by category
   - Player/app flow map
   - System responsibility map
   - Architecture risks (TacticalStage god component, duplicate weapon state, stub panels, orphaned QaPanel, motion DOM fragility, ICP persistence gaps)
4. Update spec.md
5. Validate build

## Known Stubs (Next Implementation Targets)
- `dashboard/panels/WeaponsPanel.tsx` — live but shows placeholder
- `dashboard/panels/ScannerPanel.tsx` — live but shows placeholder
- `dashboard/panels/EngineeringPanel.tsx` — live but shows placeholder
- `dashboard/panels/LogsPanel.tsx` — live but shows placeholder
- `components/game/QaPanel.tsx` — fully built but not mounted anywhere

## Architecture Risks (See PROJECT_MAP.md §8 for details)
1. TacticalStage.tsx = God Component (HIGH)
2. Duplicate weapon state across 3 layers (MEDIUM)
3. Stub dashboard panels are reachable from nav (MEDIUM)
4. QaPanel orphaned (LOW)
5. Motion engine uses direct DOM querySelector (LOW)
6. ICP persistence scope unclear (LOW)
