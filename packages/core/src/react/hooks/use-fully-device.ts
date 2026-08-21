import {
  getFullyCamshotDataUrl,
  getFullyScreenshotDataUrl,
  readFullyDeviceInfo,
  type FullyLocalDeviceInfo,
  type FullyLocation,
} from '../../index.js';
import { useCallback, useEffect, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';
import {
  useFullyValue,
  type UseFullyValueOptions,
  type UseFullyValueResult,
} from './use-fully-value.js';

/**
 * Reads a full device snapshot through the JavaScript interface.
 *
 * Every field is a separate blocking call into the Android bridge, so keep the
 * polling interval generous.
 *
 * @param options - Polling interval and enablement.
 * @returns The device snapshot, availability flag and a manual refresh.
 *
 * @example
 * ```tsx
 * const { value: device, available } = useFullyDeviceInfo({ interval: 30_000 });
 * if (!available) return <p>Not running inside Fully Kiosk</p>;
 * return <p>{device.deviceName} on Android {device.androidVersion}</p>;
 * ```
 */
export function useFullyDeviceInfo(
  options?: UseFullyValueOptions,
): UseFullyValueResult<FullyLocalDeviceInfo> {
  return useFullyValue(() => readFullyDeviceInfo(), EMPTY_DEVICE_INFO, options);
}

/**
 * Milliseconds since the last user interaction with the device.
 *
 * @param options - Polling interval and enablement. Defaults to a 1 second interval.
 * @returns The idle time in milliseconds.
 */
export function useFullyIdleTime(options: UseFullyValueOptions = {}): UseFullyValueResult<number> {
  return useFullyValue((fully) => fully.getIdleTime(), 0, { interval: 1_000, ...options });
}

/**
 * Reads the last known device location.
 *
 * @param options - Polling interval and enablement.
 * @returns The location, or `null` when unavailable.
 */
export function useFullyLocation(
  options?: UseFullyValueOptions,
): UseFullyValueResult<FullyLocation | null> {
  return useFullyValue<FullyLocation | null>(
    (fully) => {
      const raw = fully.getLocation();
      if (!raw) return null;
      try {
        return JSON.parse(raw) as FullyLocation;
      } catch {
        return null;
      }
    },
    null,
    options,
  );
}

/**
 * Reads an environment sensor.
 *
 * @param type - Android sensor type constant, e.g. `5` for light.
 * @param options - Polling interval and enablement.
 * @returns The current sensor value.
 *
 * @example
 * ```tsx
 * const light = useFullySensor(5, { interval: 2_000 });
 * ```
 */
export function useFullySensor(
  type: number,
  options?: UseFullyValueOptions,
): UseFullyValueResult<number> {
  return useFullyValue((fully) => fully.getSensorValue(type), 0, {
    ...options,
    deps: [type, ...(options?.deps ?? [])],
  });
}

/**
 * Network state of the device, kept current through Fully's network events.
 */
export interface UseFullyNetworkResult {
  /** Whether any network connection is available. */
  connected: boolean;
  /** Whether the Internet is reachable. Starts as `connected` until an event says otherwise. */
  internet: boolean;
  /** Whether the device is connected to Wi-Fi. */
  wifiConnected: boolean;
  /** SSID of the connected Wi-Fi network. */
  ssid: string;
}

/**
 * Tracks the network state through the JavaScript interface.
 *
 * The initial values are read synchronously and then kept current by the
 * `networkDisconnect`, `networkReconnect`, `internetDisconnect` and
 * `internetReconnect` events, so there is no polling.
 *
 * @returns The current network state.
 */
export function useFullyNetwork(): UseFullyNetworkResult {
  const connected = useFullyValue((fully) => fully.isNetworkConnected(), false);
  const wifi = useFullyValue((fully) => fully.isWifiConnected(), false);
  const ssid = useFullyValue((fully) => fully.getWifiSsid(), '');

  const [isConnected, setIsConnected] = useState(false);
  const [hasInternet, setHasInternet] = useState(false);

  useEffect(() => {
    setIsConnected(connected.value);
    setHasInternet(connected.value);
  }, [connected.value]);

  useFullyEvent('networkReconnect', () => setIsConnected(true));
  useFullyEvent('networkDisconnect', () => {
    setIsConnected(false);
    setHasInternet(false);
  });
  useFullyEvent('internetReconnect', () => setHasInternet(true));
  useFullyEvent('internetDisconnect', () => setHasInternet(false));

  return {
    connected: isConnected,
    internet: hasInternet,
    wifiConnected: wifi.value,
    ssid: ssid.value,
  };
}

/**
 * Result of {@link useFullyScreenshot} and {@link useFullyCamshot}.
 */
export interface UseFullyCaptureResult {
  /** The most recent capture as a `data:` URL, or `null` before the first one. */
  dataUrl: string | null;
  /** Takes a new capture and returns it. */
  capture: () => string | null;
}

/**
 * Captures the screen through the JavaScript interface, without a network
 * round trip to the Remote Admin interface.
 *
 * @param interval - Capture automatically on this interval in milliseconds.
 * @returns The latest capture and a manual trigger.
 */
export function useFullyScreenshot(interval?: number): UseFullyCaptureResult {
  return useLocalCapture(getFullyScreenshotDataUrl, interval);
}

/**
 * Captures a camera still through the JavaScript interface. Requires motion
 * detection to be running.
 *
 * @param interval - Capture automatically on this interval in milliseconds.
 * @returns The latest capture and a manual trigger.
 */
export function useFullyCamshot(interval?: number): UseFullyCaptureResult {
  return useLocalCapture(getFullyCamshotDataUrl, interval);
}

/**
 * Shared implementation behind {@link useFullyScreenshot} and {@link useFullyCamshot}.
 *
 * @param read - The capture function to call.
 * @param interval - Capture interval in milliseconds, or `undefined` for manual only.
 * @returns The latest capture and a manual trigger.
 */
function useLocalCapture(read: () => string | null, interval?: number): UseFullyCaptureResult {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const capture = useCallback((): string | null => {
    const next = read();
    setDataUrl(next);
    return next;
  }, [read]);

  useEffect(() => {
    if (!interval || interval <= 0) return;
    capture();
    const timer = setInterval(capture, interval);
    return () => clearInterval(timer);
  }, [capture, interval]);

  return { dataUrl, capture };
}

/**
 * Neutral snapshot used before the first read and outside Fully Kiosk.
 */
const EMPTY_DEVICE_INFO: FullyLocalDeviceInfo = {
  deviceId: '',
  deviceName: '',
  deviceModel: '',
  serialNumber: '',
  androidId: '',
  androidVersion: '',
  androidSdk: 0,
  fullyVersion: '',
  fullyVersionCode: 0,
  webviewVersion: '',
  locale: '',
  ip4Address: '',
  ip6Address: '',
  hostname: '',
  macAddress: '',
  wifiSsid: '',
  wifiBssid: '',
  wifiSignalLevel: '',
  wifiEnabled: false,
  wifiConnected: false,
  networkConnected: false,
  bluetoothEnabled: false,
  batteryLevel: 0,
  plugged: false,
  screenOn: false,
  screenBrightness: 0,
  screenOrientation: 0,
  displayWidth: 0,
  displayHeight: 0,
  screenRotationLocked: false,
  keyboardVisible: false,
  idleTime: 0,
  inForeground: false,
  kioskLocked: false,
  motionDetectionRunning: false,
  startUrl: '',
  internalStorageTotalSpace: 0,
  internalStorageFreeSpace: 0,
  externalStorageTotalSpace: 0,
  externalStorageFreeSpace: 0,
};
