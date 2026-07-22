# Using cascivo with Vite SSR (TanStack Start, vite-ssr, Remix, workerd)

**As of `@cascivo/react` 0.10, SSR works with zero Vite config.** The package
ships a CSS-free server build selected by the `node` export condition, so a bare
server-side ESM loader — Node's native loader, or a workerd/Cloudflare runtime —
imports it cleanly. You just install, import the stylesheet once, and render.

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

**2. Import the CSS once** in your root route / server entry — this is what styles
the server-rendered first paint (the CSS-free server build carries no per-component
CSS, by design, so the aggregate stylesheet is how the server HTML gets styled):

```tsx
import '@cascivo/react/styles.css' // all component structure, one stylesheet
import '@cascivo/themes/all.css' // tokens (once) + base typography + light & dark
import '@cascivo/charts/styles.css' // only if you use @cascivo/charts
```

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

## Why import the aggregate `styles.css`?

The per-component CSS imports work great in a **client** bundle: each component
pulls only its own stylesheet and unused component CSS tree-shakes away. The
server build carries no per-component CSS at all (that's what makes it load under a
bare Node loader), so importing `@cascivo/react/styles.css` once is how the
server-rendered HTML gets styled on first paint — it is required, not optional,
under SSR:

- It carries the canonical `@layer` order statement, so the cascade is
  deterministic even before a theme loads.
- It guarantees server-rendered HTML is fully styled on first paint — no reliance
  on per-component CSS arriving through the module graph during SSR.

`styles.css` is **structure only**; it references `var(--cascivo-*)` values that
don't exist until tokens + a theme load, so always pair it with
`@cascivo/themes/all` (or an individual theme). Order: components → tokens+theme →
your brand overrides (last).

## TanStack Start

TanStack Start is Vite under the hood, so the TL;DR applies directly. Put the
config in the app's `vite.config.ts` and the imports in your root route
(`app/routes/__root.tsx`):

```tsx
// app/routes/__root.tsx
import '@cascivo/react/styles.css'
import '@cascivo/themes/all.css'
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
import '@cascivo/charts/styles.css' // once, alongside @cascivo/react/styles.css
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
`@cascivo/react` (both re-exported) on the prebuilt path — that way you never add
`@cascivo/core` as a direct dependency (under pnpm, importing it directly would be a
phantom-dependency error, since it is only a transitive dep). `LinkComponentProps`
documents the full computed bag (`href`, `aria-current`, active `data-state`,
`className`, `onClick`, …), so active styling and accessibility carry over, and — because
the link stays a real `<a>` — middle-click / open-in-new-tab keep working with no
`onClick` interception. `SideNavItem.render` is the per-item escape hatch; prefer the
global `setLinkComponent` for whole-app router wiring.

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
- **Components render but are unstyled on the server** — you skipped
  `@cascivo/react/styles.css`, or imported it after a component rendered. Import it
  once, at the top of your root entry, before any brand overrides.
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
