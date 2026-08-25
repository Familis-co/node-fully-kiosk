## Why

<!-- What problem does this solve? Link the issue it closes: "Closes #123". -->

## What changed

<!-- The shape of the change, not a file-by-file replay of the diff. -->

## Surface

<!-- Tick every entry point this touches. -->

- [ ] `@familis/node-fully-kiosk` — the Remote Admin REST client
- [ ] `@familis/node-fully-kiosk/react` — the React hooks
- [ ] `@familis/node-fully-kiosk/js` — the JavaScript interface bindings
- [ ] Build, CI or repository tooling only

## Testing

<!--
Which tests cover this. If the change was verified against a real device,
say which Fully Kiosk version and which Android version you tested against.
-->

## Checklist

- [ ] The branch is cut from `main` and carries one logical change
- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass
- [ ] Every new exported function, method and hook carries TSDoc
- [ ] A changeset is included (`pnpm changeset`), or the change does not alter published behaviour
- [ ] Breaking changes are called out below

## Breaking changes

<!-- Delete this section if there are none. Otherwise: what breaks, and how to migrate. -->
