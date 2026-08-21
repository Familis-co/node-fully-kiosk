import { getFully } from '../../index.js';
import { useCallback, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';

/**
 * Options for a single {@link UseFullyTextToSpeechResult.say} call.
 */
export interface FullySpeakOptions {
  /** Locale or voice name, e.g. `en_GB`. */
  locale?: string;
  /** Text-to-speech engine package name. */
  engine?: string;
  /** Queue behind the current utterance instead of interrupting it. */
  queue?: boolean;
}

/**
 * Text-to-speech state and control through the JavaScript interface.
 */
export interface UseFullyTextToSpeechResult {
  /**
   * Speaks a text on the device.
   *
   * @param text - The text to speak.
   * @param options - Locale, engine and queue behaviour.
   */
  say: (text: string, options?: FullySpeakOptions) => void;
  /** Stops current and queued speech. */
  stop: () => void;
  /** Initialises the engine and populates {@link UseFullyTextToSpeechResult.engineInfo}. */
  init: () => void;
  /** `true` between the start and the end of an utterance. */
  isSpeaking: boolean;
  /** Engine, voice and locale information reported after {@link init}. */
  engineInfo: string | null;
  /** The identifier of the utterance that most recently failed. */
  lastError: string | null;
}

/**
 * Speaks text through the JavaScript interface and follows the utterance
 * lifecycle events.
 *
 * @returns The speech controls and their state.
 *
 * @example
 * ```tsx
 * const tts = useFullyTextToSpeech();
 * <button onClick={() => tts.say('Your order is ready', { locale: 'en_GB' })}>
 *   {tts.isSpeaking ? 'Speaking…' : 'Announce'}
 * </button>
 * ```
 */
export function useFullyTextToSpeech(): UseFullyTextToSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [engineInfo, setEngineInfo] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useFullyEvent('ttsUtteranceStart', () => setIsSpeaking(true));
  useFullyEvent('ttsUtteranceDone', () => setIsSpeaking(false));
  useFullyEvent('ttsUtteranceError', ({ id }) => {
    setIsSpeaking(false);
    setLastError(id);
  });
  useFullyEvent('ttsInitSuccess', ({ info }) => setEngineInfo(info));

  return {
    say: useCallback((text: string, options: FullySpeakOptions = {}) => {
      getFully()?.textToSpeech(text, options.locale, options.engine, options.queue);
    }, []),
    stop: useCallback(() => {
      getFully()?.stopTextToSpeech();
      setIsSpeaking(false);
    }, []),
    init: useCallback(() => getFully()?.initTts(), []),
    isSpeaking,
    engineInfo,
    lastError,
  };
}
