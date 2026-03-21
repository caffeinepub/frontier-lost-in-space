/**
 * IntroPhaseController.tsx — V27
 * Drives intro phase progression and fires matched narrative events
 * via the useIntroEventEngine (locked 15-event sequence).
 *
 * Flow:
 *  1. On mount → initEngine() + startPhases() (phase = INTRO_DRIFT)
 *  2. On each phase change → engine.onPhaseEnter(phase)
 *  3. Engine fires events in locked order, phase-gated
 *  4. Phase timer still advances phases automatically
 *  5. When phaseComplete → transition to game after 1.5s
 */
import { useEffect, useRef } from "react";
import { useIntroEventEngine } from "../../intro/useIntroEventEngine";
import {
  PHASE_DURATIONS,
  useIntroPhaseStore,
} from "../../intro/useIntroPhaseStore";
import type { IntroPhaseName } from "../../narrative/GameEvent";
import { useGameState } from "../../state/useGameState";

export default function IntroPhaseController() {
  const currentPhase = useIntroPhaseStore((s) => s.currentPhase);
  const phaseComplete = useIntroPhaseStore((s) => s.phaseComplete);
  const startPhases = useIntroPhaseStore((s) => s.startPhases);
  const advancePhase = useIntroPhaseStore((s) => s.advancePhase);

  const initEngine = useIntroEventEngine((s) => s.initEngine);

  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedPhasesRef = useRef<Set<IntroPhaseName>>(new Set());
  const hasStartedRef = useRef(false);

  // Init engine + start phases on mount (once)
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    initEngine();
    startPhases();
  }, [initEngine, startPhases]);

  // React to phase changes — notify engine, start phase timer
  // biome-ignore lint/correctness/useExhaustiveDependencies: advancePhase is a stable Zustand action
  useEffect(() => {
    if (!currentPhase) return;
    if (firedPhasesRef.current.has(currentPhase)) return;
    firedPhasesRef.current.add(currentPhase);

    console.log(
      `[INTRO-PHASE] Phase active: ${currentPhase} — handing to intro engine`,
    );

    // Notify engine: it will fire the correct events in locked order
    useIntroEventEngine.getState().onPhaseEnter(currentPhase as IntroPhaseName);

    // Clear any existing phase timer
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);

    // Advance after this phase’s duration
    const duration = PHASE_DURATIONS[currentPhase];
    phaseTimerRef.current = setTimeout(() => {
      console.log(
        `[INTRO-PHASE] Duration elapsed for ${currentPhase} — advancing`,
      );
      advancePhase();
    }, duration);

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [currentPhase]);

  // When all phases complete, transition to game after 1.5s
  useEffect(() => {
    if (!phaseComplete) return;
    console.log("[INTRO-PHASE] Phase complete — transitioning to game in 1.5s");
    const t = setTimeout(() => {
      useGameState.getState().setMode("game");
    }, 1500);
    return () => clearTimeout(t);
  }, [phaseComplete]);

  return null;
}
