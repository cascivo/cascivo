# Contributing to cascivo

Thanks for your interest in contributing! This guide covers the essentials.
For the full architecture and authoring rules, read [`CLAUDE.md`](./CLAUDE.md)
(human + AI contributors) and [`AGENTS.md`](./AGENTS.md) (vendor-neutral AI guide).

## Prerequisites

- Node.js `>=22.12`
- pnpm `>=11`
- The bundled toolchain is vite+ (`vp`) — installed via `pnpm install`.

## Getting started

```sh
pnpm install
pnpm dev:docs      # run the docs site
pnpm dev:landing   # run the landing site
```

## Before you open a PR

Run the full gate. It must exit cleanly:

```sh
pnpm ready
```

This runs `regen` → `vp check --fix` → build → type check → tests. If `regen`
or `--fix` modify generated files (registry, llms.txt, sitemap, README, etc.),
commit those changes alongside your own.

To mirror CI exactly (cold cache, sequential builds):

```sh
pnpm ready:ci
```

## Authoring rules (non-negotiable)

Components live in `packages/components/`. Each must:

- Use **signals**, not React state hooks (`useState`/`useEffect`/`useContext`
  are banned — see the reactivity rules in `CLAUDE.md`).
- Use **modern CSS only** (`@layer`, `@container`, `:has()`, custom properties).
  No Tailwind, no CSS-in-JS.
- Meet **WCAG 2.2 AA** and be mobile-first + RTL-ready (CSS logical properties).
- Default user-visible strings from the `@cascivo/i18n` catalog.
- Ship a `component.meta.ts` manifest and be exported from
  `packages/react/src/index.ts`.

## Commit & release

- Add a changeset for any user-facing package change: `pnpm changeset`.
- Keep changes surgical — touch only what the change requires.

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE) and that you will follow the
[Code of Conduct](./CODE_OF_CONDUCT.md).
