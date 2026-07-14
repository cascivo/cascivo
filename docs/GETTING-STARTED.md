# Getting started with cascivo

There are two ways to adopt cascivo. Both consume the same tokens and themes,
and they can coexist in one project.

| Path                            | You get                                            | Choose it when                                                        |
| ------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| **A. Copy-paste (CLI)**         | Component source (TSX + CSS) copied into your repo | You want to own and edit the code — the shadcn model                   |
| **B. Prebuilt (`@cascivo/react`)** | A normal npm dependency, all 192 components      | You just want to *use* the system; upgrades via `pnpm up`             |

Either way, one piece of wiring is **not optional**: importing the themes CSS
and setting `data-theme`. Skip it and components render as correctly-structured
but uncolored markup — see [What it looks like when you forget](#the-critical-wiring-themes--data-theme).

**This is not layout-only.** Alongside the CSS-native layout system, cascivo ships:

- **Interactive components with the behavior wired in** — `Dropdown`, `Menu`,
  `ContextMenu`, `Combobox`, `CommandMenu`, `MultiSelect`, and `Tabs` all come
  with keyboard navigation, focus management, and outside-click dismissal
  already implemented (native `<dialog>`/Popover APIs plus `@cascivo/core`
  primitives). You do not need to pair cascivo with a separate headless
  library or write your own ARIA event handling.
- **A full charts package** — `@cascivo/charts` (25 chart types: line, area,
  bar, sparkline, KPI, heatmap, and more), token-scaled to your theme, with
  live-streaming support.
- **Pre-built dashboard blocks** — `block/dashboard-charts`, `block/stats-cards`,
  `layout/console-app`; see them assembled into full apps under
  [`apps/examples/`](../apps/examples/) (`deploy`, `pulse`, `trade`, `pay`,
  `track` — Vercel/Datadog/Trade-Republic/Stripe/Linear-style consoles).

If you're building a dashboard/console page specifically, the
`cascivo:design-page` Claude Code skill and its component recipe are the
fastest path — see [Where to go next](#where-to-go-next).

---

## Path A — copy-paste via the CLI

### New project

```sh
npx cascivo create my-app
```

Scaffolds a ready-to-run Vite + React + TypeScript app pre-wired with the
cascivo app shell, side navigation, header, and a theme. Options:
`--template <spec>` (start from a marketplace template), `--theme <name>`,
`--sections "<a, b>"`, `--yes`.

### Existing project

```sh
npx cascivo init
npx cascivo add button card dialog
```

`init` installs `@cascivo/core` + `@cascivo/tokens` and writes
`cascivo.config.ts`. Flags: `--theme <name>` (one of the twelve first-party
themes) and `--yes` / `-y` to accept defaults without prompting (implied when
stdin is not a TTY, so it is safe in CI).

`add` copies the component source — TSX plus its CSS module — from the registry
into your project, resolving component dependencies (adding `dialog` also brings
anything it composes). `--dry-run` shows what would be written; `--yes` skips
confirmation.

### The files the CLI manages

**`cascivo.config.ts`** — where the CLI reads its settings:

```ts
import type { CascadeConfig } from 'cascivo'

const config: CascadeConfig = {
  registry: 'https://cascivo.com/registry.json', // component index
  outputDir: 'src/components/ui', // where copied source lands
  theme: 'light',
}

export default config
```

**`cascivo.lock`** — written by `cascivo add`. Records, per installed component,
the registry it came from, the version, and a sha256 hash of every copied file.
Commit it: it is what lets the CLI later tell *your* edits apart from upstream
changes.

### Tracking upstream changes

Copied code is yours, but the registry keeps evolving. Check for drift:

```sh
npx cascivo update --check   # lists outdated components, exits 1 if any
npx cascivo update button    # three-way merge of upstream changes into your copy
```

`update` merges upstream changes *around* your local edits using the lockfile's
recorded base version; genuine collisions get standard conflict markers to
resolve by hand. See [UPGRADING.md](./UPGRADING.md) for the full story.

---

## Path B — prebuilt dependency

```sh
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
```

Peer dependencies: `react >=18`, `react-dom >=18`, and `@preact/signals-react`
(cascivo components are signal-driven, so the signals runtime is required).

Component CSS ships **per component** and is pulled in automatically when you
import a component — your bundler includes styles only for the components you
use. There is no component-CSS import to add. (No bundler at all? Import the
aggregate `@cascivo/react/styles.css` instead.)

Trade-off vs Path A: you cannot edit component internals, but you upgrade with a
version bump instead of a merge. Full details in the
[`@cascivo/react` README](../packages/react/README.md).

---

## The critical wiring: themes + `data-theme`

Whichever path you chose, do this **once**, in your entry file (or root layout):

```tsx
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark
```

and set the theme attribute on a root element:

```tsx
<main data-theme="light">…</main>
```

`@cascivo/themes/all` loads `@cascivo/tokens` once, applies base typography (so
plain markup uses the sans stack, not browser serif), and ships both the `light`
and `dark` themes. À-la-carte imports (`@cascivo/themes/base` +
`@cascivo/themes/light`, …) also work.

**If you forget the import:** components render *unstyled* — correct structure,
no colors, wrong fonts, missing padding rhythm. Component CSS only references
`var(--cascivo-*)` custom properties; those properties do not exist until the
tokens + a theme are loaded. Unstyled-looking components are almost always this,
not a broken install. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## First component

```tsx
import '@cascivo/themes/all'
// Path A: import from your copied source
import { Button, Card, CardContent } from '@/components/ui'
// Path B: import { Button, Card, CardContent } from '@cascivo/react'

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

---

## Where to go next

- [RECIPE-DASHBOARD.md](./RECIPE-DASHBOARD.md) — building a console/dashboard
  page (project switcher, cards, KPIs, sparklines/charts): the exact
  component for each need, plus pre-built blocks and reference apps.
- [THEMING.md](./THEMING.md) — brand it: token tiers, the `data-theme`
  specificity footgun, a starter brand theme.
- [TOKENS.md](./TOKENS.md) — every `--cascivo-*` custom property.
- [AI-RULES.md](./AI-RULES.md) — house rules for your AI agent: the CSS layer
  contract + a utility-first (Tailwind) mapping table.
- [USING-WITH-NEXTJS.md](./USING-WITH-NEXTJS.md) — App Router / RSC setup.
- [COMPATIBILITY.md](./COMPATIBILITY.md) — frameworks, browsers, package
  version matrix.
- [TESTING.md](./TESTING.md) — testing signal-driven components with Vitest.
- [MIGRATING-FROM-SHADCN.md](./MIGRATING-FROM-SHADCN.md) — coming from shadcn/ui.
- Example apps: [`apps/examples/react-vite`](../apps/examples/react-vite/) (Vite),
  [`apps/examples/react-next`](../apps/examples/react-next/) (Next.js App
  Router), plus full demo dashboards under [`apps/examples/`](../apps/examples/).
