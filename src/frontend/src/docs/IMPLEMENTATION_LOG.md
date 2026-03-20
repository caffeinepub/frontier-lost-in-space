# FRONTIER IMPLEMENTATION LOG

<!-- This file is the institutional memory for the Frontier: Lost In Space project. -->
<!-- All major implementation work is documented here for the future FRONTIER agent. -->

---

## V19 — Interaction Hardening Architecture
Date: 2026-03-20
Layer: COMBAT FEELS REAL LAYER / STABILITY ARCHITECTURE

### Purpose
Convert the globe/HUD/joystick system from ad hoc boolean-driven behavior to a
formally modeled, observable, regression-resistant interaction system.

This is a research-grade stability pass. No visual changes. All hardening is architectural.

### Systems Changed
- `interaction/` (new directory):
  - `InteractionContract.ts` — Formal ownership rules for all input layers
  - `InteractionStateMachine.ts` — Explicit FSM with 7 states and logged transitions
  - `InteractionEventBus.ts` — Ring-buffered typed event bus (50 events, subscribable)
  - `interactionAssertions.ts` — 6 runtime tripwires for architecture violations
  - `useInteractionStore.ts` — Zustand store mirroring FSM state + bus events
- `components/debug/` (new):
  - `InteractionDebugShell.tsx` — Collapsible real-time debug panel (DEV or debug_shell=1)
- `tests/interactionModelTests.ts` (new) — 7 model-based test paths using FSM as oracle
- `motion/useGlobeControls.ts` — Scoped to canvas element, emits to bus, tap/drag classification
- `components/game/EarthGlobe.tsx` — Structured event emission on tap/lock/miss
- `components/game/MobileJoystick.tsx` — Structured event emission, FSM transitions
- `tests/smokeTests.ts` — 6 new globe checks + runInteractionSystemTests() suite
- `TacticalStage.tsx` — Mounts InteractionDebugShell, runs tripwires on boot

### Technical Rules Followed
- Stable Zustand selectors only (no .filter()/.map() in selectors)
- No derived arrays/objects inside selectors
- Hook-safe component structure
- Pointer-events protected on all decorative layers
- Mobile-safe layout preserved
- FSM singleton shared across all systems
- Event bus ring buffer prevents memory leaks

### Player-Facing Result
No visible change to gameplay in production. In DEV mode or with `localStorage.debug_shell=1`:
- A collapsible tactical debug shell appears (bottom-right)
- Shows FSM state, pointer owner, last 10 events, raycast/lock results, assertions, smoke tests
- Tuning sliders for drag threshold, tap duration, reticle/lock sensitivity
- Run assertions and model tests on demand

Interaction regressions now surface immediately in the debug shell instead of silently
breaking targeting. State machine makes it clear exactly which phase of interaction failed.

### Activation Instructions
- Debug shell: `localStorage.setItem('debug_shell', '1')` then reload
- Tripwire logs: always run on mount with [TRIPWIRE] prefix in console
- Model tests: click "MODEL TESTS" in debug shell, or import `runInteractionModelTests`
- Assertions: click "RUN ASSERTIONS" in debug shell

### Weak Points (Remaining)
- `useGlobeControls` canvas scoping uses `document.querySelector('canvas')` as best-effort
  target since Three.js Canvas ref exposure is limited from outside the Canvas context
- Model-based tests call `fsm.transition()` directly — not UI-driven automated tests
- Lat/lng mapping precision not tuned in this pass (Phase 9 deferred)
- No telemetry/replay integration yet (Phase 7 partial — bus is ready but no exporter)

### Deferred (Future Passes)
- Phase 9: Inner refinement (lat/lng mapping, raycast precision, reticle smoothing)
- Telemetry export from interactionBus
- UI-driven automated interaction tests (Playwright/Cypress)
- Lock confirmation sensitivity connected to reticle animation

### Relationship to Other Systems
- Feeds into COMBAT FEELS REAL LAYER: target lock is now measurable end-to-end
- Joystick isolation confirmed: V17.1 architecture enforced by interactionAssertions
- Globe targeting reliability: FSM makes stale locks and illegal transitions visible
- Future: state machine can gate weapon firing to only targetLocked state

---

## V18 — Mobile Control + Layout + Globe Fix Pass (V17.1)
_See conversation history for full details._

### Summary
- Joystick rebuilt as small fixed widget (88px), no longer covers globe
- Globe input separated from joystick input (no shared state)
- Pointer-events audit: all HUD/decoration layers confirmed pointerEvents:none
- Landscape layout: globe-left / controls-right side-by-side
- Controller image (IPFS) integrated into joystick widget
- Audio unlock step added for mobile/iPhone
- Cinematic start framing improved

---

## V17 — Audio Immersion & Cinematic Layer
_See AEGIS_VOICE_SYSTEM.md for full details._

### Summary
- ElevenLabs voice system integrated (API-key ready, browser TTS fallback)
- A.E.G.I.S. voice lines for alerts, missions, tutorials, story events
- "Hostile Contact Detected" cinematic: push-in, vignette, voice line, 5s sequence
- Audio priority queue with interrupt handling
- COMBAT FEELS REAL LAYER established as engineering category

---

## V16 — React Error #185 Stabilization

### Root Cause
Zustand v5 `useSyncExternalStore` + `.filter()` inside selectors = new array reference
every render = infinite loop = React Error #185.

### Fix
- All `.filter()` calls moved out of selectors (select raw array, filter in component body)
- `CountdownTimer` `useState(() => setInterval(...))` leak fixed to `useEffect`
- `HudErrorBoundary` added to 4 critical HUD systems
- Enhanced `console.error` intercept for future Error #185 detection

---

## V15 — Black Screen Boot Hotfix

### Root Causes
1. No root error boundary — any React throw = silent black screen
2. Hydration gap: `introPlaying=false AND introComplete=false` = nothing rendered
3. `mixBlendMode: 'multiply'` on CockpitFrame PNG – blacked out viewport
4. EarthGlobe `null` texture on first frame

### Fixes
- `GameRootErrorBoundary` added
- `BootScreen` + `storeReady` flag eliminate blank first frame
- `BootFadeOverlay` stays until Canvas fires first `useFrame` tick
- `mixBlendMode` changed from `multiply` → `screen`
- Fallback hex-grid texture built eagerly (never null)
- FIRE button auto-acquires nearest target (fixes NO TGT dead state)

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
