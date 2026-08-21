/**
 * Type of a single event placeholder, used to coerce the string Fully passes
 * into the value the listener receives.
 */
export type FullyEventArgType = 'string' | 'number';

/**
 * One placeholder of an event: the property name it becomes on the payload and
 * the type it is coerced to.
 */
export type FullyEventArg = readonly [name: string, type: FullyEventArgType];

/**
 * Every event Fully Kiosk can raise through `fully.bind`, together with the
 * `$placeholders` it substitutes into the handler source.
 *
 * The order matters: placeholders are passed positionally and mapped back onto
 * named payload properties in that order.
 *
 * @see https://www.fully-kiosk.com/en/#websiteintegration
 */
export const FULLY_EVENTS = {
  /** The screen was turned on. */
  screenOn: [],
  /** The screen was turned off. */
  screenOff: [],
  /** The soft keyboard became visible. */
  showKeyboard: [],
  /** The soft keyboard was hidden. */
  hideKeyboard: [],
  /** The device lost its network connection. */
  networkDisconnect: [],
  /** The device regained its network connection. */
  networkReconnect: [],
  /** The device lost Internet access. */
  internetDisconnect: [],
  /** The device regained Internet access. */
  internetReconnect: [],
  /** The device was disconnected from power. */
  unplugged: [],
  /** The device was connected to an AC charger. */
  pluggedAC: [],
  /** The device was connected to USB power. */
  pluggedUSB: [],
  /** The device was placed on a wireless charger. */
  pluggedWireless: [],
  /** The Fully screensaver started. */
  onScreensaverStart: [],
  /** The Fully screensaver stopped. */
  onScreensaverStop: [],
  /** The Android daydream started. */
  onDaydreamStart: [],
  /** The Android daydream stopped. */
  onDaydreamStop: [],
  /** The battery charge changed. */
  onBatteryLevelChanged: [['level', 'number']],
  /** The volume up key was pressed. */
  volumeUp: [],
  /** The volume down key was pressed. */
  volumeDown: [],
  /** Headphones were plugged in. */
  headphonesPlugged: [],
  /** Headphones were unplugged. */
  headphonesUnplugged: [],
  /** Motion was detected. Raised at most once per second. */
  onMotion: [],
  /** The number of detected faces changed. Requires Fully Kiosk 1.48+. */
  facesDetected: [['number', 'number']],
  /** The camera image went dark. Requires "screen off on darkness". */
  onDarkness: [],
  /** The device was physically moved. */
  onMovement: [],
  /** An iBeacon came into range. */
  onIBeacon: [
    ['id1', 'string'],
    ['id2', 'string'],
    ['id3', 'string'],
    ['distance', 'number'],
  ],
  /** A registered Android broadcast was received. */
  broadcastReceived: [
    ['action', 'string'],
    ['extras', 'string'],
  ],
  /** A barcode was scanned successfully. */
  onQrScanSuccess: [
    ['code', 'string'],
    ['extras', 'string'],
  ],
  /** The barcode scanner was cancelled. */
  onQrScanCancelled: [],
  /** The TTS engine finished initialising. Requires Fully Kiosk 1.55+. */
  ttsInitSuccess: [['info', 'string']],
  /** A text was queued for speech. */
  ttsTextQueued: [
    ['id', 'string'],
    ['text', 'string'],
    ['status', 'string'],
  ],
  /** A silence was queued for speech. */
  ttsSilenceQueued: [
    ['id', 'string'],
    ['millis', 'number'],
    ['status', 'string'],
  ],
  /** An utterance started playing. */
  ttsUtteranceStart: [['id', 'string']],
  /** An utterance failed. */
  ttsUtteranceError: [['id', 'string']],
  /** An utterance finished playing. */
  ttsUtteranceDone: [['id', 'string']],
  /** A download finished successfully. */
  onDownloadSuccess: [
    ['url', 'string'],
    ['dir', 'string'],
    ['code', 'number'],
    ['fileLength', 'number'],
    ['lastModified', 'string'],
    ['mimetype', 'string'],
  ],
  /** A download failed. */
  onDownloadFailure: [
    ['url', 'string'],
    ['dir', 'string'],
    ['code', 'number'],
  ],
  /** An archive was extracted successfully. */
  onUnzipSuccess: [
    ['url', 'string'],
    ['dir', 'string'],
  ],
  /** Extracting an archive failed. */
  onUnzipFailure: [
    ['url', 'string'],
    ['dir', 'string'],
    ['message', 'string'],
  ],
  /** A Bluetooth serial connection was established. */
  onBtConnectSuccess: [['device', 'string']],
  /** A Bluetooth serial connection could not be established. */
  onBtConnectFailure: [],
  /** Data arrived on the Bluetooth serial connection, buffered until a line feed. */
  onBtDataRead: [['data', 'string']],
  /** An NDEF formatted NFC tag was discovered. */
  onNdefDiscovered: [
    ['serial', 'string'],
    ['message', 'string'],
    ['data', 'string'],
  ],
  /** An NFC tag was discovered. */
  onNfcTagDiscovered: [
    ['serial', 'string'],
    ['type', 'string'],
    ['message', 'string'],
    ['data', 'string'],
  ],
  /** An NFC tag left the field. Android 7+. */
  onNfcTagRemoved: [['serial', 'string']],
} as const satisfies Record<string, readonly FullyEventArg[]>;

/**
 * Name of a Fully Kiosk event.
 */
export type FullyEventName = keyof typeof FULLY_EVENTS;

/**
 * Maps a placeholder type to the TypeScript type the listener receives.
 */
type ArgValue<T extends FullyEventArgType> = T extends 'number' ? number : string;

/**
 * Builds the payload object type from an event's placeholder list.
 */
type PayloadOf<S extends readonly FullyEventArg[]> = {
  [Arg in S[number] as Arg[0]]: ArgValue<Arg[1]>;
};

/**
 * Payload delivered to the listener of each event. Events without placeholders
 * receive an empty object.
 */
export type FullyEventMap = {
  [Event in FullyEventName]: PayloadOf<(typeof FULLY_EVENTS)[Event]>;
};

/**
 * Payload of a specific event.
 *
 * @typeParam Event - The event name.
 */
export type FullyEventPayload<Event extends FullyEventName> = FullyEventMap[Event];

/**
 * Listener invoked when an event fires.
 *
 * @typeParam Event - The event name.
 */
export type FullyEventListener<Event extends FullyEventName> = (
  payload: FullyEventPayload<Event>,
) => void;

/**
 * All known event names, handy for iterating or building UIs.
 */
export const FULLY_EVENT_NAMES = Object.keys(FULLY_EVENTS) as FullyEventName[];
