// Ship motion engine — RAF-based, no React state
import type { WeaponType } from "../combat/useCombatState";

let swayX = 0;
let swayY = 0;
let swayRot = 0;
let targetX = 0;
let targetY = 0;
let targetRot = 0;
let nextTargetTime = 0;

let joltX = 0;
let joltY = 0;
let joltRot = 0;

// Cockpit lean — driven by joystick X via setCockpitLean()
let cockpitLean = 0;
let cockpitLeanTarget = 0;

// G-force sway amplifier — increases with velocity
let gForceAmp = 1.0;

const MAX_SWAY_X = 4.5;
const MAX_SWAY_Y = 2.5;
const MAX_SWAY_ROT = 0.1;
const LERP_RATE = 0.013;
const MAX_LEAN_DEG = 1.8;

type Layer = { el: HTMLElement; factor: number; leanMult: number };
const layers: Layer[] = [];

let rafId: number | null = null;
let lastTime = 0;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pickNewIdleTarget() {
  targetX = rand(-MAX_SWAY_X, MAX_SWAY_X);
  targetY = rand(-MAX_SWAY_Y, MAX_SWAY_Y);
  targetRot = rand(-MAX_SWAY_ROT, MAX_SWAY_ROT);
  nextTargetTime = performance.now() + rand(500, 1500);
}

function tick(now: number) {
  const dt = Math.min(now - lastTime, 50);
  lastTime = now;
  const dtFactor = dt / 16.67;

  if (now >= nextTargetTime) {
    pickNewIdleTarget();
  }

  const lerpT = Math.min(LERP_RATE * dtFactor, 1);
  swayX = lerp(swayX, targetX, lerpT);
  swayY = lerp(swayY, targetY, lerpT);
  swayRot = lerp(swayRot, targetRot, lerpT);

  const joltDecay = 0.87 ** dtFactor;
  joltX *= joltDecay;
  joltY *= joltDecay;
  joltRot *= joltDecay;

  if (Math.abs(joltX) < 0.001) joltX = 0;
  if (Math.abs(joltY) < 0.001) joltY = 0;
  if (Math.abs(joltRot) < 0.0001) joltRot = 0;

  // Cockpit lean: smooth toward target
  cockpitLean = lerp(
    cockpitLean,
    cockpitLeanTarget,
    Math.min(0.06 * dtFactor, 1),
  );
  cockpitLeanTarget = lerp(cockpitLeanTarget, 0, Math.min(0.08 * dtFactor, 1));

  // G-force amp decays back to 1 when not accelerating
  gForceAmp = lerp(gForceAmp, 1.0, Math.min(0.05 * dtFactor, 1));

  const totalX = (swayX + joltX) * gForceAmp;
  const totalY = (swayY + joltY) * gForceAmp;
  const totalRot = swayRot + joltRot;

  for (const layer of layers) {
    const x = totalX * layer.factor;
    const y = totalY * layer.factor;
    const r = totalRot * layer.factor + cockpitLean * layer.leanMult;
    layer.el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
  }

  if (layers.length > 0) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = null;
  }
}

function startRAF() {
  if (rafId !== null) return;
  lastTime = performance.now();
  pickNewIdleTarget();
  rafId = requestAnimationFrame(tick);
}

function stopRAF() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/** Set cockpit lean target (in degrees). Called by ship movement engine. */
export function setCockpitLean(deg: number): void {
  cockpitLeanTarget = Math.max(-MAX_LEAN_DEG, Math.min(MAX_LEAN_DEG, deg));
}

/**
 * Set G-force amplifier. Called by movement engine with normalized velocity.
 * amp=1 = idle, amp=1.6 = full thrust (subtle increase in sway range).
 */
export function setGForceAmp(amp: number): void {
  gForceAmp = Math.max(1.0, Math.min(1.6, amp));
}

export function registerMotionLayer(
  el: HTMLElement,
  factor: number,
  leanMult = 0,
): () => void {
  layers.push({ el, factor, leanMult });
  if (layers.length === 1) startRAF();

  return () => {
    const idx = layers.findIndex((l) => l.el === el);
    if (idx !== -1) layers.splice(idx, 1);
    if (layers.length === 0) stopRAF();
  };
}

export function triggerBattleJolt(weaponType: WeaponType, isImpact = false) {
  const angle = Math.random() * Math.PI * 2;
  let power: number;

  if (isImpact) {
    power = rand(5, 15);
  } else if (weaponType === "railgun") {
    power = rand(7, 17);
  } else if (weaponType === "missile") {
    power = rand(6, 14);
  } else if (weaponType === "emp") {
    power = rand(5, 13);
  } else {
    power = rand(2, 8);
  }

  joltX = Math.max(-18, Math.min(18, joltX + Math.cos(angle) * power));
  joltY = Math.max(-10, Math.min(10, joltY + Math.sin(angle) * power));
  joltRot = Math.max(-0.45, Math.min(0.45, joltRot + rand(-0.35, 0.35)));
}

/** Read current sway (px) for use inside Three.js canvas */
export function getSway(): { x: number; y: number } {
  return { x: swayX + joltX, y: swayY + joltY };
}
