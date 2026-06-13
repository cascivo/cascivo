The CSS-native, signal-driven, AI-first React design system.

## Core Principles

1. **Simplicity** — frictionless adoption; no config hell, no wrapper components, no hidden magic.
2. **Owned code** — components are copy-pasted into your project (shadcn model). You own what you use.
3. **Modern CSS only** — `@layer`, `@container`, `:has()`, CSS custom properties. No Tailwind, no CSS-in-JS.
4. **Signal-driven** — custom micro-FSM + Preact Signals. No `useState`/`useContext` for interactivity. Zero unnecessary re-renders.
5. **Beautiful by default** — three first-party themes (light, dark, warm) via `data-theme` on any container.
6. **AI-first** — every component ships a machine-readable manifest; MCP server and Claude Code skills derive from it.
7. **Context layer** — machine-readable intent (when-to-use, anti-patterns, selection edges), a closed-set token catalog, and `cascivo audit --ai` — so agents select from closed sets and their output is checkable.
8. **Earned quality** — CVD-safe chart palettes (Okabe-Ito oklch, all 10 themes, CI-verified); keyboard-accessible chart tooltips (aria-live, all 17 chart types); honest multi-lens performance data (standalone / incremental / amortized); WCAG 2.2 AA + APG-conformant (CI-enforced, 72 components); AT support matrix (NVDA / JAWS / VoiceOver) + EAA / EN 301 549 / Section 508 legal mapping.
9. **Coherent brand + mobile-first front door** — one name (`cascivo`) across every package (`@cascivo/*`), token (`--cascivo-*`), CLI, registry, and domain (`cascivo.com`); derivation documented; logo + brand palette shipped. Landing and docs rebuilt mobile-first: fluid type, off-canvas nav, container queries, zero overflow at 320–414px.

## Quick Start

```sh
npx cascivo init
npx cascivo add button
```

## AI / Context Layer

cascivo ships the **WHAT** (manifests, tokens, MCP) and the **WHY** (context layer):

- **`context.json`** — intent, design boundaries, specs, and authoring rules in one machine-readable bundle
- **`tokens.catalog.json`** — closed-set token catalog; every `--cascivo-*` property with layer + resolved default
- **`cascivo audit --ai`** — flags hard-coded values, invented props, and missing required wiring in generated code
- **MCP tools**: `list_components`, `get_component`, `get_tokens`, `get_context`, `select_component`, `scaffold_view`

## Ecosystem

The cascivo registry model is open. Anyone can publish components and host their own registry.

- **[Registry starter](apps/examples/registry-starter/)** — copy-paste template for publishing a third-party registry
- **[Contributor guide](docs/CONTRIBUTING-REGISTRY.md)** — full loop: write → build → host → list in the directory
- **Install from any registry:** `cascivo add owner/repo/component-name`
