/**
 * InteractionStateMachine.ts — Explicit FSM for the Frontier tactical viewport interaction system.
 *
 * V19 — original implementation.
 * V20 — Production hardening:
 *   - Added pointerDown → idle transition (pointer cancel / browser blur path)
 *   - Added joystickActive → targetLocked transition (lock while moving)
 *   - Added stuck-state watchdog: auto-resets from pointerDown/tapCandidate after WATCHDOG_TIMEOUT_MS
 *   - Watchdog resets are clearly logged with [FSM-WATCHDOG] prefix
 *   - Watchdog can be armed/disarmed per pointer session
 *
 * States and transitions are the single source of truth for interaction flow.
 * Illegal transitions emit console warnings; they do NOT silently proceed.
 */

export enum InteractionState {
  idle = "idle",
  pointerDown = "pointerDown",
  tapCandidate = "tapCandidate",
  draggingGlobe = "draggingGlobe",
  targetLocked = "targetLocked",
  joystickActive = "joystickActive",
  debugInspecting = "debugInspecting",
}

/** Allowed transitions: from → [...allowed to states] */
export const TRANSITION_TABLE: Record<InteractionState, InteractionState[]> = {
  [InteractionState.idle]: [
    InteractionState.pointerDown,
    InteractionState.joystickActive,
    InteractionState.debugInspecting,
  ],
  [InteractionState.pointerDown]: [
    InteractionState.tapCandidate,
    InteractionState.draggingGlobe,
    InteractionState.idle, // V20: pointer cancel / blur abort path
    InteractionState.debugInspecting,
  ],
  [InteractionState.tapCandidate]: [
    InteractionState.targetLocked,
    InteractionState.idle,
    InteractionState.draggingGlobe,
    InteractionState.debugInspecting,
  ],
  [InteractionState.draggingGlobe]: [
    InteractionState.idle,
    InteractionState.debugInspecting,
  ],
  [InteractionState.targetLocked]: [
    InteractionState.idle,
    InteractionState.draggingGlobe,
    InteractionState.joystickActive,
    InteractionState.debugInspecting,
  ],
  [InteractionState.joystickActive]: [
    InteractionState.idle,
    InteractionState.targetLocked, // V20: lock while joystick is active
    InteractionState.debugInspecting,
  ],
  [InteractionState.debugInspecting]: [InteractionState.idle],
};

/** States that should never persist beyond WATCHDOG_TIMEOUT_MS without resolution. */
export const WATCHDOG_STATES: InteractionState[] = [
  InteractionState.pointerDown,
  InteractionState.tapCandidate,
];

/** Auto-reset timeout for transient states (ms). Tunable via setWatchdogTimeout(). */
export const WATCHDOG_TIMEOUT_MS = 2000;

interface HistoryEntry {
  from: InteractionState;
  to: InteractionState;
  reason: string;
  ts: number;
}

/**
 * InteractionFSM — Explicit finite state machine for tactical input.
 *
 * - Logs all valid transitions with [FSM] prefix
 * - Warns on illegal transitions
 * - Maintains a rolling history of the last 50 transitions
 * - Watchdog auto-resets transient states to prevent stuck FSM
 */
export class InteractionFSM {
  private _current: InteractionState = InteractionState.idle;
  private _history: HistoryEntry[] = [];
  private _stateChangeListeners: Array<(s: InteractionState) => void> = [];
  private _watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private _watchdogTimeoutMs = WATCHDOG_TIMEOUT_MS;
  private _stateEnteredAt = Date.now();

  get current(): InteractionState {
    return this._current;
  }

  /** Milliseconds elapsed since the current state was entered. */
  get stuckDurationMs(): number {
    return Date.now() - this._stateEnteredAt;
  }

  /** Override the watchdog timeout (useful in tests or for tuning). */
  setWatchdogTimeout(ms: number): void {
    this._watchdogTimeoutMs = ms;
  }

  /**
   * Attempt a state transition. Returns true on success, false on illegal.
   * @param to    Target state
   * @param reason  Human-readable reason for logging
   */
  transition(to: InteractionState, reason = "no reason provided"): boolean {
    const from = this._current;
    const allowed = TRANSITION_TABLE[from] ?? [];

    if (to === from) {
      // Same-state transitions silently ignored — not illegal, not logged
      return true;
    }

    if (!allowed.includes(to)) {
      console.warn(
        `[FSM] ILLEGAL: ${from} → ${to} (reason: ${reason}) — transition blocked. Allowed from ${from}: [${allowed.join(", ")}]`,
      );
      return false;
    }

    // Disarm any existing watchdog before entering new state
    this._clearWatchdog();

    const entry: HistoryEntry = { from, to, reason, ts: Date.now() };
    this._history = [...this._history.slice(-49), entry];
    this._current = to;
    this._stateEnteredAt = Date.now();

    console.log(`[FSM] ${from} → ${to}: ${reason}`);

    for (const listener of this._stateChangeListeners) {
      try {
        listener(to);
      } catch (_) {
        // Suppress listener errors to prevent FSM from breaking
      }
    }

    // Arm watchdog for transient states
    if (WATCHDOG_STATES.includes(to)) {
      this._armWatchdog(to);
    }

    return true;
  }

  /** Reset to idle unconditionally. Use for test cleanup. */
  reset(): void {
    this._clearWatchdog();
    const from = this._current;
    this._current = InteractionState.idle;
    this._stateEnteredAt = Date.now();
    this._history = [
      ...this._history.slice(-49),
      { from, to: InteractionState.idle, reason: "reset", ts: Date.now() },
    ];
    for (const listener of this._stateChangeListeners) {
      try {
        listener(InteractionState.idle);
      } catch (_) {}
    }
  }

  /** Returns a copy of the last 50 history entries. */
  getHistory(): HistoryEntry[] {
    return [...this._history];
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  onStateChange(listener: (s: InteractionState) => void): () => void {
    this._stateChangeListeners.push(listener);
    return () => {
      this._stateChangeListeners = this._stateChangeListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  private _armWatchdog(state: InteractionState): void {
    this._watchdogTimer = setTimeout(() => {
      if (this._current === state) {
        console.warn(
          `[FSM-WATCHDOG] State "${state}" held for ${this._watchdogTimeoutMs}ms without resolution — auto-resetting to idle`,
        );
        // Bypass normal transition logic to force idle regardless of table
        const from = this._current;
        this._current = InteractionState.idle;
        this._stateEnteredAt = Date.now();
        this._history = [
          ...this._history.slice(-49),
          {
            from,
            to: InteractionState.idle,
            reason: `watchdog auto-reset after ${this._watchdogTimeoutMs}ms`,
            ts: Date.now(),
          },
        ];
        for (const listener of this._stateChangeListeners) {
          try {
            listener(InteractionState.idle);
          } catch (_) {}
        }
      }
    }, this._watchdogTimeoutMs);
  }

  private _clearWatchdog(): void {
    if (this._watchdogTimer !== null) {
      clearTimeout(this._watchdogTimer);
      this._watchdogTimer = null;
    }
  }
}

/** Global singleton FSM — the canonical interaction state for the entire app. */
export const globalFSM = new InteractionFSM();
