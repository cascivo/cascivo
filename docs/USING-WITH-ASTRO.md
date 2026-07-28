# Using cascivo with Astro

**Status: partial.** cascivo works in an Astro island, but **which client directive you use
changes whether the styling arrives**. That is not something any consumer would think to
vary, and nothing warns, so read this before you start.

If you have a choice of framework for a cascivo app, plain Vite + React (or Vite + Preact)
is the better-supported path and has none of the caveats below.

---

## The problem: SSR'd islands lose their CSS

`@cascivo/react` ships each component's styling as a side-effect import inside that
component's module:

```js
// dist/button/button.module.js
import './button.css'
var e = { button: '_button_131qn_2' }
```

Every bundler that honors `sideEffects` pulls that CSS in for the components you actually
import, and tree-shakes the rest. Astro's island build does it for one directive and not the
others:

| Directive | Component CSS emitted | Result |
| --- | --- | --- |
| `client:load` / `client:visible` (SSR'd island) | **none** | renders unstyled |
| `client:only` | only what is used (~58 KB measured) | renders correctly |

Under `client:load` the hashed class names survive into the HTML — `class="_button_131qn_2"` —
with no matching rule anywhere in the output. `sideEffects: ["**/*.css"]` is declared
correctly and does not help.

It reads as a theming problem, which sends you down entirely the wrong path.

**This is Astro-specific.** The identical components in a Vite + React SPA emit their
per-component CSS with no configuration at all. A 2026-07-28 adopter reproduced it both
ways, changing only the directive, then migrated the app off Astro — which took total CSS
from 461 KB (48 KB gzip) to 238 KB (18 KB gzip).

### Workaround: import the aggregate stylesheet

```astro
---
// src/layouts/Layout.astro
import '@cascivo/react/styles.css'
import '@cascivo/themes/light-dark.css'
---
```

This always works, on every directive. The cost is real: `styles.css` carries **every**
component's CSS (~308 KB source), so a page using a dozen components ships all of them.
Measured on the reporter's app: 461 KB total against 234 KB on the `client:only` path.

### Alternative: use `client:only`

```astro
<Console client:only="react" />
```

Keeps per-component CSS and tree-shaking, at the cost of no server-rendered HTML for that
island — so it is right for an interactive console or dashboard and wrong for content you
need indexed.

Pick by what the island is: **`client:only` for app-shaped islands, the aggregate stylesheet
for content-shaped ones.**

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

## What is not yet verified

Honest scope, so this page does not repeat the mistake it documents:

- There is **no `apps/examples/astro-*` app in this repo**, so nothing in CI exercises the
  Astro path. Everything above comes from an adopter's reproduction plus reading Astro's
  island build; treat it as a report, not as a tested contract.
- Whether the `client:load` CSS drop is fixable from cascivo's side (a build change) or is
  purely an Astro island-build behaviour is **not yet determined**. Until it is, the
  compatibility matrix grades Astro ⚠️ Partial rather than ✅.

If you hit something here that does not match, please
[open an issue](https://github.com/cascivo/cascivo/issues) — an Astro repro in CI is the
missing piece.
