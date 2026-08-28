/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyBeacons, useFullyMotion } from './use-fully-motion.js';

afterEach(() => {
  vi.useRealTimers();
  resetFully();
  cleanup();
});

describe('useFullyMotion', () => {
  it('reads whether detection is running on mount', () => {
    installFully({ isMotionDetectionRunning: () => true });

    const { result } = renderHook(() => useFullyMotion());

    expect(result.current.isRunning).toBe(true);
    expect(result.current.count).toBe(0);
    expect(result.current.lastMotionAt).toBeNull();
  });

  it('counts motion events and stamps the last one', () => {
    installFully({ isMotionDetectionRunning: () => true });

    const { result } = renderHook(() => useFullyMotion());
    emit('onMotion');
    emit('onMotion');

    expect(result.current.count).toBe(2);
    expect(result.current.lastMotionAt).toBeTypeOf('number');
  });

  it('tracks the number of detected faces', () => {
    installFully({ isMotionDetectionRunning: () => true });

    const { result } = renderHook(() => useFullyMotion());
    emit('facesDetected', '3');

    expect(result.current.faces).toBe(3);
  });

  it('re-reads the running state after start, and clears the darkness flag', () => {
    let running = false;
    const startMotionDetection = vi.fn(() => {
      running = true;
    });
    installFully({ isMotionDetectionRunning: () => running, startMotionDetection });

    const { result } = renderHook(() => useFullyMotion());
    emit('onDarkness');
    expect(result.current.isDark).toBe(true);

    act(() => result.current.start());

    expect(startMotionDetection).toHaveBeenCalledOnce();
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isDark).toBe(false);
  });

  it('re-reads the running state after stop', () => {
    let running = true;
    const stopMotionDetection = vi.fn(() => {
      running = false;
    });
    installFully({ isMotionDetectionRunning: () => running, stopMotionDetection });

    const { result } = renderHook(() => useFullyMotion());
    act(() => result.current.stop());

    expect(stopMotionDetection).toHaveBeenCalledOnce();
    expect(result.current.isRunning).toBe(false);
  });

  it('forwards a simulated motion event', () => {
    const triggerMotion = vi.fn();
    installFully({ isMotionDetectionRunning: () => true, triggerMotion });

    const { result } = renderHook(() => useFullyMotion());
    act(() => result.current.trigger());

    expect(triggerMotion).toHaveBeenCalledOnce();
  });
});

describe('useFullyBeacons', () => {
  it('starts empty', () => {
    installFully();

    const { result } = renderHook(() => useFullyBeacons());

    expect(result.current).toEqual([]);
  });

  it('collects beacons, newest first', () => {
    installFully();

    const { result } = renderHook(() => useFullyBeacons());
    emit('onIBeacon', 'uuid-a', '1', '1', '2.5');
    emit('onIBeacon', 'uuid-b', '1', '1', '4.0');

    expect(result.current.map((beacon) => beacon.id1)).toEqual(['uuid-b', 'uuid-a']);
    expect(result.current[0]?.distance).toBe(4);
  });

  it('replaces a beacon seen again rather than duplicating it', () => {
    installFully();

    const { result } = renderHook(() => useFullyBeacons());
    emit('onIBeacon', 'uuid-a', '1', '1', '5.0');
    emit('onIBeacon', 'uuid-a', '1', '1', '1.5');

    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.distance).toBe(1.5);
  });

  it('keeps beacons that differ only in their minor', () => {
    installFully();

    const { result } = renderHook(() => useFullyBeacons());
    emit('onIBeacon', 'uuid-a', '1', '1', '2.0');
    emit('onIBeacon', 'uuid-a', '1', '2', '3.0');

    expect(result.current).toHaveLength(2);
  });

  it('drops a beacon that has not been seen within the ttl', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    installFully();

    const { result } = renderHook(() => useFullyBeacons(30_000));
    emit('onIBeacon', 'stale', '1', '1', '9.0');
    expect(result.current).toHaveLength(1);

    vi.setSystemTime(new Date('2026-01-01T00:01:00Z'));
    emit('onIBeacon', 'fresh', '1', '1', '1.0');

    expect(result.current.map((beacon) => beacon.id1)).toEqual(['fresh']);
  });
});
