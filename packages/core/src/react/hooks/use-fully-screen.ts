import { getFully } from '../../index.js';
import { useCallback, useEffect, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';
import { useFullyValue } from './use-fully-value.js';

/**
 * Screen state and control through the JavaScript interface.
 */
export interface UseFullyScreenResult {
  /** Whether the screen is on, kept current by the `screenOn` and `screenOff` events. */
  isOn: boolean;
  /** Turns the screen on. */
  turnOn: () => void;
  /**
   * Turns the screen off.
   *
   * @param keepAlive - Keep the app running while the screen is off.
   */
  turnOff: (keepAlive?: boolean) => void;
  /** Puts the device to sleep immediately. */
  forceSleep: () => void;
}

/**
 * Tracks and controls the screen through the JavaScript interface.
 *
 * The state is seeded from `fully.getScreenOn()` and then updated by the
 * `screenOn` and `screenOff` events, so it stays correct even when something
 * other than this page turns the screen on.
 *
 * @returns The screen state and its controls.
 *
 * @example
 * ```tsx
 * const screen = useFullyScreen();
 * <button onClick={() => screen.turnOff()}>{screen.isOn ? 'Sleep' : 'Asleep'}</button>
 * ```
 */
export function useFullyScreen(): UseFullyScreenResult {
  const initial = useFullyValue((fully) => fully.getScreenOn(), false);
  const [isOn, setIsOn] = useState(false);

  useEffect(() => setIsOn(initial.value), [initial.value]);
  useFullyEvent('screenOn', () => setIsOn(true));
  useFullyEvent('screenOff', () => setIsOn(false));

  const turnOn = useCallback(() => getFully()?.turnScreenOn(), []);
  const turnOff = useCallback((keepAlive?: boolean) => getFully()?.turnScreenOff(keepAlive), []);
  const forceSleep = useCallback(() => getFully()?.forceSleep(), []);

  return { isOn, turnOn, turnOff, forceSleep };
}

/**
 * Screen brightness state and control.
 */
export interface UseFullyBrightnessResult {
  /** Current brightness, 0-255. */
  brightness: number;
  /**
   * Sets the brightness.
   *
   * @param level - Brightness 0-255, or `-1` for the system default.
   */
  setBrightness: (level: number) => void;
  /** Re-reads the brightness from the device. */
  refresh: () => number;
}

/**
 * Reads and sets the screen brightness through the JavaScript interface.
 *
 * @param interval - Re-read the brightness on this interval in milliseconds.
 * @returns The brightness and its setter.
 */
export function useFullyBrightness(interval?: number): UseFullyBrightnessResult {
  const value = useFullyValue((fully) => fully.getScreenBrightness(), 0, { interval });

  const setBrightness = useCallback(
    (level: number) => {
      getFully()?.setScreenBrightness(level);
      value.refresh();
    },
    [value],
  );

  return { brightness: value.value, setBrightness, refresh: value.refresh };
}

/**
 * Screensaver and daydream state and control.
 */
export interface UseFullyScreensaverResult {
  /** Whether the Fully screensaver is showing. */
  isActive: boolean;
  /** Whether the Android daydream is showing. */
  isDaydreaming: boolean;
  /** Starts the Fully screensaver. */
  start: () => void;
  /** Stops the Fully screensaver. */
  stop: () => void;
  /** Starts the Android daydream. */
  startDaydream: () => void;
  /** Stops the Android daydream. */
  stopDaydream: () => void;
}

/**
 * Tracks and controls the screensaver and the Android daydream.
 *
 * @returns The screensaver state and its controls.
 */
export function useFullyScreensaver(): UseFullyScreensaverResult {
  const [isActive, setIsActive] = useState(false);
  const [isDaydreaming, setIsDaydreaming] = useState(false);

  useFullyEvent('onScreensaverStart', () => setIsActive(true));
  useFullyEvent('onScreensaverStop', () => setIsActive(false));
  useFullyEvent('onDaydreamStart', () => setIsDaydreaming(true));
  useFullyEvent('onDaydreamStop', () => setIsDaydreaming(false));

  return {
    isActive,
    isDaydreaming,
    start: useCallback(() => getFully()?.startScreensaver(), []),
    stop: useCallback(() => getFully()?.stopScreensaver(), []),
    startDaydream: useCallback(() => getFully()?.startDaydream(), []),
    stopDaydream: useCallback(() => getFully()?.stopDaydream(), []),
  };
}

/**
 * Soft keyboard state and control.
 */
export interface UseFullyKeyboardResult {
  /** Whether the soft keyboard is visible. */
  isVisible: boolean;
  /** Shows the soft keyboard. */
  show: () => void;
  /** Hides the soft keyboard. */
  hide: () => void;
}

/**
 * Tracks and controls the Android soft keyboard.
 *
 * @returns The keyboard state and its controls.
 */
export function useFullyKeyboard(): UseFullyKeyboardResult {
  const initial = useFullyValue((fully) => fully.isKeyboardVisible(), false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => setIsVisible(initial.value), [initial.value]);
  useFullyEvent('showKeyboard', () => setIsVisible(true));
  useFullyEvent('hideKeyboard', () => setIsVisible(false));

  return {
    isVisible,
    show: useCallback(() => getFully()?.showKeyboard(), []),
    hide: useCallback(() => getFully()?.hideKeyboard(), []),
  };
}
