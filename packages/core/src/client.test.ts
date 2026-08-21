import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FullyKioskClient } from './client.js';
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
