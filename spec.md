# Frontier - Lost In Space

## Current State

The game renders via App.tsx → CinematicIntro → TacticalStage. The core layout (TacticalStage) uses a portrait-first flex column:
- PortraitStatusBar (top — target readout, SCAN, CMD buttons + threat alerts)
- Main viewport (3D Canvas with EarthGlobe + cockpit frame overlay + VelocityIndicator + RadarSystem)
- WeaponControlDeck (weapon pills row)
- BottomCommandNav (CMD/SCAN/WPN/SHIP/LOG tabs)
- TutorialOverlay + TacticalLogPanel as floating overlays

Known bugs identified from code audit:
1. **useWeaponsStore.tick(dt) is never called** — there is no game loop driving weapon cooldowns. After any weapon fires, it enters COOLDOWN status and never recovers to READY because nothing decrements currentCooldown over time.
2. **TutorialBootstrap auto-starts tutorial** — on first play, tutorial auto-starts via pendingTutorialStart flag. The TutorialOverlay at z-index 200 covers the game and the progressive-unlock state flags (canFire etc.) may create confusion about weapon availability.
3. **Intro skip button delayed 1 second** — minor UX friction.
4. **No duplicate alert banners** in current code — PortraitStatusBar is the sole threat alert renderer.

## Requested Changes (Diff)

### Add
- WeaponsTick component in TacticalStage: runs requestAnimationFrame game loop calling useWeaponsStore.getState().tick(dt) every frame
- Intro skip button visible immediately (0ms delay instead of 1000ms)

### Modify
- TutorialBootstrap: disable auto-start of tutorial — tutorial should only activate when user manually triggers it from a menu. This prevents the overlay from locking the UI on first play.
- TacticalStage: ensure WeaponsTick is mounted at the top level of TacticalStage
- App.tsx: add safety fallback — if introComplete is false and introPlaying is false after mount, show game anyway (prevents users getting stuck with black screen if localStorage state is corrupted)

### Remove
- No layers need removal — audit confirms no duplicate banners or stuck overlays in current codebase

## Implementation Plan

1. Add WeaponsTick component (rAF loop → tick) into TacticalStage.tsx
2. In TutorialBootstrap inside TacticalStage.tsx, remove auto-start: do not call startTutorial() automatically
3. In App.tsx, add a 500ms fallback: if after mount introPlaying is false AND introComplete is false, call skipIntro() to bypass into game
4. In CinematicIntro.tsx, show skip button at 0ms delay
5. Validate build passes
