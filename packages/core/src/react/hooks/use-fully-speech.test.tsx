/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyTextToSpeech } from './use-fully-speech.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyTextToSpeech', () => {
  it('starts idle', () => {
    installFully({ textToSpeech: vi.fn() });

    const { result } = renderHook(() => useFullyTextToSpeech());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.engineInfo).toBeNull();
    expect(result.current.lastError).toBeNull();
  });

  it('leaves the optional arguments undefined when no options are given', () => {
    const textToSpeech = vi.fn();
    installFully({ textToSpeech });

    const { result } = renderHook(() => useFullyTextToSpeech());
    act(() => result.current.say('Your order is ready'));

    expect(textToSpeech).toHaveBeenCalledWith(
      'Your order is ready',
      undefined,
      undefined,
      undefined,
    );
  });

  it('passes the locale, engine and queue behaviour through', () => {
    const textToSpeech = vi.fn();
    installFully({ textToSpeech });

    const { result } = renderHook(() => useFullyTextToSpeech());
    act(() =>
      result.current.say('Hello', {
        locale: 'en_GB',
        engine: 'com.google.android.tts',
        queue: true,
      }),
    );

    expect(textToSpeech).toHaveBeenCalledWith('Hello', 'en_GB', 'com.google.android.tts', true);
  });

  it('follows the utterance lifecycle', () => {
    installFully({ textToSpeech: vi.fn() });

    const { result } = renderHook(() => useFullyTextToSpeech());

    emit('ttsUtteranceStart', 'utterance-1');
    expect(result.current.isSpeaking).toBe(true);

    emit('ttsUtteranceDone', 'utterance-1');
    expect(result.current.isSpeaking).toBe(false);
  });

  it('records the id of a failed utterance and stops speaking', () => {
    installFully({ textToSpeech: vi.fn() });

    const { result } = renderHook(() => useFullyTextToSpeech());
    emit('ttsUtteranceStart', 'utterance-2');
    emit('ttsUtteranceError', 'utterance-2');

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.lastError).toBe('utterance-2');
  });

  it('keeps the engine information reported after init', () => {
    const initTts = vi.fn();
    installFully({ initTts });

    const { result } = renderHook(() => useFullyTextToSpeech());
    act(() => result.current.init());
    emit('ttsInitSuccess', 'Google TTS en_GB');

    expect(initTts).toHaveBeenCalledOnce();
    expect(result.current.engineInfo).toBe('Google TTS en_GB');
  });

  it('clears the speaking flag as soon as stop is called', () => {
    const stopTextToSpeech = vi.fn();
    installFully({ stopTextToSpeech });

    const { result } = renderHook(() => useFullyTextToSpeech());
    emit('ttsUtteranceStart', 'utterance-3');
    expect(result.current.isSpeaking).toBe(true);

    act(() => result.current.stop());

    expect(stopTextToSpeech).toHaveBeenCalledOnce();
    expect(result.current.isSpeaking).toBe(false);
  });

  it('does not throw outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyTextToSpeech());

    expect(() => act(() => result.current.say('Hello'))).not.toThrow();
    expect(() => act(() => result.current.stop())).not.toThrow();
    expect(() => act(() => result.current.init())).not.toThrow();
  });
});
