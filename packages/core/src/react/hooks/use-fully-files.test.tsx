/**
 * @vitest-environment happy-dom
 */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emit, installFully, resetFully } from '../test-support.js';
import { useFullyDownload, useFullyFileList } from './use-fully-files.js';

afterEach(() => {
  resetFully();
  cleanup();
});

describe('useFullyDownload', () => {
  it('starts idle', () => {
    installFully({ downloadFile: vi.fn() });

    const { result } = renderHook(() => useFullyDownload());

    expect(result.current.isTransferring).toBe(false);
    expect(result.current.last).toBeNull();
    expect(result.current.history).toEqual([]);
  });

  it('marks a download as in flight and records its success', () => {
    const downloadFile = vi.fn();
    installFully({ downloadFile });

    const { result } = renderHook(() => useFullyDownload());
    act(() => result.current.download('https://example.test/logo.png', '/sdcard/kiosk'));

    expect(downloadFile).toHaveBeenCalledWith(
      'https://example.test/logo.png',
      '/sdcard/kiosk',
      false,
    );
    expect(result.current.isTransferring).toBe(true);

    emit(
      'onDownloadSuccess',
      'https://example.test/logo.png',
      '/sdcard/kiosk',
      '200',
      '2048',
      'Mon, 01 Jan 2026 00:00:00 GMT',
      'image/png',
    );

    expect(result.current.isTransferring).toBe(false);
    expect(result.current.last).toMatchObject({
      url: 'https://example.test/logo.png',
      dir: '/sdcard/kiosk',
      ok: true,
      code: 200,
      fileLength: 2048,
      mimetype: 'image/png',
    });
  });

  it('opts into the progress toasts when asked', () => {
    const downloadFile = vi.fn();
    installFully({ downloadFile });

    const { result } = renderHook(() => useFullyDownload());
    act(() => result.current.download('https://example.test/a.bin', '/sdcard', true));

    expect(downloadFile).toHaveBeenCalledWith('https://example.test/a.bin', '/sdcard', true);
  });

  it('records a failed download with its status code', () => {
    installFully({ downloadFile: vi.fn() });

    const { result } = renderHook(() => useFullyDownload());
    act(() => result.current.download('https://example.test/missing', '/sdcard'));
    emit('onDownloadFailure', 'https://example.test/missing', '/sdcard', '404');

    expect(result.current.isTransferring).toBe(false);
    expect(result.current.last).toMatchObject({ ok: false, code: 404 });
  });

  it('records an unzip and its failure message', () => {
    const downloadAndUnzipFile = vi.fn();
    const unzipFile = vi.fn();
    installFully({ downloadAndUnzipFile, unzipFile });

    const { result } = renderHook(() => useFullyDownload());

    act(() => result.current.downloadAndUnzip('https://example.test/pack.zip', '/sdcard'));
    expect(downloadAndUnzipFile).toHaveBeenCalledWith('https://example.test/pack.zip', '/sdcard');
    emit('onUnzipSuccess', 'https://example.test/pack.zip', '/sdcard');
    expect(result.current.last).toMatchObject({ ok: true });

    act(() => result.current.unzip('/sdcard/broken.zip'));
    expect(unzipFile).toHaveBeenCalledWith('/sdcard/broken.zip');
    emit('onUnzipFailure', '/sdcard/broken.zip', '/sdcard', 'corrupt archive');

    expect(result.current.last).toMatchObject({ ok: false, message: 'corrupt archive' });
  });

  it('keeps a history with the newest transfer first', () => {
    installFully({ downloadFile: vi.fn() });

    const { result } = renderHook(() => useFullyDownload());
    emit('onDownloadSuccess', 'https://example.test/1', '/sdcard', '200', '1', '', 'text/plain');
    emit('onDownloadSuccess', 'https://example.test/2', '/sdcard', '200', '1', '', 'text/plain');

    expect(result.current.history.map((entry) => entry.url)).toEqual([
      'https://example.test/2',
      'https://example.test/1',
    ]);
    expect(result.current.last?.url).toBe('https://example.test/2');
  });

  it('does not throw outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyDownload());

    expect(() =>
      act(() => result.current.download('https://example.test/a', '/sdcard')),
    ).not.toThrow();
  });
});

describe('useFullyFileList', () => {
  /**
   * Interface members backed by an in-memory folder.
   *
   * @returns The members plus the spies the tests assert on.
   */
  function fileStub() {
    let entries = [{ name: 'logo.png', size: 2048, isDir: false }];

    return {
      getFileList: () => JSON.stringify(entries),
      readFile: vi.fn(() => 'file contents'),
      writeFile: vi.fn((path: string) => {
        entries = [...entries, { name: path, size: 0, isDir: false }];
        return true;
      }),
      deleteFile: vi.fn(() => {
        entries = [];
      }),
      createFolder: vi.fn((path: string) => {
        entries = [...entries, { name: path, size: 0, isDir: true }];
      }),
    };
  }

  it('lists the folder on mount', () => {
    installFully(fileStub());

    const { result } = renderHook(() => useFullyFileList('/sdcard/kiosk'));

    expect(result.current.entries).toEqual([{ name: 'logo.png', size: 2048, isDir: false }]);
  });

  it('re-lists when the folder changes', () => {
    const getFileList = vi.fn((folder: string) => JSON.stringify([{ name: folder }]));
    installFully({ getFileList });

    const { result, rerender } = renderHook(
      ({ folder }: { folder: string }) => useFullyFileList(folder),
      { initialProps: { folder: '/a' } },
    );
    expect(result.current.entries).toEqual([{ name: '/a' }]);

    rerender({ folder: '/b' });

    expect(result.current.entries).toEqual([{ name: '/b' }]);
  });

  it('reads a text file', () => {
    const stub = fileStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyFileList('/sdcard'));
    let contents = '';
    act(() => {
      contents = result.current.readFile('/sdcard/note.txt');
    });

    expect(stub.readFile).toHaveBeenCalledWith('/sdcard/note.txt');
    expect(contents).toBe('file contents');
  });

  it('reports an empty string when a file cannot be read', () => {
    installFully({
      getFileList: () => '[]',
      readFile: () => {
        throw new Error('no such file');
      },
    });

    const { result } = renderHook(() => useFullyFileList('/sdcard'));
    let contents = 'unset';
    act(() => {
      contents = result.current.readFile('/sdcard/missing.txt');
    });

    expect(contents).toBe('');
  });

  it('writes a file, reports success and re-lists the folder', () => {
    const stub = fileStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyFileList('/sdcard'));
    let ok = false;
    act(() => {
      ok = result.current.writeFile('/sdcard/new.txt', 'hello');
    });

    expect(stub.writeFile).toHaveBeenCalledWith('/sdcard/new.txt', 'hello');
    expect(ok).toBe(true);
    expect(result.current.entries).toHaveLength(2);
  });

  it('reports a write as failed outside Fully Kiosk', () => {
    const { result } = renderHook(() => useFullyFileList('/sdcard'));
    let ok = true;
    act(() => {
      ok = result.current.writeFile('/sdcard/new.txt', 'hello');
    });

    expect(ok).toBe(false);
  });

  it('deletes a file and re-lists the folder', () => {
    const stub = fileStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyFileList('/sdcard'));
    act(() => result.current.deleteFile('/sdcard/logo.png'));

    expect(stub.deleteFile).toHaveBeenCalledWith('/sdcard/logo.png');
    expect(result.current.entries).toEqual([]);
  });

  it('creates a folder and re-lists', () => {
    const stub = fileStub();
    installFully(stub);

    const { result } = renderHook(() => useFullyFileList('/sdcard'));
    act(() => result.current.createFolder('/sdcard/media'));

    expect(stub.createFolder).toHaveBeenCalledWith('/sdcard/media');
    expect(result.current.entries).toHaveLength(2);
  });
});
