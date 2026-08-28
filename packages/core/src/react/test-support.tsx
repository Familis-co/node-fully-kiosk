import {
  FullyKioskClient,
  fullyEvents,
  type FetchLike,
  type FullyEventName,
  type FullyJsInterface,
} from '../index.js';
import { act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FullyKioskProvider } from './context.js';

/**
 * Installs a `fully` double on the global scope.
 *
 * A no-op `bind` is always present so the event bus can subscribe, which is
 * what makes {@link emit} reach the hooks under test.
 *
 * @param overrides - The interface members the test needs.
 */
export function installFully(overrides: Partial<FullyJsInterface> = {}): void {
  (globalThis as { fully?: FullyJsInterface }).fully = {
    bind: () => undefined,
    ...overrides,
  } as unknown as FullyJsInterface;
}

/**
 * Removes the `fully` double, putting the test back in an ordinary browser.
 */
export function resetFully(): void {
  delete (globalThis as { fully?: FullyJsInterface }).fully;
}

/**
 * Delivers an event through the shared bus the way Fully does, wrapped so React
 * flushes the resulting state updates.
 *
 * The bus ignores a name it does not know, so a typo would otherwise leave a
 * green test that exercised nothing. Taking a {@link FullyEventName} turns that
 * typo into a compile error.
 *
 * @param event - The event to raise.
 * @param args - Placeholder values in declaration order.
 */
export function emit(event: FullyEventName, ...args: string[]): void {
  act(() => fullyEvents.emit(event, ...args));
}

/**
 * A provider wrapper around a client whose transport is stubbed, plus the
 * request URLs that client produced.
 */
export interface ClientHarness {
  /** Wrapper component for `renderHook`. */
  wrapper: (props: { children: ReactNode }) => ReactNode;
  /** The client behind the provider. */
  client: FullyKioskClient;
  /** Every URL requested so far, in order. */
  urls: string[];
}

/**
 * Builds a provider around a client that answers through the given `fetch`
 * double and records what it asked for.
 *
 * @param fetchImpl - The `fetch` double. Defaults to answering every command
 * with an `OK` status envelope.
 * @returns The wrapper, the client and the recorded request URLs.
 */
export function createClientHarness(fetchImpl?: FetchLike): ClientHarness {
  const urls: string[] = [];

  const recording: FetchLike = (url, init) => {
    urls.push(url);
    if (fetchImpl) return fetchImpl(url, init);
    return Promise.resolve(
      new Response('{"status":"OK"}', { headers: { 'content-type': 'application/json' } }),
    );
  };

  const client = new FullyKioskClient({
    host: '10.0.0.5',
    password: 'pw',
    retries: 0,
    fetch: recording,
  });

  return {
    client,
    urls,
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <FullyKioskProvider client={client}>{children}</FullyKioskProvider>;
    },
  };
}

/**
 * Reads the `cmd` parameter of a recorded request URL.
 *
 * @param url - The recorded URL.
 * @returns The Fully command name.
 */
export function commandOf(url: string): string | null {
  return new URL(url).searchParams.get('cmd');
}

/**
 * Reads the query parameters of a recorded request URL.
 *
 * @param url - The recorded URL.
 * @returns The parsed query parameters.
 */
export function paramsOf(url: string): URLSearchParams {
  return new URL(url).searchParams;
}
