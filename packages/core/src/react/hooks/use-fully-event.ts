import { onFullyEvent, type FullyEventName, type FullyEventPayload } from '../../index.js';
import { useEffect, useRef, useState } from 'react';

/**
 * Subscribes to an event raised by the Fully Kiosk JavaScript interface.
 *
 * The listener is kept in a ref, so an inline arrow function does not cause a
 * resubscribe on every render.
 *
 * @typeParam Event - The event name.
 * @param event - The event to listen for.
 * @param listener - Called with the typed payload each time the event fires.
 * @param enabled - Subscribe only while `true`. Defaults to `true`.
 *
 * @example
 * ```tsx
 * useFullyEvent('onQrScanSuccess', ({ code }) => setLastScan(code));
 * ```
 */
export function useFullyEvent<Event extends FullyEventName>(
  event: Event,
  listener: (payload: FullyEventPayload<Event>) => void,
  enabled = true,
): void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!enabled) return;
    return onFullyEvent(event, (payload) => listenerRef.current(payload));
  }, [event, enabled]);
}

/**
 * Keeps the payload of the most recent occurrence of an event.
 *
 * @typeParam Event - The event name.
 * @param event - The event to listen for.
 * @param enabled - Subscribe only while `true`. Defaults to `true`.
 * @returns The latest payload and when it arrived, or `null` before the first one.
 *
 * @example
 * ```tsx
 * const scan = useLatestFullyEvent('onQrScanSuccess');
 * return <p>{scan?.payload.code ?? 'Waiting for a scan'}</p>;
 * ```
 */
export function useLatestFullyEvent<Event extends FullyEventName>(
  event: Event,
  enabled = true,
): { payload: FullyEventPayload<Event>; receivedAt: number } | null {
  const [latest, setLatest] = useState<{
    payload: FullyEventPayload<Event>;
    receivedAt: number;
  } | null>(null);

  useFullyEvent(event, (payload) => setLatest({ payload, receivedAt: Date.now() }), enabled);

  return latest;
}

/**
 * Counts how often an event fired since the component mounted.
 *
 * Useful for events without a payload, such as `onMotion`.
 *
 * @param event - The event to count.
 * @param enabled - Subscribe only while `true`. Defaults to `true`.
 * @returns The number of occurrences.
 */
export function useFullyEventCount(event: FullyEventName, enabled = true): number {
  const [count, setCount] = useState(0);
  useFullyEvent(event, () => setCount((current) => current + 1), enabled);
  return count;
}
