/**
 * @vitest-environment happy-dom
 */
import { AudioStream } from '../../index.js';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyAudio } from './use-fully-audio.js';

afterEach(() => {
  resetFully();
  cleanup();
});

/**
 * Interface members backed by a per-stream volume map.
 *
 * @param initial - Starting volume of every stream.
 * @returns The members plus the spies the tests assert on.
 */
function audioStub(initial = 40) {
  const volumes: Record<number, number> = {};

  return {
    getAudioVolume: (stream: number) => volumes[stream] ?? initial,
    setAudioVolume: vi.fn((level: number, stream: number) => {
      volumes[stream] = level;
    }),
    isMusicActive: () => true,
    isWiredHeadsetOn: () => false,
    playSound: vi.fn(),
    stopSound: vi.fn(),
    playVideo: vi.fn(),
    stopVideo: vi.fn(),
  };
}

describe('useFullyAudio', () => {
  it('reads the music stream by default', () => {
    const stub = audioStub(40);
    installFully(stub);

    const { result } = renderHook(() => useFullyAudio());
    act(() => result.current.setVolume(70));

    expect(stub.setAudioVolume).toHaveBeenCalledWith(70, AudioStream.Music);
    expect(result.current.volume).toBe(70);
  });

  it('binds to the requested stream', () => {
    const stub = audioStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyAudio(AudioStream.Alarm));
    act(() => result.current.setVolume(20));

    expect(stub.setAudioVolume).toHaveBeenCalledWith(20, AudioStream.Alarm);
  });

  it('re-reads the volume when a hardware volume key is pressed', () => {
    let level = 40;
    installFully({
      getAudioVolume: () => level,
      isMusicActive: () => false,
      isWiredHeadsetOn: () => false,
    });

    const { result } = renderHook(() => useFullyAudio());
    expect(result.current.volume).toBe(40);

    level = 45;
    emit('volumeUp');
    expect(result.current.volume).toBe(45);

    level = 35;
    emit('volumeDown');
    expect(result.current.volume).toBe(35);
  });

  it('reports playback and headset state', () => {
    installFully({
      getAudioVolume: () => 40,
      isMusicActive: () => true,
      isWiredHeadsetOn: () => true,
    });

    const { result } = renderHook(() => useFullyAudio());

    expect(result.current.isMusicActive).toBe(true);
    expect(result.current.isHeadsetConnected).toBe(true);
  });

  it('plays a sound on the bound stream, not looping by default', () => {
    const stub = audioStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyAudio(AudioStream.Notification));
    act(() => result.current.playSound('https://example.test/ding.mp3'));

    expect(stub.playSound).toHaveBeenCalledWith(
      'https://example.test/ding.mp3',
      false,
      AudioStream.Notification,
    );
  });

  it('loops a sound when asked to', () => {
    const stub = audioStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyAudio());
    act(() => result.current.playSound('https://example.test/loop.mp3', true));

    expect(stub.playSound).toHaveBeenCalledWith(
      'https://example.test/loop.mp3',
      true,
      AudioStream.Music,
    );
  });

  it('defaults video playback to closing the player when it ends', () => {
    const stub = audioStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyAudio());
    act(() => result.current.playVideo('https://example.test/clip.mp4'));

    expect(stub.playVideo).toHaveBeenCalledWith(
      'https://example.test/clip.mp4',
      false,
      false,
      false,
      true,
    );
  });

  it('passes every video option through in order', () => {
    const stub = audioStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyAudio());
    act(() =>
      result.current.playVideo('https://example.test/clip.mp4', {
        loop: true,
        showControls: true,
        exitOnTouch: true,
        exitOnCompletion: false,
      }),
    );

    expect(stub.playVideo).toHaveBeenCalledWith(
      'https://example.test/clip.mp4',
      true,
      true,
      true,
      false,
    );
  });

  it('stops sound and video', () => {
    const stub = audioStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyAudio());
    act(() => result.current.stopSound());
    act(() => result.current.stopVideo());

    expect(stub.stopSound).toHaveBeenCalledOnce();
    expect(stub.stopVideo).toHaveBeenCalledOnce();
  });

  it('reports a zero volume outside Fully Kiosk without throwing', () => {
    const { result } = renderHook(() => useFullyAudio());

    expect(result.current.volume).toBe(0);
    expect(() => act(() => result.current.setVolume(50))).not.toThrow();
    expect(() => act(() => result.current.playSound('x'))).not.toThrow();
  });
});
