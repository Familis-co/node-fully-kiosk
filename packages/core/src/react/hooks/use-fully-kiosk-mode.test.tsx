/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installFully, resetFully } from '../test-support.js';
import { useFullyApp, useFullyKioskMode } from './use-fully-kiosk-mode.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyKioskMode', () => {
  it('reads the lock state on mount', () => {
    installFully({ isKioskLocked: () => true });

    const { result } = renderHook(() => useFullyKioskMode());

    expect(result.current.isLocked).toBe(true);
  });

  it('re-reads the lock state after locking and unlocking', () => {
    let locked = false;
    installFully({
      isKioskLocked: () => locked,
      lockKiosk: () => {
        locked = true;
      },
      unlockKiosk: () => {
        locked = false;
      },
    });

    const { result } = renderHook(() => useFullyKioskMode());
    expect(result.current.isLocked).toBe(false);

    act(() => result.current.lock());
    expect(result.current.isLocked).toBe(true);

    act(() => result.current.unlock());
    expect(result.current.isLocked).toBe(false);
  });

  it('tracks maintenance mode entered through the hook', () => {
    const enableMaintenanceMode = vi.fn();
    const disableMaintenanceMode = vi.fn();
    installFully({ isKioskLocked: () => true, enableMaintenanceMode, disableMaintenanceMode });

    const { result } = renderHook(() => useFullyKioskMode());
    expect(result.current.isMaintenance).toBe(false);

    act(() => result.current.enableMaintenance());
    expect(result.current.isMaintenance).toBe(true);
    expect(enableMaintenanceMode).toHaveBeenCalledOnce();

    act(() => result.current.disableMaintenance());
    expect(result.current.isMaintenance).toBe(false);
    expect(disableMaintenanceMode).toHaveBeenCalledOnce();
  });

  it('forwards the PIN prompt and the overlay message', () => {
    const checkKioskPin = vi.fn();
    const setMessageOverlay = vi.fn();
    installFully({ isKioskLocked: () => true, checkKioskPin, setMessageOverlay });

    const { result } = renderHook(() => useFullyKioskMode());
    act(() => result.current.checkPin());
    act(() => result.current.setOverlayMessage('Back in 5 minutes'));
    act(() => result.current.setOverlayMessage(''));

    expect(checkKioskPin).toHaveBeenCalledOnce();
    expect(setMessageOverlay).toHaveBeenNthCalledWith(1, 'Back in 5 minutes');
    expect(setMessageOverlay).toHaveBeenNthCalledWith(2, '');
  });

  it('does not throw outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyKioskMode());

    expect(result.current.isLocked).toBe(false);
    expect(() => act(() => result.current.lock())).not.toThrow();
    expect(() => act(() => result.current.checkPin())).not.toThrow();
  });
});

describe('useFullyApp', () => {
  it('reads the foreground state on mount', () => {
    installFully({ isInForeground: () => true });

    const { result } = renderHook(() => useFullyApp());

    expect(result.current.isInForeground).toBe(true);
  });

  it('forwards the lifecycle controls', () => {
    const members = {
      isInForeground: () => false,
      bringToForeground: vi.fn(),
      bringToBackground: vi.fn(),
      restartApp: vi.fn(),
      exit: vi.fn(),
    };
    installFully(members);

    const { result } = renderHook(() => useFullyApp());
    act(() => result.current.bringToForeground(500));
    act(() => result.current.bringToBackground());
    act(() => result.current.restart());
    act(() => result.current.exit());

    expect(members.bringToForeground).toHaveBeenCalledWith(500);
    expect(members.bringToBackground).toHaveBeenCalledOnce();
    expect(members.restartApp).toHaveBeenCalledOnce();
    expect(members.exit).toHaveBeenCalledOnce();
  });

  it('launches other apps and intents', () => {
    const startApplication = vi.fn();
    const startIntent = vi.fn();
    installFully({ isInForeground: () => true, startApplication, startIntent });

    const { result } = renderHook(() => useFullyApp());
    act(() => result.current.startApplication('com.example.app'));
    act(() => result.current.startIntent('intent://scan#Intent;end'));

    expect(startApplication).toHaveBeenCalledWith('com.example.app');
    expect(startIntent).toHaveBeenCalledWith('intent://scan#Intent;end');
  });

  it('defaults the optional notification arguments', () => {
    const showNotification = vi.fn();
    const showToast = vi.fn();
    const vibrate = vi.fn();
    installFully({ isInForeground: () => true, showNotification, showToast, vibrate });

    const { result } = renderHook(() => useFullyApp());
    act(() => result.current.showNotification('Order ready', 'Table 4'));
    act(() => result.current.showToast('Saved'));
    act(() => result.current.vibrate(200));

    expect(showNotification).toHaveBeenCalledWith('Order ready', 'Table 4', '', false);
    expect(showToast).toHaveBeenCalledWith('Saved');
    expect(vibrate).toHaveBeenCalledWith(200);
  });

  it('passes an explicit notification URL and priority through', () => {
    const showNotification = vi.fn();
    installFully({ isInForeground: () => true, showNotification });

    const { result } = renderHook(() => useFullyApp());
    act(() => result.current.showNotification('Alert', 'Now', 'https://example.test', true));

    expect(showNotification).toHaveBeenCalledWith('Alert', 'Now', 'https://example.test', true);
  });
});
