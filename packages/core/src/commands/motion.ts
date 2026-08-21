import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Motion detection control.
 *
 * Motion detection uses the front camera or the microphone and must be
 * available on the device for these commands to have an effect.
 */
export class MotionCommands extends CommandGroup {
  /**
   * Simulates a motion event, which wakes the screen and resets the
   * screensaver timer.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  trigger(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('triggerMotion', {}, options);
  }

  /**
   * Enables motion detection by writing the `motionDetection` setting.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  enable(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json(
      'setBooleanSetting',
      { key: 'motionDetection', value: true },
      options,
    );
  }

  /**
   * Disables motion detection by writing the `motionDetection` setting.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  disable(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json(
      'setBooleanSetting',
      { key: 'motionDetection', value: false },
      options,
    );
  }
}
