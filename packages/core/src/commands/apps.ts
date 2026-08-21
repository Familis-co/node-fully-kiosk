import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskApkInstallState, FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Launching other apps, managing APKs and controlling the Fully app itself.
 */
export class AppCommands extends CommandGroup {
  /**
   * Launches another installed application.
   *
   * @param packageName - Android package name, e.g. `com.android.settings`.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  start(
    packageName: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('startApplication', { package: packageName }, options);
  }

  /**
   * Starts an Android intent from an intent URL.
   *
   * @param url - The intent URL, e.g. `intent://...#Intent;...;end`.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  startIntent(url: string, options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('startIntent', { url }, options);
  }

  /**
   * Brings Fully Kiosk to the foreground.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  toForeground(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('toForeground', {}, options);
  }

  /**
   * Sends Fully Kiosk to the background.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  toBackground(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('toBackground', {}, options);
  }

  /**
   * Restarts the Fully Kiosk app.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  restart(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('restartApp', {}, options);
  }

  /**
   * Closes the Fully Kiosk app.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  exit(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('exitApp', {}, options);
  }

  /**
   * Kills the Fully Kiosk process without a clean shutdown.
   * Requires Fully Kiosk 1.55+.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  kill(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('killMyProcess', {}, options);
  }

  /**
   * Downloads an APK and starts its installation. Not available in the Google
   * Play edition of Fully Kiosk.
   *
   * @param url - URL of the APK file.
   * @param forceInstall - Reinstall even when the same version is present.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  installApk(
    url: string,
    forceInstall = false,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('loadApkFile', { url, forceInstall }, options);
  }

  /**
   * Reads the progress of the APK installation started with {@link installApk}.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The current installation state.
   */
  installState(options?: FullyKioskRequestOptions): Promise<FullyKioskApkInstallState> {
    return this.transport.json<FullyKioskApkInstallState>('getInstallApkState', {}, options);
  }

  /**
   * Uninstalls an application.
   *
   * @param packageName - Android package name to remove.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  uninstall(
    packageName: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('uninstallApp', { package: packageName }, options);
  }

  /**
   * Kills the background processes of an application. Android 13 and older.
   *
   * @param packageName - Android package name whose processes to kill.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  killBackgroundProcesses(
    packageName: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('killBackgroundProcesses', { package: packageName }, options);
  }

  /**
   * Clears the stored data of an application. Android 9+ and provisioned
   * devices only.
   *
   * @param packageName - Android package name whose data to clear.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  clearAppData(
    packageName: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('clearAppData', { package: packageName }, options);
  }

  /**
   * Installs a CA certificate into the user certificate store. Provisioned
   * devices only.
   *
   * @param url - URL of the certificate file.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  installUserCa(
    url: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('installUserCa', { url }, options);
  }
}
