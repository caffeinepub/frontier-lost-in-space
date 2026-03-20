import { create } from "zustand";

export const ALERT_RESOLVE_REWARD = 50;

export interface CreditTransaction {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

function loadInitialBalance(): number {
  try {
    const v = localStorage.getItem("frontier_credits");
    if (v !== null) return Number(v);
  } catch {
    /* ignore */
  }
  return 1200;
}

interface CreditsState {
  balance: number;
  transactions: CreditTransaction[];
  earn: (amount: number, reason: string) => void;
  addCredits: (n: number) => void;
  spendCredits: (n: number) => boolean;
  deduct: (n: number) => boolean;
}

export const useCreditsStore = create<CreditsState>((set, get) => ({
  balance: loadInitialBalance(),
  transactions: [],

  earn: (amount, reason) => {
    set((s) => {
      const balance = s.balance + amount;
      try {
        localStorage.setItem("frontier_credits", String(balance));
      } catch {
        /* ignore */
      }
      return {
        balance,
        transactions: [
          { id: `txn-${Date.now()}`, amount, reason, timestamp: Date.now() },
          ...s.transactions,
        ].slice(0, 100),
      };
    });
  },

  addCredits: (n) => get().earn(n, "Credits added"),

  spendCredits: (n) => {
    if (get().balance < n) return false;
    set((s) => {
      const balance = s.balance - n;
      try {
        localStorage.setItem("frontier_credits", String(balance));
      } catch {
        /* ignore */
      }
      return {
        balance,
        transactions: [
          {
            id: `txn-${Date.now()}`,
            amount: -n,
            reason: "Credits spent",
            timestamp: Date.now(),
          },
          ...s.transactions,
        ].slice(0, 100),
      };
    });
    return true;
  },

  deduct: (n) => get().spendCredits(n),
}));
