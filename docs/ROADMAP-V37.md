# cascivo — Roadmap v37: Migration Hardening — Fix the boringtools Migration Feedback

**Last updated:** 2026-06-18
**Status:** 🚧 Planning
**Plan documents:** `docs/superpowers/plans/2026-06-18-v37-master-plan.md` + tranches 1–7
**Source:** `docs/feedback-from-boringtools-migration.md`

---

## Vision

A real consumer (the `boringtools` `apps/web`, Astro 5 + React 19 + Vite 6) migrated from
shadcn/ui + Tailwind to cascivo (`@cascivo/react` `0.1.0`) and wrote up exactly where the system
fought them. Their verdict: **"once past the packaging papercuts (#1–#4), the actual component and
token API was pleasant … the issues above are mostly distribution/docs polish, not design problems."**

v37 is the **migration-hardening** sprint: fix every issue that report raised, in priority order,
so the next consumer never has to patch our package, grep `node_modules` to discover tokens, or
hand-roll an app shell. The work is concentrated in the published packages — `@cascivo/react`,
`@cascivo/themes`, `@cascivo/tokens`, `@cascivo/components` — plus generated docs/READMEs.

The single highest-impact fix (#1) is a **one-line export typo** that hard-fails strict bundlers
and forced the consumer to ship a `patch-package` patch. It ships first.

---

## The feedback, verified against the codebase

Each item below was reproduced in this repo before planning (file:line evidence in the master plan):

| #   | Severity   | Issue                                                                 | Verified                                                                 |
| --- | ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | 🔴 Blocker | `@cascivo/react` `exports["./styles.css"]` → `./dist/cascade.css`     | ✅ build emits `cssFileName: 'cascivo'` → `cascivo.css`; export typo'd    |
| 2   | 🔴 Blocker | Incomplete **cascade → cascivo** rename (root cause of #1)            | ✅ 119 component CSS + all theme CSS use `@layer cascade.*`; JS/JSDoc/descs |
| 3   | 🟠 DX      | Three CSS imports, `@cascivo/tokens` double-loaded by light+dark      | ✅ both `light.css`/`dark.css` `@import '@cascivo/tokens'`; no bundle      |
| 4   | 🟠 DX      | Published `.d.ts` leak `packages/.../src` internal layout            | ⚠️ `flatten-types.mjs` exists — verify it actually rolls up               |
| 5   | 🟡 Tokens  | Component CSS in a named layer — override story undocumented + name   | ✅ layer is `cascade.component`; `CSS-LAYERS-PITFALL.md` exists, stale name |
| 6   | 🟡 Tokens  | `--cascivo-font-sans` defined but never applied to `html`/`body`     | ✅ no base element sets `font-family`; plain markup falls back to serif    |
| 7   | 🟡 Tokens  | Duplicate semantic color tokens, no documented canonical             | ✅ `bg`/`background`, `text`/`foreground`, `destructive`/`error`, …        |
| 8   | 🟡 Tokens  | No exported list / autocomplete for CSS custom properties            | ✅ no JSON/`.d.ts` token manifest; consumer grepped `node_modules`         |
| 9   | 🟢 API     | Component discoverability — no "what exists" index                   | ✅ ~115 exports, only discoverable by reading `index.d.ts`                 |
| 10  | 🟢 API     | shadcn→cascivo variant mapping missing (`primary` vs `default`, …)   | ✅ no migration mapping doc; props themselves praised                      |
| 11  | 🟢 API     | `SideNav`/`ShellHeader` ship no `AppShell` glue (sticky/scroll/toggle)| ✅ `min-block-size:100%`, no sticky/dvh, no header↔nav binding             |
| 12  | 🟢 API     | `SideNav` show/hide has no animation (`inert`/focus handling either)  | ✅ rail collapse animates `inline-size`; no show/hide transition           |
| 13  | 🟢 Docs    | Published README essentially empty                                    | ⚠️ source README is full (217 lines); verify it ships + add index/map      |

> Two items (#4, #13) appear **partially addressed in source** since the report was written against
> the published `0.1.0`. v37 treats them as "verify the fix actually ships," not "build from scratch."

---

## Target state (after v37)

| Concern                         | Today                                  | Target                                                              |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `styles.css` export             | points at non-existent `cascade.css`   | resolves to the emitted `cascivo.css`; no consumer patch needed     |
| `cascade` brand leakage         | 119 CSS layers + JS/JSDoc/descs        | 0; `@layer cascivo.*`; lint guard prevents reintroduction           |
| CSS imports for a themed setup  | 3 imports, tokens loaded twice         | documented single path + an "all themes" bundle; tokens load once   |
| Base typography                 | plain markup renders serif             | `@layer cascivo.base` applies `--cascivo-font-sans` to `html`/`body`|
| Token canonical names           | undocumented aliases                   | published reference table + JSON manifest + `.d.ts` autocomplete    |
| Published types                 | expose `packages/.../src`              | flat, rolled-up `.d.ts`; "Go to definition" stays in published surf |
| App shell                       | hand-rolled by every consumer          | `AppShell` (sticky header + full-height nav + animated toggle)      |
| Discoverability                 | read `index.d.ts`                      | component index + shadcn→cascivo migration map in README/docs       |

---

## Workstreams

| #   | Workstream                         | Tranche | Summary                                                                                   |
| --- | ---------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| A   | Unblock: export fix + rename       | T1      | Fix `cascade.css`→`cascivo.css` export; sweep `cascade`→`cascivo` (CSS layers/JS/descs); guard |
| B   | Theming path + base layer          | T2      | Single-import story + `themes/all` bundle; de-dupe token load; `@layer cascivo.base` font reset |
| C   | Token canonicalization + manifest  | T3      | Canonical vs alias table; JSON token manifest + generated `.d.ts`; token reference doc    |
| D   | Flattened published types          | T4      | Verify/fix `flatten-types`; published `.d.ts` no longer expose `packages/.../src`         |
| E   | AppShell layout + SideNav polish   | T5      | `AppShell` (sticky/full-height/animated toggle, `inert`/focus); reconcile rail vs full-hide |
| F   | Docs: README + index + migration   | T6      | Quickstart, component index/cheat sheet, shadcn→cascivo map; verify README ships; full gate |
| G   | Consumer hand-off guide             | T7      | Generate `docs/v37-CONSUMER-CHANGES.md` — what changed + what to do, for a downstream project |

---

## Key open decisions (recommendations in the master plan)

1. **Layer rename is a breaking change.** Renaming `@layer cascade.*` → `@layer cascivo.*` changes
   the public CSS layer API. _Recommendation: clean rename, no alias_ — the project is pre-1.0
   (`0.1.0`), the feedback explicitly asks for it, and an aliased double-layer would re-introduce the
   ambiguity. Ship a migration note in `CSS-LAYERS-PITFALL.md` + CHANGELOG.
2. **Base layer home.** Where does the `font-family`/`line-height` base reset live? _Recommendation:
   a new `@layer cascivo.base` shipped by `@cascivo/themes` (imported by every theme), so a consumer
   who imports one theme gets working typography_ — not in `@cascivo/react/styles.css` (copy-paste
   users who don't install `react` would miss it) and not in `@cascivo/tokens` (tokens stay
   value-only, no element selectors).
3. **Token aliases: keep or drop?** _Recommendation: keep aliases, mark canonical_ — dropping is a
   breaking change with no upside pre-feedback-cycle; publish the canonical/alias table + manifest so
   intent is unambiguous, then deprecate aliases in a later major.
4. **AppShell vs SideNav props.** Ship a composed `AppShell` layout component vs bolt `sticky`/`open`
   props onto `SideNav`. _Recommendation: ship `AppShell`_ — it owns the single scroll container,
   the header↔nav toggle binding, the animated show/hide + `inert`/focus, and reconciles full-hide vs
   rail collapse in one place; `SideNav` keeps its existing API and also gets the `min-block-size`
   → `block-size`/`max-block-size` fix so its internal scroll fires.
5. **Token manifest format.** _Recommendation: generate `tokens.json` (machine-readable, role +
   value + canonical/alias flag) as the source of truth, then derive both a `.d.ts` union type and a
   docs table from it_ — one generator, three consumers (autocomplete, docs, MCP).

---

## Cross-cutting rules

1. **Consumer-first:** every fix is validated from the perspective of an external app on a strict
   bundler (Vite 6 / strict `exports`). The #1 acceptance test is "a fresh consumer needs zero patches."
2. **Pre-1.0 breaking changes are allowed but must be documented** (CHANGELOG + migration note). The
   layer rename (#2/#5) is the only intentionally breaking change; everything else is additive.
3. **Component authoring rules still bind** (CLAUDE.md): no `useState`/`useEffect`/`useContext` in any
   new component (`AppShell`); DOM side effects via `useSignalEffect`; React-app readers call
   `useSignals()`; CSS `@function`/`if()` only as progressive enhancement with a static fallback.
4. **Responsive by default:** `AppShell` passes the mobile-overflow + touch-target sweep at
   320/360/390/414; no off-scale breakpoint literals (`pnpm breakpoint:check`); never `display:none`
   content away — the collapsed nav uses `inert` + transform, staying keyboard-reachable when open.
5. **Generated artifacts stay in sync:** token manifest, READMEs, component index, registry, and docs
   are regenerated via `pnpm regen`; the drift gate (`pnpm regen && pnpm exec vp check --fix &&
   git diff --exit-code`) must be green and regenerated files committed.
6. **Brand guard:** after the rename, a check (extend `breakpoint:check`-style script or add a small
   one) fails CI if `cascade` reappears in shipped CSS layer names / package descriptions / JSDoc.
7. Run `pnpm exec vp check` after each tranche; keep the full gate (`pnpm ready`) green before each
   commit.

---

## Definition of Done

### T1 — Unblock: export fix + rename

- [ ] `@cascivo/react` `exports["./styles.css"]` resolves to the emitted CSS; a fresh strict-bundler consumer imports `@cascivo/react/styles.css` with no patch.
- [ ] All shipped `@layer cascade.*` renamed to `@layer cascivo.*` (119 component modules + every theme + tokens); JS strings, JSDoc, and package `description`s say cascivo.
- [ ] A brand-guard check fails if `cascade` reappears in layer names / descriptions / shipped JSDoc; CHANGELOG + `CSS-LAYERS-PITFALL.md` note the breaking layer rename.
- [ ] `pnpm ready` green; build + tests pass.

### T2 — Theming path + base layer

- [ ] An "all themes" bundle (e.g. `@cascivo/themes/all`) and a documented single-import path exist; `@cascivo/tokens` is loaded **once** even with light+dark (guarded import or tokens-once pattern).
- [ ] A `@layer cascivo.base` applies `font-family: var(--cascivo-font-sans)` + sane `line-height`/`color` to `html`/`body`; plain markup next to a component renders in the sans stack, not serif.
- [ ] Layer ordering (`cascivo.base` < `cascivo.theme` < `cascivo.component`) is documented for consumers; existing themes/components still render unchanged.

### T3 — Token canonicalization + manifest

- [ ] A `tokens.json` manifest enumerates every `--cascivo-*` token with role + value + canonical/alias flag; generated and drift-checked.
- [ ] A generated `.d.ts` exposes the token names as a union for autocomplete; a docs table marks canonical names and flags aliases.
- [ ] No tokens removed (non-breaking); aliases explicitly documented as aliases.

### T4 — Flattened published types

- [ ] Published `@cascivo/react` `.d.ts` no longer reference `packages/.../src`; "Go to definition" resolves within the published surface.
- [ ] `flatten-types` runs in the build and is verified by a test/check that greps the emitted `dist/**/*.d.ts` for leaked source paths.

### T5 — AppShell layout + SideNav polish

- [ ] An `AppShell` component wires `ShellHeader` + `SideNav` + content into one sticky-header, full-height-nav, single-scroll-container layout with the burger↔nav toggle bound.
- [ ] Show/hide is animated (reusing `--cascivo-motion-*`), honors `prefers-reduced-motion`, and toggles `inert` + manages focus so the hidden nav leaves the tab order; full-hide and rail collapse coexist.
- [ ] `SideNav`'s `min-block-size:100%` is replaced with a constraint that lets its own `overflow:hidden auto` fire (long nav scrolls internally instead of overflowing). No `useState`/`useEffect`; mobile sweep passes.

### T6 — Docs: README + index + migration

- [ ] `@cascivo/react` README ships a quickstart (correct `styles.css` + theme imports) and is verified present in the published tarball (`npm pack` contents).
- [ ] A categorized component index ("what exists") is generated from the manifests/registry and surfaced in the README + docs.
- [ ] A shadcn→cascivo migration page maps variant/prop differences (e.g. Button `default/outline` → `primary/secondary`, no `outline`).
- [ ] Full CI gate passes: `pnpm exec vp check`, `pnpm build`, `pnpm exec vp run -r check`, `pnpm test`, drift check, `pnpm breakpoint:check`, brand guard.

### T7 — Consumer hand-off guide

- [ ] `docs/v37-CONSUMER-CHANGES.md` exists and is self-contained (a downstream project can act on it without this repo).
- [ ] Each of the 13 feedback items has a "what cascivo changed" + "what to do on your side" section tied to a real T1–T6 change.
- [ ] Includes a copy-pasteable upgrade checklist + the minimum package versions; every snippet verified against the shipped artifacts.
