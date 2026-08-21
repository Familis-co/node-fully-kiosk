import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FullyJsInterface } from './types.js';
import {
  buildHandlerSource,
  FULLY_BRIDGE_KEY,
  FULLY_EVENT_BUS_KEY,
  FullyEventBus,
  fullyEvents,
} from './emitter.js';

/**
 * Installs a minimal `fully` double that records what was bound.
 *
 * @returns The recorded bindings and the double itself.
 */
function installFully(): { bindings: Map<string, string>; fully: FullyJsInterface } {
  const bindings = new Map<string, string>();
  const fully = {
    bind: (event: string, code: string) => bindings.set(event, code),
  } as unknown as FullyJsInterface;

  (globalThis as { fully?: FullyJsInterface }).fully = fully;
  return { bindings, fully };
}

afterEach(() => {
  delete (globalThis as { fully?: FullyJsInterface }).fully;
});

describe('buildHandlerSource', () => {
  it('emits only the event name when there are no placeholders', () => {
    expect(buildHandlerSource('screenOn')).toContain(`b.emit('screenOn')`);
  });

  it('passes every placeholder as a quoted argument in declaration order', () => {
    const source = buildHandlerSource('onQrScanSuccess');
    expect(source).toContain(`b.emit('onQrScanSuccess','$code','$extras')`);
  });

  it('reaches the dispatcher through the documented global name', () => {
    expect(buildHandlerSource('onMotion')).toContain(FULLY_BRIDGE_KEY);
  });
});

describe('FullyEventBus', () => {
  it('binds an event with Fully exactly once, however many listeners subscribe', () => {
    const { bindings } = installFully();
    const bus = new FullyEventBus();

    const offA = bus.on('onMotion', vi.fn());
    const offB = bus.on('onMotion', vi.fn());

    expect(bindings.size).toBe(1);
    expect(bus.isBound('onMotion')).toBe(true);
    offA();
    offB();
  });

  it('delivers a coerced payload to every listener', () => {
    installFully();
    const bus = new FullyEventBus();
    const seen: unknown[] = [];

    bus.on('onBatteryLevelChanged', (payload) => seen.push(payload));
    bus.emit('onBatteryLevelChanged', '42');

    expect(seen).toEqual([{ level: 42 }]);
  });

  it('maps positional placeholders onto named payload fields', () => {
    installFully();
    const bus = new FullyEventBus();
    const seen: unknown[] = [];

    bus.on('onNfcTagDiscovered', (payload) => seen.push(payload));
    bus.emit('onNfcTagDiscovered', '04A2', 'NfcA', 'hello', 'ff00');

    expect(seen).toEqual([{ serial: '04A2', type: 'NfcA', message: 'hello', data: 'ff00' }]);
  });

  it('stops delivering to a listener after it unsubscribes', () => {
    installFully();
    const bus = new FullyEventBus();
    const listener = vi.fn();

    const off = bus.on('onMotion', listener);
    bus.emit('onMotion');
    off();
    bus.emit('onMotion');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('delivers to a once listener a single time', () => {
    installFully();
    const bus = new FullyEventBus();
    const listener = vi.fn();

    bus.once('onMotion', listener);
    bus.emit('onMotion');
    bus.emit('onMotion');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps delivering to the other listeners when one throws', () => {
    installFully();
    const bus = new FullyEventBus();
    const survivor = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    bus.on('onMotion', () => {
      throw new Error('listener blew up');
    });
    bus.on('onMotion', survivor);
    bus.emit('onMotion');

    expect(survivor).toHaveBeenCalledTimes(1);
  });

  it('registers listeners even when Fully is absent, so hooks work outside the kiosk', () => {
    const bus = new FullyEventBus();
    const listener = vi.fn();

    bus.on('onMotion', listener);
    expect(bus.isBound('onMotion')).toBe(false);

    bus.emit('onMotion');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores an unknown event name', () => {
    installFully();
    const bus = new FullyEventBus();
    expect(() => bus.emit('somethingElse', 'x')).not.toThrow();
  });
});

describe('the shared bus', () => {
  it('is anchored on globalThis so separately bundled entry points share it', () => {
    const scope = globalThis as unknown as Record<string, unknown>;
    expect(scope[FULLY_EVENT_BUS_KEY]).toBe(fullyEvents);
  });
});
