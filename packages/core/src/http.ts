import {
  FullyKioskAuthError,
  FullyKioskCommandError,
  FullyKioskConnectionError,
  FullyKioskHttpError,
  FullyKioskParseError,
  FullyKioskTimeoutError,
} from './errors.js';
import type {
  FetchLike,
  FullyKioskClientOptions,
  FullyKioskParams,
  FullyKioskRequestOptions,
  FullyKioskRequestStyle,
} from './types/options.js';
import type { FullyKioskBinaryResponse, FullyKioskStatusResponse } from './types/responses.js';

/** Default Remote Admin port of Fully Kiosk Browser. */
export const DEFAULT_PORT = 2323;

/** Default per-request timeout in milliseconds. */
export const DEFAULT_TIMEOUT = 10_000;

/** Default number of retries after a failed attempt. */
export const DEFAULT_RETRIES = 2;

/** Default base delay between retries in milliseconds. */
export const DEFAULT_RETRY_DELAY = 300;

/**
 * Turns the `host`, `port` and `protocol` options into a normalised origin.
 *
 * @param options - The client options holding the address of the device.
 * @returns The base URL of the Remote Admin interface, without a trailing path.
 */
function resolveBaseUrl(options: FullyKioskClientOptions): URL {
  const host = options.host.trim();
  if (!host) {
    throw new TypeError('`host` is required and must not be empty');
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(host);
  const url = new URL(hasScheme ? host : `${options.protocol ?? 'http'}://${host}`);

  if (options.port !== undefined) {
    url.port = String(options.port);
  } else if (!url.port) {
    url.port = String(DEFAULT_PORT);
  }

  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}

/**
 * Replaces the password in a URL so it can safely be logged.
 *
 * @param url - The URL to sanitise.
 * @returns The same URL with the `password` query parameter masked.
 */
export function redactUrl(url: string): string {
  return url.replace(/([?&]password=)[^&]*/i, '$1***');
}

/**
 * Waits for the given number of milliseconds.
 *
 * @param ms - How long to wait.
 * @returns A promise resolving once the delay has elapsed.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decides whether a failed attempt is worth repeating. Only transient faults
 * qualify: an authentication or command error will fail identically on a retry.
 *
 * @param error - The error thrown by the attempt.
 * @returns `true` when the request should be retried.
 */
function isRetryable(error: unknown): boolean {
  if (error instanceof FullyKioskConnectionError) return true;
  if (error instanceof FullyKioskHttpError) return error.status >= 500;
  return false;
}

/**
 * Low level HTTP transport for the Fully Kiosk Remote Admin interface.
 *
 * It owns URL construction, authentication, timeouts, retries and response
 * decoding. {@link FullyKioskClient} builds the ergonomic command API on top.
 */
export class FullyKioskTransport {
  /** Normalised origin of the Remote Admin interface. */
  readonly baseUrl: URL;

  private readonly password: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly requestStyle: FullyKioskRequestStyle;
  private readonly fetchImpl: FetchLike;
  private readonly headers: Record<string, string>;
  private readonly onRequest: FullyKioskClientOptions['onRequest'];

  /**
   * @param options - Connection and behaviour options for the transport.
   */
  constructor(options: FullyKioskClientOptions) {
    if (typeof options.password !== 'string') {
      throw new TypeError('`password` is required');
    }

    this.baseUrl = resolveBaseUrl(options);
    this.password = options.password;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.retries = options.retries ?? DEFAULT_RETRIES;
    this.retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY;
    this.requestStyle = options.requestStyle ?? 'cmd';
    this.headers = options.headers ?? {};
    this.onRequest = options.onRequest;

    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new TypeError(
        'No global `fetch` available. Use Node 20+ or pass a `fetch` implementation in the client options.',
      );
    }
    this.fetchImpl = fetchImpl.bind(globalThis);
  }

  /**
   * Builds the request URL for a command.
   *
   * @param command - The Fully Kiosk command name, e.g. `getDeviceInfo`.
   * @param params - Extra query string parameters for the command.
   * @param json - Whether to ask the device for a JSON response.
   * @returns The absolute request URL.
   */
  buildUrl(command: string, params: FullyKioskParams = {}, json = true): string {
    const url = new URL(this.baseUrl.toString());

    if (this.requestStyle === 'path') {
      url.pathname = `/${command}`;
    } else {
      url.searchParams.set('cmd', command);
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }

    if (json) {
      url.searchParams.set('type', 'json');
    }
    url.searchParams.set('password', this.password);

    return url.toString();
  }

  /**
   * Performs a single HTTP attempt with a timeout.
   *
   * @param command - The command being executed, used for error messages.
   * @param url - The absolute request URL.
   * @param timeout - Timeout in milliseconds.
   * @param signal - Optional caller-provided abort signal.
   * @returns The raw `Response`.
   */
  private async attempt(
    command: string,
    url: string,
    timeout: number,
    signal?: AbortSignal,
  ): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);

    const onExternalAbort = () => controller.abort();
    signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      return await this.fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json, text/plain, */*', ...this.headers },
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) {
        throw new FullyKioskTimeoutError(command, timeout);
      }
      if (signal?.aborted) {
        throw error;
      }
      throw new FullyKioskConnectionError(redactUrl(url), error);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onExternalAbort);
    }
  }

  /**
   * Executes a command, retrying transient failures.
   *
   * @param command - The Fully Kiosk command name.
   * @param params - Query string parameters for the command.
   * @param options - Per-call overrides for timeout, retries and abort signal.
   * @param json - Whether to request a JSON response.
   * @returns The raw `Response` of the successful attempt.
   */
  async raw(
    command: string,
    params: FullyKioskParams = {},
    options: FullyKioskRequestOptions = {},
    json = true,
  ): Promise<Response> {
    const url = this.buildUrl(command, params, json);
    const timeout = options.timeout ?? this.timeout;
    const retries = options.retries ?? this.retries;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      this.onRequest?.({ command, url: redactUrl(url), attempt });

      try {
        const response = await this.attempt(command, url, timeout, options.signal);

        if (response.status === 401 || response.status === 403) {
          throw new FullyKioskAuthError(command);
        }
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new FullyKioskHttpError(
            command,
            response.status,
            response.statusText,
            body.slice(0, 500),
          );
        }

        return response;
      } catch (error) {
        lastError = error;
        if (attempt >= retries || !isRetryable(error)) break;
        await delay(this.retryDelay * 2 ** attempt);
      }
    }

    throw lastError;
  }

  /**
   * Executes a command and decodes the JSON response.
   *
   * Fully answers an unauthenticated request with its HTML login page and an
   * HTTP 200 status, so an HTML body is reported as an authentication failure.
   *
   * @typeParam T - Expected shape of the decoded payload.
   * @param command - The Fully Kiosk command name.
   * @param params - Query string parameters for the command.
   * @param options - Per-call overrides for timeout, retries and abort signal.
   * @returns The decoded payload.
   */
  async json<T = FullyKioskStatusResponse>(
    command: string,
    params: FullyKioskParams = {},
    options: FullyKioskRequestOptions = {},
  ): Promise<T> {
    const response = await this.raw(command, params, options);
    const body = await response.text();
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('text/html') || /^\s*<(?:!doctype|html)/i.test(body)) {
      throw new FullyKioskAuthError(command);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      throw new FullyKioskParseError(command, body.slice(0, 500), error);
    }

    assertOk(command, payload);
    return payload as T;
  }

  /**
   * Executes a command and returns the response body as text. Used by commands
   * that answer with plain text or CSV, such as `showLog` or `loadStatsCSV`.
   *
   * @param command - The Fully Kiosk command name.
   * @param params - Query string parameters for the command.
   * @param options - Per-call overrides for timeout, retries and abort signal.
   * @returns The response body as a string.
   */
  async text(
    command: string,
    params: FullyKioskParams = {},
    options: FullyKioskRequestOptions = {},
  ): Promise<string> {
    const response = await this.raw(command, params, options, false);
    return response.text();
  }

  /**
   * Executes a command and returns the response body as bytes. Used by
   * `getScreenshot`, `getCamshot` and `downloadFile`.
   *
   * @param command - The Fully Kiosk command name.
   * @param params - Query string parameters for the command.
   * @param options - Per-call overrides for timeout, retries and abort signal.
   * @returns The bytes and the MIME type reported by the device.
   */
  async binary(
    command: string,
    params: FullyKioskParams = {},
    options: FullyKioskRequestOptions = {},
  ): Promise<FullyKioskBinaryResponse> {
    const response = await this.raw(command, params, options, false);
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';

    if (contentType.includes('text/html')) {
      throw new FullyKioskAuthError(command);
    }

    const buffer = await response.arrayBuffer();
    return { data: new Uint8Array(buffer), contentType };
  }
}

/**
 * Throws when the device reported a failure inside an otherwise valid JSON
 * response.
 *
 * @param command - The command that produced the payload.
 * @param payload - The decoded response payload.
 */
function assertOk(command: string, payload: unknown): void {
  if (typeof payload !== 'object' || payload === null) return;

  const { status, statustext } = payload as FullyKioskStatusResponse;
  if (typeof status !== 'string' || status.toLowerCase() !== 'error') return;

  const detail = statustext ?? 'Unknown error';
  if (/password|login|auth/i.test(detail)) {
    throw new FullyKioskAuthError(command);
  }
  throw new FullyKioskCommandError(command, detail, payload);
}
