/**
 * MobileJoystick — Dynamic spawn virtual joystick.
 * Also signals tutorial store when movement is first detected.
 *
 * TUTORIAL FIX: During the "target" tutorial step the entire joystick zone
 * is set to pointer-events:none so taps on the lower-left globe area reach
 * the Three.js canvas instead of being swallowed by the joystick container.
 */
import { useCallback, useRef, useState } from "react";
import { setJoystickInput } from "../../motion/shipMovementEngine";
import { useTutorialStore } from "../../tutorial/useTutorialStore";

const MAX_RADIUS = 44;
const ZONE_LEFT_PCT = 42;

interface JoystickActive {
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
  pointerId: number;
}

const TICK_STYLE: React.CSSProperties = {
  position: "absolute",
  background: "rgba(0,200,255,0.2)",
};

export default function MobileJoystick() {
  const [active, setActive] = useState<JoystickActive | null>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const movementSignaledRef = useRef(false);

  const tutorialActive = useTutorialStore((s) => s.tutorialActive);
  const tutorialStep = useTutorialStore((s) => s.currentStep);
  // During the target step let touches pass through to the globe
  const passThrough = tutorialActive && tutorialStep === "target";

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive({
      baseX: e.clientX,
      baseY: e.clientY,
      knobX: e.clientX,
      knobY: e.clientY,
      pointerId: e.pointerId,
    });
    setJoystickInput(0, 0);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!active || e.pointerId !== active.pointerId) return;
      const dx = e.clientX - active.baseX;
      const dy = e.clientY - active.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, MAX_RADIUS);
      const normX = dist > 1 ? (dx / dist) * (clamped / MAX_RADIUS) : 0;
      const normY = dist > 1 ? (dy / dist) * (clamped / MAX_RADIUS) : 0;
      const kx = active.baseX + (dx / Math.max(dist, 1)) * clamped;
      const ky = active.baseY + (dy / Math.max(dist, 1)) * clamped;
      setActive((prev) => (prev ? { ...prev, knobX: kx, knobY: ky } : null));
      setJoystickInput(normX, -normY);

      // Signal tutorial on first meaningful move
      const magnitude = Math.sqrt(normX * normX + normY * normY);
      if (magnitude > 0.15 && !movementSignaledRef.current) {
        movementSignaledRef.current = true;
        useTutorialStore.getState().setMovementDetected();
      }
    },
    [active],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!active || e.pointerId !== active.pointerId) return;
      setActive(null);
      setJoystickInput(0, 0);
    },
    [active],
  );

  return (
    <div
      ref={zoneRef}
      data-tutorial-target="joystick-zone"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: `${ZONE_LEFT_PCT}%`,
        height: "58%",
        zIndex: 44,
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        paddingBottom: "clamp(70px,10dvh,100px)",
        paddingLeft: "clamp(18px,4vw,32px)",
        // Pass through to globe during target selection step
        pointerEvents: passThrough ? "none" : "auto",
      }}
    >
      {!active && !passThrough && (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "1.5px solid rgba(0,200,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "rgba(0,180,255,0.09)",
              border: "1px solid rgba(0,180,255,0.14)",
            }}
          />
        </div>
      )}

      {active && (
        <div
          style={{
            position: "fixed",
            left: active.baseX - MAX_RADIUS,
            top: active.baseY - MAX_RADIUS,
            width: MAX_RADIUS * 2,
            height: MAX_RADIUS * 2,
            pointerEvents: "none",
            zIndex: 55,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(0,220,255,0.45)",
              background: "rgba(0,30,60,0.28)",
              backdropFilter: "blur(2px)",
              boxShadow: "0 0 16px rgba(0,180,255,0.18)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 26,
              height: 26,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,220,255,0.7) 0%, rgba(0,100,180,0.45) 100%)",
              border: "1.5px solid rgba(0,220,255,0.8)",
              boxShadow: "0 0 10px rgba(0,200,255,0.5)",
              left: active.knobX - active.baseX + MAX_RADIUS - 13,
              top: active.knobY - active.baseY + MAX_RADIUS - 13,
            }}
          />
          <div
            style={{
              ...TICK_STYLE,
              left: "50%",
              top: 2,
              width: 1,
              height: 6,
              marginLeft: -0.5,
            }}
          />
          <div
            style={{
              ...TICK_STYLE,
              left: "50%",
              bottom: 2,
              width: 1,
              height: 6,
              marginLeft: -0.5,
            }}
          />
          <div
            style={{
              ...TICK_STYLE,
              left: 2,
              top: "50%",
              width: 6,
              height: 1,
              marginTop: -0.5,
            }}
          />
          <div
            style={{
              ...TICK_STYLE,
              right: 2,
              top: "50%",
              width: 6,
              height: 1,
              marginTop: -0.5,
            }}
          />
        </div>
      )}
    </div>
  );
}
