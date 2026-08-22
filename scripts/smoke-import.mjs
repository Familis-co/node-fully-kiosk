/**
 * Imports every published entry point and exercises the parts that would break
 * if an export map, a build target or a Node version floor regressed.
 *
 * Runs against an installed tarball rather than the workspace sources, on the
 * oldest Node version `engines.node` claims to support. Plain Node and npm
 * only: the pnpm that builds this repo needs a newer Node than the published
 * package does.
 */
import assert from 'node:assert/strict';

import { AudioStream, FullyKioskClient, FullyKioskAuthError } from '@familis/node-fully-kiosk';
import { FULLY_EVENT_NAMES, isFullyKiosk, onFullyEvent } from '@familis/node-fully-kiosk/js';
import * as hooks from '@familis/node-fully-kiosk/react';

const client = new FullyKioskClient({ host: '10.0.0.5', password: 'pw' });
assert.equal(client.baseUrl, 'http://10.0.0.5:2323/', 'the client should default to port 2323');
assert.equal(AudioStream.Music, 3, 'the audio stream constants should be exported');
assert.ok(FullyKioskAuthError.prototype instanceof Error, 'errors should extend Error');

assert.ok(FULLY_EVENT_NAMES.length > 0, 'the event registry should not be empty');
assert.equal(isFullyKiosk(), false, 'the JavaScript interface must be absent outside the kiosk');
assert.equal(typeof onFullyEvent, 'function', 'onFullyEvent should be exported');

for (const name of ['FullyKioskProvider', 'useFullyScreen', 'useDeviceInfo', 'useFullyEvent']) {
  assert.equal(typeof hooks[name], 'function', `${name} should be exported from /react`);
}

// The REST client must work on this Node version, not merely import. The stub
// goes through the documented `fetch` option rather than a global patch,
// because the transport resolves the global once when it is constructed.
const stubbed = new FullyKioskClient({
  host: '10.0.0.5',
  password: 'pw',
  fetch: () =>
    Promise.resolve(
      new Response('{"deviceName":"Lobby tablet","batteryLevel":91}', {
        headers: { 'content-type': 'application/json' },
      }),
    ),
});

const info = await stubbed.device.info();
assert.equal(info.deviceName, 'Lobby tablet', 'the client should decode a device info payload');

await assert.rejects(
  () =>
    new FullyKioskClient({
      host: '10.0.0.5',
      password: 'pw',
      retries: 0,
      fetch: () =>
        Promise.resolve(
          new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
        ),
    }).device.info(),
  FullyKioskAuthError,
  'an HTML login page should surface as an auth error',
);

console.log(`OK on Node ${process.version}: 3 entry points, ${FULLY_EVENT_NAMES.length} events`);
