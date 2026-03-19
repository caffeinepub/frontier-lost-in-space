/**
 * ElevenVoice — ElevenLabs TTS Module
 *
 * Hybrid voice system:
 *   - premium events → ElevenLabs TTS (if API key is set)
 *   - all other events  → browser SpeechSynthesis (aegisVoice)
 *
 * SETUP:
 *   Add to your .env file (project root or src/frontend/.env):
 *     VITE_ELEVEN_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxx
 *     VITE_ELEVEN_VOICE_ID=JBFqnCBsd6RMkjVDRZzb  (optional, replace with your voice)
 *
 *   The variable MUST start with VITE_ to be exposed by Vite.
 *   NEVER hardcode the key in source code.
 *
 * Fallback:
 *   If the ElevenLabs call fails for any reason (network, quota, missing key),
 *   the system automatically falls back to local browser TTS. Gameplay is never
 *   blocked.
 */

import { useSubtitleStore } from "../subtitle/useSubtitleStore";
import { speak as localSpeak } from "./aegisVoice";

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * ElevenLabs voice configuration.
 * Swap VOICE_ID to use a different ElevenLabs voice.
 * Find voice IDs at https://elevenlabs.io/voice-library
 */
export const ELEVEN_CONFIG = {
  /** ElevenLabs voice ID — change this to swap voices without touching other code */
  VOICE_ID:
    (import.meta.env.VITE_ELEVEN_VOICE_ID as string | undefined) ??
    "JBFqnCBsd6RMkjVDRZzb",
  /** TTS model — turbo v2.5 is fastest and cheapest */
  MODEL_ID: "eleven_turbo_v2_5",
  API_URL: "https://api.elevenlabs.io/v1/text-to-speech",
};

/**
 * Premium event keys that route to ElevenLabs.
 * All other events fall back to local browser TTS.
 */
const PREMIUM_EVENTS = new Set([
  "intro_start",
  "tutorial_start",
  "mission_start",
  "mission_complete",
  "anomaly_detected",
  "campaign_phase_change",
]);

// ─── Internal state ───────────────────────────────────────────────────────────

/** Tracks the currently playing ElevenLabs audio element so we can stop it. */
let _currentAudio: HTMLAudioElement | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when this event key should use ElevenLabs.
 * Safe to call with any string — unknown keys always return false.
 */
export function isPremiumEvent(eventKey: string): boolean {
  return PREMIUM_EVENTS.has(eventKey);
}

/** Read the API key from the Vite environment. Returns empty string if unset. */
function getApiKey(): string {
  return (import.meta.env.VITE_ELEVEN_API_KEY as string | undefined) ?? "";
}

// ─── Core TTS ─────────────────────────────────────────────────────────────────

/**
 * Call ElevenLabs TTS and play the audio.
 * Resolves (not rejects) on failure — caller always continues normally.
 *
 * iOS note: this must be triggered from a user gesture context (touch/click).
 * The hybrid router ensures this by only calling speakEleven during events
 * that originate from a user interaction.
 */
export async function speakEleven(text: string): Promise<void> {
  const apiKey = getApiKey();

  // Show subtitle immediately (before API call so it appears at start of speech)
  useSubtitleStore.getState().show(text);

  if (!apiKey) {
    // No key configured — clear subtitle and fall back to local voice
    // localSpeak will show its own subtitle via aegisVoice
    useSubtitleStore.getState().clear();
    localSpeak(text);
    return;
  }

  // Stop any in-progress ElevenLabs audio before starting a new one
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.src = "";
    _currentAudio = null;
  }

  try {
    const response = await fetch(
      `${ELEVEN_CONFIG.API_URL}/${ELEVEN_CONFIG.VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: ELEVEN_CONFIG.MODEL_ID,
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.78,
            style: 0.1,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;

    // Clear subtitle when audio ends
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (_currentAudio === audio) _currentAudio = null;
      useSubtitleStore.getState().clear();
    };

    // iOS requires the audio element to be "unlocked" via a user gesture.
    // We attempt play and silently fall back if autoplay is blocked.
    audio.addEventListener(
      "ended",
      () => {
        URL.revokeObjectURL(url);
        if (_currentAudio === audio) _currentAudio = null;
      },
      { once: true },
    );

    await audio.play().catch((playErr: unknown) => {
      // Autoplay blocked (common on iOS before first interaction)
      console.warn("[ElevenVoice] audio.play() blocked:", playErr);
      URL.revokeObjectURL(url);
      _currentAudio = null;
      // Fall back to local voice; clear our subtitle first so localSpeak can set its own
      useSubtitleStore.getState().clear();
      localSpeak(text);
    });
  } catch (err: unknown) {
    // Any network/parse error — fall back silently, never crash
    console.warn("[ElevenVoice] TTS failed, using local fallback:", err);
    useSubtitleStore.getState().clear();
    localSpeak(text);
  }
}

// ─── Hybrid Router ────────────────────────────────────────────────────────────

/**
 * Unified speak function.
 *
 * Usage:
 *   speakHybrid("Commander, mission complete.", "mission_complete")
 *   speakHybrid("Radar sweep active.")  // no eventKey → always local
 *
 * @param text     - Text to speak.
 * @param eventKey - Optional event key. If it matches a premium event,
 *                   ElevenLabs is used; otherwise browser TTS is used.
 */
export function speakHybrid(text: string, eventKey?: string): void {
  if (eventKey && isPremiumEvent(eventKey)) {
    // Fire-and-forget — never await in gameplay code
    speakEleven(text).catch(() => {
      // Belt-and-suspenders: fallback already handled inside speakEleven
      localSpeak(text);
    });
  } else {
    localSpeak(text);
  }
}

/** Stop all voice output (both ElevenLabs and local). */
export function stopAllVoice(): void {
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio.src = "";
    _currentAudio = null;
  }
  // Also cancel browser TTS
  window.speechSynthesis?.cancel();
  // Clear any active subtitle
  useSubtitleStore.getState().clear();
}
