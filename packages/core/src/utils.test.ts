import { describe, expect, it } from 'vitest';
import { toBase64, toDataUrl } from './utils.js';

describe('toBase64', () => {
  it('encodes bytes', () => {
    expect(toBase64(new TextEncoder().encode('Fully'))).toBe('RnVsbHk=');
  });

  it('encodes an empty payload', () => {
    expect(toBase64(new Uint8Array())).toBe('');
  });
});

describe('toDataUrl', () => {
  it('builds a data URL carrying the reported MIME type', () => {
    const url = toDataUrl({ data: new Uint8Array([0, 1, 2]), contentType: 'image/png' });
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
  });
});

describe('toBase64 without Buffer', () => {
  /**
   * Runs a callback with `globalThis.Buffer` removed, as it is in a browser.
   *
   * @param run - The callback to run.
   * @returns What the callback returned.
   */
  function withoutBuffer<T>(run: () => T): T {
    const original = (globalThis as { Buffer?: unknown }).Buffer;
    delete (globalThis as { Buffer?: unknown }).Buffer;
    try {
      return run();
    } finally {
      (globalThis as { Buffer?: unknown }).Buffer = original;
    }
  }

  it('falls back to btoa and produces the same output', () => {
    const bytes = new TextEncoder().encode('Fully');

    expect(withoutBuffer(() => toBase64(bytes))).toBe(toBase64(bytes));
  });

  it('encodes an empty payload through the fallback', () => {
    expect(withoutBuffer(() => toBase64(new Uint8Array()))).toBe('');
  });

  it('encodes bytes above the ASCII range through the fallback', () => {
    const bytes = new Uint8Array([0x00, 0x7f, 0x80, 0xff]);

    expect(withoutBuffer(() => toBase64(bytes))).toBe(toBase64(bytes));
  });
});
