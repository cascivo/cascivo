# Fix plan — TanStack Start adopter report (2026-07-20, published 0.8.0 packages)

**Status: planned — not implemented.** This document is the full spec for fixing every
item in the fourth TanStack Start hands-on report
(`docs/internal/feedback/feedback-tanstack-start-adopter-2026-07-20.md` — a Vercel-style
dashboard on TanStack Start 1.168 / React 19.2, against published `@cascivo/react` 0.8.0,
`@cascivo/charts` 0.3.13, `@cascivo/themes` 0.4.2, `@cascivo/tokens` 0.5.1). It is written
to be handed to an implementing agent as-is: every claim is triaged against the current
`main` (2026-07-20, HEAD `4ed689a`) with file:line evidence, and every workstream carries
a spec, tests, and acceptance criteria.

**Context that shapes this plan.** This is the first report whose two hard blockers are
**package defects, not doc defects**: the signals peer floor and the SSR `.css` crash live
in the published npm artifacts, so no amount of docs freshness fixes them for an adopter
who pins to what the metadata allows. The previous three reports' remediations
(2026-07-16 `fix-plan-tanstack-ssr-adopter-2026-07.md`, 2026-07-17
`docs/plans/tanstack-start-experience-report-plan.md`, 2026-07-18
`fix-plan-tanstack-start-adopter-2026-07-18.md`) all landed on `main` — the SSR recipe
doc, the getting-started SSR call-out, the theme recipes + mapping table, the
`setLinkComponent` re-export, `/docs/*.md` mirrors, and the freshness probes. Several of
this report's "no docs anywhere" claims are therefore **not reproducible against `main`**
— the adopter read the deployed site and the published 0.8.0 tarballs, both of which lag.
Two consequences the implementer must hold onto throughout:

1. **The fixes that matter most are code + `package.json` changes that must ship to npm.**
   A changeset-driven release at the end of this plan is part of the deliverable, not an
   afterthought (see "Release requirement" under cross-cutting).
2. **Docs findings get triaged against `main` first.** Where the content already exists,
   the work is delivery verification (canaries in the freshness probe), not re-writing.

## Triage — finding → verdict (numbers match the report's red-flags table)

| # | Report item | Verdict | Root cause / evidence | Workstream |
| --- | --- | --- | --- | --- |
| 1 | `.css` side-effect imports crash SSR without `ssr.noExternal`; "nothing in getting-started mentions this" | **Package behavior confirmed; docs claim not reproducible on `main`** | Per-component CSS side-effect imports are by design (`packages/react/vite.config.ts` `cssImportEdges`); a bare Node ESM loader cannot load them. Docs landed 07-16→07-18: `docs/USING-WITH-VITE-SSR.md` (full recipe + `cascivoSsr()` plugin), `docs/GETTING-STARTED.md` Path-B SSR call-out ("Server-rendering with Vite …? Add `ssr: { noExternal: [/^@cascivo\//] }`"). The adopter read a surface without them. Residual real work: make the package survive a bare Node loader (structural), surface the recipe in the npm README (the artifact the adopter *did* have), and canary the deployed guide | WS4 |
| 2 | Peer floor `@preact/signals-react >=2.0.0` admits a React-19-incompatible install | **Confirmed — 9 packages** | `>=2.0.0` in `packages/{core,react,charts,storage,i18n,ai,render,editor,flow}/package.json` peerDependencies. React 19 removed `__SECRET_INTERNALS…`; only signals-react 3.x supports it. cascivo's own catalog pins React 19.2 | WS1 |
| 3 | `themePreloadScript()` hydration mismatch; `defaultTheme` silently loses to OS `prefers-color-scheme` | **Confirmed in source** | `packages/react/src/theme.tsx:163-170` — the script applies OS preference *before* reading storage and *over* `defaultTheme`; `theme.tsx:25-30` (`osPreference`) gives `ThemeProvider` the same precedence. No doc mentions `suppressHydrationWarning` (`grep` over `docs/` — zero hits) | WS3 |
| 4 | Getting-started omits `@cascivo/react/styles.css`; full CSS set never stated together | **Not reproducible on `main`; one nuance wrong in the report** | `docs/GETTING-STARTED.md` Path B documents per-component CSS auto-import ("There is no component-CSS import to add") + the aggregate for no-bundler contexts; `docs/USING-WITH-VITE-SSR.md:39-43` states the full set (`react/styles.css` + `themes/all` [+ `charts/styles.css`]) in one block. Nuance: with a bundler, importing a component *does* pull its CSS (the `cssImportEdges` shim edges) — "import themes alone and every component is structurally unstyled" is only true for no-bundler/externalized-SSR contexts. Residual: one consolidated copy-paste "SSR setup" block + deployed canary | WS4 (docs part), WS8 (canary) |
| 5 | `@cascivo/tokens` is a hidden required dep of `@cascivo/themes` | **Confirmed** | `packages/themes/package.json` — tokens is `peerDependencies: { "@cascivo/tokens": ">=0.2.0" }` while `src/all.css:16-18` and every per-theme CSS `@import '@cascivo/tokens'`. Resolution currently depends on the consumer PM auto-installing peers | WS2 |
| 6 | Router-`Link` contract invisible in `@cascivo/react`'s `.d.ts`; `SideNavItem.render`'s `linkProps.onClick` required | **Partially confirmed** | `setLinkComponent`/`getLinkComponent`/`type LinkComponent` ARE re-exported (`packages/react/src/index.ts:74`, shipped in 0.8.0). But `scripts/flatten-types.mjs` keeps `@cascivo/core` external in the bundled `dist/index.d.ts`, so the contract is an opaque `import from '@cascivo/core'` when the d.ts is read as documentation. `SideNavLinkProps.onClick` is required (`packages/components/src/side-nav/side-nav.tsx:26`) even though cascivo's own handler is benign (preventDefault only when disabled, `side-nav.tsx:487-493`) | WS6 |
| 7 | `onValueChange` vs `onChange` vs `onClick` inconsistency | **Confirmed** | `tabs.tsx:19`, `segmented-control.tsx:15` use `onValueChange`; `slider`, `select`, `data-table`, `search`, etc. use `onChange` for non-native values; no stated convention anywhere | WS7 |
| 8 | `exports["."].import` → `./dist/react/src/index.js` vs `types` → `./dist/index.d.ts` (non-parallel subtrees) | **Confirmed** | `packages/react/package.json` `exports`; layout is a side effect of `preserveModulesRoot: '../components/src'` (`packages/react/vite.config.ts`) putting the entry outside the module root | WS5 |
| 9 | Website lacks per-component API docs; `.d.ts` was the real documentation | **Not reproducible against repo artifacts; consistent with the known deploy/host issue** | Per-component `/llms/<name>.md` + `/context/<name>.md`, `/docs/*.md` guide mirrors, and prerendered component pages all exist in `apps/site/public/` and the prerender pipeline. The 07-18 plan already diagnosed docs-host staleness and *deferred the `docs.cascivo.com` binding as an ops action* (`docs/internal/OPS-HOSTS.md`); this report is evidence the ops action is still outstanding | WS8 |

Priority order: **WS1 → WS2** (pure `package.json` fixes; each is a hard or latent
install-time blocker) → **WS3 → WS4 → WS5 → WS6** → **WS7/WS8**. WS1–WS6 all change
published packages and should ship in one release train.

---

## WS1 (P0) — Signals peer floor: `>=3.0.0` everywhere

### Problem

Nine published packages declare `"@preact/signals-react": ">=2.0.0"` as a peer. Any
adopter who pins to the documented floor (or whose resolver prefers an already-installed
2.x) gets a runtime that imports `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`
from React — removed in React 19 — and dies with a `SyntaxError` during SSR module
evaluation. cascivo targets React 19 in its own toolchain; the metadata contradicts it.

### Spec

1. **Verify the 3.x support matrix first** (one `npm view @preact/signals-react@3
   peerDependencies` / changelog check): confirm signals-react 3.x supports React 18 as
   well as 19. Expected: yes. Decision tree:
   - 3.x supports React `>=18` → bump the floor to `">=3.0.0"` and keep cascivo's
     `react`/`react-dom` peers at `>=18.0.0`. (Default path; the rest of this WS assumes
     it.)
   - 3.x were React-19-only (unexpected) → keep `react >=18` but floor signals at the
     lowest 3.x, and add an explicit compatibility note to `docs/COMPATIBILITY.md` +
     GETTING-STARTED instead. Record the evidence in the PR description either way.
2. **Bump the peer range** in all nine: `packages/{core,react,charts,storage,i18n,ai,
   render,editor,flow}/package.json` → `"@preact/signals-react": ">=3.0.0"`.
3. **Sweep every documented floor.** Grep `docs/`, `scripts/llms/generate.ts`, package
   READMEs, and the CLI for the string `>=2` / `2.0.0` next to `signals-react`; the CLI's
   peer-floor data (`checkPeerVersions` in `packages/cli/src/commands/add.ts` and any
   floor table it reads) must agree with the new range so `cascivo add` warns on a stale
   2.x install. `pnpm regen` afterwards for generated surfaces.
4. **`cascivo doctor` check** (extend the existing doctor checks): resolve the installed
   `@preact/signals-react` version from the project and error (not warn) when it is
   `<3.0.0` alongside React 19, with the exact upgrade command via the detected package
   manager (`installHint`). Warn when `<3.0.0` with React 18 (works today, upgrade
   advised).
5. **Compatibility note** in `docs/GETTING-STARTED.md` Path B (one sentence at the
   existing peer-deps paragraph): "React 19 requires `@preact/signals-react` 3.x — the
   peer range enforces this; if your lockfile pins 2.x from an earlier install, bump it."
   Mirror in `docs/COMPATIBILITY.md` and the llms.txt "Versioning & compatibility"
   section (`scripts/llms/generate.ts`), then `pnpm regen`.

### Tests / acceptance

- A repo-level check (natural home: extend `scripts/checks/pkg-exports.test.ts`'s sweep
  pattern or a small sibling `peer-floors.test.ts` in `meta:check`): every published
  package that peer-depends on `@preact/signals-react` declares a floor `>=3.0.0` — so
  the floor can never silently regress package-by-package.
- `cascivo doctor` test: fixture with signals-react 2.5.0 + react 19 → error with fix
  hint; 3.x → clean.
- Changeset: **patch** for all nine packages (metadata-only, but it changes what
  installs — call it out prominently in the changeset text so the release notes warn 2.x
  users).
- `pnpm ready` green.

---

## WS2 (P0) — `@cascivo/tokens` becomes a real dependency of `@cascivo/themes`

### Problem

`@cascivo/themes` CSS does `@import '@cascivo/tokens'` (`src/all.css:16-18`, plus every
per-theme file), but tokens is only a **peer** (`packages/themes/package.json`). The
import resolves today only when the consumer's PM auto-installs peers (pnpm default). On
npm with legacy config, yarn classic, or pnpm with `auto-install-peers=false`, the CSS
`@import` dead-ends and every component renders unstyled with no error pointing at the
cause.

### Spec

1. `packages/themes/package.json`: move `@cascivo/tokens` from `peerDependencies` to
   `dependencies` (keep the same range floor, as `>=0.2.0` or the current published
   minor — implementer picks the tightest range consistent with repo convention; tokens
   is CSS-only, so a direct dependency has zero dual-instance risk). Keep the
   `devDependencies` `workspace:*` entry for local resolution.
2. **Audit the same pattern repo-wide**: for every published package, list cross-package
   `@import '@cascivo/…'` statements in shipped CSS and cross-package runtime imports in
   shipped JS, and assert each target is a `dependencies` entry (not peer, not absent).
   Known other candidate: `@cascivo/charts/styles.css` (check), `@cascivo/react`'s
   aggregate (imports nothing cross-package — the layer order is inlined at build,
   `packages/react/vite.config.ts` `LAYER_ORDER`). Fix any further hits the audit finds
   the same way.
3. **Guard against recurrence**: new `scripts/checks/css-imports.test.ts` (node:test,
   wired into `pnpm meta:check`): for every `packages/*/` with published CSS (`files`
   globs), extract `@import '<pkg>'`/`@import '<pkg>/…'` targets from the shipped CSS
   sources and assert the package is declared in `dependencies`. Same
   allowlist-with-reasons pattern as the sibling checks.
4. **Docs**: `docs/GETTING-STARTED.md` Path B install line currently reads
   `pnpm add @cascivo/react @cascivo/themes @preact/signals-react` — after this WS that
   line is *correct* (tokens arrives transitively); add a half-sentence "(`@cascivo/tokens`
   comes with themes automatically)" so an adopter diffing their lockfile isn't
   surprised. Sweep llms.txt Quick Setup for the same. `pnpm regen`.

### Tests / acceptance

- The new `css-imports` check fails when tokens is reverted to a peer (verify once
  locally), passes after.
- In a fixture with `auto-install-peers=false` (or a plain `npm install` smoke against
  the packed tarballs), `node_modules/@cascivo/tokens` exists after installing only
  `@cascivo/themes`.
- Changeset: `@cascivo/themes` **patch**.

---

## WS3 (P0) — Theme preload/provider: explicit `defaultTheme` must win; hydration story documented

### Problem

Two distinct defects in `packages/react/src/theme.tsx`:

1. **Precedence.** Both `themePreloadScript()` (`:163-170`) and `ThemeProvider` (via
   `osPreference`, `:25-30`) resolve the initial theme as
   `persisted > OS prefers-color-scheme > defaultTheme > 'light'`. An explicitly passed
   `defaultTheme: 'dark'` is silently overridden by the visitor's OS — the report's
   dark-only dashboard rendered light for light-OS visitors. The precedence is doubly
   wrong for cascivo because themes are an *open string set*: with
   `defaultTheme: 'midnight'`, the OS branch replaces a valid theme name with `'light'`
   or `'dark'`, which is never what the author meant.
2. **Hydration.** The preload script mutates `<html data-theme>` before hydration; when
   the server-rendered attribute differs (or is absent), React 19 logs a hydration
   mismatch. The standard remedy — `suppressHydrationWarning` on the themed element — is
   in no cascivo doc (zero grep hits across `docs/`).

### Spec

**1. New precedence (code change, both surfaces, identical semantics):**

```
persisted value  >  explicit defaultTheme (option/prop was passed)  >  OS light/dark  >  'light'
```

- `themePreloadScript(options)`: consult `matchMedia` **only when
  `options.defaultTheme` is undefined**, and read storage first — the persisted value
  always wins (that part is already true in effect; restructure so the ordering is
  explicit). The emitted script stays dependency-free and `try`-wrapped as today.
- `ThemeProvider` / `themeStore()`: `osPreference()` is consulted only when the provider
  (or first configurer) did not pass `defaultTheme`. Concretely: track "explicit" in
  `ThemeConfig` (e.g. `defaultTheme: string; explicit: boolean`) so
  `themeStore()` seeds with `explicit ? config.defaultTheme : osPreference(config.defaultTheme)`.
- JSDoc on both: state the precedence list verbatim, and state that OS preference only
  ever yields `'light'`/`'dark'` — a custom-theme app should always pass `defaultTheme`.
- This is a behavior change for apps that passed `defaultTheme` AND relied on OS
  override: record it in `breaking-changes.json` (whatever generator/source feeds it)
  and the changeset text. Apps that passed nothing keep today's OS-following behavior.

**2. Hydration guidance (docs + JSDoc; no code):**

- `themePreloadScript` JSDoc: add the sentence "The script sets `data-theme` before
  React hydrates; add `suppressHydrationWarning` to the element carrying the attribute
  (usually `<html>`) — the mutation is intentional." Show it in the example snippet.
- `docs/THEMING.md` "Switching themes at runtime" section: extend the SSR sub-recipe
  with a complete TanStack Start / Next.js-shaped snippet: inline script in `<head>`,
  `suppressHydrationWarning` on `<html>`, `ThemeProvider` in the tree. State the
  precedence table.
- `docs/GETTING-STARTED.md` "Runtime switching & SSR (no-flash)" subsection: add the
  `suppressHydrationWarning` line to the persisted-theme bullet (the static-theme bullet
  is already correct and stays the blessed single-theme answer).
- `docs/USING-WITH-VITE-SSR.md` "Theme switching without a flash (SSR)" section: same
  addition; this is the file the SSR canary (WS8) watches.
- llms.txt reactivity/theming bullets (`scripts/llms/generate.ts`): one line for the
  precedence and one for `suppressHydrationWarning`. `pnpm regen`.

**3. Controlled-value note.** The report's workaround (`<ThemeProvider value="dark">`)
is legitimate; document it in THEMING as the controlled form ("parent owns the state;
persistence off"), since `value` is already implemented (`theme.tsx:120-122`).

### Tests / acceptance

- `packages/react/src/theme.test.tsx` additions:
  - Provider precedence matrix: (a) persisted value beats explicit `defaultTheme`;
    (b) explicit `defaultTheme: 'midnight'` beats mocked `matchMedia` dark; (c) no
    `defaultTheme` + OS dark → `'dark'`; (d) nothing at all → `'light'`.
  - Preload script: evaluate the returned string with `new Function` in jsdom with
    mocked `localStorage` (both the `{"v":1,"value":…}` envelope and bare-string forms)
    and mocked `matchMedia`, assert the resulting `document.documentElement` attribute
    for the same four cases.
- Acceptance: `themePreloadScript({ defaultTheme: 'dark' })` renders dark for a
  light-OS visitor with nothing persisted; an OS-following app (no option) behaves
  exactly as before.
- Changeset: `@cascivo/react` **minor** (behavior change + doc'd contract), with a
  migration note.

---

## WS4 (P1) — SSR out-of-the-box: survive a bare Node ESM loader, and put the recipe where the adopter actually is

### Problem

The `.css` side-effect imports make the published `@cascivo/react` (and charts/editor/
flow) unloadable by Node's native ESM loader — the default state of an externalized
dependency in every Vite SSR framework. The one-line fix (`ssr.noExternal`) and the
`cascivoSsr()` plugin are documented on `main` (see triage #1), but (a) the package
itself still greets an unconfigured adopter with `ERR_UNKNOWN_FILE_EXTENSION` deep in
`node_modules`, and (b) the surfaces the adopter demonstrably had — the npm tarball and
its README — don't carry the recipe.

### Spec

**1. Structural investigation (the real fix): a CSS-import-free server condition.**
Goal: `import '@cascivo/react'` under bare Node succeeds with zero consumer config.
Approach to evaluate — publish a second, CSS-free build variant selected by the `node`
export condition:

- Build: same component graph, with the `cssImportEdges` injection step skipped (no
  `import './x.css'` edges) — e.g. a second `vp build` pass or a flag in the plugin
  writing to `dist/node/`. JS is otherwise identical (same chunks, same `'use client'`
  banners).
- Exports map: `"." : { types, browser: <css build>, node: <css-free build>, import/default: <css build> }`
  — exact condition ordering to be validated. Validation matrix the implementer must
  run before committing to this design (this is the risky part; do it in a spike):
  - Bare Node ESM `import` (TanStack Start dev SSR, externalized) → picks `node`,
    loads clean. ✔ target behavior.
  - Vite client build → `browser` condition → CSS edges preserved.
  - Vite SSR **with** `noExternal` (existing adopters) → Vite's SSR resolver includes
    `node` in its conditions: the CSS-free build gets bundled. That is *fine for
    correctness* (CSS never renders server-side) **as long as** the client build still
    carries the CSS — verify no de-dup/two-instance hazard when client and server
    resolve different files of the same package (React context identity does not cross
    the client/server boundary, so this should be safe; confirm module-level singletons
    in `@cascivo/react` — e.g. the theme store, `setLinkComponent` registry — live in
    `@cascivo/core`, which is a single shared instance either way; they do — both are
    core exports).
  - webpack/Next.js: `node` + `react-server` condition behavior; Next already has its
    own recipe (`docs/USING-WITH-NEXTJS.md`) — must not regress it.
- The aggregate `@cascivo/react/styles.css` remains the documented stylesheet for SSR
  first paint — unchanged.
- **Fallback decision:** if the spike shows a condition-matrix footgun (e.g. a bundler
  that resolves `node` for the *client* SSR pass and silently drops CSS), do **not**
  ship the variant; instead keep `noExternal` as the blessed path and double down on
  items 2–4 below. Record the spike result in the PR either way. Deliverable in both
  cases: `apps/examples/react-vite-ssr`'s test extended with a "no `noExternal`, bare
  Node import of the built dist" assertion (expected to pass with the variant, expected
  `.css`-error with the fallback — assert whichever ships, so the behavior is pinned).

**2. npm README first screen.** `packages/react/README.md` (and charts/editor/flow
READMEs): an "SSR (TanStack Start, Remix, vite-ssr, workerd)" box within the first
screenful — the three lines: `ssr.noExternal` (or `cascivoSsr()`), the full CSS import
set, and a link to the canonical guide URL (`https://cascivo.com/docs/using-with-vite-ssr.md`).
The README is the one doc surface guaranteed to match the installed version.

**3. One consolidated copy-paste "SSR setup" block** — the report's closing ask.
`docs/USING-WITH-VITE-SSR.md` TL;DR already has 2 of 4 items; extend it to all four in
a single fenced block sequence: (a) `ssr.noExternal`, (b) `@preact/signals-react` **3.x**
pin note (one line, links WS1's compatibility note), (c) full CSS import set incl.
`@cascivo/charts/styles.css` when charts are used, (d) `themePreloadScript()` +
`suppressHydrationWarning` (from WS3). Mirror the same four-item block into the
getting-started SSR call-out as a link ("the 4-line SSR checklist"), not a copy.

**4. `cascivo doctor` SSR heuristic** (advisory): when the project depends on a known
Vite SSR framework (`@tanstack/react-start`, `@remix-run/*` on Vite, `vite-ssr`) and no
`vite.config.*` in the project contains `noExternal` matching `@cascivo` or the
`cascivoSsr` plugin import, print a warning with the one-liner and the guide URL. Text
match is enough — this is a hint, not a gate.

### Tests / acceptance

- Spike outcome documented; whichever branch ships, the `react-vite-ssr` example's test
  pins it.
- With the `node`-condition variant: a fixture that runs
  `node -e "await import('@cascivo/react')"` against the packed tarball exits 0.
- README boxes present (assert via the existing docs-link/docs-imports check family if
  READMEs are in scope; otherwise a simple grep test in `meta:check`).
- Doctor test: fixture with `@tanstack/react-start` + configless vite.config → warning;
  with `cascivoSsr()` → silent.
- Changesets: `@cascivo/react` (+charts/editor/flow if they get the variant) **minor**
  for the export-condition change; README-only changes ride along.

---

## WS5 (P1) — `@cascivo/react` exports map: parallel subtrees + publint/attw gate

### Problem

`exports["."].import` → `./dist/react/src/index.js` while `types` → `./dist/index.d.ts`.
It resolves under `moduleResolution: bundler`/`node16` (types don't need to be adjacent),
but the non-parallel layout trips `publint`/`arethetypeswrong`-class tooling and reads as
a packaging accident. Root cause: `preserveModulesRoot: '../components/src'`
(`packages/react/vite.config.ts`) roots the module tree at the components package, so the
react entry lands under `dist/react/src/`.

### Spec

1. **Flat entry shim.** Emit `dist/index.js` containing exactly
   `export * from './react/src/index.js'` (plus the `'use client'` banner to match
   sibling chunks). Implementation: `this.emitFile` in the existing `cssImportEdges`
   plugin's `generateBundle` (it already emits `styles.css`), or a 5-line step in
   `scripts/flatten-types.mjs` (which already owns post-build dist shaping) —
   implementer's choice; prefer the build plugin so `vp build --watch` stays correct.
2. **Point the map at it**: `exports["."]` → `types: ./dist/index.d.ts`,
   `import`/`default`: `./dist/index.js`. Parallel, flat, boring. (If WS4 ships the
   `node` condition, its entries follow the same flat pattern, e.g. `./dist/node/index.js`.)
3. **Gate**: add `publint` and `@arethetypeswrong/cli` over the **packed** artifacts of
   every published package. Wiring: a `release:check`-style script
   (`scripts/checks/publint.sh` or a node runner) executed in CI on the release path and
   available locally; running it inside `pnpm ready` is acceptable only if the pack step
   is fast enough — otherwise a dedicated CI job. Treat errors as failures; triage
   warnings once at introduction and allowlist-with-reasons anything intentional
   (e.g. themes' extensionless CSS subpaths, if flagged).
4. Sweep the other published packages against the same gate while introducing it —
   the 07-18 plan fixed `./package.json` exports repo-wide; this catches whatever class
   publint finds next.

### Tests / acceptance

- `attw --pack packages/react` reports no errors; `publint` clean (or allowlisted with
  reasons) for all published packages.
- Consumer smoke unchanged: the `react-vite-ssr` example and `apps/examples/*` build
  green (they exercise the "." import path).
- Changeset: `@cascivo/react` **patch**.

---

## WS6 (P1) — Router-link contract: visible in the shipped types, spreadable by design

### Problem

The right API exists and is exported (0.8.0 ships `setLinkComponent`/`getLinkComponent`/
`LinkComponent` from `@cascivo/react`, `packages/react/src/index.ts:74`), but:

- In the flattened `dist/index.d.ts` (built by `scripts/flatten-types.mjs`, which keeps
  `@cascivo/core` external), `LinkComponent` appears as an opaque re-export — an adopter
  reading the d.ts as documentation (the report's stated workflow, and the norm for
  agents) never sees the prop contract or the `href → to` mapping idiom.
- `SideNavLinkProps.onClick` is declared required (`side-nav.tsx:26`). As a *provided*
  bag it always is present, but the required marking (plus no doc stating that the
  handler only `preventDefault`s when disabled — `side-nav.tsx:487-493`) made the
  adopter assume it fights router click handling, and they fell back to per-item
  `preventDefault` bridging, losing middle-click/new-tab.

### Spec

1. **Name and document the props contract in core.** In `packages/core/src/link.ts`:
   ensure the prop bag type is a named, exported, fully JSDoc'd interface (e.g.
   `LinkComponentProps` — align with whatever name exists; export it if it is currently
   inline/anonymous): `href`, `className`, `aria-current`, `aria-disabled`,
   `aria-label`, `data-state`, `data-tone`, `tabIndex`, `onClick`, `children`, plus
   whatever the call sites actually pass (derive from the union of `getLinkComponent()`
   call sites: side-nav, shell-header, header, breadcrumb, dock, switcher,
   navigation-menu — reconcile, don't guess). JSDoc on `setLinkComponent` gets the
   TanStack mapping example verbatim:
   ```tsx
   setLinkComponent(({ href, ...rest }) => <Link to={href} {...rest} />)
   ```
   and the sentence "the registered component receives the full computed bag — spread it
   so active-state and a11y attributes carry over; native middle-click/new-tab behavior
   is preserved because navigation stays an `<a>`."
2. **Re-export the props type** from `@cascivo/react` alongside the existing line
   (`index.ts:74`): `export type { LinkComponentProps } from '@cascivo/core'`.
3. **Flattened d.ts visibility — decide, don't drift.** Default decision: keep
   `@cascivo/core` external in the type bundle (inlining core types into react's d.ts
   creates type-identity duplication for anyone importing both packages), **but** verify
   that "Go to definition" from `LinkComponent`/`LinkComponentProps` in a consumer
   project resolves into core's shipped `.d.mts` in one hop (core is a real
   `dependencies` entry of react, so node resolution works — assert it in the fixture
   below). If the verification fails under `moduleResolution: bundler` + pnpm, escalate
   to inlining and document the trade-off in the PR.
4. **`SideNavLinkProps.onClick` → optional** (`onClick?:`), with JSDoc: "Always provided
   by cascivo when it builds the bag; only calls `preventDefault()` for disabled items.
   Safe to spread onto a router `<Link>` — routers compose their own click handling with
   a spread `onClick`." Audit the other nav components exposing a render/linkProps hatch
   for the same required-marking (breadcrumb, shell-header, dock — same fix if present).
5. **Docs**: `docs/USING-WITH-VITE-SSR.md` "Router-aware nav links" section already
   teaches `setLinkComponent`; add the contract interface name so readers can look it
   up, and a line on the `render` hatch being the per-item escape only.
   `docs/GETTING-STARTED.md`: add a two-line "Using a router?" pointer at the end of
   Path B linking that section. llms.txt: extend the existing link bullet with the
   props-type name. `pnpm regen`.

### Tests / acceptance

- Type-fixture test (in `packages/react` tests or the existing export-surface test):
  `import type { LinkComponent, LinkComponentProps } from '@cascivo/react'` compiles;
  a TanStack-shaped adapter (`({href, ...rest}) => …`) satisfies `LinkComponent`.
- `side-nav.test.tsx`: a `render`-hatch item spreading `linkProps` onto an `<a>` —
  plain click on an enabled item does **not** have `defaultPrevented`; disabled item
  does.
- Grep the shipped `dist/index.d.ts` after build: contains the JSDoc'd
  `setLinkComponent` docs (bundler preserves JSDoc — verify; if vp's dts bundler strips
  it, that's a finding to fix or work around, note it).
- Changeset: `@cascivo/core` **minor** (new/renamed exported type), `@cascivo/react`
  **patch** (re-export), `@cascivo/components`-channel patch for the side-nav typing.

---

## WS7 (P2) — Change-handler naming: one stated convention, outliers migrated

### Problem

`Tabs`/`SegmentedControl` use `onValueChange`; `Slider`, `Select`, `DataTable`,
`Search`, and most inputs use `onChange` (often for **custom values**, not native
events); nav items use `onClick`/`onSelect`. There is no stated rule, so neither humans
nor agents can predict the name (the report hit the type error in exactly this gap).

### Spec

1. **State the convention** (this is the load-bearing deliverable; the renames serve it):
   - Native-wrapper components whose handler receives the **DOM event** of a real
     underlying element (`Input`, `Textarea`, `Checkbox`, …): `onChange(event)` —
     matches the platform.
   - Composite/custom-value components whose handler receives a **value** (`Tabs`,
     `SegmentedControl`, `Select` if custom, `Slider`, `MultiSelect`, `RatingGroup`,
     `TagsInput`, `ColorPicker`, `OtpInput`, …): `onValueChange(value)`.
   - Activation of an item/action: `onSelect` (menus, nav items); raw DOM passthrough
     stays `onClick`.
2. **Audit table first.** Generate the current inventory mechanically from
   `registry.json` (props named `onChange`/`onValueChange`/`onSelect` + their types) and
   commit it to the PR description. Classify each against the convention; the outliers
   are the migration set. Expect the main offenders to be value-carrying `onChange`
   props.
3. **Migrate additively, not breaking**: for each outlier, add the convention-correct
   name and keep the old one working as a deprecated alias (both optional; invoke both
   if both passed is a mistake — prefer "new name wins, dev-mode `console.warn` once
   when the deprecated name is used"). Mark the old prop `@deprecated` in TSDoc and in
   the manifest so docs/AI surfaces steer to the new name. Removal is a future major —
   record each alias in `breaking-changes.json`'s deprecation channel (or equivalent).
4. **Publish the convention** where agents and humans look: `docs/AI-RULES.md` (agents
   generate against this), the llms.txt "Reactivity & state" section, and a short
   subsection in `docs/HEADLESS.md` or GETTING-STARTED ("Event naming"). `pnpm regen`.
5. Props-parity and docs gates pick up the manifest edits automatically; commit regen
   artifacts.

### Tests / acceptance

- Per migrated component: test that the new name fires with the value, the old name
  still fires (aliased), and the dev warning appears exactly once.
- The convention text exists in AI-RULES + llms.txt; `pnpm meta:check` green.
- Changesets: affected packages **minor** (new props), with the deprecation list
  enumerated.

---

## WS8 (P2) — Docs delivery follow-through: canaries for this report's surfaces, and the outstanding host-binding ops action

### Problem

Finding #9 ("website is thin, no per-component API docs") is not reproducible against
the repo: per-component `/llms/<name>.md`, `/context/<name>.md`, the `/docs/*.md` guide
mirrors, and prerendered component pages all exist. This is the *second consecutive
report* consistent with the deployed docs hosts serving stale or unbound content — the
07-18 plan built the freshness machinery (stamps, `verify-site` post-deploy job, daily
`docs-freshness` probe, `scripts/checks/deployed-freshness.sh`) and explicitly deferred
the `docs.cascivo.com` custom-domain binding as an ops action (`docs/internal/OPS-HOSTS.md`).

### Spec

1. **Ops action (owner, not agent): execute the OPS-HOSTS.md binding fix.** This plan
   cannot do it from the repo; it CAN make the failure loud: check whether the daily
   `docs-freshness` workflow has been red since it landed — if it has been red and
   unactioned, that is the process failure to report to the owner. Add this plan's
   findings as a dated addendum to `OPS-HOSTS.md` ("third adopter report blocked on this
   binding, 2026-07-20").
2. **Extend the canaries** in `scripts/checks/deployed-freshness.sh` with the exact
   surfaces this adopter needed and didn't find:
   - `/docs/getting-started.md` contains `noExternal` (the SSR call-out) **and**
     `styles.css` (the aggregate stylesheet story) — guards findings #1/#4's doc layer.
   - `/docs/using-with-vite-ssr.md` reachable and contains `suppressHydrationWarning`
     (post-WS3) — guards finding #3's doc layer.
   - One per-component API canary beyond `stat.md` — e.g. `/llms/data-table.md`
     contains `` `sortable` `` — plus one theme surface: `/docs/theming.md` contains
     `data-theme`.
3. **Per-theme reference surface** (the "twelve themes advertised, nothing fetchable
   per-theme" gap): the theme ↔ `data-theme` mapping table already lives in
   `docs/GETTING-STARTED.md` (published as `/docs/getting-started.md`). Cheapest
   sufficient fix: link that table explicitly from llms.txt's theming line and from
   `/docs/theming.md`'s top ("full theme list + import↔attribute mapping: …"). Do NOT
   build per-theme generated pages unless a future report asks again — record that
   decision here.
4. **`.d.ts`-as-docs is a feature — say so.** The report's happy path ("types were the
   real documentation") is worth one line in llms.txt and the react README: the shipped
   `dist/index.d.ts` is self-contained and intended to be read; agents without web
   access should prefer it plus `/llms/<name>.md`.

### Tests / acceptance

- `deployed-freshness.sh` runs green against production after the next deploy AND the
  ops binding fix; the new assertions demonstrably fail against a stale target (spot
  verify once, as the 07-18 plan did).
- OPS-HOSTS.md addendum committed; owner pinged in the PR description about the
  workflow's red-run history (state the actual dates found).

---

## Explicit non-actions (decided; do not reopen without new evidence)

- **No rewrite of the getting-started/SSR docs content** — findings #1/#4's doc layer
  landed on `main` before this report was filed; the residual work is the consolidated
  4-item SSR block (WS4.3), README surfacing (WS4.2), and delivery canaries (WS8).
- **No per-component CSS import instructions for bundler users** — per-component CSS
  auto-imports via the shipped side-effect edges; the aggregate `styles.css` remains
  the SSR/no-bundler path. The report's "themes alone → structurally unstyled" is
  inaccurate for the bundler case; don't "fix" docs toward it.
- **No breaking rename in WS7** — additive aliases + deprecation only; removals wait
  for a major.
- **No inlining of core types into react's d.ts** unless WS6.3's one-hop verification
  fails — type-identity duplication is a worse papercut than the extra hop.

## Cross-cutting requirements (all workstreams)

- Every PR passes `pnpm ready` (regen → `vp check --fix` → build → typecheck → tests)
  and commits regenerated artifacts; the drift job diffs them. New checks (WS1
  peer-floor sweep, WS2 `css-imports`, WS5 publint/attw) get added to the CLAUDE.md
  "reproduce individual CI steps" list per house convention.
- Component-source changes (WS6 side-nav typing, WS7 aliases) respect the CLAUDE.md
  component checklist (signals-only, i18n, breakpoint/layers/primitives checks — no CSS
  is touched, so mostly moot, but the gates run regardless).
- **Release requirement.** WS1–WS6 change published packages; after they merge, the
  changesets "Version Packages" PR must be landed and packages published — the two P0
  blockers exist *only* in the published artifacts from an adopter's point of view.
  Deployment of the site (docs) follows automatically; WS8's canaries then verify it.
- Changesets summary: WS1 patch ×9 · WS2 themes patch · WS3 react minor (+
  breaking-changes entry) · WS4 react/charts/editor/flow minor (if the node condition
  ships; otherwise README-only) · WS5 react patch · WS6 core minor + react patch +
  components patch · WS7 affected packages minor.

## Suggested PR breakdown

1. **PR 1 (WS1 + WS2)** — peer floor `>=3` everywhere + tokens as a real dependency +
   both guard checks. Small, metadata-only, kills both install-time traps atomically.
2. **PR 2 (WS3)** — theme precedence change + hydration docs + tests +
   breaking-changes entry.
3. **PR 3 (WS5)** — exports flat entry + publint/attw gate. (Before WS4 so the gate
   validates WS4's condition additions.)
4. **PR 4 (WS4)** — node-condition spike → variant or documented fallback; README SSR
   boxes; consolidated SSR block; doctor heuristic.
5. **PR 5 (WS6)** — link contract naming/JSDoc/re-export + side-nav `onClick?` +
   docs.
6. **PR 6 (WS7)** — naming convention + audit + aliases.
7. **PR 7 (WS8)** — canaries + OPS-HOSTS addendum. Then: land Version Packages,
   publish, verify canaries against production.

## Open questions for the implementer (defaults chosen; deviate with reason)

1. **WS1**: if signals-react 3.x turns out to floor React at 19 (unexpected), do we
   drop React 18 support? **Default: no** — keep `react >=18`, floor signals at the
   newest 2.x-compatible guidance in COMPATIBILITY.md and gate via doctor instead;
   escalate to the owner before narrowing any react peer.
2. **WS3**: should OS preference apply when `defaultTheme` is explicitly `'light'` or
   `'dark'` (i.e. treat those two values as "still OS-eligible")? **Default: no** —
   explicit is explicit; one rule, no special cases. An app that wants OS-following
   passes nothing.
3. **WS4**: ship the `node` condition for all four CSS-importing packages at once, or
   react first? **Default: react first** (highest blast radius, the example app pins
   it), charts/editor/flow in the same PR only if the spike shows zero per-package
   variance.
4. **WS5**: run publint/attw in `pnpm ready` or CI-only? **Default: CI job + local
   script** — packing 15 tarballs on every local `ready` is too slow; the gate must
   block release, not iteration.
5. **WS7**: dev-mode warning on deprecated prop use — `console.warn` once per component
   type, or silent aliasing? **Default: warn once** — silent aliases never get
   migrated; a single warning is the cheapest nudge that respects consoles.
