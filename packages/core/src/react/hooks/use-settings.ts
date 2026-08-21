import type {
  FullyKioskBooleanSettingKey,
  FullyKioskSettings,
  FullyKioskStringSettingKey,
} from '../../index.js';
import { useCallback } from 'react';
import { useFullyKioskClient } from '../context.js';
import { useActionGroup, type ActionGroupState } from './use-action-group.js';
import {
  useFullyQuery,
  type UseFullyQueryOptions,
  type UseFullyQueryResult,
} from './use-fully-query.js';

/**
 * Reads every Fully setting over the REST interface.
 *
 * @param options - Enablement, polling interval and callbacks.
 * @returns The settings map plus query state.
 */
export function useSettings(
  options?: UseFullyQueryOptions<FullyKioskSettings>,
): UseFullyQueryResult<FullyKioskSettings> {
  const client = useFullyKioskClient();
  return useFullyQuery((signal) => client.settings.list({ signal }), {
    ...options,
    deps: [client, ...(options?.deps ?? [])],
  });
}

/**
 * Result of {@link useSetting}.
 */
export interface UseSettingResult extends ActionGroupState {
  /** The current value, or `undefined` before the first read. */
  value: string | number | boolean | null | undefined;
  /** `true` until the first read settles. */
  isLoading: boolean;
  /** The error of the most recent read. */
  readError: Error | null;
  /** Re-reads the value from the device. */
  refetch: () => Promise<unknown>;
  /**
   * Writes a new value and re-reads it.
   *
   * @param next - The value to write. Booleans use `setBooleanSetting`,
   * everything else uses `setStringSetting`.
   */
  setValue: (next: string | number | boolean) => Promise<void>;
}

/**
 * Reads and writes a single Fully setting.
 *
 * Fully has no command for reading one key, so the whole settings map is
 * fetched behind the scenes. Use {@link useSettings} when you need several.
 *
 * @param key - The setting key to bind to.
 * @param options - Enablement and polling interval for the read.
 * @returns The value, a setter and the combined state.
 *
 * @example
 * ```tsx
 * const brightness = useSetting('screenBrightness');
 * <input value={String(brightness.value ?? '')} onChange={(e) => brightness.setValue(e.target.value)} />
 * ```
 */
export function useSetting(
  key: FullyKioskStringSettingKey | FullyKioskBooleanSettingKey,
  options?: UseFullyQueryOptions<FullyKioskSettings>,
): UseSettingResult {
  const client = useFullyKioskClient();
  const settings = useSettings(options);
  const group = useActionGroup();

  const setValue = useCallback(
    async (next: string | number | boolean): Promise<void> => {
      await group.run(async () => {
        if (typeof next === 'boolean') {
          await client.settings.setBoolean(key, next);
        } else {
          await client.settings.setString(key, next);
        }
        await settings.refetch();
      });
    },
    [client, key, group, settings],
  );

  return {
    value: settings.data?.[key],
    isLoading: settings.isLoading,
    readError: settings.error,
    refetch: settings.refetch,
    setValue,
    isPending: group.isPending,
    error: group.error,
    reset: group.reset,
  };
}
