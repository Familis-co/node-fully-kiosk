import { getFully } from './bridge.js';
import {
  FULLY_EVENTS,
  type FullyEventArg,
  type FullyEventListener,
  type FullyEventName,
} from './events.js';

/**
 * Name of the dispatcher this module installs on `globalThis`.
 *
 * Fully evaluates event handlers as source strings in the page scope, so the
 * generated handler needs a stable, globally reachable entry point.
 */
export const FULLY_BRIDGE_KEY = '__fullyKioskBridge__';

/**
 * Shape of the global dispatcher the generated handler source calls into.
 */
interface FullyBridgeGlobal {
  /**
   * Delivers one event to the bus.
   *
   * @param event - The event name.
   * @param args - Placeholder values, already substituted by Fully.
   */
  emit(event: string, ...args: string[]): void;
}

/**
 * Turns a raw placeholder value into the typed payload value.
 *
 * @param value - The substituted placeholder as a string.
 * @param type - The declared placeholder type.
 * @returns The coerced value.
 */
function coerce(value: string, type: FullyEventArg[1]): string | number {
  if (type !== 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Builds the JavaScript source Fully evaluates when an event fires.
 *
 * Placeholders are wrapped in single quotes so their substituted text arrives
 * as string arguments. A value containing a single quote would break the
 * generated source, which is a limitation of Fully's placeholder mechanism.
 *
 * @param event - The event to generate a handler for.
 * @returns The handler source to pass to `fully.bind`.
 */
export function buildHandlerSource(event: FullyEventName): string {
  const args = FULLY_EVENTS[event] as readonly FullyEventArg[];
  const placeholders = args.map(([name]) => `'$${name}'`).join(',');
  const call = placeholders ? `'${event}',${placeholders}` : `'${event}'`;
  return `try{var b=window['${FULLY_BRIDGE_KEY}'];if(b)b.emit(${call});}catch(e){}`;
}

/**
 * Multiplexes many listeners over the single handler `fully.bind` allows per
 * event.
 *
 * Fully replaces the previous handler on every `bind` call and offers no way to
 * unbind, so the bus binds an event once on its first listener and keeps that
 * binding for the lifetime of the page. Removing the last listener simply stops
 * delivery.
 */
export class FullyEventBus {
  private readonly listeners = new Map<FullyEventName, Set<(payload: never) => void>>();
  private readonly bound = new Set<FullyEventName>();
  private installed = false;

  /**
   * Subscribes to a Fully event.
   *
   * @typeParam Event - The event name.
   * @param event - The event to listen for.
   * @param listener - Called with the typed payload each time the event fires.
   * @returns A function that removes this listener.
   */
  on<Event extends FullyEventName>(event: Event, listener: FullyEventListener<Event>): () => void {
    this.install();

    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(listener);
    this.bind(event);

    return () => {
      handlers.delete(listener);
      if (handlers.size === 0) this.listeners.delete(event);
    };
  }

  /**
   * Subscribes to a Fully event and unsubscribes after the first delivery.
   *
   * @typeParam Event - The event name.
   * @param event - The event to listen for.
   * @param listener - Called once with the typed payload.
   * @returns A function that removes the listener before it fires.
   */
  once<Event extends FullyEventName>(
    event: Event,
    listener: FullyEventListener<Event>,
  ): () => void {
    const off = this.on(event, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }

  /**
   * Delivers an event to its listeners. Called by the global dispatcher, and
   * useful in tests to simulate an event.
   *
   * @param event - The event name.
   * @param args - Placeholder values in declaration order.
   */
  emit(event: string, ...args: string[]): void {
    const name = event as FullyEventName;
    const spec = FULLY_EVENTS[name] as readonly FullyEventArg[] | undefined;
    const handlers = this.listeners.get(name);
    if (!spec || !handlers || handlers.size === 0) return;

    const payload: Record<string, string | number> = {};
    spec.forEach(([key, type], index) => {
      payload[key] = coerce(args[index] ?? '', type);
    });

    for (const handler of [...handlers]) {
      try {
        (handler as (value: Record<string, string | number>) => void)(payload);
      } catch (error) {
        console.error(`[fully-kiosk] listener for "${event}" threw`, error);
      }
    }
  }

  /**
   * Whether an event has an active `fully.bind` registration.
   *
   * @param event - The event to check.
   * @returns `true` when the event was bound on the device.
   */
  isBound(event: FullyEventName): boolean {
    return this.bound.has(event);
  }

  /**
   * Publishes the dispatcher on `globalThis` so generated handler source can
   * reach it.
   */
  private install(): void {
    if (this.installed) return;
    const scope = globalThis as unknown as Record<string, FullyBridgeGlobal>;
    scope[FULLY_BRIDGE_KEY] = { emit: (event, ...args) => this.emit(event, ...args) };
    this.installed = true;
  }

  /**
   * Registers the event with Fully, once.
   *
   * @param event - The event to bind.
   */
  private bind(event: FullyEventName): void {
    if (this.bound.has(event)) return;
    const fully = getFully();
    if (!fully) return;

    try {
      fully.bind(event, buildHandlerSource(event));
      this.bound.add(event);
    } catch (error) {
      console.error(`[fully-kiosk] could not bind "${event}"`, error);
    }
  }
}

/**
 * Name under which the shared bus is published on `globalThis`.
 */
export const FULLY_EVENT_BUS_KEY = '__fullyKioskEventBus__';

/**
 * Returns the bus shared by every copy of this module in the page.
 *
 * `fully.bind` keeps only the most recent handler per event, so two buses would
 * fight over the binding and one of them would stop receiving events. Entry
 * points are bundled separately and a page can end up with more than one copy of
 * this module, so the instance is anchored on `globalThis` rather than on the
 * module scope.
 *
 * @returns The shared event bus.
 */
function resolveSharedBus(): FullyEventBus {
  const scope = globalThis as unknown as Record<string, FullyEventBus | undefined>;
  const existing = scope[FULLY_EVENT_BUS_KEY];
  if (existing) return existing;

  const bus = new FullyEventBus();
  scope[FULLY_EVENT_BUS_KEY] = bus;
  return bus;
}

/**
 * Process-wide event bus, shared across every copy of this module.
 */
export const fullyEvents = resolveSharedBus();

/**
 * Subscribes to a Fully Kiosk event.
 *
 * @typeParam Event - The event name.
 * @param event - The event to listen for.
 * @param listener - Called with the typed payload each time the event fires.
 * @returns A function that removes this listener.
 *
 * @example
 * ```ts
 * const off = onFullyEvent('onQrScanSuccess', ({ code }) => console.log(code));
 * ```
 */
export function onFullyEvent<Event extends FullyEventName>(
  event: Event,
  listener: FullyEventListener<Event>,
): () => void {
  return fullyEvents.on(event, listener);
}
