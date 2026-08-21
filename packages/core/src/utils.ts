import type { FullyKioskBinaryResponse } from './types/responses.js';

/**
 * Encodes bytes as base64 in both Node.js and the browser.
 *
 * @param bytes - The bytes to encode.
 * @returns The base64 representation.
 */
export function toBase64(bytes: Uint8Array): string {
  const maybeBuffer = (
    globalThis as { Buffer?: { from(input: Uint8Array): { toString(encoding: string): string } } }
  ).Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(bytes).toString('base64');
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Turns a binary response into a `data:` URL, ready to use as an `<img>` source.
 *
 * @param response - A binary response such as a screenshot or camshot.
 * @returns A `data:` URL carrying the payload.
 */
export function toDataUrl(response: FullyKioskBinaryResponse): string {
  return `data:${response.contentType};base64,${toBase64(response.data)}`;
}
