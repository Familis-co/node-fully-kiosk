import { toDataUrl } from '../../index.js';
import { useFullyKioskClient } from '../context.js';
import {
  useFullyQuery,
  type UseFullyQueryOptions,
  type UseFullyQueryResult,
} from './use-fully-query.js';

/**
 * Captures the device screen over the REST interface and exposes it as a
 * `data:` URL ready for an `<img>` tag.
 *
 * Video playback and other apps are not captured; those areas come back black.
 *
 * @param options - Enablement, refresh interval and callbacks.
 * @returns The `data:` URL plus query state.
 *
 * @example
 * ```tsx
 * const shot = useScreenshot({ refetchInterval: 5_000 });
 * return shot.data ? <img src={shot.data} alt="Kiosk screen" /> : null;
 * ```
 */
export function useScreenshot(options?: UseFullyQueryOptions<string>): UseFullyQueryResult<string> {
  const client = useFullyKioskClient();
  return useFullyQuery(async (signal) => toDataUrl(await client.capture.screenshot({ signal })), {
    ...options,
    deps: [client, ...(options?.deps ?? [])],
  });
}

/**
 * Captures a still from the front camera over the REST interface. Requires
 * motion detection to be enabled so the camera is active.
 *
 * @param options - Enablement, refresh interval and callbacks.
 * @returns The `data:` URL plus query state.
 */
export function useCamshot(options?: UseFullyQueryOptions<string>): UseFullyQueryResult<string> {
  const client = useFullyKioskClient();
  return useFullyQuery(async (signal) => toDataUrl(await client.capture.camshot({ signal })), {
    ...options,
    deps: [client, ...(options?.deps ?? [])],
  });
}
