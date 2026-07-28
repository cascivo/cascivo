# Experience report — local-first incident console on Astro → Vite

**Date:** 2026-07-28
**Stack:** pnpm 11.5.3, Vite 7.3.6, TypeScript 6.0.3, React 19.2.8, Node 22.22.2, Turborepo; started on Astro 6.4.8, migrated to a plain Vite SPA mid-build
**cascivo:** `@cascivo/react` 0.13.0, `@cascivo/core` 0.7.0, `@cascivo/themes` 0.4.8, `@cascivo/tokens` 0.5.5, `@cascivo/icons` 0.3.5, `@cascivo/charts` 0.7.0
**Triaged in:** [`fix-plan-incident-console-adopter-2026-07-28.md`](fix-plan-incident-console-adopter-2026-07-28.md)

---

Findings from building a local-first incident console on `@cascivo/react@0.13.0` in a
fresh pnpm + Turborepo monorepo. Written to be handed to the cascivo UI team.

The app started on Astro and moved to a plain Vite SPA partway through, so findings are
marked where they are Astro-specific — C2 and C3 no longer affect this repo but will
affect anyone following the compatibility matrix.

Environment: pnpm 11.5.3 · Vite 7.3.6 · TypeScript 6.0.3 · React 19.2.8 · Node 22.22.2 ·
`@cascivo/react` 0.13.0 · `@cascivo/core` 0.7.0 · `@cascivo/themes` 0.4.8 ·
`@cascivo/tokens` 0.5.5 · `@cascivo/icons` 0.3.5 · `@cascivo/charts` 0.7.0.
Astro-specific findings were reproduced on Astro 6.4.8.

Every item below was reproduced in this repo, and every workaround is committed here.

---

## At a glance

| # | Finding | Severity | Fix shape |
|---|---|---|---|
| C1 | `@types/react` undeclared — every component's props lose `children`/`className`/`onClick` | blocker | one line in `package.json` |
| C13 | Closed overlay panels stay laid out and swallow clicks beneath them | blocker | one CSS rule |
| C12 | No reset shipped — `width:100%` + padding components overflow, page gets scrollbars | high | fill the `cascivo.reset` layer |
| C10 | No component declares `ref`, though React 19 forwards it at runtime | medium | types only |
| C2 | Per-component CSS dropped for SSR'd Astro islands | blocker (Astro) | build or docs |
| C4 | `all.css` holds 2 of 12 themes | high | rename or complete |
| C5 | `setTheme()` silently no-ops with no `ThemeProvider` | high | dev warning |
| C3 | Preact guide is CSR-only; breaks under Astro | blocker (Astro+Preact) | docs |
| C9 | `Dropdown` throws an uncaught ref error under `preact/compat` | medium | ref audit |
| C14 | `AppShell`'s nav wrapper shrinks under wide content, so pages differ in width | medium | one CSS line |
| C11 | `@cascivo/charts` never imports its own stylesheet | low | self-import or docs |
| C15 | `Modal` body has no gap while `Drawer`'s does; dialog content butts together | low | one CSS line |
| C6 | Published version matrix is ~6 minor versions stale | medium | docs |
| C7 | `useSignals()` requirement missing from getting-started | medium | docs |
| C8 | Packaging and API-naming observations | low | assorted |
| C16 | `LineChart` has no x-axis formatter; a numeric/time x renders raw or uncontrollable | medium | expose `Axis`'s existing `format` |
| C17 | `BarChart` axis props: `yTicks` yields fractions on small domains, and `xTicks`/`yTicks` swap with `orientation` while `xLabelEvery` doesn't | medium | tick-generation fix + docs |
| C18 | No way to colour individual bars in a single-series categorical `BarChart`; the `mode="grouped"` workaround renders overlapping bars and drops labels | medium | per-datum `color` accessor |
| C19 | `PopoverTrigger`'s `asChild` has no effect — it always wraps children in its own `<button>`, nesting interactive elements | medium | implement the Slot pattern, or drop the prop |

---

## C1 — `@types/react` is not a declared dependency, so all React-derived props vanish

**Severity: blocker.** This is the most damaging finding.

`dist/index.d.ts` imports React's prop types:

```ts
import { HTMLAttributes, ButtonHTMLAttributes, ReactNode, /* … */ } from 'react'
```

…and nearly every public interface extends them:

```ts
interface CardProps extends HTMLAttributes<HTMLDivElement> { variant?: … }
```

But `package.json` declares `@types/react` **only under `devDependencies`**. It is
neither a `dependency` nor a `peerDependency`. Under pnpm's isolated layout the only
packages visible from `@cascivo/react` are `@cascivo/*`, `@preact/*`, `react`, and
`react-dom` — no `@types/react`.

So the import fails to resolve, `extends HTMLAttributes<…>` collapses to an error type,
and `skipLibCheck: true` (which cascivo's own docs and every Astro preset enable) hides
the cause. The interfaces keep only their *own* declared members.

The result is that `children`, `className`, `style`, `onClick`, and all `aria-*` props
silently disappear from every component:

```
error ts(2322): Type '{ children: string; variant: "success"; }' is not assignable to
  type 'IntrinsicAttributes & BadgeProps'.
  Property 'children' does not exist on type 'IntrinsicAttributes & BadgeProps'.

error ts(2559): Type '{ children: Element[]; }' has no properties in common with
  type 'IntrinsicAttributes & CardProps'.
```

18 errors from a ~90-line file that uses ten components. In practice `strict`
TypeScript + pnpm — cascivo's own documented setup — cannot type-check at all.

**Fix (cascivo side):** move `@types/react` (and `@types/react-dom` where relevant) to
`peerDependencies` with `peerDependenciesMeta.optional = true`, or to `dependencies`.
This applies to `@cascivo/core`, `@cascivo/icons`, and `@cascivo/charts` too — they have
the same shape.

**Workaround here:** `publicHoistPattern` in `pnpm-workspace.yaml`, which puts the types
back on the package's resolution path. Consumers should not have to know this.

---

## C2 — Per-component CSS is dropped for SSR'd islands, but not for `client:only`

**Severity: blocker** on the default path.

`dist/button/button.module.js` carries the styling as a side-effect import:

```js
import './button.css'
var e = { button: "_button_131qn_2" }
```

Whether that CSS reaches the page depends entirely on the Astro client directive,
which is not something any consumer would think to vary:

| Directive | Component CSS emitted | Result |
|---|---|---|
| `client:load` / `client:visible` (SSR'd island) | **none** | renders unstyled |
| `client:only` | 58 KB, only what is used | renders correctly |

Under `client:load` the hashed class names survive but the CSS files are never
emitted — rendered markup carries `class="_button_131qn_2"` with no matching rule
anywhere in the output. `sideEffects: ["**/*.css"]` is set correctly and does not
help. Nothing warns. It reads as a theming problem, which sends you down the wrong
path entirely.

Reproduced both ways in this repo: same components, same imports, only the
directive changed.

```
client:load  → index.css 176K (themes only), grep '_button_' → no match
client:only  → Console.css 58K + index.css 176K, styling correct
```

**Workaround if you need an SSR'd island:** import the aggregate
`@cascivo/react/styles.css`. It works, but ships **308 KB of CSS for all 481
components** when the page uses a dozen — measured here as 461 KB total versus
234 KB on the `client:only` path.

**On plain Vite this problem does not exist.** The same components in a Vite +
React SPA emit 57 KB of per-component CSS with no configuration and no aggregate
sheet. This demo has since migrated off Astro, which removed the issue entirely —
CSS went from 461 KB (48 KB gzip) to 238 KB (18 KB gzip).

So this is an Astro-specific defect, not a general bundler one. But the
compatibility matrix lists Astro as ✅ supported without qualification, and the
majority of Astro islands in the wild are `client:load`.

**Suggested fix:** make the CSS side-effect survive Astro's SSR island build, or
document the directive dependency explicitly — it is currently invisible.

---

## C3 — Preact support does not survive SSR/prerender, and is broken on the client too

**Severity: blocker for the documented Preact path.** Partly an upstream
`@astrojs/preact` bug, but the guide claims verified support without qualification.

`docs/using-with-preact.md` states two production migrations confirm "components render,
signals update, interactions fire, with zero runtime errors" at ~75 KB. That guide only
covers **client-rendered Vite + Preact**. It never mentions SSR or prerendering, and
neither does the Vite-SSR guide mention Preact.

Under Astro 6.4.8 with `@astrojs/preact({ compat: true })` the build dies:

```
TypeError: Cannot read properties of null (reading 'useRef')
  at exports.useRef (node_modules/.pnpm/react@19.2.8/…/react.production.js:523:33)
  at node_modules/.pnpm/@preact+signals-react@3.11.0/…/runtime.mjs
  at Object.renderToStaticMarkup (…)
```

Three separate causes stack up:

1. `@astrojs/preact` adds its React `noExternal` entries only when
   `options.resolve.noExternal` is unset — but Astro always pre-populates that key, so
   the compat branch is **dead code**. (Upstream bug; worth reporting to Astro.)
2. Cascivo's Vite-SSR guide tells you to set `vite.ssr.noExternal`. That key reaches only
   Vite's `ssr` environment; Astro prerenders static routes in a separate `prerender`
   environment, so the setting never applies there.
3. `@preact/signals-react` must also be inlined. Cascivo's docs list only `/^@cascivo\//`.
   Left external, Node resolves its bare `react` import to the real React, whose
   dispatcher is null under Preact's renderer.

Fixing all three still fails, because identity aliases `/^react$/ → react` are registered
*ahead* of the compat aliases `react → preact/compat` and win. Real React ends up in the
bundle — confirmed by `react.dev/errors` strings and a 135 KB island — and the same
`useRef` crash then reproduces **client-side** with `client:only="preact"`.

**Preact itself is fine — Astro was the problem.** Verified afterwards by building the
same components in a plain Vite + `@preact/preset-vite` SPA: signals update, styling is
correct, `DataTable`, `Timeline`, `SegmentedControl`, `CommandMenu`, `Modal`, `Drawer`,
`Popover`, `Tooltip` and `Toast` all behave identically to React, at **60 KB gzip versus
110 KB** — cascivo's ~75 KB claim is credible.

So the guide is accurate for the configuration it describes. It should say so
explicitly: **Preact support is verified on Vite CSR and does not survive Astro's
compat aliasing.** One sentence would have saved a day here.

(One real compat defect did surface on Vite — see C9.)

---

## C4 — `@cascivo/themes/all.css` contains only light and dark

**Severity: high.** Pure naming trap.

`getting-started.md` says "For light and dark support: `import '@cascivo/themes/all.css'`"
and then, a few lines later, lists twelve first-party themes. The file is exactly:

```css
@import '@cascivo/tokens/layers.css';
@import '@cascivo/tokens';
@import '@cascivo/tokens/properties.css';
@import './base.css';
@import './light.css';
@import './dark.css';
```

Set `data-theme="cyberpunk"` with only `all.css` loaded and every `--cascivo-color-*`
token is unresolved, so components render **greyscale** — verified here: the accent
background stayed `oklch(0.7 0 0)` until `cyberpunk.css` was imported explicitly, at which
point it became `oklch(0.7 0.25 330)`.

Credit where due: `ThemeProvider` *does* emit a precise dev warning for this exact case,
and it is one of the best error messages in the library. But a file named `all.css` that
contains two of twelve themes will keep costing people time. Rename it (`light-dark.css`)
or make it actually include all twelve.

---

## C5 — `setTheme()` silently no-ops unless a `ThemeProvider` is mounted

**Severity: high.**

`setTheme()` and `useTheme()` only write a persisted signal. Nothing touches the DOM:

```js
function _(e) { g().value = e }              // setTheme
function v() { return n(), [g().value, _] }  // useTheme
```

Only `ThemeProvider` writes the attribute, inside a `useSignalEffect`. Call `setTheme()`
without one and it returns cleanly, the signal updates, `useTheme()` reports the new
value — and `data-theme` never changes. There is no warning for a missing provider,
unlike the excellent one for missing theme CSS.

Either warn when `setTheme` runs with no mounted provider, or have `setTheme` write the
attribute directly. Regression test for this is in
`apps/web/src/components/integration.test.tsx`.

---

## C6 — The published compatibility matrix is badly out of date

**Severity: medium**, but it undermines trust in the rest of the docs.

`docs/compatibility.md` versus what npm actually serves today:

| Package | Docs say | Actual |
|---|---|---|
| `@cascivo/react` | 0.2.x | **0.13.0** |
| `@cascivo/core` | 0.1.x | **0.7.0** |
| `@cascivo/themes` | 0.2.x | **0.4.8** |
| `@cascivo/tokens` | 0.2.x | **0.5.5** |
| `@cascivo/icons` | 0.1.x | **0.3.5** |
| `@cascivo/charts` | 0.1.x | **0.7.0** |

The same page lists Astro as ✅ supported, which C2 shows is only half true.

---

## C7 — `useSignals()` is required in userland components

**Severity: medium.** Correctly documented in the `index.d.ts` header and in
`HEADLESS.md`, but absent from the getting-started path most people will follow.

Library components call `useSignals()` internally. Components *you* write are not
compiled by cascivo's build, so they need the call explicitly. Without it a component
reads `signal.value` once and then never updates again — no error, no warning. This is
the single most likely first-day bug for anyone building an app rather than a page.

Worth putting in getting-started, next to the first `useSignal` example.

---

## C8 — Minor packaging and API observations

- **Inconsistent module output.** `@cascivo/react` ships `.js` + `.d.ts`;
  `@cascivo/icons` ships `.mjs` + `.d.mts`. Harmless, but it breaks tooling that
  assumes one convention across a package family.
- **No per-icon subpaths.** All 445 icons come from one barrel. Tree-shaking does work
  (verified: 4 imported icons → 1 SVG path in the bundle), but subpath exports would
  help consumers without good tree-shaking.
- **`Flex` defaults to `direction="vertical"`**, unlike CSS `flex-direction` and unlike
  Chakra/MUI/Radix. **`Stack` is an overlap primitive, not a spacing stack.** Both are
  flagged clearly in the JSDoc, which caught us before runtime — but the names still
  invert two of the strongest conventions in the ecosystem.
- **Freshly published.** pnpm's `minimumReleaseAge` gate tripped on all six cascivo
  packages, so they now sit in `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`.

---

## C9 — `Dropdown` throws an uncaught ref error under `preact/compat`

**Severity: medium.** The only genuine Preact-vs-React behavioural difference we found,
and the reason this repo stayed on React.

Opening and closing a `Dropdown` under `preact/compat` on plain Vite throws:

```
Uncaught TypeError: u.current?.focus is not a function
```

Isolated per component — `CommandMenu`, `Modal`, `Drawer`, `Popover`, `Tooltip` and
`Toast` are all clean; only `Dropdown` throws. React with identical source throws
nothing.

Notably the *behaviour* still survives: focus does return to the trigger after close,
verified in both runtimes. So this is a console error rather than a functional break —
but it fires on every dropdown interaction, and any developer evaluating cascivo with
devtools open will see it and attribute it to the library.

The shape (`ref.current` holding something that is not a DOM node) is the classic
`preact/compat` ref difference: a ref pointing at a function component instance rather
than an element. Worth auditing every `ref.current?.focus()` call site — components
sharing the pattern (`Menu`, `MenuButton`, `OverflowMenu`) were not exhaustively tested.

Fixing this would let Preact consumers halve their JS with no downside, which is a
strong story for a design system that markets itself as CSS-native and lightweight.

---

## C10 — No component forwards a `ref`, so DOM access needs a cast

**Severity: medium.** Blocks any integration that needs the underlying element.

There is not one `forwardRef` in `@cascivo/react`'s 4,755-line `.d.ts`, and no component
declares a `ref` prop. Passing one is a type error:

```
error ts(2322): Property 'ref' does not exist on type 'IntrinsicAttributes & TextareaProps'.
```

At runtime it works fine — components spread unknown props onto the underlying element
and React 19 passes `ref` as an ordinary prop, so the ref does reach the DOM node.
Verified here (`apps/web/src/components/ref-forwarding.test.tsx`): the ref resolves to a
real `HTMLTextAreaElement` and `setSelectionRange` behaves.

So this is purely a typing gap — but it forces a cast at every call site, and consumers
have no way to know the runtime behaviour is safe. This repo needs it for the
collaborative postmortem editor, where caret restoration is impossible without the
element, and keeps the cast quarantined in `packages/ui/src/textarea-with-ref.ts`.

**Fix:** declare `ref?: Ref<HTMLTextAreaElement>` on the props types. Under React 19 no
`forwardRef` wrapper is needed — only the type. Since the behaviour is already correct,
this is a types-only change across the input components.

---

## C11 — `@cascivo/charts` does not import its own stylesheet

**Severity: low**, but it fails silently and contradicts the sibling package.

`@cascivo/react` auto-loads styling through per-component CSS side-effect imports, so
consumers import nothing. `@cascivo/charts` ships a single `dist/charts.css` that
`dist/index.js` never imports — grep confirms zero CSS references in the entry — even
though `sideEffects: ["**/*.css"]` is declared, implying the same mechanism.

Charts render unstyled with no warning until you find `@cascivo/charts/styles.css` in
the exports map. Two packages in one family with opposite CSS contracts is the kind of
thing people lose an afternoon to. Either self-import it, or say so in the charts docs.

---

## C12 — No reset ships, so components with `width: 100%` + padding overflow

**Severity: high.** Produces a horizontal scrollbar on a default install, and reads
entirely as an app bug.

`@cascivo/tokens/layers.css` declares the cascade and describes the first layer as:

```
cascivo.reset      consumer reset (box-sizing, margin/padding zeroing) — the floor
```

That layer ships **empty**. Nothing in `@cascivo/tokens`, `@cascivo/themes` or
`@cascivo/react` ever sets a global `box-sizing`, and only 6 of the 132 component
stylesheets set it on their own root (`spinner`, `side-nav`, `app-shell`, …).

Meanwhile `textarea.css` is:

```css
._textarea_xbrwe_7 {
  width: 100%;
  padding-inline: var(--cascivo-space-4);   /* 16px each side */
  padding-block: var(--cascivo-space-3);
  border: 1px solid var(--cascivo-color-border);
}
```

`width: 100%` plus 32px of padding plus 2px of border, with no `box-sizing`. Under the
browser default of `content-box` that computes 34px wider than its container. Measured
in this app: the textarea overhung the viewport by 25px and pushed a horizontal
scrollbar onto the page — which in turn made the document 16px taller than the viewport
and produced a *second*, vertical scrollbar next to `AppShell`'s own.

So a consumer who follows getting-started exactly, and writes no CSS at all, gets two
stray scrollbars. Every instinct says "my layout is broken"; the reset requirement is
documented only in a comment inside `layers.css`, which nobody reads.

**Workaround here** (`apps/web/src/app.css`) — fill the layer cascivo already reserved:

```css
@layer cascivo.reset {
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; }
}
```

Everything fits afterwards: nothing overhangs the viewport, the page-level scrollbars
are gone, and only `AppShell`'s `main` scrolls — which is correct.

**Suggested fix:** ship the reset in `@cascivo/tokens` inside the `cascivo.reset` layer.
It is already the lowest layer, so consumers can still override it, and being a layer it
cannot leak specificity into anyone's own styles. Failing that, put `box-sizing:
border-box` on every component root — six components already do it, which suggests the
intent was there. At minimum, getting-started should state that a reset is required.

---

## C13 — Closed overlay panels keep their box and silently eat clicks

**Severity: blocker.** A `MultiSelect` makes everything below it unclickable, with no
visual sign anything is wrong.

`multi-select.css` builds the dropdown on the Popover API:

```css
._panel_1r5fv_83 { …; opacity: 0; display: flex; transition: … display … allow-discrete; }
._panel_1r5fv_83:popover-open { opacity: 1; translate: 0 }
```

The closed state is expressed only as `opacity: 0`. The browser's UA rule
`[popover]:not(:popover-open) { display: none }` would hide it properly, but the
component's own `display: flex` is an *author* declaration, and author styles beat the
UA origin. So a closed panel keeps its box.

Measured on a bare page containing nothing but a `MultiSelect` and a `<Button>` beneath
it — no tabs, no wrappers:

```
popover attribute : "auto"        :popover-open : false   ← correctly closed
display           : flex          opacity       : 0       ← invisible, but laid out
position          : fixed         pointer-events: auto    ← still hit-testable
panel height      : 214px

document.elementFromPoint(<centre of button>)  →  input._search_…
clicking the button                            →  times out, never fires
```

An invisible, fixed-position, ~214px rectangle sits over whatever follows the control
and swallows every click. Because `opacity: 0` renders nothing, screenshots look
perfect and there is no console output — it presents as "my button randomly stopped
working".

This is not MultiSelect-specific in principle: any panel styled the same way behaves the
same, and the pattern is shared across the overlay family.

**Workaround here** (`apps/web/src/app.css`) — put the UA behaviour back:

```css
@layer cascivo.override {
  [popover]:not(:popover-open) { display: none; }
}
```

Verified this does not break the open-state animation: `display` is already listed in
the component's own `transition` with `allow-discrete`, which exists precisely so a
popover can animate out of `display: none`. `CommandMenu`, `Modal`, `Drawer`, `Popover`,
`Tooltip` and `Toast` all still behave after the override.

**Suggested fix:** drop `display: flex` from the base rule and set it under
`:popover-open` alongside `opacity: 1`, or add
`&:not(:popover-open) { display: none }` to the component sheet. Either keeps the
transition and restores click-through.

---

## C14 — `AppShell`'s nav wrapper shrinks, so wide pages resize the sidebar

**Severity: medium.** Makes page width inconsistent across a multi-view app.

`AppShell` lays out `_navWrapper_` and `<main>` as a flex row. `<main>` correctly gets
`min-width: 0`, but the nav wrapper is left at `flex: 0 1 auto` with the default
`min-width: auto` — so it is the *sidebar* that gives way when a page's content is
intrinsically wide, not the content that scrolls.

The `SideNav` inside keeps its own `inline-size: 16rem` and simply overflows its
shrunken wrapper, so nothing looks obviously broken; the page just sits wider than
every other page in the app.

Measured here at a 1700px viewport — one view against the other eight:

```
Insights         main w=1412 left=288    navWrapper 288
Service catalog  main w=1432 left=268    navWrapper 268   ← 20px stolen from the sidebar
                 SideNav still 288 wide, overflowing its wrapper
```

Setting `min-width: 0` on `<main>` does not help, because main is not the element
giving way. The fix has to pin the wrapper:

```css
@layer cascivo.override {
  div:has(> div > nav[aria-label='…']) { flex-shrink: 0; }
}
```

That selector is unpleasant precisely because the wrapper is not addressable — it has
only a hashed class, and the nav is nested one level deeper than you would guess
(`wrapper > inner > nav`).

**Suggested fix:** `flex-shrink: 0` on the nav wrapper inside `app-shell.css`. The
sidebar has a fixed width by design, so there is no case where shrinking it — while
its own child overflows — is the wanted behaviour. Exposing a stable hook (a
`data-cascivo-appshell-nav` attribute, say) would also let consumers reach these
internals without `:has()` gymnastics.

---

## C15 — `Modal` gives its body no spacing, while `Drawer` does

**Severity: low**, but it makes every dialog look broken by default and the two
components disagree with each other.

`modal.css`:

```css
._body_t1gwg_148 { padding: var(--cascivo-space-6); }   /* no display, no gap */
```

`drawer.css` for the equivalent region sets `gap: var(--cascivo-space-4)`.

So a `Drawer` stacks its children with rhythm and a `Modal` does not. Put three
`Field`s and a submit button in a `Modal` — the obvious content for a dialog — and
they render flush against one another with zero space:

```
div._body_t1gwg_148   (display: block, row-gap: normal)
  _field_ → _field_    gap 0px
  _field_ → _button_   gap 0px
```

`Field` is right to have no outer margin — it is `display: grid; gap: space-2`
internally and owns only its own label/control/description rhythm. The container is
what should space siblings, and here it doesn't.

Fixed on this side by wrapping the dialog content in a `Flex direction="vertical"
gap={5}`, which is fine but is boilerplate every consumer will rediscover, usually
after seeing a screenshot like the one that prompted this entry.

**Suggested fix:** make the modal body a flex column with a gap, matching `Drawer`.
While there, a `footer` slot would help — dialog actions want to sit in a
right-aligned row separated from the fields, and today every consumer hand-rolls
that too.

---

## C16 — `LineChart` has no x-axis formatter

**Severity: medium.** Any time series renders unreadable unless the consumer
already knows the workaround, and the workaround itself is incomplete.

`LineChartProps` has `xTicks`/`yTicks` (counts) and `secondAxis.format` — but that
formatter is documented as being for "the right y-axis" only. There is no equivalent
for the x axis. Feeding it a plain number (e.g. `Date.now()`-scale milliseconds, the
natural shape for a time series) renders the raw epoch integer as the label:

```
1,785,217,000,000
```

Passing a `Date` object instead switches the axis to a time scale and does produce a
real date (`7/28/2026`) — but the format is fixed and not configurable, and for
buckets narrower than a day (we bucket alerts in 5-minute windows) every tick
collapses to the same date, which is worse than the epoch number: at least the
epoch number was *distinguishable* between buckets.

`AxisProps` (the primitive `LineChart` composes internally) already has exactly the
missing piece:

```ts
interface AxisProps {
  format?: (value: number | string | Date) => string
  …
}
```

It simply is not threaded through to `LineChartProps`.

**Workaround here:** we stopped using `LineChart` for bucketed time series entirely
and switched to `BarChart`, whose `x` accessor returns a plain string — so the label
is fully under the consumer's control (`new Date(bucket).toLocaleTimeString(…)`).
This also happens to be more correct: bucketed counts are columns, not a continuous
line, so nothing was lost.

**Suggested fix:** add `format?: (value: Datum extends { x: infer X } ? X : never) => string`
(or simpler, thread the existing `Axis.format` through) to `LineChartProps`, mirroring
what `secondAxis` already offers on the right.

---

## C17 — `BarChart`'s axis props are two different swap conventions, undocumented

**Severity: medium.** Two independent traps in the same component, both invisible
until you compare a vertical and a horizontal chart side by side.

### 17a — `yTicks` produces fractional ticks on small integer domains

The natural way to bound tick density backfires exactly when the data is
smallest — which for a demo or an early-stage dashboard is often.

`yTicks` reads like "how many labels to show", but it behaves like a d3-style tick
*count hint*, and only converges to clean integers once the domain is a few units
wide. Reproduced in isolation (single-series bar chart, one bar at the max value,
one at zero):

```
domain max=1, yTicks=1  → [0, 1]                     clean
domain max=1, yTicks=2  → [0, 0.5, 1]                ← fractional
domain max=2, yTicks=2  → [0, 1, 2]                  clean
domain max=6, yTicks=6  → [0, 1, 2, 3, 4, 5, 6]      clean
domain max=7, yTicks=5  → [0, 2, 4, 6]               clean (library's own
domain max=20,yTicks=5  → [0, 5, 10, 15, 20]           "nice round number"
domain max=34,yTicks=6  → [0, 10, 20, 30]              step selection)
domain max=1, yTicks=5  → [0, 0.2, 0.4, 0.6, 0.8, 1] ← fractional
domain max=2, yTicks=5  → [0, 0.5, 1, 1.5, 2]        ← fractional
```

So requesting more ticks than the domain's own integer range can cleanly support
subdivides instead of clamping to the domain — the exact case an incident count
chart hits constantly (a handful of severities or services, each with 0–3 incidents).
A naive fix of `yTicks={maxValue + 1}` (one tick per possible value, inclusive) still
breaks: at `maxValue=1` that requests `yTicks={2}`, landing squarely on the
fractional case above.

**Workaround here** (`apps/web/src/views/Insights.tsx`, `integerTicks()`): request
`yTicks={maxValue}` (not `+1`) when the domain is small (empirically safe through at
least 6), and fall back to a small constant (5) above that, where the library's own
nice-step selection takes over and no longer subdivides:

```ts
function integerTicks(values: number[]): number {
  const max = Math.max(0, ...values)
  return max <= 6 ? Math.max(1, max) : 5
}
```

**Suggested fix:** clamp the generated tick set to the data's own integer step when
the domain is a whole-number range, or expose an `allowDecimals?: boolean` escape
hatch (the naming other charting libraries use for this exact knob).

### 17b — `xTicks`/`yTicks` swap meaning with `orientation`, but `xLabelEvery` does not

`xTicks` and `yTicks` follow **screen position**: under `orientation="horizontal"`
the value axis moves from screen-y to screen-x, so the prop that controls its tick
density moves from `yTicks` to `xTicks` too. Confirmed directly — `yTicks={1}` on a
horizontal chart with domain max 1 does nothing (renders `[0, 0.2, 0.4, 0.6, 0.8, 1]`,
the library's untouched default); `xTicks={1}` on the same chart renders `[0, 1]`.

`xLabelEvery` does not follow this convention — it always strides the **category**
axis (the `x` field of each datum), which under `orientation="horizontal"` is drawn
on screen-y. Reproduced with four categories on a horizontal chart, `height={220}`
(plenty of room for four rows):

```
no labelEvery prop at all      → only "alpha" and "delta" render (first/last)
xLabelEvery={1}                → all four render
```

So on a horizontal chart, getting a fully-labelled result requires `xTicks` *and*
`xLabelEvery` together — one prop chasing the screen axis, the other chasing the
data field — with nothing in the types to suggest either rule, and the default
behaviour (silently dropping middle category labels) looking like a
too-many-categories problem rather than an unset prop.

**Suggested fix:** name value-axis props by role (`valueAxisTicks`) rather than
screen position, so they do not need to swap at all; or, at minimum, document the
swap next to `orientation` and cross-reference it from both `xTicks` and `yTicks`.

---

## C18 — No per-bar colour in a single-series categorical `BarChart`

**Severity: medium.** `BarChartSeries.color` is documented as one colour for the
whole series — there is no per-datum override. That's fine for multi-series charts,
but breaks down for the common case of one series whose categories each carry their
own meaning (here: incident counts by severity, where SEV1 should read as danger and
SEV4 as neutral regardless of which bar is tallest).

The obvious workaround — give each category its own single-point series and render
with `mode="grouped"` — does not degrade gracefully, it renders wrong:

```tsx
series={['SEV1', 'SEV2', 'SEV3', 'SEV4'].map((s) => ({
  id: s, label: s, data: [{ x: s, y: COUNTS[s] }], color: COLORS[s],
}))}
```

Reproduced in isolation (4 series, one point each, `mode="grouped"`): the resulting
bars overlap (SEV1's bar spans `[64, 144]`, SEV2's spans `[80, 160]` — a ~64px
overlap out of an 80px bar width) and only the *first* series' category label
renders on the x-axis; the other three are silently dropped. Padding every series
out to the full category domain (four points each, zero everywhere but its own
category) fixes the overlap and the labels, but divides each category's band by the
series count, so real bars render at a quarter of their intended width.

Colouring via CSS was the next idea — `LogViewer`'s height fix (C-adjacent, see
`.alert-log-fill [role='log']` in `app.css`) works because it targets a stable
`role="log"` attribute. Bars have no equivalent hook: each is wrapped in its own
bare `<g>` with no `data-x`/`data-category`, so `rect:nth-of-type(n)` only ever
matches "the first (only) rect in this g" — every bar matches `:nth-of-type(1)`
simultaneously, none matches `:nth-of-type(2+)`. The one selector that does
distinguish bars is position among the *sibling `<g>` wrappers* one level up
(gridlines first, then one `<g>` per bar, then the axis) — which is an
implementation detail, not a contract, and breaks the moment `annotations` add
another sibling element.

**Workaround used here** (`apps/web/src/views/Insights.tsx`): reshape the
"Incidents by severity" panel from four categories on one series into a single
stacked bar — one category ("Incidents"), four `StackedSegment`s, each with its own
documented `color`. `toStackedSeries` handles the pivot. This is the one shape
where per-category colour is a first-class, stable prop rather than a DOM hack —
at the cost of the chart becoming one column instead of four.

**Suggested fix:** accept a per-datum `color` accessor on `BarChartSeries`
(`color?: string | ((d: Datum) => string)`), or at minimum stamp each bar `<rect>`
with `data-x` so CSS overrides have a real hook to target.

---

## C19 — `PopoverTrigger`'s `asChild` prop has no effect

**Severity: medium.** The prop exists, is typed, and is accepted at runtime — it
just doesn't do anything. `asChild` is the standard name (Radix, and everything
downstream of it) for "merge my props onto this child instead of rendering your
own wrapper element" — the Slot pattern. Building a themed swatch picker was the
first time this repo composed `PopoverTrigger` with an existing interactive
component (`IconButton`) rather than plain text, which is what surfaced it.

Reproduced directly — `<PopoverTrigger asChild><IconButton .../></PopoverTrigger>`
renders (confirmed via `outerHTML`, not just visually):

```html
<button aria-expanded="false" aria-haspopup="dialog" class="_trigger_…">
  <button aria-label="Theme: light" class="_iconButton_…">…</button>
</button>
```

A `<button>` nested inside another `<button>` is invalid HTML — interactive
content cannot nest — and it is a genuine accessibility defect here, not just a
lint nitpick: the inner button's `aria-label` is exactly the accessible name a
screen reader needs ("Theme: light"), and it is orphaned on an element the
accessibility tree does not expect to find inside another button. Removing
`asChild` produces byte-identical output — confirmed by diffing the rendered
`outerHTML` with and without the prop.

**Workaround here** (`packages/ui/src/theme-swatch-picker.tsx`): don't pass a
button-rendering component as `PopoverTrigger`'s children at all. Pass plain
inline content (icon + a small coloured dot + visible text) instead, so the
trigger's accessible name comes from real text content rather than a prop that
needed the (missing) Slot behaviour to reach the DOM.

**Suggested fix:** implement `asChild` as an actual Slot (clone the child
element and merge the trigger's props/ref/event handlers onto it, per the
pattern this prop name promises), or remove the prop until it does.

---

## What is genuinely good

Worth saying, because the list above is one-sided:

- **The typings are outstanding** where they resolve. Inline JSDoc documents defaults,
  cross-references the manifest, and pre-empts footguns (`Flex` direction, `Stack`
  semantics, `Button asChild` behaviour). It caught several mistakes at author time.
- **Tree-shaking works.** Ten imported components produced exactly ten class maps.
- **The missing-theme dev warning** names the problem, the fix, the import to add, and
  both an online and an offline docs link. More libraries should do this.
- **Breadth is real.** 481 exports, 445 icons, 12 themes, and console-shaped primitives
  (`ShellHeader`, `SideNav`, `AppShell`, `CommandMenu`, `DataTable`) that map directly
  onto what this demo needs.

---

## Fix priority

Roughly in order of how much pain each removes per unit of effort. The first three are
small, mechanical changes that unblock a default install.

1. **C1** — ship `@types/react` as a peer/dependency. One line; unblocks strict TS + pnpm.
2. **C13** — hide closed popover panels; a single `MultiSelect` disables the UI below it.
3. **C12** — ship the reset in the `cascivo.reset` layer; a default install has scrollbars.
4. **C10** — declare `ref` on the input prop types; the runtime already works.
5. **C11** — self-import the charts stylesheet, or say plainly that consumers must.
6. **C4** — rename `all.css` or make it complete.
7. **C5** — warn when `setTheme` runs with no mounted provider.
8. **C2** — make per-component CSS survive an Astro client build, or document the cost.
9. **C3** — mark the Preact guide CSR-only until verified under SSR.
10. **C9** — audit `ref.current?.focus()` call sites so Preact consumers can halve their JS.
11. **C6/C7** — refresh the version matrix; move `useSignals()` into getting-started.
12. **C15** — give `Modal`'s body the same gap `Drawer`'s already has.
13. **C17** — clamp `BarChart`'s tick generation to integers, or expose `allowDecimals`.
14. **C16** — thread `Axis`'s existing `format` through to `LineChartProps`.
15. **C18** — accept a per-datum `color` accessor on `BarChartSeries`, or stamp each bar with `data-x`.
16. **C19** — implement `PopoverTrigger`'s `asChild` as a real Slot, or remove the prop.
