export {
  FullyKioskProvider,
  useFullyKioskClient,
  useOptionalFullyKioskClient,
  type FullyKioskProviderProps,
} from './context.js';

export { useActionGroup, type ActionGroupState } from './hooks/use-action-group.js';
export {
  useFullyQuery,
  type UseFullyQueryOptions,
  type UseFullyQueryResult,
} from './hooks/use-fully-query.js';
export { useFullyCommand, type UseFullyCommandResult } from './hooks/use-fully-command.js';
export { useFullyEvent, useFullyEventCount, useLatestFullyEvent } from './hooks/use-fully-event.js';
export {
  useFully,
  useFullyValue,
  useIsFullyKiosk,
  type UseFullyValueOptions,
  type UseFullyValueResult,
} from './hooks/use-fully-value.js';

export { useDeviceInfo, useDeviceReachable } from './hooks/use-device-info.js';
export { useSetting, useSettings, type UseSettingResult } from './hooks/use-settings.js';
export { useCamshot, useScreenshot } from './hooks/use-capture.js';
export {
  useKioskControl,
  useMediaControl,
  useNavigation,
  useRemoteSpeech,
  useScreenControl,
  type UseKioskControlResult,
  type UseMediaControlResult,
  type UseNavigationResult,
  type UseRemoteSpeechResult,
  type UseScreenControlResult,
} from './hooks/use-remote-controls.js';

export {
  useFullyCamshot,
  useFullyDeviceInfo,
  useFullyIdleTime,
  useFullyLocation,
  useFullyNetwork,
  useFullyScreenshot,
  useFullySensor,
  type UseFullyCaptureResult,
  type UseFullyNetworkResult,
} from './hooks/use-fully-device.js';
export {
  useFullyBrightness,
  useFullyKeyboard,
  useFullyScreen,
  useFullyScreensaver,
  type UseFullyBrightnessResult,
  type UseFullyKeyboardResult,
  type UseFullyScreenResult,
  type UseFullyScreensaverResult,
} from './hooks/use-fully-screen.js';
export {
  useFullyBattery,
  type FullyPowerSource,
  type UseFullyBatteryResult,
} from './hooks/use-fully-power.js';
export {
  useFullyBeacons,
  useFullyMotion,
  type FullyBeacon,
  type UseFullyMotionResult,
} from './hooks/use-fully-motion.js';
export {
  useFullyNfc,
  useFullyQrScanner,
  type FullyNfcTag,
  type UseFullyNfcResult,
  type UseFullyQrScannerOptions,
  type UseFullyQrScannerResult,
} from './hooks/use-fully-scanner.js';
export {
  useFullyBluetoothSerial,
  type UseFullyBluetoothSerialResult,
} from './hooks/use-fully-bluetooth.js';
export {
  useFullyTextToSpeech,
  type FullySpeakOptions,
  type UseFullyTextToSpeechResult,
} from './hooks/use-fully-speech.js';
export {
  useFullyApp,
  useFullyKioskMode,
  type UseFullyAppResult,
  type UseFullyKioskModeResult,
} from './hooks/use-fully-kiosk-mode.js';
export {
  useFullyBooleanSetting,
  useFullyStringSetting,
  type UseFullyJsSettingResult,
} from './hooks/use-fully-settings.js';
export { useFullyTabs, type UseFullyTabsResult } from './hooks/use-fully-tabs.js';
export { useFullyAudio, type UseFullyAudioResult } from './hooks/use-fully-audio.js';
export { useFullyClipboard, type UseFullyClipboardResult } from './hooks/use-fully-clipboard.js';
export { useFullyBroadcastReceiver, type FullyBroadcast } from './hooks/use-fully-broadcast.js';
export {
  useFullyDownload,
  useFullyFileList,
  type FullyTransferResult,
  type UseFullyDownloadResult,
  type UseFullyFileListResult,
} from './hooks/use-fully-files.js';

// Re-exported so consumers can build a client, catch typed errors and use the
// shared types without importing the core package separately.
export {
  AudioStream,
  createFullyKioskClient,
  FullyKioskAuthError,
  FullyKioskClient,
  FullyKioskCommandError,
  FullyKioskConnectionError,
  FullyKioskError,
  FullyKioskHttpError,
  FullyKioskTimeoutError,
  getFully,
  isFullyKiosk,
  onFullyEvent,
  type AudioStreamValue,
  type FullyEventMap,
  type FullyEventName,
  type FullyEventPayload,
  type FullyJsInterface,
  type FullyKioskClientOptions,
  type FullyKioskDeviceInfo,
  type FullyKioskSettings,
  type FullyLocalDeviceInfo,
} from '../index.js';
