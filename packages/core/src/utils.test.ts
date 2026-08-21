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
