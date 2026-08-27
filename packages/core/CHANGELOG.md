# @familis/node-fully-kiosk

## 0.1.1

### Patch Changes

- [#20](https://github.com/Familis-co/node-fully-kiosk/pull/20) [`eff93ac`](https://github.com/Familis-co/node-fully-kiosk/commit/eff93ac3005280beed8e52e0a0f285505dbc7948) Thanks [@glazk0](https://github.com/glazk0)! - Correct the supported Node version in the README.
  
  It advertised Node 20.11+, while `engines` has always required 22.13 or later, so `pnpm add` on Node 20 failed against a README that said it would work. The README now states the version the package actually installs on, which is also the floor CI tests against.
  
  Documentation only; nothing in `dist` changes.

## 0.1.0

### Minor Changes

- [`701117f`](https://github.com/Familis-co/node-fully-kiosk/commit/701117f6cd51fe153cd2449641066e1d784c09dd) Thanks [@glazk0](https://github.com/glazk0)! - Initial release.
  
  A typed client for the Fully Kiosk Remote Admin REST API, with commands grouped by topic, configurable timeouts and retries, typed errors that tell an unreachable device apart from a rejected password, and an escape hatch for commands newer than the SDK.
  
  `@familis/node-fully-kiosk/js` adds typed bindings for the in-page JavaScript interface, including an event emitter that multiplexes listeners over Fully's single `fully.bind` handler per event.
  
  `@familis/node-fully-kiosk/react` adds hooks over both surfaces: `useFully*` hooks for the page running inside Fully Kiosk, and provider-backed hooks for controlling a device over the network.
