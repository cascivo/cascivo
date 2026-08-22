<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/troubleshooting.md
  registry v0.18.0 · generated 2026-08-17
-->
# Troubleshooting cascivo

The failures adopters actually hit, in FAQ form. Each entry: symptom → cause →
fix.

---

## `pnpm lint` errors on every signal write: `Error: This value cannot be modified`

```
error  Error: This value cannot be modified
Modifying a value returned from a hook is not allowed.
  onValueChange={(v) => (env.value = v)}
                         ^^^ `env` cannot be modified
```

Also seen as `react-hooks/immutability`, and on `open.value = !open.value`,
`count.value++`, or any other `signal.value = …` assignment.

**Cause:** `eslint-plugin-react-hooks@7` enables `react-hooks/immutability` in
`recommended-latest` — the config a stock 2026 React app gets. The rule reports
writes to values returned from hooks, and `useSignal()` returns one. cascivo's
reactivity contract mandates signals over `useState`, so the rule fires on the
documented idiom, in your own page code, on both install paths. Your code is
correct.

**Fix:**

```sh
pnpm add -D @cascivo/eslint-config
```

```js
// eslint.config.js
import cascivo from '@cascivo/eslint-config'
export default [...yourConfig, ...cascivo] // spread LAST
```

Or set it directly: `{ rules: { 'react-hooks/immutability': 'off' } }`.

**Not** fixable by scoping the rule to `src/components/ui/**` — signal writes are
in your own pages, and on the prebuilt path that directory doesn't exist.

See [USING-WITH-STRICT-ESLINT.md](/docs/using-with-strict-eslint.md) §1 for why the
rule cannot be narrowed, what turning it off costs, and cascivo's React Compiler
position.

---

## Components render unstyled (no colors, wrong font, no padding)

**Cause:** the themes CSS is not loaded. Component CSS only defines structure —
it references `var(--cascivo-*)` custom properties that do not exist until
`@cascivo/tokens` + a theme are loaded, so alone it yields correctly-structured
but uncolored components.

**Fix:** import the themes once in your entry file (or Next.js root layout) and
set `data-theme`:

```tsx
import '@cascivo/themes/light-dark.css' // tokens (once) + base typography + light & dark
```

```tsx
<main data-theme="light">…</main>
```

See [GETTING-STARTED.md](/docs/getting-started.md#the-critical-wiring-themes--data-theme).

---

## `tsc` fails on the CSS import: `Cannot find module '@cascivo/react/styles.css'` (TS2307 / TS2882)

**Symptom:** the app runs and is styled, but a typecheck step (`tsc --noEmit`) reports
`TS2307: Cannot find module '@cascivo/react/styles.css' or its corresponding type
declarations` on the CSS import (also `@cascivo/themes/all.css`, `@cascivo/charts/styles.css`).
On a strict scaffold with `noUncheckedSideEffectImports` (e.g. TanStack Start) the same import
reports `TS2882` instead.

**Cause:** a bare CSS **side-effect import** has no TypeScript types on its own. Vite ships
ambient `*.css` module declarations via `vite/client`, but a project whose `tsconfig` doesn't
reference them — or one that opts into `noUncheckedSideEffectImports` — doesn't see them. This
is a standard Vite/TypeScript requirement, not a cascivo-specific issue, but the CSS imports in
our quick-start trip it on a fresh typechecked setup.

**Fix:** add Vite's client types once. Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

If you don't use Vite's client types (or `noUncheckedSideEffectImports` is on, which `vite/client`
alone doesn't satisfy), declare the CSS module explicitly instead — this is runtime-free, since a
CSS import is a pure side effect and the declaration only satisfies the type checker:

```ts
// src/css.d.ts
declare module '*.css'
```

The `npx cascivo create` scaffold writes `src/vite-env.d.ts` for you; the manual quick-start does
not, so add one of the above when you wire the CSS imports yourself.

Always import the package **specifier** (`@cascivo/react/styles.css`,
`@cascivo/charts/styles.css`), never the physical `dist/` filename — the subpath is an
`exports` alias and the real file (`dist/charts.css`) is an implementation detail that can change.

---

## SSR crash: `Unknown file extension ".css"` (TanStack Start, Vite SSR, Remix, workerd)

**Symptom:** a server-rendered page throws
`Error: Unknown file extension ".css" for …/@cascivo/react/dist/<component>/<component>.css`,
and the app silently falls back to client-only rendering.

**Cause:** you're on `@cascivo/react` **< 0.10**, whose bundle ships per-component
CSS as **static side-effect imports** (`import './button.css'` inside each
component chunk). A bundler resolves those at build time, but a bare server-side
ESM loader — Node's native loader, or a workerd/Cloudflare runtime — has no loader
for `.css` and throws.

**Fix — upgrade:** `@cascivo/react` **0.10+** ships a CSS-free `node`-condition
server build, so a bare server loader imports it with **zero config**. Upgrading
makes the crash go away with no `vite.config.ts` change. Still import the aggregate
stylesheet once so the server HTML is styled:

```tsx
// your root route / server entry — once
import '@cascivo/react/styles.css'
import '@cascivo/themes/all.css'
```

**Fix — if pinned to < 0.10:** tell Vite to **process** the cascivo packages
during SSR instead of leaving them for the runtime to load raw:

```ts
// vite.config.ts
export default defineConfig({
  ssr: { noExternal: [/^@cascivo\//] }, // ← the < 0.10 fix
})
```

Or add the `cascivoSsr()` plugin from `@cascivo/vite-plugin`, which sets
`ssr.noExternal` for every `@cascivo/*` package. Full recipe (TanStack Start,
Remix, workerd): [USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md).

---

## Build error: `Cannot find module or type declarations for side-effect import` (TS2882)

**Symptom:** TypeScript errors on a theme CSS import —
`error TS2882: Cannot find module or type declarations for side-effect import` on
`import '@cascivo/themes/all'`. Common in the TanStack Start scaffold, which enables
`noUncheckedSideEffectImports` by default.

**Cause:** the extensionless `@cascivo/themes/all` subpath resolves to a `.css`
file, and under `noUncheckedSideEffectImports` TS won't accept a side-effect import
whose specifier lacks a recognized module/extension.

**Fix:** use the `.css`-suffixed specifier — every theme export has a `.css` twin:

```tsx
import '@cascivo/themes/all.css' // not '@cascivo/themes/all'
import '@cascivo/react/styles.css'
```

The `.css` form works in every bundler and every tsconfig, so it's the form all
cascivo docs use. (Related tooling note: `@tanstack/cli create` may drop a nested
`pnpm-workspace.yaml` inside the app; inside an existing pnpm monorepo, delete it so
pnpm doesn't treat the app as its own workspace root.)

---

## Handlers fire but the UI never updates (toggles don't toggle, modals don't open)

This is the one failure that gives you nothing to search for: no error, no warning, no
red console. Every filter, sort, and toggle does nothing, and it looks like your event
handlers are broken. They aren't — **nothing subscribed the component to the signal.**

**Cause:** a component of **yours** reads a signal's `.value` during render without
subscribing. React apps get no Babel signals transform, so a subscription has to come
from somewhere.

**Fix — it depends where the signal came from:**

| Where your signal came from | What you need |
| --- | --- |
| A cascivo hook — `useSignal`, `useComputed`, `useDisclosure`, `useMachine`, `useTheme`, … | **Nothing.** These subscribe you automatically. (On `@cascivo/core` < 0.6, `useSignal`/`useComputed` did **not** — upgrade, or add `useSignals()`.) |
| A module-level `signal()`, or a signal passed in as a prop | `useSignals()` as the component's first statement |
| `currentLocale()` from `@cascivo/i18n` (a plain function, so it can't subscribe you) | `useSignals()` as the component's first statement |

```tsx
import { signal } from '@cascivo/core'
import { useSignals } from '@cascivo/react' // or '@cascivo/core' on the copy-paste path

const isOpen = signal(false) // module-level: NOT a hook

function MyPanel() {
  useSignals() // ← first statement, because `isOpen` is a raw signal
  return <Modal open={isOpen.value} onClose={() => (isOpen.value = false)} />
}
```

With a hook-created signal, no `useSignals()` is needed at all:

```tsx
import { useSignal } from '@cascivo/react'

function MyPanel() {
  const isOpen = useSignal(false) // subscribes this component for you
  return <Modal open={isOpen.value} onClose={() => (isOpen.value = false)} />
}
```

**Which package do I import from?** `@cascivo/react` on the prebuilt path (Path B) —
every primitive is re-exported there, so you never add `@cascivo/core` to your
`package.json`. `@cascivo/core` on the copy-paste path (Path A). See
[HEADLESS.md](/docs/headless.md#when-do-i-need-usesignals).

**Still frozen?** `useSignals()` starts tracking where it is called, so put it first —
above any signal read.

---

## My CSS doesn't override cascivo styles

**Cause:** cascivo ships everything in cascade layers
(`cascivo.base < cascivo.theme < cascivo.component`). If your override is
*inside a layer* that is ordered before `cascivo.component`, it loses no matter
how specific it is.

**Fix:** unlayered author CSS beats **every** cascivo layer regardless of
specificity — a plain stylesheet override just wins. To override from within a
layer, declare your layer ordered *after* `cascivo.component`.

The inverse pitfall also exists: a global reset like `* { margin: 0; padding: 0 }`
written **outside** any layer beats all cascivo layers too, zeroing out every
component's padding. Wrap resets in a lowest-priority layer. Full recipe:
[CSS-LAYERS-PITFALL.md](/docs/css-layers-pitfall.md).

---

## A third-party library's CSS is overriding my cascivo styles

**Cause:** the library ships an unlayered global stylesheet, and unlayered author
CSS beats every cascivo layer regardless of specificity.

**Fix:** import the vendor CSS into a low-priority `vendor` layer declared before the
cascivo layers — `@import url('lib/styles.css') layer(vendor);`. Native CSS, no build
tooling. If you're importing the stylesheet from JavaScript
(`import 'lib/styles.css'`), it can't be layered from there — move it into a CSS file
first. Full recipe: [THIRD-PARTY-CSS.md](/docs/third-party-css.md).

---

## My `:root` token override doesn't apply until `data-theme` is set

**Cause:** the specificity footgun. Themes ship a
`:root:not([data-theme])` default with specificity (0,2,0), which beats a plain
`:root { --cascivo-color-accent: … }` at (0,1,0) — so your override silently
loses in the no-attribute state.

**Fix:** mirror the theme's selector list inside `@layer cascivo.theme` and
import your file after the cascivo themes, or override from genuinely unlayered
CSS. The recommended pattern (a brand indirection variable) is in
[THEMING.md](/docs/theming.md#the-specificity-footgun-read-this-before-writing-a-brand-theme).

---

## `cascivo add` / `cascivo list` fails offline or the registry is unreachable

**Behavior:** the registry *index* is fetched network-first with an offline
fallback — the CLI caches every fetched copy under `~/.cascivo/cache` and, when
the network fails, falls back to the last cached copy with a
`Could not reach … — using the last cached copy.` notice. Component *file
payloads* are never cached (they must be fresh, and a truncated install must
fail), so `cascivo add` itself needs a working connection.

**Fix:** check connectivity and the `registry` URL in `cascivo.config.ts`
(default `https://cascivo.com/registry.json`). A
`Network error fetching …` message after four retries means the host is
genuinely unreachable, not that your config is broken.

---

## The docs sites are unreachable (403 from npmjs.com, blocked/offline cascivo.com)

**Cause:** `npmjs.com` returns HTTP 403 to non-browser fetches, and `cascivo.com`
may be blocked by a corporate proxy, uncrawlable page-by-page, or simply offline.
AI agents and firewalled setups hit this often.

**Fix:** read the docs from the npm **registry** instead — the same channel that
installed your packages. The entire docs surface ships as
[`@cascivo/docs`](https://www.npmjs.com/package/@cascivo/docs), usable with no
install:

```sh
npx -y @cascivo/docs                 # the index (llms.txt)
npx -y @cascivo/docs button          # one component's reference
npx -y @cascivo/docs guide theming   # a concept guide
npx -y @cascivo/docs --full          # the entire library, one file
npx -y @cascivo/docs --list          # every available doc path
```

No npm at all? `npm pack @cascivo/docs` (or `curl` the registry tarball) and read
`content/llms-full.txt`. The package is republished with every release, so its
copy never lags the packages.

---

## A component looks or behaves differently than the docs show

**Cause:** version drift. Docs and Storybook track the registry head; your copy
(or installed package) may be older — or you edited a copied component and
forgot.

**Fix:**

```sh
npx cascivo update --check   # copied components: lists what changed upstream
npx cascivo update <name>    # three-way merge of upstream changes
```

For the prebuilt packages, compare your installed versions against
`breaking-changes.json` (every major/minor release per package with notes) —
see [UPGRADING.md](https://github.com/cascivo/cascivo/blob/main/docs/UPGRADING.md).

---

## Popover / Sheet / Drawer doesn't open in an older browser

**Cause:** overlay components are built on the Popover API and
`@starting-style`, supported in Chrome 114+, Firefox 125+, and Safari 17.4+.
cascivo targets the last 2 versions of Chrome, Firefox, and Safari; older
browsers are outside the support matrix.

**Fix:** check the feature table in [COMPATIBILITY.md](/docs/compatibility.md). Note
`Modal` uses the native `<dialog>` element (much older support) — it is the
conservative choice if you must reach browsers below the Popover API line.

---

## `children` / `className` / `onClick` "does not exist" on every component (TS2322, TS2559)

```
error ts(2322): Property 'children' does not exist on type 'IntrinsicAttributes & BadgeProps'.
error ts(2559): Type '{ children: Element[]; }' has no properties in common with CardProps.
```

Every component loses `children`, `className`, `style`, `onClick` and all `aria-*` props at
once, usually a dozen-plus errors from one small file.

**Cause:** `@types/react` is not resolvable from `@cascivo/*`. cascivo's `.d.ts` files
`import { HTMLAttributes } from 'react'` and most interfaces `extend` those types; when the
import cannot resolve, `extends HTMLAttributes<…>` collapses to an error type and each
interface keeps only its *own* members. `skipLibCheck: true` (which most setups enable)
hides the diagnostic that would explain it.

**When it happens:** only when your package manager's hoisting is restricted. pnpm's default
layout builds a hidden `node_modules/.pnpm/node_modules/` holding every transitive package,
and TypeScript finds React's types there by accident — so most installs never hit this. Set
`hoist: false` (or a `hoist-pattern` that excludes `@types/*`) and that safety net is gone.
If your `pnpm-workspace.yaml` or `.npmrc` restricts hoisting, this is your bug.

**Fix:** upgrade to `@cascivo/react` ≥ 0.14.0 — every package that ships React types now
declares `@types/react` as an optional peer, so pnpm puts it on the resolution path even with
hoisting off. `pnpm isolated:check` verifies this in CI against a `hoist: false` workspace,
and it is observed failing when the peer is removed.

On an older version, add it yourself:

```yaml
# pnpm-workspace.yaml
publicHoistPattern:
  - '@types/react'
  - '@types/react-dom'
```

---

## The page has a horizontal scrollbar I didn't create

Often a *second*, vertical one appears next to it: the horizontal bar makes the document
taller than the viewport.

**Cause:** no global `box-sizing: border-box`. Components that are `width: 100%` *and*
padded (`Textarea`, `Input`, `Select`) compute wider than their container under the
browser's `content-box` default.

**Fix:** upgrade to `@cascivo/tokens` ≥ 0.6.0 — the `cascivo.reset` layer now ships the
floor, and it arrives automatically with any theme or `@cascivo/react/styles.css`. It is
the lowest cascade layer, so your own reset still wins.

On an older version, fill the layer cascivo reserves:

```css
@layer cascivo.reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  body {
    margin: 0;
  }
}
```

---

## A button below a MultiSelect / Sheet stopped responding to clicks

Nothing looks wrong. Screenshots are perfect, there is no console output, and the element
below the control simply never receives a click.

**Cause:** the closed overlay panel was still laid out. The browser hides a closed popover
with `[popover]:not(:popover-open) { display: none }`, but that is a **UA-origin** rule, so
an author `display: flex` in the component's base rule beat it. The panel stayed invisible
(`opacity: 0`), fixed-position and hit-testable — an unmarked rectangle swallowing every
click beneath it.

**Fix:** upgrade to `@cascivo/react` ≥ 0.14.0.

On an older version, put the UA behaviour back:

```css
@layer cascivo.override {
  [popover]:not(:popover-open) {
    display: none;
  }
}
```

This does not break the open/close animation — `display` is already in those components'
`transition` with `allow-discrete`.

---

## Charts render unstyled

`@cascivo/react` auto-loads its CSS, so it is reasonable to assume `@cascivo/charts` does
too. It did not.

**Fix:** upgrade to `@cascivo/charts` ≥ 0.8.0 — it imports its own stylesheet, matching
`@cascivo/react`. (`@cascivo/editor`, `@cascivo/flow` and `@cascivo/ai` had the same gap and
were fixed together.) On an older version, import it explicitly:

```ts
import '@cascivo/charts/styles.css'
```

**Still unstyled on a current version?** You are probably on the `node` export condition.
Vite-SSR frameworks externalise dependencies on the server, and cascivo ships a CSS-free
`node/` twin for those packages (a bare `.css` import is unloadable by a plain Node ESM
loader). On that path nothing imports the sheet for you, so the explicit import above **is**
required — and skipping it renders the chart's screen-reader data-table fallback visibly, as
a table of numbers under every chart. See the stylesheet table in
[GETTING-STARTED.md](/docs/getting-started.md).

---

## I need a type that lives in `@cascivo/core`, but I'm on the prebuilt path

`Status.status` and `Badge.variant` are typed `ToneInput`; every layout `gap` is a
`SpaceStep`. Those declarations live in `@cascivo/core`, which on the prebuilt path is a
**transitive** dependency — so `import type { Tone } from '@cascivo/core'` is a phantom
import under pnpm's strict layout, and adding it as a direct dependency puts you in a
two-package version lockstep.

**Fix:** import them from the subpath.

```ts
import type { Tone } from '@cascivo/react/types'

const DEPLOY_TONE: Record<DeployState, Tone> = { ready: 'success', error: 'danger' }
```

`@cascivo/react/types` exports `Tone`, `ToneAlias`, `ToneInput`, `Progress`, `ProgressAlias`,
`ProgressInput`, `SpaceStep` and `RovingOrientation`. On the copied-source path, import from
`@cascivo/core` directly — you depend on it there.

**Reading core's `.d.ts` from a terminal.** It is a transitive dep, so it sits under pnpm's
content-addressed store rather than top-level `node_modules`. Let Node find it:

```sh
node -p "require.resolve('@cascivo/core/package.json')"
```

Or skip the trip entirely: `npx -y @cascivo/docs` serves the whole documentation set offline.

---

## `setTheme()` runs but nothing changes

`useTheme()` reports the new theme, no error is thrown, and `data-theme` never changes.

**Cause:** `setTheme()` writes the theme *signal*; the mounted `<ThemeProvider>` is what
writes the attribute. With no provider mounted, the signal updates and the DOM does not.

**Fix:** wrap your app in `<ThemeProvider>` (SSR-safe, and it persists the choice). If you
are theming outside React — an imperative shell, a pre-hydration script, a Storybook
decorator — use `applyTheme(theme, target?)` instead, which writes the attribute directly:

```ts
import { applyTheme } from '@cascivo/react'
applyTheme('midnight')
```

`@cascivo/react` ≥ 0.14.0 warns in dev when `setTheme()` runs with no provider mounted.

---

## Components render greyscale after setting a theme like `cyberpunk`

**Cause:** that theme's CSS is not loaded. `@cascivo/themes/light-dark.css` carries light
and dark only; `@cascivo/react/styles.css` bundles the same two.

**Fix:** import `@cascivo/themes/all.css` (all twelve themes) or the single theme file you
need. Before 0.14.0, `all.css` itself contained only light and dark despite the name — if
you are on an older version, import `@cascivo/themes/cyberpunk.css` explicitly.

`ThemeProvider` emits a dev warning naming the exact import to add.

---

## pnpm refuses to install cascivo: "is younger than the minimum release age"

**Cause:** pnpm's `minimumReleaseAge` gate and a recently published cascivo release. Not a
cascivo defect — the same gate trips on any fresh package.

**Fix:** wait out the window, or exclude the packages:

```yaml
# pnpm-workspace.yaml
minimumReleaseAgeExclude:
  - '@cascivo/*'
```

---

## Quick answers

**Is cascivo free?** Yes — MIT licensed. Commercial and private use, no fee, no
attribution requirement.

**Do I have to adopt all of it, or can I add one component?** Add exactly what
you need. Components are copied into your repo one at a time — no runtime, no
provider, nothing to buy into. Start with a single button.

**Do I need Tailwind?** No. Styling is modern platform CSS — `@layer`, custom
properties, container queries — driven by a three-tier token system. Using
Tailwind v4 *alongside* cascivo works too: [USING-WITH-TAILWIND.md](/docs/using-with-tailwind.md).

**Does it work with Next.js / React Server Components?** Yes — components ship
`'use client'` preserved. Setup in [USING-WITH-NEXTJS.md](/docs/using-with-nextjs.md).

**Does it work with Vite SSR / TanStack Start / Remix / workerd?** Yes — install,
import a theme once, and render. On `@cascivo/react` < 0.10 add
`ssr.noExternal: [/^@cascivo\//]` (or the `cascivoSsr()` plugin), or the server
loader throws `Unknown file extension ".css"` (see the entry above). You do not need
`@cascivo/react/styles.css`: component CSS rides the module graph and tree-shakes.
Full recipe: [USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md).

**How is this different from shadcn/ui?** Same ownership model (you own copied
source), plus signal reactivity, a closed token system, twelve themes, built-in
WCAG 2.2 AA, and a machine-readable AI layer. Mapping in
[MIGRATING-FROM-SHADCN.md](/docs/migrating-from-shadcn.md).

**How do I change a component's behavior, not just its color?** You own the
source — edit it directly. The [`cascivo-extend` skill](https://github.com/cascivo/cascivo/tree/main/skills) walks the
safe way to add behavior without breaking the accessibility contract.

**Will my AI agent generate correct cascivo code?** Every component ships a
machine-readable manifest, the [`@cascivo/mcp`](https://github.com/cascivo/cascivo/tree/main/packages/mcp) server exposes
them to agents, and `npx cascivo audit --ai <paths>` flags hardcoded values,
invented props, and missing i18n in generated output.

**What browsers are supported?** The last two versions of Chrome, Firefox, and
Safari — cascivo relies on `:has()` and `@container`. CSS `@function`/`if()`
usage is a Chrome-leading pilot with static fallbacks everywhere else, so
nothing breaks where it is unsupported. Matrix: [COMPATIBILITY.md](/docs/compatibility.md).
