/**
 * InteractionEventBus.ts — Typed, observable event bus for tactical interaction events.
 *
 * All pointer, drag, raycast, lock, and joystick events are channeled here.
 * Consumers can subscribe for real-time monitoring or query recent events for diagnostics.
 *
 * Singleton export: `interactionBus`
 */

export type InteractionEventType =
  | "pointerdown"
  | "pointermove"
  | "pointerup"
  | "dragStart"
  | "dragEnd"
  | "raycastStart"
  | "raycastHit"
  | "lockAttempt"
  | "lockSuccess"
  | "lockFailure"
  | "joystickMove"
  | "illegalInputInterception";

export interface InteractionEvent {
  type: InteractionEventType;
  ts: number;
  data?: Record<string, unknown>;
  source?: string;
}

const RING_BUFFER_SIZE = 50;

/**
 * InteractionEventBus — ring-buffered, subscribable typed event channel.
 */
class InteractionEventBusImpl {
  private _buffer: InteractionEvent[] = [];
  private _subscribers: Array<(e: InteractionEvent) => void> = [];

  /**
   * Emit an interaction event. Assigns current timestamp automatically.
   */
  emit(event: Omit<InteractionEvent, "ts">): void {
    const full: InteractionEvent = { ...event, ts: Date.now() };

    // Ring buffer: discard oldest if at capacity
    if (this._buffer.length >= RING_BUFFER_SIZE) {
      this._buffer = this._buffer.slice(-(RING_BUFFER_SIZE - 1));
    }
    this._buffer.push(full);

    for (const sub of this._subscribers) {
      try {
        sub(full);
      } catch (_) {
        // Subscriber errors must not propagate into game logic
      }
    }
  }

  /**
   * Returns a copy of the last 50 events, oldest first.
   */
  getRecentEvents(): InteractionEvent[] {
    return [...this._buffer];
  }

  /**
   * Subscribe to all emitted events. Returns an unsubscribe function.
   */
  subscribe(handler: (e: InteractionEvent) => void): () => void {
    this._subscribers.push(handler);
    return () => {
      this._subscribers = this._subscribers.filter((h) => h !== handler);
    };
  }

  /**
   * Returns the most recent event of the given type, or null.
   */
  getLastEventOfType(type: InteractionEventType): InteractionEvent | null {
    for (let i = this._buffer.length - 1; i >= 0; i--) {
      if (this._buffer[i].type === type) return this._buffer[i];
    }
    return null;
  }

  /** Clear all buffered events (useful for test teardown). */
  clear(): void {
    this._buffer = [];
  }
}

/** Singleton interaction event bus — import and use anywhere. */
export const interactionBus = new InteractionEventBusImpl();
