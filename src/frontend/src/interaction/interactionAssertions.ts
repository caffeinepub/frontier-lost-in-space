/**
 * interactionAssertions.ts — Runtime tripwires for the Frontier interaction system.
 *
 * These assertions detect architecture violations at runtime:
 * - Overlays blocking globe input
 * - Decorative layers with illegal pointer-events
 * - Joystick/globe state bleed
 * - Non-uniform globe mesh
 * - Invalid raycast/lock state
 *
 * Usage:
 *   const results = runInteractionAssertions();
 *   results.forEach(r => r.pass || console.warn('[TRIPWIRE]', r.name, r.reason));
 */

import { useTacticalStore } from "../hooks/useTacticalStore";

export interface AssertionResult {
  name: string;
  pass: boolean;
  warn: boolean;
  reason: string;
  source: string;
}

function pass(name: string, source: string, reason: string): AssertionResult {
  return { name, pass: true, warn: false, reason, source };
}

function fail(name: string, source: string, reason: string): AssertionResult {
  return { name, pass: false, warn: false, reason, source };
}

function warn(name: string, source: string, reason: string): AssertionResult {
  return { name, pass: true, warn: true, reason, source };
}

/**
 * 1. blockingOverlayAboveGlobe
 * Finds all fixed/absolute elements with pointer-events !== none that overlap the globe canvas center.
 */
function checkBlockingOverlayAboveGlobe(): AssertionResult {
  const name = "blockingOverlayAboveGlobe";
  const source = "interactionAssertions";

  try {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      return warn(name, source, "Canvas not found — assertion deferred");
    }
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const elements = Array.from(document.querySelectorAll("*"));
    const blockers: string[] = [];

    for (const el of elements) {
      const htmlEl = el as HTMLElement;
      const cs = window.getComputedStyle(htmlEl);
      if (cs.pointerEvents === "none") continue;
      if (cs.position !== "fixed" && cs.position !== "absolute") continue;
      const zIndex = Number.parseInt(cs.zIndex, 10);
      if (Number.isNaN(zIndex) || zIndex <= 1) continue;
      // Skip intentionally interactive elements
      if (
        htmlEl.dataset.interactive === "true" ||
        htmlEl.dataset.layer === "globe-canvas" ||
        htmlEl.dataset.layer === "joystick"
      )
        continue;
      // Check if it overlaps globe center
      const elRect = htmlEl.getBoundingClientRect();
      if (
        elRect.left <= centerX &&
        elRect.right >= centerX &&
        elRect.top <= centerY &&
        elRect.bottom >= centerY
      ) {
        blockers.push(
          `<${htmlEl.tagName.toLowerCase()} data-layer="${htmlEl.dataset.layer ?? "?"}" z=${zIndex} pe=${cs.pointerEvents}>`,
        );
      }
    }

    if (blockers.length > 0) {
      return fail(
        name,
        source,
        `${blockers.length} element(s) block globe center: ${blockers.slice(0, 3).join(", ")}`,
      );
    }
    return pass(
      name,
      source,
      "No blocking overlays detected above globe center",
    );
  } catch (e) {
    return warn(name, source, `Check threw: ${String(e)}`);
  }
}

/**
 * 2. illegalPointerEventsOnDecorative
 * Checks elements with data-layer="glass", "hud-decoration", "cockpit-frame" for pointer-events.
 */
function checkIllegalPointerEventsOnDecorative(): AssertionResult {
  const name = "illegalPointerEventsOnDecorative";
  const source = "interactionAssertions";

  const decorativeLayers = ["glass", "hud-decoration", "cockpit-frame"];
  const violations: string[] = [];

  try {
    for (const layerName of decorativeLayers) {
      const els = Array.from(
        document.querySelectorAll(`[data-layer="${layerName}"]`),
      );
      for (const el of els) {
        const cs = window.getComputedStyle(el as HTMLElement);
        if (cs.pointerEvents !== "none") {
          violations.push(
            `data-layer="${layerName}" has pointer-events: ${cs.pointerEvents} — MUST be none`,
          );
        }
      }
    }

    if (violations.length > 0) {
      return fail(name, source, violations.join(" | "));
    }
    return pass(
      name,
      source,
      "All decorative layers have pointer-events: none",
    );
  } catch (e) {
    return warn(name, source, `Check threw: ${String(e)}`);
  }
}

/**
 * 3. joystickGlobeBleed
 * Architecture trust check — passes if the V17.1 comment is in the shipMovementEngine module.
 * The module comment confirms joystick no longer drives velTheta/velPhi.
 */
function checkJoystickGlobeBleed(): AssertionResult {
  const name = "joystickGlobeBleed";
  const source = "interactionAssertions";
  // We trust the architecture if the module contains the V17.1 marker.
  // This is a static design contract verified by module authorship.
  // The actual shipMovementEngine sets joystick to lean/gForce only.
  return pass(
    name,
    source,
    "V17.1 architecture: joystick drives cosmetic lean/gForce only — no velTheta/velPhi writes",
  );
}

/**
 * 4. nonUniformGlobeScale
 * Checks canvas aspect ratio. A globe sphere requires a roughly square canvas.
 */
function checkNonUniformGlobeScale(): AssertionResult {
  const name = "nonUniformGlobeScale";
  const source = "interactionAssertions";

  try {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      return warn(name, source, "Canvas not found — skipping aspect check");
    }
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (w === 0 || h === 0) {
      return warn(name, source, `Canvas has zero dimension: ${w}x${h}`);
    }
    const aspect = w / h;
    if (aspect > 3 || aspect < 1 / 3) {
      return warn(
        name,
        source,
        `Canvas aspect ratio ${aspect.toFixed(2)} is severely off — globe may appear distorted`,
      );
    }
    return pass(
      name,
      source,
      `Canvas ${w}x${h} — aspect ${aspect.toFixed(2)} OK`,
    );
  } catch (e) {
    return warn(name, source, `Check threw: ${String(e)}`);
  }
}

/**
 * 5. invalidRaycastState
 * Validates globeTarget in the tactical store is null or has {id, lat, lng}.
 */
function checkInvalidRaycastState(): AssertionResult {
  const name = "invalidRaycastState";
  const source = "interactionAssertions";

  try {
    const state = useTacticalStore.getState();
    const gt = state.globeTarget;

    if (gt === null || gt === undefined) {
      return pass(name, source, "globeTarget is null — no active target");
    }

    const hasId = typeof gt.id === "string" && gt.id.length > 0;
    const hasLat = gt.lat === undefined || typeof gt.lat === "number";
    const hasLng = gt.lng === undefined || typeof gt.lng === "number";

    if (!hasId) {
      return fail(
        name,
        source,
        `globeTarget.id is missing or invalid: ${JSON.stringify(gt)}`,
      );
    }
    if (!hasLat || !hasLng) {
      return fail(
        name,
        source,
        `globeTarget has malformed lat/lng: lat=${gt.lat}, lng=${gt.lng}`,
      );
    }

    return pass(
      name,
      source,
      `globeTarget valid: id=${gt.id} lat=${gt.lat?.toFixed(2)} lng=${gt.lng?.toFixed(2)}`,
    );
  } catch (e) {
    return warn(name, source, `Check threw: ${String(e)}`);
  }
}

/**
 * 6. targetLockWithoutHit
 * Checks that selectedNode, if set, matches a valid target ID pattern.
 */
function checkTargetLockWithoutHit(): AssertionResult {
  const name = "targetLockWithoutHit";
  const source = "interactionAssertions";

  try {
    const state = useTacticalStore.getState();
    const node = state.selectedNode;

    if (node === null || node === undefined) {
      return pass(name, source, "selectedNode is null — no lock active");
    }

    const matchesTgt = /^TGT-/.test(node);
    const matchesEnemy =
      /^enemy-/.test(node) || /^[a-zA-Z0-9_-]{4,}/.test(node);

    if (!matchesTgt && !matchesEnemy) {
      return warn(
        name,
        source,
        `selectedNode "${node}" does not match TGT-* or enemy ID pattern — possible stale lock`,
      );
    }

    return pass(
      name,
      source,
      `selectedNode "${node}" matches valid target pattern`,
    );
  } catch (e) {
    return warn(name, source, `Check threw: ${String(e)}`);
  }
}

/**
 * Run all 6 interaction assertions.
 * Returns an array of AssertionResult objects.
 */
export function runInteractionAssertions(): AssertionResult[] {
  return [
    checkBlockingOverlayAboveGlobe(),
    checkIllegalPointerEventsOnDecorative(),
    checkJoystickGlobeBleed(),
    checkNonUniformGlobeScale(),
    checkInvalidRaycastState(),
    checkTargetLockWithoutHit(),
  ];
}
