import { getFully, isFullyKiosk, safeCall, type FullyJsInterface } from '../../index.js';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for {@link useFullyValue}.
 */
export interface UseFullyValueOptions {
  /** Re-read the value on this interval in milliseconds. Disabled when omitted or `0`. */
  interval?: number;
  /** Read the value only while `true`. Defaults to `true`. */
  enabled?: boolean;
  /** Extra dependencies that should trigger a re-read when they change. */
  deps?: readonly unknown[];
}

/**
 * Result of {@link useFullyValue}.
 *
 * @typeParam T - The type of the value.
 */
export interface UseFullyValueResult<T> {
  /** The most recent value, or the fallback when unavailable. */
  value: T;
  /** Whether the JavaScript interface was reachable at the last read. */
  available: boolean;
  /** Reads the value again and returns it. */
  refresh: () => T;
}

/**
 * Reads a value from the `fully` JavaScript interface and keeps it in state.
 *
 * Calls into the interface are synchronous and block on the Android bridge, so
 * poll sparingly and prefer an event where one exists.
 *
 * @typeParam T - The type of the value.
 * @param read - Callback receiving the interface, typically a single getter.
 * @param fallback - Value used when the interface is missing or the call throws.
 * @param options - Polling interval, enablement and extra dependencies.
 * @returns The value, whether it came from the device, and a manual refresh.
 *
 * @example
 * ```tsx
 * const { value: battery } = useFullyValue((f) => f.getBatteryLevel(), 0, { interval: 30_000 });
 * ```
 */
export function useFullyValue<T>(
  read: (fully: FullyJsInterface) => T,
  fallback: T,
  options: UseFullyValueOptions = {},
): UseFullyValueResult<T> {
  const { interval, enabled = true, deps = [] } = options;

  const readRef = useRef(read);
  readRef.current = read;

  const [value, setValue] = useState<T>(fallback);
  const [available, setAvailable] = useState(false);

  const refresh = useCallback((): T => {
    const next = safeCall(readRef.current, fallback);
    setValue(next);
    setAvailable(isFullyKiosk());
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled) return;

    refresh();
    if (!interval || interval <= 0) return;

    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, refresh, ...deps]);

  return { value, available, refresh };
}

/**
 * Whether the page is running inside Fully Kiosk with the JavaScript interface
 * enabled.
 *
 * The check runs after mount, so a server rendered page reports `false` on the
 * first paint and settles on the real value during hydration.
 *
 * @returns `true` when the `fully` object is reachable.
 */
export function useIsFullyKiosk(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => setAvailable(isFullyKiosk()), []);
  return available;
}

/**
 * Returns the raw `fully` object for calls this package does not wrap.
 *
 * @returns The JavaScript interface, or `undefined` outside Fully Kiosk.
 *
 * @example
 * ```tsx
 * const fully = useFully();
 * <button onClick={() => fully?.openWifiSettings()}>Wi-Fi settings</button>
 * ```
 */
export function useFully(): FullyJsInterface | undefined {
  const [fully, setFully] = useState<FullyJsInterface | undefined>(undefined);
  useEffect(() => setFully(getFully()), []);
  return fully;
}
