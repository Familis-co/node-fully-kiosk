# Contributing

Thanks for helping out. This repository is a pnpm workspace holding the `@familis/node-fully-kiosk` package, which publishes three entry points: the REST client, `/react` and `/js`.

Taking part means following the [Code of Conduct](.github/CODE_OF_CONDUCT.md). Found a vulnerability? Do not open an issue — the [security policy](.github/SECURITY.md) explains how to report it privately.

## Getting set up

```bash
pnpm install
```

That installs the workspace and lets lefthook install the git hooks. Node 20.11 or later is required.

## Working on a change

`main` stays deployable, so work happens on a branch cut from it:

```bash
git switch -c feature/screensaver-commands
```

Branch names are `feature/…`, `fix/…` or `docs/…`, and a branch, a pull request and a commit should each carry one logical change.

While you work:

```bash
pnpm dev           # rebuild on change
pnpm test:watch    # vitest in watch mode
```

Before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The pre-commit hook runs lint-staged over the staged files, and the pre-push hook runs the typecheck and the tests, so most of this happens for you.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and the `commit-msg` hook rejects anything else:

```
feat(core): add startDaydream command
fix(react): stop useFullyQuery from setting state after unmount
docs: document the JavaScript interface setup
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. The scope is usually `core`, `react` or `js`.

## Changesets

Anything that changes published behaviour needs a changeset:

```bash
pnpm changeset
```

Pick the bump level, then describe the change from the user's point of view — that text becomes the changelog entry. Commit the generated file in `.changeset/` along with your work.

When the pull request lands on `main`, the release workflow opens a version pull request. Merging that publishes to npm.

## Adding a command or a hook

- New REST commands go into the matching group under `packages/core/src/commands/`, or into a new group when nothing fits. Export the group from `packages/core/src/index.ts`.
- New React hooks go into `packages/core/src/react/hooks/` and are exported from `packages/core/src/react/index.ts`.
- New JavaScript interface functions go into the `FullyJsInterface` type in `packages/core/src/js-interface/types.ts`, keeping the signature the [official documentation](https://www.fully-kiosk.com/en/#websiteintegration) states.
- New events go into `FULLY_EVENTS` in `packages/core/src/js-interface/events.ts`. Payload types are derived from the placeholder list, so adding the entry is enough.
- Every exported function, method and hook carries TSDoc covering each parameter.

## Opening an issue

Issues go through a form, so pick the one that fits:

- **Bug report** — the SDK does not behave the way it is documented. The form asks for the entry point, a reproduction and the versions involved.
- **Feature request** — a REST command, hook or `fully` binding the SDK does not cover yet. Linking the upstream Fully Kiosk documentation is usually enough.

Questions about how to use the SDK belong in [Discussions](https://github.com/Familis-co/node-fully-kiosk/discussions), and problems with the app itself belong with [Fully Kiosk support](https://www.fully-kiosk.com/en/#support).

## Writing a pull request

Opening one fills in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md). Work through it rather than deleting it.

Describe _why_ the change is needed, not only what it does. If it changes behaviour on a device, say which Fully Kiosk version and which Android version you tested against.
