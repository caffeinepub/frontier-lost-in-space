/**
 * InteractionContract.ts — Formal ownership contract for the Frontier tactical viewport.
 *
 * INTERACTION CONTRACT — FRONTIER TACTICAL VIEWPORT
 * ==================================================
 * globe-canvas        owns: tap-target-lock, drag-rotation
 * decorative-glass    owns: nothing (pointerEvents: none)
 * joystick-widget     owns: ship-movement-only
 * hud-overlays        render above globe, MUST NOT intercept unless explicitly marked interactive
 * reticle             renders on HUD layer, moves separately from globe
 * overlay-controls    intercept ONLY if data-interactive="true"
 *
 * VIOLATION RULES:
 * - Any element with data-layer="glass", data-layer="hud-decoration", data-layer="cockpit-frame"
 *   MUST have computed pointer-events: none.
 * - The joystick widget MUST NOT write to velTheta / velPhi.
 * - Overlays above the globe MUST have pointer-events: none unless they carry data-interactive="true".
 */

export const INTERACTION_CONTRACT_SPEC = `
INTERACTION CONTRACT — FRONTIER TACTICAL VIEWPORT
==================================================
globe-canvas        owns: tap-target-lock, drag-rotation
decorative-glass    owns: nothing (pointerEvents: none)
joystick-widget     owns: ship-movement-only
hud-overlays        render above globe, MUST NOT intercept unless explicitly marked interactive
reticle             renders on HUD layer, moves separately from globe
overlay-controls    intercept ONLY if data-interactive="true"

RULES:
- globe canvas owns targeting tap and drag rotation
- decorative glass owns no input
- joystick owns ship movement only
- overlays may render above the globe but may not intercept unless explicitly interactive
`.trim();

export type LayerName =
  | "globe-canvas"
  | "decorative-glass"
  | "joystick-widget"
  | "hud-overlay"
  | "reticle"
  | "overlay-control"
  | "cockpit-frame"
  | "unknown";

export interface OwnershipRule {
  layer: LayerName;
  owns: string[];
  mayInterceptInput: boolean;
  requiresDataInteractive?: boolean;
  mustHavePointerEventsNone: boolean;
}

export const INTERACTION_CONTRACT: Record<LayerName, OwnershipRule> = {
  "globe-canvas": {
    layer: "globe-canvas",
    owns: ["tap-target-lock", "drag-rotation"],
    mayInterceptInput: true,
    mustHavePointerEventsNone: false,
  },
  "decorative-glass": {
    layer: "decorative-glass",
    owns: [],
    mayInterceptInput: false,
    mustHavePointerEventsNone: true,
  },
  "joystick-widget": {
    layer: "joystick-widget",
    owns: ["ship-movement-only"],
    mayInterceptInput: true,
    mustHavePointerEventsNone: false,
  },
  "hud-overlay": {
    layer: "hud-overlay",
    owns: [],
    mayInterceptInput: false,
    requiresDataInteractive: true,
    mustHavePointerEventsNone: true,
  },
  reticle: {
    layer: "reticle",
    owns: [],
    mayInterceptInput: false,
    mustHavePointerEventsNone: true,
  },
  "overlay-control": {
    layer: "overlay-control",
    owns: ["explicit-interactive-only"],
    mayInterceptInput: true,
    requiresDataInteractive: true,
    mustHavePointerEventsNone: false,
  },
  "cockpit-frame": {
    layer: "cockpit-frame",
    owns: [],
    mayInterceptInput: false,
    mustHavePointerEventsNone: true,
  },
  unknown: {
    layer: "unknown",
    owns: [],
    mayInterceptInput: false,
    mustHavePointerEventsNone: false,
  },
};

/**
 * Validate that a given element data-layer value is in compliance with the contract.
 * Returns { valid, reason } for debug/assertion use.
 */
export function validateOwnership(elementDataLayer: string): {
  valid: boolean;
  reason: string;
} {
  const rule = INTERACTION_CONTRACT[elementDataLayer as LayerName];
  if (!rule) {
    return {
      valid: true,
      reason: `Layer "${elementDataLayer}" is not in the contract — no restrictions applied.`,
    };
  }
  if (rule.mustHavePointerEventsNone) {
    return {
      valid: false,
      reason: `Layer "${elementDataLayer}" must have pointer-events: none per the interaction contract.`,
    };
  }
  return {
    valid: true,
    reason: `Layer "${elementDataLayer}" is compliant — may intercept: ${rule.mayInterceptInput}.`,
  };
}
