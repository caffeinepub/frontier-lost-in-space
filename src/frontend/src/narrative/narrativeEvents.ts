/**
 * narrativeEvents.ts — All narrative GameEvent definitions
 *
 * V27: Intro events now sourced from introEventCatalog (15 ordered events).
 * Original 5 phase-1 events remain as the adaptive event pool.
 * getEventsByPhaseTrigger returns from the intro catalog only,
 * preserving backward compatibility with IntroPhaseController.
 */

import type { GameEvent } from "./GameEvent";
import { INTRO_EVENTS } from "./introEventCatalog";

// ── Adaptive event pool (post-intro, phase-1 events) ─────────────────────────
const ADAPTIVE_EVENTS: GameEvent[] = [
  {
    id: "intro_signal_detected",
    phase: 1,
    title: "UNKNOWN SIGNAL DETECTED",
    message:
      "Long-range sensors have picked up an anomalous signal originating from Earth’s upper atmosphere. Pattern suggests artificial origin.",
    flavorText:
      "The signal pulses at irregular intervals — almost like breathing.",
    narratorLines: [
      "A signal cuts through the static. Origin: unknown.",
      "The ship’s systems stir. Something has noticed you.",
    ],
    aegisLines: [
      "Commander. I’ve isolated the signal. It’s not a natural phenomenon.",
    ],
    choices: [
      {
        label: "A",
        text: "Analyze the signal",
        resultText:
          "Signal analysis logged. A.E.G.I.S. begins decoding the pattern.",
        cepDelta: 1,
      },
      {
        label: "B",
        text: "Ignore and maintain course",
        resultText: "Signal noted and dismissed. The ship holds steady.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Broadcast a response",
        resultText:
          "Response transmitted. Whatever is out there now knows you’re here.",
        cepDelta: 2,
      },
    ],
  },
  {
    id: "intro_systems_wake",
    phase: 1,
    title: "SYSTEM INITIALIZATION",
    message:
      "Primary systems coming online. A.E.G.I.S. reports multiple subsystems in degraded state. Tactical options are limited.",
    flavorText:
      "The cockpit hums and flickers. You are alive. The ship is alive. Barely.",
    aegisLines: [
      "Commander. Systems initializing. Some modules remain offline. I recommend we assess the damage before proceeding.",
    ],
    choices: [
      {
        label: "A",
        text: "Run full diagnostics",
        resultText:
          "Full system scan initiated. Damage scope confirmed. Repair protocols queued.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Prioritize weapons first",
        resultText:
          "Weapon systems brought online. Defensive posture established.",
        cepDelta: 1,
      },
      {
        label: "C",
        text: "All power to sensors",
        resultText:
          "Sensor array at full capacity. Environmental awareness maximized.",
        cepDelta: 1,
      },
    ],
  },
  {
    id: "phase1_first_contact",
    phase: 1,
    title: "FIRST CONTACT PROTOCOL",
    message:
      "A.E.G.I.S. has flagged an inbound object of unknown origin. It does not match any known satellite registry.",
    flavorText: "It’s small. It’s fast. And it’s heading directly for you.",
    narratorLines: [
      "Something closes in from the dark. The radar doesn’t lie.",
    ],
    aegisLines: [
      "Commander. I cannot classify this object. Recommend immediate action.",
    ],
    choices: [
      {
        label: "A",
        text: "Target and engage immediately",
        resultText: "Weapons locked. Engagement initiated. Target eliminated.",
        cepDelta: 2,
      },
      {
        label: "B",
        text: "Hail the object",
        resultText: "Broadcast sent. No response. Object continues approach.",
        cepDelta: 1,
      },
      {
        label: "C",
        text: "Evasive maneuvers",
        resultText:
          "Ship repositioned. Object passes harmlessly. Threat logged.",
        cepDelta: 0,
      },
    ],
  },
  {
    id: "phase1_cep_warning",
    phase: 1,
    title: "CEP THRESHOLD WARNING",
    message:
      "Planetary systems are responding to your presence. Consequence Execution Protocol has been initialized. This is not a drill.",
    flavorText: "The planet watches. It has always been watching.",
    aegisLines: [
      "Commander. CEP levels are rising. The system is aware of us. I advise caution.",
    ],
    narratorLines: [
      "The protocol activates. Ancient mechanisms stir beneath the clouds.",
    ],
    choices: [
      {
        label: "A",
        text: "Stand down — reduce activity",
        resultText:
          "Activity reduced. CEP escalation slows. The planet’s attention wavers.",
        cepDelta: -1,
      },
      {
        label: "B",
        text: "Ignore the warning and press on",
        resultText:
          "Mission continues. CEP escalates. The cost remains unknown.",
        cepDelta: 2,
      },
      {
        label: "C",
        text: "Prepare countermeasures",
        resultText: "Defense protocols armed. A.E.G.I.S. stands ready.",
        cepDelta: 1,
      },
    ],
  },
  {
    id: "phase1_aegis_revelation",
    phase: 1,
    title: "A.E.G.I.S. CLASSIFIED LOG",
    message:
      "A.E.G.I.S. has unlocked a previously classified mission brief. The nature of this mission has changed.",
    flavorText:
      "Some knowledge cannot be unlearned. The briefing changes everything.",
    aegisLines: [
      "Commander. I have accessed the classified layer. You need to hear this.",
      "This mission was never about exploration. It was about containment.",
    ],
    choices: [
      {
        label: "A",
        text: "Accept the mission as classified",
        resultText:
          "Classified parameters acknowledged. New objectives uploaded.",
        cepDelta: 1,
      },
      {
        label: "B",
        text: "Demand full transparency",
        resultText:
          "Full mission brief requested. A.E.G.I.S. complies. The truth is… complicated.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Abort and return to orbit",
        resultText: "Withdrawal initiated. Distance from CEP zone increasing.",
        cepDelta: -2,
      },
    ],
  },
];

/** Combined catalog: intro events first, adaptive pool after */
export const NARRATIVE_EVENTS: GameEvent[] = [
  ...INTRO_EVENTS,
  ...ADAPTIVE_EVENTS,
];

export function getEventById(id: string): GameEvent | undefined {
  return NARRATIVE_EVENTS.find((e) => e.id === id);
}

/**
 * Returns intro catalog events matching the given phase trigger.
 * Used by IntroPhaseController for phase-based triggers.
 * NOTE: V27 — IntroPhaseController now defers to useIntroEventEngine.
 * This function is kept for backward compatibility.
 */
export function getEventsByPhaseTrigger(phaseTrigger: string): GameEvent[] {
  const result: GameEvent[] = [];
  for (const e of INTRO_EVENTS) {
    if (e.phaseTrigger === phaseTrigger) result.push(e);
  }
  return result;
}

/** Returns adaptive pool events (phase >= 1, no introIndex) */
export function getAdaptiveEvents(): GameEvent[] {
  return ADAPTIVE_EVENTS;
}
