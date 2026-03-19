# FRONTIER — LOST IN SPACE
## Project Map, Sitemap & Architecture Reference

> Last updated: Structure Audit Pass — Version 4
> This document is the canonical reference for the project structure, player flow, and system responsibilities.

---

## 1. CURRENT STRUCTURE SUMMARY

The project is a TypeScript/React browser game using React Three Fiber for 3D, Zustand for state, and Tailwind for styling. The frontend lives in `src/frontend/src/`.

The structure is mostly organized — files are grouped by folder category — but a few issues remain:
- Some folders contain only 1–2 files and could be flattened later
- Four `dashboard/panels/` are live stubs (placeholder text only)
- `QaPanel.tsx` is a fully-built orphan, never mounted
- `ui-summary.json` is a documentation artifact not imported by any code

---

## 2. WHAT WAS REORGANIZED IN THIS PASS

| Action | Files |
|---|---|
| Deleted dead duplicate | `audio/ElevenVoice.ts` (orphan of `systems/ElevenVoice.ts`) |
| Deleted dead duplicate | `storage/StorageClient.ts` (orphan of `utils/StorageClient.ts`) |
| Deleted dead component | `components/game/WeaponDeck.tsx` (superseded by `WeaponControlDeck.tsx`) |
| No renames | All imports remain valid |

---

## 3. FINAL FOLDER / FILE STRUCTURE

```
src/frontend/src/
│
├── main.tsx                          # Vite entry point — mounts <App />
├── App.tsx                           # Root — renders CinematicIntro or TacticalStage
├── TacticalStage.tsx                 # Core game scene — orchestrates all game UI layers
├── GlobeCore.ts                      # Globe node positions (lat/lng → Vector3), NODE_IDS
├── config.ts                         # Environment config (StorageClient, backend URL)
├── types.ts                          # Shared TypeScript types
├── index.css                         # Global styles
├── ui-summary.json                   # Documentation artifact (not imported)
│
├── backend.ts                        # ICP actor client
├── backend.d.ts                      # Backend type declarations
├── declarations/
│   ├── backend.did.d.ts              # Candid type declarations
│   └── backend.did.js                # Candid JS bindings
│
├── intro/
│   ├── CinematicIntro.tsx            # Intro animation + skip flow
│   └── useIntroStore.ts              # Zustand — intro play/complete state
│
├── components/
│   ├── game/                         # All game-specific React components
│   │   ├── — COCKPIT / FRAME —
│   │   ├── CockpitFrame.tsx          # Outer cockpit shell SVG/HTML overlay
│   │   ├── CockpitAmbientFx.tsx      # Ambient glow/scan line effects on cockpit
│   │   ├── CockpitReticle.tsx        # Center reticle targeting indicator
│   │   ├── UpperCanopy.tsx           # Top cockpit canopy overlay
│   │   ├── LowerConsoleShell.tsx     # Lower console housing
│   │   ├── SideEnclosure.tsx         # Left/right cockpit side panels
│   │   ├── SideFrameDetails.tsx      # Decorative side frame detail elements
│   │   │
│   │   ├── — GLOBE / SCENE —
│   │   ├── EarthGlobe.tsx            # 3D Earth (R3F) — textures, nodes, click targeting
│   │   ├── GlobeErrorBoundary.tsx    # Error boundary wrapper for globe failures
│   │   ├── GlobeHitPulse.tsx         # Globe impact pulse ring animation
│   │   ├── SpaceBackground.tsx       # Starfield + dust particles (R3F)
│   │   ├── CameraController.tsx      # R3F camera that tracks ship orbital state
│   │   ├── CheckpointMarkers.tsx     # Mission checkpoint markers on globe
│   │   │
│   │   ├── — HUD / STATUS —
│   │   ├── PortraitStatusBar.tsx     # Top threat/status bar (portrait mode)
│   │   ├── VelocityIndicator.tsx     # Lower-left velocity/heading readout
│   │   ├── ShipStatusCards.tsx       # Ship health/shield/power status cards
│   │   ├── AirHandlerIndicator.tsx   # Life support / air handler HUD element
│   │   ├── RadarSystem.tsx           # Right-side radar sweep + blip system
│   │   ├── LeftPanel.tsx             # Left cockpit side panel content
│   │   ├── RightPanel.tsx            # Right cockpit side panel content
│   │   │
│   │   ├── — NAVIGATION / INPUT —
│   │   ├── BottomCommandNav.tsx      # Bottom navigation row (portrait)
│   │   ├── MobileJoystick.tsx        # Touch joystick for mobile movement
│   │   ├── RightDragZone.tsx         # Right-side drag zone for camera/look
│   │   ├── ShipMotionLayer.tsx       # DOM motion layer driven by sway engine
│   │   │
│   │   ├── — WEAPONS / COMBAT —
│   │   ├── WeaponControlDeck.tsx     # Active weapon deck UI (portrait + landscape)
│   │   ├── WeaponSlotHUD.tsx         # Weapon slot status badges (READY/RELOAD/etc)
│   │   ├── WeaponActionModule.tsx    # Weapon action/fire button module
│   │   ├── WeaponButton.tsx          # Individual weapon fire button primitive
│   │   ├── ProjectileSystem.tsx      # Projectile movement + lifecycle
│   │   ├── CombatEffectsLayer.tsx    # Combat visual effects orchestrator
│   │   ├── ImpactEffects.tsx         # 3D in-world impact VFX (R3F mesh)
│   │   ├── ImpactParticleOverlay.tsx # 2D DOM screen-space hit feedback overlay
│   │   ├── DestructionEffects.tsx    # Target destruction animations
│   │   ├── InterceptSystem.tsx       # Intercept/ABM logic + visualization
│   │   │
│   │   ├── — THREATS —
│   │   ├── AsteroidThreat.tsx        # Asteroid threat display + behavior
│   │   ├── ThreatManager.tsx         # Threat event manager + spawner
│   │   │
│   │   ├── — PANELS (full-screen) —
│   │   ├── CampaignPanel.tsx         # Campaign/mission selection panel
│   │   ├── MarketPanel.tsx           # Market / trading panel
│   │   ├── UpgradesPanel.tsx         # Ship upgrades panel
│   │   ├── SpaceLogPanel.tsx         # Space log / journal panel
│   │   ├── TacticalLogPanel.tsx      # Tactical event log panel
│   │   ├── PortraitCommandDrawer.tsx # Bottom drawer — routes to dashboard panels
│   │   │
│   │   ├── — OVERLAYS / MODALS —
│   │   ├── StoryEventModal.tsx       # Story event modal popup
│   │   ├── TutorialOverlay.tsx       # Tutorial step overlay
│   │   ├── TargetLockAnim.tsx        # Target lock animation overlay
│   │   │
│   │   └── QaPanel.tsx               # [ORPHAN] QA test runner UI — not currently mounted
│   │
│   └── ui/                           # shadcn/ui base components (do not modify)
│       └── [30 shadcn primitives]
│
├── dashboard/
│   └── panels/
│       ├── CommandPanel.tsx          # CMD panel — tutorial launcher, system status
│       ├── WeaponsPanel.tsx          # [STUB] Weapons dashboard tab
│       ├── ScannerPanel.tsx          # [STUB] Scanner dashboard tab
│       ├── EngineeringPanel.tsx      # [STUB] Engineering dashboard tab
│       └── LogsPanel.tsx             # [STUB] Logs dashboard tab
│
├── motion/
│   ├── shipMotionEngine.ts           # Visual sway/jolt/lean engine (RAF, DOM transforms)
│   ├── shipMovementEngine.ts         # Input → orbital state driver (keyboard/touch/mouse)
│   ├── useShipStore.ts               # Zustand — orbital theta/phi, heading, velocity
│   ├── useShipMovementSetup.ts       # React hook — starts movement engine on mount
│   ├── useGlobeControls.ts           # Globe camera control helpers
│   ├── useOrientation.ts             # Device orientation (portrait/landscape) hook
│   └── useShipStore.ts               # (see above)
│
├── combat/
│   ├── useCombatState.ts             # Zustand — combat flash flags, impact state
│   ├── useThreatStore.ts             # Zustand — threat list, alert level
│   └── useWeapons.ts                 # Zustand — weapon slots, fire logic, cooldowns
│
├── story/
│   ├── useStoryEngine.ts             # Story event sequencer + trigger logic
│   ├── useStoryStore.ts              # Zustand — current story state, chapter, events
│   └── useSpaceLogStore.ts           # Zustand — space log entries
│
├── tutorial/
│   └── useTutorialStore.ts           # Zustand — tutorial step, active flag, guards
│
├── alerts/
│   ├── AlertPanel.tsx                # Alert display component
│   └── useAlertsStore.ts             # Zustand — alert queue
│
├── intro/
│   ├── CinematicIntro.tsx            # (see above)
│   └── useIntroStore.ts              # (see above)
│
├── audio/
│   └── aegisVoice.ts                 # Local TTS fallback (SpeechSynthesis wrapper)
│
├── systems/
│   └── ElevenVoice.ts                # ElevenLabs + aegisVoice hybrid voice system
│
├── credits/
│   └── useCreditsStore.ts            # Zustand — player credits/currency
│
├── tacticalLog/
│   └── useTacticalLogStore.ts        # Zustand — tactical log event entries
│
├── subtitle/
│   └── useSubtitleStore.ts           # Zustand — subtitle display queue
│
├── hooks/
│   ├── use-mobile.tsx                # Media query hook (portrait/landscape)
│   ├── useActor.ts                   # ICP actor initialization hook
│   ├── useInternetIdentity.ts        # ICP identity/auth hook
│   ├── useDashboardStore.ts          # Zustand — dashboard panel active state
│   └── useTacticalStore.ts           # Zustand — tactical mode, selected panel
│
├── utils/
│   └── StorageClient.ts              # Blob storage HTTP client
│
├── lib/
│   └── utils.ts                      # shadcn utility (cn classnames)
│
├── tests/
│   ├── smokeTests.ts                 # Core loop smoke tests (targeting, weapons, tutorial)
│   ├── stressTests.ts                # Performance stress tests
│   ├── runtimeValidators.ts          # Runtime state validators
│   ├── audioValidator.ts             # Audio system validator
│   └── types.ts                      # Test framework types
│
└── storage/                          # (folder now empty — StorageClient.ts removed)
```

---

## 4. POSSIBLE DEAD / DUPLICATE FILES

| File | Status | Reason |
|---|---|---|
| `audio/ElevenVoice.ts` | **DELETED** | Exact duplicate of `systems/ElevenVoice.ts`; nothing imported it |
| `storage/StorageClient.ts` | **DELETED** | Near-duplicate of `utils/StorageClient.ts`; nothing imported it |
| `components/game/WeaponDeck.tsx` | **DELETED** | Superseded by `WeaponControlDeck.tsx`; nothing imported it |
| `components/game/QaPanel.tsx` | **ORPHAN** | Fully built 584-line QA runner — not mounted anywhere. Wire it up or delete. |
| `ui-summary.json` | **DOC ARTIFACT** | Not imported by any code — safe to keep as reference |
| `dashboard/panels/WeaponsPanel.tsx` | **STUB** | Placeholder only — needs implementation |
| `dashboard/panels/ScannerPanel.tsx` | **STUB** | Placeholder only — needs implementation |
| `dashboard/panels/EngineeringPanel.tsx` | **STUB** | Placeholder only — needs implementation |
| `dashboard/panels/LogsPanel.tsx` | **STUB** | Placeholder only — needs implementation |

---

## 5. PROJECT SITEMAP

### App Root
- `main.tsx` — Vite entry, mounts `<App />`
- `App.tsx` — Root router: shows `CinematicIntro` or `TacticalStage` based on intro state
- `config.ts` — Environment and storage config
- `types.ts` — Shared types

### Core Scene / Globe
- `TacticalStage.tsx` — Master game stage; composes all game layers
- `GlobeCore.ts` — Node coordinates, lat/lng math
- `components/game/EarthGlobe.tsx` — 3D Earth mesh, node markers, click targeting
- `components/game/GlobeErrorBoundary.tsx` — Error isolation for globe failures
- `components/game/SpaceBackground.tsx` — Starfield + dust particles
- `components/game/CameraController.tsx` — Camera tracks ship orbital state
- `components/game/CheckpointMarkers.tsx` — Mission checkpoint overlays

### HUD / Cockpit
- `components/game/CockpitFrame.tsx` — Outer cockpit shell
- `components/game/CockpitAmbientFx.tsx` — Scan lines, glow
- `components/game/CockpitReticle.tsx` — Center targeting reticle
- `components/game/UpperCanopy.tsx` — Top canopy overlay
- `components/game/LowerConsoleShell.tsx` — Console housing
- `components/game/SideEnclosure.tsx` / `SideFrameDetails.tsx` — Cockpit sides
- `components/game/PortraitStatusBar.tsx` — Top threat/status bar
- `components/game/VelocityIndicator.tsx` — Speed/heading readout
- `components/game/ShipStatusCards.tsx` — Hull/shields/power
- `components/game/RadarSystem.tsx` — Radar sweep + contacts
- `components/game/LeftPanel.tsx` / `RightPanel.tsx` — Side panel content

### Panels (Full-Screen Overlays)
- `components/game/CampaignPanel.tsx` — Campaign/mission selection
- `components/game/MarketPanel.tsx` — Trading market
- `components/game/UpgradesPanel.tsx` — Ship upgrades
- `components/game/SpaceLogPanel.tsx` — Space journal
- `components/game/TacticalLogPanel.tsx` — Tactical event log
- `components/game/PortraitCommandDrawer.tsx` — Bottom drawer routing
- `dashboard/panels/CommandPanel.tsx` — System status + tutorial launcher
- `dashboard/panels/WeaponsPanel.tsx` — [STUB]
- `dashboard/panels/ScannerPanel.tsx` — [STUB]
- `dashboard/panels/EngineeringPanel.tsx` — [STUB]
- `dashboard/panels/LogsPanel.tsx` — [STUB]

### Modals / Overlays
- `intro/CinematicIntro.tsx` — Intro cinematic + skip
- `components/game/TutorialOverlay.tsx` — Tutorial step overlay (opt-in)
- `components/game/StoryEventModal.tsx` — Story event popup
- `components/game/TargetLockAnim.tsx` — Target lock animation
- `components/game/QaPanel.tsx` — [ORPHAN] QA runner, not mounted

### Weapons / Combat
- `components/game/WeaponControlDeck.tsx` — Primary weapon UI
- `components/game/WeaponSlotHUD.tsx` — Slot status badges
- `components/game/WeaponActionModule.tsx` — Fire button module
- `components/game/WeaponButton.tsx` — Individual button primitive
- `components/game/ProjectileSystem.tsx` — Projectile lifecycle
- `components/game/CombatEffectsLayer.tsx` — VFX orchestrator
- `components/game/ImpactEffects.tsx` — 3D mesh impact VFX
- `components/game/ImpactParticleOverlay.tsx` — 2D DOM hit feedback
- `components/game/DestructionEffects.tsx` — Destruction animations
- `components/game/InterceptSystem.tsx` — ABM/intercept logic
- `combat/useWeapons.ts` — Weapon slots, fire, cooldown state
- `combat/useCombatState.ts` — Combat flash/impact flags

### Threats
- `components/game/AsteroidThreat.tsx` — Asteroid display + behavior
- `components/game/ThreatManager.tsx` — Threat spawner + event manager
- `combat/useThreatStore.ts` — Threat list, alert level
- `alerts/AlertPanel.tsx` — Alert display component
- `alerts/useAlertsStore.ts` — Alert queue state

### Systems
- `motion/shipMotionEngine.ts` — Visual sway/jolt/lean
- `motion/shipMovementEngine.ts` — Input → orbital state
- `motion/useShipMovementSetup.ts` — Mount/unmount hook
- `systems/ElevenVoice.ts` — Voice synthesis (ElevenLabs + TTS fallback)
- `audio/aegisVoice.ts` — Local TTS fallback
- `story/useStoryEngine.ts` — Story sequencer

### Stores (Zustand State)
- `motion/useShipStore.ts` — Orbital position, heading, velocity
- `combat/useWeapons.ts` — Weapon state
- `combat/useCombatState.ts` — Combat flags
- `combat/useThreatStore.ts` — Threat list
- `story/useStoryStore.ts` — Story progress
- `story/useSpaceLogStore.ts` — Space log entries
- `tutorial/useTutorialStore.ts` — Tutorial state
- `alerts/useAlertsStore.ts` — Alert queue
- `intro/useIntroStore.ts` — Intro state
- `credits/useCreditsStore.ts` — Player credits
- `tacticalLog/useTacticalLogStore.ts` — Tactical log
- `subtitle/useSubtitleStore.ts` — Subtitle queue
- `hooks/useDashboardStore.ts` — Dashboard panel state
- `hooks/useTacticalStore.ts` — Tactical mode state

### Tests / Validation
- `tests/smokeTests.ts` — Core loop smoke tests
- `tests/stressTests.ts` — Performance stress tests
- `tests/runtimeValidators.ts` — Runtime validators
- `tests/audioValidator.ts` — Audio system validator
- `tests/types.ts` — Test types

### Assets
- `public/assets/generated/` — Generated images
- `public/assets/uploads/` — User-uploaded reference images

### Backend / ICP
- `backend.ts` — ICP actor client
- `backend.d.ts` — Type declarations
- `declarations/backend.did.d.ts` / `backend.did.js` — Candid bindings
- `utils/StorageClient.ts` — Blob storage HTTP client

---

## 6. PLAYER / APP FLOW MAP

```
[Browser loads]
       ↓
[main.tsx → App.tsx]
       ↓
  Intro complete?
  ┌────┴─────┐
  NO        YES
  ↓          ↓
[CinematicIntro]  →  [TacticalStage]
  (skip button)          ↓
                  ┌──────────────────────────────┐
                  │         COCKPIT VIEW         │
                  │  Globe + HUD + Radar + Weapons│
                  └──────────────────────────────┘
                         ↓           ↓
                  [Tap Globe]   [Bottom Nav]
                  [Lock Target]      ↓
                         ↓   ┌──────────────────┐
                  [Fire Weapons] │  Command Drawer  │
                         ↓   │  CMD / WPN / SCAN │
                  [Impact FX]  │  ENG / LOGS      │
                  [Threat Log] └──────────────────┘
                         ↓
                  [Full-Screen Panels]
                  ┌─────────────────────┐
                  │ Campaign  (missions)│
                  │ Market    (trading) │
                  │ Upgrades  (ship)    │
                  │ Space Log (journal) │
                  │ Tactical Log (events)│
                  └─────────────────────┘
                         ↓
                  [Story Events]
                  [Tutorial (opt-in)]
                  [Alerts / Threats]
```

### Detailed Transitions

| From | To | Trigger |
|---|---|---|
| Intro | TacticalStage | Intro completes or skip pressed |
| TacticalStage | Target selected | Tap globe |
| Target selected | Weapons active | Weapon deck visible, READY |
| Weapons active | Fire | Tap weapon button |
| Fire | Impact FX + Log | Projectile hits |
| TacticalStage | CampaignPanel | Nav: CAMPAIGN |
| TacticalStage | MarketPanel | Nav: MARKET |
| TacticalStage | UpgradesPanel | Nav: UPGRADES |
| TacticalStage | SpaceLogPanel | Nav: LOG |
| CommandPanel | TutorialOverlay | Press START TUTORIAL |
| TutorialOverlay | TacticalStage | Complete or ESC |
| ThreatManager | AlertPanel | Threat spawns |
| Story engine | StoryEventModal | Story event triggers |

---

## 7. SYSTEM RESPONSIBILITY MAP

| System | Primary Files | Secondary Files |
|---|---|---|
| **Globe rendering** | `EarthGlobe.tsx`, `GlobeCore.ts` | `SpaceBackground.tsx`, `CameraController.tsx`, `GlobeErrorBoundary.tsx` |
| **Radar** | `RadarSystem.tsx` | `combat/useThreatStore.ts`, `motion/useShipStore.ts` |
| **Targeting** | `EarthGlobe.tsx` (click handler) | `GlobeCore.ts`, `CockpitReticle.tsx`, `TargetLockAnim.tsx`, `hooks/useTacticalStore.ts` |
| **Weapons** | `combat/useWeapons.ts` | `WeaponControlDeck.tsx`, `WeaponActionModule.tsx`, `WeaponSlotHUD.tsx`, `WeaponButton.tsx` |
| **Projectiles / FX** | `ProjectileSystem.tsx`, `CombatEffectsLayer.tsx` | `ImpactEffects.tsx`, `ImpactParticleOverlay.tsx`, `DestructionEffects.tsx`, `GlobeHitPulse.tsx` |
| **Tutorial** | `tutorial/useTutorialStore.ts` | `TutorialOverlay.tsx`, `dashboard/panels/CommandPanel.tsx` |
| **Missions** | `CampaignPanel.tsx` | `story/useStoryStore.ts`, `story/useStoryEngine.ts` |
| **Progression** | `story/useStoryEngine.ts`, `story/useStoryStore.ts` | `credits/useCreditsStore.ts`, `CampaignPanel.tsx` |
| **Logs** | `tacticalLog/useTacticalLogStore.ts`, `TacticalLogPanel.tsx` | `story/useSpaceLogStore.ts`, `SpaceLogPanel.tsx` |
| **Alerts** | `alerts/useAlertsStore.ts`, `AlertPanel.tsx` | `PortraitStatusBar.tsx`, `combat/useThreatStore.ts` |
| **Voice / Audio** | `systems/ElevenVoice.ts` | `audio/aegisVoice.ts` |
| **Notifications / Subtitles** | `subtitle/useSubtitleStore.ts` | `systems/ElevenVoice.ts` |
| **Ship movement** | `motion/shipMovementEngine.ts`, `motion/useShipStore.ts` | `motion/shipMotionEngine.ts`, `MobileJoystick.tsx`, `RightDragZone.tsx` |
| **Threats** | `combat/useThreatStore.ts`, `ThreatManager.tsx` | `AsteroidThreat.tsx`, `InterceptSystem.tsx` |
| **Intercept / ABM** | `InterceptSystem.tsx` | `combat/useThreatStore.ts`, `combat/useWeapons.ts` |
| **Market / Economy** | `MarketPanel.tsx`, `credits/useCreditsStore.ts` | |
| **Upgrades** | `UpgradesPanel.tsx` | `credits/useCreditsStore.ts` |
| **Backend / ICP** | `backend.ts`, `hooks/useActor.ts` | `utils/StorageClient.ts`, `declarations/` |

---

## 8. ARCHITECTURE RISKS

### RISK 1 — `TacticalStage.tsx` is the God Component
**Severity: HIGH**
This single file composes and mounts every game layer — cockpit frame, globe, radar, weapons, tutorials, motion, threats, logs. It currently has ~28 imports. As features grow, this file will become difficult to modify safely.

**Recommendation (future pass):** Split into sub-scenes:
- `CockpitShell.tsx` — frame, canopy, enclosures
- `GameOverlays.tsx` — tactical panels, drawers
- `CombatLayer.tsx` — weapons, projectiles, effects

---

### RISK 2 — Duplicate State Paths (Weapons)
**Severity: MEDIUM**
`combat/useWeapons.ts` is the Zustand store. `WeaponControlDeck.tsx` also contains local `useState` for selection UX. `WeaponActionModule.tsx` has its own local firing state. Three layers touching weapon state increases the risk of desync.

**Recommendation:** Consolidate weapon UI state into the Zustand store.

---

### RISK 3 — Dashboard Panel Stubs Are Live Routes
**Severity: MEDIUM**
Four of five dashboard panels are stubs that render placeholder text. They are reachable from the bottom nav. Players will reach blank screens.

**Recommendation:** Either implement them or hide them from the nav until ready.

---

### RISK 4 — `QaPanel.tsx` Is Orphaned
**Severity: LOW**
A fully built 584-line QA test runner exists but is never mounted. It cannot be triggered by the user.

**Recommendation:** Mount it behind a hidden key combo (e.g., long-press logo) or delete it.

---

### RISK 5 — Motion Engine Separation is Good, but Fragile
**Severity: LOW**
`shipMotionEngine.ts` uses direct DOM manipulation via `querySelector` and `requestAnimationFrame`. This bypasses React rendering entirely. If the DOM elements it targets are not mounted, it silently does nothing.

**Recommendation:** Add mount guards or convert to a ref-based approach.

---

### RISK 6 — ICP Backend Integration is Incomplete
**Severity: LOW (current)**
`backend.ts` and `hooks/useActor.ts` exist but it is unclear how much game state is persisted vs. local-only. If game progression is purely Zustand (session memory), progress is lost on refresh.

**Recommendation:** Clarify which stores should persist to ICP vs. stay local. Add `persist` middleware to critical stores.

---

## 9. FILES CHANGED IN THIS PASS

| Action | File |
|---|---|
| DELETED | `src/frontend/src/audio/ElevenVoice.ts` |
| DELETED | `src/frontend/src/storage/StorageClient.ts` |
| DELETED | `src/frontend/src/components/game/WeaponDeck.tsx` |
| CREATED | `src/frontend/src/PROJECT_MAP.md` (this file) |
| UPDATED | `spec.md` |

---

*End of Project Map — Frontier: Lost In Space*
