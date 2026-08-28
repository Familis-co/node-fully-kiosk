/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFullyQuery } from './use-fully-query.js';

afterEach(cleanup);

describe('useFullyQuery', () => {
  it('starts loading and settles with the resolved data', async () => {
    const { result } = renderHook(() => useFullyQuery(() => Promise.resolve({ battery: 80 })));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ battery: 80 });
    expect(result.current.error).toBeNull();
    expect(result.current.updatedAt).toBeTypeOf('number');
  });

  it('captures a rejection as an error instead of throwing', async () => {
    const { result } = renderHook(() =>
      useFullyQuery(() => Promise.reject(new Error('device offline'))),
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(result.current.error?.message).toBe('device offline');
    expect(result.current.data).toBeUndefined();
  });

  it('does not run while disabled', () => {
    const query = vi.fn(() => Promise.resolve(1));
    const { result } = renderHook(() => useFullyQuery(query, { enabled: false }));

    expect(query).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('re-runs on demand through refetch', async () => {
    let calls = 0;
    const { result } = renderHook(() =>
      useFullyQuery(() => {
        calls += 1;
        return Promise.resolve(calls);
      }),
    );

    await waitFor(() => expect(result.current.data).toBe(1));
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toBe(2);
  });

  it('exposes initialData before the first run settles', async () => {
    const { result } = renderHook(() =>
      useFullyQuery(() => Promise.resolve('fresh'), { initialData: 'cached' }),
    );

    expect(result.current.data).toBe('cached');
    await waitFor(() => expect(result.current.data).toBe('fresh'));
  });

  it('reports success through the onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFullyQuery(() => Promise.resolve('ok'), { onSuccess }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('ok'));
    await waitFor(() => expect(result.current.isFetching).toBe(false));
  });

  it('polls on the configured interval', async () => {
    vi.useFakeTimers();
    const query = vi.fn(() => Promise.resolve(1));

    try {
      renderHook(() => useFullyQuery(query, { refetchInterval: 1_000 }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_500);
      });
      expect(query.mock.calls.length).toBeGreaterThanOrEqual(3);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useFullyQuery cancellation', () => {
  it('reports a failure through the onError callback', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFullyQuery(() => Promise.reject(new Error('device offline')), { onError }),
    );

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    await waitFor(() => expect(result.current.isFetching).toBe(false));
  });

  it('wraps a non-Error rejection', async () => {
    const { result } = renderHook(() =>
      // The point of this case is a rejection that is not an Error.
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      useFullyQuery(() => Promise.reject('just a string')),
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('just a string');
  });

  it('hands the query an abort signal and aborts it on unmount', async () => {
    let signal: AbortSignal | undefined;
    const { unmount } = renderHook(() =>
      useFullyQuery((incoming) => {
        signal = incoming;
        return new Promise<string>(() => undefined);
      }),
    );

    await waitFor(() => expect(signal).toBeDefined());
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('aborts the in-flight request when a refetch supersedes it', async () => {
    const signals: AbortSignal[] = [];
    const { result } = renderHook(() =>
      useFullyQuery((signal) => {
        signals.push(signal);
        return Promise.resolve(signals.length);
      }),
    );

    await waitFor(() => expect(result.current.data).toBe(1));
    await act(async () => {
      await result.current.refetch();
    });

    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('discards the result of a superseded request', async () => {
    const settlers: ((value: string) => void)[] = [];
    const { result } = renderHook(() =>
      useFullyQuery(() => new Promise<string>((resolve) => settlers.push(resolve))),
    );

    await waitFor(() => expect(settlers).toHaveLength(1));

    const second = act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(settlers).toHaveLength(2));

    await act(async () => {
      settlers[1]?.('fresh');
      await Promise.resolve();
    });
    await second;

    // The superseded request answers last. Without the abort guard its result
    // would land on top of the fresh one.
    await act(async () => {
      settlers[0]?.('stale');
      await Promise.resolve();
    });

    expect(result.current.data).toBe('fresh');
  });
});
