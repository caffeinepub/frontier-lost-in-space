/**
 * CEPSystemController.tsx
 * Headless tick component — mounts once in TacticalStage.
 * Drives: passive presence decay + wires combat events into CEP.
 * Renders nothing.
 */
import { useEffect } from "react";
import { useCombatState } from "../combat/useCombatState";
import { useCEPStore } from "./useCEPStore";

export default function CEPSystemController() {
  // ── Passive presence tick (every 8 s)
  useEffect(() => {
    const id = setInterval(() => {
      useCEPStore.getState().tickPresence();
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // ── Wire weapon fire events → CEP interaction score
  const firingEffect = useCombatState((s) => s.firingEffect);
  useEffect(() => {
    if (!firingEffect) return;
    useCEPStore.getState().recordInteraction("fire");
  }, [firingEffect]);

  // ── Wire target-hit flash → CEP target interaction
  const targetHitFlash = useCombatState((s) => s.targetHitFlash);
  useEffect(() => {
    if (!targetHitFlash) return;
    useCEPStore.getState().recordInteraction("target");
  }, [targetHitFlash]);

  return null;
}
