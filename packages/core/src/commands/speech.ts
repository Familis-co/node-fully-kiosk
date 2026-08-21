import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Options for {@link SpeechCommands.say}.
 */
export interface SpeakOptions extends FullyKioskRequestOptions {
  /** Locale or voice name, e.g. `en_GB`. */
  locale?: string;
  /** Text-to-speech engine package name. */
  engine?: string;
  /** Queue behind the current utterance instead of interrupting it. */
  queue?: boolean;
}

/**
 * Text-to-speech output.
 */
export class SpeechCommands extends CommandGroup {
  /**
   * Speaks a piece of text on the device.
   *
   * @param text - The text to speak.
   * @param options - Locale, engine and queue behaviour plus request overrides.
   * @returns The status envelope returned by the device.
   */
  say(text: string, options: SpeakOptions = {}): Promise<FullyKioskStatusResponse> {
    const { locale, engine, queue, ...request } = options;
    return this.transport.json(
      'textToSpeech',
      { text, locale, engine, queue: queue === undefined ? undefined : queue ? 1 : 0 },
      request,
    );
  }

  /**
   * Stops the current and queued speech output.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  stop(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('stopTextToSpeech', {}, options);
  }
}
