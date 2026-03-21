# Frontier Implementation Log

---

## V27 — Intro Event Engine + Spreadsheet Import + CEP/Memory/Narrator Integration
**Date:** 2026-03-20

### 13.1 Outer Problem
The player had no authored opening. The game’s 10 intro narrative events existed in code but were spread
across phases without a controlled ordering system. There was no locked sequence, no way to ensure events
fired in cinematic order, and no connection between player choices and persistent memory. The adaptive
event pool was conceptually present but not wired. The intro felt like scattered prompts, not a directed experience.

### 13.2 Root Cause
The existing `IntroPhaseController` fired all events for a phase simultaneously when that phase started,
relying only on `phaseTrigger` matching. There was no `introIndex` on events, no engine tracking sequence
progress, no adaptive lock, and no memory recording. The player memory system from V26 was missing from
the working tree entirely (no `memory/` directory found).
The Excel spreadsheet could not be parsed in the browser build environment — no xlsx library was present
and the IPFS-delivered binary could not be read at build time.

### 13.3 Fix Strategy
Worked outside → inside:
1. Defined the player experience target: 15 cinematic events in locked order, each remembered.
2. Created `introEventCatalog.ts` as the authoritative runtime source, converting all 15 events to
   typed `GameEvent[]` with `introIndex`, `tags`, authored CEP curves, narrator + aegis lines.
   Preserved `importIntroEventsFromXlsx()` stub for future xlsx parser wiring.
3. Built `useIntroEventEngine.ts`: a Zustand store tracking sequence index, phase, completion, and
   adaptive unlock. Fires events phase-gated, one at a time, and marks `adaptiveUnlocked` on event 15.
4. Wired memory recording into `useNarrativeStore.selectChoice` via lazy async imports (no circular deps).
5. Modified `IntroPhaseController` to call `engine.onPhaseEnter(phase)` instead of dumping all phase
   events at once.
6. Added `INTRO ENGINE` and `PLAYER MEMORY` sections to the debug shell.

### 13.4 Changes Implemented

**New files:**
- `src/frontend/src/narrative/introEventCatalog.ts` — 15 ordered events (indexes 0–14), 5 phases,
  authored CEP escalation curve, xlsx import stub
- `src/frontend/src/intro/useIntroEventEngine.ts` — locked sequence engine (Zustand), phase-gating,
  index tracking, adaptive unlock, memory write status
- `src/frontend/src/memory/usePlayerMemoryStore.ts` — persisted player memory (`frontier_memory_v1`),
  8 trait scores, decision history (cap 200), tag-based trait inference

**Modified files:**
- `src/frontend/src/narrative/GameEvent.ts` — added `introIndex?: number`, `tags?: EventTag[]`
- `src/frontend/src/narrative/narrativeEvents.ts` — imports from intro catalog; keeps 5 adaptive
  phase-1 events; exposes `getAdaptiveEvents()` for post-intro pool
- `src/frontend/src/narrative/useNarrativeStore.ts` — auto-records decision to memory on
  `selectChoice`; notifies engine on `dismissEvent`; records event shown on `triggerEvent`
- `src/frontend/src/components/game/IntroPhaseController.tsx` — calls `engine.onPhaseEnter(phase)`
  per phase; engine controls event sequencing
- `src/frontend/src/components/debug/InteractionDebugShell.tsx` — new `IntroEngineSection` and
  `PlayerMemorySection` with all 11 debug fields

### 13.5 Verification Results
- Lint: PASS | Typecheck: PASS | Build: PASS
- 15 intro events compile as typed `GameEvent[]` with `introIndex` 0–14
- `importIntroEventsFromXlsx` stub present and callable; currently returns static catalog
- `useIntroEventEngine` initializes correctly; `introEventIndex` starts at 0
- `onPhaseEnter('INTRO_DRIFT')` fires event at index 0; `onEventDismissed` advances index
- `adaptiveUnlocked` remains `false` until index 14 event dismissed
- `usePlayerMemoryStore` persists to `frontier_memory_v1` across reloads
- Decision recording auto-fires on `selectChoice` without any per-panel wiring
- Debug shell shows INTRO ENGINE and PLAYER MEMORY sections when `debug_shell=1`
- CEP integration confirmed: `useCEPStore.recordInteraction` called per `cepDelta > 0`

### 13.6 New Issues Discovered
- The xlsx binary cannot be parsed without a Node-side xlsx library; the import stub is purely
  a placeholder until that is wired (see `introEventCatalog.ts` TODO comment)
- Phase timer duration and event completion are independent; if a player dismisses events slowly,
  the phase may advance before all phase events resolve. Minor for intro; monitor in testing.
- `voiceActive` flag in engine is not yet wired to TTS callbacks in `narrativeVoice.ts`;
  it will always show IDLE in debug. A `setVoiceActive` hook can be added to `speakAs` later.

### 13.7 Remaining Weak Points
- True xlsx parser not wired. Requires adding `xlsx` npm package and calling
  `importIntroEventsFromXlsx` at app boot.
- Backend persistence for memory is not live; currently `localStorage` only.
- Adaptive event pool handoff logic (`getAdaptiveEvents()`) is exposed but not yet wired to a
  post-intro event trigger controller.
- Player memory trait inference is heuristic (tag + cepDelta based); no semantic NLP yet.

### 13.8 System Status Summary

| System | Status |
|---|---|
| Start Campaign Flow | ✅ Working (V24A, unchanged) |
| Intro Sequence (15 events) | ✅ Locked sequence, phase-gated, engine-driven |
| Event Engine | ✅ useIntroEventEngine live; index, completion, adaptive unlock |
| CEP Integration | ✅ cepDelta applied per choice; LOG/SYSTEM traces active |
| Browser Voice | ✅ narratorLines + aegisLines, first-line-only policy, queue-safe |
| Memory / Decision History | ✅ Auto-recorded per choice; 8 traits; localStorage persisted |
| Event Pool Handoff | ⚠️ getAdaptiveEvents() ready; trigger controller not yet wired |
| Debug / Telemetry | ✅ INTRO ENGINE + PLAYER MEMORY in debug shell |

---

## V26 — Player Memory, Decision History, Event Pool
*(logged during V26 pass — memory files were not found in working tree at V27 start;
reimplemented as minimal system in V27)*

## V24A — START CAMPAIGN + Game Mode Switch
*(previously logged)*

## V23.1 — CEP 6-Level System
*(previously logged)*
