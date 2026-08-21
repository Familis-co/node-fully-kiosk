import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';
import type {
  FullyKioskBooleanSettingKey,
  FullyKioskSettings,
  FullyKioskStringSettingKey,
} from '../types/settings.js';

/**
 * Reading and writing the Fully Kiosk configuration.
 *
 * Changes apply immediately on the device. The full list of keys is visible in
 * the Remote Admin interface or in an exported settings JSON file.
 */
export class SettingsCommands extends CommandGroup {
  /**
   * Reads every setting of the device.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns A map of setting keys to their current values.
   */
  list(options?: FullyKioskRequestOptions): Promise<FullyKioskSettings> {
    return this.transport.json<FullyKioskSettings>('listSettings', {}, options);
  }

  /**
   * Reads a single setting.
   *
   * Fully has no command for reading one key, so this fetches all settings and
   * picks the requested entry. Prefer {@link list} when reading several keys.
   *
   * @param key - The setting key to read.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The current value, or `undefined` when the key is unknown.
   */
  async get(
    key: FullyKioskStringSettingKey | FullyKioskBooleanSettingKey,
    options?: FullyKioskRequestOptions,
  ): Promise<string | number | boolean | null | undefined> {
    const settings = await this.list(options);
    return settings[key];
  }

  /**
   * Writes a string setting.
   *
   * @param key - The setting key to write.
   * @param value - The new value.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  setString(
    key: FullyKioskStringSettingKey,
    value: string | number,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('setStringSetting', { key, value }, options);
  }

  /**
   * Writes a boolean setting.
   *
   * @param key - The setting key to write.
   * @param value - The new value.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  setBoolean(
    key: FullyKioskBooleanSettingKey,
    value: boolean,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('setBooleanSetting', { key, value }, options);
  }

  /**
   * Imports a settings JSON file from a URL or a local path.
   *
   * @param url - Location of the settings file.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  importFrom(url: string, options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('importSettingsFile', { url }, options);
  }
}
