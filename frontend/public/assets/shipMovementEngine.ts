/**
 * shipMovementEngine — RAF-based input → orbital position driver.
 *
 * Sensitivity reduced ~50% from previous values.
 * Added setCockpitLean() hook for motion engine sway.
 * Added setGForceAmp() to scale sway with velocity (G-force impression).
 */
import { setCockpitLean, setGForceAmp } from "../motion/shipMotionEngine";
import { useShipStore } from "./useShipStore";

const joystick = { x: 0, y: 0 };
const keyboard = { x: 0, y: 0 };
let headingYaw = 0;
let headingPitch = 0;

// Reduced ~50% from 0.00045
const THRUST_RATE = 0.000225;
// Reduced ~50% from 0.0018
const RIGHT_DRAG_SENS = 0.0009;
const MAX_HYaw = 0.32;
const MAX_HPitch = 0.22;
const HEADING_DECAY = 0.975;

// Max velocity for G-force amp normalization
const MAX_VEL = THRUST_RATE * 18;

export function setJoystickInput(x: number, y: number) {
  joystick.x = Math.max(-1, Math.min(1, x));
  joystick.y = Math.max(-1, Math.min(1, y));
}

export function applyRightDragDelta(dx: number, dy: number) {
  headingYaw = Math.max(
    -MAX_HYaw,
    Math.min(MAX_HYaw, headingYaw + dx * RIGHT_DRAG_SENS),
  );
  headingPitch = Math.max(
    -MAX_HPitch,
    Math.min(MAX_HPitch, headingPitch - dy * RIGHT_DRAG_SENS),
  );
}

export function setKeyboardInput(x: number, y: number) {
  keyboard.x = Math.max(-1, Math.min(1, x));
  keyboard.y = Math.max(-1, Math.min(1, y));
}

let rafId: number | null = null;
let lastTime = 0;

function tick(now: number) {
  const dt = Math.min(now - lastTime, 50);
  lastTime = now;

  const store = useShipStore.getState();
  const inputX = joystick.x !== 0 ? joystick.x : keyboard.x;
  const inputY = joystick.y !== 0 ? joystick.y : keyboard.y;

  const thrustTheta = inputX * THRUST_RATE;
  const thrustPhi = -inputY * THRUST_RATE;

  const nVT = Math.max(
    -MAX_VEL,
    Math.min(MAX_VEL, store.velTheta + thrustTheta * dt),
  );
  const nVP = Math.max(
    -MAX_VEL,
    Math.min(MAX_VEL, store.velPhi + thrustPhi * dt),
  );

  store.setVelocity(nVT, nVP);
  store.applyVelocityTick(dt);

  headingYaw *= HEADING_DECAY;
  headingPitch *= HEADING_DECAY;
  store.setHeading(headingYaw, headingPitch);

  // Drive cockpit lean: opposite direction to movement (subtle 3-5% feel)
  setCockpitLean(-inputX * 1.5);

  // G-force amp: scale with current velocity magnitude
  const velMag = Math.sqrt(nVT * nVT + nVP * nVP);
  const velNorm = Math.min(1, velMag / MAX_VEL);
  // 1.0 at rest → 1.5 at full speed (modest amplification of sway)
  setGForceAmp(1.0 + velNorm * 0.5);

  rafId = requestAnimationFrame(tick);
}

export function startShipMovementEngine() {
  if (rafId !== null) return;
  lastTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

export function stopShipMovementEngine() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// ─── Keyboard ──────────────────────────────────────────────────────────────────────────────────
const keysDown = new Set<string>();

function updateKb() {
  let x = 0;
  let y = 0;
  if (keysDown.has("ArrowLeft") || keysDown.has("a") || keysDown.has("A"))
    x -= 1;
  if (keysDown.has("ArrowRight") || keysDown.has("d") || keysDown.has("D"))
    x += 1;
  if (keysDown.has("ArrowUp") || keysDown.has("w") || keysDown.has("W")) y += 1;
  if (keysDown.has("ArrowDown") || keysDown.has("s") || keysDown.has("S"))
    y -= 1;
  setKeyboardInput(x, y);
}

export function attachKeyboardListeners() {
  const down = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    keysDown.add(e.key);
    updateKb();
  };
  const up = (e: KeyboardEvent) => {
    keysDown.delete(e.key);
    updateKb();
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    keysDown.clear();
    setKeyboardInput(0, 0);
    setCockpitLean(0);
    setGForceAmp(1.0);
  };
}

// ─── Mouse drag (desktop) ─────────────────────────────────────────────────────────────────────────────
let mouseDown = false;
let mouseLX = 0;
let mouseLY = 0;

export function attachMouseDragListeners() {
  const onDown = (e: MouseEvent) => {
    if (e.button === 0 || e.button === 2) {
      mouseDown = true;
      mouseLX = e.clientX;
      mouseLY = e.clientY;
    }
  };
  const onUp = () => {
    mouseDown = false;
  };
  const onMove = (e: MouseEvent) => {
    if (!mouseDown) return;
    const dx = e.clientX - mouseLX;
    const dy = e.clientY - mouseLY;
    mouseLX = e.clientX;
    mouseLY = e.clientY;
    if (e.clientX > window.innerWidth * 0.5) {
      const s = useShipStore.getState();
      const maxV = 0.008;
      // Reduced ~50% from 0.0006/0.0005
      s.setVelocity(
        Math.max(-maxV, Math.min(maxV, s.velTheta - dx * 0.0003)),
        Math.max(-maxV, Math.min(maxV, s.velPhi + dy * 0.00025)),
      );
    }
  };
  const noCtx = (e: Event) => e.preventDefault();
  window.addEventListener("mousedown", onDown);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("contextmenu", noCtx);
  return () => {
    window.removeEventListener("mousedown", onDown);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("contextmenu", noCtx);
  };
}
