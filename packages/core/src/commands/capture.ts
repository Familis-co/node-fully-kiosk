import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskBinaryResponse } from '../types/responses.js';

/**
 * Screen and camera capture.
 */
export class CaptureCommands extends CommandGroup {
  /**
   * Captures the current screen as a PNG image.
   *
   * Video playback and other apps are not captured; those areas come back
   * black.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The PNG bytes and its MIME type.
   */
  screenshot(options?: FullyKioskRequestOptions): Promise<FullyKioskBinaryResponse> {
    return this.transport.binary('getScreenshot', {}, options);
  }

  /**
   * Captures a still image from the front camera. Requires motion detection to
   * be enabled so the camera is active.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The image bytes and its MIME type.
   */
  camshot(options?: FullyKioskRequestOptions): Promise<FullyKioskBinaryResponse> {
    return this.transport.binary('getCamshot', {}, options);
  }
}
