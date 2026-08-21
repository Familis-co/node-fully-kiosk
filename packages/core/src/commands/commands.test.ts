import { describe, expect, it } from 'vitest';
import { FullyKioskClient } from '../client.js';
import type { FetchLike } from '../types/options.js';

/**
 * One row of the command table: a method on the client and the Fully command
 * name plus parameters it is expected to produce.
 */
interface CommandCase {
  /** Human readable name of the method under test. */
  readonly name: string;
  /** Invokes the method on a client. */
  readonly run: (client: FullyKioskClient) => Promise<unknown>;
  /** The `cmd` value the device should receive. */
  readonly command: string;
  /** Parameters the request should carry, beyond `cmd`, `type` and `password`. */
  readonly params?: Readonly<Record<string, string>>;
}

/**
 * Every command wrapper, pinned to the exact string Fully expects.
 *
 * These wrappers are one-liners, so the only thing that can break is the
 * command name or a parameter key, and neither would surface until the SDK ran
 * against a real device.
 */
const CASES: readonly CommandCase[] = [
  { name: 'device.info', run: (c) => c.device.info(), command: 'getDeviceInfo' },
  { name: 'device.log', run: (c) => c.device.log(), command: 'showLog' },
  { name: 'device.logcat', run: (c) => c.device.logcat(), command: 'logcat' },
  { name: 'device.stats', run: (c) => c.device.stats(), command: 'loadStatsCSV' },

  { name: 'screen.on', run: (c) => c.screen.on(), command: 'screenOn' },
  { name: 'screen.off', run: (c) => c.screen.off(), command: 'screenOff' },
  { name: 'screen.forceSleep', run: (c) => c.screen.forceSleep(), command: 'forceSleep' },
  {
    name: 'screen.startScreensaver',
    run: (c) => c.screen.startScreensaver(),
    command: 'startScreensaver',
  },
  {
    name: 'screen.stopScreensaver',
    run: (c) => c.screen.stopScreensaver(),
    command: 'stopScreensaver',
  },
  { name: 'screen.startDaydream', run: (c) => c.screen.startDaydream(), command: 'startDaydream' },
  { name: 'screen.stopDaydream', run: (c) => c.screen.stopDaydream(), command: 'stopDaydream' },

  { name: 'motion.trigger', run: (c) => c.motion.trigger(), command: 'triggerMotion' },

  { name: 'browser.loadStartUrl', run: (c) => c.browser.loadStartUrl(), command: 'loadStartUrl' },
  {
    name: 'browser.injectJavascript',
    run: (c) => c.browser.injectJavascript('alert(1)'),
    command: 'injectJavascript',
    params: { code: 'alert(1)' },
  },
  {
    name: 'browser.focusTab',
    run: (c) => c.browser.focusTab(2),
    command: 'focusTab',
    params: { tab: '2' },
  },
  {
    name: 'browser.closeTab',
    run: (c) => c.browser.closeTab(1),
    command: 'closeTab',
    params: { tab: '1' },
  },
  { name: 'browser.refreshTab', run: (c) => c.browser.refreshTab(), command: 'refreshTab' },
  { name: 'browser.clearCache', run: (c) => c.browser.clearCache(), command: 'clearCache' },
  {
    name: 'browser.clearWebStorage',
    run: (c) => c.browser.clearWebStorage(),
    command: 'clearWebstorage',
  },
  { name: 'browser.clearCookies', run: (c) => c.browser.clearCookies(), command: 'clearCookies' },
  { name: 'browser.resetWebview', run: (c) => c.browser.resetWebview(), command: 'resetWebview' },

  { name: 'kiosk.lock', run: (c) => c.kiosk.lock(), command: 'lockKiosk' },
  { name: 'kiosk.unlock', run: (c) => c.kiosk.unlock(), command: 'unlockKiosk' },
  {
    name: 'kiosk.enableLockedMode',
    run: (c) => c.kiosk.enableLockedMode(),
    command: 'enableLockedMode',
  },
  {
    name: 'kiosk.disableLockedMode',
    run: (c) => c.kiosk.disableLockedMode(),
    command: 'disableLockedMode',
  },
  {
    name: 'kiosk.setOverlayMessage',
    run: (c) => c.kiosk.setOverlayMessage('Back in 5'),
    command: 'setOverlayMessage',
    params: { text: 'Back in 5' },
  },
  {
    name: 'kiosk.clearOverlayMessage',
    run: (c) => c.kiosk.clearOverlayMessage(),
    command: 'setOverlayMessage',
    params: { text: '' },
  },
  { name: 'kiosk.popFragment', run: (c) => c.kiosk.popFragment(), command: 'popFragment' },

  {
    name: 'apps.start',
    run: (c) => c.apps.start('com.android.settings'),
    command: 'startApplication',
    params: { package: 'com.android.settings' },
  },
  {
    name: 'apps.startIntent',
    run: (c) => c.apps.startIntent('intent://x#Intent;end'),
    command: 'startIntent',
    params: { url: 'intent://x#Intent;end' },
  },
  { name: 'apps.toForeground', run: (c) => c.apps.toForeground(), command: 'toForeground' },
  { name: 'apps.toBackground', run: (c) => c.apps.toBackground(), command: 'toBackground' },
  { name: 'apps.restart', run: (c) => c.apps.restart(), command: 'restartApp' },
  { name: 'apps.exit', run: (c) => c.apps.exit(), command: 'exitApp' },
  { name: 'apps.kill', run: (c) => c.apps.kill(), command: 'killMyProcess' },
  {
    name: 'apps.installApk',
    run: (c) => c.apps.installApk('https://a.test/app.apk', true),
    command: 'loadApkFile',
    params: { url: 'https://a.test/app.apk', forceInstall: 'true' },
  },
  { name: 'apps.installState', run: (c) => c.apps.installState(), command: 'getInstallApkState' },
  {
    name: 'apps.uninstall',
    run: (c) => c.apps.uninstall('com.example'),
    command: 'uninstallApp',
    params: { package: 'com.example' },
  },
  {
    name: 'apps.killBackgroundProcesses',
    run: (c) => c.apps.killBackgroundProcesses('com.example'),
    command: 'killBackgroundProcesses',
    params: { package: 'com.example' },
  },
  {
    name: 'apps.clearAppData',
    run: (c) => c.apps.clearAppData('com.example'),
    command: 'clearAppData',
    params: { package: 'com.example' },
  },
  {
    name: 'apps.installUserCa',
    run: (c) => c.apps.installUserCa('https://a.test/ca.crt'),
    command: 'installUserCa',
    params: { url: 'https://a.test/ca.crt' },
  },

  {
    name: 'media.setVolume',
    run: (c) => c.media.setVolume(40),
    command: 'setAudioVolume',
    params: { level: '40', stream: '3' },
  },
  {
    name: 'media.playSound',
    run: (c) => c.media.playSound('https://a.test/beep.mp3', true),
    command: 'playSound',
    params: { url: 'https://a.test/beep.mp3', loop: 'true', stream: '3' },
  },
  { name: 'media.stopSound', run: (c) => c.media.stopSound(), command: 'stopSound' },
  { name: 'media.stopVideo', run: (c) => c.media.stopVideo(), command: 'stopVideo' },
  { name: 'media.playerStart', run: (c) => c.media.playerStart(), command: 'playerStart' },
  { name: 'media.playerStop', run: (c) => c.media.playerStop(), command: 'playerStop' },
  { name: 'media.playerPause', run: (c) => c.media.playerPause(), command: 'playerPause' },
  { name: 'media.playerResume', run: (c) => c.media.playerResume(), command: 'playerResume' },
  { name: 'media.playerNext', run: (c) => c.media.playerNext(), command: 'playerNext' },

  { name: 'speech.stop', run: (c) => c.speech.stop(), command: 'stopTextToSpeech' },

  { name: 'settings.list', run: (c) => c.settings.list(), command: 'listSettings' },
  {
    name: 'settings.setString',
    run: (c) => c.settings.setString('startURL', 'https://a.test'),
    command: 'setStringSetting',
    params: { key: 'startURL', value: 'https://a.test' },
  },
  {
    name: 'settings.setBoolean',
    run: (c) => c.settings.setBoolean('kioskMode', true),
    command: 'setBooleanSetting',
    params: { key: 'kioskMode', value: 'true' },
  },
  {
    name: 'settings.importFrom',
    run: (c) => c.settings.importFrom('https://a.test/settings.json'),
    command: 'importSettingsFile',
    params: { url: 'https://a.test/settings.json' },
  },

  {
    name: 'files.download',
    run: (c) => c.files.download('/sdcard/a.txt'),
    command: 'downloadFile',
    params: { filename: '/sdcard/a.txt' },
  },
  {
    name: 'files.deleteFile',
    run: (c) => c.files.deleteFile('/sdcard/a.txt'),
    command: 'deleteFile',
    params: { filename: '/sdcard/a.txt' },
  },
  {
    name: 'files.deleteFolder',
    run: (c) => c.files.deleteFolder('/sdcard/tmp'),
    command: 'deleteFolder',
    params: { foldername: '/sdcard/tmp' },
  },
  {
    name: 'files.loadZip',
    run: (c) => c.files.loadZip('https://a.test/a.zip', '/sdcard/tmp'),
    command: 'loadZipFile',
    params: { url: 'https://a.test/a.zip', dir: '/sdcard/tmp' },
  },

  { name: 'capture.screenshot', run: (c) => c.capture.screenshot(), command: 'getScreenshot' },
  { name: 'capture.camshot', run: (c) => c.capture.camshot(), command: 'getCamshot' },

  { name: 'system.reboot', run: (c) => c.system.reboot(), command: 'rebootDevice' },
  { name: 'system.shutdown', run: (c) => c.system.shutdown(), command: 'shutdownDevice' },
  {
    name: 'system.runRootCommand',
    run: (c) => c.system.runRootCommand('ls /'),
    command: 'runRootCommand',
    params: { command: 'ls /' },
  },
  {
    name: 'system.runSuCommand',
    run: (c) => c.system.runSuCommand('id'),
    command: 'runSuCommand',
    params: { command: 'id' },
  },
];

describe('command wrappers', () => {
  it.each(CASES)('$name sends cmd=$command', async ({ run, command, params }) => {
    let requested: string | undefined;
    const client = new FullyKioskClient({
      host: '10.0.0.5',
      password: 'pw',
      fetch: ((url: string) => {
        requested = url;
        return Promise.resolve(
          new Response('{"status":"OK"}', { headers: { 'content-type': 'application/json' } }),
        );
      }) satisfies FetchLike,
    });

    await run(client);

    if (!requested) throw new Error('the command did not send a request');
    const query = new URL(requested).searchParams;

    expect(query.get('cmd')).toBe(command);
    expect(query.get('password')).toBe('pw');

    for (const [key, value] of Object.entries(params ?? {})) {
      expect(query.get(key), `parameter "${key}"`).toBe(value);
    }
  });

  it('covers every method of every command group', () => {
    const client = new FullyKioskClient({ host: 'h', password: 'pw' });
    const groups = [
      'device',
      'screen',
      'motion',
      'browser',
      'kiosk',
      'apps',
      'media',
      'speech',
      'settings',
      'files',
      'capture',
      'system',
    ] as const;

    const tested = new Set(CASES.map((testCase) => testCase.name));
    // Methods verified elsewhere: they take options that deserve their own
    // assertions rather than a name-only check.
    const verifiedElsewhere = new Set([
      'screen.setBrightness',
      'browser.loadUrl',
      'media.playVideo',
      'speech.say',
      'motion.enable',
      'motion.disable',
      'settings.get',
    ]);

    const missing: string[] = [];
    for (const group of groups) {
      const instance = client[group] as unknown as object;
      for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
        if (method === 'constructor') continue;
        const name = `${group}.${method}`;
        if (!tested.has(name) && !verifiedElsewhere.has(name)) missing.push(name);
      }
    }

    expect(missing).toEqual([]);
  });
});
