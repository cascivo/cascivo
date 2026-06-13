# v15 Master Plan — The Rebrand & Mobile (cascade-ui → cascivo, world-class responsive)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-13-v15-tranche-1.md` … `2026-06-13-v15-tranche-7.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans.
>
> **Order matters.** The rename tranches (T2→T3→T4) are sequenced bottom-up: tokens before
> packages before apps/CLI/registry, so each layer is green before the next renames its consumers.
> Brand identity (T1) is docs/assets only and lands first so the new colors/logo exist before T2
> introduces brand tokens. Mobile (T5 landing → T6 docs) runs after the rename so it is done once,
> on the renamed surfaces. **Re-verify each named file/command/count at tranche start; if absent or
> different, STOP and re-sequence.**

**Goal:** Execute `docs/ROADMAP-V15.md` — (1) give the project a coherent brand: the name
**cascivo**, a documented derivation, a logo, and a brand color system; (2) rename every
brand-bearing surface from `cascade-ui`/`@cascade-ui`/`--cascivo-`/`cascade`(CLI)/`cascade-ui.dev`
to `cascivo`/`@cascivo`/`--cascivo-`/`cascivo`(bin)/`cascivo.com`; (3) rebuild the landing page and
docs mobile-first to a world-class, real-device-verified responsive bar.

**Architecture:** No new runtime packages. Brand tokens live in `@cascivo/tokens` +
`@cascivo/themes` as `--cascivo-brand-*`. The logo is an SVG asset consumed by `apps/landing` and
`apps/docs`. The rename is mechanical but layered: CSS token prefix (T2) → package namespace +
imports + vite aliases + tsconfig paths + `meta.dependencies` (T3) → CLI bin + registry URLs + MCP
base URLs + skills + external refs (T4). Mobile work is CSS + signal-driven layout in
`apps/landing/src` and `apps/docs/src`, plus shared breakpoints in `@cascivo/layouts` where reused.

**Tech stack:** unchanged — React 18+, Preact (docs), Preact signals, modern CSS (`@layer`,
`@container`, `clamp()`, logical properties, `env(safe-area-inset-*)`), vitest, vp toolchain,
Playwright (mobile screenshot verification).

---

## Research findings (ground truth — verified 2026-06-13)

### Branding footprint (verified by grep in the repo)

- **`@cascivo/*` packages:** 24 `package.json` files reference the scope. Package dirs:
  `ai, charts, cli, components, core, i18n, icons, layouts, mcp, react, registry, render, storage,
themes, tokens` (15 dirs; `components`/`registry` are not published). Root is
  `@cascivo/monorepo`.
- **`--cascivo-*` token prefix:** 113 CSS files use it. Base tokens in `packages/tokens/src/index.css`;
  semantic overrides in `packages/themes/src/*.css` (10 themes: `light, dark, warm, brutalist,
corporate, flat, midnight, minimal, pastel, terminal`); component tokens throughout
  `packages/components/src/**/*.module.css`.
- **`cascade` (case-insensitive) mentions:** ~1,305 source files (`.ts/.tsx/.css/.json/.md/.mjs/.js`,
  excluding node_modules). Includes brand copy, comments, test strings, and docs.
- **CLI:** `packages/cli/package.json` → `"name": "cascade"`, `"bin": { "cascade": "./bin/cascade.mjs" }`.
- **Registry URLs:** hardcoded `https://raw.githubusercontent.com/urbanisierung/cascade-ui/main`
  in `scripts/registry/generate.ts:22`, `packages/cli/src/utils/config.ts:25`, and ~every entry of
  `registry.json`. `resolve.ts:94` builds URLs from `owner`/`repo`.
- **MCP:** `packages/mcp/src/server.ts:49` name `@cascivo/mcp`; base URLs
  `https://cascade-ui.dev` in `context.ts:51`, `tokens.ts:23` (+ test fixtures).
- **Component manifests:** 72 `*.meta.ts` set `dependencies: ['@cascivo/core', …]`.
- **`data-theme`:** used in 32 files — **left unchanged** (generic theming attribute, not brand).
- **i18n:** the built-in catalog is keyed by object access (`builtin.<component>.<key>`), not a
  `"cascade"` string prefix — no rename needed beyond the package import.
- **Skills:** `skills/` defines `cascade:add`, `cascade:design-page`, `cascade:create-theme`,
  `cascade:extend` (per CLAUDE.md).
- **Vite alias rule (CLAUDE.md):** `apps/docs/vite.config.ts`, `apps/landing/vite.config.ts`, and
  `apps/storybook/.storybook/main.ts` carry `@cascivo/*` → source-path aliases for packages whose
  `exports["."].import` resolves to `./dist/` (`core, storage, i18n, ai, render, icons`). These MUST
  be renamed in T3 or the apps fail to build without a prior `pnpm build`.

### Mobile / responsive (verified via the v15 Explore audit)

- **Landing** (`apps/landing`): single global `src/landing.css` (~1,399 lines), 18 `@media` blocks
  (breakpoints 32/40/48/56rem + reduced-motion). Good: `clamp()` hero type, `auto-fit/auto-fill`
  grids, `overflow-x:auto` on code/tables, viewport meta present. Gaps: `.hero-ctas` has no
  `flex-wrap` (overflow on narrow), `.hero-tagline` fixed 38rem, **no breakpoint below 32rem**, **no
  `@container` in the landing CSS**, and the heavy demos — `RelayConsole` (`src/demo/RelayConsole.tsx`),
  charts, `SignalsDemo` — are laid out for width. Sections (in order): Header, Hero, Principles,
  StatsBand, RelayConsole, SignalsDemo, ProofTeasers, AgentLayer, ThemeDemo, QuickStart, CtaBand,
  Footer.
- **Docs** (`apps/docs`): single global `src/app.css` (~302 lines), **no `@media` in app.css**,
  relies on `@cascivo/layouts` AppShell (single `@media (max-width: 64rem)` in
  `app-shell.module.css:63`). `.doc-page` fixed `max-width: 760px` (`app.css:72`); no <375px
  handling. Tables/code use `overflow-x:auto` (functional, not designed). Nav collapses at 64rem
  only.
- **Exemplars to study (user asked):** Stripe (fluid type, restrained mobile density), Linear
  (mobile nav + motion discipline), Vercel/Tailwind/Radix/shadcn docs (off-canvas sidebar, sticky
  TOC, responsive code blocks), Apple (safe-area, large touch targets). Patterns to adopt:
  mobile-first cascade (base styles = mobile, `min-width` to enhance), fluid type scale via
  `clamp()`, container queries per section, off-canvas focus-trapped drawer, sticky mobile CTA,
  responsive tables → stacked cards, scroll-snap for wide demos, `env(safe-area-inset-*)`.

---

## Decisions

| #   | Decision                                                                                                                                                                                                                                               | Rationale                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1   | Name is **cascivo**; rename is total across packages, tokens, CLI, registry, MCP, domain, copy. Derivation recorded in `BRAND.md`: drop `-ui`, keep `casc-` root, add Romance `-ivo` ("active/flowing"); `/kas-ˈsee-vo/`; `.com` owned                 | Decided + domain owned (`docs/BRAND.md`); no half-rename                     |
| 2   | CSS prefix `--cascivo-*` → `--cascivo-*` everywhere (113 files), no aliases; a grep gate asserts zero `--cascivo-` remain                                                                                                                              | Full rebrand, pre-1.0 breakage accepted (user decision)                      |
| 3   | npm namespace **scoped `@cascivo/*` only** (15 packages, 1:1 from `@cascivo/*`); root `@cascivo/monorepo`; requires npm org `cascivo`                                                                                                                  | User decision; scales to 15 packages, matches current structure              |
| 4   | CLI package `@cascivo/cli`, **bin `cascivo`**, invoked `npx @cascivo/cli init`; unscoped `cascivo` shorthand deferred                                                                                                                                  | Scoped-only decision; bin name independent of package name                   |
| 5   | `data-theme` attribute unchanged                                                                                                                                                                                                                       | Generic, not brand; renaming breaks every consumer's theme switch            |
| 6   | Brand color system as `--cascivo-brand-*` (primary cascade-blue `oklch(0.55 0.15 240)`, accent flow-teal `oklch(0.72 0.13 195)`, ink `oklch(0.22 0.03 250)`, primary→accent gradient), separate from the 10 neutral component themes; contrast-checked | "Brand colors that match the library"; marketing identity ≠ component themes |
| 7   | Logo: three descending offset rounded bars (cascade/waterfall) resolving into a "C" + lowercase geometric-sans wordmark; theme-aware SVG using `currentColor`/brand tokens                                                                             | "Propose a logo"; echoes CSS cascade + token cascade                         |
| 8   | Rename is **phased bottom-up**: T1 identity (docs/assets) → T2 tokens → T3 packages → T4 CLI/registry/MCP/skills/external. Each tranche independently green                                                                                            | User decision (phased); minimizes blast radius per step                      |
| 9   | Mobile is **first-principles, mobile-first, landing before docs**; audit with Playwright screenshots at 320/375/390/414 first, then rebuild; verify zero horizontal overflow at each width                                                             | User decision (rebuild, not patch); world-class bar                          |
| 10  | Heavy demos (`RelayConsole`, charts, `SignalsDemo`) get explicit per-demo mobile treatments (simplified variant / scroll-snap / stacked + "view full"), chosen in T5 — never a blind shrink                                                            | These are the actual mobile failure points                                   |
| 11  | Mobile nav: signal-driven (`useSignal`/`useSignalEffect`, no `useEffect`), `useSignals()` in the React landing app, focus-trapped drawer, Esc/scrim/route-change close, ≥44px targets, `env(safe-area-inset-*)`                                        | House rules + a11y (v14) bind the new nav code                               |
| 12  | No new runtime packages; brand tokens in tokens/themes, logo asset in apps, mobile work in `apps/landing`+`apps/docs` CSS/signals + shared `@cascivo/layouts` breakpoints                                                                              | Scope control; matches existing architecture                                 |
| 13  | External steps (npm org, `cascivo.com` DNS/hosting, GH repo rename `cascade-ui`→`cascivo`) are an out-of-code checklist; code is parameterized (`REGISTRY_BASE_URL`, MCP base URLs) so it works on flip; GH rename is redirect-safe                    | Code can't create an npm org / DNS; keep them separable and reversible       |
| 14  | Receipts: a brand page (logo, palette, name story) + a mobile showcase; "Why cascivo" claims 25–27 each link a receipt; README/llms.txt/OG/meta carry the new name                                                                                     | Receipts-not-adjectives bar (v11–v14)                                        |
| 15  | Deferred: unscoped `cascivo` npx shorthand, `--cascivo-*` aliases, org rename, marketing CMS, animated logo, native targets, per-component mobile redesign                                                                                             | Scope control                                                                |

## Tranche map

| Tranche | File                          | Contents                                                                                                                           | Risk                                                                     |
| ------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| T1      | `2026-06-13-v15-tranche-1.md` | Rewrite `BRAND.md` (name derivation, logo proposal, brand palette w/ contrast); logo SVG; brand color spec. Docs/assets only       | Low (no code rename; design judgement)                                   |
| T2      | `2026-06-13-v15-tranche-2.md` | `--cascivo-*` → `--cascivo-*` across tokens + 10 themes + all component/app CSS + consumers; add `--cascivo-brand-*`; grep gate    | Medium (113 files; must catch JS string refs to var names too)           |
| T3      | `2026-06-13-v15-tranche-3.md` | `@cascivo/*` → `@cascivo/*`: 24 package.json, imports, tsconfig paths, 3 vite alias blocks, 72 meta.dependencies, exports, root    | High (largest mechanical change; vite-alias rule; build must stay green) |
| T4      | `2026-06-13-v15-tranche-4.md` | CLI → `@cascivo/cli` (bin `cascivo`); registry URLs + `REGISTRY_BASE_URL`; MCP name + base URLs; skills `cascivo:*`; regen + drift | Medium (registry regen + drift gate; parameterize external URLs)         |
| T5      | `2026-06-13-v15-tranche-5.md` | Landing mobile-first rebuild: audit screenshots, fluid type, off-canvas nav, every section, heavy-demo treatments; verify          | High (the priority surface; heavy demos; visual quality bar)             |
| T6      | `2026-06-13-v15-tranche-6.md` | Docs mobile-first: off-canvas nav + focus trap, fluid type, responsive tables/code/charts, container-query sections, AppShell pass | Medium-high (shared AppShell affects all docs pages)                     |
| T7      | `2026-06-13-v15-tranche-7.md` | Brand page + mobile showcase, OG/meta, README/llms.txt, "Why cascivo" claims 25–27, external go-live checklist, full DoD gate      | Low                                                                      |

## Cross-cutting rules (every tranche)

1. **Rename completeness is proven by grep, not by eyeballing.** After T2: `grep -rn "\-\-cascade-"`
   in source returns nothing. After T3: `grep -rn "@cascade-ui"` returns nothing. After T4:
   `grep -rni "cascade-ui\.dev\|urbanisierung/cascade-ui\|cascade:add"` returns nothing. Each gate
   is a checklist step; a survivor blocks the tranche.
2. **The build must stay green at every layer.** T2/T3/T4 each end with the full CLAUDE.md gate.
   Never rename a layer and leave the repo red for the next tranche.
3. **Watch the non-obvious references.** Token names appear in JS strings (e.g. `var(--cascivo-x)`
   built in TS, chart `colorAt` accessors, `getComputedStyle` lookups), test fixtures, snapshot
   files, and generated artifacts — not only in `.css`. Grep all extensions, not just `.css`.
4. **Generated artifacts stay generated.** `registry.json`, any context/token JSON, and docs
   derived from manifests flow through `pnpm regen` + the drift gate. Renames that change URLs
   require a regen + commit of the regenerated files.
5. **Mobile is verified by screenshots, not assertions.** T5/T6 attach Playwright screenshots at
   320/375/390/414 (portrait) to the PR and assert zero horizontal overflow programmatically
   (`document.scrollingElement.scrollWidth <= innerWidth`). "Looks fine" is not evidence.
6. **House component rules bind all new UI** (mobile nav, demos): signals not hooks, `useSignals()`
   in React apps, `useSignalEffect` for DOM side effects, logical properties, i18n chrome strings,
   WCAG 2.2 AA + APG (v14) for the new nav.
7. **Gate before committing** (CLAUDE.md): `vp check` → build → `vp run -r check` → test → regen →
   `vp check --fix` → `git diff --exit-code`. All exit 0.

## Edge cases / risks registry

1. **Token refs hide in JS/strings (T2):** a chart or component may build a var name dynamically
   (`var(--cascivo-chart-${i})`) or read it via `getComputedStyle`. A `.css`-only find-replace
   misses these. Grep every extension for `cascade-` and `--cascade`; fix string-built names too.
2. **Brand tokens vs neutral themes (T1/T2):** `--cascivo-brand-*` must not leak into the component
   themes' semantic layer (which stays neutral). Keep brand tokens in a separate block, consumed
   only by the apps/logo, not by `packages/components`.
3. **Vite alias breakage (T3):** if the three vite alias blocks aren't renamed in lockstep with the
   package names, `apps/{docs,landing,storybook}` fail to build (no `dist`). The CLAUDE.md alias
   rule is mandatory — rename all three and verify each app builds without a prior `pnpm build`.
4. **`exports` map + dist paths (T3):** some packages export `./dist/`; the scope rename must not
   change the relative export paths, only the package name. Verify `package.json` `exports` and any
   `paths` in tsconfigs resolve post-rename.
5. **Registry drift (T4):** `registry.json` embeds absolute raw URLs with the old repo name. After
   renaming `REGISTRY_BASE_URL` + regenerating, the drift gate must be green; if the GH repo isn't
   renamed yet, the URLs point at a not-yet-existing path — parameterize and document the external
   flip, don't hardcode a dead URL silently.
6. **Test fixtures pin old URLs (T4):** `packages/mcp/src/*.test.ts` assert against
   `https://cascade-ui.dev/...`. Update fixtures with the base-URL change or they fail.
7. **Skill rename ripple (T4):** renaming `cascade:*` skills means updating any docs/README that
   reference them and the skill manifests themselves; ensure the `cascivo:*` names are internally
   consistent.
8. **Heavy-demo mobile (T5):** `RelayConsole` is a multi-pane dashboard; naively stacking it
   produces an endless scroll. Decide a treatment (simplified mobile view or scroll-snap) and make
   it intentional. Same for multi-series charts (horizontal scroll-with-axis-pinned, or fewer
   series on small screens).
9. **jsdom can't measure layout (T5/T6):** overflow/positioning needs a real engine. Use Playwright
   for the overflow assertion + screenshots; keep unit tests to the signal logic (drawer open/close
   state, focus order), which is pure.
10. **Off-canvas nav focus trap (T5/T6):** must trap focus, restore it on close, close on
    Esc/scrim/route-change, and not break keyboard users — built with `useSignalEffect`, not
    `useEffect`. This is real a11y work, not a CSS `transform`.
11. **Reduced-motion (T5/T6):** new slide/drawer animations must respect `prefers-reduced-motion`
    (v14 audit applies); the mobile sticky CTA must not cause layout shift.
12. **Two large axes in one version (rename + mobile):** keep them in separate tranches/PRs so a
    mobile regression isn't entangled with a rename regression. The rename (T1–T4) should be fully
    green before mobile (T5–T7) begins on the renamed surfaces.
    </content>
