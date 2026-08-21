import type { FullyKioskDeviceInfo } from '../../index.js';
import { useFullyKioskClient } from '../context.js';
import {
  useFullyQuery,
  type UseFullyQueryOptions,
  type UseFullyQueryResult,
} from './use-fully-query.js';

/**
 * Reads the device information over the Remote Admin REST interface.
 *
 * @param options - Enablement, polling interval and callbacks.
 * @returns The device information plus query state.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDeviceInfo({ refetchInterval: 10_000 });
 * if (isLoading) return <Spinner />;
 * return <p>Battery: {data?.batteryLevel}%</p>;
 * ```
 */
export function useDeviceInfo(
  options?: UseFullyQueryOptions<FullyKioskDeviceInfo>,
): UseFullyQueryResult<FullyKioskDeviceInfo> {
  const client = useFullyKioskClient();
  return useFullyQuery((signal) => client.device.info({ signal }), {
    ...options,
    deps: [client, ...(options?.deps ?? [])],
  });
}

/**
 * Checks whether the device answers and the password is accepted.
 *
 * @param options - Enablement, polling interval and callbacks.
 * @returns `true`/`false` in `data`, plus query state.
 *
 * @example
 * ```tsx
 * const { data: online } = useDeviceReachable({ refetchInterval: 30_000 });
 * ```
 */
export function useDeviceReachable(
  options?: UseFullyQueryOptions<boolean>,
): UseFullyQueryResult<boolean> {
  const client = useFullyKioskClient();
  return useFullyQuery((signal) => client.ping({ signal }), {
    ...options,
    deps: [client, ...(options?.deps ?? [])],
  });
}
