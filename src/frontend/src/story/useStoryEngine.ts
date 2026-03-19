/**
 * useStoryEngine — story triggers + useAlertsEngine
 */
import { useEffect, useRef } from "react";
import { useAlertsStore } from "../alerts/useAlertsStore";
import {
  ALERT_RESOLVE_REWARD,
  useCreditsStore,
} from "../credits/useCreditsStore";
import { useTacticalStore } from "../hooks/useTacticalStore";
import { useTacticalLogStore } from "../tacticalLog/useTacticalLogStore";
import { useTutorialStore } from "../tutorial/useTutorialStore";
import { useSpaceLogStore } from "./useSpaceLogStore";
import { useStoryStore } from "./useStoryStore";

export function useStoryEngine() {
  const tickResources = useStoryStore((s) => s.tickResources);
  const triggerEvent = useStoryStore((s) => s.triggerEvent);
  const markFirstScan = useStoryStore((s) => s.markFirstScan);
  const markFirstCombat = useStoryStore((s) => s.markFirstCombat);
  const addSpaceLogEntry = useSpaceLogStore((s) => s.addEntry);

  const tutorialComplete = useTutorialStore((s) => s.tutorialComplete);
  const scanMode = useTacticalStore((s) => s.scanMode);

  const tutorialFiredRef = useRef(false);
  const scanFiredRef = useRef(false);

  // Resource tick every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      tickResources();
    }, 30000);
    return () => clearInterval(interval);
  }, [tickResources]);

  // Tutorial complete → trigger Phase 1 opening event
  useEffect(() => {
    if (tutorialComplete && !tutorialFiredRef.current) {
      tutorialFiredRef.current = true;
      setTimeout(() => {
        triggerEvent("p1_systems_damaged");
        addSpaceLogEntry({
          type: "milestone",
          title: "CALIBRATION COMPLETE",
          body: "A.E.G.I.S. calibration successful. Beginning damage assessment. Phase 1 survival window open.",
          phase: 1,
        });
      }, 2000);
    }
  }, [tutorialComplete, triggerEvent, addSpaceLogEntry]);

  // First scan use → trigger first contact event
  useEffect(() => {
    if (scanMode && !scanFiredRef.current) {
      scanFiredRef.current = true;
      setTimeout(() => markFirstScan(), 1500);
    }
  }, [scanMode, markFirstScan]);

  // First combat: hook into the first time a weapon fires
  const combatFiredRef = useRef(false);
  useEffect(() => {
    const unsub = useTacticalStore.subscribe((state) => {
      if (combatFiredRef.current) return;
      const hasCombat = state.eventLog.some((e) => e.type === "fire");
      if (hasCombat) {
        combatFiredRef.current = true;
        markFirstCombat();
        addSpaceLogEntry({
          type: "milestone",
          title: "FIRST CONTACT — HOSTILE",
          body: "Inbound debris field engaged. A.E.G.I.S. weapons free. Commander made first combat decision.",
          phase: 1,
        });
      }
    });
    return unsub;
  }, [markFirstCombat, addSpaceLogEntry]);
}

/** useAlertsEngine — periodic alert triggers + oxygen watchers + tick */
export function useAlertsEngine() {
  const tickAlerts = useAlertsStore((s) => s.tickAlerts);
  const triggerAlert = useAlertsStore((s) => s.triggerAlert);

  // Tick every 10s to expire old alerts
  useEffect(() => {
    const id = setInterval(() => {
      tickAlerts();
    }, 10000);
    return () => clearInterval(id);
  }, [tickAlerts]);

  // Periodic random alert every 45s (weighted toward life support)
  const lastRandomRef = useRef(Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastRandomRef.current < 45000) return;
      lastRandomRef.current = now;

      const criticals = useAlertsStore.getState().getCriticalAlerts();
      if (criticals.length >= 2) return; // don't pile on too many

      const weighted = [
        "oxygen_leak",
        "oxygen_leak", // 2x weight
        "recycler_malfunction",
        "recycler_malfunction",
        "shield_overload",
        "radar_outage",
        "power_conduit",
        "anomaly_contamination",
      ];
      const type = weighted[Math.floor(Math.random() * weighted.length)];
      triggerAlert(type);
    }, 15000); // check every 15s, gate internally at 45s
    return () => clearInterval(id);
  }, [triggerAlert]);

  // Watch oxygen — trigger life support alerts when low
  useEffect(() => {
    const unsub = useStoryStore.subscribe((state) => {
      const { oxygenLevel } = state;
      const activeTypes = useAlertsStore
        .getState()
        .getActiveAlerts()
        .map((a) => a.type);

      if (oxygenLevel < 35 && !activeTypes.includes("oxygen_leak")) {
        triggerAlert("oxygen_leak");
      } else if (
        oxygenLevel < 50 &&
        !activeTypes.includes("oxygen_leak") &&
        !activeTypes.includes("recycler_malfunction")
      ) {
        triggerAlert("recycler_malfunction");
      }
    });
    return unsub;
  }, [triggerAlert]);

  // Award credits when threats are destroyed
  const { earn } = useCreditsStore.getState();
  useEffect(() => {
    const unsub = useTacticalLogStore.subscribe((state) => {
      const latest = state.entries[0];
      if (!latest) return;
      if (
        latest.type === "combat" &&
        (latest.message.toLowerCase().includes("destroy") ||
          latest.message.toLowerCase().includes("intercept") ||
          latest.message.toLowerCase().includes("eliminated"))
      ) {
        earn(25, "Threat Destroyed");
      }
    });
    return unsub;
  }, [earn]);

  // Log credits earned on alert resolve (supplement useAlertsStore)
  useEffect(() => {
    const unsub = useCreditsStore.subscribe((state) => {
      const latest = state.transactions[0];
      if (!latest) return;
      if (latest.amount > 0 && latest.reason.startsWith("Alert Resolved")) {
        useTacticalLogStore.getState().addEntry({
          type: "system",
          message: `+${latest.amount} CR — ${latest.reason}`,
        });
      }
    });
    return unsub;
  }, []);

  // Log ALERT_RESOLVE_REWARD ref usage (avoids unused import lint)
  void ALERT_RESOLVE_REWARD;
}
