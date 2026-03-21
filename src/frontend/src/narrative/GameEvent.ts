/**
 * GameEvent.ts — Narrative event structure for Frontier
 * V27: added introIndex and tags fields.
 */

export type IntroPhaseName =
  | "INTRO_DRIFT"
  | "INTRO_SYSTEMS"
  | "INTRO_RECOVERY"
  | "INTRO_ANOMALY"
  | "INTRO_HANDOFF";

export type EventTag =
  | "survival"
  | "systems_failure"
  | "tools"
  | "salvage"
  | "trust"
  | "anomaly"
  | "humor_dark"
  | "cep_related"
  | "resource_tradeoff"
  | "ship_maintenance"
  | "observation"
  | "escalation";

export interface GameEventChoice {
  label: "A" | "B" | "C";
  text: string;
  resultText: string;
  cepDelta?: number;
}

export interface GameEvent {
  id: string;
  /** Position in the locked 15-event intro sequence (0–14). Undefined for adaptive events. */
  introIndex?: number;
  phase: number;
  phaseTrigger?: IntroPhaseName;
  tags?: EventTag[];
  title: string;
  message: string;
  flavorText: string;
  choices: [GameEventChoice, GameEventChoice, GameEventChoice];
  narratorLines?: string[];
  aegisLines?: string[];
}
