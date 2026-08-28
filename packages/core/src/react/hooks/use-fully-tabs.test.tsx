/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFully, resetFully } from '../test-support.js';
import { useFullyTabs } from './use-fully-tabs.js';

afterEach(() => {
  resetFully();
  cleanup();
});

/**
 * Interface members backed by a small in-memory tab list, so the hook's
 * refresh-after-action behaviour is observable.
 *
 * @returns The members plus the spies the tests assert on.
 */
function tabStub() {
  let tabs = [{ url: 'https://a.test' }, { url: 'https://b.test' }];
  let current = 0;

  return {
    focusTabByIndex: vi.fn((index: number) => {
      current = index;
    }),
    focusNextTab: vi.fn(() => {
      current += 1;
    }),
    focusPrevTab: vi.fn(() => {
      current -= 1;
    }),
    focusThisTab: vi.fn(),
    closeThisTab: vi.fn(),
    closeTabByIndex: vi.fn((index: number) => {
      tabs = tabs.filter((_, position) => position !== index);
    }),
    loadUrlInNewTab: vi.fn((url: string) => {
      tabs = [...tabs, { url }];
    }),
    loadUrlInTabByIndex: vi.fn(),
    getTabList: () => JSON.stringify(tabs),
    getCurrentTabIndex: () => current,
    getThisTabIndex: () => 1,
  };
}

describe('useFullyTabs', () => {
  it('reads the tab list and both indexes on mount', () => {
    installFully(tabStub());

    const { result } = renderHook(() => useFullyTabs());

    expect(result.current.tabs).toEqual([{ url: 'https://a.test' }, { url: 'https://b.test' }]);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.thisIndex).toBe(1);
  });

  it('reports an empty list outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyTabs());

    expect(result.current.tabs).toEqual([]);
    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.thisIndex).toBe(-1);
  });

  it('focuses a tab by index and re-reads the state', () => {
    const stub = tabStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyTabs());
    act(() => result.current.focus(1));

    expect(stub.focusTabByIndex).toHaveBeenCalledWith(1);
    expect(result.current.currentIndex).toBe(1);
  });

  it('steps to the next and previous tab', () => {
    const stub = tabStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyTabs());
    act(() => result.current.focusNext());
    expect(result.current.currentIndex).toBe(1);

    act(() => result.current.focusPrev());
    expect(result.current.currentIndex).toBe(0);

    act(() => result.current.focusThis());
    expect(stub.focusThisTab).toHaveBeenCalledOnce();
  });

  it('drops a closed tab from the list', () => {
    const stub = tabStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyTabs());
    act(() => result.current.close(0));

    expect(stub.closeTabByIndex).toHaveBeenCalledWith(0);
    expect(result.current.tabs).toEqual([{ url: 'https://b.test' }]);
  });

  it('closes its own tab without re-reading a list it is leaving', () => {
    const stub = tabStub();
    const getTabList = vi.fn(stub.getTabList);
    installFully({ ...stub, getTabList });

    const { result } = renderHook(() => useFullyTabs());
    const readsBefore = getTabList.mock.calls.length;

    act(() => result.current.closeThis());

    expect(stub.closeThisTab).toHaveBeenCalledOnce();
    expect(getTabList).toHaveBeenCalledTimes(readsBefore);
  });

  it('focuses a new tab by default when opening a URL', () => {
    const stub = tabStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyTabs());
    act(() => result.current.openInNewTab('https://c.test'));

    expect(stub.loadUrlInNewTab).toHaveBeenCalledWith('https://c.test', true);
    expect(result.current.tabs).toHaveLength(3);
  });

  it('honours an explicit request not to focus the new tab', () => {
    const stub = tabStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyTabs());
    act(() => result.current.openInNewTab('https://c.test', false));

    expect(stub.loadUrlInNewTab).toHaveBeenCalledWith('https://c.test', false);
  });

  it('loads a URL into an existing tab', () => {
    const stub = tabStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyTabs());
    act(() => result.current.loadInTab(1, 'https://d.test'));

    expect(stub.loadUrlInTabByIndex).toHaveBeenCalledWith(1, 'https://d.test');
  });

  it('re-reads everything on demand', () => {
    const getTabList = vi.fn(() => '[]');
    installFully({ getTabList, getCurrentTabIndex: () => 0, getThisTabIndex: () => 0 });

    const { result } = renderHook(() => useFullyTabs());
    const callsAfterMount = getTabList.mock.calls.length;

    act(() => result.current.refresh());

    expect(getTabList.mock.calls.length).toBeGreaterThan(callsAfterMount);
  });
});
