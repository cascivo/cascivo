# Fix plan — the 2026-08-06 Vercel-dashboard adopter (TanStack Start, registry `0.16.0`, CLI `0.7.1`)

**Status: implemented on `claude/ui-library-analysis-plan-dxg5tw` and **published** — `@cascivo/react` 0.16.1 and the matching train (2026-08-10).**
All nine workstreams have landed. Per [`README.md`](README.md), the PR that publishes to npm
flips this to `published vX.Y.Z` — until then an adopter cannot `pnpm add` any of it.

Per-workstream status, and what each one's guard is:

| WS | Status | Guard |
| --- | --- | --- |
| WS-1 phantom dependency | merged | `npm-dependency-reality`, `deprecation-surfaces` |
| WS-2 toolchain | merged | `lint:host-eslint` (+ its own fixture tests), `noUnusedLocals` |
| WS-3 theming on Path A | merged | `path-a-parity` |
| WS-4 tone vocabulary | merged | `tone:check` |
| WS-5 chart sizing + Meter | merged | `chart-frame.size.test.tsx`, `chart-frame-parity` |
| WS-6 composition gaps | merged | `tabs.test.tsx`, `aschild-docs` |
| WS-7 CLI robustness | merged | `config.test.ts`, `init.test.ts`, `doctor.test.ts` |
| WS-8 docs owners + skew | merged | `getting-started-contract`, `layer-order` |
| WS-9 recurrence ledger | merged | `recurrence:check` |

**The findings are tracked at finding level in [`RECURRENCE.md`](RECURRENCE.md)**, which is
now the authority: a row may not be closed without naming a guard that exists.

### Where the implementation diverged from this plan

Written down because a plan that quietly disagrees with what shipped is the exact defect
§0 is about:

- **WS-2's counts were wrong, and the fixture is why.** This plan estimated the lint classes
  by grep: 41 `react-hooks/refs` sites, 9 `static-components`, 8 `no-empty-object-type`,
  1 `purity`. Real ESLint found 501 errors, of which 384 vanished once
  `cascivoVendoredSource()` was called with a glob that matches where the source actually
  lives — a trap the plan never spotted. The true remaining classes were 34 / 2 / 0 / 2.
  `no-empty-object-type` never fired at all, so the source fix it prescribed was unnecessary.
- **Both `react-hooks/purity` sites are documented exceptions, not fixes.** The plan called
  `relative-time` "genuinely fixable". It is not: a relative time cannot render without a
  clock, and the effect that corrects the server/client difference is the component's SSR
  story rather than an oversight.
- **`Meter` did not go through `ChartFrame`.** It has no data points, so the frame's tooltip,
  zoom, toolbox and traversal machinery are dead weight, and `role="meter"` is not the
  `role="img"` a frame gives an SVG. `chart-frame-parity` therefore checks the *claim*
  (does it track its container?) rather than the *shape* (does it import `ChartFrame`?) —
  which is the `ref-parity` lesson applied up front.
- **A regex assertion added to `ref-parity` was deleted.** It flagged four false positives
  (`AccordionTrigger` forwards via `summaryRef={ref}`), while `noUnusedParameters` catches
  the same class with none. Mechanism F applies to guards written in this plan too.
- **`computed:check` could not host the chart case** the plan specced: it renders static
  markup with no hydration, so no `ResizeObserver` ever runs. The assertion lives in the
  charts package instead.

Report: [`feedback-vercel-dashboard-tanstack-start-adopter-2026-08-06.md`](feedback-vercel-dashboard-tanstack-start-adopter-2026-08-06.md).
Twelfth report. 9 routes, ~45 vendored components, builds and hydrates clean. Six red flags,
34 findings.

**Carried forward from [`fix-plan-incident-console-adopter-2026-07-28.md`](fix-plan-incident-console-adopter-2026-07-28.md):**
its one open item, the C1 `@types/react` mechanism, is now **closed** — see that plan's §0.6.
It reproduces under pnpm `hoist: false`; the earlier fixture passed with the peer removed
because pnpm's hidden hoist was supplying React's types by accident. **No finding in
[`RECURRENCE.md`](RECURRENCE.md) is open.**

---

## §0 — Read this first: why these came back

The user's framing of this report was: *"The red flags (docs, css, theme provider,
dependencies, etc.) were already mentioned multiple times, and it always was mentioned to be
fixed."* That is the finding. Everything below is downstream of it.

Every red flag in this report is an instance of a mechanism already named in
[`README.md`](README.md) — except one, which is new and which explains the two most
embarrassing items (a package that does not exist, and 13 lint errors in shipped source that
a guard was written specifically to prevent).

### The new mechanism

> **F — the guard re-implements the adopter's tool instead of running it.**
>
> `pnpm lint:host-strict` exists precisely to stop shipped source from carrying lint failures
> adopters did not write. Its own header
> ([`scripts/checks/host-lint/run.mjs:1-13`](../../../scripts/checks/host-lint/run.mjs))
> says it "enforces, **in oxlint**, the objective lint classes a strict host ESLint config
> (e.g. `@tanstack/eslint-config`) flags". oxlint does not implement the React-Compiler-backed
> `react-hooks/refs`, `react-hooks/purity`, or `react-hooks/static-components`. Its
> `.oxlintrc.json` carries exactly two rules. So the guard covers the intersection of two
> toolchains and is blind to the difference — which is where all 13 of the adopter's errors
> live.
>
> The same shape appears one layer up: `@cascivo/eslint-config`'s `cascivoVendoredSource()`
> ([`packages/eslint-config/src/index.js:79-104`](../../../packages/eslint-config/src/index.js))
> scopes off eight *stylistic* rules. It was authored from a list of rules someone had seen
> fire, not derived from a run. It has never been executed against the source it claims to
> cover.
>
> → **Fix:** run the adopter's actual tool, pinned, in CI, over the artefact the adopter
> receives. A re-implementation can only ever cover the intersection, and the gap is
> structurally invisible from inside the re-implementation. Where a fragment claims to make
> a toolchain pass, a test must *run that toolchain* and assert zero findings.

Mechanism F is the reason to treat WS-2 as the plan's spine rather than as cleanup.

### Classification of every red flag

| # | Red flag | Mechanism | Workstream |
|---|---|---|---|
| 14, 15 | `@cascivo/components` unpublished but required; a `@deprecated` notice points at it | **B** — a fact hand-authored instead of derived from the source | WS-1 |
| 16 | Vendored source fails `tsc` under the scaffolder's tsconfig | **E** — only observable in a consumer-shaped environment | WS-2 |
| 17, 18 | 13 lint errors the official config does not cover; wrong flat-config entry point | **F** (new) + **C** | WS-2 |
| 20 | Theming API exists only on the prebuilt path, undisclosed | **A** — a behavioral claim that exists only as prose | WS-3 |
| 21, 22 | `variant="neutral"` renders as the brand accent | **A** — the tone promise has no parity guard | WS-4 |
| 25, 26, 27 | Charts ignore container height; `Meter` carries a responsive doc that is false | **A** — shared prop boilerplate asserted, never derived | WS-5 |

### The process fix (WS-9, and the reason to read it before WS-1)

The [`README.md`](README.md) status-hygiene section already binds plan statuses to reality.
It is not enough, because it tracks *plans*, and findings recur across plans. A finding can be
closed in plan N and re-reported in plan N+2 without either plan being dishonest.

**WS-9 adds a finding-level ledger with one binding rule: a finding may not be marked closed
without naming the guard that makes it stay closed.** "Fixed in source" is not a closure. If
no guard can express the invariant, the finding stays open with `guard: none — <why>` and is
listed in the next plan. This is the single highest-leverage change in this document, and
every other workstream below is written to satisfy it: each one names its guard.

---

## §0.1 — Triage of all 34 findings against `main`

Verified with file:line evidence at `8cbc20e7`. "Already true" means the report is correct
about the published version but `main` already carries the fix.

| # | Finding | Verdict | WS |
|---|---|---|---|
| 1–10 | What went well | **Keep.** Do not regress: `llms.txt` front-loading, JSDoc-as-docs, the chart scale warning, `setLinkComponent`, layer discipline, `doctor --drift`. | — |
| 11 | `init` install is all-or-nothing, leaves a half-configured project | **Confirmed.** `init.ts:126-130` — on failure it sets `exitCode` and prints a hint; `package.json` is never written. | WS-7 |
| 12 | CLI installs bare names, gets a stale version | **Confirmed.** `config.ts:180-188` `installCommand` emits `[pm, ['add', ...packages]]` — no `@latest`, no floor. | WS-7 |
| 13 | `doctor` clean while `doctor --drift` reports 5 issues | **Confirmed.** `index.ts:276-291` — two disjoint branches; the default never runs drift and prints "No violations found." | WS-7 |
| 14 | `@cascivo/components` unpublished but required | **Confirmed.** `packages/components/package.json` is `"private": true, "version": "0.0.0"`. Named in `registry.json` at `/components/7` (`avatar-group`) and `/components/126` (`user`). | WS-1 |
| 15 | `overflow-menu` deprecated toward that package; `list` shows no marker | **Confirmed.** `overflow-menu.tsx:2`. `ComponentMeta` (`packages/core/src/types.ts:78`) has **no `deprecated` field**, so no surface can render one. | WS-1 |
| 16 | Vendored source fails `tsc --noEmit` under `noUnusedLocals` | **Confirmed and worse than reported — 6 sites, not 1.** See WS-2a. `tsconfig.base.json` does not set `noUnusedLocals`, so the repo has never seen them. | WS-2 |
| 17 | 13 lint errors in shipped source; official config does not cover them | **Confirmed and much wider than reported.** 41 render-phase ref writes across 20 files; 9 `getLinkComponent()` sites; 8 empty interfaces. The adopter saw 13 because they vendored ~45 of 132 components. | WS-2 |
| 18 | Documented ESLint entry point is wrong for flat config | **Confirmed.** `llms.txt:197` and `USING-WITH-STRICT-ESLINT.md:26` name the rule set `recommended-latest`; flat config needs `reactHooks.configs.flat['recommended-latest']`. | WS-2 |
| 19 | `prettier --write .` manufactures drift | **Confirmed.** Nothing in `init`, `add`, or the docs mentions excluding `outputDir` from the formatter. | WS-2 |
| 20 | Theming API only in `@cascivo/react` | **Confirmed.** `packages/react/src/theme.tsx` (384 lines), re-exported at `packages/react/src/index.ts:287-297`. Absent from `packages/core/src/index.ts`. `THEMING.md` never states path availability. | WS-3 |
| 21 | `Badge variant="neutral"` renders in the brand accent | **Confirmed.** `badge.tsx:22` `neutral: 'default'` → `badge.module.css:25` `background-color: var(--cascivo-color-accent)`. `Status`/`Notification` map `neutral → 'neutral'`; `Tag`'s `default` is `bg-subtle`. **Badge is the sole outlier.** | WS-4 |
| 22 | `Tag` with no variant is near-invisible in dark | **Confirmed.** `tag.module.css:25-28` — `bg-subtle` + `text-subtle`, no border. | WS-4 |
| 23 | `Link external` renders its own ↗ | **Confirmed.** `link.module.css:52-56` `&[data-external]::after { content: '\2197' }`. The `external` TSDoc (`link.tsx:14`) says only "opens in a new tab with rel safety". | WS-6 |
| 24 | `Search`'s `label` renders nothing visible | **Already true on `main`.** `search.tsx:31-38` now says "Rendered as a real `<label>` that is **visually hidden** by design". Verify the manifest and `llms/*` carry the same sentence (Three-Surface Rule). | WS-6 |
| 25 | Charts ignore container height | **Confirmed, and the mechanism is a dead code path.** `chart-frame.tsx:97` defaults `height` to `300`, so line 152's `h = fixedHeight ?? height.value` can never read the measured signal. `useChartSize`'s height output is unreachable. | WS-5 |
| 26 | `height` sizes the SVG only; the legend renders below | **Confirmed.** Undocumented; the `height` TSDoc (`chart-frame.tsx:49-51`) describes aspect, not what is inside the box. | WS-5 |
| 27 | `Meter` is not responsive but carries the responsive doc | **Confirmed, mechanically.** Of 25 charts, `meter` is the only one that never imports `ChartFrame`/`useChartSize` while carrying the boilerplate. Hard `width = 200`, no `viewBox`, and inline `style={{…}}` that bypasses the layer system entirely. | WS-5 |
| 28 | `Tabs` cannot render links | **Confirmed.** `tabs.tsx:118` hardcodes `<button>`; no `asChild`. | WS-6 |
| 29 | `Menu`'s children are positional | **Confirmed.** `menu.tsx:108` `const [trigger, ...items] = childArray`. `MenuProps` is `{ children: ReactNode }` — no hint, no runtime guard. | WS-6 |
| 30 | No barrel export, inconsistently | **Confirmed.** 6 of 132 component dirs ship an `index.ts` (`checkbox-card`, `header-panel`, `popover`, `radio-card`, `shell-header`, `switcher`). Partial convention is worse than none. | WS-6 |
| 31 | `llms.txt` layer order contradicts `layers.css` | **Already true on `main` — and that is the finding.** `cascivo.platform` landed in `layers.css` in `68db7960` (2026-08-05), *one day before the report*. The adopter read the published `@cascivo/tokens` from `node_modules`. The docs are continuously deployed; the packages are versioned. `llms.txt` described unreleased state and there is no gate against that. | WS-8 |
| 32 | Token names differ from the obvious guess | **Confirmed.** `--cascivo-text-sm` is the size (`tokens/src/index.css:121`); `--cascivo-font-*` holds weights/families. | WS-8 |
| 33 | `init`'s completion message is incomplete | **Confirmed.** `init.ts:132-140` prints the theme import and `data-theme` only. No tokens stylesheet, no `light-dark.css`, no forward reference to `@cascivo/charts/styles.css`. | WS-8 |
| 34 | `add` blurs copy-paste and npm entries | **Confirmed.** `add.ts` prints the npm channel only inside the install log. | WS-8 |

---

## WS-1 — Kill the `@cascivo/components` phantom dependency

**Red flags 14, 15. Mechanism B. Release blocker.**

### What is actually wrong

Three separate defects stack into one unfixable-looking failure:

1. **Two manifests declare a dependency their source does not have.**
   `avatar-group.meta.ts:67` and `user.meta.ts:48` both say
   `dependencies: ['@cascivo/core', '@cascivo/components']`. Neither component imports it.
   `user.tsx` imports `@cascivo/core/pure` and `../avatar/avatar`. `avatar-group.tsx` imports
   `@cascivo/core/pure`, `@cascivo/i18n`, and `../avatar/avatar` — so **`@cascivo/i18n` is
   simultaneously missing** from that manifest. One guard catches both.

2. **The floor generator cannot tell a private package from a published one.**
   `scripts/registry/generate.ts:205-235` — `resolveWorkspaceVersion` reads
   `packages/components/package.json`, finds `"version": "0.0.0"`, and emits `>=0.0.0`.
   It never reads `private`. The adopter correctly inferred the floor was generated: a
   constraint that constrains nothing is a bug, not a value.

3. **`ComponentMeta` has no `deprecated` field**, so `cascivo list`, the MCP server, the docs
   site, and `llms.txt` cannot mark `overflow-menu` even though its source header does — and
   that header names an import path (`@cascivo/components/menu`) that can never resolve on
   either install path.

### Spec

**1a. Correct the two manifests.**
`user.meta.ts:48` → `dependencies: ['@cascivo/core']`.
`avatar-group.meta.ts:67` → `dependencies: ['@cascivo/core', '@cascivo/i18n']`.
Regenerate `registry.json`.

**1b. New guard `npm-dependency-reality` (in `pnpm meta:check`).**
For every manifest, for every entry in `meta.dependencies`:
- it must appear as an import specifier in that component's shipped source (bare-package
  imports only — relative imports are already `deps-check`'s job), **and**
- if it is a `@cascivo/*` workspace package, that package's `package.json` must not be
  `"private": true`.

Both directions: a bare `@cascivo/*` import in shipped source that is *absent* from
`dependencies` is equally a failure. That second direction is what catches the missing
`@cascivo/i18n`.

**1c. `resolvePeerVersions` must fail loudly.**
`scripts/registry/generate.ts:226-235` — throw when `resolveWorkspaceVersion` returns `0.0.0`
or the package is private, naming the manifest. A private package can never be a legal
`meta.dependencies` entry, so the generator should never be asked to floor one.

**1d. First-class deprecation.**
Add to `ComponentMeta` (`packages/core/src/types.ts:78`):

```ts
/**
 * Marks the component as deprecated. Every discovery surface renders it: `cascivo list`,
 * `cascivo search`, `cascivo add` (before copying), the MCP `list_components`/`get_component`
 * tools, the docs site, and `llms.txt`. A deprecated component keeps working — this is
 * signposting, not removal.
 */
deprecated?: {
  /** Version the deprecation was announced in. */
  since: string
  /** Registry name of the replacement, e.g. `'menu'`. Must resolve in the registry. */
  replacement: string
  /** One sentence on what changes for the caller. */
  note?: string
}
```

Declare it on `overflow-menu.meta.ts`. Thread it through `scripts/registry/generate.ts` into
the registry entry, and render it on:

- `cascivo list` / `cascivo search` — `overflow-menu  ⚠ deprecated → menu`
- `cascivo add overflow-menu` — a warning **before** the copy, naming the replacement and the
  exact command (`cascivo add menu`), with the copy still proceeding.
- `packages/mcp/src/server.ts` — in both `list_components` and `get_component` payloads.
- the docs site component page and `llms/<name>.md`.

Guard: `deprecation-surfaces` — every manifest with `deprecated` must have its
`replacement` resolve to a real registry entry, and the CLI/MCP/docs renderers must each
emit the marker (assert on the rendered strings, not on the field's presence).

**1e. No shipped artefact may name an unpublished package as an importable specifier.**
Fix `overflow-menu.tsx:2`:

```
@deprecated Use `Menu` instead — `cascivo add menu` (copy-paste) or
`import { Menu } from '@cascivo/react'` (prebuilt). Deprecated since 0.17.0.
```

Guard: extend `doc-urls:check` (or a sibling) to scan shipped source, `docs/**`, and the
generated `llms/*` for `@cascivo/<name>` specifiers, and fail when `<name>` resolves to a
private workspace package. This is the general form of the bug; `@cascivo/components` is one
instance.

### Acceptance

`cascivo add user avatar-group overflow-menu` in a clean project, then
`cascivo doctor --drift`, reports **zero** unsatisfiable requirements, and every
`pnpm add` command the CLI printed succeeds. `overflow-menu` is visibly deprecated at the
point of discovery, not after installation.

---

## WS-2 — Shipped source must pass the adopter's toolchain, run for real

**Red flags 16, 17, 18, 19. Mechanisms E + F + C. Release blocker.**

### 2a. `noUnusedLocals` — 6 violations, not 1

Verified by running `tsc --noUnusedLocals --noUnusedParameters` over every non-test
`packages/components/src/*/*.tsx`:

```
alert-dialog/alert-dialog.tsx(4,52)  TS6133: 'useSignal' is declared but its value is never read.
checkbox/checkbox.tsx(2,48)          TS6133: 'useSignal' is declared but its value is never read.
header-panel/header-panel.tsx(6,3)   TS6133: 'useSignal' is declared but its value is never read.
modal/modal.tsx(7,3)                 TS6133: 'useSignal' is declared but its value is never read.
sheet/sheet.tsx(5,31)                TS6133: 'useSignal' is declared but its value is never read.
skip-nav/skip-nav.tsx(30,3)          TS6133: 'ref' is declared but its value is never read.
```

Five of the six are the same residue: leftover `useSignal` imports from the
`useEffectPropSignal` migration that `CLAUDE.md` documents. `alert-dialog`, `header-panel`,
`modal`, `sheet` are four of the seven components that migration touched. **The migration
landed without a strictness gate, and the gate is what this workstream is.**

**Spec.** Set `"noUnusedLocals": true` and `"noUnusedParameters": true` in
`tsconfig.base.json`. Delete the six dead bindings (`skip-nav`'s unused `ref` needs a look —
either it should be forwarded or the parameter should go). Fix any violation the flag surfaces
in other packages in the same PR.

Rationale for the base config rather than a component-only override: the report's tsconfig is
what the **official TanStack Start scaffolder** generates. Matching adopter defaults in the
base config is the cheap, durable form of Mechanism E.

### 2b. Run real ESLint, in CI, over the source `cascivo add` copies

This is the Mechanism F fix and the core of the plan.

**Spec.** New fixture `scripts/checks/host-lint/eslint/`:

- `package.json` pinning `eslint`, `eslint-plugin-react-hooks@7`, `typescript-eslint`, and
  `@tanstack/eslint-config` (the adopter's actual stack). Pinned exactly — a floating range
  turns this guard into a flake generator.
- `eslint.config.js` that is **verbatim what the official TanStack Start scaffolder emits**,
  plus `...cascivo` from `@cascivo/eslint-config` spread last, exactly as the docs instruct.
- A runner asserting **zero** errors over `packages/components/src` (excluding tests,
  stories, `_all-metas.ts` — the same exclusion list `.oxlintrc.json` already uses).

Wire into `pnpm ready` and CI. Keep `lint:host-strict` (oxlint) as the fast local pass, and
**amend its header** to say it is a subset — a guard that overstates its coverage is how this
happened.

The fixture's `eslint.config.js` becomes the **single owner** of the flat-config snippet the
docs publish (Mechanism C — see 2d).

### 2c. Triage of the four rule classes — with the decision, not a survey

Each class gets a decision, because the previous plan's failure mode was listing them.

| Rule | Sites | Decision |
|---|---|---|
| `@typescript-eslint/no-empty-object-type` | 8 — `card.tsx:70,80,90`; `item.tsx:45,55,65,75,85` | **Fix in source.** `export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>`. ⚠ Check first that `props-parity`, `typedefs-parity`, and `tsdoc-parity` resolve type aliases, not only `interface` declarations — extend the extractor in the same PR if not. |
| `react-hooks/purity` | 1 — `relative-time.tsx:64` `useSignal(nowProp ?? Date.now())` | **Fix in source.** Genuinely impure and genuinely fixable. Keep SSR text stable: derive the initial value from the `now` prop when given, and set the clock in the existing `useSignalEffect` otherwise. |
| `react-hooks/static-components` | 9 — `breadcrumb:26`, `dock:31`, `header:43`, `navigation-menu:104`, `shell-header:92,210`, `side-nav:220,554`, `switcher:30` | **Fix in `@cascivo/eslint-config`.** `getLinkComponent()` returns a value that is deliberately swappable at runtime via `setLinkComponent` — the whole point of the abstraction the report praised (finding 7). It cannot be hoisted. Turn the rule off in a fragment with a written rationale, in the style of `cascivoSignals`. |
| `react-hooks/refs` | **41 render-phase ref writes across 20 files** (`use-popover.ts:42,45,48` plus `alert-dialog`, `app-shell`, `command-menu`, `editable`, `fab`, `header-panel`, `hover-card`, `infinite-scroll`, `menubar`, `modal`, `navigation-menu`, `notification`, `pull-to-refresh`, `reorder-list`, `search`, `sheet`, `toast`, `toc`, `wheel-picker`) | **Fix in `@cascivo/eslint-config`.** `CLAUDE.md` *prescribes* this idiom verbatim: "For callbacks that must always be current in an effect, use a ref: `onCloseRef.current = onClose // sync during render`". Rewriting 41 sites to satisfy a rule the house style contradicts is the wrong trade. The fragment's rationale must **cite `CLAUDE.md` by name**, so a future reader sees a decision rather than an omission. |

**The binding constraint on 2c:** whatever mix of source fixes and scope-offs is chosen, the
2b fixture must go green. The fragment is then *derived from a run* rather than authored from
memory — which is the actual defect behind finding 17.

**Add a test inside `packages/eslint-config`** that runs real ESLint over a representative
vendored fixture *with* `...cascivo` applied and asserts zero errors. Without it, the package
can silently drift back into covering less than what fires. Note in its header that these
rules matter on **Path A only** — Path B adopters import from `dist`, which no ESLint config
lints.

### 2d. The flat-config entry point (finding 18)

`llms.txt:197` and `USING-WITH-STRICT-ESLINT.md:26` name a rule set (`recommended-latest`)
where flat config needs an import path. As the reporter put it: *"The doc names a rule set
rather than an import path, which reads as an instruction and is not one."*

**Spec.** Replace both with a complete, copy-pasteable block:

```js
// eslint.config.js
import reactHooks from 'eslint-plugin-react-hooks'
import cascivo from '@cascivo/eslint-config'

export default [
  reactHooks.configs.flat['recommended-latest'], // ← flat variant; `configs['recommended-latest']` throws
  // …your config…
  ...cascivo, // spread LAST — flat config is last-wins
]
```

**One owner:** the block is generated from the 2b fixture's own `eslint.config.js`. A guard
asserts the fenced block in `USING-WITH-STRICT-ESLINT.md` and the one in `llms.txt` both match
the fixture byte for byte. This is the Mechanism C fix; the current state is the same fact
stated in three places, wrong in two.

### 2e. Stop the formatter manufacturing drift (finding 19)

Owning the code means excluding it from your formatter, and nothing says so.
`@cascivo/eslint-config` solves the lint half; there is no format half.

**Spec.**
- `cascivo init`: when a formatter config is present (`.prettierrc*`, `prettier` key in
  `package.json`, `.oxfmtrc*`), append `outputDir` to `.prettierignore` / `.oxfmtignore`,
  creating the file if needed, and say so in the completion output. Mirror the existing
  `hintEslintIfPresent` shape (`init.ts:71-80`) but **act** rather than hint — a hint is what
  produced this finding.
- `cascivo add`: print the exclusion line once per project if it is still missing.
- `cascivo doctor`: new finding `formatter-drift` — "`<outputDir>` is not excluded from your
  formatter; running it will show as drift."
- `USING-WITH-STRICT-ESLINT.md` gets a **Formatting** section beside the lint one, and is
  linked from `GETTING-STARTED.md`'s Path A steps. The doc is currently lint-only, and its
  title is why nobody looks there for this.

### Acceptance

A TanStack Start app scaffolded with the official template, `cascivo init` + `cascivo add`
of all 132 components, then `tsc --noEmit`, `eslint .`, and `prettier --check .` — **all
three exit 0 with zero findings in `src/components/ui`**, and `cascivo doctor --drift`
reports clean afterwards. That composite is the fixture; anything less has already been
shipped once.

---

## WS-3 — Theming on the copy-paste path

**Red flag 20. Mechanism A. Release blocker.**

### What is wrong

`ThemeProvider`, `useTheme`, `setTheme`, `themeSignal`, `applyTheme`, and
`themePreloadScript` live in `packages/react/src/theme.tsx` and are exported only from
`packages/react/src/index.ts:287-297`. `llms.txt:204` documents them as *the* theming answer
with a detailed paragraph on precedence, SSR no-FOUC, `suppressHydrationWarning`, and the
tuple-return gotcha. `docs/THEMING.md:79` says "`ThemeProvider` (from `@cascivo/react`) is the
*how*".

Naming the package is not disclosing the constraint. `@cascivo/react` is the **prebuilt
distribution of all 197 components** — a Path A adopter installing it to get a theme signal is
being told to install the thing they chose not to use. The reporter checked all 114
`@cascivo/core` exports before concluding it was absent, and then hand-wrote
`src/lib/theme.ts`: a theme signal, a `localStorage` writer, the inline no-FOUC preload
script, and the `data-theme` + `color-scheme` application. All of it re-implementation of
documented library behaviour, on **the path `cascivo init` configures and the CLI's whole
surface is built around**.

`setLinkComponent` *is* in core, and its doc says "copied source can import from
`@cascivo/core`" — which made the absence more surprising, not less.

### Spec

**3a. Move the theme runtime into `@cascivo/core`; re-export from `@cascivo/react`.**

This is architecturally free. `@cascivo/core` already ships React components — `anchor.tsx`,
`dismissable-layer.tsx`, `error-boundary.tsx`, `focus-scope.tsx` — and already peers on
`react`, `react-dom`, `@types/react`, `@preact/signals-react`
(`packages/core/package.json`). No new dependency, no new peer, no new install step: Path A
already installs `@cascivo/core`.

- Move `packages/react/src/theme.tsx` → `packages/core/src/theme.tsx`, unchanged.
- Export `ThemeProvider`, `useTheme`, `setTheme`, `themeSignal`, `applyTheme`,
  `themePreloadScript`, `type ThemeProviderProps` from `packages/core/src/index.ts`.
- `packages/react/src/index.ts` re-exports the same names from core. **Path B sees no
  change** — same names, same behaviour, same import path.
- Keep the provider-missing dev warning and the missing-theme-CSS dev warning (both were
  praised in prior reports; the 07-28 report called the latter "one of the best error
  messages in the library"). Do not regress them.
- `themePreloadScript()` must stay string-identical — adopters inline it into HTML.

**3b. New guard `path-a-parity`** — the missing twin of
[`scripts/checks/path-b-parity.test.ts`](../../../scripts/checks/path-b-parity.test.ts).

`path-b-parity` exists because the docs once named a primitive Path B could not reach. The
identical failure has now happened on Path A and no guard saw it, because only one direction
was ever built.

The guard reads every primitive named in `docs/AI-RULES.md`, `docs/HEADLESS.md`,
`docs/THEMING.md`, and `llms.txt`, and asserts each is a named export of
`packages/core/src/index.ts` — the only package Path A installs — **or** appears in an explicit
`PATH_B_ONLY` allowlist. Every allowlist entry must carry a reason, and the guard additionally
asserts that each doc mentioning an allowlisted name states its path constraint in prose. That
second half is the part that would have caught this: the API being Path-B-only is legitimate;
documenting it as universal is not.

**3c. Docs.**
- `docs/THEMING.md` opens with a **"Which path are you on"** block, and every code fence names
  its import package explicitly.
- Add a **copy-paste-path theming quickstart** — the exact thing the reporter hand-wrote:
  provider, persistence, preload script, `data-theme` + `color-scheme`. Under the new
  arrangement this collapses to `import { ThemeProvider, themePreloadScript } from
  '@cascivo/core'`, which is the point.
- `docs/HEADLESS.md` catalogue entry for each moved primitive — **required**, or
  `primitive-docs.test.ts` fails (`CLAUDE.md`, "Keeping the AI docs in sync").
- `llms.txt:204` — the theming bullet states the import package for each path.
- `docs/GETTING-STARTED.md` — theming appears in the Path A steps, not only Path B's.

### Acceptance

A Path A app (`cascivo init` + `cascivo add`, no `@cascivo/react` anywhere in
`package.json`) gets persisted, SSR-no-FOUC theme switching using only documented imports,
with no hand-written `src/lib/theme.ts`. `path-a-parity` fails if a doc later names a
Path-B-only API without saying so.

---

## WS-4 — The tone vocabulary must render consistently

**Red flags 21, 22. Mechanism A.**

### What is wrong

`badge.tsx:11-16` sells the tone aliasing as letting "one domain enum drive `Badge`, `Tag`,
`Status` and `Notification`". The promise breaks on the single most common value:

| Component | `neutral` maps to | Renders as |
|---|---|---|
| `Badge` (`badge.tsx:22`) | `'default'` | `var(--cascivo-color-accent)` — **brand blue** |
| `Tag` (`tag.module.css:25`) | `'default'` | `bg-subtle` / `text-subtle` — quiet |
| `Status` (`status.tsx:8`) | `'neutral'` | neutral |
| `Notification` (`notification.tsx:14`) | `'neutral'` | neutral |

**Badge is the sole outlier of four.** Every "neutral" chip in the reporter's first pass —
framework labels, preview-environment tags, member roles — came out as a primary-blue pill.
No error, no warning. The actually-neutral look is `secondary`, typed as a `BadgeShape` rather
than a tone, so it is invisible to anyone working from the tone vocabulary.

### Spec

**4a.** `badge.tsx:22` — `neutral: 'secondary'`. The explicit accent look stays reachable as
`variant="primary"` (`badge.module.css:51`), which already exists.

This changes the rendering of `<Badge>` with no `variant`, since `default` is a `ToneAlias`
for `neutral` (`packages/core/src/tone.ts:19`). That is intentional and is the fix: a badge's
default should not be the loudest thing on the page, and it should match its three siblings.
Ship as a minor with a `docs/UPGRADING.md` entry naming the one-line restore
(`variant="primary"`).

The alternative — leave it and document it — is what the last three plans did with adjacent
findings, and it is why this one is in a twelfth report.

**4b.** `Tag` with no variant is near-invisible in dark (`tag.module.css:25-28`: no border).
Add `border-color: var(--cascivo-color-border)` to the neutral rule so it reads as a chip.
Verify in all three first-party themes.

**4c. New guard `tone-parity` (in `pnpm meta:check`).**
For every component whose props accept `ToneInput`, resolve the CSS rule its tone map selects
and assert each canonical tone reads from the same semantic token family across components:

| Tone | Family |
|---|---|
| `neutral` | `--cascivo-color-bg-subtle` / `--cascivo-color-text` / `--cascivo-color-border` |
| `info` | `--cascivo-color-info-*` |
| `success` | `--cascivo-color-success-*` |
| `warning` | `--cascivo-color-warning-*` |
| `danger` | `--cascivo-color-destructive-*` |

Component-specific non-tone variants (`Badge`'s `outline`, `primary`, `secondary`) are out of
scope by construction — they are not tones.

This is the guard the shared-vocabulary promise has never had. `normalizeTone` guarantees the
*spelling* converges; nothing has ever checked that the *rendering* does.

### Acceptance

`<Badge variant="neutral">`, `<Tag variant="neutral">`, `<Status status="neutral">`, and
`<Notification variant="neutral">` are visually consistent in all three first-party themes.
`tone-parity` fails on the pre-fix `badge.tsx`.

---

## WS-5 — Charts: container height, legend, and honest prop docs

**Red flags 25, 26, 27. Mechanism A.**

### 5a. `height` never tracks the container — and the measuring code is unreachable

`chart-frame.tsx:97` destructures `height: fixedHeight = 300`. Line 152 then computes
`const h = fixedHeight ?? height.value`. Because `fixedHeight` is *always* defined, the
right-hand side is dead: `useChartSize`'s measured height signal (line 120) is computed on
every resize and never read. The reporter's measurement:

```
frame: { w: 681, h: 240 }
svg:   { w: 681, h: 300, viewBox: '0 0 680.65625 300' }
```

A 300px SVG in a 240px cell, spilling 35px past the card's bottom border, on a first attempt.

**Spec.** `height?: number | undefined` with **no default**. `useChartSize(fixedWidth ?? 400,
300)`. `const h = fixedHeight ?? height.value`. The frame's `ResizeObserver` reads
`contentBoxSize` and falls back to `300` when the measured block size is `0` — an
auto-height parent must not collapse the chart to nothing or oscillate. Add a
`min-block-size` floor so a nearly-collapsed container still renders a legible chart rather
than a sliver.

If measurement proves unstable in practice, `aspect-ratio` on the frame is the acceptable
fallback. **The acceptance criterion is fixed either way: a chart in a `block-size: 15rem`
grid cell must not overflow it.** No app should need the reporter's `CHART_HEIGHT` constant
and `/* keep in sync */` comment.

### 5b. `height` sizes the SVG; the legend renders outside it (finding 26)

Two independent sizing rules, neither documented. After fixing 25 the reporter's legend was
clipped by a wrapper sized to `height`, and they landed on `min-block-size`.

**Spec.** The frame is the sizing unit: `block-size: 100%` + `min-inline-size: 0` on
`.frame`, SVG flexes within it, title/legend/description are frame siblings. State it in the
`height` TSDoc verbatim: *"Sizes the plot area only — title, description and legend render
outside it, so the frame is taller than `height`."* Push the same sentence to the manifest and
`llms/*` (Three-Surface Rule).

### 5c. `Meter` — the one chart of 25 that is not one (finding 27)

Mechanically verified across all 25 chart directories: every chart whose `width` prop carries
the responsive boilerplate imports `ChartFrame` — **except `meter`**.

`meter.tsx` renders a hard `width = 200`, no `viewBox`, no container tracking, no CSS module,
and inline `style={{ textAlign, fontSize, color }}` — which is also an unlayered-styling
violation that `unlayered:check` structurally cannot see, because it scans CSS files.

**Spec.** Route `Meter` through `ChartFrame` like the other 24: `useChartSize`, a `viewBox`,
its own CSS module in `@layer cascivo.component`, inline styles removed. The false doc
disappears as a consequence rather than being patched.

**New guard `chart-frame-parity` (in `pnpm meta:check`).** Every component under
`packages/charts/src/charts/*` whose `width` prop doc contains the responsive boilerplate must
import `ChartFrame`. This is a two-line guard that catches exactly the class of defect
"shared prop documentation applied to a component where it is false" — and it fails today on
`meter` and nothing else, which is the correctness proof.

**Extend `computed:check`** with a chart-in-a-fixed-height-cell case asserting
`svg.height <= cell.height`. That is the Mechanism E half: this could not have been seen in a
docs page where every chart sits in an auto-height container.

### Acceptance

A chart in a `block-size: 15rem` grid cell fits, legend included, with no `height` prop
passed. `chart-frame-parity` fails on the pre-fix `meter.tsx`.

---

## WS-6 — Composition gaps

**Findings 23, 24, 28, 29, 30.**

### 6a. `Tabs` cannot render links (finding 28) — highest value here

`tabs.tsx:118` hardcodes `<button>`. The canonical dashboard pattern is one URL per tab, and
the workaround (`navigate()` from `onValueChange`) loses middle-click, cmd-click,
open-in-new-tab, and real hrefs for crawlers and screen readers. `Link`'s own JSDoc
(`link.tsx:21-25`) argues `asChild` is "**the supported way to style an in-content router
link**" — the library understands the pattern; it is absent on the component that needs it
most for an app shell.

**Spec.** `asChild` on `TabsTrigger` via the existing `Slot` (already the pattern for
`PopoverTrigger`, 07-28 plan WS-8). The slotted element keeps `role="tab"`, `aria-selected`,
`aria-controls`, `data-state`, `data-value`, and the roving `tabIndex`. Add a
`docs/USING-WITH-A-ROUTER.md` recipe for URL-driven tabs (TanStack Router and Next App
Router), including the `TabsContent` + `<Outlet>` wiring the reporter had to invent.
`aschild-docs.test.ts` already gates `asChild` documentation — extend its coverage list.

### 6b. `Menu`'s children are positional (finding 29)

`menu.tsx:106-116`: `const [trigger, ...items] = childArray`. Wrapping the trigger in a
fragment or a conditional silently breaks the component. `MenuProps` is `{ children:
ReactNode }` — no hint, no runtime guard.

**Spec.** Partition by component identity (`child.type === MenuTrigger`) rather than
position, so fragments and conditionals work. Throw a dev-time error naming the contract when
no `MenuTrigger` is found — silence is the defect. **Audit the same shape across
`context-menu`, `menubar`, `navigation-menu`, `dropdown`, and `command-menu`**: grep for
positional destructuring of `children`. Document the composition contract in `MenuProps`'
TSDoc regardless.

### 6c. `Link external` double arrow (finding 23)

`link.module.css:52-56` generates a ↗ via `::after`; passing an `ExternalLink` icon child —
the obvious composition — yields two arrows. The `external` TSDoc (`link.tsx:14`) mentions
only tab and rel behaviour.

**Spec.** `&[data-external]:not(:has(svg:last-child))::after` — `:has()` is already in the
browser target. Add `externalIndicator?: boolean` (default `true`) for explicit control, and
document both in the `external` TSDoc across all three surfaces.

### 6d. `Search.label` (finding 24)

Already corrected in the TSDoc (`search.tsx:31-38`). **Verify the manifest and `llms/*` carry
the same "visually hidden by design" sentence** — the Three-Surface Rule, Mechanism D. Adopt
one shared sentence for every visually-hidden `label` prop in the catalog and check it with
`vocabulary.test.ts`.

### 6e. Barrel exports (finding 30)

6 of 132 component directories ship an `index.ts` (`checkbox-card`, `header-panel`,
`popover`, `radio-card`, `shell-header`, `switcher`). ~45 vendored components meant ~45
`../components/ui/card/card` import lines, with no `cascivo add` flag and no documented
convention.

**Spec.** Ship a generated `index.ts` in **every** component directory, always — a partial
convention is worse than either extreme, because it teaches the wrong expectation. Include it
in the registry `files` list so `deps-check` and drift detection see it. Document the
top-level barrel as an adopter-owned file (`src/components/ui/index.ts`) that `cascivo add`
appends to, behind a `barrel: true` config key defaulting to on for new projects.

---

## WS-7 — CLI robustness

**Findings 11, 12, 13.**

### 7a. `init` must never leave a half-configured project (finding 11)

`init.ts:126-130` — one unrelated bad version range in the adopter's `package.json` failed
the whole `pnpm add`; `init` had already written `cascivo.config.ts` and then printed "Failed
to install". The project claimed to be cascivo-configured with none of the runtime installed.
`--no-install` exists but is not what a failing install falls back to.

**Spec.** On install failure, **write the dependency entries into `package.json`** with their
resolved floors, so the project is at least declarative-complete and one `pnpm install` from
working. Print the exact recovery command. Exit non-zero. Say plainly what state the project
is in — "wrote 4 dependencies to package.json but did not install them; run `pnpm install`"
is recoverable; "Failed to install" is not.

### 7b. Install with a version, not a bare name (finding 12)

`config.ts:180-188` — `installCommand` emits `[pm, ['add', ...packages]]`. In a pnpm
workspace, a sibling package's lockfile entry won and pnpm resolved `@cascivo/i18n` to
**0.2.14** when latest was **0.16.0**. cascivo then warned about the version it had just
installed itself.

**Spec.** For every `@cascivo/*` package, install `name@latest`, or `name@>=<floor>` when the
registry entry carries a `peerVersions` floor — the CLI already knows the floor, which is what
makes the current behaviour indefensible. Add `--pin <version>` as the escape hatch. Guard: a
unit test asserting the spawned argv carries a version specifier for every `@cascivo/*`
package.

### 7c. `doctor` must not report clean on a run that did not look (finding 13)

`index.ts:276-291` — `--drift` and the default are disjoint branches; the default never runs
drift and prints "No violations found." while `--drift` reports 5 real issues.

**Spec.** The default invocation runs the drift check. When it cannot (no lockfile, offline,
unreachable registry), print `drift: not checked — <reason>` and never the unqualified
"No violations found." `--drift` keeps its meaning as "drift only". Two more findings while
in here: the `formatter-drift` check from WS-2e, and a `version-skew` check reporting every
installed `@cascivo/*` more than one minor behind the registry.

---

## WS-8 — Docs: one owner per fact, and version skew

**Findings 31, 32, 33, 34.**

### 8a. The layer statement has two owners, and the docs ship ahead of the packages (finding 31)

`packages/tokens/src/layers.css` calls itself "the ONE authoritative declaration". `llms.txt`
restates it. On 2026-08-05, `68db7960` added `cascivo.platform` to `layers.css` — **one day
before the report**. The adopter compared `llms.txt` (continuously deployed, current) against
the `@cascivo/tokens` in their `node_modules` (published, older) and correctly reported a
contradiction. They followed `layers.css`, which was the right call and the wrong outcome.

Two fixes, both required:

1. **One owner (Mechanism C).** `scripts/llms/generate.ts` **reads the `@layer` statement out
   of `layers.css`** instead of restating it. Same for `README.md`,
   `docs/CSS-LAYERS-PITFALL.md`, `docs/THIRD-PARTY-CSS.md`, and
   `packages/mcp/src/server.ts`. `layer-order.test.ts` already asserts shipped statements are
   an ordered subsequence of the canonical one; extend it to *documentation* occurrences, which
   are currently unchecked.
2. **Version-stamp the docs.** `llms.txt` states which published `@cascivo/*` versions it
   describes, and `deployed-freshness.sh` asserts every version it names is actually on npm.
   A reader must be able to tell whether a doc describes what they can install. Continuously
   deployed docs plus versioned packages will keep producing this class otherwise.

### 8b. Token naming (finding 32)

`--cascivo-text-sm` is the font *size* (`tokens/src/index.css:121`); `--cascivo-font-*` holds
weights and families. A closed catalog exists at `tokens.catalog.json`, but the split is a
trap for anyone typing from memory — and agents type from memory.

**Spec.** Ship aliases: `--cascivo-font-size-sm: var(--cascivo-text-sm)` for the full scale.
Cheap, additive, and it removes the trap rather than documenting it. Additionally add a
naming-map table to the top of `docs/TOKENS.md` and to `llms.txt`'s token section.
`token-catalog.test.ts` covers the aliases so they cannot drift from their targets.

### 8c. `init`'s completion message (finding 33)

`init.ts:132-140` prints the theme import and `data-theme` only. It does not say which
stylesheet carries the tokens, does not mention `light-dark.css` as the switchable bundle,
and says nothing about `@cascivo/charts/styles.css`, which becomes mandatory the moment
`cascivo add area-chart` runs — the later `add` does print it, but inside a block that scrolls
past under an install log.

**Spec.** Print the complete stylesheet wiring, in import order, with a one-line note on when
each is needed, plus a forward reference for charts. Extend
`getting-started-contract.test.ts` — which already checks that a first-day fact appears on
every first-day surface — to treat **the CLI's own output strings** as a first-day surface.
That is the guard gap: the CLI has never been one.

### 8d. `add` blurs the channels (finding 34)

`cascivo add area-chart` reads like every other `add` but copies no source — it installs
`@cascivo/charts`. `cascivo list` does group these under a `Charts (npm: @cascivo/charts)`
header, so it is signposted, but identical command syntax and "you own the code" framing set a
different expectation.

**Spec.** Print a one-line banner **before** the install log:
`area-chart ships in the @cascivo/charts npm package — no source is copied into your project.`
Same for flow, editor, and templates. Guard: a CLI output snapshot test per channel.

---

## WS-9 — The recurrence ledger (process)

**This is the workstream that makes the other eight stay fixed.**

### 9a. Add Mechanism F to [`README.md`](README.md)

Verbatim from §0 above, in the "Classify before you spec" list.

### 9b. `docs/internal/feedback/RECURRENCE.md` — generated, finding-level

`README.md` binds *plan* statuses to reality. Findings recur *across* plans, so plan-level
tracking cannot see them. One table, generated from the plans' front-matter:

| Finding | First reported | Reports | Plan(s) | Guard | Status |
|---|---|---|---|---|---|
| Theming unavailable on Path A | 2026-08-06 | 1 | this, WS-3 | `path-a-parity` | open |
| Shipped source fails a strict host toolchain | 2026-07-18 | 4 | 07-18, 07-22, this WS-2 | `host-lint` (ESLint fixture) | open |
| … | | | | | |

**The binding rule: a finding may not be marked `closed` without a named guard.** If no guard
can express the invariant, it stays open with `guard: none — <why>`, and every subsequent plan
lists it. "Fixed in source" is not a closure; twelve reports are the evidence.

### 9c. Update the live-tracker pointer in `README.md`

Point at this plan. The README's own warning — that the pointer went two plans stale and
"a stale tracker is the same defect class as a stale status header" — applies to the PR that
lands this document.

---

## Sequencing

| Order | Workstreams | Why |
|---|---|---|
| **1** | WS-9a/9b | The ledger has to exist before anything is marked closed against it. Cheap; do it first. |
| **2** | WS-2b | Build the real-ESLint fixture **before** fixing anything, so every subsequent fix in WS-2c is verified against the adopter's tool rather than argued about. Mechanism E's own lesson from the 07-28 plan: build the fixture before writing the diagnosis. |
| **3** | WS-1, WS-2a/2c/2d/2e, WS-3 | The three release blockers. Nothing published until all three are green. |
| **4** | WS-4, WS-5 | Silently-wrong UI. Each ships with its parity guard, which must be shown failing on the pre-fix state. |
| **5** | WS-6, WS-7, WS-8 | Composition, CLI, docs. WS-6a (`Tabs asChild`) is the highest-value item in this tier. |

## Definition of done

1. Every workstream's status is updated in the PR that implements it, not a follow-up.
2. Every new guard is **demonstrated failing on the pre-fix state** and recorded as such. A
   guard that has only ever been green is untested. The 07-28 plan's `bare-page` cases had to
   be rewritten until each failed pre-fix; the same standard applies to `npm-dependency-reality`,
   `path-a-parity`, `tone-parity`, `chart-frame-parity`, and the ESLint fixture.
3. The WS-2 composite acceptance passes: official TanStack Start scaffold + `cascivo init` +
   all 132 components + `tsc` + `eslint` + `prettier --check` + `cascivo doctor --drift`, all
   exit 0.
4. `pnpm ready` covers the new guards; `pnpm ready:ci` still passes cold.
5. `RECURRENCE.md` names a guard for every finding marked closed.
6. Run `pnpm npm:parity` before writing any sentence about what is or is not published.

## Do not regress

The report's first ten items are the product working. `cascivo list` as single-command
discovery; `llms.txt` front-loading the layer contract, the signals rules, the handler-naming
convention and the icon-name map; JSDoc carrying rationale and dated adopter warnings; the
`AppShell` + `ShellHeader` + `SideNav` shell in ~50 lines; `DataTable`, `LogViewer`,
`CodeSnippet`; the chart series-scale dev warning (quoted in full in the report as a model
other libraries should copy); zero-config SSR under TanStack Start; `setLinkComponent`; the
layer contract holding for a whole app with no `!important`; `cascivo doctor --drift`; and
consuming components requiring no signals knowledge.

WS-4a changes a default rendering and WS-5a changes chart sizing. Both are deliberate. Nothing
else in this plan may change a behaviour the report praised.
