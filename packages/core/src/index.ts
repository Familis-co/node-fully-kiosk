export { createFullyKioskClient, FullyKioskClient } from './client.js';
export {
  DEFAULT_PORT,
  DEFAULT_RETRIES,
  DEFAULT_RETRY_DELAY,
  DEFAULT_TIMEOUT,
  FullyKioskTransport,
  redactUrl,
} from './http.js';
export {
  FullyKioskAuthError,
  FullyKioskCommandError,
  FullyKioskConnectionError,
  FullyKioskError,
  FullyKioskHttpError,
  FullyKioskParseError,
  FullyKioskTimeoutError,
} from './errors.js';
export { toBase64, toDataUrl } from './utils.js';

export { AppCommands } from './commands/apps.js';
export { BrowserCommands, type LoadUrlOptions } from './commands/browser.js';
export { CaptureCommands } from './commands/capture.js';
export { DeviceCommands } from './commands/device.js';
export { FileCommands } from './commands/files.js';
export { KioskCommands } from './commands/kiosk.js';
export { MediaCommands, type PlayVideoOptions } from './commands/media.js';
export { MotionCommands } from './commands/motion.js';
export { ScreenCommands } from './commands/screen.js';
export { SettingsCommands } from './commands/settings.js';
export { SpeechCommands, type SpeakOptions } from './commands/speech.js';
export { SystemCommands } from './commands/system.js';

export * from './types/index.js';
export * from './js-interface/index.js';
