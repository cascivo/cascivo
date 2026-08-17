<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/getting-started.md
  registry v0.18.0 · generated 2026-08-17
-->

# Getting started with cascivo

There are two ways to adopt cascivo. Both consume the same tokens and themes,
and they can coexist in one project.

| Path                               | You get                                            | Choose it when                                            |
| ---------------------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| **A. Copy-paste (CLI)**            | Component source (TSX + CSS) copied into your repo | You want to own and edit the code — the shadcn model      |
| **B. Prebuilt (`@cascivo/react`)** | A normal npm dependency, all 197 components        | You just want to _use_ the system; upgrades via `pnpm up` |

Either way, one piece of wiring is **not optional**: importing the themes CSS
and setting `data-theme`. Skip it and components render as correctly-structured
but uncolored markup — see [What it looks like when you forget](#the-critical-wiring-themes--data-theme).

> **Reading this offline, or can't reach the docs site?** The whole reference is
> also an npm package: `npx -y @cascivo/docs` (index), `npx @cascivo/docs <component>`
> (one reference), `npx @cascivo/docs guide getting-started`. No website needed —
> it comes through the same registry that installs the packages.
>
> **Working with an AI agent?** Install the docs as a searchable index instead:
> `pnpm add -D @cascivo/docspack docspack && npx docspack sync`, then
> `npx docspack ask "<question>"` answers offline from the versions in your
> lockfile. See [Searching the docs](#searching-the-docs-instead-of-reading-them).

## Where the documentation lives

Four surfaces, and each is authoritative for something different. Two hands-on
reports independently reached a working model only after reading all four, so it
is worth 30 seconds to know which to open.

| Surface                            | Authoritative for                                                                                                                                                                                                                                                                                                                                     | Reach it                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **The shipped `.d.ts`**            | **Props — always check here first.** Every prop carries its type, `@defaultValue`, the rationale, and ⚠ warnings for the mistakes previous adopters made (`Flex` defaults to `vertical`; a chart's `title` renders nothing visible; `useToast()` returns `{ toast }`, not a callable). Both reports rated it the single best artefact in the project. | Ctrl-click any import in your editor, or `node_modules/@cascivo/react/dist/index.d.ts` |
| **`llms.txt` + `/llms/<name>.md`** | Agent-facing reference: the component index with distribution channel, per-component pages (props → object types → examples → tokens → a11y), and the machine-readable catalogs (`registry.json`, `tokens.catalog.json`, `icons.catalog.json`).                                                                                                       | <https://cascivo.com/llms.txt>, or offline via `npx @cascivo/docs`                     |
| **The guides (`docs/*.md`)**       | Cross-cutting concerns no single component owns: install paths, SSR, routers, theming, layers, lint config, the dashboard recipe.                                                                                                                                                                                                                     | This directory, <https://cascivo.com/docs>, or `npx @cascivo/docs guide <name>`        |
| **The docs site**                  | The same content, rendered, plus live examples you can interact with.                                                                                                                                                                                                                                                                                 | <https://cascivo.com>                                                                  |

**If two disagree, the `.d.ts` wins** — it is generated from the same source the
components compile from, and the parity guards in `scripts/checks/` fail the build
when a manifest and its interface diverge.

The `@cascivo/docs` package ships two directories that look alike:
`llms/<name>.md` is the full per-component reference, and `context/<name>.md` is
the condensed intent summary (when to use, when not to, related components) meant
for pasting into an agent's context window.

### Searching the docs instead of reading them

`@cascivo/docs` prints whole files. **`@cascivo/docspack`** ships the same content
pre-chunked in the [docspack](https://docspack.dev) format, so an agent can query it:

```sh
pnpm add -D @cascivo/docspack docspack
npx docspack sync                                   # index it, once per machine
npx docspack ask "which CSS layer do my overrides go in"
```

`sync` builds a local SQLite index; `ask`, `search` and `list` then make no network
requests at all. Two properties matter for an agent: the answer is **version-scoped**
to what your lockfile installed rather than what cascivo.com documents today, and it
is **bounded** — three chunks, ~3,000 tokens — so asking a question costs a fraction
of fetching the page that contains the answer.

**Run the installed binary, not `npx`.** Measured on this ~600-chunk index, a query takes
**83–92 ms** through `node_modules/.bin/docspack` and about **400 ms** through `npx`,
which re-resolves the package every time. Add a script rather than paying that on every
question:

```json
{ "scripts": { "ask": "docspack ask" } }
```

One line in `AGENTS.md` or `CLAUDE.md` is the whole setup:

```text
Run `docspack ask "<question>"` for documentation on this project's
dependencies. It answers from the installed versions.
```

For clients that prefer a declared tool, `npx docspack mcp` serves the same index over
MCP. That is complementary to [`@cascivo/mcp`](https://github.com/cascivo/cascivo/tree/main/packages/mcp),
which serves the component _registry_ — use `@cascivo/mcp` to pick and install a
component, and docspack to answer a "how do I…" question about one.

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
- **An icon set** — `@cascivo/icons` (~440 tree-shakeable SVG icon components,
  sized by the token system) for `SideNav` items, `IconButton`, and `Button`
  icons. Don't hand-roll SVGs — install it and import the named icon.
- **Pre-built dashboard blocks** — `block/dashboard-charts`, `block/stats-cards`,
  `layout/console-app`; see them assembled into full apps under
  [`apps/examples/`](https://github.com/cascivo/cascivo/tree/main/apps/examples) (`deploy`, `pulse`, `trade`, `pay`,
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
Commit it: it is what lets the CLI later tell _your_ edits apart from upstream
changes.

### Tracking upstream changes

Copied code is yours, but the registry keeps evolving. Check for drift:

```sh
npx cascivo update --check   # lists outdated components, exits 1 if any
npx cascivo update button    # three-way merge of upstream changes into your copy
```

`update` merges upstream changes _around_ your local edits using the lockfile's
recorded base version; genuine collisions get standard conflict markers to
resolve by hand. See [UPGRADING.md](https://github.com/cascivo/cascivo/blob/main/docs/UPGRADING.md) for the full story.

---

## Path B — prebuilt dependency

```sh
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
```

(`@cascivo/tokens` comes with `@cascivo/themes` automatically — it is a direct
dependency, not a peer, so you never install it by hand.)

**If you lint with `eslint-plugin-react-hooks@7`, add one more dev dependency now:**

```sh
pnpm add -D @cascivo/eslint-config
```

```js
// eslint.config.js
import cascivo from '@cascivo/eslint-config'
export default [...yourConfig, ...cascivo] // spread LAST
```

Its `recommended-latest` enables `react-hooks/immutability`, which reports every
`signal.value = next` — cascivo's mandatory state idiom — as
`Error: This value cannot be modified`. Without this you get a lint error on
every piece of state you write. See
[USING-WITH-STRICT-ESLINT.md](/docs/using-with-strict-eslint.md) §1.

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

> **Typing a status map?** The shared vocabulary types ship from a subpath:
> `import type { Tone } from '@cascivo/react/types'` (also `Progress`, `SpaceStep`,
> `RovingOrientation` and the `*Input`/`*Alias` spellings). `Status.status` and
> `Badge.variant` are typed with these, so a `Record<DeployState, Tone>` is the
> supported way to map your domain states onto them. **Do not add `@cascivo/core`**
> to reach them — on this path it is a transitive dependency, and pinning it puts
> you in a two-package lockstep.

> **Server-rendering with Vite (TanStack Start, Remix, vite-ssr, workerd)?** On
> `@cascivo/react` **0.10+** SSR works with **zero Vite config** — the package ships
> a CSS-free `node`-condition build that a bare server loader imports cleanly. The
> only SSR checklist left: `@preact/signals-react` 3.x, import the CSS set
> (`@cascivo/react/styles.css` + `@cascivo/themes/light-dark.css`), and — for runtime theme
> switching — `themePreloadScript()` + `suppressHydrationWarning`. On
> `@cascivo/react` **< 0.10** you additionally need `ssr: { noExternal: [/^@cascivo\//] }`
> (or `cascivoSsr()`), or an unconfigured build throws `Unknown file extension ".css"`.
> Full recipe: [USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md). Next.js App Router
> needs none of this — see [USING-WITH-NEXTJS.md](/docs/using-with-nextjs.md).

Trade-off vs Path A: you cannot edit component internals, but you upgrade with a
version bump instead of a merge. Full details in the
[`@cascivo/react` README](https://github.com/cascivo/cascivo/blob/main/packages/react/README.md).

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
import '@cascivo/themes/light-dark.css' // tokens (once) + base typography + light & dark
```

```tsx
<main data-theme="light">…</main>
```

> **`<main>` or `<html>`?** Both work — the attribute is scopable to any element. Set it in
> JSX when you ship one fixed theme; let `ThemeProvider` set it on `<html>` when you switch
> themes at runtime (it must be the document element so portalled overlays switch too). The
> decision table is in [THEMING.md](/docs/theming.md#where-does-the-attribute-go--html-or-an-element).

`@cascivo/themes/light-dark` loads `@cascivo/tokens` once, applies base typography (so
plain markup uses the sans stack, not browser serif), and ships both `light` and
`dark`. Cost: **≈41 KB / ≈9 KB gzip** of CSS (source, pre-minification).

**Recipe B — shipping a single theme** (e.g. a dark-only dashboard): import the
`base` scaffold plus your one theme, and set that theme's name:

```tsx
import '@cascivo/themes/base.css' // tokens + base typography (required scaffold)
import '@cascivo/themes/dark.css' // your one theme
```

```tsx
<main data-theme="dark">…</main>
```

Cost: **≈28 KB / ≈7 KB gzip** — it drops the second theme (~2 KB gzip). The lever
is small: the bulk is the shared token layer, not the theme files. (For scale: the
**component** stylesheet `@cascivo/react/styles.css` is ~273 KB / ~37 KB gzip and
dwarfs any theme choice — if you measured a ~287 KB CSS chunk, that is it, not the
themes bundle.)

**JS bundle size** is measured too, and against the alternatives: see
[BENCHMARKS.md](https://github.com/cascivo/cascivo/blob/main/docs/BENCHMARKS.md) for min+gzip totals vs shadcn/ui and Carbon plus the
per-component incremental cost. Per-component CSS is auto-included and tree-shaken by your
bundler, so a real app ships a fraction of the aggregate sheet (a ~45-component dashboard
measured 137 KB / 19 KB gzip of the 273 KB).

> **SSR gets the same saving.** TanStack Start, Remix and Next collect component CSS
> through the same module graph, so budget the fraction, not the full sheet — a
> server-rendered card measured 29 KB of CSS end to end. Import a theme and let the
> component CSS ride along; the aggregate `@cascivo/react/styles.css` is for setups
> with no bundler.
> [USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md#per-component-css-tree-shaking-under-ssr)
> has the measurements.
>
> Before 0.18.0 this said the opposite, because it was true: with no `react-server`
> export condition, RSC resolved the CSS-free server build and every server-rendered
> component lost its stylesheet, so the aggregate really was the only way to get a
> styled page. That was a bug, and it is fixed.

> **TypeScript setup for the CSS imports.** A bare CSS side-effect import
> (`import '@cascivo/react/styles.css'`) has no types on its own, so a `tsc --noEmit`
> step fails with `TS2307: Cannot find module …` (or `TS2882` under
> `noUncheckedSideEffectImports`). Add Vite's ambient types once — create
> `src/vite-env.d.ts` containing `/// <reference types="vite/client" />` — or, if you
> don't use `vite/client`, declare the module explicitly with `declare module '*.css'`.
> `npx cascivo create` writes this for you; the manual setup doesn't. See
> [TROUBLESHOOTING.md](/docs/troubleshooting.md#tsc-fails-on-the-css-import-cannot-find-module-cascivoreactstylescss-ts2307--ts2882).

### Theme export → `data-theme` value

**The export name _is_ the attribute value:** import `@cascivo/themes/<name>` and
set `data-theme="<name>"`. The twelve first-party themes:

| Import                      | `data-theme` value | Base scheme |
| --------------------------- | ------------------ | ----------- |
| `@cascivo/themes/light`     | `light`            | light       |
| `@cascivo/themes/dark`      | `dark`             | dark        |
| `@cascivo/themes/warm`      | `warm`             | light       |
| `@cascivo/themes/flat`      | `flat`             | light       |
| `@cascivo/themes/minimal`   | `minimal`          | light       |
| `@cascivo/themes/midnight`  | `midnight`         | dark        |
| `@cascivo/themes/pastel`    | `pastel`           | light       |
| `@cascivo/themes/brutalist` | `brutalist`        | light       |
| `@cascivo/themes/corporate` | `corporate`        | light       |
| `@cascivo/themes/terminal`  | `terminal`         | dark        |
| `@cascivo/themes/cyberpunk` | `cyberpunk`        | dark        |
| `@cascivo/themes/arcade`    | `arcade`           | light       |

`@cascivo/themes/base` is required scaffolding (tokens + typography), **not** a
theme — always load it (directly, or transitively via a bundle). `@cascivo/themes/tailwind`
is a Tailwind bridge stylesheet, also not a theme. Each import has a `.css` twin
(`@cascivo/themes/dark.css`) for bundlers that need the explicit extension.

#### Which bundle?

Setting `data-theme="cyberpunk"` while only light and dark are loaded leaves every
`--cascivo-color-*` unresolved, so components render **greyscale**. Pick the bundle that
contains the themes you actually set:

| Import                           | Contains                                 | Use when                                             |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `@cascivo/themes/light-dark.css` | light + dark                             | the common case — a light/dark toggle                |
| `@cascivo/themes/all.css`        | **all twelve**                           | you offer a theme picker                             |
| `@cascivo/themes/<name>.css`     | that one theme                           | you ship a single fixed theme (pair with `base.css`) |
| `@cascivo/react/styles.css`      | light + dark, plus every component's CSS | no bundler / one-file setup                          |

> **Changed in 0.14.0.** `all.css` used to contain light and dark only, despite the name —
> a trap that cost adopters real time. It now contains all twelve. If you imported it for a
> light/dark app, switch to `light-dark.css` to keep the smaller sheet. See
> [UPGRADING.md](https://github.com/cascivo/cascivo/blob/main/docs/UPGRADING.md).

`ThemeProvider` warns in dev when you set a `data-theme` whose CSS is not loaded, naming
the import to add.

### Which stylesheets do I import?

Themes are always yours to import. **Component CSS is not** — every cascivo package that
ships components imports its own stylesheet from its entry, so a bundler pulls it in when
you import the component and tree-shakes what you don't use.

That holds for SSR too — Vite SSR, TanStack Start, Remix and Next all collect component
CSS from the same module graph, so you import a theme and nothing else.

The exception is the `node` export condition. Vite-SSR frameworks externalise dependencies
on the server, and a bare `.css` side-effect import is unloadable by a plain Node ESM loader
(`ERR_UNKNOWN_FILE_EXTENSION`) — so cascivo ships a CSS-free `node/` twin for those packages.
That twin is only ever the _server_ half of the build: the client (and, via the
`react-server` condition, the RSC) graph still carries the CSS edges, which is what styles
the server-rendered HTML. You import the aggregate yourself only when **no** bundler walks
the graph at all — a CDN `<link>`, or an island runtime that strips the edges (Astro).

| Package           | Bundler (Vite/Next/webpack), SPA or SSR            | No bundler / CDN             |
| ----------------- | -------------------------------------------------- | ---------------------------- |
| `@cascivo/themes` | **always import a bundle**                         | same                         |
| `@cascivo/react`  | automatic per component                            | `@cascivo/react/styles.css`  |
| `@cascivo/charts` | automatic (`dist/index.js` imports `./charts.css`) | `@cascivo/charts/styles.css` |

> **`@cascivo/charts/styles.css` is redundant on a bundler build, not required.** It used to
> be required — until 0.14 the charts entry never imported its own sheet and charts rendered
> unstyled — and several docs still said so after the fix. Importing it anyway is harmless
> (the bundler dedupes it), so if you are unsure, import it. What you must not do is _skip_
> it on an SSR/externalised setup: the chart's screen-reader data-table fallback is hidden by
> that stylesheet, so without it the fallback renders visibly as a table of numbers under
> every chart.
>
> Enforced by `pnpm css-contract:check`: a package that ships a stylesheet and declares
> `sideEffects: ["**/*.css"]` must import it from its entry, **and** ship the CSS-free `node`
> twin, **and** — if it also ships modules that render on the RSC server — offer a
> `react-server` condition pointing back at the CSS-bearing build. Each half without the
> others just trades one bug for another: a styling bug for an SSR blocker, then the SSR
> blocker back for a styling bug that only shows up in Server Components.

### Runtime switching & SSR (no-flash)

For a user-selectable theme, use the runtime from `@cascivo/react`:

```tsx
import { ThemeProvider, useTheme } from '@cascivo/react'

function ThemeToggle() {
  // useTheme() returns a TUPLE [theme, setTheme] where `theme` is a plain string
  // (the current theme name) — use it directly, not `theme.value`. It is NOT a
  // `{ theme, setTheme }` object (that's next-themes' shape). The hook calls
  // useSignals() for you, so this re-renders on theme changes. For signal-native
  // code (computed()/effect()/Preact) use themeSignal() instead.
  const [theme, setTheme] = useTheme()
  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme}</button>
}
```

`ThemeProvider` persists the choice and drives `data-theme` for you; `useTheme()`
reads/sets it via that tuple. Under
SSR you must avoid a hydration mismatch and a flash of the wrong theme. Three
correct options, by how the theme is decided:

- **Static theme** (fixed for the whole app): hard-code `data-theme="dark"` on your
  `<html>` in the server-rendered document. This is the right answer for a
  single-theme app — it is not a workaround, and it never mismatches.
- **Controlled by server state** (e.g. a per-account theme from your DB): pass it as
  `<ThemeProvider value={serverTheme}>`. The provider is **SSR-safe on its own** — it
  emits an inline attribute setter during render, so the first paint is themed with no
  flash and no extra `<head>` script. (Pass `nonce` for a strict CSP.)
- **Persisted / user-switchable theme** (client `localStorage`): inline
  `themePreloadScript()` (from `@cascivo/react`) in your document `<head>` **before**
  the app renders, so the attribute is set from storage before first paint, and add
  `suppressHydrationWarning` to the `<html>` it writes to (the script mutates
  `data-theme` pre-hydration; without the flag React 19 logs a mismatch). Pass
  `defaultTheme` to keep a "dark by default" app dark for light-OS visitors — it wins
  over `prefers-color-scheme`. See
  [THEMING.md](/docs/theming.md#switching-themes-at-runtime) for the full recipe.

Never write a `useEffect` that toggles a `.dark` class — that is the pattern
`ThemeProvider` + `themePreloadScript()` exists to replace.

**If you forget the theme import entirely:** components render _unstyled_ — correct
structure, no colors, wrong fonts, missing padding rhythm. Component CSS only
references `var(--cascivo-*)` custom properties; those properties do not exist until
the tokens + a theme are loaded. Unstyled-looking components are almost always this,
not a broken install. See [TROUBLESHOOTING.md](/docs/troubleshooting.md).

---

## First component

```tsx
import '@cascivo/themes/light-dark.css'
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

## Wiring your router

If your app has a router — most do — wire it **once**, at startup, before the nav
components render anything:

```tsx
import { setLinkComponent } from '@cascivo/react'
import type { LinkComponentProps } from '@cascivo/react'
import { Link } from 'react-router' // or '@tanstack/react-router'

setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)
```

That one call makes `SideNav`, `ShellHeader`, `Breadcrumb`, `Switcher` and `Dock` render
real router links — client-side navigation, and still real `<a>`s, so middle-click and
open-in-new-tab keep working.

It does **not** cover links you write yourself in page content. Those use `asChild`:

```tsx
<Link asChild>
  <RouterLink to="/projects/alpha">alpha</RouterLink>
</Link>
```

Two kinds of link, two mechanisms — the most-reported friction in adopter reports.
Full guide, including active-item matching and URL-driven tabs:
[USING-WITH-A-ROUTER.md](/docs/using-with-a-router.md).

---

## State: call `useSignals()` in your own components

**Read this before you write a component that holds state.** It is the single most likely
first-day bug, it produces no error and no warning, and it looks like a cascivo bug.

cascivo's own components call `useSignals()` internally, so everything above works with no
setup. But components **you** write are not compiled by cascivo's build — so in a React app
with no Babel signals transform (the normal case: Vite + React, Next.js, CRA), a component
that reads `signal.value` during render never re-renders when that signal changes.

The symptom is distinctive: **handlers fire, the UI freezes.** Toggles that don't toggle,
modals that don't open, a counter stuck at 0. Everything logs correctly.

```tsx
import { useSignal } from '@cascivo/core'

// ✗ Broken — reads count.value during render, never re-renders.
function Counter() {
  const count = useSignal(0)
  return <Button onClick={() => count.value++}>Clicked {count} times</Button>
}
```

```tsx
import { useSignal, useSignals } from '@cascivo/core'

// ✓ Correct — useSignals() first, before anything else in the body.
function Counter() {
  useSignals()
  const count = useSignal(0)
  return <Button onClick={() => count.value++}>Clicked {count} times</Button>
}
```

The rule: **`useSignals()` is the first statement in any component of yours that reads
`signal.value` during render.** It is a no-op where a transform is already active (Preact
apps, or React with the Babel plugin), so adding it is always safe.

You do _not_ need it to pass signals into a cascivo component, or in an event handler, or
inside `useSignalEffect` — only for a read that happens during render.

Full reactivity model, including which React hooks map to which cascivo primitive:
[HEADLESS.md](/docs/headless.md). Symptom-first version:
[TROUBLESHOOTING.md](/docs/troubleshooting.md#handlers-fire-but-the-ui-never-updates-toggles-dont-toggle-modals-dont-open).

---

## Where to go next

- [USING-WITH-A-ROUTER.md](/docs/using-with-a-router.md) — **any router** (React Router,
  TanStack Router, Next.js). cascivo links come in two kinds wired two different ways:
  `setLinkComponent` for the config-driven navs (SideNav, ShellHeader, Breadcrumb) and
  `<Link asChild>` for links you write in page content. Read this before writing any link.
- [RECIPE-DASHBOARD.md](/docs/recipe-dashboard.md) — building a console/dashboard
  page (project switcher, cards, KPIs, sparklines/charts): the exact
  component for each need, plus pre-built blocks and reference apps.
- [HEADLESS.md](/docs/headless.md) — the reactivity model: state with signals (not
  `useState`/`useEffect`/`useContext`), the behavior primitives, and the
  "React hook → cascivo primitive" mapping. Read this before writing any state.
- [ENTERPRISE-READINESS.md](/docs/enterprise-readiness.md) — signal↔state, layout,
  theming, signal lifecycles, typed tokens, and forms, each mapped to its
  shipped primitive with code.
- [THEMING.md](/docs/theming.md) — brand it: token tiers, the `data-theme`
  specificity footgun, a starter brand theme.
- [TOKENS.md](/docs/tokens.md) — every `--cascivo-*` custom property.
- [AI-RULES.md](/docs/ai-rules.md) — house rules for your AI agent: the CSS layer
  contract, the reactivity contract (signals, not React hooks), and a
  utility-first (Tailwind) mapping table.
- [USING-WITH-NEXTJS.md](/docs/using-with-nextjs.md) — App Router / RSC setup.
- [USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md) — TanStack Start / Vite SSR /
  Remix / workerd: the 4-line SSR checklist, and wiring your router's `<Link>` into
  the shipped nav/shell with `setLinkComponent` (the `LinkComponentProps` contract).
- [COMPATIBILITY.md](/docs/compatibility.md) — frameworks, browsers, package
  version matrix.
- [TESTING.md](/docs/testing.md) — testing signal-driven components with Vitest.
- [MIGRATING-FROM-SHADCN.md](/docs/migrating-from-shadcn.md) — coming from shadcn/ui.
- Example apps: [`apps/examples/react-vite`](https://github.com/cascivo/cascivo/tree/main/apps/examples/react-vite) (Vite),
  [`apps/examples/react-vite-ssr`](https://github.com/cascivo/cascivo/tree/main/apps/examples/react-vite-ssr) (Vite SSR),
  [`apps/examples/react-next`](https://github.com/cascivo/cascivo/tree/main/apps/examples/react-next) (Next.js App
  Router), plus full demo dashboards under [`apps/examples/`](https://github.com/cascivo/cascivo/tree/main/apps/examples).
