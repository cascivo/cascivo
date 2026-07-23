# Fix plan — TanStack Router dashboard adopter report (2026-07-23, published 0.10.1 packages)

**Status: planned — not implemented.** Spec for fixing every item in the sixth cold-adopter
report (`docs/internal/feedback/feedback-tanstack-router-dashboard-adopter-2026-07-23.md` —
a Vercel-style dashboard on TanStack Router + TanStack Query / React 19 / Vite 7, CSR,
against published `@cascivo/react@0.10.1`, `@cascivo/charts@0.4.1`,
`@cascivo/themes@0.4.4`). Written to be handed to an implementing agent as-is: every claim
is triaged against current `main` (HEAD `d0b4c62d`, 2026-07-23) with file:line evidence;
every workstream carries a spec, tests, and acceptance criteria.

> **Status hygiene (binding, see WS-K):** whichever PR implements a workstream below MUST
> update this header and the per-WS status in the same PR. A plan that says "planned" after
> its fixes shipped is how the same red flag gets re-reported (it happened to the 07-20 and
> 07-22 plans — see WS-K).

## Read this first — why the same red flags are back a sixth time

This is the sixth adopter report, and the third to hit **"the prebuilt path renders a
grayscale app and nothing tells you why."** The docs for it are, on paper, excellent:

- `packages/react/README.md` puts `@cascivo/themes` in the very first install line and the
  first line of the Use snippet.
- `docs/GETTING-STARTED.md:11-13` says the theme import is "**not optional**" and has a
  dedicated "critical wiring" section.
- `docs/TROUBLESHOOTING.md:8-26` opens with exactly this symptom ("Components render
  unstyled") and the exact fix.

**The adopter saw none of it.** Their report states it plainly: `npmjs.com` returned HTTP
403 to their fetches, cascivo.com wasn't crawlable page-by-page, and they learned the
entire API by `npm pack`-ing the tarballs and reading `dist/index.d.ts`. For this adopter
class — AI agents and offline/firewalled humans — the effective documentation surface is
exactly four channels:

1. **`package.json` metadata** (dependencies, description — travels with `pnpm add`),
2. **the shipped `dist/index.d.ts` and its JSDoc**,
3. **runtime behavior** (warnings, defaults),
4. **install-time artifacts** (what lands in `node_modules`).

Every previous fix for the unstyled-app failure went to channels 5+ — README, guides,
llms.txt, the docs site — and was then triaged "not reproducible, docs exist" when the
complaint recurred. Meanwhile the three structural fixes the reports keep suggesting
(dependency edge, complete `styles.css`, dev-mode warning) were each either never planned
or explicitly skipped. The proof that the channel theory is right is in the same report:
the one integration that worked first try — TanStack Router links — worked because the
recipe lives **in `setLinkComponent`'s JSDoc**, channel 2. The adopter copied it verbatim
and praised it as first-class.

**Definition of done for this plan:** the unstyled-app failure must become *impossible to
hit silently*. A fix is done when it is (1) merged, (2) published to npm, (3) verified by
the new cold-adopter canary (WS-J) **against the packed tarballs**, following only what
channels 1–4 say — no README, no website. Docs updates remain part of every WS, but they
are the redundancy, not the fix.

## Triage — report item → verdict (order follows the report)

| # | Report item | Verdict | Root cause / evidence | WS |
| --- | --- | --- | --- | --- |
| 1 | 🔴 RED FLAG: prebuilt quickstart (`@cascivo/react/styles.css` + `ThemeProvider`) silently renders a grayscale app; `@cascivo/themes` is a separate, un-cross-referenced package | **Confirmed — structural; third recurrence; all three suggested fixes previously unplanned or skipped** | Aggregate `styles.css` = layer order + component CSS only, no `cascivo.theme`/`cascivo.tokens` content (`packages/react/vite.config.ts:117-121`); `@cascivo/themes` absent from `packages/react/package.json` (deps `:52-55` are core+i18n only); `ThemeProvider` sets the attribute with zero diagnostics — no `getComputedStyle` probe, no `console.warn` anywhere in `packages/react/src/theme.tsx`; a dev warning for this case was never promised in any prior plan (07-22 plan proposed dev warnings only for `Field` double-label) | **WS-A (P0)** |
| 2 | Three packages needed (`react`/`charts`/`themes`), none points to the others at install time; found via `npm search` | **Confirmed for channels 1–2, fixed only in channels the adopter couldn't reach** | README/GETTING-STARTED do cross-reference (react README `:28,36-37`) but npm 403'd the adopter; `package.json` `description`/`dependencies` of react and charts carry no cross-references; the `index.ts` module JSDoc that survives into `dist/index.d.ts` (`packages/react/src/index.ts:1-8`) never mentions themes, charts, or icons | **WS-B (P0)** |
| 3 | Charts require explicit pixel `width`/`height`; no intrinsic responsive sizing; `useChartSize` undiscoverable | **Not reproducible as stated — charts are responsive by default; the discoverability defect is real** | `ChartFrame` measures its container: `width?: number` optional, actual render width `fixedWidth ?? width.value` (`packages/charts/src/core/chart-frame.tsx:42-43,112,143`), frame CSS `inline-size: 100%` (`chart-frame.module.css:4`), ResizeObserver in `useChartSize` (`core/use-chart.ts:9-59`). But: the `width`/`height` prop JSDoc nowhere says "omit → fills container" (AreaChart llms doc says just "Width of the component"), `useChartSize` has **zero JSDoc**, and an explicit `width` larger than the container clips with no clamp — exactly what the adopter did (`width={420}`) after concluding width was required | **WS-C (P1)** |
| 4 | `AreaChart` `x` must return `number`; only `LineChart` accepts `Date` | **Confirmed — genuine API asymmetry; no antecedent in any prior report/plan** | `area-chart.tsx:51` `x: (d) => number`, always `linearScale` (`:242,327`); `line-chart.tsx:47` `x: (d) => number \| Date` with `usesDate` branch → `timeScale` (`:199,244-246`); the axis already formats Dates (`chrome/axis.tsx:19,26-30`) — AreaChart just never produces a time scale | **WS-D (P1)** |
| 5 | `useTheme()` returns `[Signal<string>, setter]`; reading `.value` doesn't subscribe without the transform; worked around with `useState` | **Mechanism not reproducible (hook self-subscribes) — but third adopter failure on the same shape ⇒ the API shape is the defect** | `useTheme` calls `useSignals()` as its first statement with a tuple-shaped JSDoc example (`packages/react/src/theme.tsx:70-73`), present since first commit (`2aba8dc4`) and covered by a reactivity test. Prior triages: dashboard plan "REFUTED as stated", 07-22 plan WS-D docs-only, `useThemeValue` convenience hook explicitly "default-skip". Three adopters have now shipped `useState` mirrors — the exact anti-pattern the library bans | **WS-E (P1)** |
| 6 | `gap="4"` fails (numeric union — fine) but the error names `SpaceStep$3`; `$N`-suffixed aliases (`SpaceStep$3/$4`, `Tag$1`) leak throughout the bundled `.d.ts` | **Confirmed — 8 duplicate private `SpaceStep` declarations force the dts bundler to rename; the public type is not exported** | `type SpaceStep = 1\|2\|3\|4\|5\|6\|8\|10\|12` declared privately in 8 files (`packages/layouts/src/{auto-grid,grid,flex,columns,masonry,spacer,section,sections/media-masonry}/…:6-8`); `flatten-types.mjs` bundles them into one `dist/index.d.ts` where the bundler dedupes by `$N` suffix; the dashboard plan noted the duplication but never proposed deduplicating | **WS-F (P1)** |
| 7 | `Sparkline` appears in `Stat.visual` JSDoc but isn't exported from `@cascivo/react` — grep false positive | **Papercut confirmed; attribution is already correct** | `stat.tsx:12` already says "a `Sparkline` from `@cascivo/charts`" — correct, but a name-grep over `index.d.ts` can't see the attribution. Direction of record (07-18 plan) keeps charts a separate package; no re-export planned | **WS-G (P2)** |
| 8 | No hosted API reference reachable: npm 403, cascivo.com not crawlable; learned everything from `dist/index.d.ts` | **Site-side fixed and shipping (props tables, llms surface, machine 404s, prerendered index); the adopter-side lesson is channels 1–4** | Props tables (`apps/site/src/pages/components/PropsTable.tsx`), `/docs/components` prerendered (#170), machine-readable 404s (#161), robots.txt AI-crawler allowlist all exist. npm's 403 to non-browser fetchers is outside our control (already noted in audit remediation WS-A). Residual ops item: `docs.cascivo.com` binding still deferred (`docs/internal/OPS-HOSTS.md`) | **WS-B, WS-J** |
| 9 | "No icon set ships" — hand-rolled SVGs | **Wrong as stated (`@cascivo/icons`, ~440 components, exists) — which proves the discoverability failure** | `packages/icons` ships ~440 SVG components + CSS glyphs; it is documented in llms.txt and the site gallery but appears **nowhere** in `packages/react/README.md`, GETTING-STARTED's prebuilt path, or any JSDoc an adopter would meet (`SideNav`/`IconButton` icon props don't mention it) | **WS-H (P2)** |

Cross-cutting: the report *praises* five things earlier reports complained about (SSR-free
install, `setLinkComponent` recipe, prop JSDoc coverage, layer escape hatch, a11y) —
evidence that fixes delivered through the package itself do land. That is the strategy of
this plan.

---

## WS-A (P0) — Make the unstyled app impossible to hit silently

The red flag. Three changes, layered so that any one of them alone would have saved this
adopter; together they close every path.

### A1. The aggregate `styles.css` becomes complete (tokens + base + light + dark)

`dist/styles.css` currently prepends only the `@layer` order statement to the concatenated
component CSS (`packages/react/vite.config.ts:9-12,117-121`). Change the `cssImportEdges`
plugin to inline, after the layer-order statement and before the component CSS:

1. `@cascivo/tokens` CSS (read from `../tokens/src/` the same way `layers.css` is read),
2. `@cascivo/themes/base.css` (base typography),
3. `@cascivo/themes/light.css` + `@cascivo/themes/dark.css`.

Resolve the themes' own `@import` chains at build time (they self-import tokens; inline
once, dedupe) so the emitted file has zero external references. Everything lands in its
canonical layer (`cascivo.tokens`, `cascivo.base`, `cascivo.theme`), so a consumer who
*also* imports `@cascivo/themes/*` gets duplicate-but-identical rules in the same layers —
harmless by construction (this idempotence argument is already used for the layer-order
statement, `vite.config.ts:6-8`).

Scope decision: light + dark only (the two `ThemeProvider` defaults / OS-preference
values), not all 12 themes — `warm`, `midnight`, etc. stay opt-in via `@cascivo/themes`.
Document the contents and the size delta in the README styles.css note (currently
"~273 KB / ~37 KB gzip", `readme.body.md:43`).

Result: the report's exact repro (`import '@cascivo/react/styles.css'` +
`<ThemeProvider defaultTheme="dark">`) renders fully styled.

### A2. `@cascivo/themes` becomes a real `dependency` of `@cascivo/react`

Add `"@cascivo/themes": "workspace:^"` to `packages/react/package.json` `dependencies`.
Rationale:

- `pnpm add @cascivo/react` then materializes themes in `node_modules` — channel 4. An
  adopter exploring the tarball/`node_modules` finds it; `import '@cascivo/themes/all.css'`
  works with no second install and no pnpm phantom-dependency error (the same failure mode
  as the 07-18 `setLinkComponent`-from-core report, F3).
- It is semantically true: component CSS is written against `--cascivo-*` custom
  properties that only tokens+themes define. "Optional but recommended"
  (`readme.body.md:15-16`) has now cost three adopters a debugging cycle; it is required
  for a non-grayscale result and the dependency graph should say so.
- Cost: ~a few KB of CSS files in the install; themes has no JS and its only dependency is
  `@cascivo/tokens` (already a real dep of themes since the 07-20 WS2 fix).

Do **not** auto-import theme CSS from the JS entry — the bundler path keeps per-component
CSS + one explicit theme import (A3 warns when it's missing). Update `readme.body.md` to
drop "optional but recommended" and state that themes is installed automatically.

### A3. `ThemeProvider` dev-mode warning when the theme it sets doesn't resolve

In `ThemeProvider`'s existing `useSignalEffect` (`theme.tsx:170-179`), after
`el.setAttribute(...)`, add a dev-only, once-per-page check:

```ts
// after el.setAttribute(attribute, next)
warnIfThemeUnstyled(el, next) // no-op in production builds
```

Implementation contract:

- Guard with the same bundler-inlined `NODE_ENV` pattern as `packages/charts/src/core/dev-warn.ts:14-19`
  and the `Field` double-label warning (`field.tsx:29-36`) — dead-code-eliminated in prod.
- Probe: `getComputedStyle(el).getPropertyValue('--cascivo-color-accent')` (pick one
  semantic token every theme defines; assert which in the test). Empty string ⇒ no theme
  CSS is loaded for this element.
- Defer the probe one frame (`requestAnimationFrame`) so late-loading stylesheets don't
  false-positive; skip entirely when `typeof document === 'undefined'`.
- Warn once (module-level `Set` keyed by theme name), message must contain the exact fix:

  > `cascivo ThemeProvider: data-theme="dark" was set, but no cascivo theme CSS defines
  > it — every --cascivo-color-* token is unresolved, so components render grayscale.
  > Import '@cascivo/themes/all.css' once in your entry (or '@cascivo/react/styles.css',
  > which bundles the light and dark themes). Custom theme? Ensure its stylesheet is
  > loaded and defines [data-theme="dark"]. Docs: https://cascivo.com/docs/theming`

- Also fires for the custom-theme-name typo case (`data-theme="drak"`) for free — the
  probe is per-element, post-attribute.

### Tests / guards

- **Artifact guard** (new, `scripts/checks/` + wired into `pnpm meta:check` or the react
  build's check step): after `@cascivo/react#build`, assert `dist/styles.css` contains
  `@layer cascivo.theme`, at least one `--cascivo-color-accent:` declaration, and both
  `[data-theme='light']` and `[data-theme='dark']` blocks; assert zero `@import` remains.
- **Unit** (`packages/react/src/theme.test.tsx`): jsdom — provider without theme CSS ⇒
  exactly one warning containing `@cascivo/themes/all.css`; with a stubbed
  `--cascivo-color-accent` on the target ⇒ silent; warning absent under
  `NODE_ENV=production`.
- **Canary**: WS-J's tarball app asserts a styled surface via computed background-color.

### Acceptance criteria

- The report's repro path renders the dark theme with zero extra imports.
- Deleting the theme import in a bundler-path app produces the console warning in dev.
- `pnpm ready` green; `pack:check` (publint/attw) green with the new dependency edge.
- Changesets: `@cascivo/react` **minor** (new dependency + fatter styles.css — call out
  the size change), docs regenerated (`pnpm regen`).

---

## WS-B (P0) — Put the quickstart into the channels this adopter class actually reads

### B1. Module-level JSDoc quickstart in `dist/index.d.ts`

Expand the module header of `packages/react/src/index.ts:1-8` into a compact quickstart
that survives type-flattening:

```
/**
 * @cascivo/react — every cascivo component, prebuilt.
 *
 * Quickstart:
 *   pnpm add @cascivo/react @preact/signals-react
 *   // @cascivo/themes is installed with it. In your entry file:
 *   import '@cascivo/themes/all.css'   // tokens + base + light & dark themes (required for color)
 *   // No-bundler / single-file alternative: import '@cascivo/react/styles.css' (themes included)
 *
 * The wider family (separate installs):
 *   @cascivo/charts — LineChart, AreaChart, BarChart, Sparkline, 25 chart types (+ its styles.css)
 *   @cascivo/icons  — ~440 SVG icon components for SideNav items, IconButton, Button icons
 *   @cascivo/themes — 12 themes; scope with data-theme="…" on any element
 *
 * Reactivity: components are signal-driven. In an app without the signals Babel
 * transform, any component reading `signal.value` in render must call `useSignals()`
 * (re-exported from @cascivo/core) first. Full docs: https://cascivo.com/llms.txt
 */
```

(Exact wording to taste; the load-bearing facts are: themes import line, styles.css
includes themes (post-WS-A), charts/icons exist, useSignals rule, one canonical URL.)

Mirror the pattern in `packages/charts/src/index.ts` (sizing default from WS-C, the
`styles.css` import, themes for palette) and `packages/icons`' entry.

**Guard:** extend `packages/react/scripts/check-types-flat.mjs` to assert
`dist/index.d.ts` contains `@cascivo/themes/all.css` and `@cascivo/icons` — i.e. the
quickstart survived `vp pack --dts`. If the bundler drops leading module comments, emit
the header into the flattened file from `flatten-types.mjs` instead (it already
post-processes the text); either mechanism is fine, the guard is what matters.

### B2. `package.json` cross-references (channel 1)

- `packages/react/package.json` `description`: append `" Pair with @cascivo/charts
  (data-viz) and @cascivo/icons (icon set); themes ship as a dependency."`
- `packages/charts/package.json` `description`: append `" Colors come from
  @cascivo/themes; components from @cascivo/react."`
- `packages/icons`, `packages/themes`: one-line pointers back to `@cascivo/react`.
- Keep `keywords` in sync (`icons` missing from react's keywords, etc.).

`pnpm view @cascivo/react description` is reachable even when the npm website 403s.

### B3. Residual ops item (unchanged, re-flagged)

`docs.cascivo.com` custom-domain binding is still a deferred ops action
(`docs/internal/OPS-HOSTS.md`). Not code; keep it on the ops list — the canaries in
`verify-site`/`docs-freshness` already cover the primary host.

### Acceptance criteria

- Fresh `npm pack` tarball: `dist/index.d.ts` opens with the quickstart; guard enforces it.
- `pnpm meta:check` green (docs-imports/doc-links unaffected); changesets: react + charts
  + icons + themes **patch**.

---

## WS-C (P1) — Charts: responsive-by-default must be discoverable, and explicit sizes must not clip

Charts *are* responsive (triage #3) — the adopter couldn't know, then self-inflicted a
clip. Three parts:

### C1. JSDoc the sizing contract where the adopter reads it

- `ChartFrameProps.width` (`chart-frame.tsx:42`): `/** Fixed SVG width in px. Omit
  (default) to fill and track the container's width via ResizeObserver — charts are
  responsive by default; only set this for a fixed-size export. */`
- `ChartFrameProps.height` (`:43`): `/** SVG height in px. @default 300 (48 in plain
  mode). Width, by contrast, tracks the container when omitted. */`
- Propagate the same two comments to every chart's own `width`/`height` props (they are
  redeclared per chart — Area `area-chart.tsx`, Line, Bar, Pie's `size`, etc.). Then
  `pnpm regen` so the manifests/llms docs pick up real descriptions instead of "Width of
  the component".
- `useChartSize` (`core/use-chart.ts:9`): add full JSDoc — what it measures, the returned
  `{ ref, width, height }` signals, SSR fallback behavior, and a note that chart
  components already use it internally ("you only need this to size *other* elements to
  match a chart").

### C2. Clamp: an explicit `width` never overflows its container

Add to `chart-frame.module.css` (inside `@layer cascivo.component`):

```css
.frame > svg {
  max-inline-size: 100%;
  block-size: auto; /* keep aspect when clamped */
}
```

With `width={420}` in a 320px card the SVG now scales down (SVG is scalable by nature —
`viewBox` is already set by `ChartFrame`; verify and add `viewBox` if any chart sets only
width/height attributes). The adopter's "3 of 6 bars visible" becomes impossible.

Verify while in there: the pre-measurement seed (400, `chart-frame.tsx:112`) cannot cause
a first-paint overflow for the same reason once the clamp exists; add that case to C3.

### C3. Tests + docs

- Unit (charts): explicit `width` larger than a narrow wrapper ⇒ rendered SVG's effective
  inline-size ≤ wrapper (jsdom + computed style, or Playwright in WS-J where layout is
  real).
- `packages/charts/readme.body.md`: add a short "Sizing" section — "Responsive by
  default; omit `width`. `height` defaults to 300. Explicit sizes are clamped to the
  container." Regenerate README/llms.
- Changesets: `@cascivo/charts` **patch** (CSS clamp + docs).

### Acceptance criteria

- `llms/chart/*.md` and the flattened charts `.d.ts` state the container-width default on
  every chart.
- WS-J canary: chart in a 300px card, no horizontal overflow at first paint and after
  resize.

---

## WS-D (P1) — `AreaChart` accepts `Date` x (time-axis parity with `LineChart`)

New finding (no antecedent in prior reports). Port `LineChart`'s date branch:

- Widen `x: (d: Datum) => number` → `(d: Datum) => number | Date`
  (`area-chart.tsx:51`).
- Reuse the `usesDate = hasData && allX[0] instanceof Date` detection and
  `timeScale`/`linearScale` switch exactly as `line-chart.tsx:199,244-246` (extract the
  shared shape into `core/`/`engine/` if it keeps both call sites trivial — do not build
  an abstraction beyond these two consumers).
- The axis needs no work: `chrome/axis.tsx:26-30` already formats `Date` ticks.
- Cover the stacked path: stacking sums `y` per x-key — ensure the x key for `Date` uses
  `.getTime()` (numeric identity), matching whatever LineChart's tooltip/hover indexing
  does with Dates.
- Tooltip: verify the hover label formats Dates (same formatter the axis uses or the
  chart's `xFormat` prop if one exists — mirror LineChart exactly).
- Update `area-chart.meta.ts` (prop type + a time-series example using real dates),
  `pnpm regen`.
- Out of scope, note in the plan only: `ComboChart` (`x: number`), `ScatterChart`/
  `BubbleChart` (numeric fields) stay numeric; `BarChart` is categorical by design. If a
  future report asks, the `usesDate` shape is now shared and ready.

Tests: AreaChart with `Date` x — time-scale ticks render `toLocaleDateString()` output;
multi-series stacked variant; regression: numeric x behaves exactly as before (snapshot
the scale domain). Changeset: `@cascivo/charts` **minor** (additive prop widening).

Acceptance: the report's exact use case — daily time series with "Jul 10"-style ticks on
an AreaChart — works with `x: (d) => d.date`.

---

## WS-E (P1) — `useTheme()` returns a value, not a `Signal`

Third adopter, third `useState` mirror. The hook is *mechanically* correct
(`useSignals()` first statement, `theme.tsx:70-73`) — and it does not matter, because the
returned `Signal` makes every adopter *believe* they must add subscription machinery, and
the workaround they choose is the exact anti-pattern the library forbids. Prior triages
("REFUTED as stated" / docs-only / `useThemeValue` default-skip) have now failed
empirically three times. Change the shape:

### Spec

```ts
/** Read and set the active theme. Returns the current theme name (plain string —
 *  the component re-renders on change; no signal handling needed) and a setter. */
export function useTheme(): readonly [string, (next: string) => void] {
  useSignals()
  return [themeStore().value, setTheme] as const
}

/** Advanced: the underlying theme signal, for signal-native code (computed(),
 *  effect(), Preact apps). Most apps want useTheme(). */
export function themeSignal(): Signal<string> {
  return themeStore()
}
```

- Reading `.value` *inside* the hook is also strictly more robust than handing the signal
  out: the read is guaranteed to happen inside the `useSignals()` tracking window,
  independent of where/whether the consumer reads it during render.
- `setTheme` (module-level) and `ThemeProvider` are unchanged.
- Migration sweep: every in-repo consumer of `useTheme()[0].value` (site app has its own
  theme store — verify; check blocks, examples, storybook, docs snippets, llms generator
  "Reactivity & state" section, `MIGRATING-FROM-SHADCN.md:189-190`, GETTING-STARTED,
  THEMING.md) moves to the value tuple or `themeSignal()`.

### Breaking-change handling

`@cascivo/react` **minor** with a `breaking-changes.json` entry + `UPGRADING.md` section
(0.x line; follow the repo's established convention for the signals-peer-floor break):
`theme.value` → `theme`; code that passed the signal around uses `themeSignal()`.
TypeScript makes the break loud (`.value` on `string` is an error), which is the good
failure mode — the old shape's failure was silent staleness.

### Tests

- React 19 + **no transform** (the react package's test env): toggle via returned setter
  ⇒ consumer re-renders with the new string. (Port the existing reactivity test.)
- `themeSignal()` identity: same signal across calls; `setTheme` reflects into it.
- SSR render returns the default theme string without touching `document`.

Acceptance: `const [theme, setTheme] = useTheme()` with `{theme}` in JSX — the report's
theme-toggle icon — re-renders with zero signal knowledge; grep confirms no in-repo doc
shows `.value` on the `useTheme` result.

---

## WS-F (P1) — Public type names in errors: kill the `$N` alias leak

### F1. One `SpaceStep`, exported

- Create a single source: `packages/layouts/src/space.ts` (or extend an existing shared
  module in layouts — do not put it in `@cascivo/core`; it's a tokens-scale type, not a
  behavior) — `export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12`, with a JSDoc
  naming the token scale (`--cascivo-space-*`) and *why 7 is missing*, plus the
  `gap={4}`-not-`gap="4"` note (the exact confusion from the report).
- Replace the 8 private duplicates (`auto-grid`, `grid`, `flex`, `columns`, `masonry`,
  `spacer`, `section`, `sections/media-masonry` — all at `…:6-8`) with imports.
- Export `SpaceStep` from `packages/react/src/index.ts` (and layouts' own barrel if it
  has one) so compiler errors and consumers name the public type.

### F2. Audit and eliminate the remaining `$N` renames

After a build, scan `dist/index.d.ts` for `\$\d` identifiers (the report names
`SpaceStep$3`, `SpaceStep$4`, `Tag$1`). For each: same treatment — one shared declaration,
exported under its public name, or renamed at source when two genuinely different types
collide (e.g. if a `Tag` *type* collides with the `Tag` component, rename the type
`TagTone`/whatever it actually is — a `$1` suffix is never the answer).

### F3. Guard

Extend `packages/react/scripts/check-types-flat.mjs`: fail the build if
`/\b[A-Za-z_]\w*\$\d+\b/` matches in `dist/index.d.ts`. No allowlist to start — if a
collision is truly irreconcilable, the allowlist gets added *with a comment* in the same
PR that proves it.

Non-goal (decided): keep `gap` strictly numeric. `gap="4"` stays a type error — the token
scale is the API — but after F1 the error message reads `Type '"4"' is not assignable to
type 'SpaceStep'` with a documented, exported, hoverable type. Changeset:
`@cascivo/react` **patch** (types-only; additive export).

Acceptance: `grep -E '\$[0-9]' dist/index.d.ts` → empty; `gap="4"` error names
`SpaceStep`; guard is in CI via the react build.

---

## WS-G (P2) — Cross-package JSDoc mentions must be grep-proof

`Stat.visual`'s attribution is already correct (`stat.tsx:12`); make it unambiguous for a
reader arriving mid-file via grep:

- `stat.tsx:12` → "…e.g. a `Sparkline` from the separate `@cascivo/charts` package (not
  exported from `@cascivo/react`; `pnpm add @cascivo/charts`)…". Mirror in
  `stat.meta.ts:37,64-65`; `pnpm regen`.
- Sweep for the same pattern: grep `@cascivo/charts`, `@cascivo/icons` inside
  `packages/components/src/**` and `packages/layouts/src/**` JSDoc; apply the same
  "separate package" phrasing everywhere a component from another package is name-dropped
  (`StatsBand`'s sparkline mention, etc.).

Changeset: `@cascivo/react` **patch**. Acceptance: grepping `Sparkline` in the flattened
`.d.ts` hits only comments that state, in the same sentence, the package to install.

---

## WS-H (P2) — `@cascivo/icons` is part of the quickstart surface

The package exists (~440 components) and the adopter hand-rolled SVGs. Fix the three
human channels WS-B doesn't cover:

- `packages/react/readme.body.md`: add an ecosystem line next to the charts one —
  "Icons live in `@cascivo/icons` — ~440 tree-shakeable SVG components sized by the token
  system." Regen README.
- `docs/GETTING-STARTED.md`: mention icons in the prebuilt path (install line comment or
  the components-tour section).
- Point-of-use JSDoc (channel 2, the one that provably works): on `SideNavItem.icon`,
  `IconButtonProps.icon`(/children), `ButtonProps.icon` — "any ReactNode; `@cascivo/icons`
  ships ~440 ready-made SVG icons". Keep it to the props where an adopter builds a
  dashboard shell; regen manifests.

Changeset: **patch** across react/components + docs. Acceptance: an adopter reading only
`SideNavItemProps` in the `.d.ts` learns the icons package exists.

---

## WS-J (P0) — The cold-adopter canary: verify the tarballs, not the repo

Every recurrence in this saga involved artifacts (published packages, deployed docs) that
lagged or diverged from a green repo. The missing gate is an integration test that adopts
cascivo the way this adopter did.

### Spec

New script + CI job (release-PR + nightly; not per-commit — it builds and packs
everything): `scripts/checks/cold-adopter.test.ts` (Playwright, reuse the repo's e2e
setup):

1. Build + `npm pack` the published set (`react`, `charts`, `themes`, `icons`, `core`,
   `i18n`, `tokens`, `storage`) into a temp dir.
2. Scaffold a minimal Vite + React 19 app in the scratch area installing **from the
   tarballs** (pnpm `overrides` pointing at the `.tgz` files).
3. The app follows **only the `dist/index.d.ts` quickstart** (WS-B) — literally the
   snippet from the module JSDoc: `styles.css` variant on one route, `themes/all.css`
   variant on another; `ThemeProvider defaultTheme="dark"`; a `useTheme` toggle; a
   `BarChart` inside a 300px `Card`; a `SideNav` with an `@cascivo/icons` icon.
4. Assertions:
   - **Styled**: computed `background-color` of a `Card` is neither transparent nor the
     UA default; `--cascivo-color-accent` resolves on `:root[data-theme]` (kills the red
     flag forever).
   - **Warning contract**: a third route omitting every theme import logs the WS-A3
     warning (assert on console), and only that route does.
   - **Reactivity**: clicking the theme toggle re-renders the label (WS-E) and flips
     computed colors.
   - **Charts**: no horizontal overflow of the chart card at 320px viewport (WS-C);
     `Date`-x AreaChart renders date-formatted tick text (WS-D).
   - No page errors on any route.

This is the executable form of this plan's definition of done; wire it as a required
check on release PRs (same tier as `pack:check`).

Acceptance: the canary fails on current `main` for the styled/warning assertions (proving
it detects the red flag) and passes with WS-A/B/C/D/E merged.

---

## WS-K (P0, cheap, do first) — Plan-status hygiene: stop reporting shipped fixes as unshipped (and vice versa)

The user-facing complaint behind this whole report is *"this was mentioned multiple times
and always said to be fixed."* Both directions of status drift are live right now:

- `fix-plan-tanstack-start-adopter-2026-07-20.md` and `…-07-22.md` still open with
  "**Status: planned — not implemented**", yet PR #166 (`e81a0a73`, released as 0.10.0)
  shipped 07-22's WS-A (CSS-free `node` build), WS-B (controlled ThemeProvider SSR
  script), WS-G (`Field` dev warning), WS-I (`setLinkComponent` inference), and charts
  0.4.0 shipped WS-E (per-series `y`); #170 shipped the `/docs/components` route (WS-F).
- Conversely, `docs/plans/dashboard-experience-report-plan.md` says "Status:
  implemented" while its skipped items (`useThemeValue` "default-skip") are exactly what
  re-surfaced here as triage #5.

### Actions

1. Update both stale headers to a per-WS status table (shipped-in-version / PR link /
   still-open), in this branch or the implementing PR — 30 minutes of archaeology that
   prevents the next agent (and the maintainer) from re-triaging shipped work.
2. Carry forward the still-open items from those plans into the tracking of this one so
   there is a single live list: 07-22 WS-C (`TS2882` / `noUncheckedSideEffectImports`
   docs+exports), WS-D (`useTheme` tuple docs — superseded by WS-E here), WS-H (`Stack`
   point-of-use notes, approved 07-17, still unimplemented), WS-J (llms per-file guard).
3. Add the binding rule to `docs/internal/feedback/` (a short `README.md` in that
   directory): *a fix-plan's status header and per-WS statuses are release artifacts —
   the PR that implements or supersedes a workstream updates them in the same PR; the PR
   that publishes updates "merged" → "published vX.Y.Z".* This is the process analogue of
   the drift check.

---

## Sequencing & sizing

| Order | WS | Size | Why this order |
| --- | --- | --- | --- |
| 1 | **WS-K** | XS | Pure docs archaeology; unblocks accurate triage for everything below |
| 2 | **WS-A** | M | The red flag; everything else is secondary |
| 3 | **WS-B** | S | Rides the same react-package PR as WS-A (shared changeset/regen) |
| 4 | **WS-E** | M | Breaking-ish; wants its own PR + UPGRADING entry |
| 5 | **WS-C + WS-D** | M | One charts PR (JSDoc + clamp + Date-x + regen) |
| 6 | **WS-F** | S | Types-only PR; adds the `$N` guard |
| 7 | **WS-G + WS-H** | S | Doc/JSDoc sweep PR + regen |
| 8 | **WS-J** | M | Lands last but its assertions are written against WS-A–E; failing-first is fine earlier |

Every PR: `pnpm ready` green, changesets included, `pnpm regen` artifacts committed.
Plan is complete only when a release train has **published** the packages and WS-J is
green against the packed artifacts — per the definition of done above.

## Explicitly out of scope (decided, with reasons)

- **Re-exporting charts (or `Sparkline`) from `@cascivo/react`** — direction of record
  since the 07-18 plan; WS-B/G make the split discoverable instead.
- **Accepting `gap="4"` strings** — the numeric token scale is the API; WS-F makes the
  error self-explanatory.
- **Auto-importing theme CSS from the JS entry** — keeps CSS loading explicit on the
  bundler path; WS-A1+A3 cover the failure mode.
- **npm's 403 to non-browser fetchers** — not ours to fix; channels 1–4 are the
  mitigation (WS-B), as already concluded in `audit-remediation-plan-2026-07.md` WS-A.
