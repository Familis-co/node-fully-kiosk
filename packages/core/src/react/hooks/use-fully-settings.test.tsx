/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFully, resetFully } from '../test-support.js';
import { useFullyBooleanSetting, useFullyStringSetting } from './use-fully-settings.js';

afterEach(() => {
  resetFully();
  cleanup();
});

/**
 * Interface members backed by an in-memory settings map.
 *
 * @param initial - The settings the device starts with.
 * @returns The members plus the spies the tests assert on.
 */
function settingsStub(initial: Record<string, string> = {}) {
  const values = { ...initial };

  return {
    values,
    getStringSetting: (key: string) => values[key] ?? '',
    getBooleanSetting: (key: string) => values[key] ?? 'false',
    setStringSetting: vi.fn((key: string, value: string) => {
      values[key] = value;
    }),
    setBooleanSetting: vi.fn((key: string, value: boolean) => {
      values[key] = String(value);
    }),
  };
}

describe('useFullyStringSetting', () => {
  it('reads the current value on mount', () => {
    installFully(settingsStub({ startURL: 'https://example.test' }));

    const { result } = renderHook(() => useFullyStringSetting('startURL'));

    expect(result.current.value).toBe('https://example.test');
  });

  it('writes a value and reflects it without a manual refresh', () => {
    const stub = settingsStub({ startURL: 'https://old.test' });
    installFully(stub);

    const { result } = renderHook(() => useFullyStringSetting('startURL'));
    act(() => result.current.setValue('https://new.test'));

    expect(stub.setStringSetting).toHaveBeenCalledWith('startURL', 'https://new.test');
    expect(result.current.value).toBe('https://new.test');
  });

  it('re-reads when the key changes', () => {
    installFully(settingsStub({ startURL: 'https://a.test', screensaverURL: 'https://b.test' }));

    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useFullyStringSetting(key),
      { initialProps: { key: 'startURL' } },
    );
    expect(result.current.value).toBe('https://a.test');

    rerender({ key: 'screensaverURL' });

    expect(result.current.value).toBe('https://b.test');
  });

  it('is an empty string outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyStringSetting('startURL'));

    expect(result.current.value).toBe('');
    expect(() => act(() => result.current.setValue('x'))).not.toThrow();
  });
});

describe('useFullyBooleanSetting', () => {
  it('normalises the string the interface returns into a boolean', () => {
    installFully(settingsStub({ motionDetection: 'true' }));

    const { result } = renderHook(() => useFullyBooleanSetting('motionDetection'));

    expect(result.current.value).toBe(true);
  });

  it('treats anything other than "true" as false', () => {
    installFully(settingsStub({ motionDetection: 'false' }));

    const { result } = renderHook(() => useFullyBooleanSetting('motionDetection'));

    expect(result.current.value).toBe(false);
  });

  it('writes a real boolean and reflects the new value', () => {
    const stub = settingsStub({ motionDetection: 'false' });
    installFully(stub);

    const { result } = renderHook(() => useFullyBooleanSetting('motionDetection'));
    act(() => result.current.setValue(true));

    expect(stub.setBooleanSetting).toHaveBeenCalledWith('motionDetection', true);
    expect(result.current.value).toBe(true);
  });

  it('is false outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyBooleanSetting('motionDetection'));

    expect(result.current.value).toBe(false);
  });
});
