import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskStatusResponse } from '../types/responses.js';

/**
 * Options for {@link BrowserCommands.loadUrl}.
 */
export interface LoadUrlOptions extends FullyKioskRequestOptions {
  /** Load the URL into an existing tab by zero-based index. */
  tab?: number;
  /** Load the URL into a newly opened tab. */
  newTab?: boolean;
  /** Focus the target tab after loading. */
  focus?: boolean;
}

/**
 * Web browsing: navigation, tabs and cached web data.
 */
export class BrowserCommands extends CommandGroup {
  /**
   * Navigates to a URL.
   *
   * @param url - The absolute URL to load. Also accepts an Android intent URL.
   * @param options - Tab targeting plus per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  loadUrl(url: string, options: LoadUrlOptions = {}): Promise<FullyKioskStatusResponse> {
    const { tab, newTab, focus, ...request } = options;
    return this.transport.json('loadUrl', { url, tab, newtab: newTab, focus }, request);
  }

  /**
   * Navigates back to the configured start URL.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  loadStartUrl(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('loadStartUrl', {}, options);
  }

  /**
   * Injects and runs JavaScript in the focused tab. Requires Fully Kiosk 1.60+.
   *
   * @param code - The JavaScript source to evaluate.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  injectJavascript(
    code: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('injectJavascript', { code }, options);
  }

  /**
   * Focuses a tab.
   *
   * @param tab - Zero-based tab index.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  focusTab(tab: number, options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('focusTab', { tab }, options);
  }

  /**
   * Closes a tab.
   *
   * @param tab - Zero-based tab index.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  closeTab(tab: number, options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('closeTab', { tab }, options);
  }

  /**
   * Reloads the focused tab.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  refreshTab(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('refreshTab', {}, options);
  }

  /**
   * Clears the WebView HTTP cache.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  clearCache(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('clearCache', {}, options);
  }

  /**
   * Clears local storage, session storage and IndexedDB.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  clearWebStorage(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('clearWebstorage', {}, options);
  }

  /**
   * Clears all cookies.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  clearCookies(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('clearCookies', {}, options);
  }

  /**
   * Recreates the WebView, discarding all in-memory web state.
   * Requires Fully Kiosk 1.55.3+.
   *
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  resetWebview(options?: FullyKioskRequestOptions): Promise<FullyKioskStatusResponse> {
    return this.transport.json('resetWebview', {}, options);
  }
}
