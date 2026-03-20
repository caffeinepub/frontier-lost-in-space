# A.E.G.I.S. Voice System — Reference

This document describes the complete audio/voice architecture for FRONTIER.
Refer to this before adding new voice triggers, cinematic beats, or ElevenLabs calls.

## Architecture

```
Game Event (alert/mission/story/combat)
       ↓
enqueueVoice(key) or interruptVoice(key)
       ↓
useAudioQueue (Zustand priority queue)
       ↓
processNext() → speakHybrid(text, eventKey)
       ↓                      ↓
ElevenLabs API         Browser SpeechSynthesis
(if key + premium     (always available fallback)
event)
       ↓
onVoiceComplete() → processNext() [400ms gap]
```

## Voice Line Keys

All keys are defined in `systems/aegisVoiceLines.ts`.

| Key | Text | Priority | Category |
|---|---|---|---|
| `alert_oxygen_warning` | Warning. Oxygen recycler efficiency dropping... | HIGH | alert |
| `alert_shield_drift` | Shield frequency drift detected... | NORMAL | alert |
| `alert_cooling_loop` | Weapon cooling loop blockage... | HIGH | alert |
| `alert_missile_jam` | Missile rack jam detected... | HIGH | alert |
| `alert_reactor_instability` | Reactor instability detected... | CRITICAL | alert |
| `alert_hull_breach` | Hull breach detected in forward section... | CRITICAL | alert |
| `alert_resolved` | Alert resolved. System returning to nominal. | NORMAL | alert |
| `mission_start` | New mission objective received... | HIGH | mission |
| `mission_complete` | Mission complete. All objectives achieved... | HIGH | mission |
| `mission_progress` | Mission progress updated... | NORMAL | mission |
| `story_systems_damaged` | Multiple systems damaged... | HIGH | story |
| `story_oxygen_critical` | Oxygen levels critical... | CRITICAL | story |
| `story_aegis_contact` | A.E.G.I.S. online. Tactical interface synchronized... | HIGH | story |
| `story_hull_breach` | Hull integrity below fifty percent... | CRITICAL | story |
| `story_first_threat` | Threat confirmed. Combat protocols engaged. | HIGH | story |
| `story_survival_choice` | Commander, we have limited options... | HIGH | story |
| `story_stabilized` | All critical systems stabilized. Phase one complete. | HIGH | story |
| `tutorial_intro` | Welcome, Commander. I am A.E.G.I.S... | NORMAL | tutorial |
| `tutorial_movement` | Use the navigation controls... | NORMAL | tutorial |
| `tutorial_scan` | Initiate a scan to identify contacts... | NORMAL | tutorial |
| `tutorial_target` | Tap a contact on the tactical display... | NORMAL | tutorial |
| `tutorial_lock` | Target acquired. Confirm lock-on... | NORMAL | tutorial |
| `tutorial_fire` | Weapons hot. Select a weapon system... | NORMAL | tutorial |
| `tutorial_radar` | Monitor your radar for incoming threats. | NORMAL | tutorial |
| `tutorial_control_panel` | Access the command panel... | NORMAL | tutorial |
| `tutorial_complete` | Tutorial complete. You are cleared for full tactical operations. | HIGH | tutorial |
| `hostile_contact_detected` | Hostile contact detected. Weapons free. | CRITICAL | cinematic |
| `target_destroyed` | Target eliminated. | NORMAL | combat |
| `incoming_fire` | Incoming fire. Shields engaged. | HIGH | combat |
| `scan_complete` | Scan complete. Contacts logged. | NORMAL | combat |

## Adding a New Voice Line

1. Add entry to `AEGIS_VOICE_LINES` in `systems/aegisVoiceLines.ts`
2. Call `enqueueVoice('your_key')` or `interruptVoice('your_key')` from the relevant store action
3. If it should use ElevenLabs (premium quality), add the key to `PREMIUM_EVENTS` in `systems/ElevenVoice.ts`
4. Document the new key in this file

## ElevenLabs Configuration

```
VITE_ELEVEN_API_KEY=<your_key>
VITE_ELEVEN_VOICE_ID=<voice_id>   # defaults to JBFqnCBsd6RMkjVDRZzb
```

Without `VITE_ELEVEN_API_KEY`, all voice falls back to browser `SpeechSynthesis` automatically. No errors. No blocked gameplay.

## Priority Queue Rules

- CRITICAL (4): Interrupts interruptible lines. Fires at front of queue.
- HIGH (3): Queued ahead of NORMAL and LOW.
- NORMAL (2): Standard queue position.
- LOW (1): Deferred until all higher-priority lines complete.
- `interruptible: false` lines cannot be interrupted mid-play, but can be displaced in queue by CRITICAL.

## Cinematic Voice Integration

For cinematic moments, always use `interruptVoice()` not `enqueueVoice()`. Cinematics have visual timing tied to voice playback and should not wait behind queued lines.
