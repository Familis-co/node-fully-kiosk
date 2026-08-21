import { getFully } from '../../index.js';
import { useCallback, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';
import { useFullyValue } from './use-fully-value.js';

/**
 * Motion detection state and control.
 */
export interface UseFullyMotionResult {
  /** How often motion was detected since mount. Fully raises at most one event per second. */
  count: number;
  /** When motion was last detected, in milliseconds since the epoch. */
  lastMotionAt: number | null;
  /** Whether motion detection is running on the device. */
  isRunning: boolean;
  /** Number of faces currently detected. Requires Fully Kiosk 1.48+. */
  faces: number;
  /** Whether the camera image is dark. Requires "screen off on darkness". */
  isDark: boolean;
  /** Starts motion detection. */
  start: () => void;
  /** Stops motion detection. */
  stop: () => void;
  /** Simulates a motion event on the device. */
  trigger: () => void;
}

/**
 * Tracks motion detection through the JavaScript interface.
 *
 * @param options - Polling interval for the running state.
 * @returns The motion state and its controls.
 *
 * @example
 * ```tsx
 * const motion = useFullyMotion();
 * useEffect(() => { if (motion.count) wakeUi(); }, [motion.count]);
 * ```
 */
export function useFullyMotion(options: { interval?: number } = {}): UseFullyMotionResult {
  const running = useFullyValue((fully) => fully.isMotionDetectionRunning(), false, {
    interval: options.interval,
  });

  const [count, setCount] = useState(0);
  const [lastMotionAt, setLastMotionAt] = useState<number | null>(null);
  const [faces, setFaces] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useFullyEvent('onMotion', () => {
    setCount((current) => current + 1);
    setLastMotionAt(Date.now());
  });
  useFullyEvent('facesDetected', ({ number }) => setFaces(number));
  useFullyEvent('onDarkness', () => setIsDark(true));

  const start = useCallback(() => {
    getFully()?.startMotionDetection();
    running.refresh();
    setIsDark(false);
  }, [running]);

  const stop = useCallback(() => {
    getFully()?.stopMotionDetection();
    running.refresh();
  }, [running]);

  return {
    count,
    lastMotionAt,
    isRunning: running.value,
    faces,
    isDark,
    start,
    stop,
    trigger: useCallback(() => getFully()?.triggerMotion(), []),
  };
}

/**
 * A beacon seen by the device.
 */
export interface FullyBeacon {
  /** First beacon identifier, usually the UUID. */
  id1: string;
  /** Second beacon identifier, usually the major. */
  id2: string;
  /** Third beacon identifier, usually the minor. */
  id3: string;
  /** Estimated distance in meters. */
  distance: number;
  /** When the beacon was last seen, in milliseconds since the epoch. */
  seenAt: number;
}

/**
 * Collects the iBeacons currently in range.
 *
 * Beacons are keyed by their three identifiers and dropped once they have not
 * been seen for `ttl` milliseconds.
 *
 * @param ttl - How long a beacon stays in the list without being seen again.
 * Defaults to 30 seconds.
 * @returns The beacons in range, most recently seen first.
 */
export function useFullyBeacons(ttl = 30_000): FullyBeacon[] {
  const [beacons, setBeacons] = useState<FullyBeacon[]>([]);

  useFullyEvent('onIBeacon', ({ id1, id2, id3, distance }) => {
    const seenAt = Date.now();
    setBeacons((current) => {
      const key = `${id1}/${id2}/${id3}`;
      const kept = current.filter(
        (beacon) =>
          `${beacon.id1}/${beacon.id2}/${beacon.id3}` !== key && seenAt - beacon.seenAt < ttl,
      );
      return [{ id1, id2, id3, distance, seenAt }, ...kept];
    });
  });

  return beacons;
}
