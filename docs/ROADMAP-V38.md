# cascivo — Roadmap v38: Cyberpunk Theme — Brutalism × Neon, Fully Wired

**Last updated:** 2026-06-18
**Status:** 📝 Planned (T1–T5)
**Plan documents:** `docs/superpowers/plans/2026-06-18-v38-master-plan.md` + tranches 1–5
**Builds on:** the theme system shipped across v15/v23 (`docs/THEME-PROPOSALS.md`), the `brutalist`
theme, and the base/all-themes layering from v37.

---

## Vision

cascivo ships ten first-party themes today. The `brutalist` theme already nails the _structural_
half of neo-brutalism — **zero radius, 2px black borders, hard offset shadows, acid-yellow accent on
cream**. What it deliberately is **not** is loud, dark, or animated. v38 adds an **eleventh theme**
that fuses that brutalist structure with a **cyberpunk** palette and motion: a near-black base, **neon
magenta + electric cyan** accents, glow-tinted hard shadows, and a small set of **opt-in, CSS-only
"brutalist" animations** (hard snap, scanline, glitch, neon flicker) that are reduced-motion-safe and
degrade cleanly on every browser.

The new theme is treated as a first-class citizen: it passes the same token-parity and chart-palette
(color-vision-deficiency) gates as every other theme, and it is **registered everywhere a theme is
registered** — CLI, Storybook, docs app, and, with particular care per the request, **every surface of
the landing page** (theme switcher, the live `ComponentField` theme-tile wall, the "themes" feature
copy and count, and the `/create` preset gallery).

**Working name:** `cyberpunk` (single-word, matching the existing `brutalist`/`terminal`/`midnight`
convention). Alternatives considered and the rationale are in the master plan (Decision 1).

---

## What exists today (verified against the codebase)

| Area                       | State                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Theme files                | `packages/themes/src/{light,dark,warm,flat,minimal,midnight,pastel,brutalist,corporate,terminal}.css` |
| Theme registration         | `package.json` `exports` (2 entries/theme); `all.css` bundle; `base.css` typography layer |
| Token parity gate          | `packages/themes/src/parity.test.ts` — every theme must define the **identical** `--cascivo-*` set |
| Chart palette gate         | `packages/themes/src/chart-palette.test.ts` — 8 chart series must stay CVD-distinguishable |
| Motion model               | `--cascivo-motion-{enter,exit,emphasis}` + duration/ease tokens; `prefers-reduced-motion` collapses durations globally |
| Theme animations           | **None.** No theme ships `@keyframes`; themes set custom properties only                   |
| CLI theme list             | `packages/cli/src/commands/theme.ts`                                                       |
| Storybook switcher         | `apps/storybook/.storybook/preview.tsx` (import + `themes` map)                            |
| Docs app                   | `apps/docs/src/theme.ts` (type + `THEMES` + legacy migration), `app.css`, `Layout.tsx`, `ChartsPage.tsx` |
| Landing — switcher source  | `apps/landing/src/theme.ts` (`THEMES` array)                                               |
| Landing — theme-tile wall  | `apps/landing/src/sections/ComponentField.tsx` (its **own** local `THEMES` array)         |
| Landing — feature copy     | `apps/landing/src/sections/Features.tsx` (`title: 'Ten themes'` + the enumerated list)     |
| Landing — CSS import        | `apps/landing/src/landing.css` (`@import '@cascivo/themes/<name>.css'` per theme)          |
| Landing — preset gallery   | `apps/landing/src/pages/create/presets.ts` (one entry per theme)                          |

> The duplicated theme lists (themes `package.json`, two test files, CLI, Storybook, docs, **and two
> separate landing arrays**) are why "add a theme" is a multi-file sweep, not a one-liner. v38 enumerates
> every one so none is missed — the explicit ask was "make sure it is considered **everywhere** in the
> landing page."

---

## Target state (after v38)

| Concern                              | Today                              | Target                                                                 |
| ------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| First-party themes                   | 10                                 | 11 (`cyberpunk` added)                                                  |
| Token parity                         | 10 themes identical token set      | 11 themes identical token set (new theme in `parity.test.ts`)          |
| Chart-palette CVD gate               | 10 themes pass                     | 11 themes pass (new theme in `chart-palette.test.ts`)                   |
| Theme-driven animation               | none                               | `cyberpunk` ships opt-in, reduced-motion-safe CSS animations           |
| Motion character per theme           | shared defaults only               | `cyberpunk` overrides `--cascivo-motion-*` to a "hard snap" character  |
| CLI / Storybook / docs registration  | 10 themes                          | 11 (CLI list, Storybook map, docs type+`THEMES`+legacy, `app.css`)     |
| Landing switcher                     | 10 in `theme.ts`                   | 11; new theme selectable + persisted                                   |
| Landing theme-tile wall              | 10 in `ComponentField` local array | 11; new tile renders in the live wall                                  |
| Landing feature copy                 | "Ten themes" + 10-name list        | "Eleven themes" + 11-name list                                         |
| Landing `/create` presets            | 10 presets                         | 11; `cyberpunk` swatch + config preset                                 |
| Theme-proposals doc                  | documents 10                       | documents `cyberpunk` (palette, structure, animation, font caveat)     |

---

## Workstreams

| #   | Workstream                         | Tranche | Summary                                                                                          |
| --- | ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| A   | Theme palette & structure          | T1      | Author `cyberpunk.css` (dark + neon, brutalist structure) with full token parity; add to both test lists; export it |
| B   | Brutalist/cyberpunk CSS animations | T2      | Motion-character override + opt-in theme-scoped `@keyframes` (snap/scanline/glitch/flicker), reduced-motion + static fallbacks |
| C   | System registration                | T3      | Register in CLI, Storybook, and the docs app (type, `THEMES`, legacy migration, `app.css`, charts page) |
| D   | Landing-page integration           | T4      | Wire **every** landing surface: switcher source, `ComponentField` tile wall, `Features` copy/count, `landing.css`, `/create` preset |
| E   | Docs, proposals & final gate       | T5      | Document the theme in `THEME-PROPOSALS.md` + README; `pnpm regen`; full gate (parity, chart, breakpoint, drift, brand) |

---

## Key open decisions (recommendations in the master plan)

1. **Theme name.** _Recommendation: `cyberpunk`_ — single-word, matches `brutalist`/`terminal`/
   `midnight`; instantly communicates the palette/mood. Alternatives: `neon` (palette only, loses the
   brutalist read), `neobrutal` (collides conceptually with the existing `brutalist`), `synthwave`
   (narrower 80s connotation). One name lands in ~12 files, so it is chosen once in T1 and reused.
2. **Relationship to the existing `brutalist` theme.** _Recommendation: a new, independent theme that
   borrows brutalist **structure tokens** (radius 0, thick borders, hard shadows) but a distinct dark+neon
   palette_ — not a variant/override of `brutalist`. Keeps `parity.test.ts` simple (one more peer file)
   and avoids coupling two themes' palettes.
3. **Can the "usual brutalist animations" be CSS-only?** _Recommendation: yes, and they must be._ Hard-snap
   transitions (step easing on `--cascivo-motion-*`), a scanline/CRT overlay, a glitch/RGB-split on hover,
   and a neon-flicker can all be pure CSS `@keyframes` + `transition`. They ship as **theme-scoped,
   opt-in, progressive enhancement**: every animated declaration has a static fallback, and
   `prefers-reduced-motion: reduce` disables them (the existing token mechanism already collapses
   durations — T2 also guards the net-new keyframes). See Decision 4.
4. **Where do the animations live + how invasive are they?** _Recommendation: in `cyberpunk.css`, scoped
   under `[data-theme='cyberpunk']`, and **opt-in via existing hooks** (the theme tunes
   `--cascivo-motion-*` so component transitions inherit the "snap" character automatically; the louder
   effects — scanline/glitch — attach to opt-in marker classes/`data-` attributes so they never fire on
   arbitrary components unasked)._ No component TSX changes; no new component tokens beyond what parity
   requires. This keeps the theme a drop-in CSS file like every other.
5. **Font theming.** The `THEME-PROPOSALS` doc notes brutalist/terminal "want" a mono/grotesk face but font
   is not yet per-theme themeable. _Recommendation: cyberpunk follows the same constraint — it sets the
   palette/structure/motion only and inherits `--cascivo-font-sans`; a per-theme font override is out of
   scope for v38_ (tracked as a follow-up, same caveat as `brutalist`/`terminal`).

---

## Cross-cutting rules

1. **Parity is non-negotiable:** `cyberpunk.css` must define **exactly** the `--cascivo-*` token set the
   other themes define — no missing tokens, no extras — or `parity.test.ts` fails. Author by copying an
   existing dark theme's token skeleton (`terminal`/`midnight`) and re-coloring.
2. **Chart palette must pass CVD:** the 8 chart series + grid/axis must remain distinguishable under
   protan/deutan/tritan simulation (`chart-palette.test.ts`). Re-use the proven neutral-anchored ramp;
   do not hand-pick eight neon hues that collapse under color-blindness simulation.
3. **Animations are progressive enhancement:** every animated/`if()`/`@function` declaration has a static
   fallback immediately preceding it (`fallback:check`); all motion is gated by
   `prefers-reduced-motion: reduce`; never animate layout in a way that breaks the mobile-overflow sweep.
4. **No off-scale breakpoints, no `display:none` data loss** (`pnpm breakpoint:check`); the theme adds no
   `@media`/`@container` width literals outside the canonical scale.
5. **Single source per fact, but every duplicate updated:** there is no central theme registry — the
   theme name is duplicated across ~12 files. T1–T4 enumerate each; the T5 gate greps for the new name to
   confirm none was missed (especially the **two** landing arrays).
6. **Generated artifacts stay in sync:** `pnpm regen` after wiring; the drift gate
   (`pnpm regen && pnpm exec vp check --fix && git diff --exit-code`) must be green and regenerated files
   committed. Brand guard (`pnpm brand:check`) stays green.
7. Run `pnpm exec vp check` after each tranche; keep the full gate (`pnpm ready`) green before each commit.

---

## Definition of Done

### T1 — Theme palette & structure

- [ ] `packages/themes/src/cyberpunk.css` exists, scoped `[data-theme='cyberpunk']` under
      `@layer cascivo.theme`, `color-scheme: dark`, with dark base + neon magenta/cyan accents and
      brutalist structure (radius 0, thick borders, hard glow-tinted shadows).
- [ ] `parity.test.ts` and `chart-palette.test.ts` both include `cyberpunk` and **pass** (identical token
      set; chart series CVD-distinguishable).
- [ ] `packages/themes/package.json` exports `./cyberpunk` + `./cyberpunk.css`; `themes/all.css` includes it;
      `description`/`keywords` updated; README lists it.
- [ ] `pnpm exec vp run @cascivo/themes#test` green.

### T2 — Brutalist/cyberpunk CSS animations

- [ ] `cyberpunk.css` overrides `--cascivo-motion-{enter,exit,emphasis}` to a "hard snap" character so
      component transitions read brutalist **without any component change**.
- [ ] A small set of opt-in, theme-scoped CSS effects (e.g. scanline overlay, glitch/RGB-split on hover,
      neon flicker) ship behind opt-in markers; each has a static fallback and is disabled under
      `prefers-reduced-motion: reduce`.
- [ ] `pnpm fallback:check` passes (static fallback precedes every progressive declaration); no new
      off-scale breakpoint literals (`pnpm breakpoint:check`).
- [ ] Parity still holds (any new tokens, if introduced, are added to **all** themes); theme test green.

### T3 — System registration

- [ ] CLI (`packages/cli/src/commands/theme.ts`) lists `cyberpunk`; `cascivo theme` can select it.
- [ ] Storybook (`preview.tsx`) imports the theme and adds it to the `themes` map; the toolbar switcher shows it.
- [ ] Docs app: `theme.ts` type union + `THEMES` array + legacy-migration guard updated; `app.css` imports it;
      `Layout.tsx`/`ChartsPage.tsx` references updated as needed; docs build green.

### T4 — Landing-page integration

- [ ] `apps/landing/src/theme.ts` `THEMES` includes `cyberpunk`; it is selectable and persists.
- [ ] `apps/landing/src/sections/ComponentField.tsx` local `THEMES` array includes `cyberpunk`; the live
      theme-tile wall renders a `cyberpunk` tile.
- [ ] `apps/landing/src/sections/Features.tsx` reads "Eleven themes" and the enumerated list includes
      `cyberpunk`.
- [ ] `apps/landing/src/landing.css` imports `@cascivo/themes/cyberpunk.css`.
- [ ] `apps/landing/src/pages/create/presets.ts` has a `cyberpunk` preset (swatch bg/accent + config).
- [ ] A grep for `cyberpunk` across `apps/landing/src` confirms every theme-list surface is covered;
      landing builds green.

### T5 — Docs, proposals & final gate

- [ ] `docs/THEME-PROPOSALS.md` documents `cyberpunk` (palette, structure, animation, font caveat) and the
      count/table is updated from ten to eleven.
- [ ] `@cascivo/themes` README + any generated theme listing regenerated (`pnpm regen`); drift gate green.
- [ ] Full CI gate passes: `pnpm exec vp check`, `pnpm build`, `pnpm exec vp run -r check`, `pnpm test`,
      `pnpm breakpoint:check`, `pnpm fallback:check`, `pnpm brand:check`, drift check.
