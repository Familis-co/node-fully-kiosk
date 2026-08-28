/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyNfc, useFullyQrScanner } from './use-fully-scanner.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyQrScanner', () => {
  it('starts with nothing scanned', () => {
    installFully({ scanQrCode: vi.fn() });

    const { result } = renderHook(() => useFullyQrScanner());

    expect(result.current.isScanning).toBe(false);
    expect(result.current.code).toBeNull();
    expect(result.current.cancelled).toBe(false);
  });

  it('opens the scanner with the documented defaults and an empty result URL', () => {
    const scanQrCode = vi.fn();
    installFully({ scanQrCode });

    const { result } = renderHook(() => useFullyQrScanner());
    act(() => result.current.scan());

    expect(scanQrCode).toHaveBeenCalledWith('', '', -1, -1, true, true, false);
    expect(result.current.isScanning).toBe(true);
  });

  it('passes the configured appearance through', () => {
    const scanQrCode = vi.fn();
    installFully({ scanQrCode });

    const { result } = renderHook(() =>
      useFullyQrScanner({
        prompt: 'Scan a ticket',
        cameraId: 1,
        timeout: 30,
        beep: false,
        showCancelButton: false,
        useFlashlight: true,
      }),
    );
    act(() => result.current.scan());

    expect(scanQrCode).toHaveBeenCalledWith('Scan a ticket', '', 1, 30, false, false, true);
  });

  it('reports a scan through state and the callback', () => {
    const onScan = vi.fn();
    installFully({ scanQrCode: vi.fn() });

    const { result } = renderHook(() => useFullyQrScanner({ onScan }));
    act(() => result.current.scan());
    emit('onQrScanSuccess', 'TICKET-42', '{"format":"QR_CODE"}');

    expect(result.current.isScanning).toBe(false);
    expect(result.current.code).toBe('TICKET-42');
    expect(result.current.extras).toBe('{"format":"QR_CODE"}');
    expect(result.current.cancelled).toBe(false);
    expect(onScan).toHaveBeenCalledWith('TICKET-42', '{"format":"QR_CODE"}');
  });

  it('reports a cancellation and keeps the previous code', () => {
    installFully({ scanQrCode: vi.fn() });

    const { result } = renderHook(() => useFullyQrScanner());
    emit('onQrScanSuccess', 'FIRST', '');
    act(() => result.current.scan());
    emit('onQrScanCancelled');

    expect(result.current.isScanning).toBe(false);
    expect(result.current.cancelled).toBe(true);
    expect(result.current.code).toBe('FIRST');
  });

  it('clears the cancelled flag when a new scan starts', () => {
    installFully({ scanQrCode: vi.fn() });

    const { result } = renderHook(() => useFullyQrScanner());
    emit('onQrScanCancelled');
    expect(result.current.cancelled).toBe(true);

    act(() => result.current.scan());

    expect(result.current.cancelled).toBe(false);
  });

  it('clears the result through reset', () => {
    installFully({ scanQrCode: vi.fn() });

    const { result } = renderHook(() => useFullyQrScanner());
    emit('onQrScanSuccess', 'TICKET-42', 'extra');
    act(() => result.current.reset());

    expect(result.current.code).toBeNull();
    expect(result.current.extras).toBeNull();
    expect(result.current.cancelled).toBe(false);
  });

  it('stays idle outside Fully Kiosk rather than pretending to scan', () => {
    const { result } = renderHook(() => useFullyQrScanner());
    act(() => result.current.scan());

    expect(result.current.isScanning).toBe(false);
  });
});

describe('useFullyNfc', () => {
  it('only reports scanning once Fully accepted the start', () => {
    installFully({ nfcScanStart: () => false, nfcScanStop: vi.fn() });

    const { result } = renderHook(() => useFullyNfc());
    act(() => result.current.start());

    expect(result.current.isScanning).toBe(false);
  });

  it('reports scanning when Fully accepted the start', () => {
    installFully({ nfcScanStart: () => true, nfcScanStop: vi.fn() });

    const { result } = renderHook(() => useFullyNfc());
    act(() => result.current.start());

    expect(result.current.isScanning).toBe(true);
  });

  it('stops scanning on demand', () => {
    const nfcScanStop = vi.fn();
    installFully({ nfcScanStart: () => true, nfcScanStop });

    const { result } = renderHook(() => useFullyNfc());
    act(() => result.current.start());
    act(() => result.current.stop());

    expect(nfcScanStop).toHaveBeenCalledOnce();
    expect(result.current.isScanning).toBe(false);
  });

  it('starts on mount and stops on unmount when asked to auto-start', () => {
    const nfcScanStart = vi.fn(() => true);
    const nfcScanStop = vi.fn();
    installFully({ nfcScanStart, nfcScanStop });

    const { result, unmount } = renderHook(() => useFullyNfc({ autoStart: true }));
    expect(nfcScanStart).toHaveBeenCalledOnce();
    expect(result.current.isScanning).toBe(true);

    unmount();

    expect(nfcScanStop).toHaveBeenCalledOnce();
  });

  it('does not start on mount by default', () => {
    const nfcScanStart = vi.fn(() => true);
    installFully({ nfcScanStart, nfcScanStop: vi.fn() });

    renderHook(() => useFullyNfc());

    expect(nfcScanStart).not.toHaveBeenCalled();
  });

  it('reports a discovered tag with all four fields', () => {
    const onTag = vi.fn();
    installFully({ nfcScanStart: () => true, nfcScanStop: vi.fn() });

    const { result } = renderHook(() => useFullyNfc({ onTag }));
    emit('onNfcTagDiscovered', '04:AB:CD', 'MifareClassic', 'hello', 'raw-data');

    expect(result.current.tag).toMatchObject({
      serial: '04:AB:CD',
      type: 'MifareClassic',
      message: 'hello',
      data: 'raw-data',
    });
    expect(result.current.tag?.readAt).toBeTypeOf('number');
    expect(onTag).toHaveBeenCalledOnce();
  });

  it('reports an NDEF tag, which carries no technology', () => {
    installFully({ nfcScanStart: () => true, nfcScanStop: vi.fn() });

    const { result } = renderHook(() => useFullyNfc());
    emit('onNdefDiscovered', '04:11:22', 'ndef message', 'raw');

    expect(result.current.tag).toMatchObject({ serial: '04:11:22', message: 'ndef message' });
    expect(result.current.tag?.type).toBeUndefined();
  });

  it('flags a tag that left the field, and clears it on the next read', () => {
    installFully({ nfcScanStart: () => true, nfcScanStop: vi.fn() });

    const { result } = renderHook(() => useFullyNfc());
    emit('onNfcTagDiscovered', '04:AB:CD', 'MifareClassic', '', '');
    emit('onNfcTagRemoved', '04:AB:CD');
    expect(result.current.removed).toBe(true);

    emit('onNfcTagDiscovered', '04:AB:CD', 'MifareClassic', '', '');

    expect(result.current.removed).toBe(false);
  });

  it('does not throw outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyNfc());

    expect(() => act(() => result.current.start())).not.toThrow();
    expect(() => act(() => result.current.stop())).not.toThrow();
    expect(result.current.isScanning).toBe(false);
  });
});
