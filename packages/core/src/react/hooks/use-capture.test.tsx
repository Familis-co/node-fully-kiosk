/**
 * @vitest-environment happy-dom
 */
import type { FetchLike } from '../../index.js';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { commandOf, createClientHarness } from '../test-support.js';
import { useCamshot, useScreenshot } from './use-capture.js';

afterEach(cleanup);

/**
 * Answers every capture command with the given bytes and MIME type.
 *
 * @param contentType - The MIME type the device reports.
 * @param bytes - The image payload.
 * @returns A `fetch` double.
 */
function captureDevice(contentType: string, bytes = new Uint8Array([1, 2, 3])): FetchLike {
  return () => Promise.resolve(new Response(bytes, { headers: { 'content-type': contentType } }));
}

describe('useScreenshot', () => {
  it('requests getScreenshot and exposes it as a data URL', async () => {
    const { wrapper, urls } = createClientHarness(captureDevice('image/png'));

    const { result } = renderHook(() => useScreenshot(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(commandOf(urls[0] ?? '')).toBe('getScreenshot');
    expect(result.current.data).toBe('data:image/png;base64,AQID');
  });

  it('carries the MIME type the device reported into the data URL', async () => {
    const { wrapper } = createClientHarness(captureDevice('image/jpeg'));

    const { result } = renderHook(() => useScreenshot(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('surfaces the login page as an authentication error', async () => {
    const { wrapper } = createClientHarness(() =>
      Promise.resolve(
        new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
      ),
    );

    const { result } = renderHook(() => useScreenshot(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toMatch(/Authentication failed/);
  });

  it('does not capture while disabled', () => {
    const { wrapper, urls } = createClientHarness(captureDevice('image/png'));

    renderHook(() => useScreenshot({ enabled: false }), { wrapper });

    expect(urls).toEqual([]);
  });
});

describe('useCamshot', () => {
  it('requests getCamshot and exposes it as a data URL', async () => {
    const { wrapper, urls } = createClientHarness(captureDevice('image/jpeg'));

    const { result } = renderHook(() => useCamshot(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(commandOf(urls[0] ?? '')).toBe('getCamshot');
    expect(result.current.data).toBe('data:image/jpeg;base64,AQID');
  });
});
