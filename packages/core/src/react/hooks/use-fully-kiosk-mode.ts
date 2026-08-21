import { getFully } from '../../index.js';
import { useCallback, useState } from 'react';
import { useFullyValue } from './use-fully-value.js';

/**
 * Kiosk and maintenance mode state and control through the JavaScript interface.
 */
export interface UseFullyKioskModeResult {
  /** Whether kiosk mode is currently locked. */
  isLocked: boolean;
  /** Whether maintenance mode was entered through this hook. */
  isMaintenance: boolean;
  /** Locks kiosk mode. */
  lock: () => void;
  /** Unlocks kiosk mode. */
  unlock: () => void;
  /** Prompts the user for the kiosk PIN. */
  checkPin: () => void;
  /** Enters maintenance mode. */
  enableMaintenance: () => void;
  /** Leaves maintenance mode. */
  disableMaintenance: () => void;
  /**
   * Shows a message overlay on top of the page.
   *
   * @param text - The message, or an empty string to clear it.
   */
  setOverlayMessage: (text: string) => void;
  /** Re-reads the lock state from the device. */
  refresh: () => boolean;
}

/**
 * Controls kiosk mode, maintenance mode and the message overlay from inside the
 * kiosk page.
 *
 * @param interval - Re-read the lock state on this interval in milliseconds.
 * @returns The kiosk state and its controls.
 */
export function useFullyKioskMode(interval?: number): UseFullyKioskModeResult {
  const locked = useFullyValue((fully) => fully.isKioskLocked(), false, { interval });
  const [isMaintenance, setIsMaintenance] = useState(false);

  return {
    isLocked: locked.value,
    isMaintenance,
    lock: useCallback(() => {
      getFully()?.lockKiosk();
      locked.refresh();
    }, [locked]),
    unlock: useCallback(() => {
      getFully()?.unlockKiosk();
      locked.refresh();
    }, [locked]),
    checkPin: useCallback(() => getFully()?.checkKioskPin(), []),
    enableMaintenance: useCallback(() => {
      getFully()?.enableMaintenanceMode();
      setIsMaintenance(true);
    }, []),
    disableMaintenance: useCallback(() => {
      getFully()?.disableMaintenanceMode();
      setIsMaintenance(false);
    }, []),
    setOverlayMessage: useCallback((text: string) => getFully()?.setMessageOverlay(text), []),
    refresh: locked.refresh,
  };
}

/**
 * Fully app lifecycle control through the JavaScript interface.
 */
export interface UseFullyAppResult {
  /** Whether Fully is in the foreground. */
  isInForeground: boolean;
  /**
   * Brings Fully to the foreground.
   *
   * @param delayMs - Optional delay in milliseconds.
   */
  bringToForeground: (delayMs?: number) => void;
  /** Sends Fully to the background. */
  bringToBackground: () => void;
  /** Restarts the Fully app. */
  restart: () => void;
  /** Closes the Fully app. */
  exit: () => void;
  /**
   * Launches another installed application.
   *
   * @param packageName - Android package name.
   */
  startApplication: (packageName: string) => void;
  /**
   * Starts an Android intent from an intent URL.
   *
   * @param url - The intent URL.
   */
  startIntent: (url: string) => void;
  /**
   * Shows an Android toast.
   *
   * @param text - The message to show.
   */
  showToast: (text: string) => void;
  /**
   * Shows an Android notification.
   *
   * @param title - Notification title.
   * @param text - Notification body.
   * @param url - URL opened when the notification is tapped.
   * @param highPriority - Show as a heads-up notification.
   */
  showNotification: (title: string, text: string, url?: string, highPriority?: boolean) => void;
  /**
   * Vibrates the device.
   *
   * @param millis - Duration in milliseconds.
   */
  vibrate: (millis: number) => void;
}

/**
 * Controls the Fully app itself and launches other apps from inside the kiosk
 * page.
 *
 * @param interval - Re-read the foreground state on this interval in milliseconds.
 * @returns The app controls and their state.
 */
export function useFullyApp(interval?: number): UseFullyAppResult {
  const foreground = useFullyValue((fully) => fully.isInForeground(), false, { interval });

  return {
    isInForeground: foreground.value,
    bringToForeground: useCallback((delayMs?: number) => {
      getFully()?.bringToForeground(delayMs);
    }, []),
    bringToBackground: useCallback(() => getFully()?.bringToBackground(), []),
    restart: useCallback(() => getFully()?.restartApp(), []),
    exit: useCallback(() => getFully()?.exit(), []),
    startApplication: useCallback((packageName: string) => {
      getFully()?.startApplication(packageName);
    }, []),
    startIntent: useCallback((url: string) => getFully()?.startIntent(url), []),
    showToast: useCallback((text: string) => getFully()?.showToast(text), []),
    showNotification: useCallback((title: string, text: string, url = '', highPriority = false) => {
      getFully()?.showNotification(title, text, url, highPriority);
    }, []),
    vibrate: useCallback((millis: number) => getFully()?.vibrate(millis), []),
  };
}
