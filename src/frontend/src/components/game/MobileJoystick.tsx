/**
 * MobileJoystick — V17.1 REBUILD
 *
 * CRITICAL CHANGE: Previous version used a large transparent zone (left 42%, 58% height)
 * that intercepted globe pointer events. This caused target lock to fail on the left half
 * of the screen and caused joystick input to bleed into globe rotation.
 *
 * New design:
 * - Small fixed-position widget (~88px diameter)
 * - Does NOT cover the globe area
 * - Uses IPFS controller image as visual base
 * - Fixed-origin interaction (widget center, not pointer start position)
 * - Dead zone of 8px to prevent drift
 * - Portrait: lower-left corner (above weapon console)
 * - Landscape: lower-right corner (in right control column)
 * - setPointerCapture on pointerDown for reliable tracking
 *
 * V19 hardening:
 * - Emits structured events to interactionBus on down/move/up.
 * - Updates useInteractionStore.setJoystickActive on down/up.
 * - FSM transitions: idle → joystickActive on down, joystickActive → idle on up.
 */
import { useCallback, useRef, useState } from "react";
import { useIsLandscape } from "../../hooks/useIsLandscape";
import { interactionBus } from "../../interaction/InteractionEventBus";
import {
  InteractionState,
  globalFSM,
} from "../../interaction/InteractionStateMachine";
import { useInteractionStore } from "../../interaction/useInteractionStore";
import { setJoystickInput } from "../../motion/shipMovementEngine";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

const WIDGET_SIZE = 88; // px — total widget diameter
const MAX_RADIUS = 36; // max knob travel from widget center
const DEAD_ZONE_PX = 8; // below this, treat as zero input

const CONTROLLER_IMAGE_URL =
  "https://cyan-chemical-capybara-537.mypinata.cloud/ipfs/bafkreiegcewugfypi6eale3z6nraaxqm4tlqeuhckmm3skeaxaeujrd32a?pinataGatewayToken=7zglWYSGiMDzNDI6rKBp6n24Hn5dRANGNukXWHOraLmAUnl5cjJrHMrbnpJJJj2G";

interface KnobState {
  knobDx: number; // offset from widget center in px
  knobDy: number;
  pointerId: number;
}

export default function MobileJoystick() {
  const [knob, setKnob] = useState<KnobState | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const movementSignaledRef = useRef(false);
  const isLandscape = useIsLandscape();

  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const tutorialStep = useTutorialStore((s) => s.currentStep);
  const passThrough = tutorialActive && tutorialStep === "target";

  const getWidgetCenter = useCallback(() => {
    if (!widgetRef.current) return { cx: 0, cy: 0 };
    const rect = widgetRef.current.getBoundingClientRect();
    return {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    // Capture immediately — this is a small intentional widget, not a tap zone
    e.currentTarget.setPointerCapture(e.pointerId);
    setKnob({ knobDx: 0, knobDy: 0, pointerId: e.pointerId });
    setJoystickInput(0, 0);

    // V19: Emit event + update store + FSM
    interactionBus.emit({
      type: "pointerdown",
      source: "joystick",
      data: { pointerId: e.pointerId },
    });
    useInteractionStore.getState().setJoystickActive(true);
    useInteractionStore.getState().setPointerOwner("joystick");
    globalFSM.transition(
      InteractionState.joystickActive,
      "joystick pointer down",
    );
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!knob || e.pointerId !== knob.pointerId) return;
      const { cx, cy } = getWidgetCenter();
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Apply dead zone
      if (dist < DEAD_ZONE_PX) {
        setKnob((prev) => (prev ? { ...prev, knobDx: 0, knobDy: 0 } : null));
        setJoystickInput(0, 0);
        return;
      }

      // Clamp to MAX_RADIUS for visual knob position
      const clampedDist = Math.min(dist, MAX_RADIUS);
      const nx = dx / dist;
      const ny = dy / dist;
      dx = nx * clampedDist;
      dy = ny * clampedDist;

      const normX = nx * (clampedDist / MAX_RADIUS);
      const normY = ny * (clampedDist / MAX_RADIUS);

      setKnob((prev) => (prev ? { ...prev, knobDx: dx, knobDy: dy } : null));
      setJoystickInput(normX, -normY);

      // V19: Emit joystickMove
      const magnitude = Math.sqrt(normX * normX + normY * normY);
      interactionBus.emit({
        type: "joystickMove",
        source: "joystick",
        data: { normX, normY, magnitude },
      });

      // Signal tutorial on first meaningful move
      if (magnitude > 0.15 && !movementSignaledRef.current) {
        movementSignaledRef.current = true;
        useTutorialStore.getState().setMovementDetected();
      }
    },
    [knob, getWidgetCenter],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!knob || e.pointerId !== knob.pointerId) return;
      setKnob(null);
      setJoystickInput(0, 0);

      // V19: Emit event + update store + FSM
      interactionBus.emit({
        type: "pointerup",
        source: "joystick",
      });
      useInteractionStore.getState().setJoystickActive(false);
      globalFSM.transition(InteractionState.idle, "joystick pointer up");
    },
    [knob],
  );

  const half = WIDGET_SIZE / 2;

  // Portrait: lower-left above weapon console
  // Landscape: lower-right in control column area
  const positionStyle: React.CSSProperties = isLandscape
    ? {
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 68px)",
        right: 16,
        left: "auto",
      }
    : {
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 68px)",
        left: 16,
        right: "auto",
      };

  return (
    <div
      ref={widgetRef}
      data-layer="joystick"
      data-tutorial-target="joystick-zone"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={
        {
          ...positionStyle,
          width: WIDGET_SIZE,
          height: WIDGET_SIZE,
          zIndex: 46,
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          pointerEvents: passThrough ? "none" : "auto",
          opacity: passThrough ? 0.3 : 1,
          cursor: "none",
          // Visual container
          borderRadius: "50%",
          border: "1.5px solid rgba(0,200,255,0.25)",
          background: "rgba(0,10,20,0.55)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "fixed",
        } as React.CSSProperties
      }
    >
      {/* IPFS controller image — sits behind the active knob */}
      <img
        src={CONTROLLER_IMAGE_URL}
        alt=""
        aria-hidden
        draggable={false}
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          opacity: 0.65,
          objectFit: "cover",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />

      {/* Active knob — rendered on top of image when joystick is active */}
      {knob && (
        <div
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,220,255,0.85) 0%, rgba(0,100,200,0.55) 100%)",
            border: "1.5px solid rgba(0,220,255,0.9)",
            boxShadow: "0 0 12px rgba(0,200,255,0.65)",
            left: half + knob.knobDx - 14,
            top: half + knob.knobDy - 14,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Idle center dot when not active */}
      {!knob && (
        <div
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "rgba(0,180,255,0.18)",
            border: "1px solid rgba(0,200,255,0.3)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* MOVE label below */}
      <div
        style={{
          position: "absolute",
          bottom: -14,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 6,
          fontFamily: "monospace",
          letterSpacing: "0.15em",
          color: "rgba(0,180,255,0.3)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        MOVE
      </div>
    </div>
  );
}
