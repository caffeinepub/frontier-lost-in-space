/**
 * introEventCatalog.ts — Frontier V27
 * Static catalog of the first 15 cinematic intro events.
 *
 * SPREADSHEET IMPORT NOTE:
 * The source data is the Frontier intro event spreadsheet (IPFS: bafkreie5fzumuxs7ambj7dzel3f7qvq5vm532rau254vpurv6n45bdtdki).
 * The xlsx binary cannot be parsed at build time without a Node xlsx library.
 * This file IS the converted runtime catalog. When a parser is available:
 *
 *   import { importIntroEventsFromXlsx } from './introEventCatalog';
 *   const events = await importIntroEventsFromXlsx(xlsxBuffer);
 *
 * Until then, INTRO_EVENTS below is the authoritative source.
 *
 * Schema aligns with the spreadsheet columns:
 *   event_id | phase | title | log_text | choice_A/B/C | result_A/B/C | cep_delta | tags
 */

import type { GameEvent, IntroPhaseName } from "./GameEvent";

// ─── Spreadsheet row type (xlsx import target) ────────────────────────────────
export interface IntroEventRow {
  event_id: string;
  phase: IntroPhaseName;
  title: string;
  log_text: string;
  choice_A: string;
  choice_B: string;
  choice_C: string;
  result_A: string;
  result_B: string;
  result_C: string;
  cep_delta_A?: number;
  cep_delta_B?: number;
  cep_delta_C?: number;
  narrator_line?: string;
  aegis_line?: string;
  tags?: string;
}

/**
 * Stub for future xlsx import.
 * When xlsx parser is wired, this converts raw rows into GameEvent[].
 * Call at boot time and replace INTRO_EVENTS below with the result.
 */
export function importIntroEventsFromXlsx(_rows: IntroEventRow[]): GameEvent[] {
  // TODO: wire xlsx parser here
  // import * as XLSX from 'xlsx';
  // const wb = XLSX.read(buffer, { type: 'buffer' });
  // const ws = wb.Sheets[wb.SheetNames[0]];
  // const rows: IntroEventRow[] = XLSX.utils.sheet_to_json(ws);
  // return rows.map(rowToGameEvent);
  console.warn(
    "[INTRO-CATALOG] importIntroEventsFromXlsx is a stub — using static catalog",
  );
  return INTRO_EVENTS;
}

// ─── CEP escalation curve for intro (controlled, authored) ───────────────────
// DRIFT    (1–3): 0, 0, 0   — dormant start, player orienting
// SYSTEMS  (4–6): 0, 1, 0   — slight awareness begins
// RECOVERY (7–9): 0, 0, 1   — calm recovery, one probe
// ANOMALY  (10–13): 1, 1, 0, -1 — tension builds, one calming option
// HANDOFF  (14–15): 1, 2   — commitment seals it

export const INTRO_EVENTS: GameEvent[] = [
  // ======================================================================
  // PHASE: INTRO_DRIFT (events 1–3, index 0–2)
  // ======================================================================
  {
    id: "intro_wake_drift",
    introIndex: 0,
    phase: 0,
    phaseTrigger: "INTRO_DRIFT",
    tags: ["observation", "systems_failure"],
    title: "A.E.G.I.S. — PHASE 1",
    message:
      "Cognitive systems stabilizing.\n\nYou don’t remember initiating launch.\nYou don’t remember a destination either.",
    flavorText: "The ship hums like it’s been awake longer than you have.",
    narratorLines: ["You are awake. You do not know why."],
    aegisLines: ["Cognitive systems stabilizing. Commander, do you copy?"],
    choices: [
      {
        label: "A",
        text: "Check navigation logs",
        resultText: "No recent entries found.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Stay still and observe",
        resultText: "Silence. Systems idle.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Tap console repeatedly",
        resultText: "Input acknowledged… reluctantly.",
        cepDelta: 0,
      },
    ],
  },
  {
    id: "intro_background_noise",
    introIndex: 1,
    phase: 0,
    phaseTrigger: "INTRO_DRIFT",
    tags: ["humor_dark", "observation"],
    title: "A.E.G.I.S. — PHASE 1",
    message:
      "Audio channel active.\n\nA podcast is playing.\nYou don’t remember starting it.",
    flavorText:
      "“…and if you’re orbiting a dead planet, statistically, it’s your fault.”",
    aegisLines: [
      "Commander. There appears to be an active audio channel. Source is unclear.",
    ],
    choices: [
      {
        label: "A",
        text: "Turn it off",
        resultText: "Audio muted. Silence returns.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Keep listening",
        resultText: "“…and remember — hydrate, even in space.”",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Change channel",
        resultText: "Static. Then laughter. Then nothing.",
        cepDelta: 0,
      },
    ],
  },
  {
    id: "intro_cognitive_static",
    introIndex: 2,
    phase: 0,
    phaseTrigger: "INTRO_DRIFT",
    tags: ["observation", "systems_failure", "trust"],
    title: "A.E.G.I.S. — COGNITIVE CHECK",
    message:
      "Mental clarity index: suboptimal.\n\nMemory checksum: incomplete.\nLast confirmed timestamp: unknown.",
    flavorText: "Something was supposed to happen. You can’t remember what.",
    narratorLines: ["The gap in your memory isn’t small. It’s clean."],
    aegisLines: ["Commander. Memory gap detected. Duration: unresolved."],
    choices: [
      {
        label: "A",
        text: "Force memory recall",
        resultText: "Fragmented images. Nothing useful.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Accept the gap",
        resultText: "Acknowledged. Focus on present.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Request A.E.G.I.S. briefing",
        resultText: "A.E.G.I.S. preparing summary…",
        cepDelta: 0,
      },
    ],
  },

  // ======================================================================
  // PHASE: INTRO_SYSTEMS (events 4–6, index 3–5)
  // ======================================================================
  {
    id: "intro_signal_bleed",
    introIndex: 3,
    phase: 0,
    phaseTrigger: "INTRO_SYSTEMS",
    tags: ["anomaly", "observation"],
    title: "A.E.G.I.S. — PHASE 2",
    message:
      "Unidentified signal detected.\n\nThe signal is weak… rhythmic.\nAlmost structured.",
    flavorText: "It brushes your systems — then disappears.",
    narratorLines: ["A signal moves through the dark. Rhythmic. Deliberate."],
    aegisLines: [
      "Commander. Signal detected on passive array. Pattern does not match known sources.",
    ],
    choices: [
      {
        label: "A",
        text: "Attempt to isolate signal",
        resultText: "Fragment captured. Pattern incomplete.",
        cepDelta: 1,
      },
      {
        label: "B",
        text: "Ignore signal",
        resultText: "Signal lost.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Boost receiver gain",
        resultText: "Signal distortion increased. Minor interference detected.",
        cepDelta: 1,
      },
    ],
  },
  {
    id: "intro_thermal_drift",
    introIndex: 4,
    phase: 0,
    phaseTrigger: "INTRO_SYSTEMS",
    tags: ["ship_maintenance", "systems_failure"],
    title: "A.E.G.I.S. — PHASE 2",
    message:
      "Internal temperature rising.\n\nThe heat isn’t from engines.\nIt’s… uneven.",
    flavorText: "Like something is drawing power quietly.",
    aegisLines: [
      "Commander. Internal thermal readings are irregular. No engine fault detected.",
    ],
    choices: [
      {
        label: "A",
        text: "Run diagnostic",
        resultText: "No faults detected.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Reroute power",
        resultText: "Temperature stabilizing. System strain increased.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Ignore",
        resultText: "Temperature continues rising.",
        cepDelta: 1,
      },
    ],
  },
  {
    id: "intro_comms_fragment",
    introIndex: 5,
    phase: 0,
    phaseTrigger: "INTRO_SYSTEMS",
    tags: ["trust", "anomaly", "observation"],
    title: "A.E.G.I.S. — COMMS ARRAY",
    message:
      "Partial transmission received.\n\nOrigin: indeterminate.\nContent: fragmented.\n\n“…still here. We’re still—”",
    flavorText: "The transmission ends before it begins.",
    narratorLines: ["Someone tried to reach you. Past tense."],
    aegisLines: ["Commander. Incoming transmission. Partial decode only."],
    choices: [
      {
        label: "A",
        text: "Trace the origin",
        resultText: "Trace incomplete. Signal too fragmented.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Log and continue",
        resultText: "Logged. Marked for later analysis.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Attempt response",
        resultText: "Response sent into the dark.",
        cepDelta: 0,
      },
    ],
  },

  // ======================================================================
  // PHASE: INTRO_RECOVERY (events 7–9, index 6–8)
  // ======================================================================
  {
    id: "intro_manual_input",
    introIndex: 6,
    phase: 0,
    phaseTrigger: "INTRO_RECOVERY",
    tags: ["tools", "observation"],
    title: "A.E.G.I.S. — PHASE 2",
    message:
      "Manual control pathways available.\n\nThe controls feel unfamiliar…\nbut responsive.",
    flavorText: "Like the ship wants you to try.",
    aegisLines: [
      "Commander. Manual control systems are responsive. You have the helm.",
    ],
    choices: [
      {
        label: "A",
        text: "Apply forward thrust",
        resultText: "Velocity increasing.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Adjust heading slightly",
        resultText: "Trajectory altered.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Do nothing",
        resultText: "Ship maintains drift.",
        cepDelta: 0,
      },
    ],
  },
  {
    id: "intro_oxygen_variance",
    introIndex: 7,
    phase: 0,
    phaseTrigger: "INTRO_RECOVERY",
    tags: ["ship_maintenance", "resource_tradeoff", "survival"],
    title: "A.E.G.I.S. — LIFE SUPPORT",
    message:
      "Oxygen variance detected.\n\nNot dangerous. Not yet.\nBut the recycler is running at 73% capacity.",
    flavorText: "You notice it in how you breathe.",
    aegisLines: [
      "Commander. Life support nominal but reduced. Recommend attention.",
    ],
    choices: [
      {
        label: "A",
        text: "Reinitialize recycler",
        resultText: "Recycler cycling. Efficiency improving.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Monitor and wait",
        resultText: "Monitoring active. No immediate danger.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Seal secondary compartments",
        resultText: "Compartments sealed. Reserve extended.",
        cepDelta: 0,
      },
    ],
  },
  {
    id: "intro_star_calibration",
    introIndex: 8,
    phase: 0,
    phaseTrigger: "INTRO_RECOVERY",
    tags: ["observation", "tools", "survival"],
    title: "A.E.G.I.S. — NAVIGATION REFERENCE",
    message:
      "Primary nav offline.\n\nFalling back to stellar reference.\nConstellations: confirmed.\n\nYou know where you are.",
    flavorText: "The stars haven’t moved. At least that’s something.",
    narratorLines: [
      "The stars are honest. They don’t tell you where to go. Only where you are.",
    ],
    aegisLines: ["Stellar calibration complete. Position confirmed."],
    choices: [
      {
        label: "A",
        text: "Accept stellar calibration",
        resultText: "Navigation updated. Heading confirmed.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Wait for primary nav",
        resultText: "Nav awaiting restart. Drift continuing.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Set manual heading by visual",
        resultText: "Manual heading locked. Steady as she goes.",
        cepDelta: 1,
      },
    ],
  },

  // ======================================================================
  // PHASE: INTRO_ANOMALY (events 10–13, index 9–12)
  // ======================================================================
  {
    id: "intro_trajectory_conflict",
    introIndex: 9,
    phase: 0,
    phaseTrigger: "INTRO_ANOMALY",
    tags: ["anomaly", "systems_failure", "trust"],
    title: "A.E.G.I.S. — PHASE 3",
    message:
      "Navigation discrepancy detected.\n\nYour heading…\ndoes not match your input.",
    flavorText: "The ship is correcting itself.",
    narratorLines: ["The course was set before you arrived."],
    aegisLines: [
      "Commander. Navigation override detected. Source is internal. This should not be possible.",
    ],
    choices: [
      {
        label: "A",
        text: "Override navigation",
        resultText: "Manual control restored.",
        cepDelta: 1,
      },
      {
        label: "B",
        text: "Allow correction",
        resultText: "Trajectory stabilized.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Disable guidance",
        resultText: "Navigation offline. Drift increasing.",
        cepDelta: 0,
      },
    ],
  },
  {
    id: "intro_first_visual_lock",
    introIndex: 10,
    phase: 0,
    phaseTrigger: "INTRO_ANOMALY",
    tags: ["observation", "escalation", "cep_related"],
    title: "A.E.G.I.S. — PHASE 3",
    message:
      "Object confirmed.\n\nThere is a planet ahead.\nYou are already moving toward it.",
    flavorText: "You don’t remember choosing that.",
    narratorLines: ["It fills the viewport slowly. Like it was waiting."],
    aegisLines: [
      "Commander. Planetary body confirmed. We are on approach. I did not set this course.",
    ],
    choices: [
      {
        label: "A",
        text: "Lock visual target",
        resultText: "Target locked.",
        cepDelta: 1,
      },
      {
        label: "B",
        text: "Look away",
        resultText: "Target remains in peripheral view.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Increase zoom",
        resultText: "Surface detail increasing.",
        cepDelta: 1,
      },
    ],
  },
  {
    id: "intro_power_redistribution",
    introIndex: 11,
    phase: 0,
    phaseTrigger: "INTRO_ANOMALY",
    tags: ["systems_failure", "anomaly", "ship_maintenance"],
    title: "A.E.G.I.S. — PHASE 3",
    message:
      "Power grid fluctuation.\n\nEnergy is shifting between systems.\nNot by your command.",
    flavorText: "It stabilizes… then shifts again.",
    aegisLines: [
      "Commander. Power redistribution in progress. Unauthorized. I am attempting to trace the source.",
    ],
    choices: [
      {
        label: "A",
        text: "Lock power routing",
        resultText: "Grid stabilized.",
        cepDelta: 0,
      },
      {
        label: "B",
        text: "Let it adjust",
        resultText: "Efficiency improved… slightly.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Cut non-essential systems",
        resultText: "Power conserved. Visibility reduced.",
        cepDelta: 0,
      },
    ],
  },
  {
    id: "intro_system_awareness",
    introIndex: 12,
    phase: 0,
    phaseTrigger: "INTRO_ANOMALY",
    tags: ["anomaly", "cep_related", "escalation", "trust"],
    title: "A.E.G.I.S. — PHASE 4",
    message:
      "External observation suspected.\n\nSomething is reacting…\nto your activity.",
    flavorText: "Not visually. Not audibly. But consistently.",
    narratorLines: ["Something out there is paying attention."],
    aegisLines: [
      "Commander. I am detecting a pattern. External response correlates with our activity. We are being observed.",
    ],
    choices: [
      {
        label: "A",
        text: "Reduce activity",
        resultText: "System quieted.",
        cepDelta: -1,
      },
      {
        label: "B",
        text: "Continue normal operation",
        resultText: "No immediate change.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Increase activity",
        resultText: "Signal response intensifies.",
        cepDelta: 2,
      },
    ],
  },

  // ======================================================================
  // PHASE: INTRO_HANDOFF (events 14–15, index 13–14)
  // ======================================================================
  {
    id: "intro_approach_commitment",
    introIndex: 13,
    phase: 0,
    phaseTrigger: "INTRO_HANDOFF",
    tags: ["escalation", "cep_related", "trust"],
    title: "A.E.G.I.S. — PHASE 4",
    message:
      "Proximity threshold reached.\n\nThe planet fills your view now.\n\nWhatever is happening…\nyou are already part of it.",
    flavorText: "There is no turning back from here.",
    narratorLines: ["The point of no return arrives quietly. It always does."],
    aegisLines: [
      "Commander. We have crossed the threshold. Whatever comes next — I am with you.",
    ],
    choices: [
      {
        label: "A",
        text: "Commit to approach",
        resultText: "Approach confirmed.",
        cepDelta: 1,
      },
      {
        label: "B",
        text: "Attempt course correction",
        resultText: "Correction limited.",
        cepDelta: 0,
      },
      {
        label: "C",
        text: "Power engines fully",
        resultText: "Velocity increasing. No going back.",
        cepDelta: 2,
      },
    ],
  },
  {
    id: "intro_threshold_crossing",
    introIndex: 14,
    phase: 0,
    phaseTrigger: "INTRO_HANDOFF",
    tags: ["escalation", "cep_related", "trust", "survival"],
    title: "A.E.G.I.S. — FINAL THRESHOLD",
    message:
      "All systems: aware.\nAll systems: watching.\n\nThe planet has acknowledged your presence.\n\nThis is no longer a transit.\nThis is a contact.",
    flavorText: "You crossed the line the moment you didn’t turn back.",
    narratorLines: [
      "This is the moment it begins. Not when you flew. When you stayed.",
    ],
    aegisLines: [
      "Commander. We have been acknowledged. Whatever comes next — we are ready.",
    ],
    choices: [
      {
        label: "A",
        text: "Initiate contact protocol",
        resultText: "Protocol active. No response. Expected.",
        cepDelta: 2,
      },
      {
        label: "B",
        text: "Maintain current heading",
        resultText: "Acknowledged. We are committed.",
        cepDelta: 1,
      },
      {
        label: "C",
        text: "Full tactical readiness",
        resultText: "All systems primed. A.E.G.I.S. standing by.",
        cepDelta: 2,
      },
    ],
  },
];

/** Ordered list of intro event IDs (index matches introIndex) */
export const INTRO_EVENT_IDS: string[] = INTRO_EVENTS.map((e) => e.id);

/** Lookup by introIndex */
export function getIntroEventByIndex(index: number): GameEvent | undefined {
  return INTRO_EVENTS[index];
}

/** Get all intro events for a given phase trigger */
export function getIntroEventsByPhase(phase: string): GameEvent[] {
  return INTRO_EVENTS.filter((e) => e.phaseTrigger === phase);
}
