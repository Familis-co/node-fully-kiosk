/**
 * @vitest-environment happy-dom
 */
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyBattery } from './use-fully-power.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyBattery', () => {
  it('seeds the level and the plug state from the interface', () => {
    installFully({ getBatteryLevel: () => 91, isPlugged: () => true });

    const { result } = renderHook(() => useFullyBattery());

    expect(result.current.level).toBe(91);
    expect(result.current.plugged).toBe(true);
  });

  it('reports the source as none until a plug event names one', () => {
    installFully({ getBatteryLevel: () => 91, isPlugged: () => true });

    const { result } = renderHook(() => useFullyBattery());

    expect(result.current.source).toBe('none');
  });

  it('names USB as the source', () => {
    installFully({ getBatteryLevel: () => 50, isPlugged: () => false });

    const { result } = renderHook(() => useFullyBattery());
    emit('pluggedUSB');

    expect(result.current.plugged).toBe(true);
    expect(result.current.source).toBe('usb');
  });

  it('names a wireless charger as the source', () => {
    installFully({ getBatteryLevel: () => 50, isPlugged: () => false });

    const { result } = renderHook(() => useFullyBattery());
    emit('pluggedWireless');

    expect(result.current.plugged).toBe(true);
    expect(result.current.source).toBe('wireless');
  });

  it('switches the source when the charger changes', () => {
    installFully({ getBatteryLevel: () => 50, isPlugged: () => false });

    const { result } = renderHook(() => useFullyBattery());
    emit('pluggedUSB');
    expect(result.current.source).toBe('usb');

    emit('pluggedAC');

    expect(result.current.source).toBe('ac');
  });

  it('reports a flat battery outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyBattery());

    expect(result.current.level).toBe(0);
    expect(result.current.plugged).toBe(false);
    expect(result.current.source).toBe('none');
  });
});
