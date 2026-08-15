# SSR CSS weight + client-JS cost — investigation and fix plan

**Date:** 2026-08-14
**Trigger:** "In an SSR setup the CSS bundle is huge, and there is a client.js that is
potentially unused."

Both complaints are real. The CSS one has a single root cause that was hiding behind a
documented "unavoidable tradeoff"; the client-JS one is smaller than it looks but exposes a
metadata gap that is a genuine 1.0 blocker. Every number below is measured in this repo, not
estimated.

---

## Part 1 — The SSR CSS bundle

### What we measured (before)

| App | CSS shipped | Components on the page |
| --- | --- | --- |
| `apps/examples/react-vite-ssr` (Vite SSR) | **357 KB** | Menubar, Card, Button |
| `apps/examples/react-next` (Next 16 App Router) | **384 KB** | Heading, Text, Card, Badge, Toggle |

Both pages are a single card. Both were shipping essentially the entire design system.

### Root cause

`@cascivo/react` publishes two copies of the module graph:

- `dist/` — per-component chunks, each with a `.css` side-effect import edge.
- `dist/node/` — the same chunks with **every `.css` import stripped**, selected by the
  `node` export condition so a bare Node/workerd ESM loader can `import` the package without
  `ERR_UNKNOWN_FILE_EXTENSION`.

React Server Components resolve with the `react-server` condition **and** `node`. Since the
exports map offered no `react-server` entry, every RSC bundler fell through to `node` and got
the **CSS-free** build. The consequence is precise and, once seen, obvious:

> A component that ships `'use client'` becomes a client reference, gets re-resolved by the
> **client** bundler under browser conditions, and keeps its CSS.
> A component that does **not** ship `'use client'` — i.e. exactly the `clientJs: 'none'`
> components, cascivo's whole RSC advantage — renders on the server from the CSS-free twin
> and **its stylesheet is never collected at all.**

Verified: with the aggregate stylesheet removed, the Next example's prerendered HTML
referenced 11 hashed CSS-module class names and **6 of them had no rule anywhere in the
emitted CSS** — `_card_`, `_header_`, `_content_`, `_title_`, `_badge_`, `_heading_`. All six
belong to server-rendered components. The client component (`Toggle`) was fine.

This is a **correctness** bug, not only a size bug. It was invisible because the docs
instructed everyone to import the 328 KB aggregate `@cascivo/react/styles.css`, which papers
over it — and then the docs described the resulting weight as an unavoidable law of physics:

> *"This is a real, currently-unavoidable tradeoff, not an oversight."*
> *"What we are not going to pretend: there is no flag that makes the aggregate shakeable."*
> — `docs/USING-WITH-VITE-SSR.md`, before this change

There was a flag. It was a missing export condition.

### The fix

1. **Add a `react-server` condition to `@cascivo/react`**, ahead of `node`, pointing at the
   CSS-bearing build. RSC always runs through a bundler (client references are impossible
   without one), so the `.css` edges are processed, exactly as they are for client
   components. Bare-Node and workerd SSR still hit `node` and still get the CSS-free twin.

   `@cascivo/charts`, `@cascivo/editor` and `@cascivo/flow` are deliberately **not** changed:
   their entire bundle is `'use client'`, so every export is already a client reference and
   already keeps its CSS.

2. **Stop importing the aggregate in the SSR examples and docs.** With the per-component CSS
   edges intact on both graphs, `@cascivo/themes/light-dark.css` (tokens + reset + base +
   light + dark) is all an SSR app needs; component CSS rides the module graph and
   tree-shakes. The aggregate remains correct and supported for no-bundler/CDN setups.

3. **Guard it.** Two additions, because both halves failed silently:
   - `scripts/checks/css-contract.test.ts` gains invariant 3 — a package that ships a
     CSS-free `node/` twin *and* ships modules that render on the RSC server must offer a
     `react-server` condition, ahead of `node`, resolving to the CSS-bearing build. It sits
     with the two existing invariants because each one alone just trades one bug for another.
     Removing the condition makes it fail with `@cascivo/react: ships 49 server-renderable
     module(s) but has no "react-server" export condition` — 49 components were affected.
   - `apps/examples/react-next/test/rsc-css.mjs` and the Vite SSR smoke test — every hashed
     CSS-module class in the server-rendered HTML must have a matching rule in the emitted
     CSS, and the page's total CSS must stay under budget. This is the test that would have
     caught the bug.

4. **CSS budgets in `pnpm audit:bundle`.** It measured JS only, so a 328 KB stylesheet had no
   ceiling anywhere in CI.

### What we measured (after)

| App | CSS before | CSS after | Δ |
| --- | --- | --- | --- |
| Vite SSR example | 357 KB | **29 KB** | −92% |
| Next App Router example | 384 KB | **34 KB** | −91% |

Zero missing classes in the Next example's prerendered HTML. The Vite SSR smoke test still
server-renders and asserts the same style-completeness property.

---

## Part 2 — The client JS

### What we measured

For the Next App Router example, cascivo's share of the client bundle is **8.6 KB** — the
`Toggle` island plus the signals runtime. The remaining ~627 KB is Next's own React/RSC
runtime. The RSC path is healthy, and the `react-server` fix above is what finally makes
`clientJs: 'none'` components *fully* free there: correct CSS **and** zero client JS.

### The real waste, and how big it is

Six components ship a `'use client'` directive whose **only** client-only call is
`useSignals()`, and the only reason for that call is that their default label goes through
`t(builtin.…)`, which reads the i18n `catalogVersion` signal so labels re-render on a runtime
locale change:

`Spinner`, `Breadcrumb`, `Header`, `SkipNav`, `QrCode`, `Switcher` (`SkipNav` already
declared it; the other five now do)

Their markup is fully server-rendered; the client boundary buys only live re-labelling. For
an app that never switches locale at runtime — the overwhelming majority — that is a client
boundary for nothing. This is a deliberate design consequence of provider-free runtime i18n,
not a defect, and changing `t()`'s tracking semantics would silently break locale switching
for anyone who does use it. **So we declare the cost rather than change the behaviour**:
these six get `clientJs: 'enhancement'` with the reason recorded.

### The actual 1.0 blocker this uncovered — now closed

`ComponentMeta.clientJs` is the field an agent or adopter reads to decide whether a component
can render from a Server Component without hydrating. **96 of 209 manifests (46%) did not
declare it** — including `data-table`, `calendar`, `carousel`, `form`, `toast` and every
chart. `client-js-parity.test.ts` never noticed, because it only validates manifests that
*do* declare the field: a missing value looked exactly like a value under no rule.

All 209 now declare it. **74 `none` · 73 `enhancement` · 62 `required`** (Part 5 corrects
`Stream` from `required` after the harness rendered it).

The labels are grounded in what the components actually emit, not in what their names
suggest. Two probes did the work:

- **Charts** — server-rendered the family through `renderToString`. Every chart emits the
  SVG *and* the accessible `<table>` fallback carrying the real data points, so a chart
  reads with JS off → `enhancement`. (`stream` was first labelled `required` on the theory
  that a frozen frame is not a live feed; the harness in Part 5 rendered it and disproved
  that — see below.)
- **Components and blocks** — compiled each manifest's own first example into an SSR
  harness and rendered it, recording bytes, visible text, and how many native inputs,
  anchors and JS-only buttons reached the HTML. That is what separated `TimePicker` (a
  native `<input type="time">` → `enhancement`) from `RatingGroup` (buttons with
  `role="radio"` → `required`), and `Toc` (real anchors → `enhancement`) from `Pagination`
  (buttons plus a select, none of which navigate → `required`).

Every declaration carries a one-line reason in its manifest citing what the server HTML
contains, so a maintainer can audit or overrule any call in seconds rather than re-deriving
it.

**The definition was the hard part, and the two halves of the guard disagreed.**
`client-js-parity.test.ts` described the split as *"whether content is merely hidden or
genuinely unreachable"* (content-based) while also saying `clientJs` records what a component
needs *"to be correct"* (function-based). Those readings disagree on ~30 components:
`Calendar` server-renders a complete 32-button month grid and cannot pick a date; `DataTable`
renders every row and cannot sort or page; `Tabs` renders one panel and cannot reach the
others. Content-based calls all three `enhancement`.

Settled function-based, and the guard's docstring now says so: `'required'` whenever the
component's primary job needs JS, even when the markup is all there. Content-based is the
optimistic reading, and an adopter trusting it would ship a dead Calendar.

`scripts/checks/client-js-coverage.test.ts` holds the line — a manifest without `clientJs`
fails.

---

## Part 3 — What the CSS fix uncovered: `clientJs: 'none'` crashed RSC

Fixing the export condition made the `clientJs: 'none'` path worth using, so we tried it, and
it did not work at all. Rendering `<Label>` — a `clientJs: 'none'` component — from a Server
Component fails the Next 16 build outright:

```
Error: Failed to collect page data for /
  [cause]: Attempted to call signal() from the server but signal is on the client.
```

`@cascivo/core`'s single-chunk build carries a `'use client'` banner (its 23
directive-carrying modules collapse into one file, so the banner is load-bearing).
`@cascivo/core/pure` exists as the server-safe subset for exactly this reason, and
`pure.ts`'s own docstring describes this failure verbatim. Three shipped components still
walked into it — and every existing check missed them because the offending hop is
**transitive**, so a per-file lint never sees it:

| Component | Path to the client boundary | Error |
| --- | --- | --- |
| `Label`, `AvatarGroup`, `InlineLoading` | → `@cascivo/i18n` → `@cascivo/core` `{ signal }` | `Attempted to call signal() from the server` |
| `LargeTitleHeader` | → `@cascivo/core` `{ cn }` | `Attempted to call cn() from the server` |
| `Swap` | calls `useControllableSignal()` / `useSignals()` with **no** `'use client'` at all | React hooks executed on the server |

All three declare `clientJs: 'none'` (`Swap` declared nothing), i.e. the manifest promised
the one thing that was guaranteed to break.

**Fixes**

- `@cascivo/i18n` takes `signal` from `@preact/signals-react` — its actual origin, already a
  declared peer — instead of routing through `@cascivo/core`'s client-marked barrel. Same
  module instance, no boundary. (`@cascivo/core` stays a declared dependency: it is what
  keeps i18n inside the changesets `fixed` group, which `version-lockstep.test.ts` requires
  so a consumer can never resolve two copies of the signal registry.)
- `LargeTitleHeader` imports `cn` from `@cascivo/core/pure`.
- `Swap` gains the `'use client'` directive it always needed, and declares
  `clientJs: 'required'`.

**Guard** — `scripts/checks/rsc-boundary.test.ts` walks the *published* module graph from
every server-renderable chunk and fails on any edge that pulls a non-component binding out of
a `'use client'` module. It distinguishes the legal case (a Server Component may *render* a
client component — `Button` → `Spinner`, `User` → `Avatar`, `Field` → `Label` are all fine)
from the illegal one (calling a client function, or reading a property off a client
reference). Runs in CI after the build, since it reads `dist/`.

`apps/examples/react-next` now renders `Label` from its Server Component page, so the real
framework proves the fix alongside the static guard.

---

## Part 4 — Verification

```sh
pnpm meta:check       # + client-js-coverage ratchet
pnpm css-contract:check   # + invariant 3: the react-server condition
pnpm rsc:check            # new: server-renderable components stay server-safe
pnpm audit:bundle         # + CSS budgets for every package exporting a stylesheet
pnpm exec vp run @cascivo/example-react-vite-ssr#test   # style completeness + CSS budget
pnpm exec vp run @cascivo/example-react-next#test       # style completeness + CSS budget
```

`rsc:check` and `css-contract:check` read `dist/`, so they run after the build — both in
`pnpm ready` and as their own CI steps.

---

## Part 5 — The follow-through (all six items, resolved)

Part 5 was a list of open decisions. All six were taken; this is what each turned into.

### 1. The 72 `enhancement` claims are now tested — and one of them was wrong

`packages/react/src/enhancement-renders.test.tsx` renders every `clientJs: 'enhancement'`
component with `renderToString` — no hydration, no browser — and asserts the server HTML
carries something a person can perceive or use. Coverage is asserted **both ways**: every
such manifest must have a fixture, and every fixture must still match a live manifest, so
neither adding a component nor re-labelling one can silently shrink what the file proves.

Two assertions, because "renders something" is not the claim:

- **Perceivable** — visible text, a replaced element (`img`/`svg`/form control/link/table),
  or an accessible name. That third clause exists because `Spinner` server-renders exactly
  `<span role="status" aria-label="Loading">`: no text, no element, and entirely correct
  with JS off, since the spinner is a CSS animation. A stricter rule demanded
  `clientJs: 'required'` on a component that needs no JavaScript at all.
- **Content reachable** — for components where content could plausibly be gated behind an
  open signal, the content the fixture passed in must survive to the server HTML. This is
  the assertion that matches what `clientJs` actually means. `Collapsible` and `Accordion`
  pass because they are built on native `<details>`; rebuild either on a signal and this
  test fails.

**It immediately earned its keep: `Stream` was mislabelled `required` — by me.** The
reasoning had been "a live feed frozen at one frame is not the component". Rendered, it
emits the SVG *and* the full accessible table — `Mon 10 1 Tue 20 2 Wed 15 1`. The "live"
part is the app pushing data through `createStreamBuffer`; that is the app's JavaScript,
not the component's. Corrected to `enhancement`, which also makes the chart family
uniform. Coverage is now 73 `enhancement` / 62 `required` / 74 `none`.

Verified non-vacuous by mutation: flipping `Toast` to `enhancement` fails the coverage
assertion, and both of the harness's own early failures (`Spinner`, `CodeSnippet`) were
real signals rather than noise.

### 2. The other two contested labels stand — now on evidence, not judgement

- **`FileUploader`** (`required`) — its `<input type="file">` is `aria-hidden="true"` with
  `tabIndex={-1}` and no `name`. The visible affordance is a `<button type="button">` that
  clicks the input from JS. With JS off the input is unreachable *and* unsubmittable.
- **`TagsInput`** (`required`) — the input carries no `name`, its value lives in a signal,
  and Enter is handled in `onKeyDown`. Chips render; nothing can be added, removed or
  submitted.

### 3. PR opened

### 4. `version-lockstep` now keys on the signal registry, and the phantom dependency is gone

The guard demanded `@cascivo/core` as a dependency, which is why `@cascivo/i18n` kept one it
no longer imported. But lockstep exists to stop two copies of the **signal registry**
resolving, and i18n now depends on `@preact/signals-react` — which *is* the registry;
`@cascivo/core` only re-exports it. The family is now "depends on `@cascivo/core` **or**
peers `@preact/signals-react`", and `@cascivo/i18n` declares no unused dependency.

### 5. The i18n boundary rule is documented

`docs/HEADLESS.md` gains two things next to the `@cascivo/core/pure` section: that the client
boundary is **transitive** (the `Label` → `@cascivo/i18n` → `@cascivo/core` chain that
crashed RSC, with `rsc-boundary.test.ts` as the guard), and the rule itself —

> Any component that resolves a user-visible default string through `t()` is a client
> component, even when its markup is otherwise entirely static.

with the six components that pay it and why the alternative (untracked defaults) is worse.

### 6. Astro — closed, not deferred

Tested rather than assumed: adding `vite: { ssr: { noExternal: [/^@cascivo\//] } }` to the
Astro example changes nothing — `load` and `visible` islands still emit `._card_…` with no
matching rule. It is **not** the export-condition bug; it is Astro's island CSS collection.
The ⚠️ Partial grade and the `client:only` / aggregate workarounds stand, and
`apps/examples/astro-islands` reports the reproduction on every build, so it will announce
itself if Astro fixes it upstream.
