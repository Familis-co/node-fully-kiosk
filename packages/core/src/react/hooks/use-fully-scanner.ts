import { getFully } from '../../index.js';
import { useCallback, useEffect, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';

/**
 * Options for {@link useFullyQrScanner}.
 */
export interface UseFullyQrScannerOptions {
  /** Prompt shown above the viewfinder. */
  prompt?: string;
  /** Camera to use, or `-1` for the default. */
  cameraId?: number;
  /** Timeout in seconds, or `-1` for the default. */
  timeout?: number;
  /** Beep on a successful scan. Defaults to `true`. */
  beep?: boolean;
  /** Show a cancel button. Defaults to `true`. */
  showCancelButton?: boolean;
  /** Turn the flashlight on while scanning. Defaults to `false`. */
  useFlashlight?: boolean;
  /** Called with each scanned code. */
  onScan?: (code: string, extras: string) => void;
}

/**
 * Barcode scanner state and control.
 */
export interface UseFullyQrScannerResult {
  /** Opens the built-in barcode scanner. */
  scan: () => void;
  /** `true` between opening the scanner and the first result or cancellation. */
  isScanning: boolean;
  /** The most recently scanned code, or `null`. */
  code: string | null;
  /** Extra data delivered with the most recent scan. */
  extras: string | null;
  /** `true` when the last scan was cancelled by the user. */
  cancelled: boolean;
  /** Clears `code`, `extras` and `cancelled`. */
  reset: () => void;
}

/**
 * Drives Fully's built-in barcode scanner and receives results through the
 * `onQrScanSuccess` event rather than a result URL.
 *
 * @param options - Scanner appearance and behaviour, plus an `onScan` callback.
 * @returns The scanner state and its trigger.
 *
 * @example
 * ```tsx
 * const scanner = useFullyQrScanner({ prompt: 'Scan a ticket' });
 * <button onClick={scanner.scan} disabled={scanner.isScanning}>Scan</button>
 * <p>{scanner.code}</p>
 * ```
 */
export function useFullyQrScanner(options: UseFullyQrScannerOptions = {}): UseFullyQrScannerResult {
  const {
    prompt = '',
    cameraId = -1,
    timeout = -1,
    beep = true,
    showCancelButton = true,
    useFlashlight = false,
    onScan,
  } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [extras, setExtras] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  useFullyEvent('onQrScanSuccess', (payload) => {
    setIsScanning(false);
    setCancelled(false);
    setCode(payload.code);
    setExtras(payload.extras);
    onScan?.(payload.code, payload.extras);
  });

  useFullyEvent('onQrScanCancelled', () => {
    setIsScanning(false);
    setCancelled(true);
  });

  const scan = useCallback(() => {
    const fully = getFully();
    if (!fully) return;

    setCancelled(false);
    setIsScanning(true);
    // An empty result URL keeps the result on the event channel.
    fully.scanQrCode(prompt, '', cameraId, timeout, beep, showCancelButton, useFlashlight);
  }, [prompt, cameraId, timeout, beep, showCancelButton, useFlashlight]);

  const reset = useCallback(() => {
    setCode(null);
    setExtras(null);
    setCancelled(false);
  }, []);

  return { scan, isScanning, code, extras, cancelled, reset };
}

/**
 * An NFC tag seen by the device.
 */
export interface FullyNfcTag {
  /** Serial number of the tag. */
  serial: string;
  /** Tag technology, when reported. */
  type?: string;
  /** NDEF message, when the tag carries one. */
  message?: string;
  /** Raw tag data. */
  data?: string;
  /** When the tag was read, in milliseconds since the epoch. */
  readAt: number;
}

/**
 * NFC scanning state and control.
 */
export interface UseFullyNfcResult {
  /** Starts NFC scanning. */
  start: () => void;
  /** Stops NFC scanning. */
  stop: () => void;
  /** Whether scanning was started through this hook. */
  isScanning: boolean;
  /** The most recently read tag, or `null`. */
  tag: FullyNfcTag | null;
  /** Whether the last seen tag has left the field. */
  removed: boolean;
}

/**
 * Reads NFC tags through the JavaScript interface.
 *
 * NFC usually does not work while the screen is locked or the camera is in use.
 *
 * @param options - Whether to start scanning on mount, and a tag callback.
 * @returns The NFC state and its controls.
 */
export function useFullyNfc(
  options: { autoStart?: boolean; onTag?: (tag: FullyNfcTag) => void } = {},
): UseFullyNfcResult {
  const { autoStart = false, onTag } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [tag, setTag] = useState<FullyNfcTag | null>(null);
  const [removed, setRemoved] = useState(false);

  const start = useCallback(() => {
    if (getFully()?.nfcScanStart()) setIsScanning(true);
  }, []);

  const stop = useCallback(() => {
    getFully()?.nfcScanStop();
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    start();
    return stop;
  }, [autoStart, start, stop]);

  useFullyEvent('onNfcTagDiscovered', ({ serial, type, message, data }) => {
    const next: FullyNfcTag = { serial, type, message, data, readAt: Date.now() };
    setRemoved(false);
    setTag(next);
    onTag?.(next);
  });

  useFullyEvent('onNdefDiscovered', ({ serial, message, data }) => {
    const next: FullyNfcTag = { serial, message, data, readAt: Date.now() };
    setRemoved(false);
    setTag(next);
    onTag?.(next);
  });

  useFullyEvent('onNfcTagRemoved', () => setRemoved(true));

  return { start, stop, isScanning, tag, removed };
}
