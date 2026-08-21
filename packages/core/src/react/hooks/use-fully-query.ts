import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options shared by every data-reading hook in this package.
 *
 * @typeParam T - The type of the resolved data.
 */
export interface UseFullyQueryOptions<T> {
  /** Run the query. Defaults to `true`; set to `false` to hold it back. */
  enabled?: boolean;
  /** Re-run the query on this interval in milliseconds. Disabled when omitted or `0`. */
  refetchInterval?: number;
  /** Extra dependencies that should re-run the query when they change. */
  deps?: readonly unknown[];
  /** Value exposed as `data` before the first successful run. */
  initialData?: T;
  /** Called after every successful run. */
  onSuccess?: (data: T) => void;
  /** Called after every failed run. */
  onError?: (error: Error) => void;
}

/**
 * State returned by every data-reading hook in this package.
 *
 * @typeParam T - The type of the resolved data.
 */
export interface UseFullyQueryResult<T> {
  /** The most recent successful result, or `undefined` before the first one. */
  data: T | undefined;
  /** The error of the most recent failed run, cleared on the next success. */
  error: Error | null;
  /** `true` until the first run settles. */
  isLoading: boolean;
  /** `true` whenever a run is in flight, including background refetches. */
  isFetching: boolean;
  /** Timestamp of the last successful run, in milliseconds since the epoch. */
  updatedAt: number | null;
  /** Runs the query again and resolves with its result. */
  refetch: () => Promise<T | undefined>;
}

/**
 * Runs an async read, tracks its state and optionally polls it.
 *
 * This is the building block behind the REST hooks; use it directly for
 * commands this package does not wrap yet.
 *
 * @typeParam T - The type of the resolved data.
 * @param query - Callback performing the read. It receives an `AbortSignal`
 * that is aborted when the component unmounts or the query re-runs.
 * @param options - Enablement, polling interval, dependencies and callbacks.
 * @returns The query state plus a `refetch` function.
 *
 * @example
 * ```ts
 * const client = useFullyKioskClient();
 * const tabs = useFullyQuery((signal) => client.command('getTabList', {}, { signal }));
 * ```
 */
export function useFullyQuery<T>(
  query: (signal: AbortSignal) => Promise<T>,
  options: UseFullyQueryOptions<T> = {},
): UseFullyQueryResult<T> {
  const { enabled = true, refetchInterval, deps = [], initialData, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const queryRef = useRef(query);
  queryRef.current = query;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const run = useCallback(async (): Promise<T | undefined> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsFetching(true);
    try {
      const result = await queryRef.current(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return undefined;

      setData(result);
      setError(null);
      setUpdatedAt(Date.now());
      onSuccessRef.current?.(result);
      return result;
    } catch (caught) {
      if (!mountedRef.current || controller.signal.aborted) return undefined;

      const normalised = caught instanceof Error ? caught : new Error(String(caught));
      setError(normalised);
      onErrorRef.current?.(normalised);
      return undefined;
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    void run();

    if (!refetchInterval || refetchInterval <= 0) return;
    const timer = setInterval(() => void run(), refetchInterval);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetchInterval, run, ...deps]);

  return { data, error, isLoading, isFetching, updatedAt, refetch: run };
}
