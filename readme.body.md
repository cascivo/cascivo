## What is cascivo?

cascivo is an open-source React design system built on **modern web standards** instead of build-time tooling. Components are styled with pure CSS (`@layer`, `@container`, `:has()`, custom properties — no Tailwind, no CSS-in-JS), made interactive with **Preact Signals + a micro-FSM** instead of `useState`/`useContext`, and shipped with a **machine-readable manifest** so AI agents can select, configure, and verify them.

You own the code. Like shadcn/ui, components are copy-pasted into your project via the CLI — but unlike shadcn, there is no Tailwind dependency and no utility-class soup, just tokens and CSS modules you can read and edit. Prefer a normal dependency? [`@cascivo/react`](packages/react) ships every component prebuilt.

## Highlights

- **165 components, 7 categories** — inputs, display, overlay, navigation, layout, feedback, and 16 charts, all from a single token system.
- **Modern CSS only** — `@layer` for predictable cascade, `@container` for slot-aware responsiveness, `:has()` for stateful styling. No Tailwind, no runtime style injection.
- **Signal-driven interactivity** — fine-grained Preact Signals + a micro-FSM update precise DOM nodes with zero unnecessary React re-renders. RSC-compatible (`"use client"` preserved).
- **Beautiful by default** — 14 first-party themes (light, dark, warm, midnight, pastel, brutalist, corporate, terminal, cyberpunk, and more), applied via `data-theme` on any container, scoped to any subtree.
- **Three-level tokens** — primitive → semantic → component. Themes remap the semantic layer; you override component tokens for per-brand adaptation with no rebuild.
- **AI-first context layer** — every component ships a `component.meta.ts` manifest; an MCP server, Claude Code skills, a closed-set token catalog, and `cascivo audit --ai` let agents generate against real props and have their output checked.
- **Earned accessibility** — WCAG 2.2 AA + APG-conformant, CI-enforced; CVD-safe chart palettes (Okabe-Ito, oklch); keyboard-navigable chart tooltips with `aria-live`; an AT support matrix (NVDA / JAWS / VoiceOver).
- **Mobile-first & RTL-ready** — fluid type, container queries, CSS logical properties, ≥44px touch targets, and zero overflow from 320–414px.
- **Open registry** — publish your own components and host your own registry; install from any registry with `cascivo add owner/repo/component`.

## Quick Start

```sh
# Scaffold config + tokens, then copy a component into your project
npx cascivo init
npx cascivo add button card dialog
```

```tsx
import '@cascivo/themes/all' // tokens + base typography + light & dark
import { Button, Card, CardContent } from '@/components/cascivo'

export function App() {
  return (
    <main data-theme="light">
      <Card>
        <CardContent>
          <Button>Get started</Button>
        </CardContent>
      </Card>
    </main>
  )
}
```

Prefer a prebuilt dependency? `pnpm add @cascivo/react @cascivo/themes @preact/signals-react` and import from `@cascivo/react`. See the [`@cascivo/react`](packages/react) README for the full setup.

## AI / Context layer

cascivo ships both the **WHAT** (manifests, tokens, MCP) and the **WHY** (intent, boundaries, anti-patterns) so agents select from closed sets and their output is checkable:

- **`llms.txt`** — start here. [`https://cascivo.com/llms.txt`](https://cascivo.com/llms.txt) is the AI entry point: how to install (both paths + trade-offs), the guides, the MCP tools, and a categorized index linking each component's machine-readable docs. Mirrored at `https://docs.cascivo.com/llms.txt`.
- **Per-component AI docs** — `https://docs.cascivo.com/llms/<name>.md` (props, examples, a11y, tokens) and `…/context/<name>.md` (when-to-use / when-not-to-use).
- **`context.json`** — intent, design boundaries, specs, and authoring rules in one machine-readable bundle.
- **`tokens.catalog.json`** — closed-set token catalog; every `--cascivo-*` property with its layer and resolved default.
- **`cascivo audit --ai`** — flags hard-coded values, invented props, and missing required wiring in generated code.
- **MCP server** ([`@cascivo/mcp`](packages/mcp)) — tools: `list_components`, `get_component`, `get_tokens`, `get_context`, `select_component`, `scaffold_view`, `validate_view`.

Point any MCP client at the server:

```json
{
  "mcpServers": {
    "cascivo": { "command": "npx", "args": ["-y", "@cascivo/mcp"] }
  }
}
```

## Ecosystem

The cascivo registry model is open — anyone can publish components and host their own registry.

- **[Registry starter](apps/examples/registry-starter/)** — copy-paste template for publishing a third-party registry.
- **[Contributor guide](docs/CONTRIBUTING-REGISTRY.md)** — the full loop: write → build → host → list in the directory.
- **Install from any registry:** `cascivo add owner/repo/component-name`.
- **Migrating from shadcn/ui?** See [docs/MIGRATING-FROM-SHADCN.md](docs/MIGRATING-FROM-SHADCN.md).

## Repository structure

```
cascivo/
├── packages/
│   ├── core/         # @cascivo/core    — micro-FSM + Preact Signals primitives
│   ├── tokens/       # @cascivo/tokens  — three-level CSS design tokens
│   ├── themes/       # @cascivo/themes  — 14 first-party themes
│   ├── icons/        # @cascivo/icons   — optional SVG icon set
│   ├── i18n/         # @cascivo/i18n    — signal-driven locale store + catalogs
│   ├── storage/      # @cascivo/storage — persisted signals (localStorage/IndexedDB)
│   ├── react/        # @cascivo/react   — prebuilt distribution of all components
│   ├── charts/       # @cascivo/charts  — accessible, signal-driven charts
│   ├── components/   # registry source — copy-paste component TSX + CSS + manifests
│   ├── layouts/      # registry source — app shells and page layouts
│   ├── registry/     # @cascivo/registry — registry schema, validation, shadcn interop
│   ├── render/       # JSON → UI runtime renderer (CascadeView)
│   ├── ai/           # AI context layer — context.json, token catalog, audit
│   ├── search/       # registry search index
│   ├── cli/          # cascivo CLI — init / add / list / update / audit
│   └── mcp/          # @cascivo/mcp     — MCP server over the registry
├── apps/
│   ├── docs/         # docs.cascivo.com — generated from manifests
│   ├── storybook/    # storybook.cascivo.com — stories from manifests
│   ├── landing/      # cascivo.com landing page (dogfood)
│   ├── bench/        # performance benchmarks
│   └── examples/     # runnable example apps (Vite, Next.js, registry starter, demos)
├── skills/           # Claude Code skills — cascivo:add, design-page, create-theme, extend
├── scripts/          # registry/readme/context/token generators + quality gates
├── registry.json     # machine-readable component index (CLI + MCP + docs read this)
└── factory-backlog.json # dark-factory component queue
```

## Development

### Prerequisites

| Tool                                 | Version                   |
| ------------------------------------ | ------------------------- |
| [Node.js](https://nodejs.org/)       | 22.12+                    |
| [pnpm](https://pnpm.io/)             | 11+                       |
| [vite+ (`vp`)](https://viteplus.dev) | bundled toolchain (alpha) |

### Setup

```sh
git clone https://github.com/cascivo/cascivo.git
cd cascivo
pnpm install
```

### Commands

| Command              | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `pnpm dev:docs`      | Run the docs site dev server                                     |
| `pnpm dev:landing`   | Run the landing page dev server                                  |
| `pnpm build`         | Build all packages (`vp run -r build`, dependency-aware caching) |
| `pnpm test`          | Run all tests (Vitest)                                           |
| `pnpm exec vp check` | Format + lint (Oxfmt + Oxlint)                                   |
| `pnpm regen`         | Regenerate registry, schemas, catalogs, READMEs, and `llms.txt`  |
| `pnpm ready`         | Full local gate — regen → check → build → type check → test      |
| `pnpm ready:ci`      | Cold-cache CI simulation (deletes `dist/`, sequential builds)    |

`pnpm ready` must pass before every commit. The single command runs the same gates as CI.

### Releasing

This monorepo uses [Changesets](https://github.com/changesets/changesets). Every PR that changes a published package must include one.

```sh
pnpm changeset          # describe your change (patch / minor / major)
pnpm version-packages   # apply changesets and bump versions
pnpm release            # build and publish changed packages to npm
```

## Contributing

Contributions are welcome — bug reports, new components, theme proposals, docs, and fixes.

1. Fork and create a feature branch.
2. `pnpm install` to set up the workspace.
3. Make your changes, following the authoring rules in [CLAUDE.md](CLAUDE.md) (signals not hooks, modern CSS, mobile-first, WCAG 2.2 AA).
4. Add or update tests, and a changeset for published packages.
5. Run `pnpm ready` — all gates must pass.
6. Open a pull request.

New components flow through the [dark factory](scripts/factory/) queue and get a human design + a11y review before merge.
