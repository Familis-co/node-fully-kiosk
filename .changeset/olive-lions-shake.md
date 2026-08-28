---
'@familis/node-fully-kiosk': patch
---

Stop `useFullyClipboard` reporting a value for a write that reached no device

`write` set the hook's `value` whether or not the Fully Kiosk JavaScript
interface was there to receive the text. Outside Fully Kiosk nothing was
copied, yet a UI rendering `value` as confirmation would show a successful
copy. It now writes state only once the interface has accepted the text.
