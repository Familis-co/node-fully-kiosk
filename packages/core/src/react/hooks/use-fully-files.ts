import { getFully, getFullyFileList, safeCall, type FullyFileEntry } from '../../index.js';
import { useCallback, useState } from 'react';
import { useFullyEvent } from './use-fully-event.js';
import { useFullyValue } from './use-fully-value.js';

/**
 * Outcome of a download or unzip started through {@link useFullyDownload}.
 */
export interface FullyTransferResult {
  /** Source URL of the transfer. */
  url: string;
  /** Target directory. */
  dir: string;
  /** Whether the transfer succeeded. */
  ok: boolean;
  /** HTTP status code, for downloads. */
  code?: number;
  /** Size in bytes, for successful downloads. */
  fileLength?: number;
  /** MIME type, for successful downloads. */
  mimetype?: string;
  /** Failure detail, for failed unzips. */
  message?: string;
  /** When the transfer finished, in milliseconds since the epoch. */
  finishedAt: number;
}

/**
 * Download and unzip state and control.
 */
export interface UseFullyDownloadResult {
  /**
   * Downloads a file to a directory on the device.
   *
   * @param url - Source URL.
   * @param dirName - Target directory.
   * @param showToastMessages - Show Fully's progress toasts.
   */
  download: (url: string, dirName: string, showToastMessages?: boolean) => void;
  /**
   * Downloads a ZIP archive and extracts it.
   *
   * @param url - Source URL.
   * @param dirName - Target directory.
   */
  downloadAndUnzip: (url: string, dirName: string) => void;
  /**
   * Extracts an archive already on the device.
   *
   * @param fileName - Path of the archive.
   */
  unzip: (fileName: string) => void;
  /** `true` between starting a transfer and its success or failure event. */
  isTransferring: boolean;
  /** The outcome of the most recent transfer, or `null`. */
  last: FullyTransferResult | null;
  /** Every transfer outcome observed since mount, newest first. */
  history: FullyTransferResult[];
}

/**
 * Downloads files onto the device and follows Fully's transfer events.
 *
 * @returns The transfer controls and their state.
 */
export function useFullyDownload(): UseFullyDownloadResult {
  const [isTransferring, setIsTransferring] = useState(false);
  const [history, setHistory] = useState<FullyTransferResult[]>([]);

  const record = useCallback((result: FullyTransferResult) => {
    setIsTransferring(false);
    setHistory((current) => [result, ...current]);
  }, []);

  useFullyEvent('onDownloadSuccess', ({ url, dir, code, fileLength, mimetype }) =>
    record({ url, dir, ok: true, code, fileLength, mimetype, finishedAt: Date.now() }),
  );
  useFullyEvent('onDownloadFailure', ({ url, dir, code }) =>
    record({ url, dir, ok: false, code, finishedAt: Date.now() }),
  );
  useFullyEvent('onUnzipSuccess', ({ url, dir }) =>
    record({ url, dir, ok: true, finishedAt: Date.now() }),
  );
  useFullyEvent('onUnzipFailure', ({ url, dir, message }) =>
    record({ url, dir, ok: false, message, finishedAt: Date.now() }),
  );

  return {
    download: useCallback((url: string, dirName: string, showToastMessages = false) => {
      setIsTransferring(true);
      getFully()?.downloadFile(url, dirName, showToastMessages);
    }, []),
    downloadAndUnzip: useCallback((url: string, dirName: string) => {
      setIsTransferring(true);
      getFully()?.downloadAndUnzipFile(url, dirName);
    }, []),
    unzip: useCallback((fileName: string) => {
      setIsTransferring(true);
      getFully()?.unzipFile(fileName);
    }, []),
    isTransferring,
    last: history[0] ?? null,
    history,
  };
}

/**
 * Folder contents and file operations through the JavaScript interface.
 */
export interface UseFullyFileListResult {
  /** Entries of the folder. */
  entries: FullyFileEntry[];
  /** Re-reads the folder. */
  refresh: () => FullyFileEntry[];
  /**
   * Reads a text file.
   *
   * @param path - Path of the file.
   * @returns The file contents, or an empty string when unavailable.
   */
  readFile: (path: string) => string;
  /**
   * Writes a text file and re-reads the folder.
   *
   * @param path - Target path.
   * @param content - File contents.
   * @returns Whether Fully reported success.
   */
  writeFile: (path: string, content: string) => boolean;
  /**
   * Deletes a file and re-reads the folder.
   *
   * @param path - Path of the file to delete.
   */
  deleteFile: (path: string) => void;
  /**
   * Creates a folder and re-reads the listing.
   *
   * @param path - Path of the folder to create.
   */
  createFolder: (path: string) => void;
}

/**
 * Lists a folder on the device and exposes basic file operations.
 *
 * @param folder - Path of the folder to list.
 * @param interval - Re-read the folder on this interval in milliseconds.
 * @returns The folder contents and the file operations.
 */
export function useFullyFileList(folder: string, interval?: number): UseFullyFileListResult {
  const entries = useFullyValue<FullyFileEntry[]>(() => getFullyFileList(folder), [], {
    interval,
    deps: [folder],
  });

  return {
    entries: entries.value,
    refresh: entries.refresh,
    readFile: useCallback((path: string) => safeCall((fully) => fully.readFile(path), ''), []),
    writeFile: useCallback(
      (path: string, content: string) => {
        const ok = getFully()?.writeFile(path, content) ?? false;
        entries.refresh();
        return ok;
      },
      [entries],
    ),
    deleteFile: useCallback(
      (path: string) => {
        getFully()?.deleteFile(path);
        entries.refresh();
      },
      [entries],
    ),
    createFolder: useCallback(
      (path: string) => {
        getFully()?.createFolder(path);
        entries.refresh();
      },
      [entries],
    ),
  };
}
