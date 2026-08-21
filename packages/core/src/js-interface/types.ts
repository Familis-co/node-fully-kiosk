/**
 * The `fully` object Fully Kiosk Browser injects into every loaded page when
 * *Advanced Web Settings > Enable JavaScript Interface* is turned on.
 *
 * All members are synchronous: the Android bridge blocks until the native side
 * answers. Availability depends on the Fully version, the Android version, the
 * granted permissions and the PLUS license, so treat every call as best effort
 * and use {@link isFullyKiosk} before touching the object.
 *
 * @see https://www.fully-kiosk.com/en/#websiteintegration
 */
export interface FullyJsInterface {
  // ---- Device info -------------------------------------------------------

  /** Current locale of the device, e.g. `en_GB`. */
  getCurrentLocale(): string;
  /** Primary IPv4 address. */
  getIp4Address(): string;
  /** All IPv4 addresses as a JSON array string. */
  getIp4Addresses(): string;
  /** Primary IPv6 address. */
  getIp6Address(): string;
  /** All IPv6 addresses as a JSON array string. */
  getIp6Addresses(): string;
  /** IPv4 hostname. */
  getHostname(): string;
  /** IPv6 hostname. */
  getHostname6(): string;
  /** Wi-Fi MAC address. */
  getMacAddress(): string;
  /**
   * MAC address of a specific network interface.
   *
   * @param iface - Interface name, e.g. `wlan0`.
   */
  getMacAddressForInterface(iface: string): string;
  /** SSID of the connected Wi-Fi network. */
  getWifiSsid(): string;
  /** BSSID of the connected access point. */
  getWifiBssid(): string;
  /** Wi-Fi signal level as a string, 0-4. */
  getWifiSignalLevel(): string;
  /** Hardware serial number. */
  getSerialNumber(): string;
  /** Serial number readable only by a device owner app. */
  getSerialNumberDeviceOwner(): string;
  /** Android ID of the device. */
  getAndroidId(): string;
  /** Fully Kiosk device identifier. */
  getDeviceId(): string;
  /** User facing device name. */
  getDeviceName(): string;
  /** Device IMEI. Requires the phone permission. */
  getImei(): string;
  /** SIM card serial number. Requires the phone permission. */
  getSimSerialNumber(): string;
  /** Battery charge in percent. */
  getBatteryLevel(): number;
  /** Screen brightness, 0-255. */
  getScreenBrightness(): number;
  /** Screen orientation as an Android orientation constant. */
  getScreenOrientation(): number;
  /** Display width in pixels. */
  getDisplayWidth(): number;
  /** Display height in pixels. */
  getDisplayHeight(): number;
  /** Milliseconds since the last user interaction. */
  getIdleTime(): number;
  /** Timestamp of the last user interaction in milliseconds since boot. */
  getLastUserInteractionTime(): number;
  /** Whether the screen is on. */
  getScreenOn(): boolean;
  /** Whether the device is connected to power. */
  isPlugged(): boolean;
  /** Whether the soft keyboard is visible. */
  isKeyboardVisible(): boolean;
  /** Whether Wi-Fi is enabled. */
  isWifiEnabled(): boolean;
  /** Whether the device is connected to Wi-Fi. */
  isWifiConnected(): boolean;
  /** Whether any network connection is available. */
  isNetworkConnected(): boolean;
  /** Whether Bluetooth is enabled. */
  isBluetoothEnabled(): boolean;
  /** Whether screen rotation is locked. */
  isScreenRotationLocked(): boolean;
  /** Fully Kiosk version name. */
  getFullyVersion(): string;
  /** Fully Kiosk version code. */
  getFullyVersionCode(): number;
  /** Android System WebView version. */
  getWebviewVersion(): string;
  /** Android release version. */
  getAndroidVersion(): string;
  /** Android SDK level. */
  getAndroidSdk(): number;
  /** Hardware model name. */
  getDeviceModel(): string;
  /** Last known location as a JSON string. */
  getLocation(): string;

  /** Total internal storage in bytes. */
  getInternalStorageTotalSpace(): number;
  /** Free internal storage in bytes. */
  getInternalStorageFreeSpace(): number;
  /** Total external storage in bytes. */
  getExternalStorageTotalSpace(): number;
  /** Free external storage in bytes. */
  getExternalStorageFreeSpace(): number;

  /** Description of the available environment sensors as a JSON string. */
  getSensorInfo(): string;
  /**
   * First value of a sensor.
   *
   * @param type - Android sensor type constant.
   */
  getSensorValue(type: number): number;
  /**
   * All values of a sensor as a JSON array string.
   *
   * @param type - Android sensor type constant.
   */
  getSensorValues(type: number): string;

  /** Bytes received over mobile data since boot. Android 6+. */
  getAllRxBytesMobile(): number;
  /** Bytes sent over mobile data since boot. Android 6+. */
  getAllTxBytesMobile(): number;
  /** Bytes received over Wi-Fi since boot. Android 6+. */
  getAllRxBytesWifi(): number;
  /** Bytes sent over Wi-Fi since boot. Android 6+. */
  getAllTxBytesWifi(): number;

  // ---- Device control ----------------------------------------------------

  /** Turns the screen on. */
  turnScreenOn(): void;
  /**
   * Turns the screen off.
   *
   * @param keepAlive - Keep the app running while the screen is off.
   */
  turnScreenOff(keepAlive?: boolean): void;
  /** Puts the device to sleep immediately. */
  forceSleep(): void;
  /**
   * Shows an Android toast.
   *
   * @param text - The message to show.
   */
  showToast(text: string): void;
  /**
   * Sets the screen brightness.
   *
   * @param level - Brightness 0-255, or `-1` for the system default.
   */
  setScreenBrightness(level: number): void;
  /** Enables Wi-Fi. Android 10+ requires a provisioned device. */
  enableWifi(): void;
  /** Disables Wi-Fi. Android 10+ requires a provisioned device. */
  disableWifi(): void;
  /** Enables Bluetooth. */
  enableBluetooth(): void;
  /** Disables Bluetooth. */
  disableBluetooth(): void;
  /** Shows the soft keyboard. */
  showKeyboard(): void;
  /** Hides the soft keyboard. */
  hideKeyboard(): void;
  /** Opens the Android Wi-Fi settings. */
  openWifiSettings(): void;
  /** Opens the Android Bluetooth settings. */
  openBluetoothSettings(): void;
  /**
   * Vibrates the device.
   *
   * @param millis - Duration in milliseconds.
   */
  vibrate(millis: number): void;
  /**
   * Sends raw bytes to a TCP port.
   *
   * @param hexData - Payload as a hex string.
   * @param host - Target host.
   * @param port - Target port.
   */
  sendHexDataToTcpPort(hexData: string, host: string, port: number): void;
  /**
   * Shows an Android notification.
   *
   * @param title - Notification title.
   * @param text - Notification body.
   * @param url - URL to open when the notification is tapped.
   * @param highPriority - Show as a heads-up notification.
   */
  showNotification(title: string, text: string, url: string, highPriority: boolean): void;
  /**
   * Writes to the Android log.
   *
   * @param type - Log level.
   * @param tag - Log tag.
   * @param message - Log message.
   */
  log(type: number, tag: string, message: string): void;

  /**
   * Copies text to the clipboard. Blocked in the background on Android 10+.
   *
   * @param text - The text to copy.
   */
  copyTextToClipboard(text: string): void;
  /** Reads the clipboard as plain text. */
  getClipboardText(): string;
  /** Reads the clipboard as HTML. */
  getClipboardHtmlText(): string;

  /**
   * Runs a shell command. Rooted devices only.
   *
   * @param command - The command line to run.
   */
  runCommand(command: string): void;
  /**
   * Runs a shell command through `su`. Rooted devices only.
   *
   * @param command - The command line to run.
   */
  runSuCommand(command: string): void;
  /** Reboots the device. Provisioned or rooted devices only. */
  reboot(): void;
  /** Shuts the device down. Rooted devices only. */
  shutdown(): void;

  // ---- Files -------------------------------------------------------------

  /**
   * Deletes a file.
   *
   * @param path - Path of the file.
   */
  deleteFile(path: string): void;
  /**
   * Deletes a folder and its contents.
   *
   * @param path - Path of the folder.
   */
  deleteFolder(path: string): void;
  /**
   * Deletes the contents of a folder but keeps the folder.
   *
   * @param path - Path of the folder.
   */
  emptyFolder(path: string): void;
  /**
   * Creates a folder.
   *
   * @param path - Path of the folder to create.
   */
  createFolder(path: string): void;
  /**
   * Lists a folder as a JSON array string.
   *
   * @param folder - Path of the folder to list.
   */
  getFileList(folder: string): string;
  /**
   * Writes a text file.
   *
   * @param path - Target path.
   * @param content - File contents.
   */
  writeFile(path: string, content: string): boolean;
  /**
   * Writes a binary file from base64 content.
   *
   * @param path - Target path.
   * @param base64encodedContent - File contents encoded as base64.
   */
  writeFileBase64(path: string, base64encodedContent: string): boolean;
  /**
   * Reads a text file. Requires Fully Kiosk 1.55+.
   *
   * @param path - Path of the file to read.
   */
  readFile(path: string): string;
  /**
   * Downloads a file.
   *
   * @param url - Source URL.
   * @param dirName - Target directory.
   * @param showToastMessages - Show progress toasts.
   */
  downloadFile(url: string, dirName: string, showToastMessages?: boolean): void;
  /**
   * Extracts a ZIP archive already on the device.
   *
   * @param fileName - Path of the archive.
   */
  unzipFile(fileName: string): void;
  /**
   * Downloads a ZIP archive and extracts it.
   *
   * @param url - Source URL.
   * @param dirName - Target directory.
   */
  downloadAndUnzipFile(url: string, dirName: string): void;

  /** Path of the internal shared storage. Requires Fully Kiosk 1.59+. */
  getInternalSharedStoragePath(): string;
  /** Path of the internal app specific storage. Requires Fully Kiosk 1.59+. */
  getInternalAppSpecificStoragePath(): string;
  /** Path of the internal app private storage. Requires Fully Kiosk 1.59+. */
  getInternalAppPrivateStoragePath(): string;
  /** Path of the external shared storage. Requires Fully Kiosk 1.59+. */
  getExternalSharedStoragePath(): string;
  /** Path of the external app specific storage. Requires Fully Kiosk 1.59+. */
  getExternalAppSpecificStoragePath(): string;

  // ---- Text to speech, media and PDF -------------------------------------

  /**
   * Speaks a text.
   *
   * @param text - The text to speak.
   * @param localeOrVoice - Locale or voice name, e.g. `en_GB`.
   * @param engine - Text-to-speech engine package name.
   * @param queue - Queue behind the current utterance instead of interrupting it.
   */
  textToSpeech(text: string, localeOrVoice?: string, engine?: string, queue?: boolean): void;
  /** Stops current and queued speech. */
  stopTextToSpeech(): void;
  /** Initialises the TTS engine. Emits `ttsInitSuccess`. Requires Fully Kiosk 1.55+. */
  initTts(): void;
  /** Shuts the TTS engine down. Requires Fully Kiosk 1.60+. */
  shutdownTts(): void;
  /**
   * Plays a video full screen.
   *
   * @param url - Video URL.
   * @param loop - Repeat when finished.
   * @param showControls - Show player controls.
   * @param exitOnTouch - Close the player on touch.
   * @param exitOnCompletion - Close the player when playback ends.
   */
  playVideo(
    url: string,
    loop: boolean,
    showControls: boolean,
    exitOnTouch: boolean,
    exitOnCompletion: boolean,
  ): void;
  /** Stops video playback. */
  stopVideo(): void;
  /**
   * Sets the volume of an audio stream.
   *
   * @param level - Volume 0-100.
   * @param stream - Android audio stream identifier.
   */
  setAudioVolume(level: number, stream: number): void;
  /**
   * Plays a sound.
   *
   * @param url - Sound URL.
   * @param loop - Repeat until stopped.
   * @param stream - Android audio stream identifier.
   */
  playSound(url: string, loop: boolean, stream?: number): void;
  /** Stops the sound started with {@link playSound}. */
  stopSound(): void;
  /**
   * Shows a PDF document full screen.
   *
   * @param url - PDF URL.
   */
  showPdf(url: string): void;
  /**
   * Reads the volume of an audio stream.
   *
   * @param stream - Android audio stream identifier.
   */
  getAudioVolume(stream: number): number;
  /** Whether a wired headset is connected. */
  isWiredHeadsetOn(): boolean;
  /** Whether audio is currently playing. */
  isMusicActive(): boolean;

  // ---- Web browsing ------------------------------------------------------

  /** The configured start URL. */
  getStartUrl(): string;
  /**
   * Changes the start URL.
   *
   * @param url - The new start URL.
   */
  setStartUrl(url: string): void;
  /** Navigates to the start URL. */
  loadStartUrl(): void;
  /** Adds a shortcut to the Android home screen. */
  addToHomeScreen(): void;
  /** Opens the Android share sheet for the current URL. */
  shareUrl(): void;
  /** Prints the current page. `window.print()` does not work in Fully. */
  print(): void;
  /**
   * Prints the current page to a PDF file without a prompt.
   *
   * @param filename - Target file name.
   */
  print2Pdf(filename: string): void;
  /** Captures the screen and returns it as a base64 encoded PNG. */
  getScreenshotPngBase64(): string;
  /** Returns the usage statistics as CSV. */
  loadStatsCSV(): string;
  /**
   * Runs a configured web automation. Requires Fully Kiosk 1.60+.
   *
   * @param index - Index of the automation to run.
   */
  requestWebAutomation(index: number): void;

  /** Clears the WebView cache. */
  clearCache(): void;
  /** Clears saved form data. */
  clearFormData(): void;
  /** Clears the browsing history. */
  clearHistory(): void;
  /** Clears all cookies. */
  clearCookies(): void;
  /**
   * Clears the cookies of one URL.
   *
   * @param url - The URL whose cookies to drop.
   */
  clearCookiesForUrl(url: string): void;
  /** Clears local storage, session storage and IndexedDB. */
  clearWebstorage(): void;
  /** Recreates the WebView. Requires Fully Kiosk 1.55.3+. */
  resetWebview(): void;

  /** Focuses the tab this page runs in. */
  focusThisTab(): void;
  /** Focuses the next tab. */
  focusNextTab(): void;
  /** Focuses the previous tab. */
  focusPrevTab(): void;
  /**
   * Focuses a tab by index.
   *
   * @param index - Zero-based tab index.
   */
  focusTabByIndex(index: number): void;
  /** Index of the currently focused tab. */
  getCurrentTabIndex(): number;
  /** Index of the tab this page runs in. */
  getThisTabIndex(): number;
  /**
   * Closes a tab by index.
   *
   * @param index - Zero-based tab index.
   */
  closeTabByIndex(index: number): void;
  /** Closes the tab this page runs in. */
  closeThisTab(): void;
  /** All open tabs as a JSON array string. */
  getTabList(): string;
  /**
   * Loads a URL into an existing tab.
   *
   * @param index - Zero-based tab index.
   * @param url - The URL to load.
   */
  loadUrlInTabByIndex(index: number, url: string): void;
  /**
   * Loads a URL into a new tab.
   *
   * @param url - The URL to load.
   * @param focus - Focus the new tab.
   */
  loadUrlInNewTab(url: string, focus: boolean): void;

  // ---- Barcode scanner ---------------------------------------------------

  /**
   * Opens the built-in barcode scanner.
   *
   * @param prompt - Prompt shown above the viewfinder.
   * @param resultUrl - URL to open with the `$code` placeholder replaced. Pass
   * an empty string to receive the result through the `onQrScanSuccess` event.
   * @param cameraId - Camera to use, or `-1` for the default.
   * @param timeout - Timeout in seconds, or `-1` for the default.
   * @param beepEnabled - Beep on a successful scan.
   * @param showCancelButton - Show a cancel button.
   * @param useFlashlight - Turn the flashlight on while scanning.
   */
  scanQrCode(
    prompt: string,
    resultUrl: string,
    cameraId?: number,
    timeout?: number,
    beepEnabled?: boolean,
    showCancelButton?: boolean,
    useFlashlight?: boolean,
  ): void;

  // ---- Bluetooth serial --------------------------------------------------

  /** Known Bluetooth devices as a JSON array string. */
  btGetDeviceListJson(): string;
  /**
   * Opens a serial (SPP) connection by MAC address.
   *
   * @param mac - MAC address of the target device.
   */
  btOpenByMac(mac: string): void;
  /**
   * Opens a serial (SPP) connection by service UUID.
   *
   * @param uuid - Service UUID of the target device.
   */
  btOpenByUuid(uuid: string): void;
  /**
   * Opens a serial (SPP) connection by device name.
   *
   * @param name - Name of the target device.
   */
  btOpenByName(name: string): void;
  /** Whether a Bluetooth serial connection is open. */
  btIsConnected(): boolean;
  /** Information about the connected device as a JSON string. */
  btGetDeviceInfoJson(): string;
  /** Closes the Bluetooth serial connection. */
  btClose(): void;
  /**
   * Sends a string over the Bluetooth serial connection.
   *
   * @param stringData - The payload to send.
   */
  btSendStringData(stringData: string): boolean;
  /**
   * Sends hex encoded bytes over the Bluetooth serial connection.
   *
   * @param hexData - The payload as a hex string.
   */
  btSendHexData(hexData: string): boolean;
  /**
   * Sends raw bytes over the Bluetooth serial connection.
   *
   * @param data - The payload as a byte array.
   */
  btSendByteData(data: number[]): boolean;

  // ---- NFC ---------------------------------------------------------------

  /**
   * Starts NFC scanning.
   *
   * @param flags - Android NFC reader flags.
   * @param debounceMs - Debounce window in milliseconds.
   */
  nfcScanStart(flags?: number, debounceMs?: number): boolean;
  /** Stops NFC scanning. */
  nfcScanStop(): boolean;

  // ---- Screensaver, apps, intents, kiosk ---------------------------------

  /** Starts the Fully screensaver. */
  startScreensaver(): void;
  /** Stops the Fully screensaver. */
  stopScreensaver(): void;
  /** Starts the Android daydream. */
  startDaydream(): void;
  /** Stops the Android daydream. */
  stopDaydream(): void;

  /** Whether Fully is in the foreground. */
  isInForeground(): boolean;
  /**
   * Brings Fully to the foreground.
   *
   * @param millis - Optional delay in milliseconds.
   */
  bringToForeground(millis?: number): void;
  /** Sends Fully to the background. */
  bringToBackground(): void;
  /** Restarts the Fully app. */
  restartApp(): void;
  /** Closes the Fully app. */
  exit(): void;

  /** Enters maintenance mode. */
  enableMaintenanceMode(): void;
  /** Leaves maintenance mode. */
  disableMaintenanceMode(): void;
  /**
   * Shows a message overlay on top of the page.
   *
   * @param text - The message, or an empty string to clear it.
   */
  setMessageOverlay(text: string): void;
  /** Locks kiosk mode. */
  lockKiosk(): void;
  /** Unlocks kiosk mode. */
  unlockKiosk(): void;
  /** Prompts for the kiosk PIN. */
  checkKioskPin(): void;
  /** Whether kiosk mode is currently locked. */
  isKioskLocked(): boolean;

  /**
   * Launches another application.
   *
   * @param packageName - Android package name.
   * @param action - Optional intent action, or `null`.
   * @param url - Optional intent data URL, or `null`.
   */
  startApplication(packageName: string, action?: string | null, url?: string | null): void;
  /**
   * Starts an intent from an intent URL.
   *
   * @param url - The intent URL.
   */
  startIntent(url: string): void;
  /**
   * Broadcasts an intent.
   *
   * @param url - The intent URL to broadcast.
   */
  broadcastIntent(url: string): void;
  /**
   * Subscribes to a broadcast action, delivered as the `broadcastReceived` event.
   *
   * @param action - The intent action to listen for.
   */
  registerBroadcastReceiver(action: string): void;
  /**
   * Unsubscribes from a broadcast action.
   *
   * @param action - The intent action to stop listening for.
   */
  unregisterBroadcastReceiver(action: string): void;
  /**
   * Kills the background processes of an app. Android 13 and older.
   *
   * @param packageName - Android package name.
   */
  killBackgroundProcesses(packageName: string): void;
  /**
   * Downloads and installs an APK. Not available in the Google Play edition.
   *
   * @param url - URL of the APK file.
   */
  installApkFile(url: string): void;

  // ---- Motion detection --------------------------------------------------

  /** Starts motion detection. */
  startMotionDetection(): void;
  /** Stops motion detection. */
  stopMotionDetection(): void;
  /** Whether motion detection is running. */
  isMotionDetectionRunning(): boolean;
  /** Captures a camera still as a base64 encoded JPEG. */
  getCamshotJpgBase64(): string;
  /** Number of faces currently detected. Requires Fully Kiosk 1.48+. */
  getFaceNumber(): number;
  /** Average luminance of the camera image. Requires Fully Kiosk 1.60+. */
  getAverageLuma(): number;
  /** Simulates a motion event. */
  triggerMotion(): void;

  // ---- Fully settings ----------------------------------------------------

  /**
   * Reads a boolean setting.
   *
   * @param key - The setting key.
   */
  getBooleanSetting(key: string): string;
  /**
   * Reads a string setting.
   *
   * @param key - The setting key.
   */
  getStringSetting(key: string): string;
  /**
   * Writes a boolean setting. Applies immediately.
   *
   * @param key - The setting key.
   * @param value - The new value.
   */
  setBooleanSetting(key: string, value: boolean): void;
  /**
   * Writes a string setting. Applies immediately.
   *
   * @param key - The setting key.
   * @param value - The new value.
   */
  setStringSetting(key: string, value: string): void;
  /**
   * Imports a settings JSON file.
   *
   * @param url - Location of the settings file.
   */
  importSettingsFile(url: string): void;

  // ---- Android system settings (Fully Kiosk 1.55.3+) ---------------------

  /**
   * Reads an integer from `Settings.Global`.
   *
   * @param name - The setting name.
   * @param defaultValue - Value returned when the setting is missing.
   */
  getSettingsGlobalInt(name: string, defaultValue: number): number;
  /**
   * Reads a long from `Settings.Global`.
   *
   * @param name - The setting name.
   * @param defaultValue - Value returned when the setting is missing.
   */
  getSettingsGlobalLong(name: string, defaultValue: number): number;
  /**
   * Reads a string from `Settings.Global`.
   *
   * @param name - The setting name.
   */
  getSettingsGlobalString(name: string): string;
  /**
   * Writes an integer to `Settings.Global`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsGlobalInt(name: string, value: number): void;
  /**
   * Writes a long to `Settings.Global`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsGlobalLong(name: string, value: number): void;
  /**
   * Writes a string to `Settings.Global`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsGlobalString(name: string, value: string): void;
  /**
   * Reads an integer from `Settings.System`.
   *
   * @param name - The setting name.
   * @param defaultValue - Value returned when the setting is missing.
   */
  getSettingsSystemInt(name: string, defaultValue: number): number;
  /**
   * Reads a long from `Settings.System`.
   *
   * @param name - The setting name.
   * @param defaultValue - Value returned when the setting is missing.
   */
  getSettingsSystemLong(name: string, defaultValue: number): number;
  /**
   * Reads a string from `Settings.System`.
   *
   * @param name - The setting name.
   */
  getSettingsSystemString(name: string): string;
  /**
   * Writes an integer to `Settings.System`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsSystemInt(name: string, value: number): void;
  /**
   * Writes a long to `Settings.System`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsSystemLong(name: string, value: number): void;
  /**
   * Writes a string to `Settings.System`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsSystemString(name: string, value: string): void;
  /**
   * Reads an integer from `Settings.Secure`.
   *
   * @param name - The setting name.
   * @param defaultValue - Value returned when the setting is missing.
   */
  getSettingsSecureInt(name: string, defaultValue: number): number;
  /**
   * Reads a long from `Settings.Secure`.
   *
   * @param name - The setting name.
   * @param defaultValue - Value returned when the setting is missing.
   */
  getSettingsSecureLong(name: string, defaultValue: number): number;
  /**
   * Reads a string from `Settings.Secure`.
   *
   * @param name - The setting name.
   */
  getSettingsSecureString(name: string): string;
  /**
   * Writes an integer to `Settings.Secure`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsSecureInt(name: string, value: number): void;
  /**
   * Writes a long to `Settings.Secure`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsSecureLong(name: string, value: number): void;
  /**
   * Writes a string to `Settings.Secure`.
   *
   * @param name - The setting name.
   * @param value - The new value.
   */
  putSettingsSecureString(name: string, value: string): void;

  // ---- Events ------------------------------------------------------------

  /**
   * Registers a handler for a Fully event.
   *
   * The handler is a **string of JavaScript source** that Fully evaluates when
   * the event fires, with `$placeholders` substituted. Only one handler can be
   * bound per event; binding again replaces the previous one. Prefer
   * {@link onFullyEvent} which multiplexes listeners over a single binding.
   *
   * @param event - The event name, e.g. `onMotion`.
   * @param jsCode - JavaScript source to evaluate when the event fires.
   */
  bind(event: string, jsCode: string): void;
}
