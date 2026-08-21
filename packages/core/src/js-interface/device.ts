import { safeCall, safeJsonCall } from './bridge.js';

/**
 * Snapshot of the device state read through the JavaScript interface.
 *
 * Every field falls back to a neutral value when the corresponding getter is
 * missing on the installed Fully version or throws because a permission was
 * denied.
 */
export interface FullyLocalDeviceInfo {
  /** Fully Kiosk device identifier. */
  deviceId: string;
  /** User facing device name. */
  deviceName: string;
  /** Hardware model name. */
  deviceModel: string;
  /** Hardware serial number. */
  serialNumber: string;
  /** Android ID. */
  androidId: string;
  /** Android release version. */
  androidVersion: string;
  /** Android SDK level. */
  androidSdk: number;
  /** Fully Kiosk version name. */
  fullyVersion: string;
  /** Fully Kiosk version code. */
  fullyVersionCode: number;
  /** Android System WebView version. */
  webviewVersion: string;
  /** Current locale, e.g. `en_GB`. */
  locale: string;

  /** Primary IPv4 address. */
  ip4Address: string;
  /** Primary IPv6 address. */
  ip6Address: string;
  /** Network hostname. */
  hostname: string;
  /** Wi-Fi MAC address. */
  macAddress: string;
  /** SSID of the connected Wi-Fi network. */
  wifiSsid: string;
  /** BSSID of the connected access point. */
  wifiBssid: string;
  /** Wi-Fi signal level, 0-4. */
  wifiSignalLevel: string;
  /** Whether Wi-Fi is enabled. */
  wifiEnabled: boolean;
  /** Whether the device is connected to Wi-Fi. */
  wifiConnected: boolean;
  /** Whether any network is reachable. */
  networkConnected: boolean;
  /** Whether Bluetooth is enabled. */
  bluetoothEnabled: boolean;

  /** Battery charge in percent. */
  batteryLevel: number;
  /** Whether the device is connected to power. */
  plugged: boolean;

  /** Whether the screen is on. */
  screenOn: boolean;
  /** Screen brightness, 0-255. */
  screenBrightness: number;
  /** Screen orientation as an Android orientation constant. */
  screenOrientation: number;
  /** Display width in pixels. */
  displayWidth: number;
  /** Display height in pixels. */
  displayHeight: number;
  /** Whether screen rotation is locked. */
  screenRotationLocked: boolean;
  /** Whether the soft keyboard is visible. */
  keyboardVisible: boolean;

  /** Milliseconds since the last user interaction. */
  idleTime: number;
  /** Whether Fully is in the foreground. */
  inForeground: boolean;
  /** Whether kiosk mode is locked. */
  kioskLocked: boolean;
  /** Whether motion detection is running. */
  motionDetectionRunning: boolean;
  /** The configured start URL. */
  startUrl: string;

  /** Total internal storage in bytes. */
  internalStorageTotalSpace: number;
  /** Free internal storage in bytes. */
  internalStorageFreeSpace: number;
  /** Total external storage in bytes. */
  externalStorageTotalSpace: number;
  /** Free external storage in bytes. */
  externalStorageFreeSpace: number;
}

/**
 * Reads a full snapshot of the device state through the JavaScript interface.
 *
 * Every getter is a blocking call into the Android bridge, so prefer reading
 * individual values when only a few are needed.
 *
 * @returns The device state, with neutral fallbacks for unavailable values.
 */
export function readFullyDeviceInfo(): FullyLocalDeviceInfo {
  return {
    deviceId: safeCall((f) => f.getDeviceId(), ''),
    deviceName: safeCall((f) => f.getDeviceName(), ''),
    deviceModel: safeCall((f) => f.getDeviceModel(), ''),
    serialNumber: safeCall((f) => f.getSerialNumber(), ''),
    androidId: safeCall((f) => f.getAndroidId(), ''),
    androidVersion: safeCall((f) => f.getAndroidVersion(), ''),
    androidSdk: safeCall((f) => f.getAndroidSdk(), 0),
    fullyVersion: safeCall((f) => f.getFullyVersion(), ''),
    fullyVersionCode: safeCall((f) => f.getFullyVersionCode(), 0),
    webviewVersion: safeCall((f) => f.getWebviewVersion(), ''),
    locale: safeCall((f) => f.getCurrentLocale(), ''),

    ip4Address: safeCall((f) => f.getIp4Address(), ''),
    ip6Address: safeCall((f) => f.getIp6Address(), ''),
    hostname: safeCall((f) => f.getHostname(), ''),
    macAddress: safeCall((f) => f.getMacAddress(), ''),
    wifiSsid: safeCall((f) => f.getWifiSsid(), ''),
    wifiBssid: safeCall((f) => f.getWifiBssid(), ''),
    wifiSignalLevel: safeCall((f) => f.getWifiSignalLevel(), ''),
    wifiEnabled: safeCall((f) => f.isWifiEnabled(), false),
    wifiConnected: safeCall((f) => f.isWifiConnected(), false),
    networkConnected: safeCall((f) => f.isNetworkConnected(), false),
    bluetoothEnabled: safeCall((f) => f.isBluetoothEnabled(), false),

    batteryLevel: safeCall((f) => f.getBatteryLevel(), 0),
    plugged: safeCall((f) => f.isPlugged(), false),

    screenOn: safeCall((f) => f.getScreenOn(), false),
    screenBrightness: safeCall((f) => f.getScreenBrightness(), 0),
    screenOrientation: safeCall((f) => f.getScreenOrientation(), 0),
    displayWidth: safeCall((f) => f.getDisplayWidth(), 0),
    displayHeight: safeCall((f) => f.getDisplayHeight(), 0),
    screenRotationLocked: safeCall((f) => f.isScreenRotationLocked(), false),
    keyboardVisible: safeCall((f) => f.isKeyboardVisible(), false),

    idleTime: safeCall((f) => f.getIdleTime(), 0),
    inForeground: safeCall((f) => f.isInForeground(), false),
    kioskLocked: safeCall((f) => f.isKioskLocked(), false),
    motionDetectionRunning: safeCall((f) => f.isMotionDetectionRunning(), false),
    startUrl: safeCall((f) => f.getStartUrl(), ''),

    internalStorageTotalSpace: safeCall((f) => f.getInternalStorageTotalSpace(), 0),
    internalStorageFreeSpace: safeCall((f) => f.getInternalStorageFreeSpace(), 0),
    externalStorageTotalSpace: safeCall((f) => f.getExternalStorageTotalSpace(), 0),
    externalStorageFreeSpace: safeCall((f) => f.getExternalStorageFreeSpace(), 0),
  };
}

/**
 * Last known device location.
 */
export interface FullyLocation {
  /** Latitude in degrees. */
  latitude?: number;
  /** Longitude in degrees. */
  longitude?: number;
  /** Accuracy in meters. */
  accuracy?: number;
  /** Altitude in meters. */
  altitude?: number;
  /** Speed in meters per second. */
  speed?: number;
  /** Fix timestamp in milliseconds since the epoch. */
  time?: number;
  /** Any other field the device reports. */
  [key: string]: unknown;
}

/**
 * Reads the last known device location.
 *
 * @returns The location, or `null` when unavailable.
 */
export function getFullyLocation(): FullyLocation | null {
  return safeJsonCall<FullyLocation | null>((f) => f.getLocation(), null);
}

/**
 * One open tab as reported by the JavaScript interface.
 */
export interface FullyTab {
  /** URL loaded in the tab. */
  url?: string;
  /** Page title of the tab. */
  title?: string;
  /** Any other field the device reports. */
  [key: string]: unknown;
}

/**
 * Lists the open tabs.
 *
 * @returns The tabs, or an empty array when unavailable.
 */
export function getFullyTabList(): FullyTab[] {
  return safeJsonCall<FullyTab[]>((f) => f.getTabList(), []);
}

/**
 * One entry of a device folder listing.
 */
export interface FullyFileEntry {
  /** File or folder name. */
  name?: string;
  /** Size in bytes. */
  size?: number;
  /** Whether the entry is a folder. */
  isDir?: boolean;
  /** Any other field the device reports. */
  [key: string]: unknown;
}

/**
 * Lists the contents of a folder on the device.
 *
 * @param folder - Path of the folder to list.
 * @returns The entries, or an empty array when unavailable.
 */
export function getFullyFileList(folder: string): FullyFileEntry[] {
  return safeJsonCall<FullyFileEntry[]>((f) => f.getFileList(folder), []);
}

/**
 * Reads the description of the available environment sensors.
 *
 * @returns The sensor description, or `null` when unavailable.
 */
export function getFullySensorInfo(): unknown {
  return safeJsonCall<unknown>((f) => f.getSensorInfo(), null);
}

/**
 * Lists the known Bluetooth devices with their connection state.
 *
 * @returns The devices, or an empty array when unavailable.
 */
export function getFullyBluetoothDevices(): unknown[] {
  return safeJsonCall<unknown[]>((f) => f.btGetDeviceListJson(), []);
}

/**
 * Captures the screen through the JavaScript interface.
 *
 * @returns A `data:` URL with the PNG screenshot, or `null` when unavailable.
 */
export function getFullyScreenshotDataUrl(): string | null {
  const base64 = safeCall((f) => f.getScreenshotPngBase64(), '');
  return base64 ? `data:image/png;base64,${base64}` : null;
}

/**
 * Captures a camera still through the JavaScript interface. Requires motion
 * detection to be running.
 *
 * @returns A `data:` URL with the JPEG image, or `null` when unavailable.
 */
export function getFullyCamshotDataUrl(): string | null {
  const base64 = safeCall((f) => f.getCamshotJpgBase64(), '');
  return base64 ? `data:image/jpeg;base64,${base64}` : null;
}
