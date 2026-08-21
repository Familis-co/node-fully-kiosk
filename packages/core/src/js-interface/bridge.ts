import { FullyKioskError } from '../errors.js';
import type { FullyJsInterface } from './types.js';

declare global {
  var fully: FullyJsInterface | undefined;
  var FullyKiosk: unknown;
}

/**
 * Thrown when a call needs the Fully Kiosk JavaScript interface but the page is
 * not running inside Fully Kiosk, or the interface is disabled in the app.
 */
export class FullyJsInterfaceUnavailableError extends FullyKioskError {
  constructor() {
    super(
      'The Fully Kiosk JavaScript interface is not available. Open this page inside ' +
        'Fully Kiosk Browser and enable Advanced Web Settings > Enable JavaScript Interface.',
    );
  }
}

/**
 * Returns the injected `fully` object, or `undefined` when it is not available.
 *
 * @returns The JavaScript interface, or `undefined` outside Fully Kiosk.
 */
export function getFully(): FullyJsInterface | undefined {
  const scope = globalThis as { fully?: FullyJsInterface };
  return typeof scope.fully === 'object' && scope.fully !== null ? scope.fully : undefined;
}

/**
 * Whether the page is running inside Fully Kiosk with the JavaScript interface
 * enabled.
 *
 * @returns `true` when {@link getFully} would return the interface.
 */
export function isFullyKiosk(): boolean {
  return getFully() !== undefined;
}

/**
 * Whether the page is running inside a Fully Kiosk app at all, even when the
 * JavaScript interface itself is disabled. Fully injects a `FullyKiosk` marker
 * regardless of that setting.
 *
 * @returns `true` when the page is hosted by a Fully Kiosk app.
 */
export function isFullyKioskApp(): boolean {
  return (
    isFullyKiosk() || typeof (globalThis as { FullyKiosk?: unknown }).FullyKiosk !== 'undefined'
  );
}

/**
 * Returns the injected `fully` object or throws when it is unavailable.
 *
 * @returns The JavaScript interface.
 * @throws {FullyJsInterfaceUnavailableError} When not running inside Fully Kiosk.
 */
export function requireFully(): FullyJsInterface {
  const fully = getFully();
  if (!fully) throw new FullyJsInterfaceUnavailableError();
  return fully;
}

/**
 * Calls a member of the JavaScript interface and swallows any failure.
 *
 * Individual functions can be missing on older Fully versions or throw when a
 * permission was denied, and a kiosk page should not break over that.
 *
 * @typeParam T - Return type of the call.
 * @param read - Callback receiving the interface, typically a single getter call.
 * @param fallback - Value returned when the interface is missing or the call throws.
 * @returns The value returned by `read`, or `fallback`.
 */
export function safeCall<T>(read: (fully: FullyJsInterface) => T, fallback: T): T {
  const fully = getFully();
  if (!fully) return fallback;
  try {
    return read(fully) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Calls a member of the JavaScript interface that returns a JSON string and
 * parses the result.
 *
 * @typeParam T - Expected shape of the parsed JSON.
 * @param read - Callback receiving the interface, returning a JSON string.
 * @param fallback - Value returned when the interface is missing or parsing fails.
 * @returns The parsed value, or `fallback`.
 */
export function safeJsonCall<T>(read: (fully: FullyJsInterface) => string, fallback: T): T {
  const raw = safeCall(read, '');
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
