<!--
  Generated from docs/ — do not edit here; run `pnpm regen`.
  Canonical: https://cascivo.com/docs/using-with-astro.md
  registry v1.9.0 · generated 2026-10-09
-->

# Using cascivo with Astro

**Status: supported.** A plain `astro add react` app that installs `@cascivo/react` renders
styled with **no cascivo config** from the first release after `@cascivo/react` 1.9.0. `client:load`
and `client:visible` islands server-render and style correctly, `client:only` islands render on
the client, and page content rendered with no directive ships as static HTML with zero JS.

`@cascivo/astro` is the recommended companion: one integration for the layer order, the theme
stylesheet and a no-flash theme that survives `<ClientRouter />`.

`npx cascivo create my-app --framework astro` emits all of this already wired.

---

## Setup

```sh
npx astro add react
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
npx astro add @cascivo/astro
```

`@astrojs/react` 7 pairs with `astro` 7 (the scaffold pins both); an older `@astrojs/react` next
to Astro 7 installs two Vite majors and prints a deprecation warning per build.

### `@cascivo/astro` (recommended)

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import cascivo from '@cascivo/astro'

export default defineConfig({
  integrations: [react(), cascivo()],
})
```

On every page, ahead of any other CSS, it:

1. injects the CSS layer order as one full statement. The default is `@layer vendor,
cascivo.reset … cascivo.override;`: `vendor` lowest, then cascivo's canonical order;
2. imports the theme stylesheet (default `@cascivo/themes/light-dark.css`);
3. inlines the no-flash theme script in `<head>` and re-applies the theme after every
   `<ClientRouter />` swap (see [Theme across navigation](#theme-across-navigation));
4. keeps `@cascivo/*` in the Vite graph with `vite.resolve.noExternal`, so older
   `@cascivo/react` releases (see [Older versions](#older-versions-and-the-cause)) stay styled.

| Option        | Default                            | Notes                                                                                                  |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `layers`      | the default statement above        | A **complete** `@layer …;` statement. Pass it to add your own layers.                                  |
| `theme`       | `'@cascivo/themes/light-dark.css'` | Any theme stylesheet, or `false` to import it yourself.                                                |
| `themeScript` | `{}`                               | `{ storageKey?, attribute?, defaultTheme? }`, matching `ThemeProvider`'s props, or `false` to opt out. |

An app on a single custom theme must name it in both places, or the defaults repaint it as plain
light or dark (this is what the scaffold writes):

```js
cascivo({
  theme: '@cascivo/themes/midnight.css',
  themeScript: { defaultTheme: 'midnight' },
})
```

**Your own layers.** A layer takes its position from its first appearance, so the statement the
integration injects must already name every layer the page will use. An app with its own slots
passes the whole order, with `vendor` first so third-party CSS loses to every cascivo layer:

```js
cascivo({
  layers:
    '@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.platform, cascivo.theme, cascivo.blocks, myapp, cascivo.override;',
})
```

The cascivo names and their order are `@cascivo/tokens/layers.css`; add only `vendor` and your own
slots, and keep your slots between `cascivo.blocks` and `cascivo.override`. Every
component stylesheet now also declares the canonical order itself, so a stylesheet that arrives
first no longer decides the order by accident. The injected statement is what places **your**
layers and `vendor`.

### Without the integration

Skip `@cascivo/astro` and nothing breaks, but you then own the three jobs it does: put a layer
order statement in a CSS file imported **before** the theme (not in a layout `<style>` tag, which
can land after cascivo's CSS), import the theme once in a shared layout, and inline
`themePreloadScript({ reapplyOn: 'astro:after-swap' })` from `@cascivo/react` in `<head>` if you
use `<ClientRouter />`.

```astro
---
// src/layouts/Layout.astro
import '../styles/layers.css'          // the @layer order statement, first
import '@cascivo/themes/light-dark.css'
---
<html lang="en" data-theme="light">
  <body><slot /></body>
</html>
```

Component CSS is never in this list: each component chunk carries its own stylesheet and Astro
emits only what your pages use.

### Older versions and the cause

Releases of `@cascivo/react` up to and including 1.9.0 need
`vite.resolve.noExternal: [/^@cascivo\//]` in `astro.config.mjs` (`@cascivo/astro` sets it for
you). Without it, SSR'd islands render unstyled: correct class names in the HTML, no matching
rules anywhere in the output, and nothing warns. It reads as a theming problem.

Why: Vite externalizes `node_modules` packages in its server build, so Node imports
`@cascivo/react` at runtime and its module graph is never walked. Astro collects a page's CSS by
walking that graph. Astro does inline any package whose `keywords` include `astro-component`, and
`@cascivo/react`, `charts`, `ai`, `editor` and `flow` now carry it, which is why newer releases
need no config.

It must be **`resolve.noExternal`**, not `ssr.noExternal`: Astro prerenders static routes in its
own Vite environment, which `ssr.*` does not reach.

---

## Compose in `.tsx`, hydrate the island

Astro renders each `.astro` child separately and React context never crosses that boundary. So a
compound component composed in an `.astro` file has parts with no root to talk to:

```astro
<!-- BAD: TabsTrigger renders outside Tabs -->
<Tabs client:load>
  <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
</Tabs>
```

`Tabs` and `Accordion` parts used outside their root throw an error that names this fix. Write
the composition in one `.tsx` file and hydrate **that**:

```tsx
// src/components/PricingTabs.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@cascivo/react'

export function PricingTabs() {
  return (
    <Tabs defaultValue="monthly">
      <TabsList>
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="yearly">Yearly</TabsTrigger>
      </TabsList>
      <TabsContent value="monthly">…</TabsContent>
      <TabsContent value="yearly">…</TabsContent>
    </Tabs>
  )
}
```

```astro
---
import { PricingTabs } from '../components/PricingTabs'
---
<PricingTabs client:visible />
```

**Never put a `client:*` directive on a `@cascivo/react` export imported straight into an
`.astro` file.** The package barrel becomes the island entry, tree-shaking cannot drop
anything, and it measured **326 KB of JS and 331 KB of CSS** (against 29 KB and 8 KB through a
local `.tsx` wrapper). That CSS also lands in the shared chunks of your other islands.

A component that reads `signal.value` during render must call `useSignals()` from
`@cascivo/react` first; Astro applies no signals transform.

### Choosing a client directive

| Directive             | Server HTML | JS shipped | Reach for it when                                             |
| --------------------- | ----------- | ---------- | ------------------------------------------------------------- |
| _(none)_              | yes         | **none**   | static page content, the default for anything non-interactive |
| `client:load`         | yes         | yes        | interactive and above the fold                                |
| `client:visible`      | yes         | yes        | interactive and below the fold                                |
| `client:only="react"` | **no**      | yes        | app-shaped islands you do not need indexed                    |

A cascivo component with no directive renders to static HTML and ships no JavaScript while still
emitting its CSS. Components that only work with client JS (a `Modal` opening, `Tabs`
switching) are inert without a directive, and nothing warns.

---

## Theme across navigation

With `<ClientRouter />`, a soft navigation copies the incoming page's server-rendered
`<html data-theme>` over the visitor's choice, and the `<head>` script does not run again. The
theme would revert to light on every click. `@cascivo/astro` handles this: its theme script
re-applies after `astro:after-swap`. By hand:

```astro
---
import { themePreloadScript } from '@cascivo/react'
---
<script is:inline set:html={themePreloadScript({ reapplyOn: 'astro:after-swap' })} />
```

Two rules for theme-aware islands:

- `useTheme()` returns the constant `'light'` during SSR and the hydration render, then the real
  value right after hydration. That keeps hydration clean (no React error #418) when the
  persisted theme differs from the server's, but text such as `{theme}` reads `'light'` until
  hydration. Put theme-dependent visuals in CSS (`[data-theme='dark'] &`), not in a branch on
  the value. See [THEMING.md](/docs/theming.md#switching-themes-at-runtime).
- `ThemeProvider` never writes module state on the server, so on-demand SSR does not leak one
  request's theme into the next.

The inline theme script is picked up by Astro's `security.csp` hashing.

---

## Persisted islands

`Modal` and `Popover` inside a `transition:persist` island keep working across navigation. Where
the browser has `Element.moveBefore`, Astro moves the island without detaching it. Where it does
not, the DOM re-insertion would drop an open `<dialog>` from the top layer and close an open
popover; cascivo restores both.

---

## Starlight

Starlight and cascivo coexist. Load cascivo's stylesheets through Starlight's `customCss` and
use React islands in MDX as usual. Starlight's theme picker also drives cascivo's dark mode:
both key off `<html data-theme="light|dark">`, so cascivo components follow the picker with no
bridge code. This was checked by hand against Starlight 0.42; it is not one of the
`framework:check` assertions below.

## MDX

cascivo components work in `@astrojs/mdx`, static or with a directive. In dev, an MDX page that
sets `layout:` frontmatter can load the layout's CSS after the component CSS, which is why the
layer order is injected as its own first module and why each component stylesheet declares the
order too.

---

## Preact under Astro

`docs/USING-WITH-PREACT.md` describes a verified Vite CSR setup. Under Astro the picture splits:

- **`client:only="preact"` works.** Verified in build and dev (Astro 7.4, `@astrojs/preact`
  6.1): hydrates, clicks update signals, console clean. The island chunk was 35 KB.
- **Server-rendered Preact islands (`client:load`, `client:visible`, no directive) fail**, in
  build and dev:

  ```
  TypeError: Cannot read properties of null (reading 'useRef')
  ```

  `@preact/signals-react` is left external, Node resolves its bare `react` import to the real
  React, and React's dispatcher is `null` under Preact's renderer. Inlining it exposes the next
  layer, `Cannot read properties of undefined (reading '__H')`: two Preact instances, a CJS
  `preact/compat` against the renderer's ESM `preact`. That is an `@astrojs/preact`
  compat and aliasing problem, not fixable from cascivo.

If you need server rendering under Astro, use React islands. Preact + cascivo is verified and
small on plain Vite CSR (60 KB gzip against 110 KB on React).

---

## Verification status

What is checked, and where:

- **`pnpm framework:check`** is the authority for the adopter path. Its Astro arm packs every
  cascivo package, installs a naive-adopter app (`astro add react` + `@cascivo/react`, no
  cascivo config) from the tarballs **outside the monorepo**, and runs it two ways: vanilla, and
  with `cascivo()`. Each variant is built, previewed and run under `astro dev`, with Chromium
  asserting:
  - the first response is styled (every cascivo class has a rule);
  - islands hydrate, for every directive and for MDX, with no hydration errors in the console;
  - the theme survives `<ClientRouter />` soft navigation;
  - the layer-order statement is the first `@layer` rule in dev;
  - no island's entry is the `@cascivo/react` barrel;
  - `Modal` and `Popover` survive `transition:persist` with `Element.prototype.moveBefore`
    removed.

  It also removes the `astro-component` keyword from a repacked `@cascivo/react` and expects
  unstyled output, so the zero-config path cannot pass by accident.

- **Weekly, against the newest Astro.** `.github/workflows/framework-latest.yml` runs the same arm
  with `ASTRO_VERSION=latest`, so the next Astro release (a major above all) is caught before
  adopters hit it.
- **`pnpm css-contract:check`** guards the export-condition order and the keyword in every
  package that ships CSS.
- **Not covered by that arm:** Starlight (checked by hand), `server:defer` (checked by hand),
  real Safari and Firefox (only Chromium runs, so the no-`moveBefore` path is simulated), and
  Preact under Astro (a documented report, not a tested contract).
- **A green `apps/examples/astro-islands` proves little.** It depends on `@cascivo/react` as
  `workspace:*`, which Vite never externalizes, so it passes without any of the config above.
  Do not read it as "an npm install works".

`cascivo doctor` warns when an Astro project uses `@cascivo/react` with none of the integration,
`resolve.noExternal` or a version that carries the keyword, and `cascivo init` prints the Astro
next steps.

If you hit something here that does not match, please
[open an issue](https://github.com/cascivo/cascivo/issues).
