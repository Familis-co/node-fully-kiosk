/**
 * Helper that keeps editor autocompletion for well-known keys while still
 * accepting any of the 350+ setting keys Fully Kiosk exposes.
 */
type LooseKey<T extends string> = T | (string & {});

/**
 * Well-known Fully Kiosk settings that hold a string value.
 *
 * The authoritative list is visible in the Remote Admin interface of the
 * device, or in a settings JSON file exported from the app.
 */
export type FullyKioskStringSettingKey = LooseKey<
  | 'startURL'
  | 'screenBrightness'
  | 'screensaverBrightness'
  | 'screensaverWallpaperURL'
  | 'timeToScreensaverV2'
  | 'screenOffTimer'
  | 'kioskExitGesture'
  | 'launcherBackgroundColor'
>;

/**
 * Well-known Fully Kiosk settings that hold a boolean value.
 */
export type FullyKioskBooleanSettingKey = LooseKey<
  | 'motionDetection'
  | 'kioskMode'
  | 'showStatusBar'
  | 'showNavigationBar'
  | 'screensaverOnBattery'
  | 'sleepOnPowerDisconnect'
  | 'keepScreenOn'
  | 'showActionBar'
>;

/**
 * Any Fully Kiosk setting key.
 */
export type FullyKioskSettingKey = FullyKioskStringSettingKey | FullyKioskBooleanSettingKey;

/**
 * Snapshot of the device settings returned by the `listSettings` command.
 */
export type FullyKioskSettings = Record<string, string | number | boolean | null>;

/**
 * Android audio stream identifiers accepted by volume and sound commands.
 */
export const AudioStream = {
  VoiceCall: 0,
  System: 1,
  Ring: 2,
  Music: 3,
  Alarm: 4,
  Notification: 5,
  Bluetooth: 6,
  Dtmf: 8,
  TextToSpeech: 9,
  Accessibility: 10,
} as const;

/**
 * An Android audio stream identifier.
 */
export type AudioStreamValue = (typeof AudioStream)[keyof typeof AudioStream];
