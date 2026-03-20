# Frontier — Lost In Space

## Current State

Phase 2 of the Orbital Combat Expansion is now complete.

The game previously had a working targeting system (globe taps → TGT-xxx targets) and
firing loop (pulse / railgun / missile weapons with cooldowns). Asteroid threats existed
and flew toward the globe but could not fire back. There was no player shield/hull state.

## Requested Changes (Diff)

### Add
- `useEnemyStore.ts` — 3 enemy satellites (moving) + 3 planetary bases (static)
  - Satellites orbit the globe with smooth circular paths (inclined, varied speeds)
  - Bases anchored to globe surface via lat/lng
  - Both types support return fire at 3–6 second random intervals
  - Respawn after 12 seconds when destroyed
- `usePlayerStore.ts` — Shield (100) + Hull (100) with prioritised damage model
- `EnemyTargetsLayer.tsx` — R3F rendering inside Canvas
  - Satellites: box body + solar panel wings + glow sphere, clickable for targeting
  - Bases: octahedron surface marker + glow + selection ring
  - Hit flash + selection highlight
- `IncomingFireLayer.tsx` — R3F incoming projectile bolts (orange/red)
  - Travel from enemy position to player orbital position
  - Deal shield/hull damage at ~90% flight progress
- `PlayerShieldHUD.tsx` — DOM shield/hull bars (top-left of globe area)
  - Colour-coded: blue (SHD) → green (HUL), warn to red at 20%
  - Flash feedback on hits

### Modify
- `RadarSystem.tsx` — extended with:
  - Satellite blips (diamond shape, red, heading-relative, moves smoothly)
  - Base blips (triangle shape, amber, static)
  - Incoming fire indicator (pulsing ring at source position)
  - Contact count now includes enemies
- `CombatEffectsLayer.tsx` — resolveTargetPos extended to handle SAT-xxx / BASE-xxx IDs
  - Reads current position from useEnemyStore
  - Fixed node resolution to use Record<string,Vec3> lookup (vs stale indexOf approach)
- `useWeapons.ts` — fire() now damages enemies when SAT-/BASE- is selected
  - Calls useEnemyStore.damageEnemy(id, weaponType)
  - Triggers DestructionEvent + tactical log on kill
- `TacticalStage.tsx` — integrated new systems:
  - EnemyTargetsLayer + IncomingFireLayer inside Canvas
  - PlayerShieldHUD in globe viewport
  - PlayerHitFlash overlay (full-screen red pulse on damage)
  - Boot message updated to reflect active enemies

### Remove
- Nothing removed in this pass

## Implementation Plan

1. Enemy state: satellites orbit via elapsed-time angle calc; bases fixed at surface radius 1.55
2. Return fire: checked inside EnemyTick (useFrame) via Date.now() vs nextFireTime
3. Incoming projectile: interpolates from source to ship orbital pos; damage at 90% progress
4. Player damage: shield absorbs first; hull takes overflow; flash feedback on both
5. Radar: enemies projected via atan2(px,pz) → heading-relative blip; incoming = pulsing ring
6. Weapons: SAT/BASE ids now route to useEnemyStore.damageEnemy instead of useThreatStore
7. Respawn: destroyed enemies revive after 12 s — ensures enemies always exist
8. Safety: incoming capped at 4 active bolts; guard against mid-frame removal via status checks
