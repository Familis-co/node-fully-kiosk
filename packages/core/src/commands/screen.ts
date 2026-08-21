import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Screen power, brightness, screensaver and daydream control.
 */
export class ScreenCommands extends CommandGroup {
  /**
   * Turns the screen on and resets the screen-off timer.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  on(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('screenOn', {}, options);
  }

  /**
   * Turns the screen off.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  off(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('screenOff', {}, options);
  }

  /**
   * Puts the device to sleep immediately, bypassing the screen-off timer.
   * Requires device administrator permission.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  forceSleep(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('forceSleep', {}, options);
  }

  /**
   * Sets the screen brightness.
   *
   * There is no dedicated REST command for brightness, so this writes the
   * `screenBrightness` setting, which Fully applies immediately.
   *
   * @param level - Brightness between `0` and `255`.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  setBrightness(
    level: number,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    if (!Number.isFinite(level) || level < 0 || level > 255) {
      throw new RangeError('`level` must be a number between 0 and 255');
    }
    return this.transport.json(
      'setStringSetting',
      { key: 'screenBrightness', value: Math.round(level) },
      options,
    );
  }

  /**
   * Starts the Fully Kiosk screensaver.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  startScreensaver(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('startScreensaver', {}, options);
  }

  /**
   * Stops the Fully Kiosk screensaver.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  stopScreensaver(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('stopScreensaver', {}, options);
  }

  /**
   * Starts the Android daydream. Android 10 and older only.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  startDaydream(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('startDaydream', {}, options);
  }

  /**
   * Stops the Android daydream. Android 10 and older only.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  stopDaydream(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('stopDaydream', {}, options);
  }
}
