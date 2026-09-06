# Framework templates for Astro and Ghost — research findings

> **Status:** recommendation 1 (the export-condition fix) and 2 (the Astro re-grade) are
> **implemented**. Astro is now ✅ in the compatibility matrix. Recommendations 3
> (`create --framework astro`) and 4 (the Ghost guide) are still open.

**Question asked:** does it make sense to ship special templates for existing frameworks
like Astro or Ghost, to make cascivo easier to adopt there?

**Short answer:** **Astro yes — but not yet, and not as a template.** The blocker is not
missing scaffolding, it is that SSR'd Astro islands render unstyled. This research found the
root cause (it is *ours*, not Astro's) and verified a one-line fix. Ship the fix first; a
template on top of a broken integration would ship the bug to more people, faster.

**Ghost: no.** Ghost themes are Handlebars rendered server-side with no JS framework layer.
There is no seam a React component library can occupy. The tokens/themes CSS is usable there,
which is a documentation job, not a template.

---

## 1. What already exists

Worth stating, because the answer is "more than you'd expect":

| Surface | State |
| --- | --- |
| Template system | Built. `type: "template"` registry items, `validateTemplate`, `cascivo template init`, `cascivo add owner/repo/name`, `cascivo create --template`, marketplace listing. See [`CONTRIBUTING-TEMPLATES.md`](../CONTRIBUTING-TEMPLATES.md). |
| Declared frameworks | `'react-vite' \| 'react-next'` — `packages/registry/src/types.ts:50`, enforced at `packages/registry/src/template.ts:3`. |
| `cascivo create` scaffolds | **One** shape: a Vite + React SPA. No framework flag. `--template` installs a template *into* that scaffold. |
| Astro | An example app (`apps/examples/astro-islands`) that exists to *reproduce a bug*, wired into CI (`ci.yml:225`). Graded ⚠️ Partial. |
| Ghost | Zero references anywhere in the repo. |

So "provide a template for framework X" is already a solved mechanism. The open question is
only ever *which frameworks deserve one*, and that reduces to *which frameworks cascivo
actually works on*.

---

## 2. Astro: the blocker is a real bug, and it is ours

### 2.1 The documented position was wrong

`docs/USING-WITH-ASTRO.md` and `apps/examples/astro-islands/scripts/assert-island-css.mjs`
both state the CSS drop is "upstream behaviour cascivo cannot fix", and the doc records the
root cause as **not yet determined**:

> Whether the `client:load` CSS drop is fixable from cascivo's side (a build change) or is
> purely an Astro island-build behaviour is **not yet determined**.

It is determined now. It is a build/packaging choice in `@cascivo/react`, and it is fixable.

### 2.2 Root cause

`packages/react/package.json` orders its export conditions:

```jsonc
{
  "types":        "./dist/index.d.ts",
  "react-server": "./dist/index.js",       // CSS-bearing
  "node":         "./dist/node/index.js",  // CSS-FREE twin
  "import":       "./dist/index.js",       // CSS-bearing
  "default":      "./dist/index.js"
}
```

The `node` twin is a deliberate, correct feature: `packages/react/vite.config.ts:78-89`
emits a second copy of the whole module graph with every `import './x.css'` edge stripped,
so a **bare Node ESM loader** can `import '@cascivo/react'` without
`ERR_UNKNOWN_FILE_EXTENSION`.

Export conditions match in **object key order**. Astro's SSR/prerender build runs through
Vite, whose SSR resolve conditions include `node` — so `node` matches *before* `import`, and
Astro's server module graph gets the CSS-free twin. Astro collects a page's CSS by walking
that server graph. There is no CSS in it. So it emits none.

This explains every observed symptom exactly, including the two that made it look like an
Astro bug:

- **`client:only` works, `client:load`/`client:visible` don't.** `client:only` never
  server-renders, so only the *client* graph exists — resolved via `import`/`browser`,
  which is CSS-bearing.
- **`sideEffects: ["**/*.css"]` "is declared correctly and does not help."** Correct — the
  CSS edges are not in the server graph to be preserved.

It is the same failure RSC had, which is why `react-server` was already added *ahead of*
`node` to steer RSC back to the CSS-bearing build (see `COMPATIBILITY.md`). Astro simply
never got the equivalent.

### 2.3 Evidence

All of the following was run in this session on `astro@7.1.4`, current `main`.

**The server build resolves the node twin** — a deliberately induced resolve error named
the file:

```
Rolldown failed to resolve import "@cascivo/core" from
  "/home/user/cascivo/packages/react/dist/node/react/src/index.js"
                                        ^^^^ the CSS-free twin, in Astro's SSR build
```

**The twin really is CSS-free:**

```
packages/react/dist/card/card.module.js        ->  import './card.css';
packages/react/dist/node/card/card.module.js   ->  (stripped)
```

**Baseline reproduces:**

```
load/index.html      5 classes  ->  UNSTYLED  (5 with no rule, e.g. ._card_ipz9f_2)
visible/index.html   5 classes  ->  UNSTYLED  (5 with no rule, e.g. ._card_ipz9f_2)
```

**Isolating the variable.** Pinning *only* the resolution, changing nothing else:

| Astro config | `load` / `visible` |
| --- | --- |
| vanilla | **UNSTYLED** |
| `vite.ssr.resolve.conditions` without `node` | **UNSTYLED** — does not reach Astro's prerender env |
| `vite.ssr.noExternal: [/^@cascivo\//]` | **UNSTYLED** — the Vite-SSR guide's advice does **not** help Astro |
| `resolve.alias` → `dist/index.js` | **styled** |

Only *which build the exports map selects* matters. Note the third row: the workaround
cascivo's own SSR docs recommend is ineffective here, so an adopter following them would
conclude cascivo is broken.

### 2.4 The fix: one line, zero adopter config

Insert `module` **before** `node`:

```jsonc
{
  "types":        "./dist/index.d.ts",
  "react-server": "./dist/index.js",
  "module":       "./dist/index.js",       // <-- add: Vite-based SSR matches this
  "node":         "./dist/node/index.js",  //     bare Node does not, so it still lands here
  "import":       "./dist/index.js",
  "default":      "./dist/index.js"
}
```

`module` is a bundler-only convention. Vite's SSR resolve matches it; **Node's ESM resolver
does not implement it at all**, so the bare-Node guarantee the twin exists for is untouched.

Verified, both properties simultaneously:

```
# vanilla astro.config.mjs — no adopter config whatsoever
load/index.html      5 classes  ->  styled
visible/index.html   5 classes  ->  styled

# the node twin still protects bare Node
import.meta.resolve('@cascivo/react')
  -> file:///…/packages/react/dist/node/index.js        (still the CSS-free twin)
import('@cascivo/react')                    -> OK, 221 exports
import('…/packages/react/dist/index.js')    -> ERR_UNKNOWN_FILE_EXTENSION  (twin is necessary)

pnpm css-contract:check                     -> 4/4 pass
```

`@cascivo/charts` carries the identical `types,node,import,default` shape and therefore the
identical latent bug; the fix must cover both. `layouts`, `themes`, `icons` and `core` do
not declare a `node` condition and are unaffected.

**Gates, since run:** `isolated:check` (4/4) and `pack:check` (20/20 packages clean under
publint + attw) both pass with the change, as do `css-contract:check` (5/5) and
`meta:check` (393/393).

**Three more packages were affected than this research found by hand.** The guard added to
`scripts/checks/css-contract.test.ts` immediately flagged `@cascivo/ai`, `@cascivo/editor`
and `@cascivo/flow` — all shipping a `node` twin with no `module` condition. The manual
sweep above checked only `charts`, `layouts`, `icons`, `themes` and `core` and missed them,
which is the argument for the guard rather than a one-off edit.

---

## 3. Ghost: no template is possible

Ghost themes are Handlebars (`.hbs`) compiled by Ghost's own Express server, which
[sends publication content as static HTML](https://docs.ghost.org/themes/). There is no
React renderer, no server-side JS execution inside a theme, and no bundler in the default
theme workflow.

A cascivo template ships `.tsx` pages composed from React components. There is nothing in a
Ghost theme that can mount one. The gap is not effort — it is that the two products do not
share a runtime.

What *does* transfer is the part that was never React: `@cascivo/tokens` and
`@cascivo/themes` are framework-agnostic CSS, already graded "tokens/themes only" in the
compatibility matrix for Vue/Svelte/Angular. A Ghost theme can `@import` them and get the
type scale, color system, `@layer` order and dark mode. That is worth **a short guide**
(`USING-WITH-GHOST.md`, alongside the existing per-framework guides), not a template, not a
registry `framework` value, and not CI.

If Ghost matters commercially, the honest larger option is a headless one — Ghost's Content
API feeding a React front end, which is just the existing `react-vite`/`react-next` story
with a data source. That is a **cookbook** (`docs/cookbooks/`), and it needs no new
machinery at all.

---

## 4. Recommendation

**Do, in order:**

1. ~~**Fix the export-condition ordering.**~~ **Done** — one line each in `@cascivo/react`,
   `@cascivo/charts`, `@cascivo/ai`, `@cascivo/editor` and `@cascivo/flow`, plus a guard in
   `css-contract.test.ts` so it cannot regress. Worth doing on its own merits: it silently
   affected every Vite-based SSR framework that resolves `node` before `import`, not just
   Astro.
2. ~~**Re-grade Astro** ⚠️ Partial → ✅.~~ **Done** — `COMPATIBILITY.md` re-graded with a
   footnote on the mechanism, `USING-WITH-ASTRO.md` rewritten (the aggregate-stylesheet
   workaround is now an "older versions" note), and the `astro-islands` fixture converted
   from an evidence probe that exited 0 on failure into a regression test that exits 1.
3. **Then** consider Astro scaffolding — and prefer `cascivo create --framework astro` over a
   registry template. What an Astro adopter is missing is a *correct project skeleton*
   (integration wiring, where the theme CSS import goes, which client directive to reach
   for). That is the `create` command's job. Templates are page compositions; they answer
   "what does this app look like", not "how do I wire cascivo into Astro".
4. **Ghost: write `USING-WITH-GHOST.md`** (tokens + themes in a Handlebars theme). Optionally
   a headless-Ghost cookbook. No template, no framework enum entry.

**Do not:** add `'astro'` to `TemplateMeta['framework']` before step 1. Every template
carrying that value would render unstyled under the two directives adopters reach for first.

### Cost

| Step | Size |
| --- | --- |
| 1. Export-condition fix + gates | Small — 2 lines, plus `isolated:check`/`pack:check` |
| 2. Astro doc re-grade | Small — mostly deletion |
| 3. `create --framework astro` | Medium — a second scaffold shape; `create.ts` is currently single-shape |
| 4. Ghost guide | Small |

### Also spotted, unrelated

`apps/site/public/registry.json` regenerates with a different `data-table.tsx` hash than the
committed one, on a clean tree at `58c165ee`. Committed value is stale; the drift check would
catch it on the next `pnpm regen`. Not touched here.

---

## Appendix: reproducing

```sh
pnpm install && pnpm build
pnpm --filter @cascivo/example-astro-islands run build   # prints the per-directive verdict
```

To confirm the fix, add `"module": "./dist/index.js"` above `"node"` in
`packages/react/package.json`, rebuild `@cascivo/react`, and re-run — with a vanilla
`astro.config.mjs`.
