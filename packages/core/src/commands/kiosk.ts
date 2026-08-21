import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Kiosk lock, maintenance mode and the message overlay.
 */
export class KioskCommands extends CommandGroup {
  /**
   * Locks kiosk mode so the PIN is required to leave it.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  lock(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('lockKiosk', {}, options);
  }

  /**
   * Unlocks kiosk mode.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  unlock(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('unlockKiosk', {}, options);
  }

  /**
   * Puts the device into maintenance mode, locking it down for servicing.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  enableLockedMode(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('enableLockedMode', {}, options);
  }

  /**
   * Leaves maintenance mode.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  disableLockedMode(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('disableLockedMode', {}, options);
  }

  /**
   * Shows a message in an overlay on top of the current page.
   *
   * @param text - The message to display.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  setOverlayMessage(
    text: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('setOverlayMessage', { text }, options);
  }

  /**
   * Removes the overlay message by setting it to an empty string.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  clearOverlayMessage(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('setOverlayMessage', { text: '' }, options);
  }

  /**
   * Closes any special view such as the PDF viewer, the settings screen or the
   * menu, returning to the main web view.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  popFragment(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('popFragment', {}, options);
  }
}
