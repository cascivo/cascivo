# Using cascivo with Vite SSR (TanStack Start, vite-ssr, Remix, workerd)

**As of `@cascivo/react` 0.10, SSR works with zero Vite config.** The package
ships a CSS-free server build selected by the `node` export condition, so a bare
server-side ESM loader — Node's native loader, or a workerd/Cloudflare runtime —
imports it cleanly. You just install, import a theme once, and render.

**As of 0.18.0 the aggregate stylesheet is no longer part of the SSR recipe.** A
`react-server` export condition keeps the per-component CSS edges intact on the RSC
graph too, so component CSS tree-shakes under SSR exactly as it does in an SPA — see
[Per-component CSS tree-shaking under SSR](#per-component-css-tree-shaking-under-ssr).

Historically (`@cascivo/react` **< 0.10**) the published bundle shipped
per-component CSS as static side-effect imports (`import './button.css'` inside
each component chunk). A bundler resolved those at build time; a bare server
loader did not, and threw `Error: Unknown file extension ".css"` — HTTP 500 on
every route. The fix was one line of Vite config (`ssr.noExternal`). If you are
pinned below 0.10, that recipe is documented under
[Older versions (< 0.10)](#older-versions--010-the-ssrnoexternal-recipe) below; on
0.10+ you no longer need it.

This page covers any Vite-driven SSR framework (TanStack Start, `vite-ssr`, Remix
on Vite, Astro SSR, and Cloudflare/workerd targets).

Prerequisite reading: [GETTING-STARTED.md](./GETTING-STARTED.md) for the install
paths. Snippets use the prebuilt `@cascivo/react` package.

## TL;DR — the SSR checklist

Copy-paste these and SSR works end to end. On `@cascivo/react` 0.10+ there is **no
Vite config to add** — the three items below are all that's left.

**1. Use `@preact/signals-react` 3.x.** On React 19 the 2.x line fails to load
(`SyntaxError: … '__SECRET_INTERNALS…'`); the peer range enforces `>=3`. If a
lockfile pinned 2.x, run `cascivo doctor`.

**2. Import a theme once** in your root route / server entry. That is all — component
CSS is not yours to import. Each component chunk carries its own `.css` side-effect
import, so your bundler pulls in exactly the stylesheets your components need and
tree-shakes the rest, then emits them as the render-blocking `<link>` that styles the
server-rendered first paint:

```tsx
import '@cascivo/themes/light-dark.css' // tokens (once) + base typography + light & dark
import '@cascivo/charts/styles.css' // only if you use @cascivo/charts
```

Do **not** add `@cascivo/react/styles.css` here. It is the full-catalog aggregate for
setups with no bundler (CDN, plain `<link>`); importing it in a bundled app replaces
the handful of KB your page uses with all 198 components' worth. Measured on
[`apps/examples/react-vite-ssr`](../apps/examples/react-vite-ssr/): **357 KB → 29 KB**
of CSS when the aggregate import was dropped.

**3. Theme without a hydration mismatch** (runtime theme switching only): inline
`themePreloadScript()` in `<head>` and add `suppressHydrationWarning` to `<html>`,
or hard-code `data-theme` for a fixed theme. For a controlled `<ThemeProvider
value=…>` the provider is SSR-safe on its own (it emits an inline attribute setter
during render). See [Theme switching without a flash](#theme-switching-without-a-flash-ssr)
below.

> **On `@cascivo/react` < 0.10** add one more item — mark the package
> `ssr.noExternal` — see [Older versions](#older-versions--010-the-ssrnoexternal-recipe).

**Where's a working example?** [`apps/examples/react-vite-ssr`](../apps/examples/react-vite-ssr/)
is a complete Vite SSR app that server-renders a `Menubar`, `Card`, and `Button`
through the built `@cascivo/react` dist. Its `test` script imports the built
server bundle and asserts it renders without the `.css` error.

## Older versions (< 0.10): the `ssr.noExternal` recipe

If you are pinned to `@cascivo/react` **< 0.10** (before the CSS-free server
build), add one line so Vite bundles the per-component CSS imports during SSR
instead of leaving them for the server runtime to `import` raw:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: [/^@cascivo\//],
  },
})
```

Or use the plugin, which sets the same thing for every `@cascivo/*` package:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { cascivoSsr } from '@cascivo/vite-plugin'

export default defineConfig({
  plugins: [cascivoSsr()],
})
```

`cascivoSsr()` remains available and harmless on 0.10+ (it composes with
`cascivoLayers()`, the vendor CSS-layering plugin, in the same `plugins` array),
but it is no longer required — the `node` export condition handles the server
build. Upgrading to 0.10+ lets you delete the config entirely.

## Per-component CSS tree-shaking under SSR

It works, and you get it by doing nothing. Each component chunk in `@cascivo/react`
carries a `.css` side-effect import, so your **client** build pulls in only the
stylesheets of components in the module graph and tree-shakes the rest — and that
emitted stylesheet is a render-blocking `<link>` in the document `<head>`, which is
exactly what styles the server-rendered first paint. The server build never needs CSS
of its own: CSS does not apply during `renderToString`.

Measured on [`apps/examples/react-vite-ssr`](../apps/examples/react-vite-ssr/), a page
of Menubar + Card + Button: **29 KB** of CSS, of which ~26 KB is the light+dark theme
bundle. The same page importing the aggregate as well: 357 KB. Its
[smoke test](../apps/examples/react-vite-ssr/test/ssr-smoke.mjs) asserts both halves —
that every class in the server HTML has a rule in the emitted CSS, and that the total
stays under budget.

> **This page used to say the opposite** — that the aggregate was required under SSR and
> that "there is no flag that makes the aggregate shakeable". That was wrong, and the
> cause was a genuine bug rather than a law of physics: `@cascivo/react` offered no
> `react-server` export condition, so React Server Components fell through to `node` and
> got the CSS-free server twin, silently dropping the stylesheet of every component that
> renders on the server. The aggregate hid it. Fixed in 0.18.0 — see
> [docs/plans/ssr-css-and-client-js-plan.md](./plans/ssr-css-and-client-js-plan.md).

### When the aggregate *is* right

`@cascivo/react/styles.css` remains supported and correct for setups where no bundler
walks the module graph:

- a plain `<link rel="stylesheet">` from a CDN, or any no-build page;
- an environment that strips the CSS edges before your bundler sees them — Astro's
  `client:load` / `client:visible` islands do this today (see
  [USING-WITH-ASTRO.md](./USING-WITH-ASTRO.md)).

It is **structure only**, plus tokens and the light/dark themes; if you pair it with a
`@cascivo/themes` bundle as well you are shipping tokens and both themes twice. Order:
components → tokens+theme → your brand overrides (last).

## TanStack Start

TanStack Start is Vite under the hood, so the TL;DR applies directly — put the theme
import in your root route (`app/routes/__root.tsx`) and let component CSS ride the
module graph:

```tsx
// app/routes/__root.tsx
import '@cascivo/themes/light-dark.css'
import { createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  // …your root component
})
```

No `<ClientOnly>` wrappers are needed: cascivo components ship `'use client'` and
render their server HTML normally; only their signal-driven interactivity runs in
the browser, after hydration. Charts (including `PieChart`/donut) server-render and
hydrate cleanly — no client-only boundary required.

> **TanStack Start specifics (not cascivo — but you'll hit them right here).** Two
> framework potholes show up around, not inside, this recipe. As of TanStack Start
> **1.170**:
>
> - **The router module must export `getRouter`.** Newer TanStack Start expects your
>   `src/router.tsx` to export a `getRouter` function; an older `export function
>   createRouter()` name fails the build. See the
>   [TanStack Start docs](https://tanstack.com/start/latest).
> - **`vite build` emits an SSR _handler_, not a server.** The default build output
>   (`dist/server/server.js`) is a request handler, not a self-listening process;
>   production serving needs a server preset/adapter (Node, Netlify, Cloudflare, …).
>   Pick one via TanStack Start's server-preset configuration.
>
> Neither is a cascivo issue; both are worth knowing before you deploy. Delete this
> note once TanStack Start's API settles.

### Charts are a separate install

`@cascivo/react` exports no charts. For dashboards, add `@cascivo/charts` and import
its stylesheet once:

```sh
pnpm add @cascivo/charts
```

```tsx
import '@cascivo/charts/styles.css' // once, alongside your theme import
import { AreaChart, BarChart, PieChart } from '@cascivo/charts'
```

The code editor (`@cascivo/editor`) and flow canvas (`@cascivo/flow`) are likewise
separate installs with their own stylesheet, all covered by the `/^@cascivo\//`
`noExternal` pattern.

### Router-aware nav links

cascivo's config-driven nav components (SideNav, ShellHeader, Header, Breadcrumb,
Switcher, Dock) render plain `<a href>` by default. Register your router's `Link`
once at startup so they navigate client-side and hover-preload — no `onClick`
interception:

```tsx
import { setLinkComponent, type LinkComponentProps } from '@cascivo/react'
import { Link } from '@tanstack/react-router'

// TanStack's Link takes `to`, so map href → to and spread the rest. Call once at start.
setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href} {...rest} />)
```

Import `setLinkComponent` and the `LinkComponentProps` contract type from
`@cascivo/react` — see [Where do imports come from?](#where-do-imports-come-from) below.
`LinkComponentProps`
documents the full computed bag (`href`, `aria-current`, active `data-state`,
`className`, `onClick`, …), so active styling and accessibility carry over, and — because
the link stays a real `<a>` — middle-click / open-in-new-tab keep working with no
`onClick` interception. `SideNavItem.render` is the per-item escape hatch; prefer the
global `setLinkComponent` for whole-app router wiring.

### Where do imports come from?

On the prebuilt path (Path B), **everything comes from `@cascivo/react`** — components,
hooks, and the behavior primitives alike. Your `package.json` needs exactly:

```jsonc
{
  "dependencies": { "@cascivo/react": "^0.11.0" },
  // peers you install alongside it:
  "peerDependencies": { "react": ">=18", "react-dom": ">=18", "@preact/signals-react": ">=3" },
}
```

| You need | Import from | Notes |
| --- | --- | --- |
| Components (`Button`, `DataTable`, `AppShell`, …) | `@cascivo/react` | |
| Reactivity (`useSignal`, `useComputed`, `useSignalEffect`, `useSignals`, `signal`, `computed`, `effect`, `batch`) | `@cascivo/react` | Re-exported; identical module instance, not a copy |
| Controlled-prop bridges (`useControllableSignal`, `useEffectPropSignal`, `useDisclosure`, `useMachine`) | `@cascivo/react` | |
| Behavior primitives (`useId`, `useMediaQuery`, `useRovingFocus`, `useTypeahead`, `useAnchorPosition`, `DismissableLayer`, `FocusScope`, `Portal`, `Slot`, …) | `@cascivo/react` | |
| Router wiring (`setLinkComponent`, `LinkComponentProps`) | `@cascivo/react` | |
| The `Signal` / `ReadonlySignal` **types** | `@preact/signals-react` | It is a declared peer, so you already list it — a legal, non-phantom import |
| Charts, icons, themes | `@cascivo/charts`, `@cascivo/icons`, `@cascivo/themes` | Separate installs |

**Do not add `@cascivo/core` to a Path B app.** Under pnpm's strict layout it is only a
transitive dependency, so importing it directly is a phantom-dependency error — and you
never need to: every primitive above is re-exported from `@cascivo/react`. Only the
copy-paste path (Path A), where you own the component source, depends on `@cascivo/core`
directly.

> This used to be a prohibition with no alternative — the reactivity contract said "use
> `useSignal`" while `useSignal` existed only in `@cascivo/core`. An adopter following both
> rules had no legal move. `scripts/checks/path-b-parity.test.ts` now fails the build if a
> primitive the docs name is not reachable from `@cascivo/react`.

### Timestamps (`RelativeTime`)

`RelativeTime` is hydration-safe by default: relative text is clock-dependent, so the
server text is kept on hydration and corrected on the client (no mismatch warning).
Pass a serialized server timestamp via `now` when you want byte-identical server/client
output with no post-hydration correction.

### Tailwind

TanStack Start installs Tailwind v4 by default. cascivo is CSS-native and coexists with
Tailwind's preflight — leaving it installed is safe; removing it is optional. See
[USING-WITH-TAILWIND.md](./USING-WITH-TAILWIND.md) if you keep both.

## Cloudflare / workerd targets

The workerd runtime has no `.css` loader either, but on `@cascivo/react` 0.10+ the
`node`-condition server build carries no `.css` imports, so it loads there with no
extra config. `@cascivo/charts`, `@cascivo/editor`, and `@cascivo/flow` each ship a
single aggregate stylesheet (not per-component side-effect imports), so they never
hit the loader either — just import each package's `styles.css` once
(`@cascivo/charts/styles.css`, etc.) so their server HTML is styled. On
`@cascivo/react` < 0.10, add the `noExternal` entry from
[Older versions](#older-versions--010-the-ssrnoexternal-recipe).

## Theme switching without a flash (SSR)

Same as every SSR target: inline `themePreloadScript()` (from `@cascivo/react`) in
your server-rendered document `<head>` so the persisted theme paints on the first
byte, then toggle from a client component with `useTheme()`. Two SSR specifics:

- **Add `suppressHydrationWarning`** to the element the script writes to (usually
  `<html>`). The script sets `data-theme` before React hydrates, so without the flag
  React 19 logs a hydration mismatch.
- **Pass `defaultTheme`** for a "dark by default" app — it wins over the visitor's OS
  `prefers-color-scheme`, so a light-OS visitor still gets your dark default. Precedence:
  persisted value > `defaultTheme` > OS > `'light'`.

```tsx
<html suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themePreloadScript({ defaultTheme: 'dark' }) }} />
  </head>
</html>
```

For a **fixed** theme, skip the script and hard-code `data-theme="dark"` on the
server-rendered `<html>` — it never mismatches. Full API in
[THEMING.md](./THEMING.md#switching-themes-at-runtime).

## Troubleshooting

- **`Unknown file extension ".css"` thrown** — you're on `@cascivo/react` < 0.10.
  Either upgrade to 0.10+ (the server build is CSS-free, no config needed) or add
  the `noExternal` entry from
  [Older versions](#older-versions--010-the-ssrnoexternal-recipe). If you're already
  on 0.10+ and still see it, confirm your SSR resolver honors the `node` export
  condition (custom loaders that force `import`/`browser` conditions server-side
  would pick the CSS-bearing build — use the default Node/Vite SSR conditions, or
  add `noExternal` as a fallback).
- **`Cannot find module or type declarations for side-effect import` (TS2882)** on
  `import '@cascivo/themes/all.css'` — your tsconfig enables
  `noUncheckedSideEffectImports` (the TanStack Start scaffold does). Use the
  `.css`-suffixed specifier: `import '@cascivo/themes/all.css'`.
- **Components render but are unstyled on the server** — you skipped the theme
  import, so every `var(--cascivo-*)` is unresolved and components paint greyscale.
  Import `@cascivo/themes/light-dark.css` (or a single theme) once, at the top of your
  root entry, before any brand overrides. If the markup has no styling *at all* rather
  than missing colors, your resolver is picking the CSS-free `node` build for modules
  that render on the server — confirm nothing in your config forces the `node`
  condition for the client/RSC graphs, and see
  [the aggregate escape hatch](#when-the-aggregate-is-right).
- **Charts show a visible data table** — you didn't import
  `@cascivo/charts/styles.css`. The accessible table is the fallback that the chart
  CSS hides.

## See also

- [`apps/examples/react-vite-ssr`](../apps/examples/react-vite-ssr/) — a runnable
  Vite SSR example that verifies this recipe end to end.
- [COMPATIBILITY.md](./COMPATIBILITY.md) — framework and browser matrix.
- [USING-WITH-NEXTJS.md](./USING-WITH-NEXTJS.md) — the RSC recipe (Next.js already
  imports the aggregate stylesheet in a Server Component, so it never hits this).
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — the `useSignals()` gotcha and other
  runtime issues.
