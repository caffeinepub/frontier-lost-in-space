# Frontier — Lost In Space

**A.E.G.I.S. Tactical Command Interface**

A mobile-first space combat game built with React, Three.js, and Motoko on the Internet Computer.

---

## Overview

You are the commander of a damaged vessel in unstable orbit around Earth. Your mission: intercept incoming asteroid threats using your ship’s weapons before they reach the planet.

---

## Project Structure

```
src/
  backend/
    main.mo                  — Motoko backend canister
  frontend/
    src/
      App.tsx                — Intro gating + root render
      TacticalStage.tsx      — Main game view (all panels wired)
      GlobeCore.ts           — Globe node positions (lat/lng → 3D)
      types.ts               — Shared TypeScript types
      config.ts              — App config / env

      audio/
        aegisVoice.ts        — Browser TTS voice
        ElevenVoice.ts       — ElevenLabs premium voice (intro)

      systems/
        ElevenVoice.ts       — ElevenLabs integration

      combat/
        useCombatState.ts    — Firing effects, screen flash, camera shake
        useThreatStore.ts    — Asteroid threat spawning + progression
        useWeapons.ts        — Weapon loadout, fire, cooldown, reload

      motion/
        shipMotionEngine.ts  — Idle sway + battle jolt (RAF-based)
        shipMovementEngine.ts— Joystick/keyboard input → orbital velocity
        useShipStore.ts      — Ship orbital position + heading state
        useShipMovementSetup.ts — React hook: boots movement engine
        useGlobeControls.ts  — Globe rotation controls
        useOrientation.ts    — Device orientation support

      intro/
        CinematicIntro.tsx   — Full-screen opening cinematic
        useIntroStore.ts     — First-run gating + tutorial start flag

      tutorial/
        useTutorialStore.ts  — Tutorial state machine (8 steps)

      story/
        useStoryStore.ts     — Story event state
        useStoryEngine.ts    — Story progression logic
        useSpaceLogStore.ts  — Narrative log entries

      hooks/
        useTacticalStore.ts  — Target selection, scan mode, event log
        useDashboardStore.ts — Panel / drawer open state
        useTacticalStore.ts  — Tactical layer store

      tacticalLog/
        useTacticalLogStore.ts — Tactical log entries (combat/radar/system)

      subtitle/
        useSubtitleStore.ts  — Voice subtitle display

      alerts/
        AlertPanel.tsx       — Alert notification panel
        useAlertsStore.ts    — Alert state

      credits/
        useCreditsStore.ts   — In-game credits/currency

      dashboard/
        panels/
          CommandPanel.tsx   — CMD drawer panel
          ScannerPanel.tsx   — SCAN drawer panel
          WeaponsPanel.tsx   — WPN drawer panel
          EngineeringPanel.tsx — SHIP/engineering panel
          LogsPanel.tsx      — LOG panel

      components/
        game/
          AsteroidThreat.tsx       — 3D asteroid mesh + click to target
          BottomCommandNav.tsx     — CMD/SCAN/WPN/SHIP/LOG tab bar
          CameraController.tsx     — R3F camera at orbital position
          CockpitFrame.tsx         — Cockpit window PNG overlay
          CombatEffectsLayer.tsx   — Projectiles + impact effects
          EarthGlobe.tsx           — 3D Earth sphere + click targeting
          MobileJoystick.tsx       — Dynamic spawn joystick
          PortraitCommandDrawer.tsx— Slide-up drawer for all panels
          PortraitStatusBar.tsx    — Top bar (target / SCAN / CMD)
          RadarSystem.tsx          — Canvas-based tactical radar
          RightDragZone.tsx        — Right-half drag for ship heading
          ShipMotionLayer.tsx      — Parallax motion wrapper
          SpaceBackground.tsx      — Star field + galaxy + shooting stars
          TacticalLogPanel.tsx     — Slide-up log panel
          ThreatManager.tsx        — Threat spawn + R3F update loop
          TutorialOverlay.tsx      — 8-step guided tutorial
          UpperCanopy.tsx          — SVG cockpit canopy top frame
          VelocityIndicator.tsx    — Speed + heading HUD widget
          WeaponControlDeck.tsx    — PULSE / RAIL GUN / MISSILE buttons
          … (and more)
```

---

## Game Flow

1. **First launch** → Cinematic intro (26 sec, skippable)
2. **Tutorial** → 8-step guided onboarding
3. **Main game** → TacticalStage — orbit, scan, target, fire

### Controls

| Input | Action |
|---|---|
| Left-side drag / joystick | Move ship (orbital position) |
| Right-side drag | Rotate heading / aim |
| WASD / Arrow keys | Move ship (desktop) |
| Tap globe | Designate target coordinate |
| Tap asteroid | Lock asteroid threat |
| Tap weapon button | Select weapon (first tap) / Fire (second tap) |
| SCAN button | Toggle scan mode |
| CMD / WPN / SHIP / LOG | Open drawer panels |

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Three.js, @react-three/fiber, Zustand, Tailwind CSS
- **Backend**: Motoko on the Internet Computer
- **3D**: React Three Fiber + Three.js
- **State**: Zustand stores per feature domain
- **Motion**: RAF-based (no React re-renders for animations)

---

## Assets

| File | Description |
|---|---|
| `7AECA372-...-2.png` | Cockpit window frame overlay (PNG with transparent viewport) |
| `IMG_7211-1.jpeg` | Reference screenshot |

---

## Development

```bash
cd src/frontend
pnpm install
pnpm dev
```
