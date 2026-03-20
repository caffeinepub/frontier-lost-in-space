/**
 * useGlobeControls.ts — Globe orbit + zoom controls.
 *
 * NOTE: This module is currently not consumed by any rendered component.
 * CameraController + RightDragZone + useShipStore are the active orbit system.
 * This hook is preserved for future use and has been cleaned up:
 *
 * V20 fix: Removed ALL document.querySelector('canvas') fallbacks.
 * The hook now requires an explicit HTMLElement to be passed as canvasElement.
 * If null/undefined is provided, the hook attaches no listeners and returns
 * the default state. This prevents unreliable global DOM queries that could
 * silently attach to the wrong canvas in multi-canvas environments.
 *
 * To use this hook from inside the R3F Canvas context:
 *   1. Create an inner component that calls useThree() to get gl.domElement.
 *   2. Pass gl.domElement to a parent via a ref or store.
 *   3. Call useGlobeControls(gl.domElement) outside the Canvas.
 *
 * V19 hardening (preserved):
 * - Emits dragStart / dragEnd events to interactionBus.
 * - Classifies tap vs drag using pointerDownTime + movement threshold.
 * - Updates useInteractionStore.setTapVsDragClassification.
 * - Advances FSM: idle → pointerDown → (tapCandidate | draggingGlobe) → idle.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { interactionBus } from "../interaction/InteractionEventBus";
import {
  InteractionState,
  globalFSM,
} from "../interaction/InteractionStateMachine";
import { useInteractionStore } from "../interaction/useInteractionStore";

export type ControlMode = "orbit" | "turret";

interface GlobeControlsState {
  azimuth: number;
  elevation: number;
  radius: number;
  controlMode: ControlMode;
  isUserControlling: boolean;
}

export interface GlobeControls extends GlobeControlsState {
  setTurretTarget: (azimuth: number, elevation: number) => void;
  exitTurretMode: () => void;
}

/**
 * useGlobeControls — attach orbit controls to an explicit canvas element.
 *
 * @param canvasElement  The HTMLCanvasElement from gl.domElement (R3F).
 *                       Pass null/undefined to disable all listeners.
 *                       NEVER pass a document.querySelector result — get the
 *                       element directly from the R3F context.
 */
export function useGlobeControls(
  canvasElement: HTMLElement | null | undefined,
): GlobeControls {
  const [state, setState] = useState<GlobeControlsState>({
    azimuth: 0,
    elevation: 0.2,
    radius: 5.0,
    controlMode: "orbit",
    isUserControlling: false,
  });

  const targetRef = useRef({ azimuth: 0, elevation: 0.2, radius: 5.0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const touchRef = useRef({ active: false, lastX: 0, lastY: 0, dist: 0 });
  const modeRef = useRef<ControlMode>("orbit");
  const rafRef = useRef<number>(0);
  const controllingRef = useRef(false);
  const controlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pointerDownTimeRef = useRef(0);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const markControllingRef = useRef(() => {
    controllingRef.current = true;
    if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => {
      controllingRef.current = false;
    }, 2000);
  });

  // Damping + auto-drift animation loop
  useEffect(() => {
    let current = { azimuth: 0, elevation: 0.2, radius: 5.0 };
    let running = true;
    function loop() {
      if (!running) return;
      const t = targetRef.current;
      const factor = 0.08;
      if (!controllingRef.current && modeRef.current === "orbit") {
        targetRef.current.azimuth += 0.0003;
      }
      let da = t.azimuth - current.azimuth;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      current.azimuth += da * factor;
      current.elevation += (t.elevation - current.elevation) * factor;
      current.radius += (t.radius - current.radius) * factor;
      setState({
        azimuth: current.azimuth,
        elevation: current.elevation,
        radius: current.radius,
        controlMode: modeRef.current,
        isUserControlling: controllingRef.current,
      });
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Mouse drag — only attaches when canvasElement is provided
  useEffect(() => {
    // HARD REQUIREMENT: canvasElement must be explicitly provided.
    // Do NOT fall back to document.querySelector — it queries the global DOM
    // and may find a completely different canvas in complex layouts.
    if (!canvasElement) {
      console.warn(
        "[useGlobeControls] No canvas element provided — mouse listeners not attached.",
        "Pass gl.domElement from useThree() to this hook.",
      );
      return;
    }

    const markControlling = markControllingRef.current;
    const target: EventTarget = canvasElement;

    console.log(
      "[useGlobeControls] Mouse listeners attached to provided canvas element:",
      canvasElement.tagName,
      canvasElement.offsetWidth,
      "x",
      canvasElement.offsetHeight,
    );

    function onMouseDown(e: MouseEvent) {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      pointerDownTimeRef.current = Date.now();
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
      markControlling();
      interactionBus.emit({
        type: "pointerdown",
        source: "globe-canvas",
        data: { clientX: e.clientX, clientY: e.clientY },
      });
      useInteractionStore.getState().setPointerOwner("globe-canvas");
      globalFSM.transition(InteractionState.pointerDown, "globe mousedown");
    }

    function onMouseUp(e: MouseEvent) {
      const wasActive = dragRef.current.active;
      dragRef.current.active = false;
      if (!wasActive) return;
      const duration = Date.now() - pointerDownTimeRef.current;
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      const movement = Math.sqrt(dx * dx + dy * dy);
      const currentTuning = useInteractionStore.getState().tuning;
      if (
        duration < currentTuning.tapDurationMs &&
        movement < currentTuning.dragThresholdPx
      ) {
        useInteractionStore.getState().setTapVsDragClassification("tap");
        interactionBus.emit({
          type: "pointermove",
          source: "globe-canvas",
          data: { classification: "tap", duration, movement },
        });
        globalFSM.transition(
          InteractionState.tapCandidate,
          "globe: tap classified",
        );
      } else if (isDraggingRef.current) {
        useInteractionStore.getState().setTapVsDragClassification("drag");
        interactionBus.emit({
          type: "dragEnd",
          source: "globe-canvas",
          data: { duration, movement },
        });
        globalFSM.transition(InteractionState.idle, "globe drag ended");
      }
      interactionBus.emit({ type: "pointerup", source: "globe-canvas" });
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current.active) return;
      if (modeRef.current === "turret") return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      targetRef.current.azimuth += dx * 0.005;
      targetRef.current.elevation = Math.max(
        -1.2,
        Math.min(1.2, targetRef.current.elevation + dy * 0.004),
      );
      markControlling();
      const totalDx = e.clientX - pointerDownPosRef.current.x;
      const totalDy = e.clientY - pointerDownPosRef.current.y;
      const totalMove = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
      const currentTuning = useInteractionStore.getState().tuning;
      if (!isDraggingRef.current && totalMove > currentTuning.dragThresholdPx) {
        isDraggingRef.current = true;
        interactionBus.emit({ type: "dragStart", source: "globe-canvas" });
        globalFSM.transition(
          InteractionState.draggingGlobe,
          "globe: drag threshold exceeded",
        );
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      targetRef.current.radius = Math.max(
        3.5,
        Math.min(8.0, targetRef.current.radius + e.deltaY * 0.005),
      );
      markControlling();
    }

    target.addEventListener("mousedown", onMouseDown as EventListener);
    document.addEventListener("mouseup", onMouseUp as EventListener);
    document.addEventListener("mousemove", onMouseMove as EventListener);
    target.addEventListener("wheel", onWheel as EventListener, {
      passive: false,
    });

    return () => {
      target.removeEventListener("mousedown", onMouseDown as EventListener);
      document.removeEventListener("mouseup", onMouseUp as EventListener);
      document.removeEventListener("mousemove", onMouseMove as EventListener);
      target.removeEventListener("wheel", onWheel as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasElement]);

  // Touch drag + pinch — only attaches when canvasElement is provided
  useEffect(() => {
    if (!canvasElement) return;

    const markControlling = markControllingRef.current;
    const target: EventTarget = canvasElement;

    function getTouchDist(touches: TouchList): number {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        touchRef.current = {
          active: true,
          lastX: e.touches[0].clientX,
          lastY: e.touches[0].clientY,
          dist: 0,
        };
        pointerDownTimeRef.current = Date.now();
        pointerDownPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        isDraggingRef.current = false;
        interactionBus.emit({
          type: "pointerdown",
          source: "globe-canvas",
          data: { touch: true },
        });
        useInteractionStore.getState().setPointerOwner("globe-canvas");
        globalFSM.transition(InteractionState.pointerDown, "globe touchstart");
      } else if (e.touches.length === 2) {
        touchRef.current.dist = getTouchDist(e.touches);
      }
      markControlling();
    }

    function onTouchEnd(e: TouchEvent) {
      const wasActive = touchRef.current.active;
      touchRef.current.active = false;
      if (!wasActive) return;
      const duration = Date.now() - pointerDownTimeRef.current;
      const endX = e.changedTouches[0]?.clientX ?? pointerDownPosRef.current.x;
      const endY = e.changedTouches[0]?.clientY ?? pointerDownPosRef.current.y;
      const dx = endX - pointerDownPosRef.current.x;
      const dy = endY - pointerDownPosRef.current.y;
      const movement = Math.sqrt(dx * dx + dy * dy);
      const currentTuning = useInteractionStore.getState().tuning;
      if (
        duration < currentTuning.tapDurationMs &&
        movement < currentTuning.dragThresholdPx
      ) {
        useInteractionStore.getState().setTapVsDragClassification("tap");
        interactionBus.emit({
          type: "pointermove",
          source: "globe-canvas",
          data: { classification: "tap", duration, movement },
        });
        globalFSM.transition(
          InteractionState.tapCandidate,
          "globe: touch tap classified",
        );
      } else if (isDraggingRef.current) {
        useInteractionStore.getState().setTapVsDragClassification("drag");
        interactionBus.emit({ type: "dragEnd", source: "globe-canvas" });
        globalFSM.transition(InteractionState.idle, "globe touch drag ended");
      }
      interactionBus.emit({ type: "pointerup", source: "globe-canvas" });
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 1 && touchRef.current.active) {
        if (modeRef.current === "turret") return;
        const dx = e.touches[0].clientX - touchRef.current.lastX;
        const dy = e.touches[0].clientY - touchRef.current.lastY;
        touchRef.current.lastX = e.touches[0].clientX;
        touchRef.current.lastY = e.touches[0].clientY;
        targetRef.current.azimuth += dx * 0.006;
        targetRef.current.elevation = Math.max(
          -1.2,
          Math.min(1.2, targetRef.current.elevation + dy * 0.005),
        );
        markControlling();
        const totalDx = e.touches[0].clientX - pointerDownPosRef.current.x;
        const totalDy = e.touches[0].clientY - pointerDownPosRef.current.y;
        const totalMove = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
        const currentTuning = useInteractionStore.getState().tuning;
        if (
          !isDraggingRef.current &&
          totalMove > currentTuning.dragThresholdPx
        ) {
          isDraggingRef.current = true;
          interactionBus.emit({ type: "dragStart", source: "globe-canvas" });
          globalFSM.transition(
            InteractionState.draggingGlobe,
            "globe: touch drag threshold exceeded",
          );
        }
      } else if (e.touches.length === 2) {
        const dist = getTouchDist(e.touches);
        const prev = touchRef.current.dist;
        if (prev > 0) {
          const delta = prev - dist;
          targetRef.current.radius = Math.max(
            3.5,
            Math.min(8.0, targetRef.current.radius + delta * 0.01),
          );
        }
        touchRef.current.dist = dist;
        markControlling();
      }
    }

    target.addEventListener("touchstart", onTouchStart as EventListener, {
      passive: true,
    });
    document.addEventListener("touchend", onTouchEnd as EventListener);
    target.addEventListener("touchmove", onTouchMove as EventListener, {
      passive: false,
    });

    return () => {
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      document.removeEventListener("touchend", onTouchEnd as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasElement]);

  const setTurretTarget = useCallback((az: number, el: number) => {
    modeRef.current = "turret";
    targetRef.current.azimuth = az;
    targetRef.current.elevation = el;
    setState((prev) => ({ ...prev, controlMode: "turret" }));
  }, []);

  const exitTurretMode = useCallback(() => {
    modeRef.current = "orbit";
    setState((prev) => ({ ...prev, controlMode: "orbit" }));
  }, []);

  return { ...state, setTurretTarget, exitTurretMode };
}
