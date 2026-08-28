import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FullyJsInterfaceUnavailableError,
  getFully,
  isFullyKiosk,
  isFullyKioskApp,
  requireFully,
  safeCall,
  safeJsonCall,
} from './bridge.js';
import type { FullyJsInterface } from './types.js';

interface Scope {
  fully?: unknown;
  FullyKiosk?: unknown;
}

/**
 * Installs a value as the injected `fully` object.
 *
 * @param value - What Fully would have injected.
 */
function setFully(value: unknown): void {
  (globalThis as Scope).fully = value;
}

afterEach(() => {
  delete (globalThis as Scope).fully;
  delete (globalThis as Scope).FullyKiosk;
});

describe('getFully', () => {
  it('returns the injected interface', () => {
    const fully = { getDeviceId: () => 'abc' } as unknown as FullyJsInterface;
    setFully(fully);

    expect(getFully()).toBe(fully);
  });

  it('returns undefined outside Fully Kiosk', () => {
    expect(getFully()).toBeUndefined();
  });

  it('rejects a null placeholder rather than handing it out', () => {
    setFully(null);

    expect(getFully()).toBeUndefined();
  });

  it('rejects a non-object under the same name', () => {
    setFully('not the interface');

    expect(getFully()).toBeUndefined();
  });
});

describe('isFullyKiosk', () => {
  it('is true only while the interface is reachable', () => {
    expect(isFullyKiosk()).toBe(false);

    setFully({});
    expect(isFullyKiosk()).toBe(true);
  });
});

describe('isFullyKioskApp', () => {
  it('is true when the interface is reachable', () => {
    setFully({});

    expect(isFullyKioskApp()).toBe(true);
  });

  it('is true from the marker alone, with the interface disabled', () => {
    (globalThis as Scope).FullyKiosk = {};

    expect(isFullyKiosk()).toBe(false);
    expect(isFullyKioskApp()).toBe(true);
  });

  it('is false in an ordinary browser', () => {
    expect(isFullyKioskApp()).toBe(false);
  });
});

describe('requireFully', () => {
  it('returns the interface when it is there', () => {
    const fully = {} as FullyJsInterface;
    setFully(fully);

    expect(requireFully()).toBe(fully);
  });

  it('throws an error naming the setting that enables the interface', () => {
    expect(() => requireFully()).toThrow(FullyJsInterfaceUnavailableError);
    expect(() => requireFully()).toThrow(/Enable JavaScript Interface/);
  });
});

describe('safeCall', () => {
  it('returns what the getter reports', () => {
    setFully({ getBatteryLevel: () => 42 });

    expect(safeCall((fully) => fully.getBatteryLevel(), 0)).toBe(42);
  });

  it('falls back without calling the getter outside Fully Kiosk', () => {
    const read = vi.fn(() => 42);

    expect(safeCall(read, 7)).toBe(7);
    expect(read).not.toHaveBeenCalled();
  });

  it('falls back when the getter throws, as a denied permission does', () => {
    setFully({
      getDeviceId: () => {
        throw new Error('permission denied');
      },
    });

    expect(safeCall((fully) => fully.getDeviceId(), 'unknown')).toBe('unknown');
  });

  it('falls back when the getter is missing on an older Fully version', () => {
    setFully({});

    expect(safeCall((fully) => fully.getDeviceId(), 'unknown')).toBe('unknown');
  });

  it('falls back for a null or undefined result', () => {
    setFully({
      getDeviceId: () => null,
      getDeviceName: () => undefined,
    });

    expect(safeCall((fully) => fully.getDeviceId(), 'unknown')).toBe('unknown');
    expect(safeCall((fully) => fully.getDeviceName(), 'unknown')).toBe('unknown');
  });

  it('keeps a falsy result that is not null', () => {
    setFully({
      isPlugged: () => false,
      getBatteryLevel: () => 0,
    });

    expect(safeCall((fully) => fully.isPlugged(), true)).toBe(false);
    expect(safeCall((fully) => fully.getBatteryLevel(), 100)).toBe(0);
  });
});

describe('safeJsonCall', () => {
  it('parses the JSON the getter returns', () => {
    setFully({ getTabList: () => '[{"url":"https://example.test"}]' });

    expect(safeJsonCall((fully) => fully.getTabList(), [])).toEqual([
      { url: 'https://example.test' },
    ]);
  });

  it('falls back on a body that is not JSON', () => {
    setFully({ getTabList: () => 'not json' });

    expect(safeJsonCall((fully) => fully.getTabList(), [])).toEqual([]);
  });

  it('falls back on an empty string', () => {
    setFully({ getTabList: () => '' });

    expect(safeJsonCall((fully) => fully.getTabList(), ['fallback'])).toEqual(['fallback']);
  });

  it('falls back outside Fully Kiosk', () => {
    expect(safeJsonCall((fully) => fully.getTabList(), null)).toBeNull();
  });
});
