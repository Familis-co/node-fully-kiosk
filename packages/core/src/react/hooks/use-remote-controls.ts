import type { AudioStreamValue, LoadUrlOptions, SpeakOptions } from '../../index.js';
import { useMemo } from 'react';
import { useFullyKioskClient } from '../context.js';
import { useActionGroup, type ActionGroupState } from './use-action-group.js';

/**
 * Screen control over the REST interface.
 */
export interface UseScreenControlResult extends ActionGroupState {
  /** Turns the screen on. */
  turnOn: () => Promise<unknown>;
  /** Turns the screen off. */
  turnOff: () => Promise<unknown>;
  /** Puts the device to sleep immediately. */
  forceSleep: () => Promise<unknown>;
  /**
   * Sets the screen brightness.
   *
   * @param level - Brightness between `0` and `255`.
   */
  setBrightness: (level: number) => Promise<unknown>;
  /** Starts the Fully screensaver. */
  startScreensaver: () => Promise<unknown>;
  /** Stops the Fully screensaver. */
  stopScreensaver: () => Promise<unknown>;
}

/**
 * Screen power, brightness and screensaver control over the REST interface.
 *
 * @returns The screen actions sharing one pending and error state.
 *
 * @example
 * ```tsx
 * const screen = useScreenControl();
 * <button onClick={screen.turnOff} disabled={screen.isPending}>Sleep</button>
 * ```
 */
export function useScreenControl(): UseScreenControlResult {
  const client = useFullyKioskClient();
  const group = useActionGroup();
  const { run } = group;

  const actions = useMemo(
    () => ({
      turnOn: () => run(() => client.screen.on()),
      turnOff: () => run(() => client.screen.off()),
      forceSleep: () => run(() => client.screen.forceSleep()),
      setBrightness: (level: number) => run(() => client.screen.setBrightness(level)),
      startScreensaver: () => run(() => client.screen.startScreensaver()),
      stopScreensaver: () => run(() => client.screen.stopScreensaver()),
    }),
    [client, run],
  );

  return { ...actions, isPending: group.isPending, error: group.error, reset: group.reset };
}

/**
 * Kiosk control over the REST interface.
 */
export interface UseKioskControlResult extends ActionGroupState {
  /** Locks kiosk mode. */
  lock: () => Promise<unknown>;
  /** Unlocks kiosk mode. */
  unlock: () => Promise<unknown>;
  /** Enters maintenance mode. */
  enableLockedMode: () => Promise<unknown>;
  /** Leaves maintenance mode. */
  disableLockedMode: () => Promise<unknown>;
  /**
   * Shows a message overlay on the device.
   *
   * @param text - The message to display.
   */
  setOverlayMessage: (text: string) => Promise<unknown>;
  /** Removes the message overlay. */
  clearOverlayMessage: () => Promise<unknown>;
  /** Restarts the Fully app. */
  restartApp: () => Promise<unknown>;
}

/**
 * Kiosk lock, maintenance mode and overlay control over the REST interface.
 *
 * @returns The kiosk actions sharing one pending and error state.
 */
export function useKioskControl(): UseKioskControlResult {
  const client = useFullyKioskClient();
  const group = useActionGroup();
  const { run } = group;

  const actions = useMemo(
    () => ({
      lock: () => run(() => client.kiosk.lock()),
      unlock: () => run(() => client.kiosk.unlock()),
      enableLockedMode: () => run(() => client.kiosk.enableLockedMode()),
      disableLockedMode: () => run(() => client.kiosk.disableLockedMode()),
      setOverlayMessage: (text: string) => run(() => client.kiosk.setOverlayMessage(text)),
      clearOverlayMessage: () => run(() => client.kiosk.clearOverlayMessage()),
      restartApp: () => run(() => client.apps.restart()),
    }),
    [client, run],
  );

  return { ...actions, isPending: group.isPending, error: group.error, reset: group.reset };
}

/**
 * Navigation control over the REST interface.
 */
export interface UseNavigationResult extends ActionGroupState {
  /**
   * Navigates to a URL.
   *
   * @param url - The URL to load.
   * @param options - Tab targeting options.
   */
  loadUrl: (url: string, options?: LoadUrlOptions) => Promise<unknown>;
  /** Navigates back to the configured start URL. */
  loadStartUrl: () => Promise<unknown>;
  /** Reloads the focused tab. */
  refresh: () => Promise<unknown>;
  /** Clears the WebView cache. */
  clearCache: () => Promise<unknown>;
  /** Clears local storage, session storage and IndexedDB. */
  clearWebStorage: () => Promise<unknown>;
  /** Clears all cookies. */
  clearCookies: () => Promise<unknown>;
  /**
   * Focuses a tab.
   *
   * @param index - Zero-based tab index.
   */
  focusTab: (index: number) => Promise<unknown>;
  /**
   * Closes a tab.
   *
   * @param index - Zero-based tab index.
   */
  closeTab: (index: number) => Promise<unknown>;
}

/**
 * Navigation, tabs and cached web data over the REST interface.
 *
 * @returns The navigation actions sharing one pending and error state.
 */
export function useNavigation(): UseNavigationResult {
  const client = useFullyKioskClient();
  const group = useActionGroup();
  const { run } = group;

  const actions = useMemo(
    () => ({
      loadUrl: (url: string, options?: LoadUrlOptions) =>
        run(() => client.browser.loadUrl(url, options)),
      loadStartUrl: () => run(() => client.browser.loadStartUrl()),
      refresh: () => run(() => client.browser.refreshTab()),
      clearCache: () => run(() => client.browser.clearCache()),
      clearWebStorage: () => run(() => client.browser.clearWebStorage()),
      clearCookies: () => run(() => client.browser.clearCookies()),
      focusTab: (index: number) => run(() => client.browser.focusTab(index)),
      closeTab: (index: number) => run(() => client.browser.closeTab(index)),
    }),
    [client, run],
  );

  return { ...actions, isPending: group.isPending, error: group.error, reset: group.reset };
}

/**
 * Media control over the REST interface.
 */
export interface UseMediaControlResult extends ActionGroupState {
  /**
   * Sets the volume of an audio stream.
   *
   * @param level - Volume between `0` and `100`.
   * @param stream - Target audio stream.
   */
  setVolume: (level: number, stream?: AudioStreamValue) => Promise<unknown>;
  /**
   * Plays a sound.
   *
   * @param url - Location of the sound file.
   * @param loop - Repeat until stopped.
   * @param stream - Target audio stream.
   */
  playSound: (url: string, loop?: boolean, stream?: AudioStreamValue) => Promise<unknown>;
  /** Stops the current sound. */
  stopSound: () => Promise<unknown>;
  /**
   * Plays a video full screen.
   *
   * @param url - Location of the video.
   */
  playVideo: (url: string) => Promise<unknown>;
  /** Stops video playback. */
  stopVideo: () => Promise<unknown>;
}

/**
 * Volume, sound and video control over the REST interface.
 *
 * @returns The media actions sharing one pending and error state.
 */
export function useMediaControl(): UseMediaControlResult {
  const client = useFullyKioskClient();
  const group = useActionGroup();
  const { run } = group;

  const actions = useMemo(
    () => ({
      setVolume: (level: number, stream?: AudioStreamValue) =>
        run(() => client.media.setVolume(level, stream)),
      playSound: (url: string, loop?: boolean, stream?: AudioStreamValue) =>
        run(() => client.media.playSound(url, loop, stream)),
      stopSound: () => run(() => client.media.stopSound()),
      playVideo: (url: string) => run(() => client.media.playVideo(url)),
      stopVideo: () => run(() => client.media.stopVideo()),
    }),
    [client, run],
  );

  return { ...actions, isPending: group.isPending, error: group.error, reset: group.reset };
}

/**
 * Text-to-speech control over the REST interface.
 */
export interface UseRemoteSpeechResult extends ActionGroupState {
  /**
   * Speaks a text on the device.
   *
   * @param text - The text to speak.
   * @param options - Locale, engine and queue behaviour.
   */
  say: (text: string, options?: SpeakOptions) => Promise<unknown>;
  /** Stops current and queued speech. */
  stop: () => Promise<unknown>;
}

/**
 * Text-to-speech over the REST interface.
 *
 * @returns The speech actions sharing one pending and error state.
 */
export function useRemoteSpeech(): UseRemoteSpeechResult {
  const client = useFullyKioskClient();
  const group = useActionGroup();
  const { run } = group;

  const actions = useMemo(
    () => ({
      say: (text: string, options?: SpeakOptions) => run(() => client.speech.say(text, options)),
      stop: () => run(() => client.speech.stop()),
    }),
    [client, run],
  );

  return { ...actions, isPending: group.isPending, error: group.error, reset: group.reset };
}
