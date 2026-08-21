import { getFully } from '../../index.js';
import { useEffect, useRef, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';

/**
 * An Android broadcast received by Fully.
 */
export interface FullyBroadcast {
  /** The intent action. */
  action: string;
  /** The intent extras, as reported by Fully. */
  extras: string;
  /** When the broadcast arrived, in milliseconds since the epoch. */
  receivedAt: number;
}

/**
 * Subscribes to an Android broadcast action for as long as the component is
 * mounted, and reports the matching broadcasts.
 *
 * @param action - The intent action to listen for, e.g. `android.intent.action.BATTERY_LOW`.
 * @param onBroadcast - Called for each matching broadcast.
 * @returns The most recent matching broadcast, or `null`.
 *
 * @example
 * ```tsx
 * const last = useFullyBroadcastReceiver('com.example.SCAN_RESULT');
 * ```
 */
export function useFullyBroadcastReceiver(
  action: string,
  onBroadcast?: (broadcast: FullyBroadcast) => void,
): FullyBroadcast | null {
  const [last, setLast] = useState<FullyBroadcast | null>(null);

  const handlerRef = useRef(onBroadcast);
  handlerRef.current = onBroadcast;

  useEffect(() => {
    const fully = getFully();
    if (!fully || !action) return;

    fully.registerBroadcastReceiver(action);
    return () => fully.unregisterBroadcastReceiver(action);
  }, [action]);

  useFullyEvent('broadcastReceived', (payload) => {
    if (payload.action !== action) return;
    const broadcast: FullyBroadcast = { ...payload, receivedAt: Date.now() };
    setLast(broadcast);
    handlerRef.current?.(broadcast);
  });

  return last;
}
