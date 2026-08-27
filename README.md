# node-fully-kiosk

[![npm](https://img.shields.io/npm/v/@familis/node-fully-kiosk?logo=npm&logoColor=white)](https://www.npmjs.com/package/@familis/node-fully-kiosk)
[![CI](https://img.shields.io/github/actions/workflow/status/familis-co/node-fully-kiosk/ci.yml?branch=main&logo=github&label=CI)](https://github.com/familis-co/node-fully-kiosk/actions/workflows/ci.yml)
[![Bundle size](https://img.shields.io/bundlejs/size/@familis/node-fully-kiosk)](https://bundlejs.com/?q=%40familis%2Fnode-fully-kiosk)
[![Node](https://img.shields.io/node/v/@familis/node-fully-kiosk?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/npm/l/@familis/node-fully-kiosk)](LICENSE)

TypeScript SDK for [Fully Kiosk Browser](https://www.fully-kiosk.com/en), published to npm as [`@familis/node-fully-kiosk`](https://www.npmjs.com/package/@familis/node-fully-kiosk) — one package with three entry points.

| Import                            | For                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@familis/node-fully-kiosk`       | The Remote Admin **REST API** — control a device over the network                                |
| `@familis/node-fully-kiosk/react` | **React hooks** over both surfaces                                                               |
| `@familis/node-fully-kiosk/js`    | Typed bindings for the **JavaScript interface**, the `fully` object injected into the kiosk page |

Two ways to talk to a device are covered, and they are not interchangeable:

- **REST API** — you are _outside_ the device (a Node service, a dashboard, a Home Assistant style integration) and reach it over the network at `http://<ip>:2323`. Requires _Remote Administration_ enabled on the device.
- **JavaScript interface** — your web app _is_ the kiosk page, running inside Fully Kiosk, and calls the injected `fully` object directly. Requires _Advanced Web Settings → Enable JavaScript Interface_.

Both are PLUS features of Fully Kiosk.

## Install

```bash
pnpm add @familis/node-fully-kiosk
```

React is an optional peer dependency, only needed if you import `@familis/node-fully-kiosk/react`.

## Controlling a device over REST

```ts
import { FullyKioskClient } from '@familis/node-fully-kiosk';

const kiosk = new FullyKioskClient({
  host: '192.168.1.20',
  password: process.env.FULLY_PASSWORD!,
});

const info = await kiosk.device.info();
console.log(`${info.deviceName}: ${info.batteryLevel}% battery`);

await kiosk.screen.on();
await kiosk.screen.setBrightness(200);
await kiosk.browser.loadUrl('https://dashboard.example.com');
await kiosk.speech.say('Good morning', { locale: 'en_GB' });
```

Commands are grouped by topic — `device`, `screen`, `motion`, `browser`, `kiosk`, `apps`, `media`, `speech`, `settings`, `files`, `capture`, `system` — and anything not wrapped yet is reachable through `kiosk.command('someNewCommand', { ... })`.

## Building the kiosk page itself

```tsx
import {
  useFullyBattery,
  useFullyQrScanner,
  useFullyScreen,
} from '@familis/node-fully-kiosk/react';

function Kiosk() {
  const screen = useFullyScreen();
  const battery = useFullyBattery();
  const scanner = useFullyQrScanner({ prompt: 'Scan your ticket' });

  return (
    <>
      <p>
        {battery.level}% {battery.plugged ? `(${battery.source})` : ''}
      </p>
      <button onClick={() => screen.turnOff()}>{screen.isOn ? 'Sleep' : 'Asleep'}</button>
      <button onClick={scanner.scan}>Scan</button>
      {scanner.code && <p>Scanned: {scanner.code}</p>}
    </>
  );
}
```

No provider is needed for the JavaScript-interface hooks — they talk to the `fully` object in the page. Hooks that go over the network need a client:

```tsx
import { FullyKioskProvider, useDeviceInfo } from '@familis/node-fully-kiosk/react';

<FullyKioskProvider options={{ host: '192.168.1.20', password: 'secret' }}>
  <Fleet />
</FullyKioskProvider>;

function Fleet() {
  const { data, isLoading } = useDeviceInfo({ refetchInterval: 10_000 });
  return isLoading ? <Spinner /> : <p>{data?.deviceName}</p>;
}
```

Every command, hook and event is documented in the [package README](packages/core/README.md).

## Enabling the device

In the Fully Kiosk app:

1. **Remote Administration** → enable it, set a _Remote Admin Password_, and keep _Remote Admin from Local Network_ on. This is what the REST client authenticates against.
2. **Advanced Web Settings → Enable JavaScript Interface** → only if your own page needs the `fully` object. Fully warns that any loaded website can then read local files, so pair it with a URL whitelist.

## Repository layout

```
packages/
  core/    @familis/node-fully-kiosk   REST client, JavaScript interface bindings, React hooks
```

A pnpm workspace with one published package today, so example apps and future packages can be added without restructuring.

## Development

```bash
pnpm install       # installs the workspace and wires up the git hooks
pnpm build         # tsup, ESM + CJS + declarations for all three entry points
pnpm test          # vitest
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint, flat config
pnpm format        # prettier
pnpm changeset     # record a change for the next release
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/); lefthook enforces the format and runs lint-staged before each commit, plus typecheck and tests before a push. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © Familis
