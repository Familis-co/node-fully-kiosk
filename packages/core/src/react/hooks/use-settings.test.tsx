/**
 * @vitest-environment happy-dom
 */
import type { FetchLike } from '../../index.js';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commandOf, createClientHarness, paramsOf } from '../test-support.js';
import { useSetting, useSettings } from './use-settings.js';

afterEach(cleanup);

/**
 * Answers `listSettings` from a mutable map and every write with `OK`.
 *
 * @param settings - The settings the device starts with. Mutated by writes so a
 * re-read after a write observes the new value.
 * @returns A `fetch` double.
 */
function settingsDevice(settings: Record<string, unknown>): FetchLike {
  return (url) => {
    const query = paramsOf(url);
    const command = query.get('cmd');

    if (command === 'listSettings') {
      return Promise.resolve(
        new Response(JSON.stringify(settings), {
          headers: { 'content-type': 'application/json' },
        }),
      );
    }

    if (command === 'setStringSetting' || command === 'setBooleanSetting') {
      const key = query.get('key') ?? '';
      const raw = query.get('value') ?? '';
      settings[key] = command === 'setBooleanSetting' ? raw === 'true' : raw;
    }

    return Promise.resolve(
      new Response('{"status":"OK"}', { headers: { 'content-type': 'application/json' } }),
    );
  };
}

describe('useSettings', () => {
  it('reads the whole settings map through listSettings', async () => {
    const { wrapper, urls } = createClientHarness(
      settingsDevice({ startURL: 'https://example.test', motionDetection: true }),
    );

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(commandOf(urls[0] ?? '')).toBe('listSettings');
    expect(result.current.data?.startURL).toBe('https://example.test');
    expect(result.current.data?.motionDetection).toBe(true);
  });

  it('surfaces a rejected password as an error', async () => {
    const { wrapper } = createClientHarness(() =>
      Promise.resolve(
        new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
      ),
    );

    const { result } = renderHook(() => useSettings(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toMatch(/Authentication failed/);
  });

  it('does not read while disabled', () => {
    const { wrapper, urls } = createClientHarness(settingsDevice({}));

    renderHook(() => useSettings({ enabled: false }), { wrapper });

    expect(urls).toEqual([]);
  });
});

describe('useSetting', () => {
  it('picks a single key out of the settings map', async () => {
    const { wrapper } = createClientHarness(settingsDevice({ screenBrightness: '128' }));

    const { result } = renderHook(() => useSetting('screenBrightness'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toBe('128');
  });

  it('is undefined for a key the device does not report', async () => {
    const { wrapper } = createClientHarness(settingsDevice({ screenBrightness: '128' }));

    const { result } = renderHook(() => useSetting('startURL'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.value).toBeUndefined();
  });

  it('writes a string through setStringSetting and re-reads the value', async () => {
    const { wrapper, urls } = createClientHarness(settingsDevice({ screenBrightness: '128' }));

    const { result } = renderHook(() => useSetting('screenBrightness'), { wrapper });
    await waitFor(() => expect(result.current.value).toBe('128'));

    await act(async () => {
      await result.current.setValue('200');
    });

    const write = urls.map(paramsOf).find((query) => query.get('cmd') === 'setStringSetting');
    expect(write?.get('key')).toBe('screenBrightness');
    expect(write?.get('value')).toBe('200');
    await waitFor(() => expect(result.current.value).toBe('200'));
  });

  it('sends a number through setStringSetting, as Fully expects', async () => {
    const { wrapper, urls } = createClientHarness(settingsDevice({ screenBrightness: '128' }));

    const { result } = renderHook(() => useSetting('screenBrightness'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setValue(200);
    });

    const write = urls.map(paramsOf).find((query) => query.get('cmd') === 'setStringSetting');
    expect(write?.get('value')).toBe('200');
  });

  it('routes a boolean through setBooleanSetting instead', async () => {
    const { wrapper, urls } = createClientHarness(settingsDevice({ motionDetection: false }));

    const { result } = renderHook(() => useSetting('motionDetection'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setValue(true);
    });

    const write = urls.map(paramsOf).find((query) => query.get('cmd') === 'setBooleanSetting');
    expect(write?.get('key')).toBe('motionDetection');
    expect(write?.get('value')).toBe('true');
    await waitFor(() => expect(result.current.value).toBe(true));
  });

  it('keeps a failed write in its own error, apart from the read error', async () => {
    const failing = vi.fn<FetchLike>((url) => {
      if (commandOf(url) === 'listSettings') {
        return Promise.resolve(
          new Response('{"screenBrightness":"128"}', {
            headers: { 'content-type': 'application/json' },
          }),
        );
      }
      return Promise.reject(new Error('device offline'));
    });
    const { wrapper } = createClientHarness(failing);

    const { result } = renderHook(() => useSetting('screenBrightness'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setValue('200');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.readError).toBeNull();
    expect(result.current.isPending).toBe(false);
  });
});
