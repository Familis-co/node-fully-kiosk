/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import {
  useFullyBrightness,
  useFullyKeyboard,
  useFullyScreen,
  useFullyScreensaver,
} from './use-fully-screen.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyScreen', () => {
  it('forwards turnOn and forceSleep to the interface', () => {
    const turnScreenOn = vi.fn();
    const forceSleep = vi.fn();
    installFully({ getScreenOn: () => false, turnScreenOn, forceSleep });

    const { result } = renderHook(() => useFullyScreen());
    act(() => result.current.turnOn());
    act(() => result.current.forceSleep());

    expect(turnScreenOn).toHaveBeenCalledOnce();
    expect(forceSleep).toHaveBeenCalledOnce();
  });

  it('leaves turnOff without an argument for Fully to default', () => {
    const turnScreenOff = vi.fn();
    installFully({ getScreenOn: () => true, turnScreenOff });

    const { result } = renderHook(() => useFullyScreen());
    act(() => result.current.turnOff());

    expect(turnScreenOff).toHaveBeenCalledWith(undefined);
  });

  it('does not throw outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyScreen());

    expect(result.current.isOn).toBe(false);
    expect(() => act(() => result.current.turnOn())).not.toThrow();
    expect(() => act(() => result.current.turnOff(true))).not.toThrow();
    expect(() => act(() => result.current.forceSleep())).not.toThrow();
  });
});

describe('useFullyBrightness', () => {
  it('reads the current brightness on mount', () => {
    installFully({ getScreenBrightness: () => 128 });

    const { result } = renderHook(() => useFullyBrightness());

    expect(result.current.brightness).toBe(128);
  });

  it('writes a new level and re-reads it', () => {
    let level = 30;
    const setScreenBrightness = vi.fn((next: number) => {
      level = next;
    });
    installFully({ getScreenBrightness: () => level, setScreenBrightness });

    const { result } = renderHook(() => useFullyBrightness());
    act(() => result.current.setBrightness(200));

    expect(setScreenBrightness).toHaveBeenCalledWith(200);
    expect(result.current.brightness).toBe(200);
  });

  it('passes -1 through as the system default', () => {
    const setScreenBrightness = vi.fn();
    installFully({ getScreenBrightness: () => 10, setScreenBrightness });

    const { result } = renderHook(() => useFullyBrightness());
    act(() => result.current.setBrightness(-1));

    expect(setScreenBrightness).toHaveBeenCalledWith(-1);
  });
});

describe('useFullyScreensaver', () => {
  it('follows the screensaver and daydream events independently', () => {
    installFully();
    const { result } = renderHook(() => useFullyScreensaver());

    expect(result.current.isActive).toBe(false);
    expect(result.current.isDaydreaming).toBe(false);

    emit('onScreensaverStart');
    expect(result.current.isActive).toBe(true);
    expect(result.current.isDaydreaming).toBe(false);

    emit('onDaydreamStart');
    expect(result.current.isDaydreaming).toBe(true);

    emit('onScreensaverStop');
    expect(result.current.isActive).toBe(false);
    expect(result.current.isDaydreaming).toBe(true);

    emit('onDaydreamStop');
    expect(result.current.isDaydreaming).toBe(false);
  });

  it('forwards each control to its interface member', () => {
    const members = {
      startScreensaver: vi.fn(),
      stopScreensaver: vi.fn(),
      startDaydream: vi.fn(),
      stopDaydream: vi.fn(),
    };
    installFully(members);

    const { result } = renderHook(() => useFullyScreensaver());
    act(() => result.current.start());
    act(() => result.current.stop());
    act(() => result.current.startDaydream());
    act(() => result.current.stopDaydream());

    expect(members.startScreensaver).toHaveBeenCalledOnce();
    expect(members.stopScreensaver).toHaveBeenCalledOnce();
    expect(members.startDaydream).toHaveBeenCalledOnce();
    expect(members.stopDaydream).toHaveBeenCalledOnce();
  });
});

describe('useFullyKeyboard', () => {
  it('seeds from the device and follows the keyboard events', () => {
    installFully({ isKeyboardVisible: () => true });

    const { result } = renderHook(() => useFullyKeyboard());
    expect(result.current.isVisible).toBe(true);

    emit('hideKeyboard');
    expect(result.current.isVisible).toBe(false);

    emit('showKeyboard');
    expect(result.current.isVisible).toBe(true);
  });

  it('forwards show and hide to the interface', () => {
    const showKeyboard = vi.fn();
    const hideKeyboard = vi.fn();
    installFully({ isKeyboardVisible: () => false, showKeyboard, hideKeyboard });

    const { result } = renderHook(() => useFullyKeyboard());
    act(() => result.current.show());
    act(() => result.current.hide());

    expect(showKeyboard).toHaveBeenCalledOnce();
    expect(hideKeyboard).toHaveBeenCalledOnce();
  });
});
