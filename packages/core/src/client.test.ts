import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFullyKioskClient, FullyKioskClient } from './client.js';
import type { FetchLike } from './types/options.js';

/**
 * Records the URLs a client requests while answering everything with `OK`.
 */
function createClient(): { client: FullyKioskClient; urls: string[] } {
  const urls: string[] = [];
  const fetchImpl: FetchLike = (url) => {
    urls.push(url);
    return Promise.resolve(
      new Response('{"status":"OK"}', { headers: { 'content-type': 'application/json' } }),
    );
  };

  return {
    client: new FullyKioskClient({ host: '10.0.0.5', password: 'pw', fetch: fetchImpl }),
    urls,
  };
}

/**
 * Reads the query parameters of the request a command produced.
 *
 * @param url - The recorded request URL, or `undefined` when nothing was sent.
 * @returns The parsed query parameters.
 */
function params(url: string | undefined): URLSearchParams {
  if (!url) throw new Error('expected the command to send a request');
  return new URL(url).searchParams;
}

describe('FullyKioskClient', () => {
  let client: FullyKioskClient;
  let urls: string[];

  beforeEach(() => {
    ({ client, urls } = createClient());
  });

  it('exposes the normalised base URL', () => {
    expect(client.baseUrl).toBe('http://10.0.0.5:2323/');
  });

  it('maps screen commands to their Fully command names', async () => {
    await client.screen.on();
    await client.screen.off();

    expect(params(urls[0]).get('cmd')).toBe('screenOn');
    expect(params(urls[1]).get('cmd')).toBe('screenOff');
  });

  it('writes brightness through the screenBrightness setting', async () => {
    await client.screen.setBrightness(128);

    const query = params(urls[0]);
    expect(query.get('cmd')).toBe('setStringSetting');
    expect(query.get('key')).toBe('screenBrightness');
    expect(query.get('value')).toBe('128');
  });

  it('rejects a brightness outside the supported range', () => {
    expect(() => client.screen.setBrightness(500)).toThrow(RangeError);
  });

  it('rejects a volume outside the supported range', () => {
    expect(() => client.media.setVolume(120)).toThrow(RangeError);
  });

  it('passes tab targeting options to loadUrl', async () => {
    await client.browser.loadUrl('https://example.test', { newTab: true, focus: true });

    const query = params(urls[0]);
    expect(query.get('cmd')).toBe('loadUrl');
    expect(query.get('url')).toBe('https://example.test');
    expect(query.get('newtab')).toBe('true');
    expect(query.get('focus')).toBe('true');
  });

  it('encodes text to speech options, converting queue to 0/1', async () => {
    await client.speech.say('Hello there', { locale: 'en_GB', queue: true });

    const query = params(urls[0]);
    expect(query.get('cmd')).toBe('textToSpeech');
    expect(query.get('text')).toBe('Hello there');
    expect(query.get('locale')).toBe('en_GB');
    expect(query.get('queue')).toBe('1');
  });

  it('defaults playVideo to closing the player when playback ends', async () => {
    await client.media.playVideo('https://example.test/clip.mp4');

    const query = params(urls[0]);
    expect(query.get('exitOnCompletion')).toBe('1');
    expect(query.get('loop')).toBe('0');
  });

  it('toggles motion detection through the motionDetection setting', async () => {
    await client.motion.enable();
    await client.motion.disable();

    expect(params(urls[0]).get('value')).toBe('true');
    expect(params(urls[1]).get('value')).toBe('false');
    expect(params(urls[0]).get('key')).toBe('motionDetection');
  });

  it('sends any command through the escape hatch', async () => {
    await client.command('somethingBrandNew', { foo: 'bar' });

    const query = params(urls[0]);
    expect(query.get('cmd')).toBe('somethingBrandNew');
    expect(query.get('foo')).toBe('bar');
  });

  it('reports an unreachable device as not pingable', async () => {
    const failing = new FullyKioskClient({
      host: 'h',
      password: 'pw',
      retries: 0,
      fetch: vi.fn<FetchLike>(() => Promise.reject(new Error('down'))),
    });

    await expect(failing.ping()).resolves.toBe(false);
  });
});

describe('FullyKioskClient escape hatches', () => {
  it('returns the raw bytes and MIME type for a binary command', async () => {
    const binaryClient = new FullyKioskClient({
      host: '10.0.0.5',
      password: 'pw',
      fetch: () =>
        Promise.resolve(
          new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } }),
        ),
    });

    const response = await binaryClient.commandBinary('getScreenshot', { format: 'png' });

    expect(response.contentType).toBe('image/png');
    expect(Array.from(response.data)).toEqual([1, 2, 3]);
  });

  it('reports a device that answers as pingable', async () => {
    const { client: reachable } = createClient();

    await expect(reachable.ping()).resolves.toBe(true);
  });

  it('does not retry the ping by default', async () => {
    const fetchImpl = vi.fn<FetchLike>(() => Promise.reject(new Error('down')));
    const failing = new FullyKioskClient({ host: 'h', password: 'pw', fetch: fetchImpl });

    await expect(failing.ping()).resolves.toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('builds the same client through the factory', () => {
    const built = createFullyKioskClient({
      host: '10.0.0.5',
      password: 'pw',
      fetch: () =>
        Promise.resolve(
          new Response('{"status":"OK"}', { headers: { 'content-type': 'application/json' } }),
        ),
    });

    expect(built).toBeInstanceOf(FullyKioskClient);
    expect(built.baseUrl).toBe('http://10.0.0.5:2323/');
  });
});

describe('SettingsCommands.get', () => {
  it('picks one key out of the settings map', async () => {
    const settingsClient = new FullyKioskClient({
      host: '10.0.0.5',
      password: 'pw',
      fetch: () =>
        Promise.resolve(
          new Response('{"screenBrightness":"128","motionDetection":true}', {
            headers: { 'content-type': 'application/json' },
          }),
        ),
    });

    await expect(settingsClient.settings.get('screenBrightness')).resolves.toBe('128');
    await expect(settingsClient.settings.get('motionDetection')).resolves.toBe(true);
  });

  it('is undefined for a key the device does not report', async () => {
    const settingsClient = new FullyKioskClient({
      host: '10.0.0.5',
      password: 'pw',
      fetch: () =>
        Promise.resolve(new Response('{}', { headers: { 'content-type': 'application/json' } })),
    });

    await expect(settingsClient.settings.get('startURL')).resolves.toBeUndefined();
  });
});

describe('optional command parameters', () => {
  let client: FullyKioskClient;
  let urls: string[];

  beforeEach(() => {
    ({ client, urls } = createClient());
  });

  it('omits the speech options that were not given', async () => {
    await client.speech.say('Hello');

    const query = params(urls[0]);
    expect(query.get('text')).toBe('Hello');
    expect(query.get('locale')).toBeNull();
    expect(query.get('engine')).toBeNull();
    expect(query.get('queue')).toBeNull();
  });

  it('sends queue=0 when queueing was explicitly declined', async () => {
    await client.speech.say('Hello', { queue: false });

    expect(params(urls[0]).get('queue')).toBe('0');
  });

  it('encodes every playVideo option as 0 or 1', async () => {
    await client.media.playVideo('https://example.test/clip.mp4', {
      loop: true,
      showControls: true,
      exitOnTouch: true,
      exitOnCompletion: false,
    });

    const query = params(urls[0]);
    expect(query.get('loop')).toBe('1');
    expect(query.get('showControls')).toBe('1');
    expect(query.get('exitOnTouch')).toBe('1');
    expect(query.get('exitOnCompletion')).toBe('0');
  });
});
