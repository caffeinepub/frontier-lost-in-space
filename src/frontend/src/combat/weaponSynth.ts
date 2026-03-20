/**
 * weaponSynth.ts — Web Audio API synthesizer for weapon feedback cues.
 * V22.1: COMBAT FEELS REAL LAYER
 *
 * All sounds are synthesized (no audio files needed).
 * AudioContext is lazily initialized on first user gesture.
 * All operations wrapped in try/catch — never throws.
 */

let _ctx: AudioContext | null = null;
let _initialized = false;

/** Must be called from a user gesture handler (pointerdown/touchstart). */
export function initAudio(): void {
  try {
    if (!_ctx) {
      _ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    }
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    _initialized = true;
  } catch {
    // Browser may block AudioContext creation
  }
}

function getCtx(): AudioContext | null {
  if (!_initialized || !_ctx) return null;
  try {
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
  } catch {
    /* ignore */
  }
  return _ctx;
}

/**
 * Soft sine hum near zone — intentLevel 1.
 * ~80Hz, ~150ms, very quiet (gain 0.04).
 */
export function playNearZone(): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.06);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    /* ignore */
  }
}

/**
 * Rising tone on dwell hold — intentLevel 2.
 * Frequency sweep 180→520Hz mapped to progress 0→1, ~80ms pulse.
 */
export function playHoldRise(progress: number): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const freq = 180 + (520 - 180) * Math.max(0, Math.min(1, progress));
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    /* ignore */
  }
}

/**
 * Lock click — intentLevel 3 / confirm.
 * Short sine burst 800Hz ~12ms, gain 0.08.
 */
export function playLockClick(): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.013);
  } catch {
    /* ignore */
  }
}

/**
 * Discharge burst on fire — per weapon type.
 * pulse: high-freq noise burst ~60ms
 * missile: low thud ~80ms
 * railgun: sharp crack ~40ms
 * emp: wide sweep down 600→100Hz ~100ms
 * All at gain ~0.1.
 */
export function playDischargeBurst(weaponType: string): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (weaponType === "pulse") {
      const bufLen = Math.floor(ctx.sampleRate * 0.06);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      }
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      src.buffer = buf;
      src.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      src.start(ctx.currentTime);
    } else if (weaponType === "missile") {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);
    } else if (weaponType === "railgun") {
      const bufLen = Math.floor(ctx.sampleRate * 0.04);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(gain);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      src.start(ctx.currentTime);
    } else if (weaponType === "emp") {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.11);
    }
  } catch {
    /* ignore */
  }
}
