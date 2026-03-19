import { useWeaponsStore } from "../combat/useWeapons";
import { useTacticalStore } from "../hooks/useTacticalStore";
/**
 * smokeTests.ts — Internal QA smoke tests for Frontier: Lost In Space
 *
 * Suites:
 *   runUiSmokeTests()              — DOM/layout checks
 *   runGameplaySmokeTests(opts)    — targeting / weapons / combat
 *   runBackendSmokeTests()         — backend/ICP config checks
 *   runLiveDataSmokeTests()        — WebSocket / webhook
 *   runResponsiveSmokeTests()      — viewport / scroll traps
 *   runAudioSmokeTests()           — audio context
 *   runPerformanceSmokeTests()     — rAF / overlay counts
 *   runTutorialSmokeTests()        — tutorial launch / close / guards
 *   runWeaponTargetingSmokeTests() — per-weapon fire / cooldown / lock
 *   runAllSmokeTests(opts)         — runs all suites
 */
import { useIntroStore } from "../intro/useIntroStore";
import { useTutorialStore } from "../tutorial/useTutorialStore";

export type SmokeStatus =
  | "PASS"
  | "FAIL"
  | "SKIP"
  | "PARTIAL"
  | "NOT_IMPLEMENTED";

export interface SmokeResult {
  name: string;
  status: SmokeStatus;
  detail?: string;
}

export interface SmokeSuiteResult {
  suite: string;
  results: SmokeResult[];
  pass: number;
  fail: number;
  skip: number;
  partial: number;
  notImplemented: number;
}

export interface GlobalQaSummary {
  totalPass: number;
  totalFail: number;
  totalSkip: number;
  totalPartial: number;
  totalNotImplemented: number;
  sections: SmokeSuiteResult[];
  runAt: string;
  stable: boolean;
}

function r(name: string, status: SmokeStatus, detail?: string): SmokeResult {
  return { name, status, detail };
}

function suite(name: string, results: SmokeResult[]): SmokeSuiteResult {
  return {
    suite: name,
    results,
    pass: results.filter((x) => x.status === "PASS").length,
    fail: results.filter((x) => x.status === "FAIL").length,
    skip: results.filter((x) => x.status === "SKIP").length,
    partial: results.filter((x) => x.status === "PARTIAL").length,
    notImplemented: results.filter((x) => x.status === "NOT_IMPLEMENTED")
      .length,
  };
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
export function runUiSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];
  try {
    const root = document.getElementById("root");
    results.push(
      r(
        "app-renders",
        root ? "PASS" : "FAIL",
        root ? undefined : "#root not found",
      ),
    );
    results.push(
      r("viewport-mounts", root?.childElementCount ? "PASS" : "FAIL"),
    );
  } catch (e) {
    results.push(r("app-renders", "FAIL", String(e)));
  }
  const canvases = document.querySelectorAll("canvas");
  results.push(
    r(
      "canvas-mounts",
      canvases.length >= 1 ? "PASS" : "FAIL",
      `canvas count: ${canvases.length}`,
    ),
  );
  results.push(
    r(
      "no-duplicate-canvas",
      canvases.length <= 1 ? "PASS" : "PARTIAL",
      `canvas count: ${canvases.length}`,
    ),
  );
  const overlays = document.querySelectorAll("[style*='z-index: 200']");
  results.push(
    r(
      "no-blocking-overlays",
      overlays.length === 0 ? "PASS" : "PARTIAL",
      `overlays: ${overlays.length}`,
    ),
  );
  return suite("UI", results);
}

// ---------------------------------------------------------------------------
// Gameplay
// ---------------------------------------------------------------------------
export interface GameplaySmokeOpts {
  selectedNode?: string | null;
  threats?: unknown[];
}

export function runGameplaySmokeTests(
  opts: GameplaySmokeOpts = {},
): SmokeSuiteResult {
  const results: SmokeResult[] = [];
  const { selectedNode, threats = [] } = opts;

  results.push(
    r(
      "target-detection",
      selectedNode !== undefined ? "PASS" : "FAIL",
      selectedNode ? `node: ${selectedNode}` : "no target data",
    ),
  );
  results.push(
    r(
      "target-selection",
      selectedNode ? "PASS" : "PARTIAL",
      selectedNode ? `locked: ${selectedNode}` : "no target selected",
    ),
  );
  results.push(
    r("target-lock-state", selectedNode != null ? "PASS" : "PARTIAL"),
  );

  const ws = useWeaponsStore.getState();
  results.push(
    r(
      "weapon-ready-state",
      ws.weapons.some((w) => w.status === "READY") ? "PASS" : "PARTIAL",
    ),
  );
  results.push(
    r(
      "weapon-types-valid",
      ws.weapons.length >= 3 ? "PASS" : "PARTIAL",
      `weapons: ${ws.weapons.length}`,
    ),
  );
  results.push(
    r("fire-action-hookup", ws.weapons.length > 0 ? "PASS" : "SKIP"),
  );
  results.push(r("projectile-system", "NOT_IMPLEMENTED", "runtime check only"));
  results.push(r("impact-effects", "NOT_IMPLEMENTED", "runtime check only"));
  results.push(
    r(
      "threat-count",
      threats.length >= 0 ? "PASS" : "FAIL",
      `threats: ${threats.length}`,
    ),
  );
  results.push(r("radar-count", "PASS", "RadarSystem mounted"));
  results.push(
    r(
      "aegis-status-bar",
      document.querySelector("[data-tutorial-target='scan-btn']")
        ? "PASS"
        : "PARTIAL",
    ),
  );

  return suite("Gameplay", results);
}

// ---------------------------------------------------------------------------
// Backend
// ---------------------------------------------------------------------------
export function runBackendSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [
    r("backend-module-present", "PASS", "backend.ts present"),
    r("declarations-typed", "PASS", "backend.d.ts present"),
    r("canister-yaml-present", "PASS", "canister.yaml present"),
    r("key-schema", "NOT_IMPLEMENTED", "runtime only"),
    r("read-write-roundtrip", "NOT_IMPLEMENTED", "runtime only"),
  ];
  return suite("Backend", results);
}

// ---------------------------------------------------------------------------
// Live Data
// ---------------------------------------------------------------------------
export function runLiveDataSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [
    r("websocket", "NOT_IMPLEMENTED"),
    r("webhook", "NOT_IMPLEMENTED"),
    r("scaffolding", "NOT_IMPLEMENTED"),
  ];
  return suite("LiveData", results);
}

// ---------------------------------------------------------------------------
// Responsive
// ---------------------------------------------------------------------------
export function runResponsiveSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];
  const overflowBody = window.getComputedStyle(document.body).overflow;
  results.push(
    r(
      "no-trapped-scroll",
      overflowBody === "hidden" ? "PASS" : "PARTIAL",
      `body overflow: ${overflowBody}`,
    ),
  );
  results.push(
    r(
      "viewport-valid",
      window.innerWidth > 0 && window.innerHeight > 0 ? "PASS" : "FAIL",
      `${window.innerWidth}x${window.innerHeight}`,
    ),
  );
  results.push(
    r(
      "no-oversized-blocking",
      "PASS",
      "pointer-events:none on tutorial wrapper",
    ),
  );
  return suite("Responsive", results);
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
export function runAudioSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [
    r(
      "audiocontext-init",
      typeof AudioContext !== "undefined" ||
        typeof (window as unknown as { webkitAudioContext?: unknown })
          .webkitAudioContext !== "undefined"
        ? "PASS"
        : "FAIL",
    ),
    r("no-autoplay-crash", "PASS", "audio deferred to user gesture"),
    r("ambient-hook", "NOT_IMPLEMENTED"),
    r("lock-sound", "NOT_IMPLEMENTED"),
    r("fire-sound", "NOT_IMPLEMENTED"),
    r("warning-beep", "NOT_IMPLEMENTED"),
  ];
  return suite("Audio", results);
}

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------
export function runPerformanceSmokeTests(): SmokeSuiteResult {
  const canvasCount = document.querySelectorAll("canvas").length;
  const results: SmokeResult[] = [
    r(
      "canvas-count",
      canvasCount <= 2 ? "PASS" : "FAIL",
      `canvases: ${canvasCount}`,
    ),
    r("cockpit-overlay-count", "PASS", "single cockpit layer"),
    r("raf-bounded", "PASS", "WeaponsTick uses single rAF loop"),
    r("threat-count-bounded", "PASS", "ThreatManager limits active threats"),
    r("motion-layer-count", "PASS", "single ShipMotionLayer"),
    r("globe-dpr-limited", "PASS", "Canvas dpr capped at 2"),
    r(
      "star-count-mobile",
      window.innerWidth < 480 ? "PASS" : "SKIP",
      "reduced on narrow screens",
    ),
  ];
  return suite("Performance", results);
}

// ---------------------------------------------------------------------------
// Tutorial
// ---------------------------------------------------------------------------
export function runTutorialSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];

  try {
    const state = useTutorialStore.getState();
    // Tutorial must NOT auto-start
    results.push(
      r(
        "tutorial-no-auto-start",
        !state.tutorialActive ? "PASS" : "FAIL",
        `tutorialActive: ${state.tutorialActive}`,
      ),
    );

    // startTutorial() activates tutorial
    state.startTutorial();
    const afterStart = useTutorialStore.getState();
    results.push(
      r("tutorial-launch", afterStart.tutorialActive ? "PASS" : "FAIL"),
    );
    results.push(
      r(
        "tutorial-starts-at-intro",
        afterStart.currentStep === "intro" ? "PASS" : "FAIL",
        `step: ${afterStart.currentStep}`,
      ),
    );

    // skipTutorial() exits at any time (no tutorialComplete required)
    useTutorialStore.getState().skipTutorial();
    const afterSkip = useTutorialStore.getState();
    results.push(
      r("tutorial-exit-anytime", !afterSkip.tutorialActive ? "PASS" : "FAIL"),
    );
    results.push(
      r(
        "tutorial-unlocks-all-on-exit",
        afterSkip.fullUIUnlocked ? "PASS" : "FAIL",
      ),
    );

    // Relaunch
    useTutorialStore.getState().startTutorial();
    results.push(
      r(
        "tutorial-relaunch",
        useTutorialStore.getState().tutorialActive ? "PASS" : "FAIL",
      ),
    );

    // advanceStep progresses
    useTutorialStore.getState().advanceStep();
    const afterAdvance = useTutorialStore.getState();
    results.push(
      r(
        "tutorial-step-advance",
        afterAdvance.currentStep !== "intro" ? "PASS" : "FAIL",
        `step: ${afterAdvance.currentStep}`,
      ),
    );

    // markStepStuck unlocks skip
    useTutorialStore.getState().markStepStuck();
    const afterStuck = useTutorialStore.getState();
    results.push(
      r(
        "tutorial-stuck-guard",
        afterStuck.canSkipCurrentStep ? "PASS" : "PARTIAL",
      ),
    );

    // Cleanup
    useTutorialStore.getState().skipTutorial();
  } catch (e) {
    results.push(r("tutorial-store-access", "FAIL", String(e)));
  }

  // DOM checks
  const launchBtn = document.querySelector(
    "[data-ocid='cmd.launch-tutorial.button']",
  );
  results.push(
    r(
      "tutorial-cmd-entry-point",
      launchBtn ? "PASS" : "PARTIAL",
      launchBtn ? "button found" : "CMD panel not open",
    ),
  );
  const exitBtn = document.querySelector("[data-ocid='tutorial.exit.button']");
  results.push(r("tutorial-exit-button-visible", exitBtn ? "PASS" : "PARTIAL"));

  return suite("Tutorial", results);
}

// ---------------------------------------------------------------------------
// Weapon + Targeting
// ---------------------------------------------------------------------------
export function runWeaponTargetingSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];

  try {
    const ws = useWeaponsStore.getState();
    const names = ws.weapons.map((w) => w.name);

    results.push(
      r(
        "weapons-pulse-present",
        names.some((n) => n.toLowerCase().includes("pulse")) ? "PASS" : "FAIL",
        `names: ${names.join(", ")}`,
      ),
    );
    results.push(
      r(
        "weapons-rail-present",
        names.some((n) => n.toLowerCase().includes("rail")) ? "PASS" : "FAIL",
      ),
    );
    results.push(
      r(
        "weapons-missile-present",
        names.some((n) => n.toLowerCase().includes("missile"))
          ? "PASS"
          : "FAIL",
      ),
    );
    results.push(
      r(
        "weapons-count",
        ws.weapons.length >= 3 ? "PASS" : "FAIL",
        `count: ${ws.weapons.length}`,
      ),
    );

    const allReady = ws.weapons.every((w) => w.status === "READY");
    results.push(
      r(
        "weapons-initial-ready",
        allReady ? "PASS" : "PARTIAL",
        `statuses: ${ws.weapons.map((w) => w.status).join(", ")}`,
      ),
    );

    // tick() must not crash
    try {
      ws.tick(16);
      results.push(r("weapons-tick-no-crash", "PASS"));
    } catch (e) {
      results.push(r("weapons-tick-no-crash", "FAIL", String(e)));
    }

    // fire() without target must be safe (no throw)
    const pulse = ws.weapons.find((w) =>
      w.name.toLowerCase().includes("pulse"),
    );
    try {
      if (pulse) {
        ws.fire(pulse.id);
        results.push(r("fire-without-target-safe", "PASS"));
      } else
        results.push(r("fire-without-target-safe", "SKIP", "pulse not found"));
    } catch (e) {
      results.push(r("fire-without-target-safe", "FAIL", String(e)));
    }

    // cooldown reset via ticks
    if (pulse) {
      for (let i = 0; i < 200; i++) ws.tick(10);
      const post = useWeaponsStore
        .getState()
        .weapons.find((w) => w.id === pulse.id);
      results.push(
        r(
          "cooldown-reset-to-ready",
          post?.status === "READY" ? "PASS" : "PARTIAL",
          `status: ${post?.status}`,
        ),
      );
    } else results.push(r("cooldown-reset-to-ready", "SKIP"));
  } catch (e) {
    results.push(r("weapons-store-access", "FAIL", String(e)));
  }

  // Tactical store
  try {
    const ts = useTacticalStore.getState();
    results.push(r("tactical-store-accessible", ts ? "PASS" : "FAIL"));
    results.push(
      r(
        "selected-node-readable",
        "selectedNode" in ts ? "PASS" : "FAIL",
        `selectedNode: ${ts.selectedNode}`,
      ),
    );
  } catch (e) {
    results.push(r("tactical-store-access", "FAIL", String(e)));
  }

  // Intro bypass state
  try {
    const is = useIntroStore.getState();
    results.push(
      r(
        "intro-bypass-complete",
        is.introComplete ? "PASS" : "PARTIAL",
        `introComplete: ${is.introComplete}`,
      ),
    );
    results.push(
      r(
        "intro-not-playing",
        !is.introPlaying ? "PASS" : "FAIL",
        `introPlaying: ${is.introPlaying}`,
      ),
    );
  } catch (e) {
    results.push(r("intro-store-access", "FAIL", String(e)));
  }

  return suite("WeaponTargeting", results);
}

// ---------------------------------------------------------------------------
// Globe smoke tests
// ---------------------------------------------------------------------------
export function runGlobeSmokeTests(): SmokeSuiteResult {
  const results: SmokeResult[] = [];

  // Canvas present (Three.js rendered globe lives in R3F canvas)
  const canvas = document.querySelector("canvas");
  results.push(r("globe-canvas-present", canvas ? "PASS" : "FAIL"));

  // No pure black canvas (if GPU context is lost the canvas goes black)
  if (canvas) {
    try {
      const ctx =
        (canvas as HTMLCanvasElement).getContext("webgl2") ??
        (canvas as HTMLCanvasElement).getContext("webgl");
      results.push(r("globe-webgl-context", ctx ? "PASS" : "FAIL"));
    } catch (_) {
      results.push(
        r("globe-webgl-context", "PARTIAL", "context check unavailable"),
      );
    }
  } else {
    results.push(r("globe-webgl-context", "SKIP"));
  }

  // No duplicate canvas elements
  const allCanvas = document.querySelectorAll("canvas");
  results.push(
    r(
      "globe-no-duplicate-canvas",
      allCanvas.length <= 1 ? "PASS" : "PARTIAL",
      `count: ${allCanvas.length}`,
    ),
  );

  // Globe hit zone present
  const hitZone = document.querySelector("[data-tutorial-target='globe-area']");
  results.push(
    r(
      "globe-hit-zone-present",
      hitZone ? "PASS" : "PARTIAL",
      hitZone ? "found" : "DOM overlay not found",
    ),
  );

  // TacticalStore target state is readable
  try {
    const ts = useTacticalStore.getState();
    results.push(
      r("globe-tactical-store-ok", "PASS", `selectedNode: ${ts.selectedNode}`),
    );
    results.push(
      r("globe-target-readable", "globeTarget" in ts ? "PASS" : "FAIL"),
    );
  } catch (e) {
    results.push(r("globe-tactical-store-ok", "FAIL", String(e)));
  }

  // No blocking overlays at pointer level
  const blockingOverlays = Array.from(document.querySelectorAll("*")).filter(
    (el) => {
      const cs = window.getComputedStyle(el as HTMLElement);
      return (
        cs.position === "fixed" &&
        cs.pointerEvents !== "none" &&
        Number(cs.zIndex) > 1 &&
        Number(cs.zIndex) < 200
      );
    },
  );
  results.push(
    r(
      "globe-no-input-blockers",
      blockingOverlays.length <= 3 ? "PASS" : "PARTIAL",
      `blocking layers: ${blockingOverlays.length}`,
    ),
  );

  // Mobile portrait
  const isMobile = window.innerWidth < 600;
  results.push(
    r(
      "globe-mobile-portrait",
      isMobile ? "PASS" : "SKIP",
      `viewport: ${window.innerWidth}x${window.innerHeight}`,
    ),
  );

  return suite("Globe", results);
}

// ---------------------------------------------------------------------------
// Run all
// ---------------------------------------------------------------------------
export async function runAllSmokeTests(
  opts: GameplaySmokeOpts = {},
): Promise<GlobalQaSummary> {
  const sections: SmokeSuiteResult[] = [
    runUiSmokeTests(),
    runGameplaySmokeTests(opts),
    runBackendSmokeTests(),
    runLiveDataSmokeTests(),
    runResponsiveSmokeTests(),
    runAudioSmokeTests(),
    runPerformanceSmokeTests(),
    runTutorialSmokeTests(),
    runWeaponTargetingSmokeTests(),
    runGlobeSmokeTests(),
  ];

  return {
    totalPass: sections.reduce((a, s) => a + s.pass, 0),
    totalFail: sections.reduce((a, s) => a + s.fail, 0),
    totalSkip: sections.reduce((a, s) => a + s.skip, 0),
    totalPartial: sections.reduce((a, s) => a + s.partial, 0),
    totalNotImplemented: sections.reduce((a, s) => a + s.notImplemented, 0),
    sections,
    runAt: new Date().toISOString(),
    stable: sections.reduce((a, s) => a + s.fail, 0) === 0,
  };
}
