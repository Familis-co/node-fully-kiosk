import { CommandGroup } from './base.js';
import type { FullyKioskDeviceInfo } from '../types/device-info.js';
import type { FullyKioskRequestOptions } from '../types/options.js';

/**
 * Read-only information and logs about the device.
 */
export class DeviceCommands extends CommandGroup {
  /**
   * Reads the full device information payload.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns Device, network, battery, screen and kiosk state.
   */
  info(options?: FullyKioskRequestOptions): Promise<FullyKioskDeviceInfo> {
    return this.transport.json<FullyKioskDeviceInfo>('getDeviceInfo', {}, options);
  }

  /**
   * Reads the Fully Kiosk application log.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The log as plain text.
   */
  log(options?: FullyKioskRequestOptions): Promise<string> {
    return this.transport.text('showLog', {}, options);
  }

  /**
   * Reads the Android logcat output as seen by Fully Kiosk.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The logcat output as plain text.
   */
  logcat(options?: FullyKioskRequestOptions): Promise<string> {
    return this.transport.text('logcat', {}, options);
  }

  /**
   * Downloads the full usage statistics file.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The usage statistics in CSV format.
   */
  stats(options?: FullyKioskRequestOptions): Promise<string> {
    return this.transport.text('loadStatsCSV', {}, options);
  }
}
