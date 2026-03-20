/**
 * useIsLandscape — Reactive orientation detection hook.
 * Shared by MobileJoystick, TacticalStage, and any component that needs
 * orientation-aware layout without subscribing to window resize events.
 */
import { useEffect, useState } from "react";

export function useIsLandscape(): boolean {
  const [landscape, setLandscape] = useState(
    () => window.matchMedia("(orientation: landscape)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const handler = (e: MediaQueryListEvent) => setLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return landscape;
}
