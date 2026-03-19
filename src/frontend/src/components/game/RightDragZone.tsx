/**
 * RightDragZone — Invisible touch-capture zone for the right half of the screen.
 *
 * KEY FIX: Lazy pointer capture.
 * - On pointerDown we do NOT call setPointerCapture.
 * - We only capture once movement exceeds TAP_THRESHOLD (confirmed drag).
 * - Short taps fall through to the underlying Three.js canvas so globe clicks work.
 *
 * TUTORIAL FIX: During the "target" and "lock" tutorial steps the zone is set
 * to pointer-events:none so globe taps reach the Three.js canvas unobstructed.
 */
import { useCallback, useRef } from "react";
import { applyRightDragDelta } from "../../motion/shipMovementEngine";
import { useShipStore } from "../../motion/useShipStore";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

// Reduced 50% from previous 0.0005
const VELOCITY_SENS = 0.00025;
const MAX_VEL = 0.008;
// Distance threshold: if total drag < this, treat as tap and ignore
const TAP_THRESHOLD = 10;

interface DragState {
  pointerId: number;
  element: Element; // stored for lazy setPointerCapture
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  totalDist: number;
  isDrag: boolean;
}

export default function RightDragZone() {
  const dragRef = useRef<DragState | null>(null);

  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const tutorialStep = useTutorialStore((s) => s.currentStep);
  // During target/lock steps let all events pass through to the globe canvas
  const passThrough =
    tutorialActive && (tutorialStep === "target" || tutorialStep === "lock");

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) return;
    // Do NOT call setPointerCapture here — short taps must reach the canvas
    dragRef.current = {
      pointerId: e.pointerId,
      element: e.currentTarget,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      totalDist: 0,
      isDrag: false,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;

    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.totalDist += Math.sqrt(dx * dx + dy * dy);

    if (!d.isDrag && d.totalDist > TAP_THRESHOLD) {
      d.isDrag = true;
      // Lazy capture — only now that we know it's a real drag
      try {
        d.element.setPointerCapture(d.pointerId);
      } catch {
        // ignore — some browsers disallow capture after pointer has moved
      }
    }

    if (!d.isDrag) return;

    // Update orbital velocity
    const s = useShipStore.getState();
    s.setVelocity(
      Math.max(-MAX_VEL, Math.min(MAX_VEL, s.velTheta - dx * VELOCITY_SENS)),
      Math.max(-MAX_VEL, Math.min(MAX_VEL, s.velPhi + dy * VELOCITY_SENS)),
    );
    // Also nudge heading offset for fine aim
    applyRightDragDelta(dx, dy);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
  }, []);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        // Exclude bottom ~22% to leave weapon HUD safe
        height: "78%",
        width: "58%",
        zIndex: 20,
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        pointerEvents: passThrough ? "none" : "auto",
        background: "transparent",
      }}
    />
  );
}
