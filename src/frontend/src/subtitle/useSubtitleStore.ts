import { create } from "zustand";
interface SubtitleState {
  text: string | null;
  show: (text: string, durationMs?: number) => void;
  clear: () => void;
  /** @deprecated use show() */
  showSubtitle: (text: string, durationMs?: number) => void;
  /** @deprecated use clear() */
  clearSubtitle: () => void;
}
export const useSubtitleStore = create<SubtitleState>((set) => ({
  text: null,
  show: (text, durationMs = 4000) => {
    set({ text });
    setTimeout(() => set({ text: null }), durationMs);
  },
  clear: () => set({ text: null }),
  showSubtitle: (text, durationMs = 4000) => {
    set({ text });
    setTimeout(() => set({ text: null }), durationMs);
  },
  clearSubtitle: () => set({ text: null }),
}));
