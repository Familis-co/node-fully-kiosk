/**
 * @vitest-environment happy-dom
 */
import { fullyEvents, type FullyJsInterface } from '../../index.js';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFullyEvent, useFullyEventCount, useLatestFullyEvent } from './use-fully-event.js';
import { useFullyBattery } from './use-fully-power.js';
import { useFullyScreen } from './use-fully-screen.js';

/**
 * Installs a `fully` double so the event bus can bind, and lets tests push
 * events through the same path Fully would use.
 *
 * @param overrides - Extra members of the interface the test needs.
 */
function installFully(overrides: Partial<FullyJsInterface> = {}): void {
  (globalThis as { fully?: FullyJsInterface }).fully = {
    bind: () => undefined,
    ...overrides,
  } as unknown as FullyJsInterface;
}

/**
 * Delivers an event through the shared bus, wrapped so React can flush.
 *
 * @param event - The event name.
 * @param args - Placeholder values in declaration order.
 */
function emit(event: string, ...args: string[]): void {
  act(() => fullyEvents.emit(event, ...args));
}

afterEach(() => {
  delete (globalThis as { fully?: FullyJsInterface }).fully;
});

afterEach(cleanup);

describe('useFullyEvent', () => {
  it('calls the listener when the event fires', () => {
    installFully();
    const listener = vi.fn();
    renderHook(() => useFullyEvent('onQrScanSuccess', listener));

    emit('onQrScanSuccess', 'ABC-123', '');

    expect(listener).toHaveBeenCalledWith({ code: 'ABC-123', extras: '' });
  });

  it('keeps an inline listener current without resubscribing', () => {
    installFully();
    const seen: string[] = [];

    const { rerender } = renderHook(
      ({ tag }: { tag: string }) =>
        useFullyEvent('onQrScanSuccess', ({ code }) => seen.push(`${tag}:${code}`)),
      { initialProps: { tag: 'first' } },
    );

    rerender({ tag: 'second' });
    emit('onQrScanSuccess', 'X', '');

    expect(seen).toEqual(['second:X']);
  });

  it('stops listening after unmount', () => {
    installFully();
    const listener = vi.fn();
    const { unmount } = renderHook(() => useFullyEvent('onMotion', listener));

    unmount();
    emit('onMotion');

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not subscribe while disabled', () => {
    installFully();
    const listener = vi.fn();
    renderHook(() => useFullyEvent('onMotion', listener, false));

    emit('onMotion');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('useLatestFullyEvent', () => {
  it('holds the most recent payload', () => {
    installFully();
    const { result } = renderHook(() => useLatestFullyEvent('onQrScanSuccess'));

    expect(result.current).toBeNull();
    emit('onQrScanSuccess', 'first', '');
    emit('onQrScanSuccess', 'second', '');

    expect(result.current?.payload.code).toBe('second');
  });
});

describe('useFullyEventCount', () => {
  it('counts occurrences', () => {
    installFully();
    const { result } = renderHook(() => useFullyEventCount('onMotion'));

    emit('onMotion');
    emit('onMotion');

    expect(result.current).toBe(2);
  });
});

describe('useFullyScreen', () => {
  it('seeds from the device and follows the screen events', () => {
    installFully({ getScreenOn: () => true });
    const { result } = renderHook(() => useFullyScreen());

    expect(result.current.isOn).toBe(true);
    emit('screenOff');
    expect(result.current.isOn).toBe(false);
    emit('screenOn');
    expect(result.current.isOn).toBe(true);
  });

  it('forwards turnOff to the interface', () => {
    const turnScreenOff = vi.fn();
    installFully({ getScreenOn: () => true, turnScreenOff });

    const { result } = renderHook(() => useFullyScreen());
    act(() => result.current.turnOff(true));

    expect(turnScreenOff).toHaveBeenCalledWith(true);
  });
});

describe('useFullyBattery', () => {
  it('tracks the level and the power source', () => {
    installFully({ getBatteryLevel: () => 55, isPlugged: () => false });
    const { result } = renderHook(() => useFullyBattery());

    expect(result.current.level).toBe(55);
    expect(result.current.plugged).toBe(false);

    emit('onBatteryLevelChanged', '56');
    expect(result.current.level).toBe(56);

    emit('pluggedAC');
    expect(result.current.plugged).toBe(true);
    expect(result.current.source).toBe('ac');

    emit('unplugged');
    expect(result.current.source).toBe('none');
  });
});
