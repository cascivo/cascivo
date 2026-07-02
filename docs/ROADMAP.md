# cascivo — Implementation Roadmap

**Last updated:** 2026-06-09  
**Status:** Active development

This document is the ground truth for what has been built and what still needs building. It is structured so an agent can read any section and implement the next step without additional context.

---

## Current State

### Done

| Area                  | What exists                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Monorepo              | pnpm workspace, vite+ toolchain, all packages scaffolded                                               |
| `@cascivo/core`       | `createMachine`, `useMachine`, `cn`, `composeRefs`, `mergeProps`, signal re-exports, full type exports |
| `@cascivo/tokens`     | Full CSS primitive token set (colors, spacing, typography, radius, shadows, animation, z-index)        |
| `@cascivo/themes`     | `light.css`, `dark.css`, `warm.css` — semantic layer + `data-theme` scoping                            |
| `packages/components` | Button, Input, Card, Badge, Modal — TSX + CSS Modules + `meta.ts` + tests                              |
| `apps/docs`           | Vite + Preact dev server running at localhost:5173 — component showcase with live theme switcher       |

### Stubs (scaffolded, empty)

| Package                    | What's missing                                  |
| -------------------------- | ----------------------------------------------- |
| `packages/cli`             | All CLI commands — only `VERSION` export exists |
| `packages/mcp`             | All MCP tools — only `VERSION` export exists    |
| `packages/icons`           | All icons — only `VERSION` export exists        |
| `scripts/`                 | Directory doesn't exist yet                     |
| `apps/storybook`           | No Storybook config or stories                  |
| `apps/landing`             | No source files                                 |
| `apps/examples/react-vite` | No source files                                 |
| `apps/examples/react-next` | No source files                                 |

---

## Phase 1 — Remaining v1 Components (15 components)

**Goal:** Complete the full v1 component set. Each component follows the same pattern as the 5 already built.

### Pattern for every component

Each component lives at `packages/components/src/<name>/` and consists of four files:

1. `<name>.tsx` — React component with `'use client'`, typed props extending HTML attrs, CSS Modules, `data-variant`/`data-size`/`data-state` attributes for styling hooks
2. `<name>.module.css` — `@layer cascade.component { }` block, all values via `--cascivo-*` tokens, `:has()` and `@container` where appropriate
3. `<name>.meta.ts` — `ComponentMeta` object (import type from `@cascivo/core`)
4. `<name>.test.tsx` — vitest + @testing-library/react, setup via `packages/components/src/setup.ts`

After adding each component, add its export to `packages/components/package.json`:

```json
"./spinner": "./src/spinner/spinner.tsx"
```

And update `factory-backlog.json` to set `"status": "done"` for completed items and add new items for remaining ones.

### Component list

#### `inputs` group

**Textarea** (`packages/components/src/textarea/`)  
Props: `label?`, `hint?`, `error?`, `rows?`, `resize?: 'none' | 'vertical' | 'both'`, all `TextareaHTMLAttributes`.  
States: `idle`, `focused`, `error`. Machine: same shape as Input's.  
CSS: same token pattern as Input but block-level height, `field-sizing: content` for auto-grow variant.  
A11y: role `textbox`, `aria-multiline: true`.

**Select** (`packages/components/src/select/`)  
Props: `label?`, `hint?`, `error?`, `placeholder?`, `options: { value: string; label: string; disabled?: boolean }[]`, `size?`, all `SelectHTMLAttributes`.  
States: `idle`, `focused`, `error`.  
Implementation: wrap native `<select>` — no custom dropdown yet (Dropdown component handles that separately).  
CSS: same height/padding tokens as Input, add chevron icon via `background-image` SVG data URI.  
A11y: role `combobox`, label association via `htmlFor`.

**Checkbox** (`packages/components/src/checkbox/`)  
Props: `label?`, `checked?`, `indeterminate?`, `disabled?`, `onChange?`, all `InputHTMLAttributes<HTMLInputElement>`.  
Implementation: hidden `<input type="checkbox">` + custom visual element using CSS `:has()`. No JS state for check — let the browser handle it.  
CSS: custom indicator using `clip-path` or `content` for the checkmark, `accent-color` as fallback.  
A11y: role `checkbox`, keyboard: `Space`.

**Radio** (`packages/components/src/radio/`)  
Props: `label?`, `value`, `checked?`, `disabled?`, `name?`, all `InputHTMLAttributes<HTMLInputElement>`.  
Implementation: same pattern as Checkbox but `type="radio"`.  
Export both `Radio` and `RadioGroup` (wrapper that sets `name` on children via context or prop drilling).

**Toggle** (switch) (`packages/components/src/toggle/`)  
Props: `checked?`, `defaultChecked?`, `onChange?`, `label?`, `disabled?`, `size?: 'sm' | 'md'`.  
Implementation: `<button role="switch" aria-checked={checked}>` — not a checkbox. Use `useMachine` with `on`/`off` states.  
CSS: sliding pill animation using `translate` on `::after` pseudo-element.  
A11y: role `switch`, `aria-checked`, keyboard: `Space`.

**Slider** (`packages/components/src/slider/`)  
Props: `min?`, `max?`, `step?`, `value?`, `defaultValue?`, `onChange?`, `label?`, `disabled?`.  
Implementation: native `<input type="range">` with custom CSS track/thumb styling. No JS needed for value — use `defaultValue` + uncontrolled or `value` + controlled.  
CSS: style `input[type=range]` thumb and track using vendor-prefixed selectors wrapped in `@supports`.  
A11y: role `slider`, `aria-valuemin/max/now`, keyboard: arrows.

#### `overlay` group

**Tooltip** (`packages/components/src/tooltip/`)  
Props: `content: ReactNode`, `placement?: 'top' | 'right' | 'bottom' | 'left'`, `children: ReactElement`, `delay?: number`.  
Implementation: CSS-only positioning using `@starting-style` for entry animation and the native Popover API (`popover` attribute) or absolute positioning. Keep JS minimal — show/hide on focus/mouseenter via data attribute toggled by event handlers.  
Machine: `hidden` → `visible` → `hidden`.  
CSS: `position: absolute` relative to wrapper, `@starting-style { opacity: 0 }` for enter animation.  
A11y: role `tooltip`, `aria-describedby` on trigger.

**Dropdown** (`packages/components/src/dropdown/`)  
Props: `trigger: ReactElement`, `items: { label: string; value: string; icon?: ReactNode; disabled?: boolean; separator?: boolean }[]`, `onSelect?: (value: string) => void`, `placement?: 'bottom-start' | 'bottom-end'`, `open?`, `onOpenChange?`.  
Implementation: use native Popover API (`popover="auto"`) with `anchor` positioning (`position-anchor`, `anchor()` CSS functions). Fallback to `position: absolute` inside a positioned wrapper.  
Machine: `closed` → `open` → `closed`. Keyboard: arrow keys cycle items, Enter selects, Escape closes.  
CSS: `@starting-style` for open/close animation.  
A11y: role `menu`, items are role `menuitem`, keyboard full navigation required.

**Toast** (`packages/components/src/toast/`)  
Props (for `useToast` hook): `{ title: string, description?: string, variant?: 'default' | 'success' | 'warning' | 'destructive', duration?: number }`.  
Implementation: a `ToastProvider` component renders a `<div aria-live="polite">` portal. `useToast()` hook returns `{ toast(options) }`. Toasts auto-dismiss after `duration` ms. Stack up to 3 visible at once.  
Machine per toast: `entering` → `visible` → `dismissing` → `gone`. The `dismissing` state plays the exit animation before removal.  
CSS: position `fixed` bottom-right, `@starting-style` enter/exit animations, `@container` for mobile stacking at bottom-center.  
A11y: `aria-live="polite"` for non-critical, `aria-live="assertive"` for destructive variant.

#### `display` group

**Alert** (`packages/components/src/alert/`)  
Props: `variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'`, `title?: string`, `icon?: ReactNode`, `dismissible?: boolean`, `onDismiss?: () => void`, `children`.  
Implementation: no machine needed — pure display. Use `data-variant` attribute on root element. If `dismissible`, show a close button that calls `onDismiss`.  
CSS: left colored border-inline-start per variant, using semantic `--cascivo-color-*` tokens.  
A11y: `role="alert"` for destructive/warning, `role="status"` for info/success.

**Avatar** (`packages/components/src/avatar/`)  
Props: `src?: string`, `alt?: string`, `fallback?: string` (1-2 char initials), `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`, `status?: 'online' | 'offline' | 'busy'`.  
Implementation: try `<img>` — if it errors, fall back to initials via `onError` handler. Use `useMachine` for `loading` → `loaded` / `loading` → `error` states.  
CSS: circular, fixed sizes via CSS custom property, optional status dot via `::after` pseudo-element.  
A11y: `<img alt="...">` when image loads, `aria-label` with initials when fallback shown.

**Separator** (`packages/components/src/separator/`)  
Props: `orientation?: 'horizontal' | 'vertical'`, `decorative?: boolean`.  
Implementation: `<hr>` for horizontal, `<div role="separator" aria-orientation="vertical">` for vertical. Simplest component in the library.  
CSS: single line, `--cascivo-color-border`, logical properties (`border-block-start` vs `border-inline-start`).

#### `navigation` group

**Tabs** (`packages/components/src/tabs/`)  
Props: `defaultValue?`, `value?`, `onValueChange?`, `children`. Sub-components: `TabsList`, `TabsTrigger({ value })`, `TabsContent({ value })`.  
Implementation: use React context to share active tab between sub-components. `useMachine` not appropriate here — context is cleaner for a multi-part component. Each `TabsTrigger` gets `role="tab"`, `aria-selected`, `aria-controls`. `TabsContent` gets `role="tabpanel"`, `aria-labelledby`.  
CSS: underline or pill style tabs via `data-state="active"` attribute. Arrow key navigation between triggers.  
A11y: role `tablist` on `TabsList`, keyboard: left/right arrows cycle tabs, Home/End jump to first/last.

**Accordion** (`packages/components/src/accordion/`)  
Props on root: `type?: 'single' | 'multiple'`, `defaultValue?`, `value?`, `onValueChange?`. Sub-components: `AccordionItem({ value })`, `AccordionTrigger`, `AccordionContent`.  
Implementation: React context. `AccordionTrigger` is a `<button>` with `aria-expanded` and `aria-controls`. `AccordionContent` animates height using CSS `grid-template-rows: 0fr` → `1fr` trick (no JS height measurement needed).  
A11y: role `button` on trigger, `aria-expanded`, keyboard: `Enter`/`Space` toggle.

#### `feedback` group

**Spinner** (`packages/components/src/spinner/`)  
Props: `size?: 'sm' | 'md' | 'lg'`, `label?: string` (for screen readers).  
Implementation: pure CSS animation, no JS. Single `<span>` with rotating border.  
CSS: same spinner CSS already used inside Button's loading state — extract into this shared component. Button should import from `@cascivo/components/spinner`.  
A11y: `role="status"`, `aria-label` (defaults to "Loading").

---

## Phase 2 — Registry + CLI

### 2a. Populate `registry.json`

**Script:** `scripts/registry/generate.ts`

This script reads every `component.meta.ts` file from `packages/components/src/`, plus the list of source files per component, and writes `registry.json`.

```
scripts/
└── registry/
    └── generate.ts
```

`registry.json` shape per component entry:

```json
{
  "name": "button",
  "description": "Triggers an action or event",
  "category": "inputs",
  "version": "0.0.0",
  "files": [
    "https://raw.githubusercontent.com/cascade-ui/cascade/main/packages/components/src/button/button.tsx",
    "https://raw.githubusercontent.com/cascade-ui/cascade/main/packages/components/src/button/button.module.css"
  ],
  "dependencies": ["@cascivo/core"],
  "tags": ["action", "form", "interactive"]
}
```

Run with: `vp run registry:generate` (add to root `package.json` scripts).

**Note:** GitHub org/repo not yet created — use placeholder URLs for now. The script should read a `REGISTRY_BASE_URL` env var with a sensible default.

### 2b. `cascade` CLI (`packages/cli/src/`)

Implement the four commands. CLI has no runtime deps beyond Node built-ins.

**Entry point:** `packages/cli/src/index.ts` — parse `process.argv`, dispatch to command handlers.

**`cascade init`** — `packages/cli/src/commands/init.ts`

1. Detect package manager (pnpm/npm/yarn) from lock files
2. Install `@cascivo/core @cascivo/tokens` using detected PM
3. Ask user for theme preference (light/dark/warm) via readline
4. Create `cascade.config.ts` in project root
5. Print instructions for importing chosen theme in root CSS

**`cascade add <name...>`** — `packages/cli/src/commands/add.ts`

1. Read `cascade.config.ts` (or use defaults)
2. Fetch `registry.json` from `config.registry` URL
3. For each named component: find its entry, fetch each file URL, write to `config.outputDir/<name>/`
4. Install any missing `dependencies` listed in the registry entry
5. Print: "Added Button to src/components/ui/button/"

**`cascade list`** — `packages/cli/src/commands/list.ts`  
Fetch `registry.json`, render a table (name, category, description) to stdout. `--installed` flag: scan `config.outputDir` and cross-reference.

**`cascade update <name>`** — `packages/cli/src/commands/update.ts`  
Fetch latest file content from registry URLs, show a unified diff, prompt for confirmation, write files.

**`cascade theme add <theme>`** — `packages/cli/src/commands/theme.ts`  
Install `@cascivo/themes`, print import instruction.

**Shared utilities:**

- `packages/cli/src/utils/config.ts` — find and parse `cascade.config.ts`
- `packages/cli/src/utils/registry.ts` — fetch + parse registry JSON
- `packages/cli/src/utils/fs.ts` — safe file write with directory creation

**Tests:** unit tests for config parsing, registry parsing, and file resolution. Use `vitest` + `node:fs/promises` mocks.

---

## Phase 3 — MCP Server (`packages/mcp/src/`)

The MCP server implements the Model Context Protocol. Use the `@modelcontextprotocol/sdk` package.

**Package deps to add:**

- `@modelcontextprotocol/sdk` (runtime dep)

**Entry:** `packages/mcp/src/index.ts` — creates an MCP `Server`, registers tools, runs stdio transport.

**Six tools to implement:**

| Tool                | Input schema                                           | What it does                                          |
| ------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `list_components`   | `{ category?: string }`                                | Returns filtered `ComponentMeta[]` from registry.json |
| `get_component`     | `{ name: string }`                                     | Returns full `ComponentMeta` for one component        |
| `search_components` | `{ query: string }`                                    | Fuzzy search name + tags + description                |
| `add_to_project`    | `{ name: string, outputDir?: string }`                 | Runs `cascade add <name>` as a child process          |
| `create_theme`      | `{ primary: string, neutral: string, accent: string }` | Generates theme CSS from token mappings               |
| `scaffold_page`     | `{ description: string, components?: string[] }`       | Returns JSX string for a page layout                  |

All tools read `registry.json` — accept `registryPath` as a constructor param defaulting to `../../registry.json` relative to the package.

**MCP server config for users** (document in `packages/mcp/README.md`):

```json
{
  "mcpServers": {
    "cascade": {
      "command": "npx",
      "args": ["-y", "@cascivo/mcp"]
    }
  }
}
```

---

## Phase 4 — Docs App: Full Component Pages

The current docs app is a single-page showcase. Expand it to per-component pages with props tables, code examples, and token listings.

### Router

Add `preact-iso` (Preact's router) to `apps/docs/package.json`.

### Page structure

```
apps/docs/src/
├── pages/
│   ├── Home.tsx          — intro, quick-start code snippet
│   ├── ComponentPage.tsx — generic page driven by ComponentMeta
│   └── components/       — page-specific UI (PropsTable, TokenList, CodeBlock)
├── nav.ts                — navigation tree derived from registry.json categories
├── App.tsx               — router + layout shell
└── Layout.tsx            — sidebar nav + header + main content area
```

### `ComponentPage` reads from `meta.ts`

Import the `meta` export from each component's `component.meta.ts`. Generate:

- Title + description from `meta.name` + `meta.description`
- Props table: columns — Name, Type, Default, Required, Description
- States list from `meta.states`
- Variants list from `meta.variants`
- Examples: render each `meta.examples[].code` as a live demo + syntax-highlighted code block
- Tokens table: which CSS custom properties the component reads
- Accessibility section: role, WCAG level, keyboard shortcuts

### Sidebar nav

Group components by `meta.category`. Active route highlighted. Mobile: hamburger toggle.

### Code highlighting

Add `shiki` to docs devDeps for server-side syntax highlighting. Use `codeToHtml()` at build time or in a Preact component.

### Copy button

Each code block has a copy-to-clipboard button using `navigator.clipboard.writeText`.

### Dark mode

The theme switcher already works. Persist choice to `localStorage` and apply on load to avoid flash.

---

## Phase 5 — Storybook (`apps/storybook/`)

Configure Storybook 8 (or later) for React with Vite builder.

### Setup

1. Add to `apps/storybook/package.json`:
   - `@storybook/react-vite`
   - `@storybook/addon-essentials`
   - `@cascivo/components: workspace:*`
   - `@cascivo/themes: workspace:*`
2. `apps/storybook/.storybook/main.ts` — framework: `@storybook/react-vite`, stories glob
3. `apps/storybook/.storybook/preview.ts` — import light theme CSS, set `data-theme="light"` on body

### Story generation

Each component's stories file: `apps/storybook/stories/<Name>.stories.tsx`

Pattern for every component (example: Button):

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@cascivo/components/button'

const meta: Meta<typeof Button> = {
  component: Button,
  args: { children: 'Button' },
}
export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Loading: Story = { args: { loading: true } }
export const Disabled: Story = { args: { disabled: true } }
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Button size="sm">Sm</Button>
      <Button size="md">Md</Button>
      <Button size="lg">Lg</Button>
    </div>
  ),
}
```

Generate story files for all 20 components using the same pattern. Each story should cover: all variants, all sizes, all interactive states, an accessibility test story.

### Theme addon

Add `storybook-addon-themes` or a custom decorator that wraps stories in a `[data-theme]` container so reviewers can check all three themes side by side.

---

## Phase 6 — Landing Page (`apps/landing/`)

The landing page is built with cascade's own components (dogfooding). Use React + Vite.

### Structure

```
apps/landing/src/
├── index.html
├── main.tsx
├── App.tsx
└── sections/
    ├── Hero.tsx         — headline, tagline, CTA buttons, animated component preview
    ├── Features.tsx     — 6 feature cards (CSS-native, signal-driven, AI-first, etc.)
    ├── ComponentGrid.tsx — visual grid showing all components across 3 themes
    ├── ThemeDemo.tsx    — interactive side-by-side 3-theme comparison
    ├── QuickStart.tsx   — 3-step code snippet (install, add, use)
    └── Footer.tsx
```

### Hero section

Headline: "The design system that ships like shadcn, performs like a signal, and thinks like an agent."

Animated demo: live component showcase cycling through Button, Input, Card — transitions via CSS `view-transition-name`. Theme switcher inline.

### Features grid

6 cards using the cascade `Card` component:

1. CSS-native — `@layer`, `@container`, `:has()` — zero preprocessors
2. Signal-driven — Preact Signals micro-FSM, zero re-renders
3. Owned code — copy-paste via CLI, you own every line
4. Three themes — light/dark/warm, scoped to any container
5. AI-first — MCP server, Claude Code skills, machine-readable manifests
6. Dark factory — automated component generation pipeline

### Quick start

```bash
npx cascade init
npx cascade add button
```

```tsx
import { Button } from './components/ui/button/button'
```

---

## Phase 7 — Dark Factory Automation

The dark factory generates new components from `factory-backlog.json` automatically.

### Scripts directory structure

```
scripts/
├── factory/
│   ├── factory-supervisor.sh   — main loop: read backlog, dispatch agent, update status
│   ├── generate-component.sh   — runs headless Claude Code with a component spec
│   └── self-heal.sh            — retry loop (max 5 attempts) on test failure
└── registry/
    └── generate.ts             — registry.json generation (see Phase 2a)
```

### `factory-supervisor.sh` algorithm

```
1. Read factory-backlog.json
2. Find first item with status = "pending"
3. Set status = "in-progress", write back
4. Run generate-component.sh <name> <spec>
5. Run: vp check && vp run @cascivo/components#test
   → pass: set status = "review", git add, git commit, gh pr create
   → fail: run self-heal.sh (max 5 attempts)
         → still fail: set status = "escalated", send notification
6. Loop to step 1
```

### `factory-backlog.json` — update with all remaining components

Add entries for all 15 remaining components (Textarea, Select, Checkbox, Radio, Toggle, Slider, Tooltip, Dropdown, Toast, Alert, Avatar, Separator, Tabs, Accordion, Spinner) with detailed specs. Mark the 5 already built as `"status": "done"`.

---

## Phase 8 — CI/CD + Polish

### GitHub Actions

```
.github/workflows/
├── ci.yml          — on PR: vp check, vp run -r test, vp run -r build
├── registry.yml    — on push to main: run scripts/registry/generate.ts, commit registry.json
└── docs.yml        — on push to main: build docs, deploy to GitHub Pages
```

### `ci.yml` jobs

1. `check` — `vp check` (fmt + lint)
2. `typecheck` — `vp run -r check` (tsc for all packages)
3. `test` — `vp run -r test`
4. `build` — `vp run -r build`

### Package publishing

When a release tag is pushed (`v*`):

1. Build all library packages
2. Publish `@cascivo/core`, `@cascivo/tokens`, `@cascivo/themes`, `@cascivo/icons`, `@cascivo/mcp`, `cascade` (CLI) to npm
3. Publish docs to GitHub Pages

### Icons package (`packages/icons/src/`)

Implement a minimal icon set (20-30 icons) as React components. Each icon:

- Props: `size?: number`, `color?: string`, `className?: string`
- SVG with `currentColor` fill/stroke
- Named export: `ChevronDown`, `X`, `Check`, `AlertCircle`, etc.

Icons Button needs: `ChevronDown`. Modal close needs: `X`. Alert needs: `AlertCircle`, `CheckCircle`, `Info`, `AlertTriangle`. Dropdown needs: `ChevronDown`. Toggle needs: `Check`.

### Visual regression tests

Add Playwright to `apps/docs/` devDeps. Screenshot each component at all three themes. Store baselines in `apps/docs/test/snapshots/`. Run on CI.

---

## Execution Order (recommended)

| Phase                           | Estimated effort                 | Blocks                                   |
| ------------------------------- | -------------------------------- | ---------------------------------------- |
| 1 — Remaining 15 components     | Medium (15 × ~30 min each)       | Phase 2a (registry needs all components) |
| 2a — Registry generation script | Small                            | Phase 2b, Phase 3                        |
| 2b — CLI commands               | Medium                           | Phase 7 (factory uses CLI)               |
| 3 — MCP server                  | Medium                           | AI workflows                             |
| 4 — Docs full pages             | Medium                           | Phase 5 stories need same data           |
| 5 — Storybook                   | Small (setup) + Medium (stories) | —                                        |
| 6 — Landing page                | Medium                           | —                                        |
| 7 — Dark factory                | Large                            | Phase 1 complete, Phase 2b done          |
| 8 — CI/CD + polish              | Small                            | All other phases                         |

---

## Agent Quick-Start Checklist

When an agent picks up any component from Phase 1:

```
1. Read packages/components/src/button/ to understand the pattern
2. Read packages/components/src/button/button.meta.ts for ComponentMeta shape
3. Read packages/core/src/types.ts for type definitions
4. Create packages/components/src/<name>/<name>.tsx
5. Create packages/components/src/<name>/<name>.module.css
6. Create packages/components/src/<name>/<name>.meta.ts
7. Create packages/components/src/<name>/<name>.test.tsx
8. Add export to packages/components/package.json exports map
9. Run: vp run @cascivo/components#test (all tests must pass)
10. Run: vp check
11. Commit: git commit -m "feat(components): add <Name> component"
12. Add demo to apps/docs/src/App.tsx
```

For CLI commands (Phase 2b), start by reading the full CLI spec in this file and the architecture spec at `docs/superpowers/specs/2026-06-09-cascade-design.md`.

For MCP server (Phase 3), read `@modelcontextprotocol/sdk` docs before starting. The server reads `registry.json` — Phase 2a must be done first.
