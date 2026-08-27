# @familis/node-fully-kiosk

[![npm](https://img.shields.io/npm/v/@familis/node-fully-kiosk?logo=npm&logoColor=white)](https://www.npmjs.com/package/@familis/node-fully-kiosk)
[![CI](https://img.shields.io/github/actions/workflow/status/familis-co/node-fully-kiosk/ci.yml?branch=main&logo=github&label=CI)](https://github.com/familis-co/node-fully-kiosk/actions/workflows/ci.yml)
[![Bundle size](https://img.shields.io/bundlejs/size/@familis/node-fully-kiosk)](https://bundlejs.com/?q=%40familis%2Fnode-fully-kiosk)
[![Node](https://img.shields.io/node/v/@familis/node-fully-kiosk?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/npm/l/@familis/node-fully-kiosk)](https://github.com/familis-co/node-fully-kiosk/blob/main/LICENSE)

Typed SDK for [Fully Kiosk Browser](https://www.fully-kiosk.com/en), with three entry points:

| Import                            | For                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@familis/node-fully-kiosk`       | The Remote Admin **REST API** — control a device over the network from Node.js or a browser      |
| `@familis/node-fully-kiosk/react` | **React hooks** over both surfaces below                                                         |
| `@familis/node-fully-kiosk/js`    | Typed bindings for the **JavaScript interface**, the `fully` object injected into the kiosk page |

React is an optional peer dependency: it is only needed if you import `/react`.

## Install

```bash
pnpm add @familis/node-fully-kiosk

# only if you import @familis/node-fully-kiosk/react
pnpm add react
```

Node 22.13+ or any runtime with a global `fetch`. React 18 or 19 for the hooks. ESM and CJS builds ship side by side.

## REST client

Enable _Remote Administration_ in the Fully Kiosk app and set a Remote Admin Password. The REST interface is a PLUS feature.

```ts
import { FullyKioskClient } from '@familis/node-fully-kiosk';

const kiosk = new FullyKioskClient({
  host: '192.168.1.20', // also accepts '192.168.1.20:2323' or 'https://kiosk.local'
  password: 'secret',
  timeout: 10_000,
  retries: 2,
});

const info = await kiosk.device.info();
await kiosk.screen.on();
```

### Options

| Option         | Default | Notes                                                                                          |
| -------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `host`         | —       | Bare host, `host:port`, or a full origin. A scheme in `host` wins over `protocol`.             |
| `password`     | —       | The Remote Admin password.                                                                     |
| `port`         | `2323`  | Ignored when `host` already carries a port.                                                    |
| `protocol`     | `http`  | Used only when `host` has no scheme.                                                           |
| `timeout`      | `10000` | Per-request, in milliseconds.                                                                  |
| `retries`      | `2`     | Only connection failures and HTTP 5xx are retried.                                             |
| `retryDelay`   | `300`   | Base delay in milliseconds, doubled per attempt.                                               |
| `requestStyle` | `cmd`   | `cmd` builds `/?cmd=screenOn`, `path` builds `/screenOn`. Both work on current Fully versions. |
| `fetch`        | global  | Inject undici, a proxy-aware fetch, or a test double.                                          |
| `headers`      | `{}`    | Extra headers on every request.                                                                |
| `onRequest`    | —       | Called per attempt with the URL, password redacted. Handy for logging.                         |

### Commands

| Group      | Commands                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `device`   | `info`, `log`, `logcat`, `stats`                                                                                                                                                         |
| `screen`   | `on`, `off`, `forceSleep`, `setBrightness`, `startScreensaver`, `stopScreensaver`, `startDaydream`, `stopDaydream`                                                                       |
| `motion`   | `trigger`, `enable`, `disable`                                                                                                                                                           |
| `browser`  | `loadUrl`, `loadStartUrl`, `injectJavascript`, `focusTab`, `closeTab`, `refreshTab`, `clearCache`, `clearWebStorage`, `clearCookies`, `resetWebview`                                     |
| `kiosk`    | `lock`, `unlock`, `enableLockedMode`, `disableLockedMode`, `setOverlayMessage`, `clearOverlayMessage`, `popFragment`                                                                     |
| `apps`     | `start`, `startIntent`, `toForeground`, `toBackground`, `restart`, `exit`, `kill`, `installApk`, `installState`, `uninstall`, `killBackgroundProcesses`, `clearAppData`, `installUserCa` |
| `media`    | `setVolume`, `playSound`, `stopSound`, `playVideo`, `stopVideo`, `playerStart`, `playerStop`, `playerPause`, `playerResume`, `playerNext`                                                |
| `speech`   | `say`, `stop`                                                                                                                                                                            |
| `settings` | `list`, `get`, `setString`, `setBoolean`, `importFrom`                                                                                                                                   |
| `files`    | `download`, `deleteFile`, `deleteFolder`, `loadZip`                                                                                                                                      |
| `capture`  | `screenshot`, `camshot`                                                                                                                                                                  |
| `system`   | `reboot`, `shutdown`, `runRootCommand`, `runSuCommand`                                                                                                                                   |

Anything Fully adds after this release is still reachable:

```ts
await kiosk.command('someNewCommand', { key: 'value' });
const bytes = await kiosk.commandBinary('someNewImageCommand');
```

### Screenshots

```ts
import { toDataUrl } from '@familis/node-fully-kiosk';
import { writeFile } from 'node:fs/promises';

const shot = await kiosk.capture.screenshot();
await writeFile('screen.png', shot.data); // raw bytes
const src = toDataUrl(shot); // or a data: URL for an <img>
```

### Errors

Every failure is a subclass of `FullyKioskError`, so you can narrow on what actually went wrong:

```ts
import { FullyKioskAuthError, FullyKioskConnectionError } from '@familis/node-fully-kiosk';

try {
  await kiosk.device.info();
} catch (error) {
  if (error instanceof FullyKioskAuthError) rotatePassword();
  else if (error instanceof FullyKioskConnectionError) markOffline();
  else throw error;
}
```

| Error                       | Raised when                                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `FullyKioskConnectionError` | The device is unreachable.                                                                                           |
| `FullyKioskTimeoutError`    | The request exceeded the timeout.                                                                                    |
| `FullyKioskAuthError`       | The password was rejected. Fully answers with its HTML login page and HTTP 200, which is detected and reported here. |
| `FullyKioskHttpError`       | A non-2xx status came back.                                                                                          |
| `FullyKioskCommandError`    | The device replied `{"status":"Error"}`.                                                                             |
| `FullyKioskParseError`      | The response body was not the expected JSON.                                                                         |

## JavaScript interface

For code running _inside_ the kiosk page. Enable _Advanced Web Settings → Enable JavaScript Interface_ first; Fully warns that any loaded website can then read local files, so pair it with a URL whitelist.

```ts
import {
  getFully,
  isFullyKiosk,
  onFullyEvent,
  readFullyDeviceInfo,
} from '@familis/node-fully-kiosk/js';

if (isFullyKiosk()) {
  const device = readFullyDeviceInfo();
  getFully()?.showToast(`Running on ${device.deviceName}`);
}

const off = onFullyEvent('onQrScanSuccess', ({ code }) => console.log('scanned', code));
```

`FullyJsInterface` types every one of Fully's ~190 functions, so `getFully()` gives full autocompletion.

### Events

Fully's `fully.bind(event, jsCode)` takes a **string of JavaScript source** and keeps only one handler per event, which makes it awkward to share. `onFullyEvent` binds each event once, installs a dispatcher on `globalThis`, and multiplexes any number of typed listeners over it:

```ts
onFullyEvent('onBatteryLevelChanged', ({ level }) => setBattery(level)); // level is a number
onFullyEvent('onNfcTagDiscovered', ({ serial, type, message, data }) => …);
```

Payload types are derived from the placeholder list of each event, so `level` arrives as a `number` and `serial` as a `string` without any casting on your side.

Two limitations come from Fully itself and cannot be worked around here: there is no way to _unbind_ an event, so a binding lives for the lifetime of the page (removing the last listener simply stops delivery), and a placeholder value containing a single quote breaks the generated handler source.

Every event in the official documentation is covered — screen, keyboard, network, power, screensaver, daydream, battery, volume keys, headphones, motion, faces, darkness, movement, iBeacon, broadcasts, QR scans, TTS lifecycle, downloads, unzip, Bluetooth and NFC. `FULLY_EVENT_NAMES` lists them all.

### Reading device state

```ts
import {
  getFullyBluetoothDevices,
  getFullyCamshotDataUrl,
  getFullyFileList,
  getFullyLocation,
  getFullyScreenshotDataUrl,
  getFullyTabList,
  readFullyDeviceInfo,
  safeCall,
} from '@familis/node-fully-kiosk/js';
```

`safeCall` is the escape hatch for anything else: it returns a fallback when the interface is missing, when the function does not exist on the installed Fully version, or when the call throws because a permission was denied.

```ts
const luma = safeCall((fully) => fully.getAverageLuma(), 0);
```

## React hooks

```bash
import { … } from '@familis/node-fully-kiosk/react';
```

Two families of hooks, matching Fully's two integration surfaces:

- **JavaScript interface hooks** (`useFully*`) — for the page running _inside_ Fully Kiosk. They need no provider and degrade to inert fallbacks in a normal browser, so the same build works on a desktop during development.
- **REST hooks** — for controlling a device _over the network_. They need a `FullyKioskProvider` holding a client.

The entry point is marked `'use client'`, so it drops into a Next.js App Router project without extra wrapping.

### Inside the kiosk page

```tsx
import {
  useFullyBattery,
  useFullyMotion,
  useFullyQrScanner,
  useFullyScreen,
  useIsFullyKiosk,
} from '@familis/node-fully-kiosk/react';

function Kiosk() {
  const isKiosk = useIsFullyKiosk();
  const screen = useFullyScreen();
  const battery = useFullyBattery();
  const motion = useFullyMotion();
  const scanner = useFullyQrScanner({ prompt: 'Scan your ticket' });

  if (!isKiosk) return <p>Open this page in Fully Kiosk Browser.</p>;

  return (
    <>
      <p>
        {battery.level}% {battery.plugged ? `(${battery.source})` : 'on battery'}
      </p>
      <p>Motion events: {motion.count}</p>
      <button onClick={() => screen.turnOff()}>{screen.isOn ? 'Sleep' : 'Asleep'}</button>
      <button onClick={scanner.scan} disabled={scanner.isScanning}>
        Scan
      </button>
      {scanner.code && <p>Scanned {scanner.code}</p>}
    </>
  );
}
```

| Hook                                                           | Gives you                                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `useIsFullyKiosk`                                              | Whether the page runs inside Fully with the interface enabled                      |
| `useFully`                                                     | The raw `fully` object for anything not wrapped here                               |
| `useFullyValue`                                                | Any getter, read once or polled, with a fallback                                   |
| `useFullyEvent` / `useLatestFullyEvent` / `useFullyEventCount` | Typed subscriptions to Fully events                                                |
| `useFullyDeviceInfo`                                           | A full device snapshot                                                             |
| `useFullyScreen`                                               | `isOn` plus `turnOn`, `turnOff`, `forceSleep`                                      |
| `useFullyBrightness`                                           | Read and set screen brightness                                                     |
| `useFullyScreensaver`                                          | Screensaver and daydream state and control                                         |
| `useFullyKeyboard`                                             | Soft keyboard visibility, `show`, `hide`                                           |
| `useFullyBattery`                                              | Level and power source, event driven                                               |
| `useFullyNetwork`                                              | Connectivity and Wi-Fi state, event driven                                         |
| `useFullyMotion`                                               | Motion count, face count, darkness, start/stop/trigger                             |
| `useFullyBeacons`                                              | iBeacons in range, with a time-to-live                                             |
| `useFullyQrScanner`                                            | Drives the built-in barcode scanner                                                |
| `useFullyNfc`                                                  | NFC scanning and the last tag read                                                 |
| `useFullyBluetoothSerial`                                      | SPP connect, send, and buffered incoming lines                                     |
| `useFullyTextToSpeech`                                         | `say`, `stop`, `isSpeaking`, engine info                                           |
| `useFullyAudio`                                                | Volume, sounds, video playback                                                     |
| `useFullyKioskMode`                                            | Kiosk lock, maintenance mode, message overlay                                      |
| `useFullyApp`                                                  | Foreground state, restart, exit, launch other apps, toasts, notifications, vibrate |
| `useFullyStringSetting` / `useFullyBooleanSetting`             | Two-way binding to any Fully setting                                               |
| `useFullyTabs`                                                 | Tab list, focus, close, open                                                       |
| `useFullyClipboard`                                            | Read and write the Android clipboard                                               |
| `useFullyBroadcastReceiver`                                    | Subscribe to an Android broadcast action                                           |
| `useFullyDownload`                                             | Download and unzip files, with outcome events                                      |
| `useFullyFileList`                                             | List a folder, read, write, delete                                                 |
| `useFullyLocation`                                             | Last known device location                                                         |
| `useFullySensor`                                               | Any environment sensor by Android type                                             |
| `useFullyIdleTime`                                             | Milliseconds since the last user interaction                                       |
| `useFullyScreenshot` / `useFullyCamshot`                       | Local captures as `data:` URLs                                                     |

Event driven hooks are seeded from the device and then updated by Fully's events, so no polling is involved. Hooks that must poll take an interval and default to off.

### Controlling a device over the network

```tsx
import {
  FullyKioskProvider,
  useDeviceInfo,
  useScreenControl,
} from '@familis/node-fully-kiosk/react';

function App() {
  return (
    <FullyKioskProvider options={{ host: '192.168.1.20', password: 'secret' }}>
      <Panel />
    </FullyKioskProvider>
  );
}

function Panel() {
  const { data, isLoading, error } = useDeviceInfo({ refetchInterval: 10_000 });
  const screen = useScreenControl();

  if (isLoading) return <Spinner />;
  if (error) return <p>{error.message}</p>;

  return (
    <>
      <p>
        {data?.deviceName} — {data?.batteryLevel}%
      </p>
      <button onClick={screen.turnOn} disabled={screen.isPending}>
        Wake
      </button>
    </>
  );
}
```

Pass a `client` instead of `options` when you build the client yourself, for instance to share one across a fleet view.

| Hook                           | Gives you                                               |
| ------------------------------ | ------------------------------------------------------- |
| `useDeviceInfo`                | Device information, optionally polled                   |
| `useDeviceReachable`           | Whether the device answers and the password is accepted |
| `useSettings` / `useSetting`   | Read all settings, or bind one key two-way              |
| `useScreenshot` / `useCamshot` | Captures as `data:` URLs                                |
| `useScreenControl`             | Screen power, brightness, screensaver                   |
| `useKioskControl`              | Lock, maintenance mode, overlay, restart                |
| `useNavigation`                | Load URLs, tabs, clear cache and cookies                |
| `useMediaControl`              | Volume, sounds, video                                   |
| `useRemoteSpeech`              | Text to speech                                          |
| `useFullyQuery`                | Any read, with loading, error, polling and refetch      |
| `useFullyCommand`              | Any one-shot command, with pending and error state      |
| `useFullyKioskClient`          | The client itself                                       |

Reads share one shape:

```ts
const { data, error, isLoading, isFetching, updatedAt, refetch } = useDeviceInfo();
```

Action groups share another, so a panel of buttons can use one busy indicator:

```ts
const { isPending, error, reset, ...actions } = useScreenControl();
```

Nothing here throws on a device failure. A rejected request lands in `error`, which keeps a kiosk dashboard from unmounting when one tablet goes offline.

Anything not wrapped yet stays reachable:

```tsx
const client = useFullyKioskClient();

const tabs = useFullyQuery((signal) => client.command('getTabList', {}, { signal }));
const brandNew = useFullyCommand(() => client.command('someNewCommand'));
```

## License

MIT © Familis
