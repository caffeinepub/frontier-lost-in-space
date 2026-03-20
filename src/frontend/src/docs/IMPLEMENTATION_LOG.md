# FRONTIER — Implementation Log

This file is the canonical institutional memory for FRONTIER development.
Every major system, fix, or upgrade should be recorded here in the format below.
This log is intended to survive agent context resets and onboard future development passes.

---

## STANDING ENGINEERING RULES

These rules apply to ALL future work on FRONTIER without exception:

1. **Stable Zustand selectors only.** Never call `.filter()`, `.map()`, `.find()`, or any array/object transformation inside a Zustand selector. Doing so returns a new reference every render, triggering React Error #185 (infinite render loop via `useSyncExternalStore`). Always select raw state, then derive in the component body or in a local variable/`useMemo`.

2. **No conditional hooks.** Hooks must always be called in the same order, unconditionally.

3. **No setState during render.** Any state mutation in response to a value must be in a `useEffect`, not inline during render.

4. **Non-interactive overlay layers must not block canvas interaction.** Any cinematic or HUD overlay must use `pointerEvents: 'none'` unless it is explicitly an interactive UI element.

5. **Interactive gameplay systems must remain compatible** with targeting, firing, story overlays, tutorial overlays, and cinematic layers. No feature may break another.

6. **Mobile-first layout.** All UI and animation must be performant and readable on mobile devices. No layout shift caused by new features.

---

## SYSTEM LAYER TAXONOMY

All implementation work is tagged to a layer:

| Layer | Description |
|---|---|
| **COMBAT FEELS REAL LAYER** | Targeting, firing, hit feedback, armor pressure, hostile detection, scan escalation, A.E.G.I.S. threat callouts, tactical alerts, cockpit stress, combat logs, cinematic combat beats |
| **GLOBE & SPACE LAYER** | Earth globe, star field, parallax, orbital camera, cloud/atmosphere rendering |
| **COCKPIT LAYER** | Weapon console, holographic overlays, status strip, physical console surfaces |
| **MISSION & NARRATIVE LAYER** | Campaigns, missions, logs, story events, A.E.G.I.S. dialogue |
| **SHIP SYSTEMS LAYER** | Subsystem health, alerts, degradation, repair flows, ship state model |
| **STABILITY LAYER** | Error boundaries, boot path, React crash prevention, Zustand selector safety |
| **AUDIO LAYER** | ElevenLabs integration, voice queue, browser TTS fallback, priority/interrupt system |
| **ECONOMY LAYER** | Credits, purchases, market, owned parts, alert buy flows |

---

## LOG ENTRIES

---

### ENTRY V17-01

**Layer:** COMBAT FEELS REAL LAYER + AUDIO LAYER

**Title:** A.E.G.I.S. Voice System — Full Audio Immersion Integration

**Purpose:**
Audio immersion was previously deferred. This pass establishes it as a baseline system. A.E.G.I.S. now speaks during every major gameplay beat: alerts, mission updates, story events, tutorial steps, and the new "Hostile Contact Detected" cinematic moment. The goal is that the player always feels accompanied and under threat, not navigating a silent UI.

**Systems Affected:**
- `systems/ElevenVoice.ts` — voice routing and ElevenLabs API
- `systems/aegisVoiceLines.ts` — new voice line registry (30 lines, 6 categories)
- `systems/useAudioQueue.ts` — new priority queue store
- `systems/useCinematicStore.ts` — new cinematic trigger store
- `components/cinematics/HostileContactCinematic.tsx` — new cinematic overlay
- `alerts/useAlertsStore.ts` — voice wired to triggerAlert and resolveAlert
- `missions/useMissionsStore.ts` — voice wired to mission complete and progress
- `story/useStoryStore.ts` — voice wired to all Phase 1 event triggers
- `tutorial/useTutorialStore.ts` — voice wired to each step advance
- `combat/useEnemyStore.ts` — session cinematic trigger added
- `TacticalStage.tsx` — viewportRef + cinematic mount + session init

**Technical Rules Followed:**
- Stable Zustand selectors only — no `.filter()` or `.map()` in selectors
- Queue deduplication uses a `for` loop on raw array, not `.find()` or `.filter()`
- `HostileContactCinematic` uses `pointerEvents: none` — canvas interaction fully preserved
- All timers cleaned up in `useEffect` return functions
- `speakHybrid` return type fixed to `Promise<void>` for queue chain compatibility
- ElevenLabs key is optional — all calls fall back to browser TTS if key is absent
- Hook-safe: no conditional hooks, no setState during render
- Mobile-safe: cinematic overlay is layout-inert (absolute positioning, no layout shift)

**Audio Architecture:**
```
enqueueVoice(key)        → useAudioQueue.enqueue()   → sorted by priority
interruptVoice(key)      → useAudioQueue.interrupt()  → stops current if interruptible
                                                         ↓
                               useAudioQueue.processNext()
                                         ↓
                            speakHybrid(text, eventKey)
                             ↙                    ↘
              PREMIUM event?                   LOCAL fallback
          speakEleven() via                  SpeechSynthesis
          ElevenLabs API                     (always available)
```

**Priority Levels:**
| Level | Value | Used For |
|---|---|---|
| CRITICAL | 4 | Reactor instability, hull breach, hostile contact, story events |
| HIGH | 3 | Most alerts, mission events, tutorial complete |
| NORMAL | 2 | Tutorial steps, progress, scan complete |
| LOW | 1 | Reserved for ambient/informational |

**Cinematic: "Hostile Contact Detected"**
- Fires once per session, 1.5s after mount
- 5-second total sequence:
  - 0–0.5s: camera push-in (scale 1.04, translateY -6px, 0.8s cubic-bezier transition)
  - 0.5s: `interruptVoice('hostile_contact_detected')` fires — A.E.G.I.S. says "Hostile contact detected. Weapons free."
  - 0.5–3.5s: red vignette, scan line overlay, HOSTILE CONTACT alert banner, corner target brackets visible
  - 3.5s: camera eases back to neutral (1.2s cubic-bezier)
  - 5s: cinematic clears, full player control restored
- Does NOT take over the viewport — pointer events pass through, combat remains active

**Player-Facing Result:**
The player now hears A.E.G.I.S. speak in response to what is happening. Alerts are announced. Mission completions are confirmed. Story events carry narrative weight through voice. The tutorial feels guided. On session start, a brief cinematic moment announces the first hostile contact with voice, UI tension, and a subtle camera push. The game feels alive and inhabited.

**ElevenLabs Configuration:**
```
VITE_ELEVEN_API_KEY=<your_key>    # Optional. Falls back to browser TTS if absent.
VITE_ELEVEN_VOICE_ID=<voice_id>   # Optional. Defaults to JBFqnCBsd6RMkjVDRZzb
```

**Known Constraints:**
- Browser TTS voice quality varies by device/OS. On mobile, it may sound robotic.
- ElevenLabs API requires CORS-safe access. Key must be env-injected at build time.
- The `PREMIUM_EVENTS` set in `ElevenVoice.ts` controls which events use ElevenLabs vs. browser TTS. Add keys to this set when a new event warrants premium voice.

**Future Expansion Paths:**
- Add more cinematic moments: orbital entry, armor breach, mission complete, anomaly reveal
- Expand `PREMIUM_EVENTS` set as more high-impact events are defined
- Add subtitle rendering for accessibility (useSubtitleStore is already wired in ElevenVoice.ts)
- Add voice cooldown per-category (e.g. alerts don't fire more than once per 30s for same system)
- Add ambient A.E.G.I.S. idle commentary triggered by low activity timers
- Add scan-to-threat escalation: scan → anomaly detected → voice escalates over 3 lines

**Bugs Encountered / Fixed:**
- `speakHybrid` was returning `void` — the local TTS path did not return a promise. Fixed to return `Promise<void>` with `Promise.resolve()` on the synchronous branch, enabling `.finally()` chaining in the queue processor.

---

## PATTERN LIBRARY: COMBAT FEELS REAL

This section accumulates reusable patterns from the COMBAT FEELS REAL layer.
When building a new combat beat, reference these.

### Pattern: Priority Voice Interrupt
```ts
// Use when a critical event must override whatever is playing
import { interruptVoice } from '../systems/useAudioQueue';
interruptVoice('hostile_contact_detected');
// Only interrupts if currentlyPlaying.interruptible === true
// Otherwise waits in queue at front position
```

### Pattern: Cinematic Overlay (In-Scene)
```tsx
// Never use a separate renderer. Always use position: absolute over existing scene.
// Pass viewportRef from TacticalStage to animate the camera via CSS transform.
// Keep pointerEvents: none on all non-interactive cinematic layers.
// Use cubic-bezier easing for push-in/out — not linear, not bounce.
// Total duration: 3–8 seconds. Always auto-clear via setTimeout + useRef guard.
```

### Pattern: Zustand Selector Safety
```ts
// WRONG — creates new array reference every render:
const active = useStore(s => s.alerts.filter(a => a.severity === 'CRITICAL'));

// CORRECT — stable selector, derive in component:
const alerts = useStore(s => s.alerts);
const criticalAlerts = [];
for (let i = 0; i < alerts.length; i++) {
  if (alerts[i].severity === 'CRITICAL') criticalAlerts.push(alerts[i]);
}
```

### Pattern: One-Shot Session Trigger
```ts
// Use a module-level flag (not React state) for things that should fire once per session
let _hasFired = false;
const triggerOnce = () => {
  if (_hasFired) return;
  _hasFired = true;
  // ... do the thing
};
```
