# cascivo — Roadmap v39: RetroUI Study — Adopt the Genuinely-Missing Pieces

**Last updated:** 2026-06-18
**Status:** ✅ Shipped (T1–T5)
**Plan documents:** `docs/superpowers/plans/2026-06-18-v39-master-plan.md` + tranches 1–5
**Builds on:** the theme system (v15/v23/v38, `docs/THEME-PROPOSALS.md`), the component registry +
CLI (`registry.json`, `packages/registry`, `packages/cli`), and the block compositions added in
earlier roadmaps (`packages/components/src/blocks`).

---

## Why this roadmap exists

The brief was to **study [RetroUI](https://retroui.dev/) / [Logging-Studio/RetroUI](https://github.com/Logging-Studio/RetroUI)**
and find components, layouts, utilities, and UX/DX/AI ideas worth adopting into cascivo.

The honest headline from the study: **cascivo is already a superset of RetroUI at the component
level.** RetroUI ships ~40 components (built on Base UI primitives + TailwindCSS, distributed via the
shadcn registry). cascivo ships ~140. A component-by-component map (below) shows that **all but one**
of RetroUI's components already exist here — so v39 is deliberately **not** a "port the component
library" roadmap. That would be redundant work. Instead v39 adopts the **five things RetroUI does that
cascivo genuinely lacks or can learn from**, each filtered through cascivo's principles (CSS-native,
signal-driven, owned code, AI-first).

This document records the full study so the decision not to port is auditable, then scopes the five
adoptable workstreams.

---

## RetroUI at a glance (what the study found)

| Dimension      | RetroUI                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| Identity       | **NeoBrutalism + retro/pixel** aesthetic — bold borders, hard shadows, display/pixel fonts |
| Stack          | React + **TailwindCSS**, built on **Base UI** (`@base-ui/react`) primitives              |
| Distribution   | **shadcn registry** — `npx shadcn add https://retroui.dev/r/button.json` (copy-paste, owned) |
| Utilities      | `cn` helper (`clsx` + `tailwind-merge`); a `retroui-theme` style entry                    |
| Components      | ~40: accordion, alert, avatar, badge, breadcrumb, button, calendar, card, carousel, checkbox, command, context-menu, dialog, drawer, **empty**, input, label, **loader**, menu, popover, progress, radio, select, slider, **sonner** (toast), switch, **tab**, table, **text**, textarea, **toc**, toggle, toggle-group, tooltip |
| Charts          | area / bar / line / pie (recharts)                                                        |
| Blocks          | ~70 preview variants + "blocks" = pre-composed page sections (hero, pricing, navbar, footer, …) |
| Theming         | A single neobrutalist theme; personality carried heavily by **fonts** (display/pixel faces) |
| AI layer        | **None** — no manifest, MCP, or agent tooling                                            |

### Component map: RetroUI → cascivo (already covered)

| RetroUI            | cascivo equivalent                          |
| ------------------ | ------------------------------------------- |
| accordion          | `accordion`                                 |
| alert              | `alert`                                     |
| avatar             | `avatar`                                    |
| badge              | `badge`                                     |
| breadcrumb         | `breadcrumb`                                |
| button             | `button` / `button-group` / `icon-button`  |
| calendar           | `calendar`                                  |
| card               | `card`                                      |
| carousel           | `carousel`                                  |
| checkbox           | `checkbox` / `checkbox-card`                |
| command            | `command-menu`                              |
| context-menu       | `context-menu`                              |
| dialog             | `modal` / `alert-dialog`                    |
| drawer             | `drawer` / `sheet`                          |
| empty              | `empty-state`                               |
| input              | `input` / `input-group` / `number-input` …  |
| label              | `label`                                     |
| loader             | `spinner` / `inline-loading`                |
| menu               | `menu` / `menu-button` / `menubar`          |
| popover            | `popover` / `hover-card` / `toggletip`      |
| progress           | `progress` / `progress-bar` / `progress-circle` / `radial-progress` |
| radio              | `radio` / `radio-card`                      |
| select             | `select` / `native-select` / `multi-select` / `combobox` |
| slider             | `slider`                                    |
| sonner (toast)     | `toast` / `notification`                    |
| switch             | `toggle`                                    |
| tab                | `tabs`                                      |
| table              | `data-table` / `data-list` / `structured-list` |
| text               | `text` / `heading` / `prose` / `code`       |
| textarea           | `textarea`                                  |
| toggle / -group    | `toggle` / `toggle-group` / `segmented-control` |
| tooltip            | `tooltip`                                   |
| charts (a/b/l/pie) | `@cascivo/charts`                           |
| **toc**            | **— none —** ⬅ the one genuine component gap |

**Conclusion:** the only net-new *component* RetroUI has that cascivo lacks is a **Table of Contents
(scroll-spy)**. Everything else is already shipped, often with more variants.

### Explicitly rejected (does not fit cascivo)

- **`cn` / `clsx` + `tailwind-merge`** — cascivo is CSS-native (`@layer`, CSS Modules, custom
  properties). No Tailwind, no className-merging utility. **Not adopted.**
- **Base UI dependency** — cascivo deliberately builds its own micro-FSM + signals primitives in
  `@cascivo/core`. **Not adopted.**
- **Re-porting the ~40 covered components / the recharts charts** — already superseded. **Not adopted.**

---

## What *is* worth adopting (the five workstreams)

| #   | Workstream                              | Tranche | Origin in RetroUI                                                          | Category |
| --- | --------------------------------------- | ------- | -------------------------------------------------------------------------- | -------- |
| A   | **Per-theme font theming**              | T1      | RetroUI's identity is font-driven (display/pixel faces)                    | DX / arch |
| B   | **`arcade` retro theme** (8-bit/pixel)  | T2      | RetroUI's entire NeoBrutalism + retro aesthetic                            | UX / theme |
| C   | **Table of Contents (`toc`) component** | T3      | RetroUI's `toc` — the one component cascivo lacks                          | component |
| D   | **shadcn-registry-compatible export**   | T4      | RetroUI distributes via `npx shadcn add …/r/<name>.json`                   | DX / interop |
| E   | **Blocks expansion + docs/gate**        | T5      | RetroUI's "blocks" = pre-composed page sections (pricing, footer, FAQ, …)  | layout   |

Why these five, and why in this order:

1. **T1 — Per-theme fonts (foundation).** `docs/THEME-PROPOSALS.md` records per-theme fonts as an
   **open question** (current recommendation: "keep fonts global for now"). Studying RetroUI — whose
   personality is carried as much by its display/pixel typeface as by its borders — is the motivation to
   flip that: add a `--cascivo-font-display` token (+ make `--cascivo-font-sans/-mono` per-theme
   overridable) and wire it through the base layer and **all eleven** themes so parity holds. This
   unblocks T2 and retroactively lets `brutalist`/`terminal`/`cyberpunk` carry their intended faces.
2. **T2 — `arcade` retro theme.** RetroUI's literal identity. cascivo has `brutalist` (structural, quiet)
   and `cyberpunk` (v38: dark + neon). An **8-bit / arcade / pixel** theme is a distinct, missing point in
   the palette: limited retro palette, blocky pixel borders, a pixel display font (via T1), and opt-in,
   reduced-motion-safe pixel/CRT effects. Registered **everywhere a theme is registered** (the v38 sweep).
3. **T3 — `toc` component.** The one genuine component gap. Signal-driven scroll-spy, built from a
   headings list or a scanned region, `<nav>` landmark, keyboard-navigable — and (cascivo's AI-first
   discipline) shipping a `component.meta.ts` manifest so the MCP server, docs, and Storybook pick it up
   automatically.
4. **T4 — shadcn-registry interop.** RetroUI rides the shadcn CLI's huge install base. cascivo has its
   own `registry.json` + `cascivo` CLI; emitting a **shadcn-schema-compatible** registry (`registry:component`
   items, served at `/r/<name>.json`) lets anyone `npx shadcn add` a cascivo component without our CLI —
   pure additive interop, no change to cascivo's own distribution.
5. **T5 — Blocks + gate.** RetroUI ships page-section "blocks." cascivo has eight; T5 adds a few
   high-value ones that **reuse existing components only** (pricing, site footer, FAQ, testimonials/stats),
   then documents the whole roadmap and runs the full gate + drift.

---

## What exists today (verified against the codebase)

| Area                     | State                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Components               | ~140 in `packages/components/src/*`, re-exported from `packages/react/src/index.ts`            |
| Fonts                    | **Global only** — `--cascivo-font-{sans,mono}` in `packages/tokens/src/index.css :root`; no `font-display`; per-theme fonts are an open question (`THEME-PROPOSALS.md`) |
| Themes                   | 11 (`light,dark,warm,flat,minimal,midnight,pastel,brutalist,corporate,terminal` + `cyberpunk` from v38); parity + chart-CVD gates |
| TOC / scroll-spy         | **None** — no `toc` component; only `skip-nav` references "toc" in passing                      |
| Blocks                   | 8: `app-shell, auth-login, auth-signup, dashboard-overview, dashboard-table, marketing-features, marketing-hero, settings-profile` (`packages/components/src/blocks`) |
| Registry                 | `registry.json` (cascivo's **own** schema: name/type/category/files = raw GitHub URLs/meta), built by `packages/registry/src/build.ts` |
| Distribution             | `npx cascivo add <name>` (our CLI, `packages/cli`); **not** shadcn-registry compatible          |
| Charts                   | `@cascivo/charts` (covers RetroUI's area/bar/line/pie and more)                                |
| AI layer                 | `component.meta.ts` manifests → MCP (`@cascivo/mcp`), skills, auto-docs (cascivo far ahead of RetroUI here) |

---

## Target state (after v39)

| Concern                          | Today                              | Target                                                                 |
| -------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- |
| Font theming                     | global `sans`/`mono` only          | `--cascivo-font-display` token + per-theme `sans/mono/display` override, parity-safe across all themes |
| First-party themes               | 11                                 | 12 (`arcade` added)                                                    |
| Token parity / chart-CVD gates   | 11 themes pass                     | 12 themes pass; font tokens added to all 12                            |
| Components                       | ~140 (no TOC)                      | +1 (`toc`) with manifest, react export, registry entry, tests          |
| shadcn interop                   | none                               | shadcn-schema registry emitted (`/r/<name>.json`), `npx shadcn add` works |
| Blocks                           | 8                                  | 8 + a small set of reuse-only page sections (pricing, footer, FAQ, stats) |
| Docs                             | —                                  | RetroUI study recorded; font-theming + arcade + toc + shadcn interop documented |

---

## Key open decisions (recommendations in the master plan)

1. **Flip the per-theme-font recommendation?** `THEME-PROPOSALS.md` currently recommends "keep fonts
   global." _Recommendation: **flip it** — add a `--cascivo-font-display` token and make
   `--cascivo-font-{sans,mono,display}` per-theme overridable, added to **all 12** themes for parity._
   Studying RetroUI is the concrete motivation; it unblocks `arcade` and the long-pending
   brutalist/terminal/cyberpunk font wishes. Cost: one more token row in every theme file (parity gate).
2. **Include the `arcade` theme, given v38 just shipped `cyberpunk`?** _Recommendation: **yes**, but make
   it distinctly **8-bit / pixel-arcade** (limited bright retro palette, pixel display font, blocky pixel
   borders) — not neon (that's `cyberpunk`) and not quiet-structural (that's `brutalist`)._ If the
   maintainer is theme-fatigued, T2 can be deferred without blocking T1/T3/T4/T5 (they only share T1's
   font token). Decision flagged so it can be cut cleanly.
3. **Theme name.** _Recommendation: `arcade`_ — single-word (matches `brutalist`/`terminal`/`cyberpunk`),
   communicates the 8-bit game read. Alternatives: `retro` (generic), `pixel` (names the texture not the
   mood), `8bit` (numeral-leading identifier is awkward in selectors/exports).
4. **TOC data source.** _Recommendation: **controlled `items` prop first**, optional DOM-scan helper
   second._ A signal-driven scroll-spy that highlights the active heading from an explicit `items` list is
   deterministic and testable; an opt-in `useTocFromRegion(ref)` helper that derives items from headings in
   a container is a thin add-on. Avoid a `useEffect`-based observer — use `useSignalEffect` +
   `IntersectionObserver` per cascivo's reactivity rules.
5. **shadcn interop: separate emitter, not a schema rewrite.** _Recommendation: **add** a second emitter in
   `packages/registry` that maps cascivo's registry to shadcn's `registry:component` schema and writes
   `/r/<name>.json`._ Do **not** change cascivo's own `registry.json` schema (the CLI/MCP/docs depend on
   it). Inline file contents (or base-URL'd files) per shadcn's schema; document CSS-native caveats
   (cascivo ships CSS Modules + a `@cascivo/themes` import, not Tailwind config).
6. **Blocks scope.** _Recommendation: reuse-only._ New blocks compose **existing** components (Card,
   Button, Badge, Accordion, Avatar, Stat, …); no new primitives. Keep to high-value sections: `pricing`,
   `site-footer`, `faq`, `testimonials` / `stats`. Anything needing a new component is out of scope.

---

## Cross-cutting rules

1. **No `cn`/Tailwind, no Base UI.** Adopt ideas, not RetroUI's stack. CSS-native + `@cascivo/core`
   signals/FSM throughout. Any net-new component obeys the CLAUDE.md authoring rules (no
   `useState`/`useEffect`/`useContext`; `useSignal*`; CSS for hover/focus; i18n-defaulted strings).
2. **Parity is non-negotiable.** Font tokens (T1) and the `arcade` theme (T2) must keep
   `packages/themes/src/parity.test.ts` and `chart-palette.test.ts` green: identical `--cascivo-*` set
   across **all 12** themes, CVD-safe chart ramp.
3. **Every theme-registration surface updated (the v38 sweep).** `arcade` lands in ~12 files: themes
   `package.json`/`all.css`/`README`, both theme tests, CLI, Storybook, docs (`theme.ts`+`app.css`+refs),
   and **both** landing arrays + feature copy + `landing.css` + `/create` presets. T5 greps to prove none
   was missed.
4. **Animations are progressive enhancement + reduced-motion-safe.** `arcade`'s pixel/CRT effects are
   opt-in, theme-scoped, each with a static fallback (`fallback:check`), disabled under
   `prefers-reduced-motion: reduce`; no off-scale breakpoint literals (`breakpoint:check`); never
   `display:none` content away.
5. **AI-first discipline.** The new `toc` component ships a `component.meta.ts` so MCP/docs/Storybook/
   registry pick it up automatically; it is added to `packages/react/src/index.ts` and `registry.json`.
6. **Interop is additive, not a rewrite.** The shadcn emitter is net-new output; cascivo's own
   `registry.json` schema is untouched.
7. **Generated artifacts stay in sync.** `pnpm regen` after wiring; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) green and committed; `pnpm ready`
   green before each commit.

---

## Definition of Done

### T1 — Per-theme font theming

- [x] `--cascivo-font-display` added to `packages/tokens/src/index.css` (sane default = `--cascivo-font-sans`),
      and `--cascivo-font-{sans,mono,display}` documented as **per-theme overridable**.
- [x] All **12** theme files declare the font token(s) parity requires; `parity.test.ts` passes (identical
      `--cascivo-*` set, no missing/extra keys).
- [x] At least one existing theme demonstrates a per-theme override (e.g. `terminal`/`brutalist` set a
      mono/grotesk `--cascivo-font-display`/`-sans`), proving the mechanism end-to-end.
- [x] `docs/THEME-PROPOSALS.md` "Open questions" updated: per-theme fonts moved from "deferred" to "shipped",
      with the RetroUI motivation noted.
- [x] `pnpm exec vp run @cascivo/themes#test` + `vp check` green.

### T2 — `arcade` retro theme

- [x] `packages/themes/src/arcade.css` exists (scoped `[data-theme='arcade']`, `@layer cascivo.theme`):
      limited bright retro palette, blocky pixel borders, hard shadows, pixel **display** font via T1.
- [x] `parity.test.ts` + `chart-palette.test.ts` include `arcade` and pass (CVD-safe ramp).
- [x] Opt-in, theme-scoped pixel/CRT effects (e.g. pixel-corner edges, scanline) each have a static
      fallback and are disabled under `prefers-reduced-motion: reduce`; `fallback:check` + `breakpoint:check` pass.
- [x] Registered **everywhere**: themes `package.json`/`all.css`/`README`, both tests, CLI, Storybook, docs
      (`theme.ts`+`app.css`+refs), landing `theme.ts` + `ComponentField` array + `Features` copy/count +
      `landing.css` + `/create` preset. A grep for `arcade` confirms full coverage.

### T3 — Table of Contents (`toc`) component

- [x] `packages/components/src/toc/` ships `toc.tsx` + `toc.module.css` + `toc.meta.ts` + `toc.test.tsx`.
- [x] Signal-driven: controlled `items` prop renders a `<nav>` of links; active item tracked via
      `useSignal` + `useSignalEffect`-driven `IntersectionObserver` (no `useState`/`useEffect`). Optional
      `useTocFromRegion(ref)` helper derives items from headings in a container.
- [x] Keyboard-navigable, WCAG AA, i18n-defaulted label; manifest complete; exported from
      `packages/react/src/index.ts`; appears in `registry.json` after `pnpm regen`.
- [x] `pnpm exec vp run @cascivo/components#test` green for `toc`.

### T4 — shadcn-registry-compatible export

- [x] A new emitter in `packages/registry` produces shadcn-schema items (`registry:component`) per
      component and a per-component `/r/<name>.json`, derived from the existing cascivo registry (no change
      to cascivo's own `registry.json` schema).
- [x] Output validates against the shadcn registry item schema; a smoke test asserts a sample item's shape
      (name, type, dependencies, files).
- [x] CSS-native caveats documented (CSS Modules + `@cascivo/themes` import, not Tailwind); a docs section
      shows `npx shadcn add <url>/r/button.json`.
- [x] `pnpm exec vp run @cascivo/registry#test` green.

### T5 — Blocks expansion + docs & final gate

- [x] A small set of **reuse-only** blocks added under `packages/components/src/blocks` (e.g. `pricing`,
      `site-footer`, `faq`, `testimonials`/`stats`), each composing existing components only, with manifests.
- [x] This roadmap + the four feature areas documented (THEME-PROPOSALS for fonts/arcade; a registry-interop
      doc; component docs for `toc`).
- [x] `pnpm regen`; drift gate green; full CI gate passes: `vp check`, `pnpm build`, `vp run -r check`,
      `pnpm test`, `breakpoint:check`, `fallback:check`, `brand:check`.
