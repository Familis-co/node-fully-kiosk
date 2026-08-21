import { FullyKioskClient, type FullyKioskClientOptions } from '../index.js';
import { createContext, createElement, useContext, useMemo, useRef, type ReactNode } from 'react';

const FullyKioskContext = createContext<FullyKioskClient | null>(null);

/**
 * Props for {@link FullyKioskProvider}.
 *
 * Pass either a ready made `client` or the `options` to build one.
 */
export interface FullyKioskProviderProps {
  /** An existing client. Takes precedence over `options`. */
  client?: FullyKioskClient;
  /** Connection options used to build a client when `client` is not given. */
  options?: FullyKioskClientOptions;
  /** The subtree that gets access to the client. */
  children: ReactNode;
}

/**
 * Makes a {@link FullyKioskClient} available to the hooks in this package.
 *
 * When `options` is used the client is rebuilt only if one of the connection
 * fields changes, so an inline object literal is safe.
 *
 * @param props - The client or connection options, plus the subtree to render.
 * @returns The provider element.
 *
 * @example
 * ```tsx
 * <FullyKioskProvider options={{ host: '192.168.1.20', password: 'secret' }}>
 *   <Dashboard />
 * </FullyKioskProvider>
 * ```
 */
export function FullyKioskProvider({
  client,
  options,
  children,
}: FullyKioskProviderProps): ReactNode {
  // `options` is read through a ref and the connection fields drive the memo, so
  // an inline object literal does not rebuild the client on every render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { host, password, port, protocol, timeout, retries, requestStyle } = options ?? {};

  const value = useMemo(() => {
    if (client) return client;

    const current = optionsRef.current;
    if (!current) return null;
    return new FullyKioskClient(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, host, password, port, protocol, timeout, retries, requestStyle]);

  return createElement(FullyKioskContext.Provider, { value }, children);
}

/**
 * Reads the client from the nearest {@link FullyKioskProvider}.
 *
 * @returns The client, or `null` when there is no provider above.
 */
export function useOptionalFullyKioskClient(): FullyKioskClient | null {
  return useContext(FullyKioskContext);
}

/**
 * Reads the client from the nearest {@link FullyKioskProvider}.
 *
 * @returns The client.
 * @throws {Error} When no provider is present above this component.
 */
export function useFullyKioskClient(): FullyKioskClient {
  const client = useContext(FullyKioskContext);
  if (!client) {
    throw new Error(
      'No Fully Kiosk client found. Wrap your tree in <FullyKioskProvider> with a `client` or `options` prop.',
    );
  }
  return client;
}
