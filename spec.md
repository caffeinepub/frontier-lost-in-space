# Frontier - Lost In Space

## Current State
WeaponConsole.tsx renders a bottom console using AI-generated JPEG/PNG image assets as the base layer (weapon-console-rebuilt-v2, pulse-panel, rail-panel, missile-panel, fire-idle/pressed). The animation state machine (useWeaponAnimState.ts) is solid and must be preserved unchanged. The console is mounted inside WeaponControlDeck.tsx or CombatLayer equivalent.

## Requested Changes (Diff)

### Add
- Pure CSS/Tailwind weapon system panel: no image assets, fully embedded into the console surface
- LEFT panel: Pulse Cannon — energy bar (vertical or horizontal), 3 LED status indicators, label plate
- RIGHT panel: Rail Gun — charge bar, heat indicator strip, label plate
- CENTER: FIRE control housing (existing button logic preserved), clean housing surround
- LOWER STRIP: Power | Heat | Target Lock | System indicators (5 nodes)
- All panels get cyan glow on hover/lock, bronze label plates

### Modify
- WeaponConsole.tsx: replace image-asset base layer with CSS-drawn console surface; keep all animation state machine wiring (useWeaponAnimState, useCombatState, useWeapons, usePlayerStore)
- Remove all <img> tags referencing ASSETS object (base, pulsePanel, railPanel, fireIdle, firePressed, missilePanel)
- Keep all keyframe animations, ANIM_TOKENS usage, WeaponPanel, FireButton, CooldownStrip, StatusStrip components

### Remove
- ASSETS object and all image references
- MissilePanel image layer (replace with a small text indicator in lower strip)
- Globe/planet references (none exist here, keep it that way)

## Implementation Plan
1. Rewrite WeaponConsole.tsx base surface as dark brushed-metal CSS panel (dark gradient + subtle grid lines)
2. LEFT panel (Pulse Cannon): dark recessed housing, vertical energy bar with cyan fill, 3 LED dots, bronze label plate, edge glow on active states
3. CENTER: FIRE housing — circular button with red core, glass highlight, housing ring, existing click/state logic
4. RIGHT panel (Rail Gun): dark housing, charge bar segmented, heat strip (amber/red), bronze label plate
5. LOWER STRIP: 5 horizontal indicator nodes — POWER (green), HEAT (amber), TARGET LOCK (cyan/red), SHIELD (blue), SYS READY (green) — each with icon char + label + dot
6. Preserve all animation states: idle pulse, hover brighten, lock signal line, fire burst, cooldown refill, disabled dim
7. Validate build passes
