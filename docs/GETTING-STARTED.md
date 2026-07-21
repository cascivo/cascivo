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

`init` writes `cascivo.config.ts` and installs everything copied source needs in
one step: the runtime packages `@cascivo/core`, `@cascivo/tokens`,
`@cascivo/themes`, and the `@preact/signals-react` peer, plus `cascivo` as a dev
dependency (the generated config imports its `CascadeConfig` type). Flags:
`--theme <name>` (one of the twelve first-party themes); `--package-manager <pm>`
(alias `--pm`) to force `pnpm`/`yarn`/`npm`/`bun` — otherwise it auto-detects
from your lock file, `packageManager` field, or the PM that launched it, so it
works inside a pnpm/yarn workspace where the lock file lives at the repo root;
`--no-install` to write files and print the install commands instead of running
them; and `--yes` / `-y` to accept defaults without prompting (implied when stdin
is not a TTY, so it is safe in CI).

`add` copies the component source — TSX plus its CSS module — from the registry
into your project, resolving component dependencies (adding `dialog` also brings
anything it composes) and installing any extra runtime package a component
declares (e.g. `@cascivo/i18n`). Charts are the exception: `cascivo add
chart/area-chart` installs the `@cascivo/charts` npm package (a runtime
dependency, not copied source) and prints the import lines. `--dry-run` shows
what would happen; `--package-manager`/`--pm` and `--no-install` work here too;
`--yes` skips confirmation.

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

(`@cascivo/tokens` comes with `@cascivo/themes` automatically — it is a direct
dependency, not a peer, so you never install it by hand.)

Peer dependencies: `react >=18`, `react-dom >=18`, and `@preact/signals-react`
(cascivo components are signal-driven, so the signals runtime is required).
**On React 19 the signals runtime must be 3.x** — the peer range enforces `>=3`
(3.x still supports React 16.14+/17/18), because signals-react 2.x imports a React
internal that React 19 removed. If a lockfile pinned 2.x from an earlier install,
`cascivo doctor` flags it with the upgrade command.

Component CSS ships **per component** and is pulled in automatically when you
import a component — your bundler includes styles only for the components you
use. There is no component-CSS import to add. (No bundler at all? Import the
aggregate `@cascivo/react/styles.css` instead.)

> **Server-rendering with Vite (TanStack Start, Remix, vite-ssr, workerd)?** Those
> per-component `.css` imports are resolved by a bundler, but a bare server-side ESM
> loader is not — so an unconfigured SSR build throws
> `Unknown file extension ".css"`. Add one line —
> `ssr: { noExternal: [/^@cascivo\//] }` (or the `cascivoSsr()` plugin from
> `@cascivo/vite-plugin`) — and import `@cascivo/react/styles.css` once in your root
> entry. Full recipe: [USING-WITH-VITE-SSR.md](./USING-WITH-VITE-SSR.md). Next.js App
> Router needs none of this — see [USING-WITH-NEXTJS.md](./USING-WITH-NEXTJS.md).

Trade-off vs Path A: you cannot edit component internals, but you upgrade with a
version bump instead of a merge. Full details in the
[`@cascivo/react` README](../packages/react/README.md).

> **All packages are 0.x.** They version independently via changesets, so a low
> number on one package doesn't mean the system is behind. Pin **exact** versions
> (no `^`) and watch
> [`breaking-changes.json`](https://cascivo.com/breaking-changes.json) for API drift
> before upgrading.

---

## The critical wiring: themes + `data-theme`

Whichever path you chose, two things are **not optional**: import a theme
stylesheet once, and set `data-theme` on a root element. Pick the recipe that
matches what you ship.

**Recipe A — light + dark with a system default** (the common case):

```tsx
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark
```

```tsx
<main data-theme="light">…</main>
```

`@cascivo/themes/all` loads `@cascivo/tokens` once, applies base typography (so
plain markup uses the sans stack, not browser serif), and ships both `light` and
`dark`. Cost: **≈41 KB / ≈9 KB gzip** of CSS (source, pre-minification).

**Recipe B — shipping a single theme** (e.g. a dark-only dashboard): import the
`base` scaffold plus your one theme, and set that theme's name:

```tsx
import '@cascivo/themes/base' // tokens + base typography (required scaffold)
import '@cascivo/themes/dark' // your one theme
```

```tsx
<main data-theme="dark">…</main>
```

Cost: **≈28 KB / ≈7 KB gzip** — it drops the second theme (~2 KB gzip). The lever
is small: the bulk is the shared token layer, not the theme files. (For scale: the
**component** stylesheet `@cascivo/react/styles.css` is ~273 KB / ~37 KB gzip and
dwarfs any theme choice — if you measured a ~287 KB CSS chunk, that is it, not the
themes bundle.)

### Theme export → `data-theme` value

**The export name _is_ the attribute value:** import `@cascivo/themes/<name>` and
set `data-theme="<name>"`. The twelve first-party themes:

| Import                        | `data-theme` value | Base scheme |
| ----------------------------- | ------------------ | ----------- |
| `@cascivo/themes/light`       | `light`            | light       |
| `@cascivo/themes/dark`        | `dark`             | dark        |
| `@cascivo/themes/warm`        | `warm`             | light       |
| `@cascivo/themes/flat`        | `flat`             | light       |
| `@cascivo/themes/minimal`     | `minimal`          | light       |
| `@cascivo/themes/midnight`    | `midnight`         | dark        |
| `@cascivo/themes/pastel`      | `pastel`           | light       |
| `@cascivo/themes/brutalist`   | `brutalist`        | light       |
| `@cascivo/themes/corporate`   | `corporate`        | light       |
| `@cascivo/themes/terminal`    | `terminal`         | dark        |
| `@cascivo/themes/cyberpunk`   | `cyberpunk`        | dark        |
| `@cascivo/themes/arcade`      | `arcade`           | light       |

`@cascivo/themes/base` is required scaffolding (tokens + typography), **not** a
theme — always load it (directly, or transitively via `all`). `@cascivo/themes/tailwind`
is a Tailwind bridge stylesheet, also not a theme. Each import has a `.css` twin
(`@cascivo/themes/dark.css`) for bundlers that need the explicit extension.

### Runtime switching & SSR (no-flash)

For a user-selectable theme, use the runtime from `@cascivo/react`:

```tsx
import { ThemeProvider, useTheme } from '@cascivo/react'
```

`ThemeProvider` persists the choice and drives `data-theme` for you; `useTheme()`
reads/sets it. The persisted choice is **client state**, so under SSR you must
avoid a hydration mismatch and a flash of the wrong theme. Two correct options:

- **Static theme** (fixed for the whole app): hard-code `data-theme="dark"` on your
  `<html>` in the server-rendered document. This is the right answer for a
  single-theme app — it is not a workaround, and it never mismatches.
- **Persisted / switchable theme:** inline `themePreloadScript()` (from
  `@cascivo/react`) in your document `<head>` **before** the app renders, so the
  attribute is set from storage before first paint, and add `suppressHydrationWarning`
  to the `<html>` it writes to (the script mutates `data-theme` pre-hydration; without
  the flag React 19 logs a mismatch). Pass `defaultTheme` to keep a "dark by default"
  app dark for light-OS visitors — it wins over `prefers-color-scheme`. See
  [THEMING.md](./THEMING.md#switching-themes-at-runtime) for the full recipe.

Never write a `useEffect` that toggles a `.dark` class — that is the pattern
`ThemeProvider` + `themePreloadScript()` exists to replace.

**If you forget the theme import entirely:** components render *unstyled* — correct
structure, no colors, wrong fonts, missing padding rhythm. Component CSS only
references `var(--cascivo-*)` custom properties; those properties do not exist until
the tokens + a theme are loaded. Unstyled-looking components are almost always this,
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
- [HEADLESS.md](./HEADLESS.md) — the reactivity model: state with signals (not
  `useState`/`useEffect`/`useContext`), the behavior primitives, and the
  "React hook → cascivo primitive" mapping. Read this before writing any state.
- [ENTERPRISE-READINESS.md](./ENTERPRISE-READINESS.md) — signal↔state, layout,
  theming, signal lifecycles, typed tokens, and forms, each mapped to its
  shipped primitive with code.
- [THEMING.md](./THEMING.md) — brand it: token tiers, the `data-theme`
  specificity footgun, a starter brand theme.
- [TOKENS.md](./TOKENS.md) — every `--cascivo-*` custom property.
- [AI-RULES.md](./AI-RULES.md) — house rules for your AI agent: the CSS layer
  contract, the reactivity contract (signals, not React hooks), and a
  utility-first (Tailwind) mapping table.
- [USING-WITH-NEXTJS.md](./USING-WITH-NEXTJS.md) — App Router / RSC setup.
- [USING-WITH-VITE-SSR.md](./USING-WITH-VITE-SSR.md) — TanStack Start / Vite SSR /
  Remix / workerd: the one-line `ssr.noExternal` fix for the `.css` loader.
- [COMPATIBILITY.md](./COMPATIBILITY.md) — frameworks, browsers, package
  version matrix.
- [TESTING.md](./TESTING.md) — testing signal-driven components with Vitest.
- [MIGRATING-FROM-SHADCN.md](./MIGRATING-FROM-SHADCN.md) — coming from shadcn/ui.
- Example apps: [`apps/examples/react-vite`](../apps/examples/react-vite/) (Vite),
  [`apps/examples/react-vite-ssr`](../apps/examples/react-vite-ssr/) (Vite SSR),
  [`apps/examples/react-next`](../apps/examples/react-next/) (Next.js App
  Router), plus full demo dashboards under [`apps/examples/`](../apps/examples/).
