import { afterEach, describe, expect, it } from 'vitest';
import {
  getFullyBluetoothDevices,
  getFullyCamshotDataUrl,
  getFullyFileList,
  getFullyLocation,
  getFullyScreenshotDataUrl,
  getFullySensorInfo,
  getFullyTabList,
  readFullyDeviceInfo,
  type FullyLocalDeviceInfo,
} from './device.js';
import type { FullyJsInterface } from './types.js';

/**
 * Each snapshot field, the interface member it must be read from, and a value
 * unique to that member.
 *
 * Because no two getters answer the same value, reading a field from the wrong
 * getter shows up as a mismatch. Booleans alternate so that a swap between two
 * neighbouring flags is caught as well.
 */
const FIELDS: readonly [keyof FullyLocalDeviceInfo, keyof FullyJsInterface, unknown][] = [
  ['deviceId', 'getDeviceId', 'device-id'],
  ['deviceName', 'getDeviceName', 'Lobby tablet'],
  ['deviceModel', 'getDeviceModel', 'Galaxy Tab A8'],
  ['serialNumber', 'getSerialNumber', 'serial-1'],
  ['androidId', 'getAndroidId', 'android-id'],
  ['androidVersion', 'getAndroidVersion', '13'],
  ['androidSdk', 'getAndroidSdk', 33],
  ['fullyVersion', 'getFullyVersion', '1.57.1'],
  ['fullyVersionCode', 'getFullyVersionCode', 1571],
  ['webviewVersion', 'getWebviewVersion', '120.0.6099.43'],
  ['locale', 'getCurrentLocale', 'en_GB'],

  ['ip4Address', 'getIp4Address', '192.168.1.20'],
  ['ip6Address', 'getIp6Address', 'fe80::1'],
  ['hostname', 'getHostname', 'lobby-tablet'],
  ['macAddress', 'getMacAddress', 'aa:bb:cc:dd:ee:ff'],
  ['wifiSsid', 'getWifiSsid', 'Office'],
  ['wifiBssid', 'getWifiBssid', '11:22:33:44:55:66'],
  ['wifiSignalLevel', 'getWifiSignalLevel', '3'],
  ['wifiEnabled', 'isWifiEnabled', true],
  ['wifiConnected', 'isWifiConnected', false],
  ['networkConnected', 'isNetworkConnected', true],
  ['bluetoothEnabled', 'isBluetoothEnabled', false],

  ['batteryLevel', 'getBatteryLevel', 91],
  ['plugged', 'isPlugged', true],

  ['screenOn', 'getScreenOn', false],
  ['screenBrightness', 'getScreenBrightness', 128],
  ['screenOrientation', 'getScreenOrientation', 1],
  ['displayWidth', 'getDisplayWidth', 1920],
  ['displayHeight', 'getDisplayHeight', 1200],
  ['screenRotationLocked', 'isScreenRotationLocked', true],
  ['keyboardVisible', 'isKeyboardVisible', false],

  ['idleTime', 'getIdleTime', 4_500],
  ['inForeground', 'isInForeground', true],
  ['kioskLocked', 'isKioskLocked', false],
  ['motionDetectionRunning', 'isMotionDetectionRunning', true],
  ['startUrl', 'getStartUrl', 'https://example.test/kiosk'],

  ['internalStorageTotalSpace', 'getInternalStorageTotalSpace', 64_000_000_000],
  ['internalStorageFreeSpace', 'getInternalStorageFreeSpace', 12_000_000_000],
  ['externalStorageTotalSpace', 'getExternalStorageTotalSpace', 128_000_000_000],
  ['externalStorageFreeSpace', 'getExternalStorageFreeSpace', 30_000_000_000],
];

/**
 * Installs a `fully` double built from the members a test cares about.
 *
 * @param members - Interface members to expose.
 */
function installFully(members: Record<string, unknown>): void {
  (globalThis as { fully?: unknown }).fully = members;
}

afterEach(() => {
  delete (globalThis as { fully?: unknown }).fully;
});

describe('readFullyDeviceInfo', () => {
  it('reads every field from its own interface member', () => {
    const members: Record<string, unknown> = {};
    const expected: Record<string, unknown> = {};
    for (const [field, getter, value] of FIELDS) {
      members[getter] = () => value;
      expected[field] = value;
    }
    installFully(members);

    expect(readFullyDeviceInfo()).toEqual(expected);
  });

  it('reports neutral values for every field outside Fully Kiosk', () => {
    const info = readFullyDeviceInfo();

    expect(info.deviceName).toBe('');
    expect(info.batteryLevel).toBe(0);
    expect(info.plugged).toBe(false);
    expect(Object.keys(info)).toHaveLength(FIELDS.length);
    expect(
      Object.values(info).every((value) => value === '' || value === 0 || value === false),
    ).toBe(true);
  });

  it('keeps reading the remaining fields when one getter throws', () => {
    installFully({
      getDeviceName: () => 'Lobby tablet',
      getBatteryLevel: () => {
        throw new Error('permission denied');
      },
    });

    const info = readFullyDeviceInfo();

    expect(info.deviceName).toBe('Lobby tablet');
    expect(info.batteryLevel).toBe(0);
  });
});

describe('getFullyLocation', () => {
  it('parses the reported fix', () => {
    installFully({ getLocation: () => '{"latitude":51.5,"longitude":-0.12,"accuracy":8}' });

    expect(getFullyLocation()).toEqual({ latitude: 51.5, longitude: -0.12, accuracy: 8 });
  });

  it('is null when no fix is available', () => {
    installFully({ getLocation: () => '' });

    expect(getFullyLocation()).toBeNull();
  });

  it('is null outside Fully Kiosk', () => {
    expect(getFullyLocation()).toBeNull();
  });
});

describe('getFullyTabList', () => {
  it('parses the open tabs', () => {
    installFully({
      getTabList: () => '[{"url":"https://a.test","title":"A"},{"url":"https://b.test"}]',
    });

    expect(getFullyTabList()).toEqual([
      { url: 'https://a.test', title: 'A' },
      { url: 'https://b.test' },
    ]);
  });

  it('is an empty list on a malformed payload', () => {
    installFully({ getTabList: () => '{oops' });

    expect(getFullyTabList()).toEqual([]);
  });
});

describe('getFullyFileList', () => {
  it('passes the folder through and parses the listing', () => {
    const seen: string[] = [];
    installFully({
      getFileList: (folder: string) => {
        seen.push(folder);
        return '[{"name":"logo.png","size":2048,"isDir":false}]';
      },
    });

    expect(getFullyFileList('/sdcard/kiosk')).toEqual([
      { name: 'logo.png', size: 2048, isDir: false },
    ]);
    expect(seen).toEqual(['/sdcard/kiosk']);
  });

  it('is an empty list outside Fully Kiosk', () => {
    expect(getFullyFileList('/sdcard')).toEqual([]);
  });
});

describe('getFullySensorInfo', () => {
  it('parses the sensor description', () => {
    installFully({ getSensorInfo: () => '{"5":{"name":"light"}}' });

    expect(getFullySensorInfo()).toEqual({ 5: { name: 'light' } });
  });

  it('is null when unavailable', () => {
    expect(getFullySensorInfo()).toBeNull();
  });
});

describe('getFullyBluetoothDevices', () => {
  it('parses the device list', () => {
    installFully({ btGetDeviceListJson: () => '[{"name":"Printer001","connected":true}]' });

    expect(getFullyBluetoothDevices()).toEqual([{ name: 'Printer001', connected: true }]);
  });

  it('is an empty list when unavailable', () => {
    expect(getFullyBluetoothDevices()).toEqual([]);
  });
});

describe('getFullyScreenshotDataUrl', () => {
  it('wraps the base64 payload as a PNG data URL', () => {
    installFully({ getScreenshotPngBase64: () => 'iVBORw0KGgo=' });

    expect(getFullyScreenshotDataUrl()).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('is null when the capture came back empty', () => {
    installFully({ getScreenshotPngBase64: () => '' });

    expect(getFullyScreenshotDataUrl()).toBeNull();
  });

  it('is null outside Fully Kiosk', () => {
    expect(getFullyScreenshotDataUrl()).toBeNull();
  });
});

describe('getFullyCamshotDataUrl', () => {
  it('wraps the base64 payload as a JPEG data URL', () => {
    installFully({ getCamshotJpgBase64: () => '/9j/4AAQ' });

    expect(getFullyCamshotDataUrl()).toBe('data:image/jpeg;base64,/9j/4AAQ');
  });

  it('is null when motion detection is not running', () => {
    installFully({ getCamshotJpgBase64: () => '' });

    expect(getFullyCamshotDataUrl()).toBeNull();
  });
});
