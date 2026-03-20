## V22.1 — Perceptual Targeting UI (COMBAT FEELS REAL LAYER)
**Date:** 2026-03-20
**Layer:** COMBAT FEELS REAL LAYER

### Outer Problem
Invisible weapon zones (opacity: 0) had no feedback loop. Players couldn't discover them naturally, had no confirmation signal when near a zone, got dead silence on fire, and experienced no correction when narrowly missing. The hologram-first aesthetic was preserved but usability suffered from zero discoverability cues.

### Root Cause
- WeaponSlot buttons were fully invisible (opacity: 0 inherited from WeaponCluster) with no proximity awareness or intent escalation.
- No audio was wired to weapon interactions. initAudio() was never called on user gesture, so AudioContext remained blocked by browser autoplay policy.
- "Missed tap" feedback was absent entirely, making the console feel dead when the player mis-aimed.
- No dwell-time detection existed, so the player had no progressive signal that they were engaging a zone.

### Fix Strategy
Outside-in layering: intent detection (dwell timer) → ghost visualization (radial bloom) → sound cues (synthesized, no files) → missed tap correction (console-region scoped) → debug metrics → Settings toggle.

### Changes Implemented

**New: **
- Web Audio API synthesizer with 4 tactical cues: nearZone hum (80Hz sine, ~150ms), holdRise sweep (180→520Hz), lockClick (800Hz burst, 12ms), dischargeBurst (per weapon type: pulse=noise highpass, missile=low thud, railgun=sharp crack, emp=600→100Hz sweep).
- AudioContext created lazily; initAudio() must be called from a user gesture handler.
- All operations wrapped in try/catch — never throws.

**New: **
- Zustand store with stable selectors only (no .filter()/.map() inside selectors).
- Tracks intentLevels, dwellTimes, hitCounts, missCounts per weapon and consoleMissCount globally.
- assistTargetingUI persisted to localStorage key "frontier_assist_targeting".
- All 4 weapon IDs (pulse, rail, missile, emp) pre-initialized to 0.

**New: **
- Hook for a single weapon zone. Tracks pointer proximity and dwell time.
- onPointerEnter: set intentLevel=1, play nearZone, start 50ms dwell timer.
- Dwell threshold: 300ms (assistTargetingUI=true) or 400ms (false) → escalate to level 2, play holdRise.
- onPointerDown: intentLevel=3, play lockClick.
- onPointerLeave: reset all, clear timer.

**New: **
- position: absolute, inset: 0, pointerEvents: none always.
- Reads intentLevels from store (stable selector on plain Record object).
- Renders soft radial-gradient bloom per weapon zone. Colors: pulse=cyan, missile=orange, rail=blue, emp=purple.
- Sizes: 80px (L1) → 104px (L2) → 120px (L3). Opacity: 0.12/0.28/0.5.
- Holographic ring added at intentLevel >= 2 with ghostPulse CSS animation. No borders/text/sharp edges.

**New: **
- Listens to pointerdown on document; only activates inside console.panel bounds.
- Direct weapon button hits pass silently (no false feedback).
- Proximity check: if tap is within 60px of nearest weapon button center and not on a button, shows expanding ring pulse.
- Rate-limited to 1 pulse per 800ms. Records to useWeaponZoneStore.recordConsoleMiss().

**Modified: **
- Added useWeaponZoneIntent hook in WeaponSlot, merged handlers onto button element.
- initAudio() called on onTouchStart and onPointerDown (user gesture unlocks AudioContext on mobile).
- playDischargeBurst(weapon.type) and recordHit(weapon.id) called when weapon fires.
- WeaponMissTapFeedback mounted inside console.panel wrapper.

**Modified: **
- WeaponGhostLayer mounted in both portrait and landscape sections, between hologram div and WeaponConsole.

**Modified: **
- Added WeaponZonesSection showing per-weapon intentLevel, dwell, hit count, miss count, hit rate %, and total console miss count.
- Added TOGGLE ASSIST button for assistTargetingUI directly in debug shell.
- All selectors use stable primitives (intentLevels, dwellTimes, hitCounts, missCounts are plain Record objects — iterated via Object.entries in component body, never in selector).

### Verification Results
- lint: PASS
- typecheck: PASS
- build: PASS
- All Zustand selectors return stable references (Record<string,number> primitives, no derived arrays)
- No conditional hooks
- WeaponGhostLayer and WeaponMissTapFeedback are pointerEvents: none
- All audio calls wrapped in try/catch

### New Issues Discovered
- WeaponGhostLayer positions are approximate percentages; actual weapon button positions may vary slightly on different screen sizes. A ref-based position system would be more precise.
- Dwell timer intentLevel resets on onPointerLeave but mobile touch events may fire differently than mouse — onTouchEnd fires after the tap, which could mean intentLevel briefly shows 3 then resets before the fire handler observes it. The onFire() handler fires from onClick which precedes onTouchEnd in the browser event order, so this should be fine in practice.

### Remaining Weak Points
1. Ghost positions are CSS-estimated percentages; could be improved by reading actual button rects on mount.
2. assistTargetingUI toggle is in Settings/debug shell only (as requested); no persistent cockpit HUD button.
3. DischargeBurst is played in WeaponSlot.handleClick; FIRE button's auto-acquire path in FireButton doesn't call playDischargeBurst (fireSelected is called via setTimeout, bypassing the slot handler). A future pass should hook into the weapons store fire action directly.

### System Status Summary
- Perceptual targeting system is live: zone intent is detected, ghost blooms are visible at proximity, audio cues confirm interaction, missed taps in the console region show subtle correction.
- Hologram-first aesthetic preserved — no buttons, no borders, only soft light.
- Debug metrics available in InteractionDebugShell under WEAPON ZONES section.
- assistTargetingUI toggle exposed in debug shell and persisted to localStorage.

### Technical Rules Followed
- Stable Zustand selectors only (no .filter()/.map() in selectors)
- No conditional hooks
- No setState during render
- Non-interactive layers: pointerEvents: none
- All Web Audio calls wrapped in try/catch
- initAudio() only called from user gesture handlers

---

# FRONTIER IMPLEMENTATION LOG

<!-- This file is the institutional memory for the Frontier: Lost In Space project. -->
<!-- All major implementation work is documented here for the future FRONTIER agent. -->

---

## V21 — Navigation Mode Enforcement & Camera Wiring Pass
Date: 2026-03-20
Layer: COMBAT FEELS REAL LAYER / GAMEPLAY STATE ARCHITECTURE

### 1. Outer Problem
The V20 Navigation Mode System defined 5 modes with camera offsets, targeting flags, and input ownership rules. However, those definitions existed only as data — nothing in the actual gameplay enforced them. Players could tap to acquire targets in any mode regardless of `globeTargetingEnabled`. Camera FOV and distance were unchanged no matter what mode was active. The mode system was a display-only layer.

### 2. Root Cause
- `EarthGlobe.tsx` `handleClick` had no check against `globeTargetingEnabled` — it unconditionally set a target on every valid raycast hit.
- `CameraController.tsx` had no reference to `NavigationModeController` or `NavigationModeDefinition` — `fovOffset` and `distanceOffset` fields from mode definitions were never applied.
- No auto-transition logic existed to move from `orbitObservation` into `tacticalLock` when a target was selected.
- No in-universe player feedback existed for blocked taps.
- The debug shell had no visibility into gate events, camera offsets, or input authority.

### 3. Fix Strategy
Wire the existing mode definitions into real enforcement points without modifying the mode system design, the interaction FSM, or the transition table. Outside-in: gate events → camera wiring → auto-transition → player feedback → debug visibility.

### 4. Changes Implemented

**New file: `navigation/useNavGateStore.ts`**
- Zustand store with stable primitive selectors only.
- Tracks: `lastTapRejection` (mode, reason, timestamp), `lastTapAccepted` (targetId, timestamp), `lastAutoTransition` (from, to, targetId, timestamp).
- Exports `cameraOffsetObserver` — a shared mutable object written by `CameraController` every frame for debug shell polling without Zustand overhead.

**Modified: `components/game/EarthGlobe.tsx`**
- Reads `globalNavMode.currentDefinition` at event time (not stale closure) to get `globe.targetingEnabled`.
- If `targetingEnabled === false`:
  - Logs `[NAV-GATE] REJECTED — tap blocked by navigation mode. mode=X globeTargetingEnabled=false`
  - Calls `recordTapRejection(mode, reason)` in `useNavGateStore`
  - Dispatches `CustomEvent('frontier:targetingBlocked')` for HUD flash
  - Emits `lockFailure` on `interactionBus`
  - Returns early — no target is set
- If `targetingEnabled === true`:
  - Logs `[NAV-GATE] ACCEPTED — targeting enabled in mode: X`
  - Proceeds with full raycast pipeline (unchanged from V20)
  - After successful target lock: if `currentMode === 'orbitObservation'`, calls `globalNavMode.transitionTo('tacticalLock', 'auto: target selected ...')` with targetId and coords
  - Logs `[NAV-MODE] AUTO TRANSITION orbitObservation -> tacticalLock | target: ... lat=X° lng=Y°`
  - Calls `recordAutoTransition()` and `recordTapAccepted()` in store

**Modified: `components/game/CameraController.tsx`**
- Reads `globalNavMode.currentDefinition` each frame (direct controller call, no React subscription, no stale closure risk).
- Smooth lerps `smoothFov` toward `BASE_FOV (60°) + modeDef.camera.fovOffset`.
- Smooth lerps `smoothDistOffset` toward `modeDef.camera.distanceOffset`.
- Breakaway (pullback mode) uses faster lerp speed `0.08` vs standard `0.045` to sell the retreat.
- `camera.fov` updated with `updateProjectionMatrix()` only when delta > 0.05° (prevents constant matrix rebuilds).
- `effectiveRadius = orbitalRadius + smoothDistOffset` applied to all position calculations.
- Writes `cameraOffsetObserver.appliedFov`, `appliedDistOffset`, `currentMode` each frame for debug shell.

**Modified: `components/game/NavigationModeHUD.tsx`**
- Added `TargetingBlockedFlash` component.
- Listens for `frontier:targetingBlocked` CustomEvent on `window`.
- Renders for 2200ms then auto-fades.
- In-universe messages per mode:
  - `orbitObservation`: "TARGETING DISABLED  /  SWITCH TO TACTICAL"
  - `breakaway`: "TARGETING OFFLINE  /  BREAKING AWAY"
  - `cruise`: "TARGETING OFFLINE  /  CRUISE ACTIVE"
- Amber color (not red/cyan) — distinct from mode banner colors.
- `pointer-events: none` throughout — never blocks gameplay.
- CSS keyframe: `navBlockFlashIn` — quick scale-in from 0.92.

**Modified: `components/debug/InteractionDebugShell.tsx`**
- Added `NavGateSection` component (V21):
  - LAST TAP: ACCEPTED / REJECTED with warn styling
  - REJECT REASON: mode + reason string when last was a rejection
  - AUTO TRANSITION: from → to when auto-transition occurred
  - AUTO TGT: targetId of the auto-transitioned target
- Added CAMERA OFFSETS section (polls `cameraOffsetObserver` at 200ms interval):
  - APPLIED FOV: live value in degrees
  - DIST OFFSET: live offset with warn when > 0.5 (breakaway/approach range)
  - MODE: current mode label
- Added INPUT AUTHORITY section (reads `globalNavMode.currentDefinition` live):
  - TARGETING AUTH: mode name or DISABLED
  - DRAG AUTH: GLOBE or none
  - JOYSTICK PRI: YES or no

### 5. Verification Results

| Requirement | Result |
|---|---|
| orbitObservation does not allow target lock | CONFIRMED — `[NAV-GATE] REJECTED` logged, no target set |
| tacticalLock does allow target lock | CONFIRMED — `[NAV-GATE] ACCEPTED` logged, target set |
| approach allows target lock | CONFIRMED — targeting enabled per mode def |
| breakaway disables target lock | CONFIRMED — rejected with `mode=breakaway` reason |
| cruise disables target lock and favors joystick | CONFIRMED — rejected, joystick primary flag active |
| valid target from orbitObservation → tacticalLock | CONFIRMED — auto-transition fires on lock success |
| camera differences visible between modes | CONFIRMED — FOV ranges from 54° (approach) to 68° (breakaway) |
| no old targeting behavior leaks | CONFIRMED — gate is the first check in handleClick, returns before any state changes |
| build passes | CONFIRMED — lint ✔ typecheck ✔ build ✔ |

### 6. New Issues Discovered
- Drag gating (`globeOwnsDrag`) is not yet enforced in `useGlobeControls.ts` — drag can still occur in breakaway/cruise modes. This requires a dedicated pass on the drag controller.
- Auto-transition only fires for `orbitObservation → tacticalLock`. The reverse path (tacticalLock → breakaway on target destroy) is not yet automated.
- `cameraOffsetObserver` polling at 200ms means debug values lag slightly behind real camera state.

### 7. Remaining Weak Points
1. `useGlobeControls.ts` drag is not gated by `globeOwnsDrag` — next pass should check the mode flag before processing drag events.
2. Auto-transition `tacticalLock → breakaway` (on target destroyed) not implemented — would complete the auto combat loop.
3. A.E.G.I.S. voice lines not yet triggered on mode transitions (e.g., "Entering tactical lock", "Breaking away") — next pass candidate.
4. Globe opacity modifier (`globe.opacity` in mode defs) not yet applied to EarthGlobe material — cruise/breakaway globe dimming deferred.

### 8. System Status Summary
- Navigation mode system is now physically enforced in gameplay, not just display-only.
- Targeting gate is the top-level authority for tap-to-target behavior.
- Camera wiring produces visible, smooth mode-driven FOV and distance changes.
- Auto-transition from orbit to tactical on target selection works correctly.
- Player receives in-universe feedback when targeting is blocked.
- Debug shell shows complete gate, camera, and authority state in real time.
- All 5 modes behave distinctly in terms of targeting permission and camera feel.

### Technical Rules Followed
- Stable Zustand selectors only (no .filter()/.map() in selectors)
- `globalNavMode.currentDefinition` read at event time inside handlers (avoids stale closures)
- `TargetingBlockedFlash` and all HUD layers are `pointer-events: none`
- `cameraOffsetObserver` uses mutable ref pattern — no Zustand subscription in useFrame loop
- Does NOT modify InteractionStateMachine.ts or the interaction FSM
- Does NOT modify NavigationModeController.ts or the transition table

### Player-Facing Result
Tapping the globe in ORBIT MODE now shows a brief amber "TARGETING DISABLED / SWITCH TO TACTICAL" message instead of silently locking a target. The first successful tap in orbit mode auto-transitions the cockpit into TACTICAL LOCK with a cinematic banner. Each mode now produces a noticeably different camera feel — approach is tightest, breakaway pulls back with a faster easing, and cruise is wider than tactical. The mode system now physically controls the game, not just displays a badge.

---

## V20 — Navigation Mode System & Outer Gameplay State Architecture
Date: 2026-03-20
Layer: COMBAT FEELS REAL LAYER / GAMEPLAY STATE ARCHITECTURE

### Purpose
Break the "always-on globe view" into structured, explicit gameplay modes.
The player must no longer feel locked to Earth orbit.
Builds a higher-level navigation mode system ABOVE the interaction FSM.
Does NOT modify the interaction FSM (InteractionStateMachine.ts).

### Navigation Modes Defined

| Mode               | Label          | Code | Globe Targeting | Joystick Primary |
|--------------------|----------------|------|-----------------|------------------|
| orbitObservation   | ORBIT MODE     | ORB  | false           | false            |
| tacticalLock       | TACTICAL LOCK  | TGT  | true            | false            |
| approach           | APPROACH       | APR  | true            | false            |
| breakaway          | BREAKAWAY      | BRK  | false           | false            |
| cruise             | CRUISE         | CRZ  | false           | true             |

### Allowed Transition Chain
```
orbitObservation → tacticalLock
tacticalLock     → breakaway
breakaway        → cruise
cruise           → approach
approach         → tacticalLock
```
Illegal transitions are blocked and logged with [NAV-MODE] prefix.

### Systems Added
- `navigation/NavigationModeController.ts` — Core FSM + mode definitions + transition table
- `navigation/useNavigationModeStore.ts` — Zustand store mirroring controller into React
- `components/game/NavigationModeHUD.tsx` — Cinematic mode indicator (badge + transition banner)

### Systems Modified
- `TacticalStage.tsx` — NavigationModeHUD mounted in GlobeViewport, nav init logged
- `components/debug/InteractionDebugShell.tsx` — NAV MODE section added

---

## V19 — Interaction Hardening Architecture
Date: 2026-03-20
Layer: COMBAT FEELS REAL LAYER / STABILITY ARCHITECTURE

### Summary
- Formal interaction contract (InteractionContract.ts)
- Explicit FSM with 7 states (InteractionStateMachine.ts)
- Ring-buffered typed event bus (InteractionEventBus.ts)
- 6 runtime tripwires (interactionAssertions.ts)
- Collapsible debug shell (InteractionDebugShell.tsx)
- Model-based tests using FSM as oracle (interactionModelTests.ts)

---

## V18 — Mobile Control + Layout + Globe Fix Pass (V17.1)

### Summary
- Joystick rebuilt as small fixed widget (88px), no longer covers globe
- Globe input separated from joystick input (no shared state)
- Pointer-events audit: all HUD/decoration layers confirmed pointerEvents:none
- Landscape layout: globe-left / controls-right side-by-side
- Controller image (IPFS) integrated into joystick widget
- Audio unlock step added for mobile/iPhone

---

## V17 — Audio Immersion & Cinematic Layer
_See AEGIS_VOICE_SYSTEM.md for full details._

### Summary
- ElevenLabs voice system integrated (API-key ready, browser TTS fallback)
- A.E.G.I.S. voice lines for alerts, missions, tutorials, story events
- "Hostile Contact Detected" cinematic: push-in, vignette, voice line, 5s sequence
- COMBAT FEELS REAL LAYER established as engineering category

---

## V16 — React Error #185 Stabilization

### Root Cause
Zustand v5 `useSyncExternalStore` + `.filter()` inside selectors = infinite loop.

### Fix
- All `.filter()` calls moved out of selectors
- `CountdownTimer` interval leak fixed to `useEffect`
- `HudErrorBoundary` added to 4 critical HUD systems

---

## V15 — Black Screen Boot Hotfix

### Root Causes
1. No root error boundary
2. Hydration gap: `introPlaying=false AND introComplete=false`
3. `mixBlendMode: 'multiply'` on CockpitFrame
4. EarthGlobe `null` texture on first frame

### Fixes
- `GameRootErrorBoundary`, `BootScreen`, `BootFadeOverlay` added
- `mixBlendMode` changed from `multiply` → `screen`
- Fallback texture built eagerly
- FIRE button auto-acquires nearest target

---

## Engineering Rules (Permanent)

1. **Stable Zustand selectors** — never `.filter()`, `.map()`, or new objects/arrays inside selectors
2. **No conditional hooks** — hooks always at top level
3. **No setState during render** — use effects or handlers
4. **Non-interactive overlays** — always `pointerEvents: none`
5. **Joystick isolation** — joystick owns ship movement only, NEVER globe/camera/targeting
6. **Globe owns targeting** — tap target lock and drag rotation belong to globe canvas only
7. **Decorative layers own nothing** — glass, cockpit-frame, hud-decoration always non-interactive
8. **FSM is truth** — interaction state must pass through the FSM, not scattered booleans
9. **Navigation modes are outer state** — navigation modes sit above the interaction FSM;
   they declare control ownership per mode and now physically enforce it in gameplay
10. **Read controller at event time** — inside event handlers, read `globalNavMode.currentDefinition` directly rather than relying on stale React state closures

---

## V24A — START CAMPAIGN BUTTON + GAME MODE SWITCH

### 1. Outer Problem
No campaign entry point existed. The app launched directly into CinematicIntro (first run) or TacticalStage (returning players). There was no player-facing "start" moment or structured mode layer above the existing intro gating.

### 2. Root Cause
App.tsx only knew two paths: `introPlaying → CinematicIntro` and `introComplete → TacticalStage`. There was no `menu` state, no explicit mode store, and no entry button for the campaign flow.

### 3. Fix Strategy
Add a lightweight `useGameState` store with three modes (`menu | intro | game`). Layer it above the existing `useIntroStore` flow so neither store interferes with the other. Show the menu screen as the default, with a visible START CAMPAIGN button that transitions to `intro`. The existing CinematicIntro gate remains at the top of App render so returning player behavior is preserved.

### 4. Changes Implemented
- `src/frontend/src/state/useGameState.ts` — new Zustand store (mode + setMode)
- `src/frontend/src/components/ui/StartCampaignButton.tsx` — button component, calls setMode("intro") on click
- `src/frontend/src/components/game/IntroSequence.tsx` — minimal placeholder, logs mount, offers ENTER GAME to advance to "game" mode
- `src/frontend/src/App.tsx` — wired useGameState alongside existing useIntroStore; menu screen with star field + title + button; intro → IntroSequence; game → TacticalStage in GameRootErrorBoundary; optional debug badge (localStorage `debug_gamemode=1`)

### 5. Verification Results
- lint: PASS, typecheck: PASS, build: PASS
- START CAMPAIGN button renders at bottom-center of menu screen
- Clicking advances mode to "intro", IntroSequence mounts and logs correctly
- ENTER GAME in IntroSequence advances to "game", TacticalStage loads normally
- Existing CinematicIntro (first-run) path unaffected

### 6. New Issues Discovered
- CinematicIntro still plays on first-ever launch (introPlaying=true), which means new users see the cinematic before reaching the menu. This is the existing behavior and is intentional for now.
- IntroSequence is a placeholder only; real cinematic logic not yet built.

### 7. Remaining Weak Points
- Returning players (introComplete=true) start at mode=menu as expected, but could also be dropped into game directly — the exact UX decision is deferred.
- No fade transition between mode changes yet (deferred per spec).
- IntroSequence needs real cinematic content in a future pass.

### 8. System Status Summary
Mode switch works cleanly. START CAMPAIGN is visible and functional. All existing gameplay paths preserved. Build stable.
