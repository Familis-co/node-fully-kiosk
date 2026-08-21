import { CommandGroup } from './base.js';
import { AudioStream, type AudioStreamValue } from '../types/settings.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Options for {@link MediaCommands.playVideo}.
 */
export interface PlayVideoOptions extends FullyKioskRequestOptions {
  /** Repeat the video when it ends. Defaults to `false`. */
  loop?: boolean;
  /** Show the player controls. Defaults to `false`. */
  showControls?: boolean;
  /** Close the player when the screen is touched. Defaults to `false`. */
  exitOnTouch?: boolean;
  /** Close the player when playback finishes. Defaults to `true`. */
  exitOnCompletion?: boolean;
}

/**
 * Audio volume, sound playback, video playback and the Fully playlist player.
 */
export class MediaCommands extends CommandGroup {
  /**
   * Sets the volume of an Android audio stream.
   *
   * @param level - Volume between `0` and `100`.
   * @param stream - Target audio stream. Defaults to {@link AudioStream.Music}.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  setVolume(
    level: number,
    stream: AudioStreamValue = AudioStream.Music,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    if (!Number.isFinite(level) || level < 0 || level > 100) {
      throw new RangeError('`level` must be a number between 0 and 100');
    }
    return this.transport.json('setAudioVolume', { level: Math.round(level), stream }, options);
  }

  /**
   * Plays a sound file from a URL or a local path.
   *
   * @param url - Location of the sound file.
   * @param loop - Repeat the sound until stopped. Defaults to `false`.
   * @param stream - Target audio stream. Defaults to {@link AudioStream.Music}.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  playSound(
    url: string,
    loop = false,
    stream: AudioStreamValue = AudioStream.Music,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('playSound', { url, loop, stream }, options);
  }

  /**
   * Stops the sound started with {@link playSound}.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  stopSound(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('stopSound', {}, options);
  }

  /**
   * Plays a video full screen in Fully's built-in player.
   *
   * @param url - Location of the video file or stream.
   * @param options - Playback behaviour plus per-call request overrides.
   * @returns The status envelope returned by the device.
   */
  playVideo(url: string, options: PlayVideoOptions = {}): Promise<FullyKioskStatusResponse> {
    const {
      loop = false,
      showControls = false,
      exitOnTouch = false,
      exitOnCompletion = true,
      ...request
    } = options;

    return this.transport.json(
      'playVideo',
      {
        url,
        loop: loop ? 1 : 0,
        showControls: showControls ? 1 : 0,
        exitOnTouch: exitOnTouch ? 1 : 0,
        exitOnCompletion: exitOnCompletion ? 1 : 0,
      },
      request,
    );
  }

  /**
   * Stops the video started with {@link playVideo}.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  stopVideo(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('stopVideo', {}, options);
  }

  /**
   * Starts the configured Fully playlist.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  playerStart(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('playerStart', {}, options);
  }

  /**
   * Stops the playlist player.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  playerStop(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('playerStop', {}, options);
  }

  /**
   * Pauses the playlist player.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  playerPause(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('playerPause', {}, options);
  }

  /**
   * Resumes the paused playlist player.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  playerResume(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('playerResume', {}, options);
  }

  /**
   * Skips to the next playlist item.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  playerNext(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('playerNext', {}, options);
  }
}
