# v37 — Migration Hardening (boringtools feedback) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve every issue raised in `docs/feedback-from-boringtools-migration.md` — a real
shadcn/Tailwind → cascivo migration — in priority order, so the next consumer needs **zero patches**,
no `node_modules` grepping, and no hand-rolled app shell. Work is concentrated in the published
packages (`@cascivo/react`, `@cascivo/themes`, `@cascivo/tokens`, `@cascivo/components`) and generated
docs. The headline blocker (#1) is a one-line export typo that hard-fails strict bundlers; it ships in T1.

Target state (verified after T6):

| Metric                                              | Today                          | Target                                   |
| --------------------------------------------------- | ------------------------------ | ---------------------------------------- |
| Consumer patches required (strict bundler)          | 1 (`@cascivo__react.patch`)    | 0                                        |
| `@layer cascade.*` occurrences in shipped CSS       | 119 component + all themes     | 0 (`@layer cascivo.*`)                   |
| `@cascivo/tokens` loads for a light+dark setup      | 2                              | 1                                        |
| Base `font-family` applied to `html`/`body`         | no                             | yes (`@layer cascivo.base`)              |
| Published token manifest (JSON + `.d.ts`)           | none                           | yes, drift-checked                       |
| Published `.d.ts` leaking `packages/.../src`        | yes (per report)               | none (verified by grep check)            |
| App-shell glue shipped                              | none                           | `AppShell` (sticky/full-height/animated) |
| Component index + shadcn migration map              | none                           | generated index + migration page         |
| Brand-guard CI check                                | none                           | fails on `cascade` reintroduction        |
| Full CI gate (`pnpm ready`)                         | passing                        | passing                                  |

**Architecture & evidence (reproduced in-repo before planning):**

- **#1** `packages/react/package.json:39` → `"./styles.css": "./dist/cascade.css"`, but
  `packages/react/vite.config.ts` sets `cssFileName: 'cascivo'` → emits `dist/cascivo.css`. One-line fix.
- **#2/#5** `grep -rl "@layer cascade\." packages/components/src` = **119** files; every theme
  (`packages/themes/src/*.css:6`) opens `@layer cascade.theme`; package `description`s and JSDoc say
  "cascade". `docs/CSS-LAYERS-PITFALL.md` exists but uses the old layer name.
- **#3** `packages/themes/src/light.css:4` and `dark.css:4` both `@import '@cascivo/tokens'`; no
  `./all` export in `packages/themes/package.json`.
- **#4** `packages/react/scripts/flatten-types.mjs` already exists and runs in the build script —
  verify it actually flattens; the report saw leaked paths in the published `0.1.0`.
- **#6** no `font-family` rule on `html`/`body` anywhere in tokens/themes; `--cascivo-font-sans` is
  defined in `@cascivo/tokens` but never activated.
- **#7** `packages/themes/src/light.css` defines `color-background`+`color-bg`,
  `color-foreground`+`color-text`, `color-destructive`+`color-error`, `accent-foreground`+
  `accent-content`, etc.
- **#8** no `tokens.json` / token `.d.ts` in `packages/tokens` (only `screens.ts`).
- **#11/#12** `packages/components/src/side-nav/side-nav.module.css:7` `min-block-size: 100%`;
  line 14 already `transition: inline-size var(--cascivo-motion-emphasis)` (rail only); no sticky/dvh;
  `shell-header.tsx` exposes `onMenuClick`/`menuExpanded` but nothing binds it to `SideNav`.
- **#9/#10/#13** source README (`packages/react/README.md`, 217 lines) is full and documents the
  correct imports, but the report read an empty published README; no component index, no shadcn map.

**Tech Stack:** vite+ (`vp`) for build/check/test; `@cascivo/components` authoring rules (signals,
no `useState`/`useEffect`, progressive-enhancement CSS); generated artifacts via `pnpm regen`.

---

## Tranche Overview

| Tranche | Title                              | Goal                                                                                                       |
| ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| T1      | Unblock: export fix + rename       | Fix the `styles.css` export typo; sweep `cascade`→`cascivo` across CSS layers/JS/JSDoc/descs; add a guard. |
| T2      | Theming path + base layer          | `themes/all` bundle + documented single import; de-dupe token load; `@layer cascivo.base` font reset.      |
| T3      | Token canonicalization + manifest  | Canonical/alias table; generate `tokens.json` + token `.d.ts`; token reference doc.                        |
| T4      | Flattened published types          | Verify/fix `flatten-types`; add a check that published `.d.ts` expose no `packages/.../src`.               |
| T5      | AppShell layout + SideNav polish   | Ship `AppShell` (sticky/full-height/animated toggle, `inert`/focus); fix `min-block-size`; reconcile rail. |
| T6      | Docs: README + index + migration   | Quickstart, generated component index, shadcn→cascivo map; verify README ships; full gate + brand guard.   |
| T7      | Consumer hand-off guide            | Generate `docs/v37-CONSUMER-CHANGES.md` — a self-contained upgrade guide a downstream project can act on.   |

Ordering rationale: **unblock first** (T1 removes the patch every strict-bundler consumer needs and
finishes the rename that caused it). T2 and the packaging-DX tranches (T3 token manifest, T4 flat
types) are independent and could parallelize, but are sequenced T2→T3→T4 to keep one reviewable change
per tranche. T5 (AppShell) is the largest net-new component work and depends on the rename (T1) and the
motion/base conventions (T2). T6 documents everything the prior tranches produced and runs the final
gate. **T7 runs last** — it can only describe real, shipped changes, so the hand-off guide is written
after T1–T6 have merged.

---

## Files Created / Modified per Tranche

### T1 — Unblock: export fix + rename

| Action | Path                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------- |
| Modify | `packages/react/package.json` (`exports["./styles.css"]` → `./dist/cascivo.css`; `description`)   |
| Modify | `packages/components/src/**/*.module.css` (119 files: `@layer cascade.*` → `@layer cascivo.*`)     |
| Modify | `packages/themes/src/*.css` (`@layer cascade.theme` → `@layer cascivo.theme`; header comments)     |
| Modify | `packages/tokens/src/*.css` (any `@layer cascade.*`; `--cascivo-*` already correct)               |
| Modify | `packages/react/src/index.ts` + any JS/JSDoc strings mentioning "cascade" as the brand            |
| Modify | `packages/*/package.json` `description` fields that say "cascade design system"                   |
| Create | `scripts/brand-guard.mjs` (fail if `cascade` appears in shipped layer names / descs / JSDoc)       |
| Modify | `package.json` root scripts (`brand:check`) + wire into `pnpm ready` / CI                          |
| Modify | `docs/CSS-LAYERS-PITFALL.md` (new layer name) + `CHANGELOG`s (breaking layer rename note)          |

### T2 — Theming path + base layer

| Action | Path                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| Create | `packages/themes/src/base.css` (`@layer cascivo.base`: font-family/line-height/color on html/body) |
| Create | `packages/themes/src/all.css` (tokens once + base + light/dark)                                 |
| Modify | `packages/themes/src/*.css` (guard/remove duplicate `@import '@cascivo/tokens'`; import base once) |
| Modify | `packages/themes/package.json` (`./all`, `./base` exports)                                       |
| Modify | `packages/react/readme.body.md` (document single-import path + layer ordering)                  |
| Modify | `docs/CSS-LAYERS-PITFALL.md` (document `cascivo.base` < `theme` < `component` ordering)          |

### T3 — Token canonicalization + manifest

| Action | Path                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| Create | `scripts/tokens/generate-manifest.mjs` (parse theme/token CSS → `tokens.json` + `.d.ts`)        |
| Create | `packages/tokens/tokens.json` (role, value, canonical/alias) — generated, committed             |
| Create | `packages/tokens/src/tokens.d.ts` (union of token names) — generated                            |
| Modify | `packages/tokens/package.json` (export `./tokens.json`, types)                                  |
| Create | `docs/TOKENS.md` (canonical-vs-alias reference table) — generated section                       |
| Modify | `package.json` root `regen` script (run the token generator)                                    |

### T4 — Flattened published types

| Action | Path                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| Modify | `packages/react/scripts/flatten-types.mjs` (fix so emitted `.d.ts` reference no `packages/src`) |
| Create | `packages/react/scripts/check-types-flat.mjs` (grep `dist/**/*.d.ts` for leaked source paths)   |
| Modify | `packages/react/package.json` (run the check after build)                                       |

### T5 — AppShell layout + SideNav polish

| Action | Path                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| Create | `packages/components/src/app-shell/app-shell.tsx` (composes ShellHeader + SideNav + main)       |
| Create | `packages/components/src/app-shell/app-shell.module.css` (single scroll container, sticky, anim) |
| Create | `packages/components/src/app-shell/app-shell.test.tsx`                                           |
| Create | `packages/components/src/app-shell/component.meta.ts` (manifest)                                 |
| Modify | `packages/components/src/side-nav/side-nav.module.css` (`min-block-size:100%` → working constraint) |
| Modify | `packages/components/src/index.ts` + `packages/react/src/index.ts` (export `AppShell`)           |
| Modify | registry / docs generation inputs (new component flows through `pnpm regen`)                    |

### T6 — Docs: README + index + migration

| Action | Path                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| Modify | `packages/react/readme.body.md` (quickstart + embed generated component index)                  |
| Create | `scripts/readme/component-index.mjs` (categorized export list from manifests/registry)          |
| Create | `docs/MIGRATING-FROM-SHADCN.md` (variant/prop mapping table) + docs-app page                    |
| Verify | `npm pack` tarball includes README; component index renders in docs app                         |
| Verify | full gate (`pnpm ready` / `pnpm ready:ci`), `pnpm breakpoint:check`, brand guard                |

### T7 — Consumer hand-off guide

| Action | Path                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| Create | `docs/v37-CONSUMER-CHANGES.md` (per-issue "what changed / what to do" + upgrade checklist)       |

---

## Key Decisions

### Decision 1 — Layer rename is a clean break, no alias (recommended)

Renaming `@layer cascade.*` → `@layer cascivo.*` is a **breaking change to the public CSS API**: any
consumer that wrote `@layer cascivo.theme, app;` style ordering against the old name must update. The
project is `0.1.0` (pre-1.0), the feedback explicitly asks for it (#2/#5), and aliasing (declaring both
`cascade` and `cascivo` layers) would re-create the exact ambiguity the report complains about.
**Decision: rename cleanly, document the break** in `CHANGELOG` + `docs/CSS-LAYERS-PITFALL.md`, and add
a brand-guard check so it cannot regress. Alternative (keep `cascade` as an alias layer) — rejected;
perpetuates the leak.

### Decision 2 — The base layer lives in `@cascivo/themes`, not `react` or `tokens` (recommended)

#6 needs `font-family: var(--cascivo-font-sans)` (plus `line-height`/`color`) applied to `html`/`body`.
Three candidate homes:

- `@cascivo/tokens` — rejected: tokens stay **value-only** (no element selectors), which keeps them
  safe to import anywhere without side effects on the document.
- `@cascivo/react/styles.css` — rejected: copy-paste consumers (who use `npx cascivo add`, not the
  `react` package) would never get the base reset.
- **`@cascivo/themes` (chosen):** every consumer imports at least one theme; ship `base.css` as
  `@layer cascivo.base` and `@import` it from each theme (once). A consumer who imports one theme gets
  working base typography automatically. The base layer sits **below** `theme` and `component` in the
  cascade so components and consumer overrides still win.

### Decision 3 — Keep token aliases, mark canonical (recommended)

#7's duplicates (`bg`/`background`, `text`/`foreground`, `destructive`/`error`, `*-content`/
`*-foreground`) are real aliases in use. Dropping them is breaking for no immediate benefit.
**Decision: keep all tokens, publish a canonical/alias table + manifest (#8 solves #7)**, pick one
canonical name per role (standardize on the names the report adopted: `--cascivo-color-foreground`,
`--cascivo-color-text-muted`, `--cascivo-color-destructive`), and mark the rest as aliases in
`tokens.json`. Deprecation/removal is deferred to a future major. Alternative (drop aliases now) —
rejected; gratuitous breakage.

### Decision 4 — Ship `AppShell`, keep `SideNav` API, fix its height constraint (recommended)

#11/#12 ask for either an `AppShell`, `SideNav` sticky/open props, or docs. **Decision: ship a composed
`AppShell`** that owns (a) the single scroll container (`100dvh`, `overflow:hidden`, flex column),
(b) the `ShellHeader` burger ↔ `SideNav` open/close binding, (c) the animated show/hide reusing
`--cascivo-motion-*` with `prefers-reduced-motion` honored, (d) `inert` + focus management on the hidden
nav, and (e) reconciliation of full-hide vs rail collapse (one collapse model, not two fighting). The
existing `SideNav`/`ShellHeader` APIs are unchanged so current consumers don't break; separately, fix
`SideNav`'s `min-block-size:100%` → a constraint (`block-size:100%` within a constrained parent, or
`max-block-size`) so its own `overflow:hidden auto` fires and long nav lists scroll instead of
overflowing (the report's "backwards" footgun). `AppShell` follows authoring rules: no `useState`/
`useEffect`/`useContext`; open state is a `useSignal` synced from a controlled prop; DOM effects (`inert`,
focus) via `useSignalEffect`; React-app consumers documented to need `useSignals()` only if they read
the signal — `AppShell` manages its own. The known `grid 1fr→0fr` collapse trap (fails on an auto-width
flex item) is avoided by animating explicit `inline-size`/transform, per the report.

### Decision 5 — One token generator, three outputs (recommended)

#8 wants autocomplete + a list; #7 wants a canonical reference. **Decision: a single generator parses
the theme/token CSS and emits (1) `tokens.json` (the machine-readable source of truth, role + value +
canonical/alias flag), (2) `tokens.d.ts` (a string-literal union for editor autocomplete), and (3) a
docs table (`docs/TOKENS.md`).** It runs under `pnpm regen` and is drift-checked, so the manifest can
never silently diverge from the CSS. The MCP server can later read the same `tokens.json`.

### Decision 6 — Treat #4 and #13 as "verify it ships," not "rebuild" (firm)

`flatten-types.mjs` and a full README already exist in source — added since the report was written
against published `0.1.0`. **Decision: T4/T6 confirm the fix actually reaches the published artifact**
(a `dist/**/*.d.ts` grep check for #4; an `npm pack` tarball-contents check for #13) and add the missing
discoverability pieces (component index, shadcn map). If the existing flatten step already produces flat
types, T4 reduces to adding the regression check; if not, T4 fixes it.

---

## Cross-Tranche Rules

1. `pnpm exec vp check` must pass after each tranche; `pnpm ready` green before each commit.
2. **Consumer-first acceptance:** the canonical test for T1 is "a fresh strict-bundler app imports
   `@cascivo/react/styles.css` + a theme with no patch." Where practical, validate against
   `apps/examples/react-vite` or a scratch consumer.
3. **Only #2/#5 is intentionally breaking.** Everything else is additive (new exports, new component,
   new docs). Document the layer rename in CHANGELOG + `CSS-LAYERS-PITFALL.md`.
4. **Authoring rules bind** the new `AppShell`: no `useState`/`useEffect`/`useContext`/`useReducer`;
   `useSignal`/`useComputed`/`useSignalEffect` only; controlled `open` synced into a signal during
   render; CSS `@function`/`if()` only as progressive enhancement with a static fallback first.
5. **Responsive:** `AppShell` passes the mobile sweep at 320/360/390/414; no off-scale breakpoint
   literals (`pnpm breakpoint:check`); the collapsed nav uses `inert` + transform (never `display:none`
   only) so it stays keyboard-reachable when open and honors `prefers-reduced-motion`.
6. **Generated artifacts stay in sync:** token manifest, READMEs, component index, registry, docs all
   regenerate via `pnpm regen`; keep the drift gate green
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) and commit regenerated files.
7. **Brand guard:** `scripts/brand-guard.mjs` runs in CI and fails if `cascade` reappears as a shipped
   layer name, package `description`, or shipped JSDoc brand string. (Historical mentions in
   `docs/`/changelogs are exempt; the guard scopes to shipped artifacts.)
8. **No package whose root export resolves to `./dist/` is added without the source-alias checklist**
   in CLAUDE.md (docs/landing/storybook vite configs) — relevant if T3/T4 change `@cascivo/tokens`
   exports.
