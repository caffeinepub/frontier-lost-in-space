/**
 * usePersistenceStore — thin localStorage wrapper.
 * Hydrates other stores on app start.
 */
export const usePersistenceStore = {
  saveCredits: (n: number) => {
    try {
      localStorage.setItem("frontier_credits", String(n));
    } catch {
      /* ignore */
    }
  },
  loadCredits: (): number | null => {
    try {
      const v = localStorage.getItem("frontier_credits");
      return v !== null ? Number(v) : null;
    } catch {
      return null;
    }
  },
  saveAlertDecision: (alertId: string, optionId: string) => {
    try {
      const raw = localStorage.getItem("frontier_alert_decisions") ?? "{}";
      const obj = JSON.parse(raw);
      obj[alertId] = { optionId, ts: Date.now() };
      localStorage.setItem("frontier_alert_decisions", JSON.stringify(obj));
    } catch {
      /* ignore */
    }
  },
  loadAlertDecisions: (): Record<string, { optionId: string; ts: number }> => {
    try {
      const raw = localStorage.getItem("frontier_alert_decisions");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  saveOwnedParts: (parts: string[]) => {
    try {
      localStorage.setItem("frontier_owned_parts", JSON.stringify(parts));
    } catch {
      /* ignore */
    }
  },
  loadOwnedParts: (): string[] => {
    try {
      const raw = localStorage.getItem("frontier_owned_parts");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveInstalledUpgrades: (upgrades: string[]) => {
    try {
      localStorage.setItem(
        "frontier_installed_upgrades",
        JSON.stringify(upgrades),
      );
    } catch {
      /* ignore */
    }
  },
  loadInstalledUpgrades: (): string[] => {
    try {
      const raw = localStorage.getItem("frontier_installed_upgrades");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
};
