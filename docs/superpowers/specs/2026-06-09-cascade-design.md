# Cascade Design System — Architecture Spec

**Date:** 2026-06-09
**Status:** Approved
**Scope:** Full system design for v1 — monorepo, packages, CLI, AI layer, dark factory, theming, component manifest

---

## 1. Identity

**Name:** cascade / `@cascivo`
**Tagline:** The CSS-native, signal-driven, AI-first React design system
**Competitors:** shadcn/ui, IBM Carbon Design System

**One-sentence pitch:** cascade gives you beautifully crafted, fully owned React components powered by fine-grained signals, pure modern CSS, and a built-in AI layer — without Tailwind, without copy-paste sync debt, without performance compromises.

**Core differentiators over shadcn/ui:**

- Signal-driven micro-FSM instead of `useState`/`useContext` — zero unnecessary re-renders
- Component manifest as machine-readable contract — AI agents understand every component
- Three first-party themes with `data-theme` scoping, not just a CSS variable list
- Dark factory generates components at scale post-launch

**Core differentiators over Carbon:**

- Copy-paste ownership model — users own the code, no upstream lock-in
- Modern CSS only (`@layer`, `@container`, `:has()`) — no preprocessors
- AI-native from day one — MCP server, Claude Code skills, auto-docs
- Lean runtime — no IBM package ecosystem required

---

## 2. Core Principles

1. **Simplicity** — adoption is frictionless. One CLI command to add a component.
2. **Owned code** — components copy-paste into user projects. Users own what they ship.
3. **Modern CSS only** — `@layer`, `@container`, `:has()`, CSS custom properties. No Tailwind, no CSS-in-JS.
4. **Signal-driven** — custom micro-FSM + Preact Signals. No `useState`/`useContext` for component interactivity.
5. **Beautiful by default** — three first-party themes. Theming via `data-theme` on any container.
6. **AI-first** — every component has a machine-readable manifest. MCP, CLI, docs, and dark factory all derive from it.

---

## 3. Distribution Model

**Hybrid:** versioned npm packages for stable infrastructure, copy-paste for components.

| Layer            | Distribution       | Package                      |
| ---------------- | ------------------ | ---------------------------- |
| State primitives | npm                | `@cascivo/core`              |
| Design tokens    | npm                | `@cascivo/tokens`            |
| Themes           | npm                | `@cascivo/themes`            |
| Icons            | npm (optional)     | `@cascivo/icons`             |
| MCP server       | npm                | `@cascivo/mcp`               |
| Components       | copy-paste via CLI | fetched from GitHub raw URLs |

Components are never imported from an npm package. `npx cascade add button` copies source into `src/components/ui/button/`. Users own the code, can modify freely, and receive updates by pulling the latest source.

---

## 4. Monorepo Structure

```
cascade/
├── packages/
│   ├── core/           @cascivo/core    — micro-FSM, Preact Signals, base utilities
│   ├── tokens/         @cascivo/tokens  — CSS design tokens (3 levels)
│   ├── themes/         @cascivo/themes  — light.css, dark.css, warm.css
│   ├── components/     (registry source)   — component TSX + CSS + manifest + tests
│   ├── icons/          @cascivo/icons   — optional SVG icon components
│   ├── cli/            cascade             — npx cascade init/add/list/update
│   └── mcp/            @cascivo/mcp     — MCP server
├── apps/
│   ├── docs/           — Vite + Preact docs (dogfood cascade via preact/compat)
│   ├── storybook/      — Storybook (auto-generated stories from manifests)
│   ├── landing/        — landing page (built with cascade)
│   └── examples/
│       ├── react-vite/ — Vite + React example
│       └── react-next/ — Next.js App Router (RSC demo)
├── skills/             — Claude Code skills (cascade:*)
├── scripts/
│   ├── factory/        — dark factory automation scripts
│   └── registry/       — registry.json generation
├── registry.json       — component registry (source of truth for CLI + MCP + docs)
└── factory-backlog.json — queue of component specs for the dark factory
```

`packages/components/` is registry source only — never published to npm. The CLI reads `registry.json` to locate component source and copies files directly into user projects.

---

## 5. Tech Stack

Primary CLI: `vp` (vite+, v0.1.24, installed globally). Single command for dev, build, test, lint, format, and task running. Alpha software — accepted risk for a greenfield project.

| Concern                  | Tool                                                                  |
| ------------------------ | --------------------------------------------------------------------- |
| Primary CLI              | vite+ (`vp`)                                                          |
| Package manager          | pnpm (via `vp install`)                                               |
| Task orchestration       | `vp run` — replaces Turborepo, caching + dep-aware task graph         |
| Build / dev server       | Vite + Rolldown (via `vp`)                                            |
| Linting                  | Oxlint (via `vp lint`) — Rust-based                                   |
| Formatting               | Oxfmt (via `vp fmt`) — Rust-based                                     |
| Type checking            | `vp check` — runs fmt + lint + tsc                                    |
| Testing (unit/component) | Vitest + @testing-library/react (via `vp test`)                       |
| Testing (e2e)            | Playwright                                                            |
| TypeScript               | 5.x strict — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| React (components)       | 18+ — RSC-compatible via `"use client"`                               |
| Preact (docs + signals)  | latest — `preact/compat` renders React components in docs             |
| Signals                  | @preact/signals-react (latest)                                        |

pnpm workspaces (`pnpm-workspace.yaml`) is the underlying monorepo mechanism. `vp run` orchestrates tasks across packages.

**Dependency policy:** always use latest stable versions. Runtime deps in `@cascivo/core`: only `@preact/signals-react`. Peer deps: `react >=18.0.0`.

---

## 6. `@cascivo/core` API

Tiny, stable, purpose-built. The only runtime dep components take on.

```ts
// State machine
createMachine({ initial, states, transitions })
useMachine(machine) // React hook — bridges FSM to component render

// Signals (re-exported from @preact/signals-react)
signal(initialValue)
computed(fn)
effect(fn)

// Base utilities
composeRefs(...refs) // merge multiple React refs
mergeProps(...props) // merge event handlers without clobbering
cn(...classes) // className utility — no external dep
```

No theme logic, no token values, no component code. Pure behaviour primitives.

---

## 7. Component Manifest Schema

Every component in `packages/components/<name>/` ships a `component.meta.ts`. This is the ground truth all AI surfaces read from.

```ts
export const meta: ComponentMeta = {
  name: string,             // 'Button'
  description: string,      // one-line purpose
  category: string,         // 'inputs' | 'display' | 'overlay' | 'navigation' | 'feedback'
  states: string[],         // FSM states: ['default', 'hover', 'focus', 'disabled', 'loading']
  variants: string[],       // ['primary', 'secondary', 'ghost', 'destructive']
  sizes: string[],          // ['sm', 'md', 'lg']
  props: PropMeta[],        // AUTO-EXTRACTED from TypeScript types at build time via ts-morph
  tokens: string[],         // CSS custom properties this component reads
  accessibility: {
    role: string,
    wcag: 'AA',
    keyboard: string[],     // ['Enter', 'Space']
  },
  examples: ExampleMeta[],  // { title, code, description } — hand-authored
  dependencies: string[],   // ['@cascivo/core']
  tags: string[],           // for search/discovery
}
```

`props` is auto-extracted at build time using `ts-morph` (dev dependency in `packages/components/`) — always in sync with TypeScript types. All other fields are hand-authored in the manifest file.

`registry.json` aggregates all manifests plus GitHub raw source URLs into a flat index. CLI, MCP, and docs read `registry.json` rather than individual manifests.

---

## 8. Token Architecture

Three-level CSS custom property system:

```css
/* Level 1 — primitives (defined in @cascivo/tokens, never used directly in components) */
--cascivo-blue-500: #3b82f6;
--cascivo-gray-900: #111827;

/* Level 2 — semantic (themes override this layer only) */
[data-theme='light'] {
  --cascivo-color-accent: var(--cascivo-blue-500);
  --cascivo-color-surface: #ffffff;
  --cascivo-color-text: var(--cascivo-gray-900);
}

/* Level 3 — component (users override for brand adaptation) */
.cascade-button {
  background: var(--cascivo-button-bg, var(--cascivo-color-accent));
  color: var(--cascivo-button-text, #ffffff);
  border-radius: var(--cascivo-button-radius, 6px);
}
```

**Themes** override the semantic layer only. Shipped in `@cascivo/themes`:

- `light.css` — minimal/sharp, neutral grays, clean lines
- `dark.css` — bold/editorial, high contrast, developer-cool
- `warm.css` — organic/approachable, warm neutrals, rounded

Applied via `data-theme="light|dark|warm"` on any DOM element — works globally on `<html>` or scoped to any container.

Users adapt brand by overriding component-level tokens — no forking of theme files required.

---

## 9. CLI + Registry

**Commands:**

```bash
npx cascade init              # install @cascivo/core + tokens, create cascade.config.ts
npx cascade add button        # copy component source into outputDir
npx cascade add button input  # multiple components at once
npx cascade list              # table of all available components
npx cascade list --installed  # only installed components
npx cascade update button     # pull latest source, show diff, confirm
npx cascade theme add dark    # copy dark.css into project
```

**`cascade.config.ts`** (created by `init`):

```ts
export default {
  outputDir: 'src/components/ui',
  registry: 'https://raw.githubusercontent.com/cascade-ui/cascade/main/registry.json',
  typescript: true,
}
```

**`registry.json`** format:

```json
{
  "version": "1.0.0",
  "components": [
    {
      "name": "button",
      "description": "Triggers an action or event",
      "category": "inputs",
      "version": "1.2.0",
      "files": [
        "https://raw.githubusercontent.com/.../.../button.tsx",
        "https://raw.githubusercontent.com/.../.../button.module.css"
      ],
      "dependencies": ["@cascivo/core"],
      "tags": ["action", "form", "interactive"]
    }
  ]
}
```

No hosting infrastructure — GitHub raw URLs are the CDN. `vp run registry:generate` rebuilds `registry.json` from component manifests automatically on PR merge.

**Note:** registry URLs assume the GitHub org is `cascade-ui` and repo is `cascade`. Actual org/repo TBD — update `registry.json` template and `cascade.config.ts` default once the GitHub org is created.

---

## 10. AI Layer

### MCP Server (`@cascivo/mcp`)

Six tools, all reading from `registry.json` + component manifests:

| Tool                | Input                          | Output                                               |
| ------------------- | ------------------------------ | ---------------------------------------------------- |
| `list_components`   | `category?`                    | `ComponentMeta[]`                                    |
| `get_component`     | `name`                         | full `ComponentMeta`                                 |
| `search_components` | `query`                        | `ComponentMeta[]` — searches name, tags, description |
| `add_to_project`    | `name, options`                | runs `cascade add` in user's project                 |
| `create_theme`      | `{ primary, neutral, accent }` | generated theme CSS string                           |
| `scaffold_page`     | `description`                  | JSX page using cascade components                    |

Users connect the MCP server once in their Claude config. Claude then knows every component's full API and generates correct code without hallucinating props.

### Claude Code Skills (`skills/`)

| Skill                  | What it does                                                               |
| ---------------------- | -------------------------------------------------------------------------- |
| `cascade:add`          | Runs `cascade add`, explains props/variants, offers customization guidance |
| `cascade:design-page`  | Uses `scaffold_page` MCP tool, writes JSX + CSS for a full page            |
| `cascade:create-theme` | Uses `create_theme` MCP tool, writes theme CSS file into project           |
| `cascade:extend`       | Reads component manifest, guides component fork, updates local manifest    |

Skills ship in `skills/` at repo root. Users install by pointing their Claude config at the cascade repo.

### Auto-Generated Docs

The `apps/docs/` site reads `registry.json` at build time. Each component page is generated from its manifest — props table, state diagram, examples, token list, a11y notes. No manual doc writing. `vp run docs:generate` rebuilds after any manifest change.

---

## 11. Dark Factory Pipeline

### `factory-backlog.json`

Human-edited queue of component specs:

```json
{
  "queue": [
    {
      "name": "select",
      "category": "inputs",
      "priority": 1,
      "spec": "Native <select> replacement. Keyboard navigable. Supports groups, search, multi-select. Animates open/close via CSS transitions.",
      "reference": "https://carbondesignsystem.com/components/select/usage",
      "status": "pending"
    }
  ]
}
```

### Automation Loop

```
1. Read next pending item from factory-backlog.json
2. Headless Claude Code agent generates:
     component.tsx
     component.module.css
     component.meta.ts       (hand-authored fields pre-filled from spec)
     component.test.tsx
     component.stories.tsx
3. vp check (fmt + lint + tsc)
4. vp test
   → pass:  open PR, set status = "review"
   → fail:  self-heal loop (max 5 attempts) → escalate to human
5. On PR merge: vp run registry:generate (automated, no human)
```

### Tiered Automation

| Trigger                    | Action                    | Human gate?                  |
| -------------------------- | ------------------------- | ---------------------------- |
| New component in backlog   | Generate + open PR        | Yes — design + a11y review   |
| PR merged                  | Regenerate docs + stories | No                           |
| Token value change         | Regenerate all theme CSS  | No                           |
| Test failure on main       | Self-heal + PR            | No (if tests pass after fix) |
| `vp check` failure on main | Fix lint/fmt + commit     | No                           |

First 5 components (Button, Input, Modal, Card, Badge) are hand-built to validate the manifest schema and establish the quality bar. All subsequent components run through the factory.

---

## 12. v1 Component List

~20 components. First 5 hand-built, remainder via dark factory.

| Category     | Components                                                       |
| ------------ | ---------------------------------------------------------------- |
| `inputs`     | Button, Input, Textarea, Select, Checkbox, Radio, Toggle, Slider |
| `overlay`    | Modal/Dialog, Dropdown, Tooltip, Toast                           |
| `display`    | Card, Badge, Alert, Avatar, Separator                            |
| `navigation` | Tabs, Accordion                                                  |
| `feedback`   | Spinner                                                          |

---

## 13. Docs Site

**Stack:** Vite + Preact + cascade's own micro-FSM and Preact Signals. React components rendered via `preact/compat`.

This is deliberate dogfooding — the docs site demonstrates that cascade's state management works, and that components are lightweight enough to run in a Preact environment. The site is itself the proof of concept.

Each component page is auto-generated from its manifest. The theme switcher uses `data-theme` live — visitors see all three themes in real time. Interactive examples are inline, not iframes.

---

## 14. Accessibility + Browser Targets

- **WCAG:** 2.1 AA minimum for all v1 components
- **Keyboard:** full keyboard navigation for all interactive components (documented in manifest)
- **RTL:** CSS logical properties throughout (`margin-inline-start`, `padding-block`, etc.) — zero extra work for RTL support
- **Browsers:** last 2 versions of Chrome, Firefox, Safari (required for `:has()`, `@container`, native Popover API)

---

## 15. Open Questions (Post-v1)

These are out of scope for v1 but should be addressed before v2:

- **Component update strategy:** when cascade ships a new version of Button, how do users know? Git diff? CLI `cascade update --check`?
- **Custom icon design:** `@cascivo/icons` needs its own icon design language (stroke weight, corner radius tied to token system)
- **Forms integration:** recommend a validation library pairing (react-hook-form? zod?) — not bundled but officially documented
- **vite+ migration:** when vite+ stabilises, migrate from `vp` alpha → stable release
- **Hosted registry:** evaluate moving from GitHub raw to a CDN-backed registry API once adoption warrants it
