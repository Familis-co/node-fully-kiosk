/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import {
  useFullyCamshot,
  useFullyDeviceInfo,
  useFullyIdleTime,
  useFullyLocation,
  useFullyNetwork,
  useFullyScreenshot,
  useFullySensor,
} from './use-fully-device.js';

afterEach(() => {
  vi.useRealTimers();
  resetFully();
  cleanup();
});

describe('useFullyDeviceInfo', () => {
  it('reads a snapshot through the interface', () => {
    installFully({
      getDeviceName: () => 'Lobby tablet',
      getAndroidVersion: () => '13',
      getBatteryLevel: () => 91,
    });

    const { result } = renderHook(() => useFullyDeviceInfo());

    expect(result.current.available).toBe(true);
    expect(result.current.value.deviceName).toBe('Lobby tablet');
    expect(result.current.value.androidVersion).toBe('13');
    expect(result.current.value.batteryLevel).toBe(91);
  });

  it('reports a neutral snapshot outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyDeviceInfo());

    expect(result.current.available).toBe(false);
    expect(result.current.value.deviceName).toBe('');
    expect(result.current.value.batteryLevel).toBe(0);
  });
});

describe('useFullyIdleTime', () => {
  it('reads the idle time on mount', () => {
    installFully({ getIdleTime: () => 4_500 });

    const { result } = renderHook(() => useFullyIdleTime());

    expect(result.current.value).toBe(4_500);
  });

  it('polls once a second by default', async () => {
    vi.useFakeTimers();
    const getIdleTime = vi.fn(() => 0);
    installFully({ getIdleTime });

    renderHook(() => useFullyIdleTime());
    expect(getIdleTime).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(getIdleTime).toHaveBeenCalledTimes(4);
  });

  it('honours a caller supplied interval', async () => {
    vi.useFakeTimers();
    const getIdleTime = vi.fn(() => 0);
    installFully({ getIdleTime });

    renderHook(() => useFullyIdleTime({ interval: 5_000 }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(getIdleTime).toHaveBeenCalledTimes(1);
  });
});

describe('useFullyLocation', () => {
  it('parses the reported fix', () => {
    installFully({ getLocation: () => '{"latitude":51.5,"longitude":-0.12}' });

    const { result } = renderHook(() => useFullyLocation());

    expect(result.current.value).toEqual({ latitude: 51.5, longitude: -0.12 });
  });

  it('is null when the fix is malformed', () => {
    installFully({ getLocation: () => 'not json' });

    const { result } = renderHook(() => useFullyLocation());

    expect(result.current.value).toBeNull();
  });

  it('is null when there is no fix', () => {
    installFully({ getLocation: () => '' });

    const { result } = renderHook(() => useFullyLocation());

    expect(result.current.value).toBeNull();
  });
});

describe('useFullySensor', () => {
  it('reads the requested sensor', () => {
    installFully({ getSensorValue: (type: number) => (type === 5 ? 320 : 0) });

    const { result } = renderHook(() => useFullySensor(5));

    expect(result.current.value).toBe(320);
  });

  it('re-reads when the sensor type changes', () => {
    installFully({ getSensorValue: (type: number) => type * 100 });

    const { result, rerender } = renderHook(({ type }: { type: number }) => useFullySensor(type), {
      initialProps: { type: 5 },
    });
    expect(result.current.value).toBe(500);

    rerender({ type: 6 });

    expect(result.current.value).toBe(600);
  });
});

describe('useFullyNetwork', () => {
  it('seeds from the interface and assumes the Internet is up while connected', () => {
    installFully({
      isNetworkConnected: () => true,
      isWifiConnected: () => true,
      getWifiSsid: () => 'Office',
    });

    const { result } = renderHook(() => useFullyNetwork());

    expect(result.current.connected).toBe(true);
    expect(result.current.internet).toBe(true);
    expect(result.current.wifiConnected).toBe(true);
    expect(result.current.ssid).toBe('Office');
  });

  it('drops the Internet flag along with the network on a disconnect', () => {
    installFully({
      isNetworkConnected: () => true,
      isWifiConnected: () => true,
      getWifiSsid: () => 'Office',
    });

    const { result } = renderHook(() => useFullyNetwork());
    emit('networkDisconnect');

    expect(result.current.connected).toBe(false);
    expect(result.current.internet).toBe(false);

    emit('networkReconnect');

    expect(result.current.connected).toBe(true);
  });

  it('tracks a captive portal: connected to the network, no Internet', () => {
    installFully({
      isNetworkConnected: () => true,
      isWifiConnected: () => true,
      getWifiSsid: () => 'Guest',
    });

    const { result } = renderHook(() => useFullyNetwork());
    emit('internetDisconnect');

    expect(result.current.connected).toBe(true);
    expect(result.current.internet).toBe(false);

    emit('internetReconnect');

    expect(result.current.internet).toBe(true);
  });

  it('reports everything down outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyNetwork());

    expect(result.current.connected).toBe(false);
    expect(result.current.internet).toBe(false);
    expect(result.current.ssid).toBe('');
  });
});

describe('useFullyScreenshot', () => {
  it('captures nothing until asked', () => {
    const getScreenshotPngBase64 = vi.fn(() => 'iVBORw0KGgo=');
    installFully({ getScreenshotPngBase64 });

    const { result } = renderHook(() => useFullyScreenshot());

    expect(result.current.dataUrl).toBeNull();
    expect(getScreenshotPngBase64).not.toHaveBeenCalled();
  });

  it('captures on demand and returns the data URL', () => {
    installFully({ getScreenshotPngBase64: () => 'iVBORw0KGgo=' });

    const { result } = renderHook(() => useFullyScreenshot());
    let returned: string | null = null;
    act(() => {
      returned = result.current.capture();
    });

    expect(returned).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(result.current.dataUrl).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('captures on the configured interval and stops on unmount', async () => {
    vi.useFakeTimers();
    const getScreenshotPngBase64 = vi.fn(() => 'iVBORw0KGgo=');
    installFully({ getScreenshotPngBase64 });

    const { unmount } = renderHook(() => useFullyScreenshot(1_000));
    expect(getScreenshotPngBase64).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(getScreenshotPngBase64).toHaveBeenCalledTimes(3);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(getScreenshotPngBase64).toHaveBeenCalledTimes(3);
  });

  it('reports null outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyScreenshot());
    act(() => {
      result.current.capture();
    });

    expect(result.current.dataUrl).toBeNull();
  });
});

describe('useFullyCamshot', () => {
  it('captures a JPEG data URL on demand', () => {
    installFully({ getCamshotJpgBase64: () => '/9j/4AAQ' });

    const { result } = renderHook(() => useFullyCamshot());
    act(() => {
      result.current.capture();
    });

    expect(result.current.dataUrl).toBe('data:image/jpeg;base64,/9j/4AAQ');
  });

  it('reports null when motion detection is not running', () => {
    installFully({ getCamshotJpgBase64: () => '' });

    const { result } = renderHook(() => useFullyCamshot());
    act(() => {
      result.current.capture();
    });

    expect(result.current.dataUrl).toBeNull();
  });
});
