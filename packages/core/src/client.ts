import { AppCommands } from './commands/apps.js';
import { BrowserCommands } from './commands/browser.js';
import { CaptureCommands } from './commands/capture.js';
import { DeviceCommands } from './commands/device.js';
import { FileCommands } from './commands/files.js';
import { KioskCommands } from './commands/kiosk.js';
import { MediaCommands } from './commands/media.js';
import { MotionCommands } from './commands/motion.js';
import { ScreenCommands } from './commands/screen.js';
import { SettingsCommands } from './commands/settings.js';
import { SpeechCommands } from './commands/speech.js';
import { SystemCommands } from './commands/system.js';
import { FullyKioskTransport } from './http.js';
import type {
  FullyKioskClientOptions,
  FullyKioskParams,
  FullyKioskRequestOptions,
} from './types/options.js';
import type { FullyKioskBinaryResponse, FullyKioskStatusResponse } from './types/responses.js';

/**
 * Client for the Fully Kiosk Browser Remote Admin REST interface.
 *
 * Commands are grouped by topic, so `client.screen.on()` turns the screen on
 * and `client.settings.setString(...)` writes a setting. Anything not covered
 * by a group is reachable through {@link FullyKioskClient.command}.
 *
 * Remote Administration must be enabled on the device and the REST interface
 * requires a PLUS license.
 *
 * @example
 * ```ts
 * const client = new FullyKioskClient({ host: '192.168.1.20', password: 'secret' });
 *
 * const info = await client.device.info();
 * console.log(info.batteryLevel);
 *
 * await client.screen.on();
 * await client.browser.loadUrl('https://example.com');
 * ```
 */
export class FullyKioskClient {
  /** Low level transport, exposed for advanced use and testing. */
  readonly transport: FullyKioskTransport;

  /** Device information and logs. */
  readonly device: DeviceCommands;
  /** Screen power, brightness, screensaver and daydream. */
  readonly screen: ScreenCommands;
  /** Motion detection. */
  readonly motion: MotionCommands;
  /** Navigation, tabs and cached web data. */
  readonly browser: BrowserCommands;
  /** Kiosk lock, maintenance mode and the message overlay. */
  readonly kiosk: KioskCommands;
  /** Other applications and the Fully app lifecycle. */
  readonly apps: AppCommands;
  /** Audio volume, sounds, video and the playlist player. */
  readonly media: MediaCommands;
  /** Text-to-speech. */
  readonly speech: SpeechCommands;
  /** Reading and writing Fully settings. */
  readonly settings: SettingsCommands;
  /** File management on the device storage. */
  readonly files: FileCommands;
  /** Screenshots and camera stills. */
  readonly capture: CaptureCommands;
  /** Reboot, shutdown and root commands. */
  readonly system: SystemCommands;

  /**
   * @param options - Connection details and client behaviour.
   */
  constructor(options: FullyKioskClientOptions) {
    this.transport = new FullyKioskTransport(options);

    this.device = new DeviceCommands(this.transport);
    this.screen = new ScreenCommands(this.transport);
    this.motion = new MotionCommands(this.transport);
    this.browser = new BrowserCommands(this.transport);
    this.kiosk = new KioskCommands(this.transport);
    this.apps = new AppCommands(this.transport);
    this.media = new MediaCommands(this.transport);
    this.speech = new SpeechCommands(this.transport);
    this.settings = new SettingsCommands(this.transport);
    this.files = new FileCommands(this.transport);
    this.capture = new CaptureCommands(this.transport);
    this.system = new SystemCommands(this.transport);
  }

  /**
   * The normalised Remote Admin origin this client talks to.
   */
  get baseUrl(): string {
    return this.transport.baseUrl.toString();
  }

  /**
   * Runs any Remote Admin command and decodes the JSON response.
   *
   * Use this for commands added by a Fully version newer than this SDK.
   *
   * @typeParam T - Expected shape of the decoded payload.
   * @param name - The command name, e.g. `getDeviceInfo`.
   * @param params - Query string parameters for the command.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The decoded payload.
   */
  command<T = FullyKioskStatusResponse>(
    name: string,
    params: FullyKioskParams = {},
    options?: FullyKioskRequestOptions,
  ): Promise<T> {
    return this.transport.json<T>(name, params, options);
  }

  /**
   * Runs any Remote Admin command and returns the raw bytes of the response.
   *
   * @param name - The command name.
   * @param params - Query string parameters for the command.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The response bytes and its MIME type.
   */
  commandBinary(
    name: string,
    params: FullyKioskParams = {},
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskBinaryResponse> {
    return this.transport.binary(name, params, options);
  }

  /**
   * Checks whether the device answers and the password is accepted.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns `true` when the device responded successfully, `false` otherwise.
   */
  async ping(options?: FullyKioskRequestOptions): Promise<boolean> {
    try {
      await this.device.info({ retries: 0, ...options });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Convenience factory for {@link FullyKioskClient}.
 *
 * @param options - Connection details and client behaviour.
 * @returns A ready to use client.
 */
export function createFullyKioskClient(options: FullyKioskClientOptions): FullyKioskClient {
  return new FullyKioskClient(options);
}
