# Frontier — Lost In Space

## Current State

Weapon console uses a cluster layout:
- LEFT CLUSTER: Pulse Cannon (top) + Heat Missile (bottom)
- CENTER: FIRE button (dominant)
- RIGHT CLUSTER: Rail Gun (top) + EMP Burst (bottom)
- AI recommendation badge + mode toggle wired in
- All 4 weapons have distinct 3D projectile effects and full fire/cooldown logic

## Requested Changes (Diff)

### Add
- `WeaponHologramLayer.tsx` — new component that floats above the physical console
  - Absolutely positioned overlay, sits on top of WeaponConsole in the same container
  - Does NOT replace or modify the physical console
  - Three hologram zones matching the console layout:
    A) Left hologram — above left cluster: weapon icon, cooldown bar, ammo/energy, lock indicator
    B) Center hologram — above FIRE button: circular targeting reticle, lock-on progress ring (red→green over ~2.8s), pulse flash on fire
    C) Right hologram — above right cluster: weapon icon, cooldown bar, charge/heat, lock indicator
  - Visual style: semi-transparent, glowing, floating projections — NOT flat UI cards or boxed panels
  - Slight CSS perspective/translateY lift to feel like floating above the surface
  - All holograms animate with weapon state (idle, active, locked, firing, cooldown)

### Modify
- `TacticalStage.tsx` or wherever WeaponConsole is rendered:
  wrap console + hologram in a `position: relative` container so hologram can overlap
- Physical console panels stay minimal — hologram carries all readable data

### Remove
- Nothing from the physical console

## Implementation Plan

1. New `WeaponHologramLayer.tsx` component:
   - Absolute position, `pointerEvents: none`, full-width, bottom-anchored
   - Three columns matching console proportions: 30% / auto / 30%
   - Left + right holograms float above their respective clusters (~-48px to -64px translateY)
   - Center hologram floats above FIRE button
   - All data sourced from useWeaponsStore, useTacticalStore, useCombatState
   - Lock-on progress: tracks time since target selected, completes at 2.8s, resets on deselect
   - Color: red (#ff3030) tracking → green (#00ff88) locked
   - Fire pulse: brief white/cyan bloom ring on firingEffect
   - Weapon icons: use CSS/SVG inline symbols (lightning bolt for pulse, chevron for rail, circle-burst for EMP, missile shape for heat missile)
   - Cooldown bar: thin horizontal line that fills left-to-right as weapon recovers
   - Ammo dots for missile and rail (segmented pips)
   - Energy arc for pulse, charge ring for EMP

2. Mount WeaponHologramLayer in TacticalStage.tsx inside a relative-positioned wrapper with WeaponConsole

3. Validate: build + typecheck + lint must pass
