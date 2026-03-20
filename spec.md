# Frontier - Lost In Space

## Current State

The app is a React + Three.js spacecraft cockpit game with:
- `systems/ElevenVoice.ts` — hybrid TTS router (ElevenLabs + browser TTS fallback). Graceful no-key fallback exists. No queue/priority/interrupt system.
- `audio/aegisVoice.ts` — minimal browser TTS wrapper (unused path)
- `alerts/useAlertsStore.ts` — alert/degradation system with templates. No voice calls.
- `missions/useMissionsStore.ts` — mission/log/campaign store. No voice calls.
- `story/useStoryStore.ts` — Phase 1 story events with A.E.G.I.S. dialogue. No voice calls.
- `tutorial/useTutorialStore.ts` — step-based tutorial state machine. No voice calls.
- `combat/useEnemyStore.ts` — satellite/base enemies, return fire, respawn. No cinematic triggers.
- `intro/CinematicIntro.tsx` — existing 26s cinematic intro using `speakEleven`. Pattern reference.
- No "Hostile Contact Detected" cinematic exists yet.
- Standing rule: Zustand selectors must return stable references. No `.filter()` or `.map()` inside selectors.

## Requested Changes (Diff)

### Add
- `systems/useAudioQueue.ts` — audio queue store with priority, interrupt handling, and per-category locks
- `systems/aegisVoiceLines.ts` — centralized A.E.G.I.S. voice line registry (all trigger keys + text strings)
- `components/cinematics/HostileContactCinematic.tsx` — "Hostile Contact Detected" cinematic: camera push-in via CSS transform, UI intensity change, target emphasis overlay, voice line, auto-returns to gameplay in 3–8s
- Wire voice trigger in `useAlertsStore.ts` — on `triggerAlert` and `resolveAlert`
- Wire voice trigger in `useMissionsStore.ts` — on `completeMission` and mission start
- Wire voice trigger in `useStoryStore.ts` — on each Phase 1 event trigger
- Wire voice trigger in `useTutorialStore.ts` — on each step advance
- Wire hostile contact cinematic in `useEnemyStore.ts` — on first enemy spawn / respawn wave
- Mount `HostileContactCinematic` in `TacticalStage.tsx`

### Modify
- `systems/ElevenVoice.ts` — integrate with `useAudioQueue` for queue/priority/interrupt; keep all existing fallback logic intact
- `systems/useShipSystemsStore.ts` — add voice call on critical subsystem degradation (if not already present)

### Remove
- Nothing removed. `audio/aegisVoice.ts` kept as-is (legacy path, not breaking anything).

## Implementation Plan

1. **`systems/aegisVoiceLines.ts`** — registry of all trigger keys mapped to voice line text. Categories: `alert`, `mission`, `story`, `tutorial`, `combat`, `cinematic`. Includes `hostile_contact_detected` key.

2. **`systems/useAudioQueue.ts`** — Zustand store:
   - Queue of `{ id, text, eventKey, priority, interruptible }` items
   - Priority levels: `CRITICAL=4`, `HIGH=3`, `NORMAL=2`, `LOW=1`
   - `enqueue(item)` — inserts by priority, dedupes by eventKey
   - `interrupt(item)` — stops current, plays immediately
   - `processNext()` — pops highest priority item, calls `speakHybrid`, marks playing
   - `onVoiceComplete()` — advances queue
   - No `.filter()` or `.map()` in selectors

3. **`systems/ElevenVoice.ts`** — replace direct `speakHybrid` calls in stores with `enqueue`/`interrupt` from the queue. Keep ElevenLabs fetch + fallback logic unchanged.

4. **Store wiring (alerts/missions/story/tutorial)** — each store action that should trigger voice calls `enqueueVoice(eventKey, text, priority)` after its state mutation. Never inside selectors.

5. **`components/cinematics/HostileContactCinematic.tsx`**:
   - Triggered by `useCinematicStore` flag `hostileContactActive`
   - Renders as `position: absolute` overlay inside existing viewport (no viewport takeover)
   - Phase 1 (0–0.5s): target highlight ring appears on active enemy position
   - Phase 2 (0.5–2s): viewport container gets a subtle scale(1.04) + translateY(-8px) push-in via CSS transition
   - Phase 3 (0.5s): UI intensity boost — alert bar glows brighter, reticle sharpens, vignette deepens
   - Phase 4 (1s): A.E.G.I.S. voice line fires via `interrupt()` — "Hostile contact detected. Weapons free."
   - Phase 5 (3–5s): camera eases back to normal transform
   - Phase 6 (5–8s): cinematic flag clears, full player control restored
   - Returns cleanup function on unmount

6. **`useEnemyStore.ts`** — on first satellite activation (session start) and on enemy respawn wave, set `hostileContactActive = true` in cinematic store.

7. **`TacticalStage.tsx`** — mount `<HostileContactCinematic />` inside the viewport container. Apply camera transform to viewport wrapper div based on cinematic store state.
