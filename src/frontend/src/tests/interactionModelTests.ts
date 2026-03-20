/**
 * interactionModelTests.ts — Model-based interaction tests using the FSM as source of truth.
 *
 * Each test path exercises the state machine's transition logic.
 * The FSM's TRANSITION_TABLE is the ground truth — tests verify it enforces correct paths.
 *
 * Usage:
 *   import { runInteractionModelTests } from './interactionModelTests';
 *   const results = runInteractionModelTests();
 */

import { interactionBus } from "../interaction/InteractionEventBus";
import {
  InteractionFSM,
  InteractionState,
} from "../interaction/InteractionStateMachine";

export interface ModelTestResult {
  path: string;
  steps: string[];
  pass: boolean;
  failAt?: string;
  reason?: string;
}

/** Run a sequence of transitions on a fresh FSM instance and verify final state. */
function runPath(
  fsm: InteractionFSM,
  path: string,
  steps: Array<{
    to: InteractionState;
    expectSuccess: boolean;
    reason: string;
  }>,
): ModelTestResult {
  const stepLabels: string[] = [];

  for (const step of steps) {
    const ok = fsm.transition(step.to, step.reason);
    const label = `${step.to}(${ok ? "ok" : "blocked"})`;
    stepLabels.push(label);

    if (ok !== step.expectSuccess) {
      return {
        path,
        steps: stepLabels,
        pass: false,
        failAt: step.to,
        reason: `Expected transition to ${step.to} to ${step.expectSuccess ? "succeed" : "be blocked"} but got ${ok ? "success" : "blocked"}`,
      };
    }
  }

  return { path, steps: stepLabels, pass: true };
}

export function runInteractionModelTests(): ModelTestResult[] {
  const results: ModelTestResult[] = [];

  // ── Test 1: tapLock ──────────────────────────────────────────────────────
  // idle → pointerDown → tapCandidate → targetLocked
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "tapLock", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact",
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold",
        },
        {
          to: InteractionState.targetLocked,
          expectSuccess: true,
          reason: "globe hit confirmed",
        },
      ]),
    );
    fsm.reset();
  }

  // ── Test 2: dragRotate ────────────────────────────────────────────────────
  // idle → pointerDown → tapCandidate → draggingGlobe → idle
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "dragRotate", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact",
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold",
        },
        {
          to: InteractionState.draggingGlobe,
          expectSuccess: true,
          reason: "moved > 8px",
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "pointer up",
        },
      ]),
    );
    fsm.reset();
  }

  // ── Test 3: tapOutsideGlobe ───────────────────────────────────────────────
  // idle → pointerDown → tapCandidate → idle (no globe hit)
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "tapOutsideGlobe", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact",
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold",
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "no globe hit",
        },
      ]),
    );
    fsm.reset();
  }

  // ── Test 4: joystickWhileIdle ─────────────────────────────────────────────
  // idle → joystickActive → idle
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "joystickWhileIdle", [
        {
          to: InteractionState.joystickActive,
          expectSuccess: true,
          reason: "joystick > deadzone",
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "joystick neutral",
        },
      ]),
    );
    fsm.reset();
  }

  // ── Test 5: joystickDuringLock ────────────────────────────────────────────
  // idle → pointerDown → tapCandidate → targetLocked → joystickActive
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "joystickDuringLock", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact",
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold",
        },
        {
          to: InteractionState.targetLocked,
          expectSuccess: true,
          reason: "globe hit confirmed",
        },
        {
          to: InteractionState.joystickActive,
          expectSuccess: true,
          reason: "joystick moved while locked",
        },
      ]),
    );
    fsm.reset();
  }

  // ── Test 6: rapidTapDrag — ILLEGAL skip ───────────────────────────────────
  // idle → pointerDown → draggingGlobe (skip tapCandidate — should succeed from pointerDown)
  // This tests that the FSM allows pointerDown → draggingGlobe directly (it IS in the table)
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "rapidTapDrag", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact",
        },
        // pointerDown → draggingGlobe IS in TRANSITION_TABLE so this should succeed
        {
          to: InteractionState.draggingGlobe,
          expectSuccess: true,
          reason: "rapid movement > threshold",
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "pointer up",
        },
      ]),
    );
    fsm.reset();
  }

  // ── Test 7: overlayInterception ───────────────────────────────────────────
  // Tests that illegalInputInterception event is emitted when an illegal overlay intercepts.
  // We simulate this by emitting the event and verifying the bus received it.
  {
    let caught = false;
    const unsub = interactionBus.subscribe((e) => {
      if (e.type === "illegalInputInterception") caught = true;
    });

    interactionBus.emit({
      type: "illegalInputInterception",
      source: "test-overlay",
      data: { reason: "test: overlay intercepted pointer-events" },
    });

    unsub();

    results.push({
      path: "overlayInterception",
      steps: ["emit(illegalInputInterception)", `caught=${caught}`],
      pass: caught,
      failAt: caught ? undefined : "illegalInputInterception",
      reason: caught
        ? undefined
        : "Bus did not deliver illegalInputInterception event",
    });
  }

  return results;
}
