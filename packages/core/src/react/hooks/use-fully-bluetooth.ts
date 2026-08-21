import { getFully, safeJsonCall } from '../../index.js';
import { useCallback, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';
import { useFullyValue } from './use-fully-value.js';

/**
 * Bluetooth serial (SPP) connection state and control.
 */
export interface UseFullyBluetoothSerialResult {
  /** Whether a serial connection is open. */
  isConnected: boolean;
  /** Whether a connection attempt is in progress. */
  isConnecting: boolean;
  /** The name of the connected device, as reported by the connect event. */
  device: string | null;
  /** `true` when the last connection attempt failed. */
  failed: boolean;
  /** Every line received so far, buffered by Fully until a line feed arrives. */
  lines: string[];
  /** The most recently received line. */
  lastLine: string | null;
  /**
   * Opens a connection by MAC address.
   *
   * @param mac - MAC address of the target device.
   */
  openByMac: (mac: string) => void;
  /**
   * Opens a connection by device name.
   *
   * @param name - Name of the target device.
   */
  openByName: (name: string) => void;
  /**
   * Opens a connection by service UUID.
   *
   * @param uuid - Service UUID of the target device.
   */
  openByUuid: (uuid: string) => void;
  /** Closes the connection. */
  close: () => void;
  /**
   * Sends a string over the connection.
   *
   * @param data - The payload to send.
   * @returns Whether Fully accepted the payload.
   */
  sendString: (data: string) => boolean;
  /**
   * Sends hex encoded bytes over the connection.
   *
   * @param hex - The payload as a hex string.
   * @returns Whether Fully accepted the payload.
   */
  sendHex: (hex: string) => boolean;
  /** Lists the known Bluetooth devices. */
  listDevices: () => unknown[];
  /** Clears the received lines. */
  clear: () => void;
}

/**
 * Drives a Bluetooth serial connection, for example to a receipt printer or a
 * scale. GATT devices are not supported by Fully.
 *
 * @param options - Interval for polling the connection state, and a data callback.
 * @returns The connection state and its controls.
 *
 * @example
 * ```tsx
 * const bt = useFullyBluetoothSerial();
 * <button onClick={() => bt.openByName('Printer001')}>Connect</button>
 * <button onClick={() => bt.sendString('Hello\n')} disabled={!bt.isConnected}>Print</button>
 * ```
 */
export function useFullyBluetoothSerial(
  options: { interval?: number; onData?: (line: string) => void } = {},
): UseFullyBluetoothSerialResult {
  const connected = useFullyValue((fully) => fully.btIsConnected(), false, {
    interval: options.interval,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useFullyEvent('onBtConnectSuccess', (payload) => {
    setIsConnecting(false);
    setFailed(false);
    setDevice(payload.device);
    connected.refresh();
  });

  useFullyEvent('onBtConnectFailure', () => {
    setIsConnecting(false);
    setFailed(true);
    setDevice(null);
    connected.refresh();
  });

  useFullyEvent('onBtDataRead', ({ data }) => {
    setLines((current) => [...current, data]);
    options.onData?.(data);
  });

  const open = useCallback(
    (openWith: (fully: NonNullable<ReturnType<typeof getFully>>) => void) => {
      const fully = getFully();
      if (!fully) return;
      setFailed(false);
      setIsConnecting(true);
      openWith(fully);
    },
    [],
  );

  return {
    isConnected: connected.value,
    isConnecting,
    device,
    failed,
    lines,
    lastLine: lines.at(-1) ?? null,
    openByMac: useCallback((mac: string) => open((fully) => fully.btOpenByMac(mac)), [open]),
    openByName: useCallback((name: string) => open((fully) => fully.btOpenByName(name)), [open]),
    openByUuid: useCallback((uuid: string) => open((fully) => fully.btOpenByUuid(uuid)), [open]),
    close: useCallback(() => {
      getFully()?.btClose();
      setDevice(null);
      connected.refresh();
    }, [connected]),
    sendString: useCallback((data: string) => getFully()?.btSendStringData(data) ?? false, []),
    sendHex: useCallback((hex: string) => getFully()?.btSendHexData(hex) ?? false, []),
    listDevices: useCallback(
      () => safeJsonCall<unknown[]>((fully) => fully.btGetDeviceListJson(), []),
      [],
    ),
    clear: useCallback(() => setLines([]), []),
  };
}
