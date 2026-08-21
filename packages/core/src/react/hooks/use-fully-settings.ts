import { getFully } from '../../index.js';
import { useCallback } from 'react';
import { useFullyValue } from './use-fully-value.js';

/**
 * A Fully setting bound through the JavaScript interface.
 *
 * @typeParam T - `string` or `boolean`, matching the setting type.
 */
export interface UseFullyJsSettingResult<T> {
  /** The current value. */
  value: T;
  /**
   * Writes a new value. The change applies immediately on the device.
   *
   * @param next - The value to write.
   */
  setValue: (next: T) => void;
  /** Re-reads the value from the device. */
  refresh: () => T;
}

/**
 * Reads and writes a string Fully setting from inside the kiosk page.
 *
 * @param key - The setting key, e.g. `screenBrightness`.
 * @param interval - Re-read the value on this interval in milliseconds.
 * @returns The value and its setter.
 *
 * @example
 * ```tsx
 * const startUrl = useFullyStringSetting('startURL');
 * <input value={startUrl.value} onChange={(e) => startUrl.setValue(e.target.value)} />
 * ```
 */
export function useFullyStringSetting(
  key: string,
  interval?: number,
): UseFullyJsSettingResult<string> {
  const state = useFullyValue((fully) => fully.getStringSetting(key), '', {
    interval,
    deps: [key],
  });

  const setValue = useCallback(
    (next: string) => {
      getFully()?.setStringSetting(key, next);
      state.refresh();
    },
    [key, state],
  );

  return { value: state.value, setValue, refresh: state.refresh };
}

/**
 * Reads and writes a boolean Fully setting from inside the kiosk page.
 *
 * Fully returns booleans as strings through the JavaScript interface, so the
 * value is normalised to a real boolean here.
 *
 * @param key - The setting key, e.g. `motionDetection`.
 * @param interval - Re-read the value on this interval in milliseconds.
 * @returns The value and its setter.
 */
export function useFullyBooleanSetting(
  key: string,
  interval?: number,
): UseFullyJsSettingResult<boolean> {
  const state = useFullyValue((fully) => fully.getBooleanSetting(key) === 'true', false, {
    interval,
    deps: [key],
  });

  const setValue = useCallback(
    (next: boolean) => {
      getFully()?.setBooleanSetting(key, next);
      state.refresh();
    },
    [key, state],
  );

  return { value: state.value, setValue, refresh: state.refresh };
}
