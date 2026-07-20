<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/troubleshooting.md
  registry v0.7.1 · generated 2026-07-20
-->

# Troubleshooting cascivo

The failures adopters actually hit, in FAQ form. Each entry: symptom → cause →
fix.

---

## Components render unstyled (no colors, wrong font, no padding)

**Cause:** the themes CSS is not loaded. Component CSS only defines structure —
it references `var(--cascivo-*)` custom properties that do not exist until
`@cascivo/tokens` + a theme are loaded, so alone it yields correctly-structured
but uncolored components.

**Fix:** import the themes once in your entry file (or Next.js root layout) and
set `data-theme`:

```tsx
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark
```

```tsx
<main data-theme="light">…</main>
```

See [GETTING-STARTED.md](/docs/getting-started.md#the-critical-wiring-themes--data-theme).

---

## SSR crash: `Unknown file extension ".css"` (TanStack Start, Vite SSR, Remix, workerd)

**Symptom:** a server-rendered page throws
`Error: Unknown file extension ".css" for …/@cascivo/react/dist/<component>/<component>.css`,
and the app silently falls back to client-only rendering.

**Cause:** the published `@cascivo/react` bundle ships per-component CSS as
**static side-effect imports** (`import './button.css'` inside each component
chunk). A bundler resolves those at build time, but a bare server-side ESM loader
— Node's native loader, or a workerd/Cloudflare runtime — has no loader for `.css`
and throws. (Next.js App Router never hits this because its recipe imports the
aggregate stylesheet in a Server Component; the plain Vite CSR/SPA path never hits
it because the browser bundler resolves the imports.)

**Fix:** tell Vite to **process** the cascivo packages during SSR instead of
leaving them for the runtime to load raw, and import the aggregate stylesheet once:

```ts
// vite.config.ts
export default defineConfig({
  ssr: { noExternal: [/^@cascivo\//] }, // ← the fix
})
```

```tsx
// your root route / server entry — once
import '@cascivo/react/styles.css'
import '@cascivo/themes/all'
```

Prefer not to hand-write the config? Add the `cascivoSsr()` plugin from
`@cascivo/vite-plugin`, which sets `ssr.noExternal` for every `@cascivo/*`
package. Full recipe (TanStack Start, Remix, workerd): [USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md).

---

## Handlers fire but the UI never updates (toggles don't toggle, modals don't open)

**Cause:** a component of **yours** reads a signal's `.value` during render
without subscribing. React apps get no Babel signals transform, so any component
that reads `signal.value` in render must call `useSignals()` (from
`@cascivo/core`) as its first statement — otherwise it never re-renders on
signal writes. cascivo's own components do this internally; the bug lives in
app code that composes them.

**Fix:**

```tsx
import { useSignal, useSignals } from '@cascivo/core'

function MyPanel() {
  useSignals() // ← first statement
  const open = useSignal(false)
  return <Modal open={open.value} onClose={() => (open.value = false)} />
}
```

---

## My CSS doesn't override cascivo styles

**Cause:** cascivo ships everything in cascade layers
(`cascivo.base < cascivo.theme < cascivo.component`). If your override is
_inside a layer_ that is ordered before `cascivo.component`, it loses no matter
how specific it is.

**Fix:** unlayered author CSS beats **every** cascivo layer regardless of
specificity — a plain stylesheet override just wins. To override from within a
layer, declare your layer ordered _after_ `cascivo.component`.

The inverse pitfall also exists: a global reset like `* { margin: 0; padding: 0 }`
written **outside** any layer beats all cascivo layers too, zeroing out every
component's padding. Wrap resets in a lowest-priority layer. Full recipe:
[CSS-LAYERS-PITFALL.md](https://github.com/cascivo/cascivo/blob/main/docs/CSS-LAYERS-PITFALL.md).

---

## A third-party library's CSS is overriding my cascivo styles

**Cause:** the library ships an unlayered global stylesheet, and unlayered author
CSS beats every cascivo layer regardless of specificity.

**Fix:** import the vendor CSS into a low-priority `vendor` layer declared before the
cascivo layers — `@import url('lib/styles.css') layer(vendor);`. Native CSS, no build
tooling. If you're importing the stylesheet from JavaScript
(`import 'lib/styles.css'`), it can't be layered from there — move it into a CSS file
first. Full recipe: [THIRD-PARTY-CSS.md](https://github.com/cascivo/cascivo/blob/main/docs/THIRD-PARTY-CSS.md).

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

**Behavior:** the registry _index_ is fetched network-first with an offline
fallback — the CLI caches every fetched copy under `~/.cascivo/cache` and, when
the network fails, falls back to the last cached copy with a
`Could not reach … — using the last cached copy.` notice. Component _file
payloads_ are never cached (they must be fresh, and a truncated install must
fail), so `cascivo add` itself needs a working connection.

**Fix:** check connectivity and the `registry` URL in `cascivo.config.ts`
(default `https://cascivo.com/registry.json`). A
`Network error fetching …` message after four retries means the host is
genuinely unreachable, not that your config is broken.

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

## Quick answers

**Is cascivo free?** Yes — MIT licensed. Commercial and private use, no fee, no
attribution requirement.

**Do I have to adopt all of it, or can I add one component?** Add exactly what
you need. Components are copied into your repo one at a time — no runtime, no
provider, nothing to buy into. Start with a single button.

**Do I need Tailwind?** No. Styling is modern platform CSS — `@layer`, custom
properties, container queries — driven by a three-tier token system. Using
Tailwind v4 _alongside_ cascivo works too: [USING-WITH-TAILWIND.md](/docs/using-with-tailwind.md).

**Does it work with Next.js / React Server Components?** Yes — components ship
`'use client'` preserved. Setup in [USING-WITH-NEXTJS.md](/docs/using-with-nextjs.md).

**Does it work with Vite SSR / TanStack Start / Remix / workerd?** Yes — add one
line, `ssr.noExternal: [/^@cascivo\//]` (or the `cascivoSsr()` plugin), and import
`@cascivo/react/styles.css` once. Without it the server loader throws
`Unknown file extension ".css"` (see the entry above). Full recipe:
[USING-WITH-VITE-SSR.md](/docs/using-with-vite-ssr.md).

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
