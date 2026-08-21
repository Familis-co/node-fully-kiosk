import { AudioStream, getFully, type AudioStreamValue } from '../../index.js';
import { useCallback } from 'react';
import { useFullyEvent } from './use-fully-event.js';
import { useFullyValue } from './use-fully-value.js';

/**
 * Audio state and control through the JavaScript interface.
 */
export interface UseFullyAudioResult {
  /** Current volume of the selected stream, 0-100. */
  volume: number;
  /**
   * Sets the volume of the selected stream.
   *
   * @param level - Volume between `0` and `100`.
   */
  setVolume: (level: number) => void;
  /** Whether audio is currently playing on the device. */
  isMusicActive: boolean;
  /** Whether a wired headset is connected. */
  isHeadsetConnected: boolean;
  /**
   * Plays a sound.
   *
   * @param url - Location of the sound file.
   * @param loop - Repeat until stopped. Defaults to `false`.
   */
  playSound: (url: string, loop?: boolean) => void;
  /** Stops the current sound. */
  stopSound: () => void;
  /**
   * Plays a video full screen.
   *
   * @param url - Location of the video.
   * @param options - Playback behaviour.
   */
  playVideo: (
    url: string,
    options?: {
      loop?: boolean;
      showControls?: boolean;
      exitOnTouch?: boolean;
      exitOnCompletion?: boolean;
    },
  ) => void;
  /** Stops video playback. */
  stopVideo: () => void;
  /** Re-reads the volume from the device. */
  refresh: () => number;
}

/**
 * Controls volume and playback from inside the kiosk page.
 *
 * The volume also follows the `volumeUp` and `volumeDown` hardware key events.
 *
 * @param stream - The audio stream to bind to. Defaults to {@link AudioStream.Music}.
 * @param interval - Re-read the volume on this interval in milliseconds.
 * @returns The audio state and its controls.
 */
export function useFullyAudio(
  stream: AudioStreamValue = AudioStream.Music,
  interval?: number,
): UseFullyAudioResult {
  const volume = useFullyValue((fully) => fully.getAudioVolume(stream), 0, {
    interval,
    deps: [stream],
  });
  const musicActive = useFullyValue((fully) => fully.isMusicActive(), false, { interval });
  const headset = useFullyValue((fully) => fully.isWiredHeadsetOn(), false, { interval });

  useFullyEvent('volumeUp', () => volume.refresh());
  useFullyEvent('volumeDown', () => volume.refresh());

  return {
    volume: volume.value,
    setVolume: useCallback(
      (level: number) => {
        getFully()?.setAudioVolume(level, stream);
        volume.refresh();
      },
      [stream, volume],
    ),
    isMusicActive: musicActive.value,
    isHeadsetConnected: headset.value,
    playSound: useCallback(
      (url: string, loop = false) => getFully()?.playSound(url, loop, stream),
      [stream],
    ),
    stopSound: useCallback(() => getFully()?.stopSound(), []),
    playVideo: useCallback(
      (
        url: string,
        options: {
          loop?: boolean;
          showControls?: boolean;
          exitOnTouch?: boolean;
          exitOnCompletion?: boolean;
        } = {},
      ) => {
        getFully()?.playVideo(
          url,
          options.loop ?? false,
          options.showControls ?? false,
          options.exitOnTouch ?? false,
          options.exitOnCompletion ?? true,
        );
      },
      [],
    ),
    stopVideo: useCallback(() => getFully()?.stopVideo(), []),
    refresh: volume.refresh,
  };
}
