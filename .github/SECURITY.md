# Security policy

## Supported versions

`@familis/node-fully-kiosk` is pre-1.0. Only the latest published minor receives security fixes; there are no backports to earlier lines.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| < 0.1   | No        |

## Reporting a vulnerability

Report privately through a [GitHub security advisory](https://github.com/Familis-co/node-fully-kiosk/security/advisories/new). Please do not open a public issue, and do not describe the problem in a pull request.

Include what you can of:

- the entry point involved — the REST client, `/react` or `/js`
- the SDK version and the runtime it was reproduced on
- a proof of concept, with device addresses and Remote Admin passwords redacted
- what an attacker gains

You can expect an acknowledgement within a week. Once a fix ships, the advisory is published and credits you unless you would rather stay anonymous.

## Scope

This policy covers the SDK's own code: how it builds requests, handles credentials passed to it and parses device responses.

Two things sit outside it:

- **Fully Kiosk Browser itself.** Report those to [Fully Kiosk support](https://www.fully-kiosk.com/en/#support).
- **The Remote Admin protocol's design.** The API authenticates by taking the admin password as a `password` query parameter, and the SDK cannot change that. It defaults to `http` on port 2323, so pass `protocol: 'https'` where the device supports it, keep the device network off the open internet, and use `redactUrl` before logging a request URL.
