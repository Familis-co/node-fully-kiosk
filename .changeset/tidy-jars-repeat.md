---
'@familis/node-fully-kiosk': patch
---

Correct the supported Node version in the README.

It advertised Node 20.11+, while `engines` has always required 22.13 or later, so `pnpm add` on Node 20 failed against a README that said it would work. The README now states the version the package actually installs on, which is also the floor CI tests against.

Documentation only; nothing in `dist` changes.
