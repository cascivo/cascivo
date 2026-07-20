<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-with-vite-ssr.md
  registry v0.8.0 · generated 2026-07-20
-->

# Using cascivo with Vite SSR (TanStack Start, vite-ssr, Remix, workerd)

cascivo renders on the server, but the **published `@cascivo/react` bundle ships
per-component CSS as static side-effect imports** (`import './button.css'` inside
each component chunk). A bundler resolves those imports at build time; a bare
server-side ESM loader — Node's native loader, or a workerd/Cloudflare runtime —
does not, and throws:

```
Error: Unknown file extension ".css" for /…/@cascivo/react/dist/button/button.css
```

The fix is one line of Vite config: tell Vite to **process** `@cascivo/react`
during SSR instead of leaving it for the runtime to `require`/`import` raw. This
page is the recipe for any Vite-driven SSR framework (TanStack Start, `vite-ssr`,
Remix on Vite, Astro SSR, and Cloudflare/workerd targets).

Prerequisite reading: [GETTING-STARTED.md](/docs/getting-started.md) for the install
paths. Snippets use the prebuilt `@cascivo/react` package.

## TL;DR

Two lines. Add the aggregate stylesheet once in your root route/layout, and mark
the cascivo packages `ssr.noExternal` so Vite bundles their CSS imports:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    // Vite processes these packages' CSS imports instead of the server runtime
    // trying to load `.css` as an ESM module. Add charts/editor/flow if you use them.
    noExternal: [/^@cascivo\//],
  },
})
```

```tsx
// your root route / server entry — imported once
import '@cascivo/react/styles.css' // all component structure, one stylesheet
import '@cascivo/themes/all' // tokens (once) + base typography + light & dark
```

That's it. `noExternal` fixes the crash; the aggregate `styles.css` guarantees
every component is styled on the server-rendered first paint (see below).

## Zero-config with the cascivo Vite plugin

If you'd rather not hand-write the `noExternal` entry, `@cascivo/vite-plugin`
exports `cascivoSsr()`, which sets it for every `@cascivo/*` package:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { cascivoSsr } from '@cascivo/vite-plugin'

export default defineConfig({
  plugins: [cascivoSsr()],
})
```

You still import `@cascivo/react/styles.css` + a theme once. `cascivoSsr()` only
handles the SSR externalization; it composes with `cascivoLayers()` (the vendor
CSS-layering plugin) in the same `plugins` array.

**Where's a working example?** [`apps/examples/react-vite-ssr`](https://github.com/cascivo/cascivo/tree/main/apps/examples/react-vite-ssr)
is a complete Vite SSR app that server-renders a `Menubar`, `Card`, and `Button`
through the built `@cascivo/react` dist with `cascivoSsr()`. Its `test` script
imports the built server bundle and asserts it renders without the `.css` error.

## Why import the aggregate `styles.css`?

The per-component CSS imports work great in a **client** bundle: each component
pulls only its own stylesheet and unused component CSS tree-shakes away. On the
server that same mechanism is what needs `noExternal`. Importing
`@cascivo/react/styles.css` once is the belt-and-suspenders move:

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
import '@cascivo/themes/all'
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
createRouter()` name fails the build. See the
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
import { setLinkComponent } from '@cascivo/react'
import { Link } from '@tanstack/react-router'

// TanStack's Link takes `to`, so map href → to. Call once at app start.
setLinkComponent(({ href, ...rest }) => <Link to={href} {...rest} />)
```

Import it from `@cascivo/react` (where it is re-exported) on the prebuilt path — that
way you never add `@cascivo/core` as a direct dependency (under pnpm, importing it
directly would be a phantom-dependency error, since it is only a transitive dep). The
registered component receives the full computed prop bag (`href`, `aria-current`, active
`data-state`, `className`, …), so active styling and accessibility carry over.

### Timestamps (`RelativeTime`)

`RelativeTime` is hydration-safe by default: relative text is clock-dependent, so the
server text is kept on hydration and corrected on the client (no mismatch warning).
Pass a serialized server timestamp via `now` when you want byte-identical server/client
output with no post-hydration correction.

### Tailwind

TanStack Start installs Tailwind v4 by default. cascivo is CSS-native and coexists with
Tailwind's preflight — leaving it installed is safe; removing it is optional. See
[USING-WITH-TAILWIND.md](/docs/using-with-tailwind.md) if you keep both.

## Cloudflare / workerd targets

The workerd runtime has no `.css` loader either, so the same `noExternal` entry is
required. If you also use `@cascivo/charts`, `@cascivo/editor`, or `@cascivo/flow`,
they are covered by the `/^@cascivo\//` pattern; import each package's
`styles.css` once as well (`@cascivo/charts/styles.css`, etc.).

## Theme switching without a flash (SSR)

Same as every SSR target: inline `themePreloadScript()` (from `@cascivo/react`) in
your server-rendered document `<head>` so the persisted theme paints on the first
byte, then toggle from a client component with `useTheme()`. Full API in
[THEMING.md](/docs/theming.md#switching-themes-at-runtime).

## Troubleshooting

- **`Unknown file extension ".css"` still thrown** — the `noExternal` entry isn't
  reaching the SSR build. Confirm it's in the config the SSR build actually loads
  (some frameworks split client/server config), and that the pattern matches the
  package you import (`/^@cascivo\//` covers all of them).
- **Components render but are unstyled on the server** — you skipped
  `@cascivo/react/styles.css`, or imported it after a component rendered. Import it
  once, at the top of your root entry, before any brand overrides.
- **Charts show a visible data table** — you didn't import
  `@cascivo/charts/styles.css`. The accessible table is the fallback that the chart
  CSS hides.

## See also

- [`apps/examples/react-vite-ssr`](https://github.com/cascivo/cascivo/tree/main/apps/examples/react-vite-ssr) — a runnable
  Vite SSR example that verifies this recipe end to end.
- [COMPATIBILITY.md](/docs/compatibility.md) — framework and browser matrix.
- [USING-WITH-NEXTJS.md](/docs/using-with-nextjs.md) — the RSC recipe (Next.js already
  imports the aggregate stylesheet in a Server Component, so it never hits this).
- [TROUBLESHOOTING.md](/docs/troubleshooting.md) — the `useSignals()` gotcha and other
  runtime issues.
