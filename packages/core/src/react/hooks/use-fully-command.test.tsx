/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActionGroup } from './use-action-group.js';
import { useFullyCommand } from './use-fully-command.js';

afterEach(cleanup);

describe('useFullyCommand', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useFullyCommand(() => Promise.resolve('done')));

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeUndefined();
  });

  it('forwards the arguments and keeps the result', async () => {
    const command = vi.fn((text: string, times: number) => Promise.resolve(text.repeat(times)));
    const { result } = renderHook(() => useFullyCommand(command));

    await act(async () => {
      await result.current.run('ab', 2);
    });

    expect(command).toHaveBeenCalledWith('ab', 2);
    expect(result.current.data).toBe('abab');
    expect(result.current.isPending).toBe(false);
  });

  it('reports the result to the caller as well as through state', async () => {
    const { result } = renderHook(() => useFullyCommand(() => Promise.resolve(7)));

    let returned: number | undefined;
    await act(async () => {
      returned = await result.current.run();
    });

    expect(returned).toBe(7);
  });

  it('is pending while the command is in flight', async () => {
    let settle: (value: string) => void = () => undefined;
    const { result } = renderHook(() =>
      useFullyCommand(() => new Promise<string>((resolve) => (settle = resolve))),
    );

    act(() => {
      void result.current.run();
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      settle('done');
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBe('done');
  });

  it('captures a rejection instead of throwing, and resolves undefined', async () => {
    const { result } = renderHook(() =>
      useFullyCommand(() => Promise.reject(new Error('device offline'))),
    );

    let returned: unknown = 'unset';
    await act(async () => {
      returned = await result.current.run();
    });

    expect(returned).toBeUndefined();
    expect(result.current.error?.message).toBe('device offline');
    expect(result.current.isPending).toBe(false);
  });

  it('wraps a non-Error rejection', async () => {
    const { result } = renderHook(() =>
      // The point of this case is a rejection that is not an Error.
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      useFullyCommand(() => Promise.reject('just a string')),
    );

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('just a string');
  });

  it('clears the previous error when a new run starts', async () => {
    let shouldFail = true;
    const { result } = renderHook(() =>
      useFullyCommand(() =>
        shouldFail ? Promise.reject(new Error('boom')) : Promise.resolve('ok'),
      ),
    );

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).not.toBeNull();

    shouldFail = false;
    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe('ok');
  });

  it('clears error and data through reset', async () => {
    const { result } = renderHook(() => useFullyCommand(() => Promise.resolve('ok')));

    await act(async () => {
      await result.current.run();
    });
    act(() => result.current.reset());

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('calls the latest command without a stale closure', async () => {
    const { result, rerender } = renderHook(
      ({ tag }: { tag: string }) => useFullyCommand(() => Promise.resolve(tag)),
      { initialProps: { tag: 'first' } },
    );

    rerender({ tag: 'second' });
    await act(async () => {
      await result.current.run();
    });

    expect(result.current.data).toBe('second');
  });
});

describe('useActionGroup', () => {
  it('shares one pending and error state across the actions it runs', async () => {
    const { result } = renderHook(() => useActionGroup());

    await act(async () => {
      await result.current.run(() => Promise.reject(new Error('screen off failed')));
    });
    expect(result.current.error?.message).toBe('screen off failed');

    await act(async () => {
      await result.current.run(() => Promise.resolve('ok'));
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it('returns what the action resolved with', async () => {
    const { result } = renderHook(() => useActionGroup());

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.run(() => Promise.resolve('brightness set'));
    });

    expect(returned).toBe('brightness set');
  });

  it('clears the error through reset', async () => {
    const { result } = renderHook(() => useActionGroup());

    await act(async () => {
      await result.current.run(() => Promise.reject(new Error('boom')));
    });
    act(() => result.current.reset());

    expect(result.current.error).toBeNull();
  });
});
