import { useEffect } from "react";
import {
  attachKeyboardListeners,
  attachMouseDragListeners,
  startShipMovementEngine,
  stopShipMovementEngine,
} from "./shipMovementEngine";

export function useShipMovementSetup() {
  useEffect(() => {
    startShipMovementEngine();
    const cleanupKb = attachKeyboardListeners();
    const cleanupMouse = attachMouseDragListeners();
    return () => {
      stopShipMovementEngine();
      cleanupKb();
      cleanupMouse();
    };
  }, []);
}
