import { create } from "zustand";
import { AEGIS_VOICE_LINES, type VoicePriority } from "./aegisVoiceLines";

export interface QueuedVoiceLine {
  id: string; // unique per-enqueue
  eventKey: string; // key into AEGIS_VOICE_LINES
  text: string;
  priority: VoicePriority;
  interruptible: boolean;
}

interface AudioQueueState {
  queue: QueuedVoiceLine[]; // raw array — never filter inside selectors
  currentlyPlaying: QueuedVoiceLine | null;
  isPlaying: boolean;

  enqueue: (eventKey: string, overrideText?: string) => void;
  interrupt: (eventKey: string, overrideText?: string) => void;
  onVoiceComplete: () => void;
  clearQueue: () => void;
  processNext: () => void;
}

export const useAudioQueue = create<AudioQueueState>((set, get) => ({
  queue: [],
  currentlyPlaying: null,
  isPlaying: false,

  enqueue: (eventKey, overrideText) => {
    const line = AEGIS_VOICE_LINES[eventKey];
    if (!line) return;
    const state = get();
    // Dedupe: don't enqueue if already playing or already in queue
    if (state.currentlyPlaying?.eventKey === eventKey) return;
    let alreadyQueued = false;
    for (let i = 0; i < state.queue.length; i++) {
      if (state.queue[i].eventKey === eventKey) {
        alreadyQueued = true;
        break;
      }
    }
    if (alreadyQueued) return;

    const item: QueuedVoiceLine = {
      id: `${Date.now()}-${Math.random()}`,
      eventKey,
      text: overrideText ?? line.text,
      priority: line.priority,
      interruptible: line.interruptible,
    };

    // Insert sorted by priority (highest first)
    const newQueue = [...state.queue];
    let insertIdx = newQueue.length;
    for (let i = 0; i < newQueue.length; i++) {
      if (item.priority > newQueue[i].priority) {
        insertIdx = i;
        break;
      }
    }
    newQueue.splice(insertIdx, 0, item);
    set({ queue: newQueue });

    // If nothing is playing, start immediately
    if (!state.isPlaying) {
      get().processNext();
    }
  },

  interrupt: (eventKey, overrideText) => {
    const line = AEGIS_VOICE_LINES[eventKey];
    if (!line) return;
    const state = get();
    // Only interrupt if current line is interruptible or nothing is playing
    if (
      state.isPlaying &&
      state.currentlyPlaying &&
      !state.currentlyPlaying.interruptible
    )
      return;

    const item: QueuedVoiceLine = {
      id: `${Date.now()}-${Math.random()}`,
      eventKey,
      text: overrideText ?? line.text,
      priority: line.priority,
      interruptible: line.interruptible,
    };

    set({
      queue: [item, ...state.queue],
      isPlaying: false,
      currentlyPlaying: null,
    });
    get().processNext();
  },

  processNext: () => {
    const state = get();
    if (state.queue.length === 0) {
      set({ isPlaying: false, currentlyPlaying: null });
      return;
    }
    const next = state.queue[0];
    const remaining = state.queue.slice(1);
    set({ queue: remaining, currentlyPlaying: next, isPlaying: true });

    import("./ElevenVoice")
      .then(({ speakHybrid, stopAllVoice }) => {
        stopAllVoice();
        speakHybrid(next.text, next.eventKey).finally(() => {
          get().onVoiceComplete();
        });
      })
      .catch(() => {
        get().onVoiceComplete();
      });
  },

  onVoiceComplete: () => {
    set({ isPlaying: false, currentlyPlaying: null });
    setTimeout(() => {
      get().processNext();
    }, 400);
  },

  clearQueue: () => {
    import("./ElevenVoice")
      .then(({ stopAllVoice }) => stopAllVoice())
      .catch(() => {});
    set({ queue: [], currentlyPlaying: null, isPlaying: false });
  },
}));

/** Convenience helper — enqueue a voice line from anywhere */
export function enqueueVoice(eventKey: string, overrideText?: string): void {
  useAudioQueue.getState().enqueue(eventKey, overrideText);
}

/** Convenience helper — interrupt with a high-priority voice line */
export function interruptVoice(eventKey: string, overrideText?: string): void {
  useAudioQueue.getState().interrupt(eventKey, overrideText);
}
