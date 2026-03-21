/**
 * narrativeVoice.ts — Web Speech API voice system for narrative events
 * Supports NARRATOR (deep/male) and A.E.G.I.S. (female/synthetic) characters.
 *
 * Voice selection strategy:
 *  NARRATOR: deep/male English voice
 *  AEGIS: female/synthetic English voice
 */

type NarrativeCharacter = "narrator" | "aegis";

let voiceLoadPromise: Promise<void> | null = null;

export function preloadVoices(): Promise<void> {
  if (voiceLoadPromise) return voiceLoadPromise;

  voiceLoadPromise = new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };
    // Fallback: resolve after 2s if event never fires
    setTimeout(() => resolve(), 2000);
  });

  return voiceLoadPromise;
}

function getVoice(character: NarrativeCharacter): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const enVoices = voices.filter((v) => v.lang.startsWith("en"));

  if (character === "narrator") {
    // Prefer deep/male English voices
    const malePriority = [
      "Google UK English Male",
      "Microsoft David Desktop",
      "Microsoft David",
      "Daniel",
      "Alex",
      "Fred",
      "Microsoft Mark",
    ];
    for (const name of malePriority) {
      const found = enVoices.find((v) =>
        v.name.toLowerCase().includes(name.toLowerCase()),
      );
      if (found) return found;
    }
    // Fallback: any English male (exclude obvious female names)
    const femaleHints = [
      "female",
      "zira",
      "hazel",
      "susan",
      "victoria",
      "karen",
      "samantha",
      "google uk english female",
    ];
    const maleEnglish = enVoices.find(
      (v) => !femaleHints.some((h) => v.name.toLowerCase().includes(h)),
    );
    return maleEnglish ?? enVoices[0] ?? null;
  }

  // AEGIS: prefer female/synthetic English voices
  const femalePriority = [
    "Google UK English Female",
    "Samantha",
    "Karen",
    "Victoria",
    "Microsoft Zira Desktop",
    "Microsoft Zira",
    "Hazel",
    "Susan",
  ];
  for (const name of femalePriority) {
    const found = enVoices.find((v) =>
      v.name.toLowerCase().includes(name.toLowerCase()),
    );
    if (found) return found;
  }
  // Fallback: any English voice with female indicators
  const femaleHints = [
    "female",
    "zira",
    "hazel",
    "susan",
    "victoria",
    "karen",
    "samantha",
  ];
  const femaleEnglish = enVoices.find((v) =>
    femaleHints.some((h) => v.name.toLowerCase().includes(h)),
  );
  return femaleEnglish ?? enVoices[0] ?? null;
}

export function speakAs(
  character: NarrativeCharacter,
  text: string,
  onEnd?: () => void,
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getVoice(character);
  if (voice) utterance.voice = voice;

  if (character === "narrator") {
    utterance.rate = 0.92;
    utterance.pitch = 0.85;
  } else {
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
  }

  utterance.volume = 0.85;

  if (onEnd) {
    utterance.onend = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

export function speakLines(
  character: NarrativeCharacter,
  lines: string[],
  onAllDone?: () => void,
): void {
  if (!lines || lines.length === 0) {
    onAllDone?.();
    return;
  }

  const remaining = [...lines];

  function speakNext() {
    const line = remaining.shift();
    if (!line) {
      onAllDone?.();
      return;
    }
    speakAs(character, line, () => {
      if (remaining.length > 0) {
        setTimeout(speakNext, 300);
      } else {
        onAllDone?.();
      }
    });
  }

  speakNext();
}

export function stopNarrativeVoice(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
