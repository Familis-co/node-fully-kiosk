/**
 * Minimal structural type of the global `fetch` function, so a custom
 * implementation (undici, node-fetch, a test double) can be injected.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * How a command is encoded into the request URL.
 *
 * - `cmd` produces `/?cmd=getDeviceInfo&type=json&password=...`
 * - `path` produces `/getDeviceInfo?type=json&password=...`
 *
 * Both are understood by Fully Kiosk. `cmd` is the default because it is the
 * form used by long-standing integrations and works across all versions that
 * ship the Remote Admin interface.
 */
export type FullyKioskRequestStyle = 'cmd' | 'path';

/**
 * Query string parameters accepted by a command. Entries whose value is
 * `undefined` or `null` are omitted from the request.
 */
export type FullyKioskParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Details of an outgoing request, passed to the {@link FullyKioskClientOptions.onRequest} hook.
 */
export interface FullyKioskRequestInfo {
  /** The command being executed, e.g. `getDeviceInfo`. */
  command: string;
  /** The fully built request URL with the password redacted. */
  url: string;
  /** Zero-based attempt counter; `0` is the first try. */
  attempt: number;
}

/**
 * Configuration for a {@link FullyKioskClient}.
 */
export interface FullyKioskClientOptions {
  /**
   * Device address. Accepts a bare host (`192.168.1.20`), a host with port
   * (`192.168.1.20:2323`) or a full origin (`https://kiosk.local:2323`). When
   * a scheme is present in `host` it takes precedence over `protocol`.
   */
  host: string;
  /** Remote Admin password configured on the device. */
  password: string;
  /** Remote Admin port. Defaults to `2323`. Ignored when `host` carries a port. */
  port?: number;
  /** Scheme to use when `host` does not carry one. Defaults to `http`. */
  protocol?: 'http' | 'https';
  /** Per-request timeout in milliseconds. Defaults to `10000`. */
  timeout?: number;
  /**
   * Number of retries after a failed attempt. Only connection failures and
   * HTTP 5xx responses are retried. Defaults to `2`.
   */
  retries?: number;
  /** Base delay in milliseconds between retries, doubled per attempt. Defaults to `300`. */
  retryDelay?: number;
  /** URL encoding style for commands. Defaults to `cmd`. */
  requestStyle?: FullyKioskRequestStyle;
  /** Custom `fetch` implementation. Defaults to the global `fetch`. */
  fetch?: FetchLike;
  /** Extra headers sent with every request. */
  headers?: Record<string, string>;
  /** Called before each attempt, useful for logging. The URL has the password redacted. */
  onRequest?: (info: FullyKioskRequestInfo) => void;
}

/**
 * Per-call options that can override client defaults.
 */
export interface FullyKioskRequestOptions {
  /** Abort signal that cancels the request. */
  signal?: AbortSignal;
  /** Overrides the client timeout for this call, in milliseconds. */
  timeout?: number;
  /** Overrides the client retry count for this call. */
  retries?: number;
}
