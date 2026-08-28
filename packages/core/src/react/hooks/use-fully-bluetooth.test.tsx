/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyBluetoothSerial } from './use-fully-bluetooth.js';

afterEach(() => {
  resetFully();
  cleanup();
});

/**
 * Interface members for a Bluetooth serial connection that can be opened and
 * closed, so the hook's refresh-after-action behaviour is observable.
 *
 * @returns The members plus the spies the tests assert on.
 */
function bluetoothStub() {
  let connected = false;

  return {
    connect: () => {
      connected = true;
    },
    btIsConnected: () => connected,
    btOpenByMac: vi.fn(),
    btOpenByName: vi.fn(),
    btOpenByUuid: vi.fn(),
    btClose: vi.fn(() => {
      connected = false;
    }),
    btSendStringData: vi.fn(() => true),
    btSendHexData: vi.fn(() => true),
    btGetDeviceListJson: () => '[{"name":"Printer001"}]',
  };
}

describe('useFullyBluetoothSerial', () => {
  it('starts disconnected', () => {
    installFully(bluetoothStub());

    const { result } = renderHook(() => useFullyBluetoothSerial());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.device).toBeNull();
    expect(result.current.lines).toEqual([]);
    expect(result.current.lastLine).toBeNull();
  });

  it('opens by MAC, name and UUID', () => {
    const stub = bluetoothStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyBluetoothSerial());
    act(() => result.current.openByMac('AA:BB:CC:DD:EE:FF'));
    act(() => result.current.openByName('Printer001'));
    act(() => result.current.openByUuid('00001101-0000-1000-8000-00805f9b34fb'));

    expect(stub.btOpenByMac).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF');
    expect(stub.btOpenByName).toHaveBeenCalledWith('Printer001');
    expect(stub.btOpenByUuid).toHaveBeenCalledWith('00001101-0000-1000-8000-00805f9b34fb');
  });

  it('is connecting until the connect event settles it', () => {
    const stub = bluetoothStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyBluetoothSerial());
    act(() => result.current.openByName('Printer001'));
    expect(result.current.isConnecting).toBe(true);

    stub.connect();
    emit('onBtConnectSuccess', 'Printer001');

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.device).toBe('Printer001');
    expect(result.current.failed).toBe(false);
  });

  it('reports a failed connection attempt', () => {
    installFully(bluetoothStub());

    const { result } = renderHook(() => useFullyBluetoothSerial());
    act(() => result.current.openByName('Printer001'));
    emit('onBtConnectFailure');

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.failed).toBe(true);
    expect(result.current.device).toBeNull();
  });

  it('clears a previous failure when a new attempt starts', () => {
    installFully(bluetoothStub());

    const { result } = renderHook(() => useFullyBluetoothSerial());
    emit('onBtConnectFailure');
    expect(result.current.failed).toBe(true);

    act(() => result.current.openByName('Printer001'));

    expect(result.current.failed).toBe(false);
  });

  it('buffers received lines and reports the newest, calling back for each', () => {
    const onData = vi.fn();
    installFully(bluetoothStub());

    const { result } = renderHook(() => useFullyBluetoothSerial({ onData }));
    emit('onBtDataRead', 'first line');
    emit('onBtDataRead', 'second line');

    expect(result.current.lines).toEqual(['first line', 'second line']);
    expect(result.current.lastLine).toBe('second line');
    expect(onData).toHaveBeenCalledTimes(2);
  });

  it('clears the buffered lines', () => {
    installFully(bluetoothStub());

    const { result } = renderHook(() => useFullyBluetoothSerial());
    emit('onBtDataRead', 'a line');
    act(() => result.current.clear());

    expect(result.current.lines).toEqual([]);
    expect(result.current.lastLine).toBeNull();
  });

  it('closes the connection and forgets the device', () => {
    const stub = bluetoothStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyBluetoothSerial());
    stub.connect();
    emit('onBtConnectSuccess', 'Printer001');

    act(() => result.current.close());

    expect(stub.btClose).toHaveBeenCalledOnce();
    expect(result.current.device).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it('sends string and hex payloads', () => {
    const stub = bluetoothStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyBluetoothSerial());
    let sentString = false;
    let sentHex = false;
    act(() => {
      sentString = result.current.sendString('Hello\n');
      sentHex = result.current.sendHex('1B40');
    });

    expect(stub.btSendStringData).toHaveBeenCalledWith('Hello\n');
    expect(stub.btSendHexData).toHaveBeenCalledWith('1B40');
    expect(sentString).toBe(true);
    expect(sentHex).toBe(true);
  });

  it('lists the known devices', () => {
    installFully(bluetoothStub());

    const { result } = renderHook(() => useFullyBluetoothSerial());
    let devices: unknown[] = [];
    act(() => {
      devices = result.current.listDevices();
    });

    expect(devices).toEqual([{ name: 'Printer001' }]);
  });

  it('reports a send as failed outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyBluetoothSerial());

    let sentString = true;
    let sentHex = true;
    act(() => {
      sentString = result.current.sendString('Hello');
      sentHex = result.current.sendHex('1B40');
    });

    expect(sentString).toBe(false);
    expect(sentHex).toBe(false);
    expect(result.current.listDevices()).toEqual([]);
  });

  it('does not claim to be connecting outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyBluetoothSerial());
    act(() => result.current.openByName('Printer001'));

    expect(result.current.isConnecting).toBe(false);
  });
});
