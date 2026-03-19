import { create } from "zustand";
import { persist } from "zustand/middleware";

export const ALERT_RESOLVE_REWARD = 50;

export interface CreditTransaction {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface CreditsState {
  balance: number;
  transactions: CreditTransaction[];
  earn: (amount: number, reason: string) => void;
  addCredits: (n: number) => void;
  spendCredits: (n: number) => boolean;
}

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      earn: (amount, reason) =>
        set((s) => ({
          balance: s.balance + amount,
          transactions: [
            {
              id: `txn-${Date.now()}`,
              amount,
              reason,
              timestamp: Date.now(),
            },
            ...s.transactions,
          ].slice(0, 100),
        })),
      addCredits: (n) => get().earn(n, "Credits added"),
      spendCredits: (n) => {
        if (get().balance < n) return false;
        set((s) => ({
          balance: s.balance - n,
          transactions: [
            {
              id: `txn-${Date.now()}`,
              amount: -n,
              reason: "Credits spent",
              timestamp: Date.now(),
            },
            ...s.transactions,
          ].slice(0, 100),
        }));
        return true;
      },
    }),
    { name: "credits-store" },
  ),
);
