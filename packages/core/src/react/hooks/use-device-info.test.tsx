/**
 * @vitest-environment happy-dom
 */
import { FullyKioskClient, type FetchLike } from '../../index.js';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FullyKioskProvider } from '../context.js';
import { useDeviceInfo, useDeviceReachable } from './use-device-info.js';

/**
 * Builds a provider wrapper around a client with a stubbed transport.
 *
 * @param fetchImpl - The `fetch` double answering the requests.
 * @returns A wrapper component for `renderHook`.
 */
function wrapperFor(fetchImpl: FetchLike) {
  const client = new FullyKioskClient({
    host: '10.0.0.5',
    password: 'pw',
    retries: 0,
    fetch: fetchImpl,
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <FullyKioskProvider client={client}>{children}</FullyKioskProvider>;
  };
}

afterEach(cleanup);

describe('useDeviceInfo', () => {
  it('reads the device information through the client', async () => {
    const wrapper = wrapperFor(() =>
      Promise.resolve(
        new Response('{"deviceName":"Lobby tablet","batteryLevel":91}', {
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    const { result } = renderHook(() => useDeviceInfo(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.deviceName).toBe('Lobby tablet');
    expect(result.current.data?.batteryLevel).toBe(91);
  });

  it('surfaces a rejected password as an error', async () => {
    const wrapper = wrapperFor(() =>
      Promise.resolve(
        new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
      ),
    );

    const { result } = renderHook(() => useDeviceInfo(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toMatch(/Authentication failed/);
  });
});

describe('useDeviceReachable', () => {
  it('reports false when the device does not answer', async () => {
    const wrapper = wrapperFor(vi.fn<FetchLike>(() => Promise.reject(new Error('offline'))));

    const { result } = renderHook(() => useDeviceReachable(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBe(false);
  });
});
