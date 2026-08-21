/**
 * Device information returned by the `getDeviceInfo` command.
 *
 * The exact set of fields depends on the Fully Kiosk version, the Android
 * version and whether a PLUS license is active, so every field is optional and
 * unknown fields are preserved through the index signature.
 */
export interface FullyKioskDeviceInfo {
  /** Stable Fully Kiosk device identifier, e.g. `a1b2c3d4-...`. */
  deviceID?: string;
  /** User facing device name configured in Android. */
  deviceName?: string;
  /** Hardware model, e.g. `Lenovo TB-X606F`. */
  deviceModel?: string;
  /** Hardware manufacturer, e.g. `Lenovo`. */
  deviceManufacturer?: string;
  /** Hardware serial number when readable. */
  serial?: string;
  /** Android release version, e.g. `13`. */
  androidVersion?: string;
  /** Android SDK level, e.g. `33`. */
  androidSdk?: number;
  /** Fully Kiosk version name, e.g. `1.60.1`. */
  appVersionName?: string;
  /** Fully Kiosk version code. */
  appVersionCode?: number;
  /** Android System WebView version backing the browser. */
  webviewVersion?: string;

  /** Primary IPv4 address. */
  ip4?: string;
  /** Primary IPv6 address. */
  ip6?: string;
  /** Network hostname. */
  hostname?: string;
  /** Wi-Fi MAC address. Fully spells this key with a capital `M`. */
  Mac?: string;
  /** SSID of the connected Wi-Fi network. */
  ssid?: string;
  /** Wi-Fi signal level, 0-4. */
  wifiSignalLevel?: number;

  /** Battery charge in percent, 0-100. */
  batteryLevel?: number;
  /** Battery temperature in degrees Celsius. */
  batteryTemperature?: number;
  /** Whether the device is connected to a power source. */
  plugged?: boolean;

  /** Whether the screen is currently on. */
  screenOn?: boolean;
  /** Screen brightness, 0-255. */
  screenBrightness?: number;
  /** Screen orientation as an Android orientation constant. */
  screenOrientation?: number;
  /** Display width in pixels. */
  displayWidth?: number;
  /** Display height in pixels. */
  displayHeight?: number;

  /** URL currently loaded in the focused tab. */
  currentPage?: string;
  /** Index of the focused tab. */
  currentTabIndex?: number;
  /** Configured start URL. */
  startUrl?: string;
  /** Package name of the app currently in the foreground. */
  foregroundApp?: string;

  /** Whether Fully's kiosk mode is enabled. */
  kioskMode?: boolean;
  /** Whether kiosk mode is currently locked. */
  kioskLocked?: boolean;
  /** Whether maintenance mode is active. */
  maintenanceMode?: boolean;
  /** Whether the Fully screensaver is currently showing. */
  isInScreensaver?: boolean;
  /** Whether Fully holds Android device admin permission. */
  isDeviceAdmin?: boolean;
  /** Whether Fully is the Android device owner (provisioned). */
  isDeviceOwner?: boolean;
  /** Whether the device is rooted. */
  isRooted?: boolean;
  /** Human readable state of the motion detector. */
  motionDetectorStatus?: number | string;

  /** Free space on internal storage in bytes. */
  internalStorageFreeSpace?: number;
  /** Total internal storage in bytes. */
  internalStorageTotalSpace?: number;
  /** Free space on external storage in bytes. */
  externalStorageFreeSpace?: number;
  /** Total external storage in bytes. */
  externalStorageTotalSpace?: number;
  /** Free RAM in bytes. */
  ramFreeMemory?: number;
  /** Total RAM in bytes. */
  ramTotalMemory?: number;

  /** Milliseconds since the Fully app was started. */
  appUpTime?: number;
  /** Milliseconds since the device was booted. */
  deviceUpTime?: number;
  /** Current locale, e.g. `en_GB`. */
  locale?: string;
  /** Whether the MQTT client is connected. */
  mqttConnected?: boolean;

  /**
   * Snapshot of the Fully settings, included by newer Fully versions.
   *
   * @see {@link FullyKioskSettings}
   */
  settings?: Record<string, string | number | boolean | null>;

  /** Any other field the device reports that is not modelled above. */
  [key: string]: unknown;
}
