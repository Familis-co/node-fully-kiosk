import { useEffect, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';
import { useFullyValue } from './use-fully-value.js';

/**
 * How the device is connected to power.
 */
export type FullyPowerSource = 'ac' | 'usb' | 'wireless' | 'none';

/**
 * Battery and power state.
 */
export interface UseFullyBatteryResult {
  /** Battery charge in percent. */
  level: number;
  /** Whether the device is connected to power. */
  plugged: boolean;
  /** How the device is connected, once a plug event has been observed. */
  source: FullyPowerSource;
}

/**
 * Tracks the battery level and the power source.
 *
 * The level is seeded from `fully.getBatteryLevel()` and then updated by the
 * `onBatteryLevelChanged` event. The plug state follows the `pluggedAC`,
 * `pluggedUSB`, `pluggedWireless` and `unplugged` events.
 *
 * @param interval - Re-read the level on this interval in milliseconds, as a
 * safety net for devices that do not raise battery events.
 * @returns The battery and power state.
 *
 * @example
 * ```tsx
 * const battery = useFullyBattery();
 * return <p>{battery.level}% {battery.plugged ? `(${battery.source})` : ''}</p>;
 * ```
 */
export function useFullyBattery(interval?: number): UseFullyBatteryResult {
  const initialLevel = useFullyValue((fully) => fully.getBatteryLevel(), 0, { interval });
  const initialPlugged = useFullyValue((fully) => fully.isPlugged(), false, { interval });

  const [level, setLevel] = useState(0);
  const [source, setSource] = useState<FullyPowerSource>('none');
  const [plugged, setPlugged] = useState(false);

  useEffect(() => setLevel(initialLevel.value), [initialLevel.value]);
  useEffect(() => setPlugged(initialPlugged.value), [initialPlugged.value]);

  useFullyEvent('onBatteryLevelChanged', ({ level: next }) => setLevel(next));
  useFullyEvent('pluggedAC', () => {
    setPlugged(true);
    setSource('ac');
  });
  useFullyEvent('pluggedUSB', () => {
    setPlugged(true);
    setSource('usb');
  });
  useFullyEvent('pluggedWireless', () => {
    setPlugged(true);
    setSource('wireless');
  });
  useFullyEvent('unplugged', () => {
    setPlugged(false);
    setSource('none');
  });

  return { level, plugged, source };
}
