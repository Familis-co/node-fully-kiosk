/**
 * Envelope returned by commands that only report success or failure.
 *
 * Fully answers `{"status":"OK","statustext":"..."}` on success and
 * `{"status":"Error","statustext":"..."}` on failure when `type=json` is set.
 */
export interface FullyKioskStatusResponse {
  /** `OK` on success, `Error` on failure. */
  status?: string;
  /** Human readable detail about the outcome. */
  statustext?: string;
  /** Any additional field returned by the command. */
  [key: string]: unknown;
}

/**
 * A binary payload returned by commands such as `getScreenshot`.
 */
export interface FullyKioskBinaryResponse {
  /** Raw bytes of the payload. */
  data: Uint8Array;
  /** MIME type reported by the device, e.g. `image/png`. */
  contentType: string;
}

/**
 * Progress of an APK installation started with `loadApkFile`.
 */
export interface FullyKioskApkInstallState {
  /** Current installation state as reported by Fully. */
  status?: string;
  /** Human readable detail about the installation. */
  statustext?: string;
  /** Any additional field returned by the command. */
  [key: string]: unknown;
}
