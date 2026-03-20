import { useCallback, useEffect, useRef, useState } from "react";

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

export function useGlobeControls(): GlobeControls {
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

  // Store markControlling in a ref so useEffect deps don't need it
  const markControllingRef = useRef(() => {
    controllingRef.current = true;
    if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => {
      controllingRef.current = false;
    }, 2000);
  });

  // Damping + auto-drift loop
  useEffect(() => {
    let current = { azimuth: 0, elevation: 0.2, radius: 5.0 };
    let running = true;

    function loop() {
      if (!running) return;
      const t = targetRef.current;
      const factor = 0.08;

      // Auto-drift when not user controlling
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

  // Mouse drag
  useEffect(() => {
    const markControlling = markControllingRef.current;
    function onMouseDown(e: MouseEvent) {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      markControlling();
    }
    function onMouseUp() {
      dragRef.current.active = false;
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
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      targetRef.current.radius = Math.max(
        3.5,
        Math.min(8.0, targetRef.current.radius + e.deltaY * 0.005),
      );
      markControlling();
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Touch drag + pinch
  useEffect(() => {
    const markControlling = markControllingRef.current;

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
      } else if (e.touches.length === 2) {
        touchRef.current.dist = getTouchDist(e.touches);
      }
      markControlling();
    }
    function onTouchEnd() {
      touchRef.current.active = false;
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

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

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
