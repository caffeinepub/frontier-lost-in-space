import { create } from "zustand";

type GameMode = "menu" | "intro" | "game";

type GameState = {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
};

export const useGameState = create<GameState>((set) => ({
  mode: "menu",
  setMode: (mode) => set({ mode }),
}));
