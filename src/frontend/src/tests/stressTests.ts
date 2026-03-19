import { useThreatStore } from "../combat/useThreatStore";
import { useWeaponsStore } from "../combat/useWeapons";
import { useDashboardStore } from "../hooks/useDashboardStore";
import { useTacticalStore } from "../hooks/useTacticalStore";
import type { QaCheckResult } from "./types";

interface StressResult {
  label: string;
  passed: boolean;
  note: string;
  iterations: number;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function runStressTests(
  onProgress?: (label: string) => void,
): Promise<QaCheckResult[]> {
  const results: QaCheckResult[] = [];

  const run = async (
    id: string,
    label: string,
    fn: () => Promise<StressResult>,
  ) => {
    onProgress?.(label);
    try {
      const r = await fn();
      results.push({
        id,
        label,
        category: "PERFORMANCE",
        status: r.passed ? "PASS" : "FAIL",
        message: `${r.note} (${r.iterations} iters)`,
        timestamp: Date.now(),
      });
    } catch (err) {
      results.push({
        id,
        label,
        category: "PERFORMANCE",
        status: "FAIL",
        message: `STRESS CRASH: ${String(err)}`,
        timestamp: Date.now(),
      });
    }
  };

  // 1. Repeated weapon fire
  await run(
    "stress_weapon_fire",
    "Stress: rapid weapon fire (20x)",
    async () => {
      const store = useWeaponsStore.getState();
      useTacticalStore.setState({
        selectedNode: "STRESS-NODE-1",
        nodeData: { energy: 50, signal: 50, stability: 50 },
      });
      for (let i = 0; i < 20; i++) {
        store.fire("pulse");
        await delay(20);
      }
      const state = useWeaponsStore.getState();
      const pulse = state.weapons.find((w) => w.id === "pulse");
      useTacticalStore.setState({ selectedNode: null, nodeData: null });
      return {
        label: "Rapid fire",
        passed: !!pulse,
        note: "Weapons survived 20 fire calls",
        iterations: 20,
      };
    },
  );

  // 2. Repeated target switching
  await run(
    "stress_target_switch",
    "Stress: rapid target switching (30x)",
    async () => {
      const nodes = Array.from({ length: 30 }, (_, i) => `NODE-${i}`);
      for (const n of nodes) {
        useTacticalStore.getState().selectNode(n);
        await delay(10);
      }
      useTacticalStore.getState().clearNode();
      return {
        label: "Target switch",
        passed: true,
        note: "30 target switches without crash",
        iterations: 30,
      };
    },
  );

  // 3. Repeated dashboard open/close
  await run(
    "stress_dashboard",
    "Stress: dashboard open/close (20x)",
    async () => {
      const store = useDashboardStore.getState();
      for (let i = 0; i < 20; i++) {
        store.openDashboard();
        await delay(20);
        store.closeDashboard();
        await delay(20);
      }
      return {
        label: "Dashboard toggle",
        passed: !useDashboardStore.getState().dashboardOpen,
        note: "20 open/close cycles",
        iterations: 20,
      };
    },
  );

  // 4. Repeated scan mode toggle
  await run("stress_scan_mode", "Stress: scan mode toggle (20x)", async () => {
    const store = useTacticalStore.getState();
    for (let i = 0; i < 20; i++) {
      store.toggleScanMode();
      await delay(15);
    }
    // Reset to false
    const s = useTacticalStore.getState();
    if (s.scanMode) s.toggleScanMode();
    return {
      label: "Scan mode",
      passed: true,
      note: "20 scan toggles",
      iterations: 20,
    };
  });

  // 5. Repeated target lock/unlock
  await run("stress_lock_unlock", "Stress: lock/unlock (25x)", async () => {
    const store = useTacticalStore.getState();
    for (let i = 0; i < 25; i++) {
      store.selectNode(`TARGET-${i % 5}`);
      await delay(10);
      store.clearNode();
      await delay(10);
    }
    return {
      label: "Lock/unlock",
      passed: true,
      note: "25 lock/unlock cycles",
      iterations: 25,
    };
  });

  // 6. Rapid threat state updates
  await run(
    "stress_threat_updates",
    "Stress: rapid threat updates (30x dt ticks)",
    async () => {
      const store = useThreatStore.getState();
      for (let i = 0; i < 30; i++) {
        store.updateThreats(0.016);
        await delay(5);
      }
      return {
        label: "Threat updates",
        passed: true,
        note: "30 threat tick calls",
        iterations: 30,
      };
    },
  );

  // 7. Weapon cooldown ticks
  await run(
    "stress_weapon_tick",
    "Stress: weapon cooldown ticks (50x)",
    async () => {
      const store = useWeaponsStore.getState();
      for (let i = 0; i < 50; i++) {
        store.tick(100);
        await delay(2);
      }
      return {
        label: "Weapon tick",
        passed: true,
        note: "50 cooldown ticks",
        iterations: 50,
      };
    },
  );

  return results;
}
