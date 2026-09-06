# Using cascivo with Astro

**Status: supported** as of `@cascivo/react` 1.0.1. Every client directive —
`client:load`, `client:visible`, `client:only` — server-renders and styles correctly with a
vanilla `astro.config.mjs`. No aggregate stylesheet, no `ssr.noExternal`, no tuning.

If you are pinned below 1.0.1, read [Older versions](#older-versions-below-101) — SSR'd
islands render unstyled there, and the workaround is not obvious.

---

## Setup

```sh
npx astro add react
pnpm add @cascivo/react @cascivo/themes @preact/signals-react
```

Import the theme once in a shared layout. Component CSS is **not** in this list — each
component chunk carries its own stylesheet and Astro emits only what your islands use:

```astro
---
// src/layouts/Layout.astro
import '@cascivo/themes/light-dark.css'
---
<html lang="en">
  <body><slot /></body>
</html>
```

Then use components in islands as normal:

```astro
---
import { Card } from '@cascivo/react'
---
<Card client:load title="Revenue">…</Card>
```

## Choosing a client directive

This is now an ordinary performance decision, not a styling constraint — all three emit
per-component CSS:

| Directive | Server-rendered HTML | Reach for it when |
| --- | --- | --- |
| `client:load` | yes | the island is above the fold and interactive immediately |
| `client:visible` | yes | the island is below the fold |
| `client:only="react"` | **no** | the island is app-shaped (a console, a dashboard) and you do not need it indexed |

Prefer an SSR'd directive for anything that should be indexed or visible before hydration.

## Older versions (below 1.0.1)

Under `client:load` / `client:visible`, Astro emitted the hashed class names into the HTML —
`class="_card_ipz9f_2"` — with no matching rule anywhere in the output. `client:only` worked.
Nothing warned, and it read as a theming problem.

The cause was cascivo's, not Astro's. Export conditions match in **declaration order**, and
`@cascivo/react` listed its CSS-free `node` twin (which exists so a bare Node ESM loader
does not throw `ERR_UNKNOWN_FILE_EXTENSION`) ahead of `import`. Astro's SSR build resolves
with `node` active, so its *server* module graph got the CSS-free build — and Astro collects
a page's CSS by walking that graph. `client:only` escaped because it never server-renders.

Two things that look like they should help, and do not: `sideEffects: ["**/*.css"]` is
declared correctly (the edges simply are not in the server graph to preserve), and
`vite.ssr.noExternal` — what [`USING-WITH-VITE-SSR.md`](./USING-WITH-VITE-SSR.md)
recommends — does not change which condition wins, so it leaves the islands unstyled.

**Upgrade to 1.0.1+.** If you cannot, import the aggregate stylesheet in a shared layout:

```astro
---
import '@cascivo/react/styles.css'   // every component's CSS, ~308 KB source
import '@cascivo/themes/light-dark.css'
---
```

That works on every directive, at the cost of shipping the whole catalog's CSS. Measured on
the reporting app: 461 KB total against 234 KB on the `client:only` path.

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

- **The fix is verified in CI, on a vanilla config.**
  [`apps/examples/astro-islands`](../apps/examples/astro-islands/) builds a real Astro app
  with **one client directive per page** and asserts, per page, that every component class
  its markup references has a matching rule. Current result on **Astro 7.1.4**:

  ```
  load/index.html      5 classes  ->  styled
  visible/index.html   5 classes  ->  styled
  only/index.html      0 classes  ->  (no SSR'd markup — client:only renders on the client)
  ```

  That fixture is now a **regression test**: it exits non-zero if an SSR'd island ever again
  references a class with no rule. It used to exit 0 on that case, back when the drop was
  believed to be upstream behaviour cascivo could not fix.

  One directive per page matters: a single page carrying all three passes trivially, because
  `client:only` emits the component CSS and the SSR'd islands on the same page then appear
  covered by it. The first version of that fixture did exactly this and reported "does not
  reproduce".

- The **export-condition ordering** the fix depends on is separately enforced by
  `pnpm css-contract:check`, across every package that ships a `node` twin — so it cannot
  regress silently in a package the Astro fixture does not exercise.

- The **Preact-under-Astro** section is NOT reproduced in CI — it comes from the adopter's
  report plus reading `@astrojs/preact`. Treat that section as a report, not a tested
  contract. It is a separate issue from the CSS drop and is **not** fixed by 1.0.1.

If you hit something here that does not match, please
[open an issue](https://github.com/cascivo/cascivo/issues).
