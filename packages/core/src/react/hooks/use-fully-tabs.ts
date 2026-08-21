import { getFully, getFullyTabList, type FullyTab } from '../../index.js';
import { useCallback } from 'react';
import { useFullyValue } from './use-fully-value.js';

/**
 * Tab state and control through the JavaScript interface.
 */
export interface UseFullyTabsResult {
  /** The open tabs. */
  tabs: FullyTab[];
  /** Index of the focused tab. */
  currentIndex: number;
  /** Index of the tab this page runs in. */
  thisIndex: number;
  /**
   * Focuses a tab.
   *
   * @param index - Zero-based tab index.
   */
  focus: (index: number) => void;
  /** Focuses the next tab. */
  focusNext: () => void;
  /** Focuses the previous tab. */
  focusPrev: () => void;
  /** Focuses the tab this page runs in. */
  focusThis: () => void;
  /**
   * Closes a tab.
   *
   * @param index - Zero-based tab index.
   */
  close: (index: number) => void;
  /** Closes the tab this page runs in. */
  closeThis: () => void;
  /**
   * Opens a URL in a new tab.
   *
   * @param url - The URL to load.
   * @param focusNewTab - Focus the new tab. Defaults to `true`.
   */
  openInNewTab: (url: string, focusNewTab?: boolean) => void;
  /**
   * Loads a URL into an existing tab.
   *
   * @param index - Zero-based tab index.
   * @param url - The URL to load.
   */
  loadInTab: (index: number, url: string) => void;
  /** Re-reads the tab list and indexes. */
  refresh: () => void;
}

/**
 * Manages Fully's web tabs from inside the kiosk page.
 *
 * @param interval - Re-read the tab list on this interval in milliseconds.
 * @returns The tab state and its controls.
 */
export function useFullyTabs(interval?: number): UseFullyTabsResult {
  const tabs = useFullyValue<FullyTab[]>(() => getFullyTabList(), [], { interval });
  const currentIndex = useFullyValue((fully) => fully.getCurrentTabIndex(), -1, { interval });
  const thisIndex = useFullyValue((fully) => fully.getThisTabIndex(), -1, { interval });

  const refresh = useCallback(() => {
    tabs.refresh();
    currentIndex.refresh();
    thisIndex.refresh();
  }, [tabs, currentIndex, thisIndex]);

  return {
    tabs: tabs.value,
    currentIndex: currentIndex.value,
    thisIndex: thisIndex.value,
    focus: useCallback(
      (index: number) => {
        getFully()?.focusTabByIndex(index);
        refresh();
      },
      [refresh],
    ),
    focusNext: useCallback(() => {
      getFully()?.focusNextTab();
      refresh();
    }, [refresh]),
    focusPrev: useCallback(() => {
      getFully()?.focusPrevTab();
      refresh();
    }, [refresh]),
    focusThis: useCallback(() => {
      getFully()?.focusThisTab();
      refresh();
    }, [refresh]),
    close: useCallback(
      (index: number) => {
        getFully()?.closeTabByIndex(index);
        refresh();
      },
      [refresh],
    ),
    closeThis: useCallback(() => getFully()?.closeThisTab(), []),
    openInNewTab: useCallback(
      (url: string, focusNewTab = true) => {
        getFully()?.loadUrlInNewTab(url, focusNewTab);
        refresh();
      },
      [refresh],
    ),
    loadInTab: useCallback(
      (index: number, url: string) => {
        getFully()?.loadUrlInTabByIndex(index, url);
        refresh();
      },
      [refresh],
    ),
    refresh,
  };
}
