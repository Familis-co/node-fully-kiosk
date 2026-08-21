/**
 * @vitest-environment happy-dom
 */
import { FullyKioskClient } from '../index.js';
import { cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { FullyKioskProvider, useFullyKioskClient, useOptionalFullyKioskClient } from './context.js';

afterEach(cleanup);

describe('FullyKioskProvider', () => {
  it('hands the provided client to the hooks below it', () => {
    const client = new FullyKioskClient({ host: '10.0.0.5', password: 'pw' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FullyKioskProvider client={client}>{children}</FullyKioskProvider>
    );

    const { result } = renderHook(() => useFullyKioskClient(), { wrapper });
    expect(result.current).toBe(client);
  });

  it('builds a client from options', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FullyKioskProvider options={{ host: '10.0.0.5', password: 'pw' }}>
        {children}
      </FullyKioskProvider>
    );

    const { result } = renderHook(() => useFullyKioskClient(), { wrapper });
    expect(result.current.baseUrl).toBe('http://10.0.0.5:2323/');
  });

  it('keeps the same client across re-renders with an inline options literal', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FullyKioskProvider options={{ host: '10.0.0.5', password: 'pw' }}>
        {children}
      </FullyKioskProvider>
    );

    const { result, rerender } = renderHook(() => useFullyKioskClient(), { wrapper });
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });

  it('explains itself when a hook is used without a provider', () => {
    expect(() => renderHook(() => useFullyKioskClient())).toThrow(/FullyKioskProvider/);
  });

  it('returns null from the optional hook when there is no provider', () => {
    const { result } = renderHook(() => useOptionalFullyKioskClient());
    expect(result.current).toBeNull();
  });
});
