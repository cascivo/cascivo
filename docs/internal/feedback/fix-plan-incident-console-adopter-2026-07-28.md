# Fix plan — the 2026-07-28 incident-console adopter (tested published `0.13.0`)

**Status: implemented on `claude/ui-library-analysis-plan-iyopig`; not yet published.**
The PR that publishes flips each workstream to `published vX.Y.Z` — and per
[`README.md`](README.md), run `pnpm npm:parity` before writing any sentence about what is or
is not published.

Per-workstream:
**WS-1** ◑ (peers shipped on 7 packages + `peer-floors` guard; the C1 *mechanism* does not
reproduce — see §0.5, the one genuinely open item) ·
**WS-2** ✅ (`forwardRef` on every single-host component + `ref-forwarding` tests; chose
`forwardRef` over a bare `ref?:` prop to keep the `react >= 18` floor honest. The new
`ref-parity` guard derives the set from source and found **9 components the plan's own list
of 16 never mentioned** — accordion, checkbox-card, copy-button, number-input,
password-input, radio-card, skip-nav, tabs, time-picker. Four composites and two
multi-export files are allowlisted with reasons) ·
**WS-3** ✅ (`reset.css` in the `cascivo.reset` layer, reaching every entry path + inlined
into the aggregate; `reset-floor` guard, observed failing first) ·
**WS-4** ✅ (MultiSelect + Sheet; `popover-hidden` guard, observed failing on exactly those
two) ·
**WS-5** ✅ (AppShell `flex-shrink`, dialog-family body gap + Modal `footer`, six
`data-cascivo-*` hooks + `STYLING-INTERNALS.md` + bidirectional `style-hooks` guard) ·
**WS-6** ✅ (`all.css` = all twelve, new `light-dark.css`, `theme-bundle` guard;
provider-missing dev warning + `applyTheme`) ·
**WS-7** ✅ (CSS self-import + node twin across charts/editor/flow/ai via one shared plugin,
`css-contract` guard; integer ticks + `allowDecimals`. `format` now on **all 12
axis-composing charts** — the sweep the workstream asked for, held by the new `axis-parity`
guard, which found 4 charts beyond the 8 identified by hand (bar-chart, boxplot, heatmap,
stream). Where a chart already declared a local `format`, the prop is destructured as
`xFormat` rather than shadowing it. **Audited and found NOT to be gaps:** role-named axis
props apply only to `BarChart` because it is the only chart with an `orientation` prop; and
`PieChart`/`Funnel`/`RadialBar` already take `color` **per datum**, so C18's gap was specific
to `BarChart`'s per-*series* model) ·
**WS-8** ✅ (`PopoverTrigger asChild` via `Slot`; `dead-props` guard, verified against the
real pre-fix file) ·
**WS-9** ✅ (`focusElement` + 16 call sites; a `preact` vitest project over the interactive
family) ·
**WS-10** ◑ (matrix regraded, `USING-WITH-ASTRO.md`, Preact scope table, `framework-matrix`
guard — but **no `apps/examples/astro-*` app**, so the Astro defect is documented, not
reproduced in CI) ·
**WS-11** ✅ (generated version matrix, `useSignals()` on all surfaces +
`getting-started-contract` guard, dead `/docs/theming` URL fixed + `doc-urls` guard, seven
symptom-keyed troubleshooting entries, Troubleshooting in the nav) ·
**WS-12** ◑ (`@cascivo/ai` converged to `.js`/`.d.ts`; `minimumReleaseAge` troubleshooting
entry; Flex/Stack comparison table added to `MIGRATING-FROM-SHADCN.md` so the two naming
inversions are findable while *choosing* a component. **Module-convention convergence for
core/i18n/storage/icons was attempted and REVERTED** — an explicit `vp build` lib config
collapses them into a single bundle and broke Next.js RSC prerendering in
`apps/examples/react-next` (`ReferenceError: p is not defined` from a `forwardRef` binding
Turbopack drops when re-bundling); `'use client'` banners and subpath-aware externals were
both tried and neither fixed it. C8 is explicitly cosmetic and a broken RSC build is not, so
the divergence stands. `pkg-exports` now RECORDS the diverged set with that evidence instead
of gating on it. Per-icon subpaths **not done** — tree-shaking already works, which the plan
itself called the lowest-value item) ·
**WS-13** ◑ (13a `isolated:check` and 13b `bare-page:check` both shipped; of `bare-page`'s
four cases only **C12 was observed failing on its pre-fix state** — C13/C14/C15 pass but
their failure modes are unproven, recorded in that file's header. C13's real guard is
`popover-hidden`, which *was* observed failing and named both offenders).

**Honest summary of what is NOT done.** An earlier revision of this header listed four
items; that was wrong, and under-reporting completion is the exact defect this directory
exists to prevent. The real list:

*Tried and deliberately abandoned, with evidence:*
1. **Module-convention convergence** for `core`/`i18n`/`storage`/`icons` (C8). Broke Next.js
   RSC prerendering; see WS-12 above and the comment in `pkg-exports.test.ts`. Reverted on
   purpose — the finding is cosmetic, the regression was not.

*Never started:*
2. **`apps/examples/astro-islands`** — WS-10's executable reproduction of C2. Astro is graded
   ⚠️ Partial and documented in `USING-WITH-ASTRO.md`, which says plainly that nothing in CI
   exercises the Astro path.
3. **Per-icon subpaths** (WS-12) — tree-shaking already works; the plan called it the
   lowest-value item and said not to block on it.

*Investigative:*
4. **The C1 repro** (§0.5) — the fix shipped, the mechanism is unexplained.
5. **Three of `bare-page`'s four browser cases** — C13, C14 and C15 pass but were never
   observed failing, so they are regression tripwires rather than proofs. C12 was verified
   properly (`scrollWidth 1314` vs `clientWidth 1280` on a reset-stripped stylesheet).
6. **`ref-parity`'s per-file granularity** — it cannot express "AccordionTrigger forwards,
   AccordionItem does not", so `accordion` and `tabs` are allowlisted rather than analysed.

Every "fix landed on one instance of a class" item from the previous revision is now closed,
and in each case the guard that closed it found instances neither the report nor the plan had
listed: 9 extra components for `ref`, 4 extra charts for `format`. That is the argument for
guards over checklists, made twice in one plan.

**Source report:**
[`feedback-incident-console-adopter-2026-07-28.md`](feedback-incident-console-adopter-2026-07-28.md)
— a local-first incident console, pnpm 11.5.3 + Vite 7.3.6 + TypeScript 6.0.3 + React 19.2.8 +
Node 22.22.2, started on Astro 6.4.8 and migrated to a plain Vite SPA mid-build. 19 findings
(C1–C19), 3 marked blocker.

**Carry-forward:** this plan supersedes
[`fix-plan-adopter-pair-2026-07-26.md`](fix-plan-adopter-pair-2026-07-26.md) as the live
tracker. That plan's only open workstream was **WS-15a — publish**, and it is now **closed**:
see §0.1.

---

## §0 — Read this first

### §0.1 The publish question is already answered, and the answer is bad news

The 07-26 plan ended with one open item ("publish the 07-24/07-25/07-26 trains"). It shipped.
The reporter's environment block names `@cascivo/react` 0.13.0 · `@cascivo/core` 0.7.0 ·
`@cascivo/themes` 0.4.8 · `@cascivo/tokens` 0.5.5 · `@cascivo/icons` 0.3.5 · `@cascivo/charts`
0.7.0 — which is **exactly this checkout**:

```
core 0.7.0 · themes 0.4.8 · tokens 0.5.5 · icons 0.3.5 · charts 0.7.0 · react 0.13.0
```

So: **do not write "not yet published" anywhere in this plan.** Every finding below is a defect
in the newest published code, reproduced against `main` at `757e6cc8`. WS-15 of the 07-26 plan
is closed by observation; nothing is carried forward from the 07-20 → 07-26 chain.

### §0.2 Eleven reports in, this one is different: it is the first *cold* one

The previous ten reports were TanStack Start / React Router / Vercel-shaped dashboards. This
one is an incident console on Astro-then-Vite, and it found **three blockers the whole chain
missed** — `@types/react`, the empty reset layer, and closed popovers eating clicks. None of
those three appears anywhere in `docs/internal/feedback/` before today (checked: zero matches
for `@types/react`, `box-sizing`, `popover-open`, `forwardRef` across all prior reports and
plans).

That is not luck. Each of the three is invisible to every guard the repo has, for the same
structural reason, and that reason is a **new mechanism**:

> **Mechanism E — the defect is only observable in a consumer-shaped environment, and every
> guard runs in the monorepo.** The monorepo hoists `@types/react` to the root, so
> `packages/react`'s own `tsc --noEmit` passes while an isolated pnpm install cannot resolve a
> single React prop type. The site and Storybook apps ship their own `box-sizing: border-box`
> reset in app CSS, so no shipped surface ever renders on the browser default. `computed:check`
> mounts components one at a time in a 640px box, so a closed `MultiSelect` panel never has a
> `<Button>` under it to swallow.
>
> **Fix shape:** a fixture that is *not* the monorepo — an isolated install, with no app CSS,
> rendering more than one component — asserted in CI. WS-13 builds it once and WS-1/3/4 hang
> their acceptance tests off it.

Mechanism E is the reason the "already mentioned, always said to be fixed" complaint keeps
recurring on a repo with 50+ guards. The guards are real and good. They all run inside the one
environment where these defects cannot happen.

The remaining findings classify against the existing taxonomy:

| Mechanism | Findings |
| --- | --- |
| **A** — behavioral claim exists only as prose | C12 (the `cascivo.reset` layer is documented as "the floor" in a CSS comment and ships empty), C19 (`asChild?: boolean` is a typed, documented promise that no code reads) |
| **B** — fact inferred from a proxy | C17b (axis-prop meaning inferred from *screen position*, so `xTicks`/`yTicks` silently swap under `orientation`, while `xLabelEvery` does not) |
| **C** — same fact stated in two places | C4 (`all.css` names "all", contains 2 of 12), C6 (version matrix hand-maintained beside real `package.json` versions), C11 (`@cascivo/react` auto-loads CSS, `@cascivo/charts` does not, both declare the same `sideEffects`) |
| **D** — fix landed on a surface the adopter does not read | C7 (`useSignals()` is in `index.d.ts` and `HEADLESS.md`, absent from getting-started), and the dead `/docs/theming` link in §11.3 |
| **E** — only observable outside the monorepo | C1, C12, C13 |
| plain defects | C2, C3, C5, C9, C10, C14, C15, C16, C17a, C18 |

### §0.3 What "done" means for this plan

A workstream is done when: the code change has landed, **its guard has landed and is wired into
`pnpm ready` or the CI tier named in the workstream**, and the guard has been observed to *fail*
on the pre-fix state. A fix without a failing-first guard is how all three §0.2 blockers got
here. Where a workstream is documentation-only, "its guard" means a parity check that fails when
the doc and the code disagree — never "the doc was updated".

### §0.5 Correction — C1's mechanism does not reproduce

**Added after implementation. The triage row above was written before the fixture existed.**

The plan's WS-13a fixture was built specifically to reproduce C1, and it does not. Against
the **pre-fix** tarballs (no `@types/react` peer), in a pnpm workspace, under pnpm's strict
non-hoisting default, with `skipLibCheck: false`, on **TypeScript 6.0.3 — the reporter's own
version** — cascivo's types resolve cleanly and not one prop goes missing.

The virtual store is exactly as the report describes:

```
node_modules/.pnpm/@cascivo+react@…/node_modules/   →   @cascivo  @preact  react  react-dom
```

`@types/react` is genuinely absent from it. TypeScript finds the types anyway, by walking up
from the symlinked path into the app's own `node_modules`.

The only configuration found to break resolution this way is `preserveSymlinks: true`, and
that also breaks `@types/react`'s own `csstype` import — a consumer tsconfig problem, not a
cascivo packaging one. The reporter's app began on Astro, whose TS preset is a plausible
source, but that is a hypothesis, not a finding.

**What this changes:**

- The reporter's *symptom* is not in doubt — they measured 18 errors and committed a
  `publicHoistPattern` workaround. Something in their environment did break resolution.
- The **fix still ships.** An optional `@types/react` peer is the convention every typed
  React library converged on, it makes resolution deliberate rather than an accident of
  layout, and it costs a JS-only consumer nothing. It is very likely the right fix; it is
  simply not *proven* to be.
- **Nothing may claim C1 is guarded.** The fixture's header and `peer-floors`' header both
  state the negative result explicitly, so the next reader inherits the evidence rather than
  the assumption — which is the failure mode this whole directory exists to prevent (see the
  07-26 plan's "not yet published" correction).
- **Open:** if anyone reproduces C1, add the configuration to
  `scripts/checks/isolated-install.test.ts`. That is the one genuinely unfinished item in
  this plan.

The fixture is kept regardless. It proves something nothing else did: the published tarballs
install and type-check in a strict, non-hoisted workspace with lib checking on.

---

### §0.4 Triage summary

Every finding was reproduced against this checkout with file:line evidence. Verdicts:

| # | Verdict | Evidence | WS |
| --- | --- | --- | --- |
| C1 | **PARTIALLY REFUTED** (see §0.5) | The packaging fact is confirmed: `@types/react` was `devDependencies`-only in seven published packages. The *mechanism* is not reproduced — packed pre-fix tarballs type-check cleanly in a strict non-hoisted pnpm workspace on the reporter's own TypeScript 6.0.3. | WS-1 |
| C2 | **CONFIRMED (Astro-specific)** | not reproducible in-repo; accepted on the reporter's measurements (`client:load` → no component CSS; `client:only` → 58 KB) | WS-10 |
| C3 | **CONFIRMED (docs scope)** | `docs/USING-WITH-PREACT.md` describes only Vite CSR; `docs/COMPATIBILITY.md:16` lists Preact ✅ with no qualifier | WS-10 |
| C4 | **CONFIRMED** | `packages/themes/src/all.css:15-20` imports `light.css` + `dark.css`; `packages/themes/src/` contains 12 themes | WS-6 |
| C5 | **CONFIRMED** | `packages/react/src/theme.tsx:101-103` — `setTheme` writes the signal only; the DOM write lives in `ThemeProvider`'s `useSignalEffect` | WS-6 |
| C6 | **CONFIRMED** | `docs/COMPATIBILITY.md` "Package compatibility" says `core 0.1.x` / `tokens 0.2.x`; actual `0.7.0` / `0.5.5` | WS-11 |
| C7 | **CONFIRMED** | `docs/GETTING-STARTED.md` — `useSignals` appears once, at line 260, inside a *theming* comment; no section, not on the "First component" path (line 303) | WS-11 |
| C8 | **CONFIRMED** | `packages/icons/package.json:30-37` ships `.mjs`/`.d.mts`; `packages/react/package.json:34-40` ships `.js`/`.d.ts`. `Flex`/`Stack` naming is intentional and documented — no change, doc only | WS-12 |
| C9 | **CONFIRMED, root cause found** | `packages/components/src/dropdown/dropdown.tsx:163-170` clones an arbitrary trigger element and attaches `composeRefs(triggerRef, …)`; `:118`/`:149` then call `triggerRef.current?.focus()`. Under `preact/compat` a ref on a **function component** resolves to the component instance, not the element | WS-9 |
| C10 | **CONFIRMED** | no `ref?:` on any exported `…Props` interface across `packages/components/src` (only `dropdown.tsx:160`, an internal cast) | WS-2 |
| C11 | **CONFIRMED** | `packages/charts/src/index.ts` references `@cascivo/charts/styles.css` only inside a JSDoc block (lines 7); no `import './…css'` statement anywhere in the entry | WS-7 |
| C12 | **CONFIRMED** | `packages/tokens/src/layers.css:12` documents `cascivo.reset` as "the floor"; **no package emits a single rule into it**. Only 6 of 132 component stylesheets set `box-sizing` on their own root | WS-3 |
| C13 | **CONFIRMED, and it is worse than reported** | two components, not one: `multi-select.module.css:93` (`display: flex` in `.panel`'s base rule) and `sheet.module.css:9` (`display: flex` in `.sheet`'s base rule, `popover="manual"`). `header-panel` gets it right (base `display:none`, `:popover-open { display:flex }`); the other 9 popover components set no base `display` and are unaffected | WS-4 |
| C14 | **CONFIRMED** | `app-shell.module.css:102-107` — at `min-width: 64rem` `.navWrapper` is `position: static; inline-size: 18rem` inside `.body { display: flex }` (`:21-26`) with no `flex-shrink: 0`; `.main` correctly has `min-inline-size: 0` (`:87-91`) | WS-5 |
| C15 | **PARTIALLY REFUTED** | `modal.module.css:148-150` — `.body` is `padding` only, confirmed. But `drawer.module.css:186-190` is *also* `padding` + `overflow-y` + `flex: 1` with **no gap**; the `gap: var(--cascivo-space-4)` at `:128` is a different region. The papercut is real; "Drawer already does it" is not. Fix both | WS-5 |
| C16 | **CONFIRMED** | `line-chart.tsx:147` — `secondAxis?: { label?, format? }` is the only formatter; `:285-288` passes `xTicks` to `Axis` with no `format`. `AxisProps.format` exists and is unused for x | WS-7 |
| C17a | **CONFIRMED, root cause found** | `engine/scale.ts:26` — `rawStep = (max - min) / Math.max(1, count)`, then snapped to `[1, 2, 2.5, 5, 10] × 10^k`. `max=1, count=2` → `rawStep 0.5` → `step 0.5` → `[0, 0.5, 1]`. Nothing clamps to an integer step on an integer domain | WS-7 |
| C17b | **CONFIRMED** | `bar-chart.tsx:190/198` — the value scale takes `yTicks` when vertical, `xTicks` when horizontal (screen position). `:320-321` — `xLabelEvery` always strides `categories` (data field). Two conventions, one component | WS-7 |
| C18 | **CONFIRMED** | `bar-chart.tsx:26` — `BarChartSeries.color?: string`, no per-datum form. `:424-438` — each `<rect>` carries `data-series` but no `data-x`, so CSS cannot address a single bar | WS-7 |
| C19 | **CONFIRMED, and it is a one-line fix** | `popover.tsx:23` declares `asChild?: boolean`; `:26` destructures `{ children }` and **never reads it**; `:34-44` always renders its own `<button>`. `Slot` already exists (`packages/core/src/slot.tsx`) and 7 other components use it correctly | WS-8 |

Two findings deserve explicit credit as **REFUTED as design defects**: `Flex direction="vertical"`
and `Stack` as an overlap primitive (C8) are deliberate, documented in TSDoc, and the reporter
says the TSDoc caught them before runtime. That is the `tsdoc:generate` work from the 07-26 plan
doing exactly its job. No change; §12 only adds a comparison row so the surprise is findable
before authoring rather than at hover time.

---

## WS-1 — `@types/react` must resolve in a consumer install

**C1. Blocker. Mechanism E.** Highest priority in this plan.

### The defect

`packages/react/dist/index.d.ts` opens with `import { HTMLAttributes, ButtonHTMLAttributes,
ReactNode, … } from 'react'` and nearly every public interface extends those types. But
`@types/react` is declared **only** in `devDependencies` (`packages/react/package.json:74`), so
under pnpm's isolated `node_modules` the only packages visible from `@cascivo/react` are
`@cascivo/*`, `@preact/*`, `react`, and `react-dom`. The import does not resolve,
`extends HTMLAttributes<HTMLDivElement>` collapses to an error type, and `skipLibCheck: true`
— which cascivo's own getting-started enables — suppresses the diagnostic that would explain it.

The interfaces then keep only their *own* declared members. `children`, `className`, `style`,
`onClick` and every `aria-*` prop vanish from every component. The reporter measured **18 errors
from a ~90-line file using ten components**. Strict TypeScript + pnpm — cascivo's documented
setup — cannot type-check at all.

Same shape in `@cascivo/core`, `@cascivo/charts`, `@cascivo/icons` (all three: `@types/react` in
`devDependencies` only, nothing in `peerDependencies`).

### Spec

1. For each of `packages/react`, `packages/core`, `packages/charts`, `packages/icons` — and
   `packages/i18n` / `packages/storage` **if and only if** their emitted `.d.ts` references a
   React type (verify per package; do not add it blind):

   ```jsonc
   "peerDependencies": {
     "@types/react": ">=18.0.0",       // add
     "@preact/signals-react": ">=3.0.0",
     "react": ">=18.0.0",
     "react-dom": ">=18.0.0"
   },
   "peerDependenciesMeta": {
     "@types/react": { "optional": true }   // JS-only consumers must not get an install warning
   }
   ```

   Add `@types/react-dom` on the same terms only where the emitted types reference it
   (`packages/react` renders portals/roots — check `dist/index.d.ts` after a build; do not
   assume).

2. `peerDependencies` and `devDependencies` must not disagree on the floor. The
   `peer-floors` guard (`scripts/checks/peer-floors.test.ts`) already enforces the
   `@preact/signals-react >= 3.0.0` floor; extend it to assert that every package whose built
   `.d.ts` imports from `'react'` declares an optional `@types/react` peer.

**Why peer-optional and not `dependencies`:** a `dependencies` entry pins a *copy* of
`@types/react` that can conflict with the app's own React types (the classic duplicate-`JSX`
error). Optional peer is the convention every typed React library converged on, and it puts the
types on the resolution path without owning the version.

### Guard (Mechanism E — this is the load-bearing part)

`scripts/checks/isolated-install.test.ts`, new. This is the fixture WS-3 and WS-13 also use.

- Build, `pnpm pack` each published package into a temp dir **outside the repo tree**.
- Create a scratch app there with its own `pnpm-workspace.yaml` (no `publicHoistPattern`, no
  `node-linker=hoisted` — the strict default, which is what an adopter gets), `pnpm add` the
  tarballs plus `react`, `react-dom`, `@types/react`, `typescript`.
- Write a ~40-line `app.tsx` that uses ten components with `children`, `className`, `onClick`
  and an `aria-label`, under `"strict": true` and — critically — **`"skipLibCheck": false`**.
- `tsc --noEmit` must exit 0.

Run `skipLibCheck: false` because `true` is what hid this for thirteen minor versions. The
fixture is the only place in the repo that should turn it off.

**Cost:** a pack + install, ~60–90s. It belongs in CI's release/nightly tier next to
`cold-adopter:check` and `pack:check`, **not** in `pnpm ready`. Wire as `pnpm isolated:check`.

### Definition of done

- [ ] `pnpm isolated:check` fails on `757e6cc8` (observe it, record the error in the PR).
- [ ] Peers added; `pnpm isolated:check` passes.
- [ ] `peer-floors` extended; `pnpm meta:check` green.
- [ ] `pnpm pack:check` still green (attw must not regress on the new peer).
- [ ] `docs/TROUBLESHOOTING.md` gains a "TS2322: `children` does not exist on type
      `…Props`" entry naming the pnpm-hoisting symptom, for anyone on an older version.

---

## WS-2 — declare `ref` on the props types

**C10. Medium. Types-only.**

### The defect

There is no `forwardRef` in `@cascivo/react`'s 4,755-line `.d.ts` and no component declares a
`ref` prop, so `<Textarea ref={r} />` is `ts(2322)`. At runtime it **already works** — components
spread unknown props onto the underlying element and React 19 passes `ref` through as an ordinary
prop. The reporter verified the ref resolves to a real `HTMLTextAreaElement` and that
`setSelectionRange` behaves. They keep a cast quarantined in one file to get caret restoration in
a collaborative editor.

So this is purely a typing gap that forces a cast at every call site, with no way for a consumer
to know the cast is safe.

### Spec

1. Add `ref?: Ref<HTMLXxxElement>` to the exported props interface of every component that
   spreads `...rest` onto a single, stable underlying DOM element. Start with the components an
   integration actually needs: `Input`, `Textarea`, `Button`, `IconButton`, `Select`,
   `NativeSelect`, `Checkbox`, `Radio`, `Toggle`, `Slider`, `Search`, `TagsInput`, `Combobox`,
   `OtpInput`, `Card`, `Link`.
2. **Do not add `forwardRef`.** The peer floor is `react >= 18` but the *behaviour* being typed
   is React 19's ref-as-prop. Under React 18 the ref would be consumed by React and never reach
   the element — a type that lies. Two options; pick (a) unless it measurably breaks someone:
   - **(a)** Raise the react peer floor to `>=19.0.0` for the components that declare `ref`, and
     say so in `COMPATIBILITY.md`. Cleanest, and 19 has been out long enough.
   - **(b)** Keep the `>=18` floor and wrap the listed components in `forwardRef`. Works on both,
     costs a wrapper per component and a `'use client'`-boundary re-check.
   Whichever is chosen, **record the decision and its reason in the PR description** — this is
   the kind of choice that gets silently reversed later.
3. Where a component has no single stable host element (`Field`, `AppShell`, `DataTable`), do
   **not** add `ref`. Instead give it a documented, stable `data-cascivo-*` hook (see WS-5) so
   consumers have a supported way in.

### Guard

Extend `scripts/checks/props-parity.test.ts` (or a small sibling) with a **`ref` parity**
direction: for every component whose implementation spreads `...rest` onto exactly one intrinsic
JSX element, the exported props interface must declare `ref?: Ref<T>` with `T` matching that
element's type — or appear in an allowlist with a stated reason. Same shape as the existing
`required` direction added by the 07-26 plan, which found two real drifts.

Add a runtime case to `packages/react`'s test suite asserting the ref lands on the DOM node
(the reporter's own `ref-forwarding.test.tsx` is the model).

### Definition of done

- [ ] `ref` declared on the listed components; `pnpm exec vp run -r check` green.
- [ ] The ref-parity guard fails on `757e6cc8` and passes after.
- [ ] `docs/HEADLESS.md` gains a "Getting the DOM element" row; `COMPATIBILITY.md` records the
      React floor decision.

---

## WS-3 — ship the reset the layer order already promises

**C12. High → treat as blocker. Mechanism A + E.**

### The defect

`packages/tokens/src/layers.css:12` documents the first layer as:

```
cascivo.reset      consumer reset (box-sizing, margin/padding zeroing) — the floor
```

**Nothing ever writes into it.** No rule in `@cascivo/tokens`, `@cascivo/themes` or
`@cascivo/react` sets a global `box-sizing`; only 6 of 132 component stylesheets set it on their
own root. Meanwhile `textarea.css` is `width: 100%` + `padding-inline: space-4` +
`padding-block: space-3` + `1px` border — 34px wider than its container under the browser default
`content-box`.

The reporter measured a textarea overhanging the viewport by 25px, which pushed a horizontal
scrollbar, which made the document 16px taller than the viewport, which produced a *second*
vertical scrollbar beside `AppShell`'s own. **A consumer who follows getting-started exactly and
writes no CSS at all gets two stray scrollbars**, and every instinct says "my layout is broken".

This survived because of Mechanism E: `apps/site`, `apps/storybook` and every example app ship
their own reset in app CSS. No surface the repo renders has ever hit the browser default.

Mechanism A is the other half: the requirement is stated *only* in a comment inside a file nobody
imports for prose.

### Spec

1. New `packages/tokens/src/reset.css`, minimal and non-negotiable — this is a floor, not an
   opinion:

   ```css
   @import './layers.css';

   @layer cascivo.reset {
     *,
     *::before,
     *::after {
       box-sizing: border-box;
     }

     body {
       margin: 0;
     }
   }
   ```

   Nothing else. No `line-height`, no list/heading zeroing, no `img { display: block }` — those
   are opinions and belong to the consumer. `@cascivo/themes/base.css` already owns the `html`
   font/color floor in `cascivo.base`, and must not be duplicated here.

2. Import it from the aggregate entry points so it arrives by default with zero extra steps:
   - `packages/themes/src/all.css` — first import, before `base.css`
   - each `packages/themes/src/<theme>.css` (they already self-import tokens for standalone use)
   - `@cascivo/react`'s aggregate `dist/styles.css` (prepended alongside the layer statement)
   - the `@cascivo/tokens` root export (`packages/tokens/src/index.css`)
3. Export it addressably too: `"./reset.css": "./src/reset.css"` in `packages/tokens`'s exports
   map, so a consumer who wants *only* the floor can take it.
4. **Opt-out is the layer, and it already works.** Anything in `cascivo.reset` loses to every
   other cascivo layer and to all unlayered author CSS, so a consumer's own reset simply wins.
   State this explicitly in `docs/CSS-LAYERS-PITFALL.md` and `docs/THEMING.md` — it is the reason
   shipping a reset is safe, and the reason not shipping one was never justified.
5. Belt and braces: add `box-sizing: border-box` to the root rule of every component that sets
   `width: 100%`/`inline-size: 100%` **and** padding or a border. Six components already do this,
   which shows the intent existed. This makes the components correct even for a consumer who
   imports per-component CSS only and skips the aggregate.

### Guard

Two, both new:

- `scripts/checks/reset-floor.test.ts` (source-text, in `pnpm ready`): every documented layer in
  `layers.css` that the prose describes as carrying rules must actually receive at least one
  declaration from a shipped stylesheet. Today `cascivo.reset` is the only violator; the guard
  generalises so the next reserved-but-empty layer fails immediately. This is the direct
  Mechanism-A fix: the comment becomes a checked claim.
- A `box-sizing` case in the WS-13 **bare-page** fixture (§WS-13): render a `Textarea` inside a
  fixed-width container with **no app CSS at all**, assert
  `document.documentElement.scrollWidth === clientWidth`. That is the assertion that reproduces
  the reporter's scrollbar, and it is exactly the assertion `computed:check` cannot make today
  because it mounts into a styled 640px box.

### Definition of done

- [ ] Bare-page fixture reproduces the horizontal scrollbar on `757e6cc8`.
- [ ] `reset.css` ships and is reachable from every documented entry path.
- [ ] Fixture green; `reset-floor` guard green and wired into `pnpm ready`.
- [ ] `pnpm layers:check` / `pnpm unlayered:check` still green.
- [ ] `docs/GETTING-STARTED.md` states the reset arrives automatically and how to opt out.

---

## WS-4 — closed popover panels must not be laid out

**C13. Blocker. Mechanism E.**

### The defect

The browser's UA rule `[popover]:not(:popover-open) { display: none }` hides a closed popover.
It is a **UA-origin** rule, so *any* author `display` declaration in the base rule beats it. Two
shipped components do exactly that:

- `packages/components/src/multi-select/multi-select.module.css:93` — `.panel { … display: flex; … }`
- `packages/components/src/sheet/sheet.module.css:9` — `.sheet { … display: flex; … }` (`popover="manual"`)

A closed panel therefore keeps its box. `opacity: 0` renders nothing, `pointer-events` stays
`auto`, and the reporter measured — on a bare page containing **only** a `MultiSelect` and a
`<Button>` beneath it:

```
:popover-open false · display flex · opacity 0 · pointer-events auto · height 214px
document.elementFromPoint(<centre of button>)  →  input._search_…
clicking the button                            →  times out, never fires
```

An invisible ~214px rectangle swallows every click below the control. Screenshots look perfect;
there is no console output. It presents as "my button randomly stopped working".

**Audited the whole family** (12 components carry a `popover` attribute). Only those two are
affected. `header-panel.module.css:16-22` already does it right — base `display: none`,
`&:popover-open { display: flex }`. The other nine set no base `display` and inherit the UA rule
correctly. So this is two files, and a guard so it stays two files at zero.

### Spec

Move the `display` into the open state, matching `header-panel`:

```css
/* multi-select.module.css .panel */
- display: flex;
  flex-direction: column;
  /* … */
  &:popover-open {
+   display: flex;
    opacity: 1;
    translate: 0 0;
  }
```

Same shape for `sheet.module.css .sheet`. `display` is already listed in both components'
`transition` with `allow-discrete`, which exists precisely so a popover can animate out of
`display: none` — so the exit animation survives. **Verify that**, don't assume it: the
acceptance test below checks both the click-through and the transition.

Do **not** ship the blunt `@layer cascivo.override { [popover]:not(:popover-open) { display: none } }`
the reporter used as a workaround. It is correct for an app but wrong for a library: it would
override a consumer's own deliberate `display` on their own popovers.

### Guard

`scripts/checks/popover-hidden.test.ts`, new, source-text, in `pnpm ready`:

> For every element in `packages/components/src/**/*.tsx` that carries a `popover=` attribute,
> resolve its `styles[...]` class and parse the corresponding rule in the sibling
> `*.module.css`. If the base rule declares `display` with any value other than `none`, the
> component must also declare `&:not(:popover-open) { display: none }`. Otherwise: fail, naming
> the file, the class, and the one-line fix.

Plus a browser case in the WS-13 bare-page fixture: mount a closed `MultiSelect` with a `<Button>`
directly beneath it, assert `document.elementFromPoint(<button centre>)` **is** the button. This
is the assertion shape `computed:check` needs and does not have — it currently mounts one
component at a time, so nothing is ever underneath anything.

### Definition of done

- [ ] Guard fails on `757e6cc8`, naming `multi-select` and `sheet`.
- [ ] Both fixed; guard green; wired into `pnpm ready`.
- [ ] Bare-page fixture asserts click-through for `MultiSelect` **and** `Sheet`.
- [ ] Exit transition verified in the browser fixture (panel still animates out).
- [ ] `pnpm apg:check` and the overlay component tests still green.

---

## WS-5 — layout papercuts with stable escape hatches

**C14, C15. Medium / low.**

### C14 — `AppShell`'s nav wrapper shrinks under wide content

At `min-width: 64rem`, `app-shell.module.css:102-107` makes `.navWrapper` `position: static;
inline-size: 18rem` inside `.body { display: flex }` (`:21-26`). `.main` correctly carries
`min-inline-size: 0` (`:87-91`), but the wrapper is left at the flex default `flex-shrink: 1`
with `min-width: auto` — so when a page's content is intrinsically wide, **the sidebar gives way**,
not the content. The `SideNav` inside keeps its own `inline-size` and overflows its shrunken
wrapper, so nothing looks broken; the page is just wider than every other page in the app.
Measured at a 1700px viewport: one view's `navWrapper` was 268px against 288px on eight others.

**Fix:** `flex-shrink: 0` on `.navWrapper` in the desktop block. The sidebar has a fixed width by
design; there is no case where shrinking it *while its own child overflows* is wanted.

Do not "fix" this by adding `min-width: 0` to `.main` — `.main` is not the element giving way,
and the reporter confirmed that change does nothing.

### C15 — `Modal`'s body has no rhythm

`modal.module.css:148-150` — `.body { padding: var(--cascivo-space-6) }`. Three `Field`s and a
submit button — the obvious content for a dialog — render flush against each other at 0px gap.
`Field` is right to own no outer margin; the container should space its siblings.

**Correction to the report:** it claims `Drawer` already does this. It does not —
`drawer.module.css:186-190` is `padding` + `overflow-y` + `flex: 1`, also with no gap (the
`gap: space-4` at `:128` is a different region). So the papercut is real and the two components
*agree* — they are both wrong.

**Fix both**, and make the value a component token so a consumer can flatten it:

```css
.body {
  display: flex;
  flex-direction: column;
  gap: var(--cascivo-dialog-body-gap, var(--cascivo-space-5));
  padding: var(--cascivo-space-6);
}
```

Apply to `Modal`, `Drawer`, `Sheet`, and `AlertDialog` so the dialog family is consistent. Check
each component's existing tests and stories for content that assumed `display: block` (a
full-bleed table or image inside a body would now be a flex item) — this is a visual change, so
it needs a story diff, not just a green test run.

While there: add the **`footer` slot** the reporter asks for. Dialog actions want a right-aligned
row separated from the fields, and today every consumer hand-rolls it. `Modal` and `Drawer` both
need it; mirror whatever `AlertDialog` already does if it has one.

### C14/C15 shared: stable hooks

The reporter's workaround for C14 was
`div:has(> div > nav[aria-label='…']) { flex-shrink: 0 }` — "unpleasant precisely because the
wrapper is not addressable". Every composite component in the catalog has this problem: internals
carry only hashed CSS-module class names.

**Spec:** stamp stable `data-cascivo-*` attributes on the structural elements of composite
components, starting with the ones an adopter has actually needed:
`data-cascivo-appshell-nav`, `data-cascivo-appshell-main`, `data-cascivo-modal-body`,
`data-cascivo-modal-footer`, `data-cascivo-drawer-body`. Document them as a **supported public
surface** in a new `docs/STYLING-INTERNALS.md`, and list each component's hooks in its manifest
so they reach `registry.json`, the `llms/*.md` files, and the docs site by regeneration.

This is the generalisable answer to a whole class of reports (C14 here; `LogViewer`'s
`role="log"` hack and C18's missing `data-x` are the same complaint). Getting it wrong is
expensive — these become API — so scope it to the five above in this plan and let the manifest
field carry future ones.

### Guard

- Manifest field `styleHooks?: string[]`; `meta:check` gains a parity direction asserting every
  `data-cascivo-*` attribute in a component's TSX appears in its manifest and vice versa.
  (Mechanism-A shape: the hook is only a contract if it is checked.)
- Browser case in the WS-13 fixture: render `AppShell` at 1700px with an intrinsically-wide
  child, assert the nav wrapper's width is identical to a narrow page's.

### Definition of done

- [ ] `flex-shrink: 0` on `.navWrapper`; width-parity assertion green.
- [ ] Dialog-family body gap + footer slot; stories re-shot and reviewed.
- [ ] Five `data-cascivo-*` hooks shipped, manifested, documented, guarded.
- [ ] `pnpm regen` committed; `pnpm meta:check` green.

---

## WS-6 — theming contracts that hold

**C4, C5. High. Mechanism C (C4).**

### C4 — `all.css` contains 2 of 12 themes

`packages/themes/src/all.css:15-20` imports `light.css` and `dark.css`. `packages/themes/src/`
ships twelve themes. `GETTING-STARTED.md` says "For light and dark support: import
`@cascivo/themes/all.css`" and then, a few lines later, lists all twelve. Set
`data-theme="cyberpunk"` with only `all.css` loaded and every `--cascivo-color-*` is unresolved;
the reporter watched the accent stay `oklch(0.7 0 0)` until `cyberpunk.css` was imported, at which
point it became `oklch(0.7 0.25 330)`.

Two facts ("the common bundle" and "the complete set") are stated by one name. Mechanism C.

**Spec — one owner per fact, so pick explicit names and retire the ambiguous one:**

| Specifier | Contains | Status |
| --- | --- | --- |
| `@cascivo/themes/light-dark.css` | tokens + base + light + dark | **new** — today's `all.css` content, honestly named |
| `@cascivo/themes/all.css` | tokens + base + **all twelve** | **redefined** — the name becomes true |
| `@cascivo/themes/<name>.css` | one theme, self-contained | unchanged |

Redefining `all.css` rather than only renaming means an existing consumer's import keeps working
and starts doing what they assumed. It costs bundle size for anyone who wanted light+dark and did
not migrate — so:

- `getting-started` and every scaffold/template switch to `light-dark.css`.
- The 0.14.0 CHANGELOG and `docs/UPGRADING.md` carry a **"`all.css` now includes all twelve
  themes — import `light-dark.css` for the previous behaviour"** entry. This is a size regression
  for the unmigrated; say so in the release notes, plainly, with the byte delta measured.
- `@cascivo/react/styles.css` keeps bundling **light + dark only** — it is the "just works"
  aggregate and must not grow 6×. Its TSDoc and the docs must say which two it carries.

Alternative considered and rejected: rename to `light-dark.css` and delete `all.css`. Cleanest
semantics, but it breaks every existing install for a naming problem — not worth it at 0.x when
redefinition also makes the name true.

### C5 — `setTheme()` silently no-ops with no provider

`packages/react/src/theme.tsx:101-103`:

```ts
export function setTheme(next: string): void {
  themeStore().value = next
}
```

Only `ThemeProvider` writes `data-theme`, inside a `useSignalEffect`. Call `setTheme()` without
one and it returns cleanly, the signal updates, `useTheme()` reports the new value — and the
attribute never changes. There is **no warning**, unlike the excellent missing-theme-CSS warning
15 lines above it in the same file.

**Spec — do both, they answer different failures:**

1. **Dev warning.** `ThemeProvider` sets a module-level `providerMounted` flag in its
   `useSignalEffect`. `setTheme` (and `useTheme`'s setter) checks it on first call: if false,
   emit a deduped `console.warn` in the same voice as `warnIfThemeUnstyled` — name the symptom
   ("the theme signal updated but `data-theme` was not written, so nothing will restyle"), the
   fix (wrap the app in `<ThemeProvider>`), and both the online and offline docs links.
   `warnIfThemeUnstyled` (`theme.tsx:32-56`) is the template: dev-only via `isDev()`, deduped via
   a module `Set`, deferred a frame, no-op on the server.
2. **Escape hatch.** Export `applyTheme(theme, target = document.documentElement)` that writes the
   attribute directly, for imperative/no-provider setups (a theme toggle in a non-React shell, a
   pre-hydration inline script). Document it in `THEMING.md` next to the provider.

Do **not** make `setTheme` itself write the DOM. It is SSR-callable and provider-scoped by design
(`ThemeProvider` can target any element, not just `<html>`); a direct write would break scoped
theming and touch `document` on the server.

### Guard

- `packages/react`'s test suite: a case asserting `setTheme` with no mounted provider warns
  exactly once, and a case asserting no warning when a provider is mounted. The reporter's own
  `integration.test.tsx` is the model.
- `scripts/checks/theme-bundle.test.ts`, new: derive the theme list from
  `packages/themes/src/*.css` and assert `all.css` imports **every** one and `light-dark.css`
  imports exactly light + dark. The Mechanism-C fix — the filesystem owns the fact, the bundle
  is checked against it, and a thirteenth theme cannot silently miss the bundle.

### Definition of done

- [ ] `light-dark.css` added, `all.css` complete, exports map + `pkg-exports` guard green.
- [ ] `theme-bundle` guard fails on `757e6cc8`, passes after, wired into `pnpm meta:check`.
- [ ] Provider-missing warning + `applyTheme`; both tested.
- [ ] `GETTING-STARTED.md`, `THEMING.md`, `UPGRADING.md`, CHANGELOG updated; measured byte delta
      in the release notes.

---

## WS-7 — the charts contract

**C11, C16, C17, C18.** Four findings, one theme: charts are a second-class citizen of the
package family.

### C11 — `@cascivo/charts` never imports its own stylesheet. **Mechanism C.**

`@cascivo/react` auto-loads styling through per-component CSS side-effect imports, so consumers
import nothing. `@cascivo/charts` ships one `dist/charts.css` that `dist/index.js` never imports
— `packages/charts/src/index.ts` mentions `@cascivo/charts/styles.css` **only inside a JSDoc
block** (line 7) — even though `package.json:29` declares the same `sideEffects: ["**/*.css"]`,
implying the same mechanism. Charts render unstyled, with no warning, until you find the
specifier in the exports map. Two packages in one family with opposite CSS contracts.

**Spec:** self-import. Add `import './charts.css'` (or whatever the built entry resolves to) at
the top of `packages/charts/src/index.ts` so the contract matches `@cascivo/react`. Keep
`./styles.css` exported for SSR setups that must load it separately — that is exactly the shape
`@cascivo/react` already has, so the family becomes consistent in both directions.

Verify against the SSR path before landing: `pnpm ssr:check` exists because a bare Node ESM
loader throws `Unknown file extension ".css"` on a side-effect import. `@cascivo/react` already
lives with this via `ssr.noExternal`; charts must document the identical requirement, not
discover it in the next report.

**Guard:** `scripts/checks/css-contract.test.ts`, new — every published package that declares
`sideEffects: ["**/*.css"]` **and** ships a stylesheet must import it from its entry, or be
allowlisted with a stated reason. Mechanism-C fix: one rule, both packages checked against it.

### C16 — `LineChart` has no x-axis formatter

`line-chart.tsx:147` — `secondAxis?: { label?: string; format?: (value: number) => string }` is
the only formatter, documented as being for the right y-axis. `:285-288` passes `xTicks` to `Axis`
with no `format`. `AxisProps.format?: (value: number | string | Date) => string` already exists —
it simply is not threaded through.

Feed a plain number (epoch ms — the natural shape for a time series) and the tick label is
`1,785,217,000,000`. Pass a `Date` and the axis switches to a time scale and renders `7/28/2026` —
fixed format, not configurable, so every 5-minute bucket collapses to the same label, which is
*worse* than the epoch number because at least those were distinguishable.

The reporter abandoned `LineChart` for bucketed series entirely.

**Spec:** add `format?: (value: number | string | Date) => string` to `LineChartProps`, threaded
to the x `Axis` at `:564`, mirroring what `secondAxis.format` does on the right. Audit every other
chart that renders an `Axis` (`AreaChart`, `ScatterChart`, `ComboChart`, `BarChart`, `Histogram`,
`Candlestick`, …) for the same gap and fix them in one pass — one chart having it and eleven not
is how this class of report repeats.

**Guard:** extend `scripts/checks/props-parity.test.ts` with an **axis-prop parity** direction:
every chart that composes `Axis` must surface `Axis`'s public formatting props on its own props
interface, or be allowlisted. Mechanism-D shape: the capability exists on the primitive and never
reaches the surface an adopter reads.

### C17a — `yTicks` yields fractional ticks on small integer domains

`engine/scale.ts:23-40`, `niceTicks`:

```ts
const rawStep = (max - min) / Math.max(1, count)
const step = (candidates.find((c) => c >= mantissa) ?? 10) * magnitude  // [1, 2, 2.5, 5, 10]
```

`max=1, count=2` → `rawStep 0.5` → `step 0.5` → `[0, 0.5, 1]`. The reporter's table:

```
max=1,  yTicks=2  → [0, 0.5, 1]                  ← fractional
max=1,  yTicks=5  → [0, 0.2, 0.4, 0.6, 0.8, 1]   ← fractional
max=2,  yTicks=5  → [0, 0.5, 1, 1.5, 2]          ← fractional
max=7,  yTicks=5  → [0, 2, 4, 6]                 ✓
max=20, yTicks=5  → [0, 5, 10, 15, 20]           ✓
```

Requesting more ticks than the domain's integer range can support **subdivides instead of
clamping** — the exact case an incident-count chart hits constantly. The naive fix
`yTicks={max + 1}` lands on the fractional case at `max=1`. Their workaround is an `integerTicks()`
helper with an empirical `max <= 6` cutoff.

**Spec:**

1. `niceTicks` gains an `allowDecimals` option, defaulting to **`true`** (no behaviour change for
   continuous data). When `false`, the candidate step set is filtered to integers and the step is
   floored at 1, so the tick set can never be finer than the data's own unit.
2. Charts expose `allowDecimals?: boolean` on their props — the name every other charting library
   uses for this knob, so it is guessable.
3. **Auto-detect.** When every value in the value domain is an integer and no explicit
   `allowDecimals` is given, default to integer ticks. This is what the reporter expected and it
   is right far more often than not. Gate it on the *data*, never on the domain size — the `<= 6`
   cutoff in their workaround is a symptom, not a rule.
4. Never emit more ticks than the integer domain can hold: clamp the effective count to
   `max - min` when integer-stepping.

**Guard:** a table-driven unit test over `niceTicks` covering the reporter's exact ten rows plus
the auto-detect cases. Deterministic, fast, and it is the regression test this needs.

### C17b — `xTicks`/`yTicks` swap with `orientation`; `xLabelEvery` does not. **Mechanism B.**

`bar-chart.tsx:190/198` — the value scale takes `yTicks` when vertical and `xTicks` when
horizontal: the props follow **screen position**. `:320-321` — `xLabelEvery` always strides
`categories`: it follows the **data field**. Confirmed by the reporter: on a horizontal chart with
domain max 1, `yTicks={1}` does nothing and `xTicks={1}` gives `[0, 1]`; separately, four
categories render only "alpha" and "delta" until `xLabelEvery={1}` is passed.

So a fully-labelled horizontal chart needs `xTicks` **and** `xLabelEvery` together — one prop
chasing the screen axis, the other the data field — with nothing in the types to suggest either
rule. This is Mechanism B: the prop's meaning is inferred from a proxy (where it happens to be
drawn) rather than from its role.

**Spec:**

1. Add role-named props: **`valueAxisTicks`**, **`categoryAxisTicks`**, **`categoryLabelEvery`**.
   These never swap. They are the documented, recommended form.
2. Keep `xTicks`/`yTicks`/`xLabelEvery` working with today's exact semantics — this is a chart
   library at 0.x, but silently changing what an existing prop means is worse than a second name.
   Mark them `@deprecated` in TSDoc pointing at the role-named form; do not remove in this plan.
3. When both a screen-named and a role-named prop are supplied for the same axis, the role-named
   one wins and a dev-warn fires naming the conflict.
4. Document the swap explicitly next to `orientation`, and cross-reference from `xTicks`,
   `yTicks` and `xLabelEvery`, so anyone on the old names finds the rule.

**Guard:** a `bar-chart` contract test asserting, for both orientations, that the role-named props
control the axis their name says — and that `xLabelEvery`'s legacy behaviour is unchanged. Add the
deprecation to `vocabulary.test.ts`'s vocabulary so no new component gains a screen-named axis
prop.

### C18 — no per-bar colour in a single-series categorical `BarChart`

`bar-chart.tsx:26` — `BarChartSeries.color?: string`, per series. Fine for multi-series; broken
for the common case of one series whose categories each carry meaning (incident counts by
severity, where SEV1 should read as danger regardless of which bar is tallest).

The obvious workaround **renders wrong**: four single-point series with `mode="grouped"` produce
overlapping bars (SEV1 `[64, 144]` vs SEV2 `[80, 160]` — 64px overlap on an 80px bar) and only the
first series' category label on the axis. Padding every series to the full category domain fixes
both but quarters each bar's width.

CSS was the next idea and also fails: each bar's `<rect>` carries `data-series` (`:424-438`) but
no `data-x`, and each sits alone in a bare `<g>`, so `rect:nth-of-type(n)` matches every bar at
`n=1` and none at `n≥2`. The only distinguishing selector is position among sibling `<g>`s — an
implementation detail that breaks the moment `annotations` add a sibling.

The reporter reshaped the panel into a single stacked bar to get per-segment colour, losing the
four-column form.

**Spec — both halves:**

1. `BarChartSeries.color?: string | ((datum: Datum, index: number) => string)`. Resolve at the
   three existing `s.color ?? COLORS[…]` sites (`:259`, `:345`, `:364`, `:496`) through one helper
   so the fallback stays identical. Apply the same accessor shape to the other categorical charts
   that have the identical limitation (`PieChart` slices, `Funnel` stages, `RadialBar`) — audit
   before scoping.
2. Independently, stamp **`data-x={String(datum.x)}`** on every bar `<rect>` alongside the existing
   `data-series`, and register both in the component's `styleHooks` manifest field (WS-5). That
   gives CSS a real hook and closes the general complaint, not just the colour case.

**Guard:** a rendering test asserting each `<rect>` carries a `data-x` matching its category, and
that a function `color` produces distinct fills per datum. Plus the `styleHooks` manifest parity
from WS-5.

### Definition of done (WS-7)

- [ ] `css-contract` guard fails on `757e6cc8`, passes after; charts self-import; SSR path
      documented and `pnpm ssr:check` green.
- [ ] `format` threaded on every axis-composing chart; axis-prop parity guard green.
- [ ] `niceTicks` table test covers all ten reporter rows; auto-detect verified.
- [ ] Role-named axis props + deprecations + conflict warning + contract test.
- [ ] Per-datum `color` accessor + `data-x` on bars, manifested.
- [ ] `pnpm regen` committed; chart manifests and `docs/CHART-LIBRARIES.md` updated.

---

## WS-8 — `PopoverTrigger asChild` must do something

**C19. Medium. Mechanism A — and this one is a one-line fix.**

`packages/components/src/popover/popover.tsx:23` declares `asChild?: boolean`. Line 26
destructures `{ children }` and **never reads `asChild`**. Lines 34-44 always render the
component's own `<button>`. So:

```html
<button aria-expanded="false" aria-haspopup="dialog" class="_trigger_…">
  <button aria-label="Theme: light" class="_iconButton_…">…</button>
</button>
```

Interactive content cannot nest — invalid HTML, and a genuine a11y defect: the inner button's
`aria-label` is precisely the accessible name a screen reader needs, orphaned on an element the
accessibility tree does not expect inside a button. The reporter diffed `outerHTML` with and
without the prop: **byte-identical**.

`Slot` already exists in `packages/core/src/slot.tsx` and **seven** components use it correctly
(`Button`, `IconButton`, `Link`, `Label`, `Item`, `Tile`, `ContainedList`). `Popover` is the one
that declared the prop and never wired it.

### Spec

```tsx
const Comp = asChild ? Slot : 'button'
```

with the trigger's `ref`, `type`, `aria-expanded`, `aria-haspopup`, `style`, `onClick` and
`className` passed through `Comp` — matching `icon-button.tsx:52-56` exactly, including its
`type={asChild ? undefined : 'button'}` handling (a slotted `<a>` must not get `type`).

Then **audit the whole catalog** for the same shape: a prop declared in an exported interface and
never read in the implementation. That is a mechanical check and it is the real deliverable here —
C19 is one instance.

### Guard

`scripts/checks/dead-props.test.ts`, new, source-text, in `pnpm ready`:

> For every exported `…Props` interface, every declared prop must appear as an identifier
> somewhere in the component's implementation (destructured, spread-consumed, or read). A prop
> that is declared and never referenced fails, naming file and prop.

Spread-through props (`...rest`) need care — the guard must recognise a rest element as consuming
the remainder, and allowlist the interfaces that extend a DOM attribute type. Scope it precisely
rather than loosely; a noisy guard gets allowlisted into uselessness.

Also extend `scripts/checks/aschild-docs.test.ts`: it already derives the `asChild` component set
from source and requires a row in `USING-WITH-A-ROUTER.md`. It passed for `Popover` because
`Popover` *declares* the prop. Add the assertion that every component in that set actually
references `Slot` — closing the exact hole that let a documented, guarded, non-functional prop
ship.

### Definition of done

- [ ] `PopoverTrigger asChild` renders the child with merged props; `outerHTML` diff test proves
      no nested `<button>`.
- [ ] `dead-props` guard fails on `757e6cc8` naming `PopoverTriggerProps.asChild`; green after.
- [ ] `aschild-docs` gains the `Slot`-reference assertion.
- [ ] `pnpm apg:check` green; `USING-WITH-A-ROUTER.md` row for `PopoverTrigger` verified accurate.

---

## WS-9 — the `preact/compat` ref difference

**C9. Medium. Root cause identified.**

Opening and closing a `Dropdown` under `preact/compat` on plain Vite throws
`Uncaught TypeError: u.current?.focus is not a function`. Isolated to `Dropdown` — `CommandMenu`,
`Modal`, `Drawer`, `Popover`, `Tooltip` and `Toast` are clean; React with identical source throws
nothing. The *behaviour* survives (focus does return to the trigger), so it is a console error,
not a functional break — but it fires on every dropdown interaction and any developer evaluating
cascivo with devtools open will attribute it to the library.

### Root cause

`dropdown.tsx:163-170`:

```tsx
const renderedTrigger = cloneElement(triggerEl, {
  ref: composeRefs(triggerRef, triggerEl.props.ref),
  …
})
```

`Dropdown` accepts an **arbitrary `trigger` ReactElement** from the consumer and clones a ref onto
it. When that element is a *function component* (the normal case — `<Button>`), React 19 forwards
`ref` as an ordinary prop, the component spreads it onto its host element, and `triggerRef.current`
is the DOM node. Under `preact/compat`, a ref on a function component resolves to the **component
instance**, so `triggerRef.current` has no `.focus`, and `:118` / `:149` throw.

Every component that clones a consumer-supplied element and then calls a DOM method on the
resulting ref has this bug latent. Audit list from source:
`dropdown.tsx:163`, `tooltip.tsx:98`, `app-shell.tsx:127`, `field.tsx:103`, `radio.tsx:76`,
`packages/core/src/presence.tsx:76`, `packages/core/src/slot.tsx:61`. Of those, the ones that then
call `.focus()` on the ref are the live defects.

### Spec

1. Add `focusElement(target: unknown): boolean` to `@cascivo/core` — resolves a ref value to a
   focusable element (`instanceof HTMLElement` → itself; otherwise a `base`/`_dom` lookup for the
   `preact/compat` instance shape, guarded and typed), calls `focus()`, returns whether it
   succeeded. One implementation, one place to fix the next runtime difference.
2. Replace all 16 `…Ref.current?.focus()` call sites (listed in the source audit:
   `multi-select:65`, `alert-dialog:58`, `menubar:131`, `tags-input:57`, `header-panel:53`,
   `fab:91`, `search:142`, `side-nav:291`, `navigation-menu:149`, `dropdown:118`,
   `dropdown:149`, `command-menu:300/385/550`, `menu-button:82`, `combobox:134`). Most of these
   ref their *own* host element and are already safe — replacing them all anyway costs nothing
   and removes the need to reason about which is which on every future edit.
3. Where the ref is attached via `cloneElement` onto a consumer element, prefer `composeRefs` with
   a **callback** that stores only when the value is an element, so `.current` is never an
   instance in the first place. Belt and braces with (1).

### Guard

`packages/components` already has `charts-preact-compat.test.tsx` as precedent. Add a
`preact-compat` suite for the interactive family — `Dropdown`, `Menu`, `MenuButton`,
`OverflowMenu`, `Menubar`, `NavigationMenu`, `SideNav`, `Combobox`, `MultiSelect`, `CommandMenu` —
that opens and closes each under `preact/compat` with `console.error`/`window.onerror` asserted
empty. The reporter notes the untested siblings explicitly; this closes them all at once.

**Why this is worth doing beyond the console noise:** the reporter measured the same app at
**60 KB gzip on Preact versus 110 KB on React**, with `DataTable`, `Timeline`, `SegmentedControl`,
`CommandMenu`, `Modal`, `Drawer`, `Popover`, `Tooltip` and `Toast` all behaving identically. One
console error is the only thing standing between a Preact consumer and halving their JS — which is
a strong story for a design system that markets itself as CSS-native and lightweight.

### Definition of done

- [ ] `focusElement` in `@cascivo/core`, documented in `HEADLESS.md` (required by
      `primitive-docs:check`).
- [ ] All 16 call sites migrated.
- [ ] `preact-compat` suite covers 10 components, fails on `757e6cc8` for `Dropdown`, green after.
- [ ] `pnpm primitives:check` and `pnpm meta:check` green.

---

## WS-10 — tell the truth about Astro and Preact-under-SSR

**C2, C3. Blocker (Astro) / blocker (Astro+Preact).**

### C2 — per-component CSS is dropped for SSR'd Astro islands

`dist/button/button.module.js` carries `import './button.css'` as a side effect. Whether that CSS
reaches the page depends entirely on the Astro client directive:

| Directive | Component CSS emitted | Result |
| --- | --- | --- |
| `client:load` / `client:visible` (SSR'd island) | **none** | renders unstyled |
| `client:only` | 58 KB, only what is used | correct |

Under `client:load` the hashed class names survive but no CSS file is emitted — markup carries
`class="_button_131qn_2"` with no matching rule anywhere. `sideEffects: ["**/*.css"]` is set
correctly and does not help. Nothing warns. It reads as a theming problem, which sends you down
the wrong path entirely. The workaround — import the aggregate `@cascivo/react/styles.css` —
works but ships 308 KB for all 481 components when the page uses a dozen (461 KB total versus 234
KB on the `client:only` path).

**On plain Vite the problem does not exist** — 57 KB of per-component CSS, no configuration. The
reporter migrated off Astro and CSS went from 461 KB (48 KB gzip) to 238 KB (18 KB gzip).

Meanwhile `docs/COMPATIBILITY.md:17` lists **Astro ✅ Yes** with the note "Works as a React island;
import CSS in a shared layout" and no qualifier — and the majority of Astro islands in the wild are
`client:load`.

### C3 — the Preact guide is CSR-only and does not say so

`docs/USING-WITH-PREACT.md` claims two production migrations confirm "components render, signals
update, interactions fire, with zero runtime errors" at ~75 KB. That guide covers **only**
client-rendered Vite + Preact. It never mentions SSR or prerendering, and the Vite-SSR guide never
mentions Preact. `COMPATIBILITY.md:16` lists Preact ✅ "Verified in production", unqualified.

Under Astro 6.4.8 with `@astrojs/preact({ compat: true })` the build dies with
`TypeError: Cannot read properties of null (reading 'useRef')` from `@preact/signals-react`'s
runtime inside `renderToStaticMarkup`. The reporter traced three stacked causes — an upstream
`@astrojs/preact` dead-code branch, cascivo's `vite.ssr.noExternal` advice not reaching Astro's
separate `prerender` environment, and `@preact/signals-react` needing to be inlined too (cascivo's
docs list only `/^@cascivo\//`) — and fixing all three still fails, because Astro's identity
aliases `/^react$/ → react` are registered ahead of the compat aliases and win.

**Preact itself is fine.** The same components in a plain Vite + `@preact/preset-vite` SPA behave
identically to React at 60 KB gzip versus 110 KB. The guide is accurate for the configuration it
describes — it just does not say which configuration that is.

### Spec

This is the workstream most at risk of being "fixed" by editing a table. It is not done until the
matrix is **derived from something executable**.

1. **Reproduce C2 first.** Add `apps/examples/astro-islands` — a minimal Astro app rendering the
   same six components three times: `client:load`, `client:visible`, `client:only`. Its build
   asserts, for each directive, that the emitted CSS contains a rule for a class present in the
   emitted HTML. This turns "Astro ✅" from prose into a test. Expect it to **fail on `client:load`
   today** — that failing state is the deliverable of step 1.
2. **Then attempt the real fix.** Astro's SSR island build is dropping a side-effect CSS import
   from a dependency. Investigate in this order: (a) is `@cascivo/react` externalised in Astro's
   island build, so Vite never sees the `import './button.css'` at all? (b) does adding
   `@cascivo/*` to Astro's `vite.ssr.noExternal` **and** its prerender environment fix it? (c) is
   an upstream Astro bug the true cause? If (b) works, that config line is the fix and it belongs
   in a new `docs/USING-WITH-ASTRO.md` **and** in a `cascivoAstro()` integration shipped from the
   CLI package, so a consumer never has to know. If (c), file upstream with the repro from step 1
   and ship (b) as the documented workaround.
3. **Grade the matrix honestly, now.** Until step 2 lands, `COMPATIBILITY.md` says:

   | Framework | Supported | Notes |
   | --- | --- | --- |
   | Astro (React islands) | ⚠️ **Partial** | `client:only` ✅. `client:load`/`client:visible` drop per-component CSS — import `@cascivo/react/styles.css` in a shared layout (+308 KB). See `USING-WITH-ASTRO.md`. |
   | Preact 10 (`preact/compat`) | ✅ **CSR only** | Verified on Vite CSR (`@preact/preset-vite`). **Not verified under SSR/prerender**; known to fail under Astro's compat aliasing. See `USING-WITH-PREACT.md`. |

   The reporter's own words: *"One sentence would have saved a day here."*
4. `USING-WITH-PREACT.md` gets a **Scope** block as its first section — verified configuration,
   measured numbers, and the explicit non-claim about SSR — plus a "Known: Astro" section
   documenting all three causes and the alias-ordering wall, so the next person does not re-derive
   a day of work.

### Guard

`scripts/checks/framework-matrix.test.ts`, new: every framework row in `COMPATIBILITY.md` marked
✅ must name a verifying artifact that exists — an `apps/examples/*` directory or a named CI job —
and every such example must have a corresponding row. A ✅ with no executable behind it fails.
This is the direct Mechanism-A fix for a support matrix, and it is what would have caught "Astro
✅" thirteen versions ago.

### Definition of done

- [ ] `apps/examples/astro-islands` exists and reproduces C2 in CI.
- [ ] C2 fixed, or the workaround shipped as `cascivoAstro()` + documented with its byte cost.
- [ ] Matrix regraded; `framework-matrix` guard green.
- [ ] `USING-WITH-ASTRO.md` written; `USING-WITH-PREACT.md` scoped.
- [ ] `pnpm docs-links:check` / `pnpm meta:check` green.

---

## WS-11 — docs: make the answer findable, and keep it true

**C6, C7, plus two defects found during triage. Mechanism C (C6), D (C7).** This is the workstream
the user's brief singles out: *"If it's a docs issue, make sure this is perfectly documented and
easy to find."* "Easy to find" is a routing and generation problem, not a prose problem.

### 11.1 — C6: the version matrix is thirteen minors stale. **Mechanism C.**

`docs/COMPATIBILITY.md` "Package compatibility" against reality:

| Package | Docs say | Actual |
| --- | --- | --- |
| `@cascivo/react` | 0.2.x | **0.13.0** |
| `@cascivo/core` | 0.1.x | **0.7.0** |
| `@cascivo/themes` | 0.2.x | **0.4.8** |
| `@cascivo/tokens` | 0.2.x | **0.5.5** |
| `@cascivo/icons` | 0.1.x | **0.3.5** |
| `@cascivo/charts` | 0.1.x | **0.7.0** |

The reporter: *"it undermines trust in the rest of the docs."* Correct — and hand-editing it is
how it got here. The repo already has `version-pins.test.ts`, which forbids **pinned install
commands** so snippets can't go stale; the same reasoning was never applied to the matrix.

**Spec:** the matrix becomes **generated**. Add it to `pnpm regen` (a `scripts/compat/generate.ts`
that reads every `packages/*/package.json` `version` + `peerDependencies` and rewrites the table
between marker comments). CI's existing drift check then makes staleness impossible: `pnpm regen`
+ `git diff --exit-code`. Same treatment for any other hand-maintained version table — grep
`docs/**` for `0\.\d+\.x` before finishing.

### 11.2 — C7: `useSignals()` is missing from the path most people follow. **Mechanism D.**

`useSignals()` is correctly documented in the `index.d.ts` header and in `HEADLESS.md`. In
`docs/GETTING-STARTED.md` it appears **once**, at line 260, inside a comment in the *theming*
section — and not at all in "First component" (line 303). Library components call it internally;
components *you* write are not compiled by cascivo's build, so they need it explicitly. Without
it a component reads `signal.value` once and never updates again — no error, no warning.

The reporter calls it *"the single most likely first-day bug for anyone building an app rather
than a page."* The repo agrees: `TROUBLESHOOTING.md:132` is a whole section called "Handlers fire
but the UI never updates". The fix reached the troubleshooting doc and the type header. It never
reached the page a new adopter reads first.

**Spec:**

1. A dedicated `## Reactivity: call `useSignals()` in your own components` section in
   `GETTING-STARTED.md`, **immediately after "First component"**, with a wrong/right code pair,
   the symptom in the adopter's words ("handlers fire, UI freezes"), and a link to the
   troubleshooting section.
2. The first `useSignal` example on the page gains the call inline, so a copy-paste is correct.
3. Same section in the site's `GettingStartedPage.tsx` (they are separate surfaces —
   `docs/GETTING-STARTED.md` is mirrored to `apps/site/public/docs/getting-started.md`; the
   rendered page at `/docs/getting-started` is hand-authored TSX. Both must carry it.)
4. `scripts/llms/generate.ts`'s "Reactivity & state" section must state it in the first three
   lines, since two prior reporters built entire apps from `llms.txt` alone.

**Guard:** `scripts/checks/getting-started-contract.test.ts`, new — a machine-readable list of
facts a first-day adopter must not be able to miss (`useSignals` requirement, theme CSS import,
reset behaviour, `data-theme` wiring), asserted present in **every** getting-started surface:
`docs/GETTING-STARTED.md`, `apps/site/src/pages/GettingStartedPage.tsx`, `llms.txt`, the CLI's
`init` output, and the `@cascivo/docs` bundle. Mechanism-D's structural fix: a fact is not landed
until it is on every surface, and the guard enumerates the surfaces.

### 11.3 — Found during triage: the best error message in the library links to a 404

`packages/react/src/theme.tsx:53` — the missing-theme dev warning, which the reporter singles out
as *"one of the best error messages in the library"*, ends with:

```
Docs: https://cascivo.com/docs/theming — offline: npx -y @cascivo/docs guide theming
```

`apps/site/src/DocsApp.tsx:59-86` has **no `/docs/theming` route**. The site serves the raw
`apps/site/public/docs/theming.md`, so `…/theming.md` resolves — but the URL the warning prints,
without the extension, is a 404. The offline half works.

**Spec:** add rendered site routes for the guides that runtime code and other docs link to, at
minimum `/docs/theming`, `/docs/troubleshooting`, `/docs/compatibility`, `/docs/headless`. Today
**none of them** exists as a page — `docs/TROUBLESHOOTING.md` is the single most useful document in
the repo for a stuck adopter and has no website route at all, and does not appear in the docs
sidebar (`DocsApp.tsx:91-115`). Add them to `exploreItems` too; "Troubleshooting" belongs directly
under "Getting Started".

**Guard:** `scripts/checks/doc-urls.test.ts`, new — extract every `https://cascivo.com/...` URL
from shipped package source, `docs/**`, and `llms.txt`, and assert each resolves to a real static
route in `DocsApp.tsx`/`App.tsx` or a real file in `apps/site/public/`. Runs offline against the
route table, so it is fast and belongs in `pnpm ready`. (`docs-links.test.ts` covers *relative*
links between guides; this is the absolute-URL direction, which is currently unchecked — which is
exactly why a shipped `console.warn` points at a 404.)

### 11.4 — Found during triage: the friction log's own findings need a home

Three of this report's items (C1, C12, C13) will present to future adopters as symptoms long
before they are recognised as cascivo bugs. Add a `TROUBLESHOOTING.md` entry for each, keyed by
**the symptom, not the cause**, because that is what people search:

- "`children` does not exist on type `…Props`" → WS-1
- "The page has a horizontal scrollbar I didn't create" → WS-3
- "A button below a MultiSelect/Sheet doesn't respond to clicks" → WS-4
- "Charts render unstyled" → WS-7 C11
- "`setTheme()` runs but nothing changes" → WS-6 C5

Each entry: symptom verbatim, one-line cause, the fix, and the version it was fixed in. Add these
to the "Quick answers" table at `TROUBLESHOOTING.md:301` as well — that table is the fastest path
in and it should carry every entry.

### Definition of done

- [ ] Version matrix generated by `pnpm regen`; drift check green.
- [ ] `useSignals()` section on all five surfaces; `getting-started-contract` guard green.
- [ ] `/docs/theming`, `/docs/troubleshooting`, `/docs/compatibility`, `/docs/headless` render;
      Troubleshooting in the sidebar under Getting Started.
- [ ] `doc-urls` guard fails on `757e6cc8` (naming `/docs/theming`), green after, in `pnpm ready`.
- [ ] Five symptom-keyed troubleshooting entries + Quick-answers rows.

---

## WS-12 — packaging papercuts

**C8. Low.**

1. **Module-output convention.** `packages/icons/package.json:30-37` ships `.mjs` + `.d.mts`;
   `packages/react/package.json:34-40` ships `.js` + `.d.ts`. Harmless, but it breaks tooling that
   assumes one convention across a package family. `@cascivo/icons` builds with `vp pack` while
   the others use `vp build` + a flatten step — that is the cause. **Spec:** converge on `.js` +
   `.d.ts` (every package is `"type": "module"`, so `.js` is unambiguous), and add the convention
   to `pkg-exports.test.ts` as an assertion.
2. **Per-icon subpaths.** All 445 icons come from one barrel. Tree-shaking **does** work — the
   reporter verified 4 imported icons → 1 SVG path in the bundle. **Spec:** add
   `"./icons/*": "./dist/icons/*.js"` subpath exports anyway, for consumers whose bundler doesn't
   tree-shake well (and for `@cascivo/docs`-driven agents that want a narrow import). Low
   priority; do not block the plan on it.
3. **`Flex` / `Stack` naming — no code change.** `Flex` defaults to `direction="vertical"`, unlike
   CSS `flex-direction` and unlike Chakra/MUI/Radix; `Stack` is an overlap primitive, not a
   spacing stack. Both are deliberate and both are flagged in TSDoc — and the reporter confirms
   the TSDoc caught them *before runtime*, which is the 07-26 plan's WS-1 working exactly as
   intended. **Spec:** add an "If you're coming from Chakra/MUI/Radix" comparison table to
   `docs/MIGRATING-FROM-SHADCN.md` (or a sibling) naming both inversions, so the surprise is
   findable while *choosing* a component rather than while hovering one.
4. **`minimumReleaseAge`.** pnpm's gate tripped on all six cascivo packages because they were
   freshly published; the reporter had to add `minimumReleaseAgeExclude`. Nothing to fix in the
   library — **spec:** one `TROUBLESHOOTING.md` entry so the next person doesn't debug it.

---

## WS-13 — the consumer-shaped fixture, and wiring

**This is the Mechanism-E fix and the reason to sequence it early.** WS-1, WS-3, WS-4 and WS-5
all hang acceptance tests off it. Build it first, use it to *reproduce* the three blockers before
fixing them.

### 13a — `scripts/checks/isolated-install.test.ts` (spec'd in WS-1)

Packs every published package, installs into a scratch app **outside the repo tree** under pnpm's
strict default layout, type-checks with `strict: true` **and `skipLibCheck: false`**.
`pnpm isolated:check`. CI release/nightly tier (it needs a pack + install).

### 13b — `scripts/checks/bare-page.test.ts`

The browser leg that `computed:check` is not. Differences that matter:

| | `computed:check` (exists) | `bare-page` (new) |
| --- | --- | --- |
| Page CSS | shipped `styles.css` inside a `data-theme` div | shipped `styles.css` **and nothing else** — no app reset, no width wrapper |
| Layout | one component in a 640px box | full viewport, `<body>` at browser defaults |
| Composition | one component at a time | **several components, stacked**, so hit-testing is meaningful |
| Asserts | computed property values | computed values **plus** `scrollWidth`, `elementFromPoint`, real clicks |

Cases required by this plan:

- **C12** — `Textarea` in a fixed-width container; `documentElement.scrollWidth === clientWidth`.
- **C13** — closed `MultiSelect` with a `<Button>` beneath; `elementFromPoint(<button centre>)`
  is the button; a real `click()` fires its handler. Same for `Sheet`.
- **C13 regression** — open, then close; the exit transition still runs (guards against a fix that
  kills the animation).
- **C14** — `AppShell` at 1700px with a narrow and an intrinsically-wide child; nav wrapper width
  identical.
- **C15** — three `Field`s in a `Modal` body; gap > 0.

`pnpm bare-page:check`. Needs a prior build; wire next to `computed:check` in CI, and add both to
the `pnpm ready:ci` path.

### 13c — new guards inventory

Every guard this plan introduces, with its tier. **Each must be observed failing on `757e6cc8`
before its workstream is marked done** (§0.3):

| Guard | Catches | Tier |
| --- | --- | --- |
| `isolated-install` | C1 | CI release/nightly |
| `bare-page` | C12, C13, C14, C15 | CI (post-build) |
| `reset-floor` | C12 class — a documented layer that ships empty | `pnpm ready` |
| `popover-hidden` | C13 class — author `display` beating the UA popover rule | `pnpm ready` |
| `dead-props` | C19 class — a declared prop nothing reads | `pnpm ready` |
| `css-contract` | C11 class — `sideEffects` CSS never imported by the entry | `meta:check` |
| `theme-bundle` | C4 class — a theme missing from the "all" bundle | `meta:check` |
| `doc-urls` | 11.3 class — a shipped `cascivo.com` URL that 404s | `pnpm ready` |
| `getting-started-contract` | C7 class — a first-day fact missing from a surface | `meta:check` |
| `framework-matrix` | C2/C3 class — a ✅ with no executable behind it | `meta:check` |
| `props-parity` (+ref, +axis) | C10, C16 | `meta:check` |
| `peer-floors` (+types peer) | C1 | `meta:check` |
| `styleHooks` parity | C14, C18 | `meta:check` |
| `aschild-docs` (+Slot ref) | C19 | `meta:check` |
| `preact-compat` suite | C9 | `pnpm test` |
| `niceTicks` table test | C17a | `pnpm test` |

### 13d — update `CLAUDE.md`

`CLAUDE.md`'s "Gate Before Committing" lists what `pnpm ready` covers and what CI adds. Add the
new entries to both lists in the same PR that wires them — a guard nobody knows to run is a guard
that runs only in CI, and the file already carries that warning about `lint:host-strict`.

---

## §14 — Sequencing

Three parallel tracks. Each row lands as its own PR with its guard.

**Track 1 — blockers (do first, in order).**

1. **WS-13a/b** — the two fixtures, landing **red**, with the failures recorded. Nothing else
   starts until the repo can see these defects.
2. **WS-1** — `@types/react` peers. One line per package; unblocks strict TS + pnpm, which is the
   documented setup. Ship in a patch release immediately after.
3. **WS-4** — popover `display`. Two CSS files. A single `MultiSelect` currently disables the UI
   below it.
4. **WS-3** — the reset. Slightly larger blast radius (it is a global stylesheet), so it goes
   third even though it is the same severity.

**Track 2 — API and behaviour (parallel with track 1 after WS-13).**

5. WS-2 (`ref` types) · 6. WS-8 (`asChild` + `dead-props`) · 7. WS-6 (theming) ·
8. WS-5 (layout + style hooks) · 9. WS-9 (Preact refs) · 10. WS-7 (charts — largest single WS;
split into C11 / C16+C17 / C18 if it gets unwieldy).

**Track 3 — truth and findability (parallel throughout; WS-11 is not "docs cleanup", it is where
the recurrence complaint gets structurally answered).**

11. WS-11 · 12. WS-10 · 13. WS-12.

**Release shape:** a `0.13.1` patch carrying WS-1 + WS-4 alone, as fast as it can be cut — those
two are one-line-ish fixes for defects that make a default install unusable and there is no reason
to make anyone wait for the rest. Then `0.14.0` for the remainder (WS-3's reset and WS-6's
`all.css` redefinition are both behaviour changes that want a minor and a changelog entry).

Per the binding status rules: **the PR that publishes flips each workstream from `merged` →
`published vX.Y.Z` in this file.** Run `pnpm npm:parity` before writing any sentence about what is
or isn't published.

---

## §15 — What this plan deliberately does not do

Named so the next reader doesn't assume they were missed:

- **No `forwardRef` sweep** unless WS-2 picks option (b). React 19's ref-as-prop already works;
  wrapping 100+ components to type it would be the largest diff in this plan for zero runtime
  change.
- **No axis-prop rename that breaks `xTicks`/`yTicks`** (WS-7 C17b). New role-named props are
  added and the old ones deprecated, not removed.
- **No global `[popover]:not(:popover-open) { display: none }` in shipped CSS** (WS-4). It is the
  right *app* workaround and the wrong *library* fix — it would override a consumer's own popovers.
- **No opinionated reset** (WS-3). `box-sizing` and `body { margin: 0 }` only. Typography, list
  and heading resets are the consumer's call.
- **No Astro upstream fix** (WS-10). If the root cause is in `@astrojs/preact`/Astro, cascivo files
  the report with a repro and ships the documented workaround; it does not vendor a patch.
- **No re-litigation of `Flex`/`Stack` naming** (WS-12). Deliberate, documented, and the TSDoc did
  its job for this reporter. Only discoverability improves.

---

## §16 — Credit, and what to protect

The report is one-sided by construction. These are load-bearing and must not regress:

- **The typings, where they resolve.** Inline TSDoc documents defaults, cross-references the
  manifest, and pre-empts footguns (`Flex` direction, `Stack` semantics, `Button asChild`). It
  caught several mistakes at author time. That is the 07-26 plan's WS-1 paying off — WS-1 of *this*
  plan exists because those excellent types don't resolve in a pnpm install, which makes fixing it
  the highest-leverage change here.
- **Tree-shaking.** Ten imported components → exactly ten class maps. Four icons → one SVG path.
- **The missing-theme dev warning.** Names the problem, the fix, the import, and both an online
  and offline docs link. It is the model for every warning this plan adds (WS-6). Fix its dead
  link (11.3) and leave everything else about it alone.
- **Breadth.** 481 exports, 445 icons, 12 themes, and console-shaped primitives (`ShellHeader`,
  `SideNav`, `AppShell`, `CommandMenu`, `DataTable`) that mapped directly onto what the reporter
  needed.

The gap this plan closes is not competence. It is that every one of the repo's 50+ guards runs
inside the monorepo, and the three worst defects in this report can only be seen from outside it.
