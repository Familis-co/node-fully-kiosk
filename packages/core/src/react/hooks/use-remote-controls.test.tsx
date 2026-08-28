/**
 * @vitest-environment happy-dom
 */
import { AudioStream, type FetchLike } from '../../index.js';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commandOf, createClientHarness, paramsOf } from '../test-support.js';
import {
  useKioskControl,
  useMediaControl,
  useNavigation,
  useRemoteSpeech,
  useScreenControl,
} from './use-remote-controls.js';

afterEach(cleanup);

describe('useScreenControl', () => {
  it('maps each action to its Fully command', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useScreenControl(), { wrapper });

    await act(async () => {
      await result.current.turnOn();
      await result.current.turnOff();
      await result.current.forceSleep();
      await result.current.startScreensaver();
      await result.current.stopScreensaver();
    });

    expect(urls.map(commandOf)).toEqual([
      'screenOn',
      'screenOff',
      'forceSleep',
      'startScreensaver',
      'stopScreensaver',
    ]);
  });

  it('writes the brightness through the screenBrightness setting', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useScreenControl(), { wrapper });

    await act(async () => {
      await result.current.setBrightness(200);
    });

    const query = paramsOf(urls[0] ?? '');
    expect(query.get('cmd')).toBe('setStringSetting');
    expect(query.get('key')).toBe('screenBrightness');
    expect(query.get('value')).toBe('200');
  });

  it('captures a rejected brightness in the shared error state', async () => {
    const { wrapper } = createClientHarness();
    const { result } = renderHook(() => useScreenControl(), { wrapper });

    await act(async () => {
      await result.current.setBrightness(500);
    });

    expect(result.current.error).toBeInstanceOf(RangeError);
  });

  it('shares one pending state across the group', async () => {
    let settle: (response: Response) => void = () => undefined;
    const { wrapper } = createClientHarness(
      () => new Promise<Response>((resolve) => (settle = resolve)),
    );
    const { result } = renderHook(() => useScreenControl(), { wrapper });

    act(() => {
      void result.current.turnOn();
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      settle(new Response('{"status":"OK"}', { headers: { 'content-type': 'application/json' } }));
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(false);
  });

  it('clears a device failure through reset', async () => {
    const { wrapper } = createClientHarness(
      vi.fn<FetchLike>(() => Promise.reject(new Error('offline'))),
    );
    const { result } = renderHook(() => useScreenControl(), { wrapper });

    await act(async () => {
      await result.current.turnOn();
    });
    expect(result.current.error).not.toBeNull();

    act(() => result.current.reset());

    expect(result.current.error).toBeNull();
  });
});

describe('useKioskControl', () => {
  it('maps each action to its Fully command', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useKioskControl(), { wrapper });

    await act(async () => {
      await result.current.lock();
      await result.current.unlock();
      await result.current.enableLockedMode();
      await result.current.disableLockedMode();
      await result.current.restartApp();
    });

    expect(urls.map(commandOf)).toEqual([
      'lockKiosk',
      'unlockKiosk',
      'enableLockedMode',
      'disableLockedMode',
      'restartApp',
    ]);
  });

  it('clears the overlay by sending an empty message', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useKioskControl(), { wrapper });

    await act(async () => {
      await result.current.setOverlayMessage('Back in 5 minutes');
      await result.current.clearOverlayMessage();
    });

    expect(paramsOf(urls[0] ?? '').get('text')).toBe('Back in 5 minutes');
    expect(commandOf(urls[1] ?? '')).toBe('setOverlayMessage');
    expect(paramsOf(urls[1] ?? '').get('text')).toBe('');
  });
});

describe('useNavigation', () => {
  it('maps each action to its Fully command', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useNavigation(), { wrapper });

    await act(async () => {
      await result.current.loadStartUrl();
      await result.current.refresh();
      await result.current.clearCache();
      await result.current.clearWebStorage();
      await result.current.clearCookies();
    });

    expect(urls.map(commandOf)).toEqual([
      'loadStartUrl',
      'refreshTab',
      'clearCache',
      'clearWebstorage',
      'clearCookies',
    ]);
  });

  it('passes the URL and the tab targeting options through', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useNavigation(), { wrapper });

    await act(async () => {
      await result.current.loadUrl('https://example.test', { newTab: true, focus: true });
    });

    const query = paramsOf(urls[0] ?? '');
    expect(query.get('cmd')).toBe('loadUrl');
    expect(query.get('url')).toBe('https://example.test');
    expect(query.get('newtab')).toBe('true');
    expect(query.get('focus')).toBe('true');
  });

  it('targets tabs by index', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useNavigation(), { wrapper });

    await act(async () => {
      await result.current.focusTab(2);
      await result.current.closeTab(1);
    });

    expect(paramsOf(urls[0] ?? '').get('tab')).toBe('2');
    expect(paramsOf(urls[1] ?? '').get('tab')).toBe('1');
  });
});

describe('useMediaControl', () => {
  it('maps each action to its Fully command', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useMediaControl(), { wrapper });

    await act(async () => {
      await result.current.stopSound();
      await result.current.playVideo('https://example.test/clip.mp4');
      await result.current.stopVideo();
    });

    expect(urls.map(commandOf)).toEqual(['stopSound', 'playVideo', 'stopVideo']);
  });

  it('sends the volume and the target stream', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useMediaControl(), { wrapper });

    await act(async () => {
      await result.current.setVolume(70, AudioStream.Alarm);
    });

    const query = paramsOf(urls[0] ?? '');
    expect(query.get('cmd')).toBe('setAudioVolume');
    expect(query.get('level')).toBe('70');
    expect(query.get('stream')).toBe(String(AudioStream.Alarm));
  });

  it('captures a rejected volume in the shared error state', async () => {
    const { wrapper } = createClientHarness();
    const { result } = renderHook(() => useMediaControl(), { wrapper });

    await act(async () => {
      await result.current.setVolume(120);
    });

    expect(result.current.error).toBeInstanceOf(RangeError);
  });

  it('sends the sound URL with its loop and stream options', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useMediaControl(), { wrapper });

    await act(async () => {
      await result.current.playSound('https://example.test/ding.mp3', true, AudioStream.Ring);
    });

    const query = paramsOf(urls[0] ?? '');
    expect(query.get('cmd')).toBe('playSound');
    expect(query.get('url')).toBe('https://example.test/ding.mp3');
    expect(query.get('loop')).toBe('true');
    expect(query.get('stream')).toBe(String(AudioStream.Ring));
  });
});

describe('useRemoteSpeech', () => {
  it('speaks and stops through the REST interface', async () => {
    const { wrapper, urls } = createClientHarness();
    const { result } = renderHook(() => useRemoteSpeech(), { wrapper });

    await act(async () => {
      await result.current.say('Your order is ready', { locale: 'en_GB', queue: true });
      await result.current.stop();
    });

    const query = paramsOf(urls[0] ?? '');
    expect(query.get('cmd')).toBe('textToSpeech');
    expect(query.get('text')).toBe('Your order is ready');
    expect(query.get('locale')).toBe('en_GB');
    expect(query.get('queue')).toBe('1');
    expect(commandOf(urls[1] ?? '')).toBe('stopTextToSpeech');
  });

  it('captures a device failure without throwing at the call site', async () => {
    const { wrapper } = createClientHarness(
      vi.fn<FetchLike>(() => Promise.reject(new Error('offline'))),
    );
    const { result } = renderHook(() => useRemoteSpeech(), { wrapper });

    let returned: unknown = 'unset';
    await act(async () => {
      returned = await result.current.say('Hello');
    });

    expect(returned).toBeUndefined();
    expect(result.current.error?.message).toMatch(/Could not reach/);
  });
});
