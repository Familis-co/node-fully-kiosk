/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFully, resetFully } from '../test-support.js';
import { useFullyClipboard } from './use-fully-clipboard.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyClipboard', () => {
  it('starts empty without touching the clipboard', () => {
    const getClipboardText = vi.fn(() => 'copied');
    installFully({ getClipboardText });

    const { result } = renderHook(() => useFullyClipboard());

    expect(result.current.value).toBe('');
    expect(getClipboardText).not.toHaveBeenCalled();
  });

  it('reads plain text into state and returns it', () => {
    installFully({ getClipboardText: () => 'copied text' });

    const { result } = renderHook(() => useFullyClipboard());
    let returned = '';
    act(() => {
      returned = result.current.read();
    });

    expect(returned).toBe('copied text');
    expect(result.current.value).toBe('copied text');
  });

  it('reads HTML into the same state', () => {
    installFully({ getClipboardHtmlText: () => '<b>copied</b>' });

    const { result } = renderHook(() => useFullyClipboard());
    act(() => {
      result.current.readHtml();
    });

    expect(result.current.value).toBe('<b>copied</b>');
  });

  it('writes text and keeps it as the current value', () => {
    const copyTextToClipboard = vi.fn();
    installFully({ copyTextToClipboard });

    const { result } = renderHook(() => useFullyClipboard());
    act(() => result.current.write('to copy'));

    expect(copyTextToClipboard).toHaveBeenCalledWith('to copy');
    expect(result.current.value).toBe('to copy');
  });

  it('reads an empty string when Android blocks the access', () => {
    installFully({
      getClipboardText: () => {
        throw new Error('background access denied');
      },
    });

    const { result } = renderHook(() => useFullyClipboard());
    act(() => {
      result.current.read();
    });

    expect(result.current.value).toBe('');
  });

  it('does not throw outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyClipboard());

    expect(() => act(() => result.current.write('x'))).not.toThrow();
    expect(() => act(() => result.current.read())).not.toThrow();
  });

  it('does not report a value for a write that reached no device', () => {
    const { result } = renderHook(() => useFullyClipboard());

    act(() => result.current.write('never copied'));

    expect(result.current.value).toBe('');
  });
});
