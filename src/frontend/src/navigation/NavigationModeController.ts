/**
 * NavigationModeController.ts — Higher-level navigation/gameplay mode system for Frontier.
 *
 * V20 — New system. Sits ABOVE the interaction FSM (InteractionStateMachine.ts).
 * Does NOT modify the interaction FSM. Owns camera behavior, globe behavior,
 * input ownership, and HUD state declarations per mode.
 *
 * NAVIGATION MODES
 * ─────────────────────────────────────────────────────────────────
 * orbitObservation  — Default patrol view. Globe rotates freely.
 * tacticalLock      — Active targeting engaged. Globe owns all input.
 * approach          — Closing on a target. Camera tightens on lock.
 * breakaway         — Disengaging. Camera pulls back. Globe disabled.
 * cruise            — Transit mode. Joystick is primary. Globe is passive.
 *
 * ALLOWED TRANSITIONS (enforced, illegal transitions are logged + blocked):
 *   orbitObservation → tacticalLock
 *   tacticalLock     → breakaway
 *   breakaway        → cruise
 *   cruise           → approach
 *   approach         → tacticalLock
 *
 * All transitions are logged with [NAV-MODE] prefix.
 */

// ─── Mode Types ──────────────────────────────────────────────────────────────

export type NavigationMode =
  | "orbitObservation"
  | "tacticalLock"
  | "approach"
  | "breakaway"
  | "cruise";

// ─── Mode Definitions ────────────────────────────────────────────────────────

export interface NavigationModeDefinition {
  mode: NavigationMode;
  /** Human-readable display label for HUD */
  label: string;
  /** Short tactical code shown in compact HUD indicators */
  code: string;
  /** Camera behavior description */
  camera: {
    fovOffset: number; // degrees added to base FOV (negative = zoom in)
    distanceOffset: number; // units added to base camera distance (negative = closer)
    followTarget: boolean; // true = camera tries to track locked target
    pullback: boolean; // true = cinematic camera retreat
  };
  /** Globe behavior rules */
  globe: {
    targetingEnabled: boolean; // true = globe receives tap/drag for target lock
    autoRotate: boolean; // true = globe drifts when no input
    opacity: number; // globe visual weight (0.0–1.0 relative modifier)
  };
  /** Input ownership rules */
  input: {
    globeOwnsTap: boolean; // globe captures tap events
    globeOwnsDrag: boolean; // globe captures drag events
    joystickPrimary: boolean; // joystick is the dominant control
  };
  /** HUD state */
  hud: {
    showTargetingReticle: boolean;
    showCruiseIndicator: boolean;
    alertLevel: "normal" | "elevated" | "critical";
  };
}

export const MODE_DEFINITIONS: Record<
  NavigationMode,
  NavigationModeDefinition
> = {
  orbitObservation: {
    mode: "orbitObservation",
    label: "ORBIT MODE",
    code: "ORB",
    camera: {
      fovOffset: 0,
      distanceOffset: 0,
      followTarget: false,
      pullback: false,
    },
    globe: {
      targetingEnabled: false,
      autoRotate: true,
      opacity: 1.0,
    },
    input: {
      globeOwnsTap: false,
      globeOwnsDrag: true,
      joystickPrimary: false,
    },
    hud: {
      showTargetingReticle: false,
      showCruiseIndicator: false,
      alertLevel: "normal",
    },
  },

  tacticalLock: {
    mode: "tacticalLock",
    label: "TACTICAL LOCK",
    code: "TGT",
    camera: {
      fovOffset: -3,
      distanceOffset: -0.3,
      followTarget: true,
      pullback: false,
    },
    globe: {
      targetingEnabled: true,
      autoRotate: false,
      opacity: 1.0,
    },
    input: {
      globeOwnsTap: true,
      globeOwnsDrag: true,
      joystickPrimary: false,
    },
    hud: {
      showTargetingReticle: true,
      showCruiseIndicator: false,
      alertLevel: "elevated",
    },
  },

  approach: {
    mode: "approach",
    label: "APPROACH",
    code: "APR",
    camera: {
      fovOffset: -6,
      distanceOffset: -0.6,
      followTarget: true,
      pullback: false,
    },
    globe: {
      targetingEnabled: true,
      autoRotate: false,
      opacity: 1.0,
    },
    input: {
      globeOwnsTap: true,
      globeOwnsDrag: true,
      joystickPrimary: false,
    },
    hud: {
      showTargetingReticle: true,
      showCruiseIndicator: false,
      alertLevel: "critical",
    },
  },

  breakaway: {
    mode: "breakaway",
    label: "BREAKAWAY",
    code: "BRK",
    camera: {
      fovOffset: 8,
      distanceOffset: 1.2,
      followTarget: false,
      pullback: true,
    },
    globe: {
      targetingEnabled: false,
      autoRotate: false,
      opacity: 0.75,
    },
    input: {
      globeOwnsTap: false,
      globeOwnsDrag: false,
      joystickPrimary: false,
    },
    hud: {
      showTargetingReticle: false,
      showCruiseIndicator: false,
      alertLevel: "elevated",
    },
  },

  cruise: {
    mode: "cruise",
    label: "CRUISE",
    code: "CRZ",
    camera: {
      fovOffset: 4,
      distanceOffset: 0.5,
      followTarget: false,
      pullback: false,
    },
    globe: {
      targetingEnabled: false,
      autoRotate: true,
      opacity: 0.6,
    },
    input: {
      globeOwnsTap: false,
      globeOwnsDrag: false,
      joystickPrimary: true,
    },
    hud: {
      showTargetingReticle: false,
      showCruiseIndicator: true,
      alertLevel: "normal",
    },
  },
};

// ─── Transition Table ─────────────────────────────────────────────────────────

/** Allowed transitions: from → [...allowed to modes] */
export const NAV_TRANSITION_TABLE: Record<NavigationMode, NavigationMode[]> = {
  orbitObservation: ["tacticalLock"],
  tacticalLock: ["breakaway"],
  breakaway: ["cruise"],
  cruise: ["approach"],
  approach: ["tacticalLock"],
};

// ─── History Entry ────────────────────────────────────────────────────────────

export interface NavModeHistoryEntry {
  from: NavigationMode;
  to: NavigationMode;
  reason: string;
  ts: number;
}

// ─── Controller Class ─────────────────────────────────────────────────────────

type NavModeListener = (mode: NavigationMode, prev: NavigationMode) => void;

/**
 * NavigationModeController — Singleton FSM for outer gameplay mode.
 *
 * - All transitions logged with [NAV-MODE] prefix.
 * - Illegal transitions are blocked and warn-logged.
 * - Maintains rolling history of last 50 transitions.
 * - Listeners notified on every valid transition.
 */
export class NavigationModeController {
  private _current: NavigationMode = "orbitObservation";
  private _previous: NavigationMode = "orbitObservation";
  private _history: NavModeHistoryEntry[] = [];
  private _listeners: NavModeListener[] = [];

  get currentMode(): NavigationMode {
    return this._current;
  }

  get previousMode(): NavigationMode {
    return this._previous;
  }

  get currentDefinition(): NavigationModeDefinition {
    return MODE_DEFINITIONS[this._current];
  }

  /** Attempt a mode transition. Returns true on success, false if blocked. */
  transitionTo(to: NavigationMode, reason = "player action"): boolean {
    const from = this._current;
    const allowed = NAV_TRANSITION_TABLE[from] ?? [];

    if (to === from) {
      // Same-mode transitions silently ignored
      return true;
    }

    if (!allowed.includes(to)) {
      console.warn(
        `[NAV-MODE] ILLEGAL: ${from} → ${to} (reason: ${reason})` +
          ` — blocked. Allowed from ${from}: [${allowed.join(", ")}]`,
      );
      return false;
    }

    const entry: NavModeHistoryEntry = { from, to, reason, ts: Date.now() };
    this._history = [...this._history.slice(-49), entry];
    this._previous = from;
    this._current = to;

    console.log(
      `[NAV-MODE] ${from} → ${to} | label: ${MODE_DEFINITIONS[to].label} | reason: ${reason}`,
    );

    for (const listener of this._listeners) {
      try {
        listener(to, from);
      } catch (err) {
        console.error("[NAV-MODE] listener error:", err);
      }
    }

    return true;
  }

  /** Force-set a mode without transition validation. For init or testing only. */
  forceMode(mode: NavigationMode, reason = "force-set"): void {
    const from = this._current;
    this._previous = from;
    this._current = mode;
    this._history = [
      ...this._history.slice(-49),
      { from, to: mode, reason, ts: Date.now() },
    ];
    console.log(`[NAV-MODE] FORCE: ${from} → ${mode} (${reason})`);
    for (const listener of this._listeners) {
      try {
        listener(mode, from);
      } catch (err) {
        console.error("[NAV-MODE] listener error:", err);
      }
    }
  }

  /** Returns copy of last 50 transition history entries. */
  getHistory(): NavModeHistoryEntry[] {
    return [...this._history];
  }

  /** Subscribe to mode changes. Returns unsubscribe function. */
  onModeChange(listener: NavModeListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }
}

/** Global singleton — the canonical navigation mode for the entire app. */
export const globalNavMode = new NavigationModeController();
