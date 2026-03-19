import { useEffect } from "react";
import { useCombatState } from "../../combat/useCombatState";
import { useThreatStore } from "../../combat/useThreatStore";

export default function InterceptSystem() {
  const firingEffect = useCombatState((s) => s.firingEffect);

  useEffect(() => {
    if (!firingEffect) return;
    if (!firingEffect.targetId.startsWith("THREAT-")) return;

    const { interceptThreat } = useThreatStore.getState();
    // Missile is treated as railgun-level damage for intercept purposes
    const interceptType =
      firingEffect.type === "missile" ? "railgun" : firingEffect.type;
    if (
      interceptType === "pulse" ||
      interceptType === "railgun" ||
      interceptType === "emp"
    ) {
      interceptThreat(firingEffect.targetId, interceptType);
    }
  }, [firingEffect]);

  return null;
}
