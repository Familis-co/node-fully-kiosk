/**
 * @vitest-environment happy-dom
 */
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyBroadcastReceiver } from './use-fully-broadcast.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyBroadcastReceiver', () => {
  it('registers the action on mount and unregisters on unmount', () => {
    const registerBroadcastReceiver = vi.fn();
    const unregisterBroadcastReceiver = vi.fn();
    installFully({ registerBroadcastReceiver, unregisterBroadcastReceiver });

    const { unmount } = renderHook(() =>
      useFullyBroadcastReceiver('android.intent.action.BATTERY_LOW'),
    );
    expect(registerBroadcastReceiver).toHaveBeenCalledWith('android.intent.action.BATTERY_LOW');

    unmount();

    expect(unregisterBroadcastReceiver).toHaveBeenCalledWith('android.intent.action.BATTERY_LOW');
  });

  it('re-registers when the action changes', () => {
    const registerBroadcastReceiver = vi.fn();
    const unregisterBroadcastReceiver = vi.fn();
    installFully({ registerBroadcastReceiver, unregisterBroadcastReceiver });

    const { rerender } = renderHook(
      ({ action }: { action: string }) => useFullyBroadcastReceiver(action),
      { initialProps: { action: 'com.example.A' } },
    );

    rerender({ action: 'com.example.B' });

    expect(unregisterBroadcastReceiver).toHaveBeenCalledWith('com.example.A');
    expect(registerBroadcastReceiver).toHaveBeenCalledWith('com.example.B');
  });

  it('does not register an empty action', () => {
    const registerBroadcastReceiver = vi.fn();
    installFully({ registerBroadcastReceiver });

    renderHook(() => useFullyBroadcastReceiver(''));

    expect(registerBroadcastReceiver).not.toHaveBeenCalled();
  });

  it('reports a matching broadcast and calls the callback', () => {
    installFully({ registerBroadcastReceiver: vi.fn(), unregisterBroadcastReceiver: vi.fn() });
    const onBroadcast = vi.fn();

    const { result } = renderHook(() =>
      useFullyBroadcastReceiver('com.example.SCAN_RESULT', onBroadcast),
    );
    expect(result.current).toBeNull();

    emit('broadcastReceived', 'com.example.SCAN_RESULT', '{"code":"ABC"}');

    expect(result.current?.action).toBe('com.example.SCAN_RESULT');
    expect(result.current?.extras).toBe('{"code":"ABC"}');
    expect(result.current?.receivedAt).toBeTypeOf('number');
    expect(onBroadcast).toHaveBeenCalledOnce();
  });

  it('ignores a broadcast for a different action', () => {
    installFully({ registerBroadcastReceiver: vi.fn(), unregisterBroadcastReceiver: vi.fn() });
    const onBroadcast = vi.fn();

    const { result } = renderHook(() =>
      useFullyBroadcastReceiver('com.example.WANTED', onBroadcast),
    );
    emit('broadcastReceived', 'com.example.OTHER', '');

    expect(result.current).toBeNull();
    expect(onBroadcast).not.toHaveBeenCalled();
  });

  it('keeps only the most recent matching broadcast', () => {
    installFully({ registerBroadcastReceiver: vi.fn(), unregisterBroadcastReceiver: vi.fn() });

    const { result } = renderHook(() => useFullyBroadcastReceiver('com.example.A'));
    emit('broadcastReceived', 'com.example.A', 'first');
    emit('broadcastReceived', 'com.example.A', 'second');

    expect(result.current?.extras).toBe('second');
  });

  it('does not throw outside Fully Kiosk', () => {
    expect(() => renderHook(() => useFullyBroadcastReceiver('com.example.A'))).not.toThrow();
  });
});
