# Using cascivo with Astro

**Status: supported** as of `@cascivo/react` 1.0.1, with **one required line of config**.
Every client directive — `client:load`, `client:visible`, `client:only` — then
server-renders and styles correctly, and page content rendered with no directive at all
ships as static HTML with zero JS.

`npx cascivo create my-app --framework astro` emits this wiring already done.

---

## Setup

```sh
npx astro add react
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
```

### The required config

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      noExternal: [/^@cascivo\//],
    },
  },
})
```

**Without it, SSR'd islands render unstyled** — correct class names in the HTML, no
matching rules anywhere in the output, and nothing warning. It reads as a theming problem
and sends you down entirely the wrong path.

Why it is needed: Vite externalizes `node_modules` packages in its server build, so an
externalized `@cascivo/react` is imported by Node at runtime and its module graph is never
walked — and Astro collects a page's CSS by walking that graph. `noExternal` puts the
package back in the graph.

Two details worth pinning down, because both cost real time to rediscover:

- It must be **`resolve.noExternal`**, not `ssr.noExternal`. Astro prerenders static routes
  in its own Vite environment, which `ssr.*` does not reach. This is the same trap the
  Preact section below describes.
- It is **not sufficient on its own**. Before `@cascivo/react` 1.0.1 the package's exports
  map listed its CSS-free `node` twin ahead of `import`, so `noExternal` merely bundled the
  CSS-free build and the islands stayed unstyled. You need 1.0.1+ **and** this config.

### Theme import

Import the theme once in a shared layout. Component CSS is **not** in this list — each
component chunk carries its own stylesheet and Astro emits only what your pages use:

```astro
---
// src/layouts/Layout.astro
import '../styles/layers.css'          // cascade layer order — must come first
import '@cascivo/themes/light-dark.css'
---
<html lang="en" data-theme="light">
  <body><slot /></body>
</html>
```

Put your `@layer` order statement in a CSS file imported **before** the theme, not in a
`<style>` tag in the layout. Layers take their position from first appearance, so a
statement that lands after the theme's CSS cannot reorder anything — and a `vendor` layer
declared too late ends up beating every cascivo layer instead of losing to all of them.

## Choosing a client directive

With the config above in place this is an ordinary performance decision, not a styling
constraint — all of these emit per-component CSS:

| Directive | Server HTML | JS shipped | Reach for it when |
| --- | --- | --- | --- |
| *(none)* | yes | **none** | static page content — the default for anything non-interactive |
| `client:load` | yes | yes | interactive and above the fold |
| `client:visible` | yes | yes | interactive and below the fold |
| `client:only="react"` | **no** | yes | app-shaped islands you do not need indexed |

A cascivo component used in an `.astro` file with **no** directive renders to static HTML
and ships no JavaScript, while still emitting its CSS. That is usually what you want for
page content; reserve directives for the parts that actually need to hydrate.

A component that reads `signal.value` during render must call `useSignals()` from
`@cascivo/react` as its first statement — Astro applies no signals transform.

---

## Preact under Astro does not work

`docs/USING-WITH-PREACT.md` describes a verified Vite CSR setup. Under Astro with
`@astrojs/preact({ compat: true })`, the build fails:

```
TypeError: Cannot read properties of null (reading 'useRef')
  at exports.useRef (node_modules/.pnpm/react@19.2.8/…/react.production.js:523:33)
  at node_modules/.pnpm/@preact+signals-react@3.11.0/…/runtime.mjs
  at Object.renderToStaticMarkup (…)
```

Three causes stack up, and fixing all three still does not work. Documented here so nobody
re-derives a day of work:

1. **`@astrojs/preact`'s compat branch is dead code.** It adds its React `noExternal`
   entries only when `options.resolve.noExternal` is unset, and Astro always pre-populates
   that key — so the branch never runs. (Upstream Astro bug.)
2. **`vite.ssr.noExternal` does not reach Astro's prerender.** cascivo's Vite-SSR guide
   tells you to set it, and that key applies only to Vite's `ssr` environment. Astro
   prerenders static routes in a separate `prerender` environment, where it never applies.
3. **`@preact/signals-react` must also be inlined.** cascivo's docs list only
   `/^@cascivo\//`. Left external, Node resolves its bare `react` import to the real React,
   whose dispatcher is `null` under Preact's renderer.

And after all three: Astro registers identity aliases (`/^react$/ → react`) **ahead of** the
compat aliases (`react → preact/compat`), so the identity alias wins and real React ends up
in the bundle. The same `useRef` crash then reproduces client-side under
`client:only="preact"` too.

**Use React islands under Astro.** Preact + cascivo is verified and fast on plain Vite CSR
(the same app measured 60 KB gzip on Preact against 110 KB on React) — just not through
Astro's compat layer.

---

## Verification status

Honest scope, so this page does not repeat the mistake it documents:

- **Verified end to end on a real install.** `npx cascivo create --framework astro`,
  installed from packed tarballs outside the monorepo, builds three routes and every
  cascivo class in the emitted HTML has a matching rule. The cascade layer order in the
  built CSS is the canonical one, and only the shell hydrates (one island per page).

- **The in-repo fixture proves less than it looks.**
  [`apps/examples/astro-islands`](../apps/examples/astro-islands/) builds a real Astro app
  with one client directive per page and asserts per-page that referenced classes have
  rules — but it depends on `@cascivo/react` as `workspace:*`. Vite does not externalize
  linked packages, so that fixture never exercises the externalization half of this page,
  and it passes **without** the `resolve.noExternal` config an adopter needs. It catches the
  export-condition half only. Do not read a green fixture as "an npm install works".

- The **export-condition ordering** the fix depends on is enforced separately by
  `pnpm css-contract:check`, across every package that ships a `node` twin.

- The **Preact-under-Astro** section is NOT reproduced in CI — it comes from the adopter's
  report plus reading `@astrojs/preact`. Treat it as a report, not a tested contract. It is
  a separate issue and is **not** fixed by 1.0.1.

If you hit something here that does not match, please
[open an issue](https://github.com/cascivo/cascivo/issues).
