import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Device level operations that need root or device owner privileges.
 */
export class SystemCommands extends CommandGroup {
  /**
   * Reboots the device. Provisioned or rooted devices only.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  reboot(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('rebootDevice', {}, options);
  }

  /**
   * Shuts the device down. Rooted devices only.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  shutdown(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('shutdownDevice', {}, options);
  }

  /**
   * Runs a shell command as the app user. Rooted devices only.
   *
   * @param command - The shell command to run.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  runRootCommand(
    command: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('runRootCommand', { command }, options);
  }

  /**
   * Runs a shell command through `su`. Rooted devices only.
   *
   * @param command - The shell command to run.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  runSuCommand(
    command: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('runSuCommand', { command }, options);
  }
}
