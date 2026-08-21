/**
 * Base class for every error thrown by this SDK.
 *
 * Catching `FullyKioskError` catches all SDK-originated failures while letting
 * unrelated errors (programming mistakes, aborts from user code) propagate.
 */
export class FullyKioskError extends Error {
  /**
   * @param message - Human readable description of the failure.
   * @param options - Standard error options, notably `cause`.
   */
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * The device could not be reached at all: DNS failure, connection refused,
 * TLS handshake failure or any other transport level problem.
 */
export class FullyKioskConnectionError extends FullyKioskError {
  /**
   * @param url - The URL that could not be reached.
   * @param cause - The underlying transport error.
   */
  constructor(
    public readonly url: string,
    cause?: unknown,
  ) {
    super(`Could not reach Fully Kiosk device at ${url}`, { cause });
  }
}

/**
 * The request did not complete within the configured timeout.
 */
export class FullyKioskTimeoutError extends FullyKioskError {
  /**
   * @param command - The command that timed out.
   * @param timeout - The timeout in milliseconds that was exceeded.
   */
  constructor(
    public readonly command: string,
    public readonly timeout: number,
  ) {
    super(`Command "${command}" timed out after ${timeout}ms`);
  }
}

/**
 * The Remote Admin password was rejected.
 *
 * Fully Kiosk answers an unauthenticated request with its HTML login page and
 * an HTTP 200 status, so this error is also raised when the response body is
 * HTML where JSON was expected.
 */
export class FullyKioskAuthError extends FullyKioskError {
  /**
   * @param command - The command that was rejected.
   */
  constructor(public readonly command: string) {
    super(
      `Authentication failed for command "${command}". Check the Remote Admin password ` +
        'and that "Remote Administration from Local Network" is enabled on the device.',
    );
  }
}

/**
 * The device answered with a non-2xx HTTP status.
 */
export class FullyKioskHttpError extends FullyKioskError {
  /**
   * @param command - The command that failed.
   * @param status - The HTTP status code returned by the device.
   * @param statusText - The HTTP status text returned by the device.
   * @param body - The raw response body, truncated for readability.
   */
  constructor(
    public readonly command: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: string,
  ) {
    super(`Command "${command}" failed with HTTP ${status} ${statusText}`);
  }
}

/**
 * The device accepted the request but reported a failure in the JSON payload,
 * for example `{ "status": "Error", "statustext": "Unknown command" }`.
 */
export class FullyKioskCommandError extends FullyKioskError {
  /**
   * @param command - The command that was rejected by the device.
   * @param statusText - The `statustext` field returned by the device.
   * @param response - The full decoded response payload.
   */
  constructor(
    public readonly command: string,
    public readonly statusText: string,
    public readonly response: unknown,
  ) {
    super(`Command "${command}" was rejected by the device: ${statusText}`);
  }
}

/**
 * The response body could not be decoded into the expected shape.
 */
export class FullyKioskParseError extends FullyKioskError {
  /**
   * @param command - The command whose response could not be parsed.
   * @param body - The raw response body.
   * @param cause - The underlying parse error, if any.
   */
  constructor(
    public readonly command: string,
    public readonly body: string,
    cause?: unknown,
  ) {
    super(`Could not parse the response of command "${command}"`, { cause });
  }
}
