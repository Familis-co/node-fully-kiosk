import { describe, expect, it, vi } from 'vitest';
import {
  FullyKioskAuthError,
  FullyKioskCommandError,
  FullyKioskConnectionError,
  FullyKioskHttpError,
  FullyKioskParseError,
  FullyKioskTimeoutError,
} from './errors.js';
import { FullyKioskTransport, redactUrl } from './http.js';
import type { FetchLike } from './types/options.js';

/**
 * Builds a `fetch` double that answers every call with the same response.
 *
 * @param body - Response body.
 * @param init - Status and headers of the response.
 * @returns A spy usable as the `fetch` option.
 */
function stubFetch(body: string, init: ResponseInit = {}): ReturnType<typeof vi.fn<FetchLike>> {
  return vi.fn<FetchLike>(() =>
    Promise.resolve(
      new Response(body, {
        status: 200,
        headers: { 'content-type': 'application/json' },
        ...init,
      }),
    ),
  );
}

describe('redactUrl', () => {
  it('masks the password and leaves the rest intact', () => {
    expect(redactUrl('http://d:2323/?cmd=screenOn&password=hunter2&type=json')).toBe(
      'http://d:2323/?cmd=screenOn&password=***&type=json',
    );
  });
});

describe('FullyKioskTransport URL building', () => {
  it('defaults to port 2323 and the cmd style', () => {
    const transport = new FullyKioskTransport({ host: '192.168.1.20', password: 'pw' });
    const url = new URL(transport.buildUrl('getDeviceInfo'));

    expect(url.origin).toBe('http://192.168.1.20:2323');
    expect(url.pathname).toBe('/');
    expect(url.searchParams.get('cmd')).toBe('getDeviceInfo');
    expect(url.searchParams.get('type')).toBe('json');
    expect(url.searchParams.get('password')).toBe('pw');
  });

  it('uses a path segment in the path style', () => {
    const transport = new FullyKioskTransport({
      host: '192.168.1.20',
      password: 'pw',
      requestStyle: 'path',
    });
    const url = new URL(transport.buildUrl('getDeviceInfo'));

    expect(url.pathname).toBe('/getDeviceInfo');
    expect(url.searchParams.get('cmd')).toBeNull();
  });

  it('keeps a scheme and port carried by the host', () => {
    const transport = new FullyKioskTransport({ host: 'https://kiosk.local:8443', password: 'pw' });
    expect(transport.baseUrl.origin).toBe('https://kiosk.local:8443');
  });

  it('encodes parameters and drops empty ones', () => {
    const transport = new FullyKioskTransport({ host: 'h', password: 'pw' });
    const url = new URL(
      transport.buildUrl('loadUrl', { url: 'https://a.test/?x=1&y=2', tab: undefined }),
    );

    expect(url.searchParams.get('url')).toBe('https://a.test/?x=1&y=2');
    expect(url.searchParams.has('tab')).toBe(false);
    expect(url.toString()).toContain('url=https%3A%2F%2Fa.test%2F%3Fx%3D1%26y%3D2');
  });
});

describe('FullyKioskTransport responses', () => {
  it('decodes a JSON payload', async () => {
    const fetchImpl = stubFetch('{"deviceID":"abc","batteryLevel":72}');
    const transport = new FullyKioskTransport({ host: 'h', password: 'pw', fetch: fetchImpl });

    await expect(transport.json('getDeviceInfo')).resolves.toEqual({
      deviceID: 'abc',
      batteryLevel: 72,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('raises a command error when the device reports one', async () => {
    const fetchImpl = stubFetch('{"status":"Error","statustext":"Unknown command"}');
    const transport = new FullyKioskTransport({ host: 'h', password: 'pw', fetch: fetchImpl });

    await expect(transport.json('nope')).rejects.toBeInstanceOf(FullyKioskCommandError);
  });

  it('treats the HTML login page as an authentication failure', async () => {
    const fetchImpl = stubFetch('<html><body>Login</body></html>', {
      headers: { 'content-type': 'text/html' },
    });
    const transport = new FullyKioskTransport({ host: 'h', password: 'wrong', fetch: fetchImpl });

    await expect(transport.json('getDeviceInfo')).rejects.toBeInstanceOf(FullyKioskAuthError);
  });

  it('maps a password related error text to an authentication failure', async () => {
    const fetchImpl = stubFetch('{"status":"Error","statustext":"Wrong password"}');
    const transport = new FullyKioskTransport({ host: 'h', password: 'wrong', fetch: fetchImpl });

    await expect(transport.json('screenOn')).rejects.toBeInstanceOf(FullyKioskAuthError);
  });

  it('raises a parse error for a body that is not JSON', async () => {
    const fetchImpl = stubFetch('not json at all');
    const transport = new FullyKioskTransport({ host: 'h', password: 'pw', fetch: fetchImpl });

    await expect(transport.json('screenOn')).rejects.toBeInstanceOf(FullyKioskParseError);
  });

  it('returns bytes and the content type for binary commands', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const fetchImpl = vi.fn<FetchLike>(() =>
      Promise.resolve(new Response(png, { headers: { 'content-type': 'image/png' } })),
    );
    const transport = new FullyKioskTransport({ host: 'h', password: 'pw', fetch: fetchImpl });

    const result = await transport.binary('getScreenshot');
    expect(result.contentType).toBe('image/png');
    expect(Array.from(result.data)).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});

describe('FullyKioskTransport failure handling', () => {
  it('retries a 5xx response and succeeds on a later attempt', async () => {
    let call = 0;
    const fetchImpl = vi.fn<FetchLike>(() => {
      call += 1;
      return Promise.resolve(
        call < 3
          ? new Response('boom', { status: 503 })
          : new Response('{"status":"OK"}', { headers: { 'content-type': 'application/json' } }),
      );
    });

    const transport = new FullyKioskTransport({
      host: 'h',
      password: 'pw',
      fetch: fetchImpl,
      retryDelay: 1,
    });

    await expect(transport.json('screenOn')).resolves.toEqual({ status: 'OK' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('gives up on a 4xx response without retrying', async () => {
    const fetchImpl = stubFetch('nope', { status: 404 });
    const transport = new FullyKioskTransport({
      host: 'h',
      password: 'pw',
      fetch: fetchImpl,
      retryDelay: 1,
    });

    await expect(transport.json('screenOn')).rejects.toBeInstanceOf(FullyKioskHttpError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('maps a 401 to an authentication failure', async () => {
    const fetchImpl = stubFetch('', { status: 401 });
    const transport = new FullyKioskTransport({ host: 'h', password: 'pw', fetch: fetchImpl });

    await expect(transport.json('screenOn')).rejects.toBeInstanceOf(FullyKioskAuthError);
  });

  it('wraps a transport failure and retries it', async () => {
    const fetchImpl = vi.fn<FetchLike>(() => Promise.reject(new Error('ECONNREFUSED')));
    const transport = new FullyKioskTransport({
      host: 'h',
      password: 'pw',
      fetch: fetchImpl,
      retries: 1,
      retryDelay: 1,
    });

    await expect(transport.json('screenOn')).rejects.toBeInstanceOf(FullyKioskConnectionError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('times out a request that never settles', async () => {
    const fetchImpl = vi.fn<FetchLike>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const transport = new FullyKioskTransport({
      host: 'h',
      password: 'pw',
      fetch: fetchImpl,
      timeout: 10,
      retries: 0,
    });

    await expect(transport.json('screenOn')).rejects.toBeInstanceOf(FullyKioskTimeoutError);
  });

  it('reports each attempt through the onRequest hook with the password hidden', async () => {
    const seen: string[] = [];
    const fetchImpl = stubFetch('{"status":"OK"}');
    const transport = new FullyKioskTransport({
      host: 'h',
      password: 'secret',
      fetch: fetchImpl,
      onRequest: ({ url }) => seen.push(url),
    });

    await transport.json('screenOn');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('password=***');
    expect(seen[0]).not.toContain('secret');
  });
});
