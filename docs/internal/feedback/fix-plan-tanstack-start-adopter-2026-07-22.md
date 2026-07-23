# Fix plan — TanStack Start adopter report (2026-07-22, published 0.9.0 packages)

**Status: partially shipped — see per-item note below; remaining items carried into the
2026-07-23 plan.** Several workstreams shipped in the `0.10.0` release train (PR #166,
commit `e81a0a73`) and #170: **WS-A** (CSS-free `node`-condition build so SSR needs no
`ssr.noExternal`), **WS-B** (controlled `<ThemeProvider value>` emits an SSR attribute
setter — no FOUC), **WS-G** (`Field`/`Input` double-`label` dev warning), **WS-I**
(`setLinkComponent` inline-adapter inference), charts **WS-E** (per-series `y` accessor,
`@cascivo/charts@0.4.0`), and **WS-F** (a real prerendered `/docs/components` route, #170).
Still open at 2026-07-23 and folded into `fix-plan-tanstack-router-dashboard-adopter-2026-07-23.md`:
**WS-C** (`noUncheckedSideEffectImports`/TS2882 docs+exports), **WS-D** (superseded by that
plan's WS-E — `useTheme` now returns a value), **WS-H** (`Stack` point-of-use notes), **WS-J**
(per-file `llms/*.md` docs-imports guard). Per the WS-K status-hygiene rule
(`docs/internal/feedback/README.md`), the PR that finishes each remaining item updates this
line.

_Original spec follows (unedited)._ This is the full spec for fixing every item in the
fifth TanStack Start hands-on report
(`docs/internal/feedback/feedback-tanstack-start-adopter-2026-07-22.md` — a Vercel-style
dashboard on TanStack Start / React 19 / Vite 8, against published `@cascivo/react@0.9.0`,
`@cascivo/charts@0.3.14`, `@cascivo/icons@0.3.1`, `@cascivo/themes@0.4.3`). Written to be
handed to an implementing agent as-is: every claim is triaged against current `main`
(HEAD `aef9a942`, 2026-07-22) with file:line evidence; every workstream carries a spec,
tests, and acceptance criteria.

## Read this first — why the same two red flags are back

**0.9.0 is the version that already contains the previous report's fixes.** PR #162
(commit `21e7ddb0`, released as 0.9.0 via #164) shipped the signals peer floor, the theme
`defaultTheme` precedence fix, the `LinkComponentProps` re-export, the `onValueChange`
convention, the README SSR checklists, and the `cascivo doctor` SSR heuristic. This
adopter tested **that** version, followed the getting-started guide (which **does** carry
the SSR call-out, `docs/GETTING-STARTED.md:135-142`), and still shipped a dead app —
HTTP 500 on every route — until they independently discovered `ssr.noExternal`.

That is the empirical result of a deliberate bet made twice before:

- Commit `357ba46c` (#154), sub-commit "docs: resolve Wave 6 (dist CSS strategy) as
  **won't-do**": keep per-component `.css` imports in the dist; document `noExternal`.
- The 2026-07-20 plan (`fix-plan-tanstack-start-adopter-2026-07-20.md`, WS4
  implementation note): the CSS-free `node`-condition build was spiked and **not
  shipped**; the fallback (docs + README + doctor) was taken, with an explicit revisit
  clause: *"Revisit the variant only if a future report shows `noExternal` is an
  adoption blocker despite these."*

**This report is that trigger, verbatim.** Docs, README boxes, a troubleshooting entry
keyed on the literal error, a dedicated guide, an example app, and a doctor heuristic all
existed at 0.9.0 — and the fresh-adopter path still 500s, because `build`/`typecheck`/
`lint` all pass and the failure only surfaces when a request is served, with a Node error
that contains no pointer back to cascivo. Docs cannot fix a landmine that detonates after
every gate is green. The out-of-the-box behavior is the product; WS-A below reverses the
Wave-6/WS4 decision at the package level. The same lesson applies to the theme FOUC
(WS-B): the controlled-`value` SSR gap has existed since `theme.tsx` was first committed
and no prior plan ever addressed it — the previous theme fixes were precedence and docs
only.

**Definition of done for this plan** (the recurrence-breaker): a fix is done when it is
(1) merged, (2) **published to npm**, (3) **deployed to the docs hosts**, and (4) its
deployed-freshness canary is green against production. Steps 2–4 are workstream
deliverables here, not follow-ups — every prior recurrence involved an adopter meeting
artifacts that lagged the repo.

## Triage — finding → verdict (order follows the report)

| # | Report item | Verdict | Root cause / evidence | WS |
| --- | --- | --- | --- | --- |
| 1 | 🔴 Runtime `.css` imports in `@cascivo/react` dist crash SSR (`ERR_UNKNOWN_FILE_EXTENSION`, HTTP 500 on all routes) until `ssr.noExternal` is added | **Confirmed — by design; the design has now failed its own test** | `cssImportEdges()` plugin injects `import './x.css';` into every component chunk (`packages/react/vite.config.ts:39-120`, injection at `:87`); `scripts/checks/ssr-import.test.ts` CI-pins this exact behavior incl. the raw-Node crash (`:43-80`); won't-fix decision in `357ba46c` + WS4 fallback in the 07-20 plan, whose revisit clause this report triggers | **WS-A (P0)** |
| 2 | 🟠 Controlled `<ThemeProvider value>` writes `data-theme` only in a client effect → SSR emits no theme attribute → FOUC | **Confirmed — never fixed, never previously planned** | `packages/react/src/theme.tsx:142` mirrors `value` into the signal; the only DOM write is `useSignalEffect` (`theme.tsx:148-157`, `document`-guarded); render output is bare `<>{children}</>` (`theme.tsx:159`). No SSR test exists (`theme.test.tsx` is client-render only). Prior theme work (#162 WS3) changed precedence + docs, not SSR emission | **WS-B (P0)** |
| 3 | `import '@cascivo/themes/all'` fails TS2882 under `noUncheckedSideEffectImports` (TanStack scaffold default); `.css` twin is the undocumented fix | **Confirmed gap — zero handling anywhere** | Extensionless exports map to `.css` files (`packages/themes/package.json:31-61`); grep for `noUncheckedSideEffectImports`/`TS2882` across the repo → **0 hits**; every doc/snippet/generator recommends the extensionless form (`GETTING-STARTED.md:164,255`, `THEMING.md:296`, `USING-WITH-VITE-SSR.md:49,111` — the TanStack recipe itself, `scripts/llms/generate.ts:561`, 4 site TSX pages) | **WS-C (P1)** |
| 4 | Getting-started shows `const { theme, setTheme } = useTheme()` (object) | **Not reproducible — snippet exists nowhere, and never did** | Repo + live-production grep for `{ theme, setTheme }` → 0 hits; `theme.tsx` had the tuple + tuple JSDoc from its first commit (`2aba8dc4`); deployed `docs/theming.md:84` serves the tuple today. Real gap: `GETTING-STARTED.md:223-226` names `useTheme()` **without showing its shape**, and `MIGRATING-FROM-SHADCN.md:189-190` says "same shape" as next-themes — whose `useTheme()` **does** return `{ theme, setTheme }`. An AI pattern-matched the gap; second adopter to trip on the shape (`feedback-tanstack-dashboard-adopter-2026-07.md:127-134`) | **WS-D (P1)** |
| 5 | Chart series share one `x`/`y` accessor; per-series fields silently plot the same data; not documented | **Confirmed — API gap + doc gap** | Single chart-level `x`/`y` props (`area-chart.tsx:42-46`, `line-chart.tsx:38-41`, `bar-chart.tsx:23-26`); series carry no accessor (`area-chart.tsx:33-40`); metas say only "X-value accessor" with single-series examples; the one reshaping helper (`toStackedSeries`, `engine/stacked.ts:35-72`) is Bar-only and framed as stacking | **WS-E (P1)** |
| 6 | `llms/layout/dashboard-layout.md` shows `import { DashboardLayout } from '@cascivo/layout/dashboard-layout'` | **Not reproducible on current output — stale deploy at test time** | Generator is structurally incapable of emitting it: `packageFor()` returns `null` for layouts (`scripts/llms/generate.ts:179-188`) → "Copy-paste only" line (`:277-279`); live production doc verified correct 2026-07-22. Residual: guard gap — `docs-imports` never scans per-file `llms/*.md` (`docs-imports.test.ts:98-110`, only guides + the two aggregates) | **WS-J** |
| 7 | `Flex`/`Grid` use `gap`; `Stack` uses `offset` | **Confirmed divergence; known hazard, fix planned 07-17 and never implemented** | `Stack` is a z-axis card-pile, not a spacing primitive (`stack.tsx:3-14` — `offset` = px per layer; `stack.meta.ts:59,80-85` warns against spacing use). The discoverability hazard is real and was specced as WS6 of `docs/plans/tanstack-start-experience-report-plan.md:443-476` — **status: never implemented** | **WS-H (P2)** |
| 8 | `Input` and `Field` both own `label` → double-label | **Confirmed — no warning, no doc note** | Input renders its own `<label>` when `label` set (`input.tsx:42-46`); Field renders a `Label` + clones `id`/aria onto the child but never strips the child's `label` (`field.tsx:50-70`); `field.meta.ts` shows correct usage by omission only (`:70-84`), no antiPattern for the collision (`:97-108`) | **WS-G (P2)** |
| 9 | `setLinkComponent` types live in `@cascivo/core` (transitive) and don't resolve → adapter is `any` | **Fixed in 0.9.0 — but the fix demonstrably didn't reach this adopter's fingers** | `LinkComponent` + `LinkComponentProps` are re-exported from `@cascivo/react` (`packages/react/src/index.ts:69-79`, shipped in 0.9.0 via #162). Residual real gap: `setLinkComponent`'s parameter is `ElementType`, so an **inline adapter gets no inference** — you only get typed props by knowing to import and annotate `LinkComponentProps`, which is exactly what the adopter didn't discover | **WS-I (P2)** |
| 10 | `cascivo.com/docs/components` 404s | **Confirmed — live-reproduced 2026-07-22** | No `/docs/components` route: `DOCS_ROUTES` has no such key and the component-page match requires a trailing name (`apps/site/src/DocsApp.tsx:59-86,126-145`); falls through to `DocsNotFound`. The intended index is `/docs/components.md`, which nothing at that URL points to | **WS-F (P2)** |
| — | Nested `pnpm-workspace.yaml` dropped by `@tanstack/cli create` | Framework tooling, not cascivo | — | optional one-liner in TROUBLESHOOTING (WS-C sweep) |

Priority order: **WS-A → WS-B** (the two red flags; both are published-package code
changes) → **WS-C → WS-D → WS-E** (quickstart-correctness + API) → **WS-F → WS-G →
WS-H → WS-I → WS-J**. WS-A/B/E/G/I change published packages and ship in one release
train; the plan is not done until that release is published and the WS-J canaries are
green against production.

---

## WS-A (P0) — SSR-safe `@cascivo/react`: a bare Node ESM loader must be able to import it

### Problem

`@cascivo/react`'s dist chunks each carry an injected `import './<name>.css';`
(`packages/react/vite.config.ts:39-120`). Every Vite SSR framework externalizes
`node_modules` by default, so Node's native loader evaluates those imports and throws
`ERR_UNKNOWN_FILE_EXTENSION` — HTTP 500 on every route, **after** build/typecheck/lint
all pass, with a stack that points into `node_modules`, not at cascivo. Three adopter
reports have now hit this; docs + README + doctor (all present in 0.9.0) did not prevent
the third.

### Decision — reversed, with authority

The Wave-6 "won't-do" (`357ba46c`) and the 07-20 WS4 fallback are **superseded**. The
07-20 plan's own revisit clause named the condition for reversal and this report meets
it. Implement the CSS-free **`node`-condition build variant** (the design already specced
in `fix-plan-tanstack-start-adopter-2026-07-20.md` WS4.1 — reuse its analysis). The
implementing agent is explicitly authorized to change `scripts/checks/ssr-import.test.ts`:
that test pins the old contract and **must** be rewritten to pin the new one, not
worked around.

### Spec

1. **Second, CSS-free dist tree** for `@cascivo/react`, selected by the `node` export
   condition:
   - Same module graph, same chunk names, same `'use client'` banners, same JS —
     **minus** the injected `.css` side-effect edges. Implementation choice (implementer
     decides, document in the PR): (a) a second `vp build` pass with `cssImportEdges`
     told not to inject, writing to `dist/node/`; or (b) the existing plugin's
     `generateBundle` additionally emitting each chunk's edge-free twin under
     `dist/node/` (it already owns edge injection, so it knows exactly which line it
     added; chunks without edges are copied verbatim so relative imports resolve within
     the tree). Prefer whichever keeps `vp build --watch` correct.
   - Exports map (`packages/react/package.json:33-41`):
     `"." : { "types": "./dist/index.d.ts", "node": "./dist/node/index.js", "import": "./dist/index.js", "default": "./dist/index.js" }`.
     `types` stays first (publint gate from #162). `./styles.css` unchanged.
2. **Validation matrix** (run and record results in the PR — this was the stated risk
   that justified the earlier fallback; it must be discharged, not assumed):
   - Bare Node: `node -e "await import('@cascivo/react')"` against the **packed
     tarball** → exits 0. This is the headline acceptance test; automate it (see Tests).
   - Vite client build (examples apps) → `browser`/`import` conditions → CSS edges
     preserved, per-component CSS present in the client bundle. Assert one example's
     built CSS contains a known component class.
   - Vite SSR **with** `noExternal` (existing adopters) → SSR resolver includes `node`
     → CSS-free code is bundled server-side; client bundle unchanged → no visual or
     dedup regression. Re-run `apps/examples/react-vite-ssr` e2e as-is.
   - Vite SSR **without** `noExternal` (the fresh-adopter path) → server picks
     `dist/node/`, loads clean; client build still carries CSS. Extend the
     `react-vite-ssr` example with a second config permutation (no `cascivoSsr()`)
     whose smoke test asserts a 200 + themed markup.
   - Next.js App Router (`apps/examples/react-next`) → unchanged behavior (it already
     works via global CSS imports; must not regress — its build is the check).
   - Module-singleton audit: theme store and link registry live in `@cascivo/core`
     (single instance either way) — re-verify with a grep for module-level `let`/`const`
     state in `packages/react/src/` that is not re-exported core state; anything found
     must be assessed for client/server split-brain (expected: none; the 07-20 plan
     already concluded this).
3. **Flip the contract test.** Rewrite `scripts/checks/ssr-import.test.ts` to assert:
   (a) browser-condition chunks still carry `.css` edges (tree-shaking contract
   unchanged); (b) `dist/node/` chunks carry **zero** `.css` imports; (c) a raw-Node
   `import()` of the node entry **succeeds**. Update its header comment — it currently
   documents the old design as load-bearing.
4. **Sweep for other packages with runtime `.css` imports in dist.** Mechanically: run
   the (a)-style scan over every published package's built output. Expected result:
   only `@cascivo/react` injects edges (`cssImportEdges` exists only in its vite
   config; charts builds a single entry + separate `dist/charts.css`). If the scan
   finds others (editor/flow), apply the same variant there in the same PR.
5. **`cascivoSsr()` / `noExternal` become optional, stay harmless.** Keep the plugin
   working (it still helps HMR-in-SSR edge cases and older published versions); update
   its JSDoc and `packages/vite-plugin` tests to say "no longer required as of
   `@cascivo/react` ≥ 0.10". Do not delete it in this release.
6. **Docs flip from "required config" to "it just works".**
   - `docs/USING-WITH-VITE-SSR.md`: the TL;DR checklist drops `noExternal` to a
     "only needed for `@cascivo/react` < 0.10" note; the error-keyed troubleshooting
     entry stays (older versions in the wild) with the version boundary stated.
   - `docs/GETTING-STARTED.md:135-142` call-out: same reframe.
   - `docs/TROUBLESHOOTING.md`, `docs/COMPATIBILITY.md`, `docs/AI-RULES.md`, react/charts
     READMEs, `scripts/llms/generate.ts` SSR SETUP block: sweep for `noExternal`
     phrased as mandatory; make each version-conditional. `pnpm regen`.
7. **Changeset**: `@cascivo/react` **minor** (new export condition; headline: "SSR
   works with zero config"). Charts/editor/flow only if step 4 finds edges there.

### Tests / acceptance

- New automated check (wired into `pnpm ready` family or CI release path): pack
  `@cascivo/react`, install into a temp dir, `node -e "await import('@cascivo/react')"`
  → exit 0. This test failing is the exact adopter experience; it must be impossible to
  publish while it fails.
- `react-vite-ssr` example passes its smoke test **in both permutations** (with and
  without `cascivoSsr()`).
- Rewritten `ssr-import.test.ts` green; grep confirms no `.css` specifier in any
  `dist/node/**/*.js`.
- All example apps build; `pnpm ready` + `pnpm ready:ci` green (the second build pass
  must survive cold-cache sequential CI).

---

## WS-B (P0) — Controlled `ThemeProvider` must theme the server-rendered page

### Problem

`<ThemeProvider value="dark">` renders `<>{children}</>` and writes `data-theme` only in
`useSignalEffect` (`theme.tsx:148-157`) — which never runs on the server. The server
response has no theme attribute; first paint is unthemed until hydration. The adopter
hardcoded `data-theme="dark"` on `<html>` to work around it. `themePreloadScript()` does
not help: it reads `localStorage`/OS, not a server-owned controlled value. This gap has
existed since the file's first commit and no prior plan touched it.

### Spec

1. **Render-time emission for the controlled flow.** When `value` is set and `target`
   is not, `ThemeProvider` renders — in addition to `children` — a tiny inline script
   as its first output:
   ```tsx
   <script
     // nonce prop threaded through if provided
     dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute(${JSON.stringify(attribute)},${JSON.stringify(value)})` }}
   />
   ```
   - Runs during HTML parsing, before any following markup paints → attribute present
     for first paint, server or client.
   - Rendered identically on server and client-first-render → no hydration mismatch
     (the script re-running on the client is an idempotent `setAttribute`).
   - **Escaping is mandatory**: `attribute` and `value` pass through `JSON.stringify`
     and the result must additionally be guarded against `</script>` breakout (reject or
     escape `<` in the serialized values — add an explicit test with a hostile value).
   - `target` case: refs don't exist server-side; skip the script (unchanged behavior)
     and say so in the JSDoc.
   - New optional `nonce?: string` prop, forwarded to the script tag, for CSP'd apps
     (documented alongside the same caveat `themePreloadScript` already has).
   - The existing `useSignalEffect` stays — it owns all post-hydration updates.
2. **Uncontrolled flow stays on `themePreloadScript()`** — that story is correct and
   shipped; do not duplicate it. But state the split explicitly in JSDoc + docs:
   *controlled `value` → the provider itself is SSR-safe; uncontrolled/persisted →
   inline `themePreloadScript()` in `<head>`.*
3. **Docs.** `docs/THEMING.md` controlled bullet (`:96-97`) gains the SSR sentence and
   drops any implication that controlled SSR needs manual `<html>` attributes;
   `docs/GETTING-STARTED.md:218-240` SSR options add the third path (controlled);
   `docs/USING-WITH-VITE-SSR.md` theme section mirrors it; llms generator theming
   bullet updated; `pnpm regen`.
4. **Changeset**: `@cascivo/react` **minor**.

### Tests / acceptance

- `theme.test.tsx` gains SSR tests using `renderToString`:
  - controlled `value="dark"` → output contains the script with
    `setAttribute("data-theme","dark")`; custom `attribute` respected.
  - hostile value (`'"/><script>'`-shaped) → serialized safely, no `</script>` in
    output.
  - uncontrolled (no `value`) → **no** script emitted (behavior unchanged).
  - `target` + `value` → no script.
- Hydration test (jsdom): server-string + `hydrateRoot` with same props → no console
  error, attribute present before effects flush.
- The `react-vite-ssr` example (WS-A's no-config permutation) asserts the served HTML
  of a controlled-provider page contains the attribute-setter script — closing the loop
  on the exact report scenario.

---

## WS-C (P1) — Every copy-paste theme-CSS snippet must typecheck under a strict TS scaffold

### Problem

The TanStack scaffold enables `noUncheckedSideEffectImports`; `import
'@cascivo/themes/all'` then fails TS2882 because the specifier maps to a `.css` file
without the `.css` extension. The `.css` twins exist precisely for this
(`packages/themes/package.json:31-61`) but **every** snippet in every doc, README, TSX
docs page, and the llms generator uses the extensionless form — including the TanStack
Start recipe in the SSR guide itself (`USING-WITH-VITE-SSR.md:111`). Zero mentions of
the flag or TS2882 anywhere.

### Spec

1. **Standardize all documentation on the `.css`-suffixed form.** The `.css` twin works
   in every bundler and every tsconfig; the extensionless form is the one with a
   failure mode. Sweep (source guides + generators; regenerated mirrors follow):
   `docs/GETTING-STARTED.md:164,255`, `docs/THEMING.md:296`,
   `docs/USING-WITH-VITE-SSR.md:49,111`, `docs/USING-WITH-NEXTJS.md:26,50`,
   `docs/USING-WITH-PREACT.md:101`, `docs/TROUBLESHOOTING.md:19,57`,
   `docs/COMPATIBILITY.md:110`, `docs/MIGRATING-FROM-SHADCN.md:94`,
   `scripts/llms/generate.ts:561` (+ its SSR SETUP block),
   `apps/site/src/pages/GettingStartedPage.tsx:99,113-115,136`,
   `apps/site/src/pages/InstallationPage.tsx:47`, `apps/site/src/pages/MigratingPage.tsx:62`,
   `apps/site/src/marketing/sections/QuickStart.tsx:16,57`, example apps' imports, CLI
   `init` output if it prints a theme import (check `packages/cli/src/commands/init.ts`).
   Keep the extensionless exports in the map (published API, non-breaking); reframe the
   GETTING-STARTED twin note (`:215-216`) to "prefer the `.css` form — the extensionless
   alias fails under `noUncheckedSideEffectImports`". `pnpm regen`.
2. **Package-level fix so the extensionless form also typechecks** (belt and
   suspenders — adopters will keep writing it): add a `types` condition to each
   extensionless CSS subpath pointing at a single shared declaration file shipped in the
   package (e.g. `types/css-side-effect.d.ts` containing `export {}`):
   `"./all": { "types": "./types/css-side-effect.d.ts", "default": "./src/all.css" }`.
   **Spike first** with a fixture tsconfig (`noUncheckedSideEffectImports: true`,
   `moduleResolution: "bundler"`): confirm TS resolves the condition for a side-effect
   import and the error disappears; confirm `pnpm pack:check` (publint/attw) accepts the
   shape (the pack-lint script already special-cases extensionless CSS subpaths — update
   its allowlist reasoning if needed). If the spike fails, ship step 1 + 3 only and
   record why.
3. **TROUBLESHOOTING entry keyed on the error string** — "TS2882 / Cannot find module
   or type declarations for side-effect import" → use the `.css` twin, one-line
   explanation, note about the TanStack scaffold default. Mirror in llms.txt
   troubleshooting lines.
4. **Guard**: extend `scripts/checks/docs-imports.test.ts` — any
   `import '@cascivo/themes/<name>'` in scanned docs **without** the `.css` suffix
   fails with a message pointing at this policy. (The check already resolves subpaths;
   this adds a form requirement for theme CSS imports.)
5. **Consumer-tsconfig fixture test** (new, small, in `meta:check` family): a fixture
   `.ts` file containing the canonical quickstart imports
   (`import '@cascivo/themes/all.css'`, `import '@cascivo/react/styles.css'`, `import
   { Button } from '@cascivo/react'`) type-checked against a strict tsconfig with
   `noUncheckedSideEffectImports: true` — so the quickstart can never again ship a
   snippet that fails the strictest mainstream scaffold. (Optional add: the TanStack
   `pnpm-workspace.yaml` pothole from the report's tooling notes as a TROUBLESHOOTING
   one-liner — cheap, third-party, do it while in the file.)
6. **Changeset**: `@cascivo/themes` **patch** (types-condition addition).

### Acceptance

- The fixture test passes; reverting a doc to the extensionless form fails
  `docs-imports`.
- `curl https://cascivo.com/docs/getting-started.md | grep "themes/all.css"` hits
  (canary added in WS-J).

---

## WS-D (P1) — `useTheme()`'s shape must be unmissable (it is a tuple, not next-themes)

### Problem

The reported `const { theme, setTheme } = useTheme()` snippet **does not exist and never
existed** in cascivo (repo + live-site grep: zero hits; tuple JSDoc since first commit).
The adopter — an AI — filled a gap with the next-themes shape, because:
(a) `docs/GETTING-STARTED.md:223-226` introduces `useTheme()` **without ever showing the
call**; (b) `docs/MIGRATING-FROM-SHADCN.md:189-190` says cascivo's hook is the "same
shape" as next-themes — whose hook returns exactly the `{ theme, setTheme }` object.
Second adopter to trip on this
(`feedback-tanstack-dashboard-adopter-2026-07.md:127-134`). For an AI-first library, the
common wrong guess must be named, not just the right answer shown.

### Spec

1. **GETTING-STARTED shows the shape at first mention** (`:223-226`): add the two-line
   canonical usage right there —
   `const [theme, setTheme] = useTheme() // tuple: [Signal<string>, (next) => void]` —
   plus one sentence: "the first element is a **signal**; read `theme.value`. It is not
   a `{ theme, setTheme }` object (that's next-themes)."
2. **Fix the shadcn migration guide's phrasing** (`MIGRATING-FROM-SHADCN.md:179-190`):
   replace "same shape" with an explicit contrast table row: next-themes
   `const { theme, setTheme } = useTheme()` → cascivo
   `const [theme, setTheme] = useTheme(); theme.value`.
3. **Negative guidance on the AI surfaces**: `docs/AI-RULES.md` reactivity section and
   the llms generator theming bullet gain one line: "`useTheme()` returns a **tuple**
   `[themeSignal, setTheme]` — never destructure `{ theme, setTheme }`." `pnpm regen`.
4. **Owner decision (default: no)** — a compatibility affordance that makes the tuple
   also carry named properties (`ret.theme`, `ret.setTheme`). It would absorb the wrong
   guess entirely, but adds API surface for one mistake and `theme` would still be a
   Signal (the deeper surprise). Revisit only if a third report trips on the shape
   after this WS ships. Recorded here so the next plan doesn't re-litigate.

### Acceptance

- Deployed `getting-started.md` contains `const [theme, setTheme]` (WS-J canary).
- `meta:check` docs guards green; regenerated artifacts committed.

---

## WS-E (P1) — Charts: per-series `y` accessors + document the shared-accessor model

### Problem

`AreaChart`/`LineChart`/`BarChart` accept one chart-level `x`/`y` applied to every
series (`area-chart.tsx:42-46`, `line-chart.tsx:38-41`, `bar-chart.tsx:23-26`); series
entries have no accessor field. Plotting `row.requests` and `row.errors` from the same
rows silently plots the same field twice; the only escape is pre-shaping each series'
`data` to `{x,y}` — undocumented, and the one helper (`toStackedSeries`) is Bar-only.

### Spec

1. **Additive per-series `y` override** on `AreaChartSeries`, `LineChartSeries`,
   `BarChartSeries` (and any other multi-series cartesian chart with the same
   `series + x/y` shape — enumerate mechanically from `registry.json` prop schemas and
   apply uniformly; expected candidates: scatter/step/composed variants if present):
   ```ts
   /** Per-series Y accessor; overrides the chart-level `y` for this series. */
   y?: (d: Datum) => number
   ```
   Resolution: `const yOf = (s) => s.y ?? y`. Every place the chart maps values —
   domain computation (`area-chart.tsx:168-173`), draw loops (`:384`), tooltips,
   legends — goes through `yOf(series)`. Keep `x` chart-level only (one x-domain per
   chart; state this in the JSDoc — per-series x would silently desynchronize
   category/time alignment).
2. **Manifests + docs**: each chart's `.meta.ts` gains (a) the new series prop, (b) an
   explicit note on the chart-level `x`/`y` props: "applied to every series unless the
   series provides its own `y`", (c) a "Multi-field rows" example — two series sharing
   one `data` array with different `y` accessors (the exact report scenario).
   `pnpm regen` (props-parity will enforce interface↔manifest agreement).
3. **JSDoc on the chart-level props** (`.d.ts` is a primary doc surface per the 07-20
   report): same sentence as 2(b).
4. **Changeset**: `@cascivo/charts` **minor**.

### Tests / acceptance

- Per chart: two series over one shared `data` array with different per-series `y` →
  rendered paths/bars differ and match each field (assert via the existing chart test
  patterns — path `d` attributes or rendered value labels).
- Domain test: y-domain spans the union of both accessors' values.
- Chart-level-only behavior unchanged when no series `y` present (regression suite
  green as-is).

---

## WS-F (P2) — `/docs/components` must resolve (and every route family gets an index)

### Problem

Live-reproduced: `cascivo.com/docs/components` → 404. `DOCS_ROUTES` has no
`/docs/components` key; the prefix match requires `/docs/components/<name>`
(`apps/site/src/DocsApp.tsx:59-86,126-145`). The machine index exists at
`/docs/components.md` but nothing at the guessed URL says so. `/docs/components` is the
single most guessable components URL for both humans and agents.

### Spec

1. **Add a `/docs/components` index route**: a static page listing all components
   grouped by category (data from `registry.json` at runtime, same as other docs
   routes), each linking to `/docs/components/<name>`; one line at top linking the
   machine-readable `/docs/components.md` and `/llms.txt`.
2. **Audit sibling families**: for every prefix family in `pageFor()`
   (`/docs/components/`, `/docs/categories/`, `/docs/themes/`) assert an index route
   exists at the prefix root; add any missing the same way.
3. **Wire into head/sitemap/prerender**: `route-head.ts` entry + sitemap + the
   prerender pipeline (`apps/site/vite.config.ts` prerender routes) so the page is
   fetchable HTML without JS.
4. **Guard**: extend `scripts/checks/docs-routes.test.ts` — every prefix family handled
   in `pageFor()` must have its prefix root present in `DOCS_ROUTES` (mechanical,
   fails when someone adds a new family without an index).
5. **Machine 404 pointer**: #161 added machine-readable 404s for `/llms/*`, `/context/*`,
   `/r/*`; extend the same pattern so unknown `/docs/*` paths return a 404 body that
   points at `/docs/components.md` + `/llms.txt` instead of the SPA shell.

### Acceptance

- `curl -o /dev/null -w '%{http_code}' https://cascivo.com/docs/components` → 200 after
  deploy (WS-J canary).
- `docs-routes` guard demonstrably fails when the new route is removed.

---

## WS-G (P2) — `Field` + labelled child: warn on the double label, document the pattern

### Problem

`<Field label="Email"><Input label="Email" /></Field>` renders two `<label>` elements
(`field.tsx:66-70` + `input.tsx:42-46`); Field clones `id`/aria onto the child but never
touches the child's own `label`. Nothing warns; `field.meta.ts` shows correct usage only
by omission.

### Spec

1. **Dev-time warning** in `Field`: when `label` is set and the (single) child's props
   also carry a non-null `label`, `console.warn` once per mount:
   `"cascivo Field: both Field and its child define a label — omit the child's label
   inside a Field (it would double-label the control)."` Gate on
   `process.env.NODE_ENV !== 'production'` (match however the repo already gates dev
   warnings — the #162 deprecated-prop warnings set the precedent; reuse that idiom).
   No automatic stripping — cloning `label: undefined` onto arbitrary children is too
   magical and could collide with a custom child's unrelated `label` prop.
2. **Docs**: `field.meta.ts` gains an antiPattern (both-labels, with the corrected
   snippet); `input.meta.ts` `label` prop description gains "standalone use only — omit
   when wrapping in a `Field`". Sweep other Field-compatible children with own `label`
   props (`textarea`, `native-select`, `password-input`, … — enumerate via a grep for
   `label?:` in `packages/components/src/*/`) and add the same sentence. `pnpm regen`.
3. **Changeset**: components channel **patch**.

### Tests / acceptance

- `field.test.tsx`: both-labels fixture warns once; single-label renders exactly one
  `<label>`; no warning in the correct pattern.

---

## WS-H (P2) — `Stack` disambiguation: implement the already-approved WS6

The 07-17 plan (`docs/plans/tanstack-start-experience-report-plan.md` WS6, lines
443-476) already decided this: **no rename, no alias** — point-of-use notes instead.
It was never implemented; this report re-confirms the hazard (`gap` vs `offset` reads as
inconsistency because the adopter reached for Stack as a spacing primitive). Implement
that spec verbatim: CLI `NAME_NOTES` for `stack` in `add`/`view`, discovery tags +
disambiguating description in `stack.meta.ts`, the llms.txt naming line
(`Stack ≠ vertical layout — use Flex direction="vertical"`), `pnpm regen`, CLI output
tests. One addition beyond the old spec: `stack.meta.ts`'s `offset` prop description
should state "px per overlapped layer — not a spacing `gap`; for gap-based layout use
`Flex`/`Grid` `gap`".

---

## WS-I (P2) — Router-link adapter: typed by inference, verified from a real consumer

### Problem

The 0.9.0 re-export closed the import gap (`packages/react/src/index.ts:69-79`), yet the
0.9.0 adopter still ended up with an `any`-typed adapter. Root cause of the residue:
`LinkComponent` is `ElementType` (`packages/core/src/link.ts:45`), so
`setLinkComponent(({ href, ...rest }) => …)` infers nothing — typed props require
knowing to import and annotate `LinkComponentProps`, which is the discovery step that
failed.

### Spec

1. **Strengthen `setLinkComponent`'s parameter** so inline adapters infer props:
   `setLinkComponent(component: ComponentType<LinkComponentProps> | 'a'): void`
   (or an equivalent union that keeps every currently-legal call compiling — verify
   against existing call sites/tests/examples; `ElementType` stays the stored type).
   Now `setLinkComponent(({ href, ...rest }) => <Link to={href} {...rest} />)` gets
   `href: string` for free.
2. **Consumer-fixture verification**: a type-level test that compiles a
   TanStack-shaped adapter against the **packed** `@cascivo/react` types (or, minimum,
   against `dist/index.d.ts` post-build) under `moduleResolution: "bundler"` — proving
   the re-export + inference works outside the workspace, which is where the 0.9.0
   adopter was. Slot it next to the pack-lint gate.
3. **Changeset**: `@cascivo/core` **patch**, `@cascivo/react` **patch**.

---

## WS-J (P2, but part of "done") — Guards + deployed canaries for every surface this report touched

1. **`docs-imports` scans per-file llms output.** `collectDocFiles()`
   (`scripts/checks/docs-imports.test.ts:98-110`) adds `apps/site/public/llms/**/*.md`
   and `apps/site/public/context/**/*.md` (currently only the two aggregate `.txt`
   roll-ups are scanned; finding #6's phantom import would have been invisible if the
   generator could emit it).
2. **Deployed-freshness canaries** (`scripts/checks/deployed-freshness.sh`) — add:
   - `/llms/layout/dashboard-layout.md` contains `Copy-paste only` and does **not**
     contain `@cascivo/layout/` (finding #6).
   - `/docs/getting-started.md` contains `themes/all.css` (WS-C) and
     `const [theme, setTheme]` (WS-D).
   - `/docs/components` returns HTTP 200 (WS-F).
   - `/docs/using-with-vite-ssr.md` contains the version-conditional `noExternal`
     phrasing marker (WS-A docs).
3. **Release + deploy are deliverables.** After the WS PRs merge: land the changesets
   "Version Packages" PR, publish, let the site deploy, then run
   `bash scripts/checks/deployed-freshness.sh` against production and paste the green
   output into the tracking issue/PR. **This plan is not "done" at merge.** (This is
   the third consecutive plan where the artifact lag — npm tarballs or deployed docs —
   is what the adopter actually hit; the canaries exist, but they only pay off if the
   release train leaves the station in the same effort.)
4. **CLAUDE.md**: add any new checks (WS-A pack-import smoke, WS-C fixture) to the
   "reproduce individual CI steps" list, per house convention.

---

## Explicit non-actions (decided; do not reopen without new evidence)

- **No `useTheme` API change** (WS-D decision point, default no) — docs + negative
  guidance first; revisit on a third shape-trip.
- **No rename/alias of `Stack`** — decided 07-17, unchanged.
- **No automatic label-stripping in `Field`** — dev warning + docs only.
- **No per-series `x` accessor** — one x-domain per chart; per-series `y` only.
- **No removal of `cascivoSsr()`/`noExternal` docs** — version-conditional phrasing,
  because pre-0.10 versions remain installed in the wild.
- **No fix for the `{ theme, setTheme }` snippet** — it does not exist; do not
  "correct" docs toward a bug report's misquote (verified against repo history and
  live production, 2026-07-22).

## Cross-cutting requirements

- Every PR: `pnpm ready` green; regenerated artifacts committed (drift gate);
  component-source changes respect the CLAUDE.md checklist and bundled checks.
- WS-A must also pass `pnpm ready:ci` (cold cache, sequential builds) — it adds a build
  output; build-ordering bugs are exactly what that gate catches.
- Changesets: react minor (WS-A) + minor (WS-B) · themes patch (WS-C) · charts minor
  (WS-E) · components patch (WS-G/WS-H) · core patch + react patch (WS-I).
- **Release requirement**: WS-A/B/C/E/G/I change published packages; the release train
  (Version Packages → npm publish → site deploy → canaries green) is the final
  acceptance gate for the whole plan.

## Suggested PR breakdown

1. **PR 1 (WS-A)** — SSR-safe dist: node condition, contract-test flip, example
   permutation, pack-import smoke, docs reframe. The headline fix; ships alone for
   reviewability.
2. **PR 2 (WS-B)** — controlled ThemeProvider SSR script + SSR tests + theme docs.
3. **PR 3 (WS-C + WS-D)** — `.css`-suffixed snippets everywhere + types-condition
   spike + TS2882 troubleshooting + useTheme shape docs + guards.
4. **PR 4 (WS-E)** — per-series `y` + chart docs.
5. **PR 5 (WS-F + WS-J)** — `/docs/components` route + route-family guard + machine
   404s + docs-imports scope + canaries.
6. **PR 6 (WS-G + WS-H + WS-I)** — Field warning, Stack notes, link typing.
7. **Release train** — Version Packages, publish, deploy, run canaries, record green.

## Open questions for the implementer (defaults chosen; deviate with reason)

1. **WS-A**: second full `vp build` pass vs `generateBundle` twin-emission for
   `dist/node/`? **Default: twin-emission in the existing plugin** — single build,
   watch-safe, and the plugin already knows exactly which line it injected. Take the
   second pass only if chunk-copy edge cases (sourcemaps, asset refs) get ugly.
2. **WS-A**: also ship the variant for packages where the dist scan finds no edges?
   **Default: no** — only packages that actually carry runtime `.css` imports get the
   `node` condition; an empty variant is pure surface area.
3. **WS-B**: should the controlled script also be emitted when `value` is undefined but
   `defaultTheme` is set? **Default: no** — uncontrolled first paint belongs to
   `themePreloadScript()` (it must consult `localStorage`, which the render-time script
   cannot do without duplicating the whole preload script inline in the body).
4. **WS-C**: if the `types`-condition spike fails publint/attw or TS resolution,
   ship docs-standardization + guard only? **Default: yes** — the `.css` form is the
   contract; the types condition is convenience.
5. **WS-E**: include per-series `color`-style `label` formatting or tooltip overrides
   while touching the series type? **Default: no** — scope is the accessor gap only.
