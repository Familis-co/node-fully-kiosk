import { CommandGroup } from './base.js';
import type { FullyKioskRequestOptions } from '../types/options.js';
import type { FullyKioskBinaryResponse, FullyKioskStatusResponse } from '../types/responses.js';

/**
 * File management on the device storage.
 *
 * Write access to an external SD card is not supported by many devices, and
 * Android 10+ restricts access to shared storage.
 */
export class FileCommands extends CommandGroup {
  /**
   * Downloads a file from the device.
   *
   * @param filename - Path of the file on the device.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The file bytes and its MIME type.
   */
  download(
    filename: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskBinaryResponse> {
    return this.transport.binary('downloadFile', { filename }, options);
  }

  /**
   * Deletes a file from the device.
   *
   * @param filename - Path of the file to delete.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  deleteFile(
    filename: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('deleteFile', { filename }, options);
  }

  /**
   * Deletes a folder and everything inside it.
   *
   * @param foldername - Path of the folder to delete.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  deleteFolder(
    foldername: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('deleteFolder', { foldername }, options);
  }

  /**
   * Downloads a ZIP archive and extracts it on the device.
   *
   * @param url - URL of the ZIP file.
   * @param dir - Target directory. Defaults to the storage root Fully may write to.
   * @param options - Per-call timeout, retry and abort overrides.
   * @returns The status envelope returned by the device.
   */
  loadZip(
    url: string,
    dir?: string,
    options?: FullyKioskRequestOptions,
  ): Promise<FullyKioskStatusResponse> {
    return this.transport.json('loadZipFile', { url, dir }, options);
  }
}
