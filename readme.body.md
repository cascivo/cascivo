The CSS-native, signal-driven, AI-first React design system.

## Core Principles

1. **Simplicity** — frictionless adoption; no config hell, no wrapper components, no hidden magic.
2. **Owned code** — components are copy-pasted into your project (shadcn model). You own what you use.
3. **Modern CSS only** — `@layer`, `@container`, `:has()`, CSS custom properties. No Tailwind, no CSS-in-JS.
4. **Signal-driven** — custom micro-FSM + Preact Signals. No `useState`/`useContext` for interactivity. Zero unnecessary re-renders.
5. **Beautiful by default** — three first-party themes (light, dark, warm) via `data-theme` on any container.
6. **AI-first** — every component ships a machine-readable manifest; MCP server and Claude Code skills derive from it.

## Quick Start

```sh
npx cascade init
npx cascade add button
```

## Ecosystem

The cascade registry model is open. Anyone can publish components and host their own registry.

- **[Registry starter](apps/examples/registry-starter/)** — copy-paste template for publishing a third-party registry
- **[Contributor guide](docs/CONTRIBUTING-REGISTRY.md)** — full loop: write → build → host → list in the directory
- **Install from any registry:** `cascade add owner/repo/component-name`
