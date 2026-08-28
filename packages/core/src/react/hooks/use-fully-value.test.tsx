/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFully, resetFully } from '../test-support.js';
import { useFully, useFullyValue, useIsFullyKiosk } from './use-fully-value.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyValue', () => {
  it('reads the value on mount and reports the interface as available', () => {
    installFully({ getBatteryLevel: () => 91 });

    const { result } = renderHook(() => useFullyValue((fully) => fully.getBatteryLevel(), 0));

    expect(result.current.value).toBe(91);
    expect(result.current.available).toBe(true);
  });

  it('keeps the fallback and reports unavailable outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyValue((fully) => fully.getBatteryLevel(), -1));

    expect(result.current.value).toBe(-1);
    expect(result.current.available).toBe(false);
  });

  it('falls back when the getter throws', () => {
    installFully({
      getDeviceId: () => {
        throw new Error('denied');
      },
    });

    const { result } = renderHook(() => useFullyValue((fully) => fully.getDeviceId(), 'none'));

    expect(result.current.value).toBe('none');
  });

  it('re-reads on demand and returns the fresh value from refresh', () => {
    let level = 50;
    installFully({ getBatteryLevel: () => level });

    const { result } = renderHook(() => useFullyValue((fully) => fully.getBatteryLevel(), 0));
    expect(result.current.value).toBe(50);

    level = 42;
    let returned = 0;
    act(() => {
      returned = result.current.refresh();
    });

    expect(returned).toBe(42);
    expect(result.current.value).toBe(42);
  });

  it('does not read while disabled, and reads once enabled', () => {
    const getBatteryLevel = vi.fn(() => 91);
    installFully({ getBatteryLevel });

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useFullyValue((fully) => fully.getBatteryLevel(), 0, { enabled }),
      { initialProps: { enabled: false } },
    );

    expect(getBatteryLevel).not.toHaveBeenCalled();
    expect(result.current.value).toBe(0);

    rerender({ enabled: true });

    expect(getBatteryLevel).toHaveBeenCalled();
    expect(result.current.value).toBe(91);
  });

  it('polls on the configured interval', async () => {
    vi.useFakeTimers();
    const getBatteryLevel = vi.fn(() => 91);
    installFully({ getBatteryLevel });

    try {
      renderHook(() => useFullyValue((f) => f.getBatteryLevel(), 0, { interval: 1_000 }));
      expect(getBatteryLevel).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_500);
      });

      expect(getBatteryLevel).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops polling after unmount', async () => {
    vi.useFakeTimers();
    const getBatteryLevel = vi.fn(() => 91);
    installFully({ getBatteryLevel });

    try {
      const { unmount } = renderHook(() =>
        useFullyValue((f) => f.getBatteryLevel(), 0, { interval: 1_000 }),
      );
      unmount();
      const callsAtUnmount = getBatteryLevel.mock.calls.length;

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });

      expect(getBatteryLevel).toHaveBeenCalledTimes(callsAtUnmount);
    } finally {
      vi.useRealTimers();
    }
  });

  it('treats a zero interval as no polling', async () => {
    vi.useFakeTimers();
    const getBatteryLevel = vi.fn(() => 91);
    installFully({ getBatteryLevel });

    try {
      renderHook(() => useFullyValue((f) => f.getBatteryLevel(), 0, { interval: 0 }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
      });

      expect(getBatteryLevel).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-reads when a declared dependency changes', () => {
    installFully({ getSensorValue: (type: number) => type * 10 });

    const { result, rerender } = renderHook(
      ({ type }: { type: number }) =>
        useFullyValue((fully) => fully.getSensorValue(type), 0, { deps: [type] }),
      { initialProps: { type: 5 } },
    );

    expect(result.current.value).toBe(50);

    rerender({ type: 8 });

    expect(result.current.value).toBe(80);
  });

  it('reads through the latest callback without resubscribing', () => {
    installFully({ getDeviceName: () => 'Lobby', getDeviceId: () => 'id-1' });

    const { result, rerender } = renderHook(
      ({ byId }: { byId: boolean }) =>
        useFullyValue((fully) => (byId ? fully.getDeviceId() : fully.getDeviceName()), '', {
          deps: [byId],
        }),
      { initialProps: { byId: false } },
    );

    expect(result.current.value).toBe('Lobby');

    rerender({ byId: true });

    expect(result.current.value).toBe('id-1');
  });
});

describe('useIsFullyKiosk', () => {
  it('settles on true inside Fully Kiosk', () => {
    installFully();

    const { result } = renderHook(() => useIsFullyKiosk());

    expect(result.current).toBe(true);
  });

  it('stays false in an ordinary browser', () => {
    const { result } = renderHook(() => useIsFullyKiosk());

    expect(result.current).toBe(false);
  });
});

describe('useFully', () => {
  it('hands out the raw interface after mount', () => {
    installFully({ getDeviceId: () => 'id-1' });

    const { result } = renderHook(() => useFully());

    expect(result.current?.getDeviceId()).toBe('id-1');
  });

  it('is undefined in an ordinary browser', () => {
    const { result } = renderHook(() => useFully());

    expect(result.current).toBeUndefined();
  });
});
