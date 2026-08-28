import { getFully, safeCall } from '../../index.js';
import { useCallback, useState } from 'react';

/**
 * Clipboard access through the JavaScript interface.
 */
export interface UseFullyClipboardResult {
  /** The most recent value read from, or written to, the clipboard. */
  value: string;
  /**
   * Reads the clipboard as plain text.
   *
   * @returns The clipboard contents.
   */
  read: () => string;
  /**
   * Reads the clipboard as HTML.
   *
   * @returns The clipboard contents as HTML.
   */
  readHtml: () => string;
  /**
   * Writes text to the clipboard.
   *
   * @param text - The text to copy.
   */
  write: (text: string) => void;
}

/**
 * Reads and writes the Android clipboard.
 *
 * Android 10 and later block clipboard access while Fully is in the background.
 *
 * @returns The clipboard value and its accessors.
 */
export function useFullyClipboard(): UseFullyClipboardResult {
  const [value, setValue] = useState('');

  const read = useCallback((): string => {
    const next = safeCall((fully) => fully.getClipboardText(), '');
    setValue(next);
    return next;
  }, []);

  const readHtml = useCallback((): string => {
    const next = safeCall((fully) => fully.getClipboardHtmlText(), '');
    setValue(next);
    return next;
  }, []);

  const write = useCallback((text: string) => {
    const fully = getFully();
    if (!fully) return;

    fully.copyTextToClipboard(text);
    setValue(text);
  }, []);

  return { value, read, readHtml, write };
}
