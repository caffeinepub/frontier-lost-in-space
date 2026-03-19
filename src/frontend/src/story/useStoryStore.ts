/**
 * useStoryStore — Section 3: Story Mode
 *
 * PHASE 1 is fully implemented.
 * Phases 2–6 are scaffolded as structured stubs.
 *
 * Persisted key: tci_story_v1
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StoryPhase = 1 | 2 | 3 | 4 | 5 | 6;

export type Phase1EventId =
  | "p1_systems_damaged"
  | "p1_oxygen_warning"
  | "p1_aegis_first_contact"
  | "p1_hull_breach"
  | "p1_first_threat"
  | "p1_survival_choice"
  | "p1_stabilized";

export interface StoryChoice {
  id: string;
  eventId: Phase1EventId;
  choiceText: string;
  chosenAt: number;
  consequence: string;
}

export interface EventChoiceOption {
  text: string;
  consequence: string;
  /** Resource deltas applied on choice */
  effects?: {
    oxygen?: number;
    hull?: number;
    power?: number;
    credits?: number;
  };
}

export interface Phase1EventData {
  id: Phase1EventId;
  triggerCondition: string;
  aegisDialogue: string;
  narrative: string;
  choices: EventChoiceOption[];
}

export interface PhaseScaffold {
  phase: StoryPhase;
  name: string;
  description: string;
  unlockCondition: string;
  status: "locked" | "active" | "complete";
  events: string[];
}

// ============================================================
// PHASE 1 EVENT DEFINITIONS
// ============================================================
export const PHASE1_EVENTS: Phase1EventData[] = [
  {
    id: "p1_systems_damaged",
    triggerCondition: "on_tutorial_complete",
    aegisDialogue:
      "Commander. Damage assessment complete. Primary systems are offline. We are adrift.",
    narrative:
      "The ship lurches as another power relay fails. A.E.G.I.S. runs a rapid diagnostic \u2014 the news is not good.",
    choices: [
      {
        text: "Reroute emergency power to life support",
        consequence: "Life support stabilized. Power reduced.",
        effects: { oxygen: 20, power: -15 },
      },
      {
        text: "Prioritize hull integrity first",
        consequence: "Hull reinforced. Oxygen at risk.",
        effects: { hull: 15, oxygen: -10 },
      },
      {
        text: "Send distress signal",
        consequence: "Signal broadcast. Rescue beacon unlocked.",
        effects: { power: -5 },
      },
    ],
  },
  {
    id: "p1_oxygen_warning",
    triggerCondition: "oxygen_below_40",
    aegisDialogue:
      "Warning. Oxygen recycler efficiency dropping. Estimated breathable atmosphere: 4 hours.",
    narrative:
      "The air tastes stale. A.E.G.I.S. flags the recycler failure on your HUD.",
    choices: [
      {
        text: "Manual repair (costs 50 credits)",
        consequence: "Recycler repaired. Oxygen restored.",
        effects: { oxygen: 30, credits: -50 },
      },
      {
        text: "Vent and recycle remaining reserves",
        consequence: "Reserves extended. Minor hull stress.",
        effects: { oxygen: 15, hull: -5 },
      },
      {
        text: "Ignore for now",
        consequence: "Oxygen continues declining.",
        effects: {},
      },
    ],
  },
  {
    id: "p1_aegis_first_contact",
    triggerCondition: "on_first_scan",
    aegisDialogue:
      "I have detected a signal. Origin: unknown. It is not natural. Commander\u2026 we are not alone out here.",
    narrative:
      "A.E.G.I.S. triangulates a faint repeating signal from deep space. Its pattern is deliberate. Artificial.",
    choices: [
      {
        text: "Investigate the signal",
        consequence: "Discovery path unlocked. Phase 2 route activated.",
        effects: {},
      },
      {
        text: "Ignore \u2014 focus on repairs",
        consequence: "Signal fades. Delayed discovery.",
        effects: { oxygen: 5, hull: 5 },
      },
    ],
  },
  {
    id: "p1_hull_breach",
    triggerCondition: "hull_below_50",
    aegisDialogue:
      "Hull integrity critical. Micro-fractures detected in forward section. Recommend immediate action.",
    narrative:
      "The ship groans. A dozen small leaks are vectoring into one large problem.",
    choices: [
      {
        text: "Emergency patch (costs 80 credits)",
        consequence: "Hull stabilized.",
        effects: { hull: 25, credits: -80 },
      },
      {
        text: "Reinforce with available materials",
        consequence: "Partial reinforcement. Power cost.",
        effects: { hull: 10, power: -10 },
      },
      {
        text: "Seal and abandon forward section",
        consequence: "Hull stabilizes. Upgrade slot lost.",
        effects: { hull: 20 },
      },
    ],
  },
  {
    id: "p1_first_threat",
    triggerCondition: "on_first_combat",
    aegisDialogue:
      "Contact. Inbound debris field \u2014 classification: hostile remnants. Weapons free, Commander.",
    narrative:
      "Shrapnel from a destroyed vessel drifts toward Earth. A.E.G.I.S. marks it hostile.",
    choices: [],
  },
  {
    id: "p1_survival_choice",
    triggerCondition: "after_three_events",
    aegisDialogue:
      "Commander. Three critical failures in rapid succession. This was not an accident.",
    narrative:
      "A.E.G.I.S. presents a disturbing pattern. The damage is too symmetrical. Too precise. Someone \u2014 or something \u2014 did this.",
    choices: [
      {
        text: "Accept the mission \u2014 find who did this",
        consequence: "Phase 2 escalation path activated.",
        effects: {},
      },
      {
        text: "Focus only on survival",
        consequence: "Phase 2 delayed. Better resource recovery.",
        effects: { oxygen: 10, hull: 10, power: 10 },
      },
    ],
  },
  {
    id: "p1_stabilized",
    triggerCondition: "oxygen_above_60_and_hull_above_60",
    aegisDialogue:
      "Systems stabilizing. You did it, Commander. Phase one survival achieved.",
    narrative:
      "Against the odds, the ship steadies. The worst may be over \u2014 or it may just be beginning.",
    choices: [],
  },
];

// ============================================================
// PHASE 2-6 SCAFFOLDS
// ============================================================
const PHASE_SCAFFOLDS: PhaseScaffold[] = [
  {
    phase: 2,
    name: "STABILIZATION",
    description:
      "Restore critical systems and achieve basic operational status.",
    unlockCondition: "phase_1_complete",
    status: "locked",
    events: ["p2_first_upgrade", "p2_systems_restored", "p2_new_contact"],
  },
  {
    phase: 3,
    name: "DISCOVERY",
    description: "Anomalous readings lead to an unexpected encounter.",
    unlockCondition: "phase_2_complete",
    status: "locked",
    events: ["p3_anomaly_detected", "p3_first_material", "p3_signal_source"],
  },
  {
    phase: 4,
    name: "ESCALATION",
    description:
      "Threats multiply. Systems begin failing again under coordinated assault.",
    unlockCondition: "phase_3_complete",
    status: "locked",
    events: [
      "p4_coordinated_attack",
      "p4_system_cascade",
      "p4_unknown_contact",
    ],
  },
  {
    phase: 5,
    name: "BREAKTHROUGH",
    description: "A discovery changes everything. New capabilities unlock.",
    unlockCondition: "phase_4_complete",
    status: "locked",
    events: ["p5_tech_breakthrough", "p5_new_systems", "p5_alliance_offer"],
  },
  {
    phase: 6,
    name: "RESOLUTION",
    description: "The final reckoning. Escape, evolve, or unknown outcome.",
    unlockCondition: "phase_5_complete",
    status: "locked",
    events: ["p6_final_choice", "p6_escape_sequence", "p6_resolution"],
  },
];

interface StoryState {
  currentPhase: StoryPhase;
  phase1Complete: boolean;
  triggeredEvents: Phase1EventId[];
  pendingEvent: Phase1EventData | null;
  choices: StoryChoice[];
  phaseScaffolds: PhaseScaffold[];
  firstScanDone: boolean;
  firstCombatDone: boolean;

  // Resources (Phase 1 survival pressure)
  oxygenLevel: number;
  hullIntegrity: number;
  powerLevel: number;
  creditsAvailable: number;

  // Actions
  triggerEvent: (eventId: Phase1EventId) => void;
  makeChoice: (eventId: Phase1EventId, choiceIndex: number) => void;
  dismissEvent: () => void;
  tickResources: () => void;
  advanceToPhase: (phase: StoryPhase) => void;
  markFirstScan: () => void;
  markFirstCombat: () => void;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      currentPhase: 1,
      phase1Complete: false,
      triggeredEvents: [],
      pendingEvent: null,
      choices: [],
      phaseScaffolds: PHASE_SCAFFOLDS,
      firstScanDone: false,
      firstCombatDone: false,

      oxygenLevel: 72,
      hullIntegrity: 68,
      powerLevel: 55,
      creditsAvailable: 200,

      triggerEvent: (eventId) => {
        const s = get();
        // Don't retrigger already-seen events
        if (s.triggeredEvents.includes(eventId)) return;
        // Don't queue if something is already pending
        if (s.pendingEvent) return;
        const eventDef = PHASE1_EVENTS.find((e) => e.id === eventId);
        if (!eventDef) return;
        // Auto-dismiss events with no choices
        if (eventDef.choices.length === 0) {
          set((prev) => ({
            triggeredEvents: [...prev.triggeredEvents, eventId],
          }));
          // Check stabilized condition after auto-events
          if (eventId === "p1_stabilized") {
            set({ phase1Complete: true });
          }
          return;
        }
        set((prev) => ({
          triggeredEvents: [...prev.triggeredEvents, eventId],
          pendingEvent: eventDef,
        }));
      },

      makeChoice: (eventId, choiceIndex) => {
        const eventDef = PHASE1_EVENTS.find((e) => e.id === eventId);
        if (!eventDef) return;
        const choice = eventDef.choices[choiceIndex];
        if (!choice) return;

        const effects = choice.effects ?? {};
        set((prev) => ({
          pendingEvent: null,
          choices: [
            ...prev.choices,
            {
              id: `choice-${Date.now()}`,
              eventId,
              choiceText: choice.text,
              chosenAt: Date.now(),
              consequence: choice.consequence,
            },
          ],
          oxygenLevel: Math.max(
            0,
            Math.min(100, prev.oxygenLevel + (effects.oxygen ?? 0)),
          ),
          hullIntegrity: Math.max(
            0,
            Math.min(100, prev.hullIntegrity + (effects.hull ?? 0)),
          ),
          powerLevel: Math.max(
            0,
            Math.min(100, prev.powerLevel + (effects.power ?? 0)),
          ),
          creditsAvailable: Math.max(
            0,
            prev.creditsAvailable + (effects.credits ?? 0),
          ),
        }));
      },

      dismissEvent: () => set({ pendingEvent: null }),

      tickResources: () => {
        const s = get();
        // Decay oxygen and power each tick; hull is stable unless event
        const newOxygen = Math.max(0, s.oxygenLevel - 2);
        const newPower = Math.max(0, s.powerLevel - 1);
        set({ oxygenLevel: newOxygen, powerLevel: newPower });

        // Check trigger conditions
        if (newOxygen <= 40) s.triggerEvent("p1_oxygen_warning");
        if (s.hullIntegrity <= 50) s.triggerEvent("p1_hull_breach");
        if (newOxygen >= 60 && s.hullIntegrity >= 60 && !s.phase1Complete) {
          s.triggerEvent("p1_stabilized");
        }
        // after_three_events
        if (s.triggeredEvents.length >= 3) {
          s.triggerEvent("p1_survival_choice");
        }
      },

      advanceToPhase: (phase) => {
        set((prev) => ({
          currentPhase: phase,
          phaseScaffolds: prev.phaseScaffolds.map((p) =>
            p.phase === phase
              ? { ...p, status: "active" }
              : p.phase < phase
                ? { ...p, status: "complete" }
                : p,
          ),
        }));
      },

      markFirstScan: () => {
        if (get().firstScanDone) return;
        set({ firstScanDone: true });
        get().triggerEvent("p1_aegis_first_contact");
      },

      markFirstCombat: () => {
        if (get().firstCombatDone) return;
        set({ firstCombatDone: true });
        get().triggerEvent("p1_first_threat");
      },
    }),
    {
      name: "tci_story_v1",
      partialize: (s) => ({
        currentPhase: s.currentPhase,
        phase1Complete: s.phase1Complete,
        triggeredEvents: s.triggeredEvents,
        choices: s.choices,
        phaseScaffolds: s.phaseScaffolds,
        firstScanDone: s.firstScanDone,
        firstCombatDone: s.firstCombatDone,
        oxygenLevel: s.oxygenLevel,
        hullIntegrity: s.hullIntegrity,
        powerLevel: s.powerLevel,
        creditsAvailable: s.creditsAvailable,
      }),
    },
  ),
);
