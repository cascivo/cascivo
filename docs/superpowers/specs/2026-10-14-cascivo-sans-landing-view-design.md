# Cascivo Sans — landing view (design)

Date: 2026-10-14 · Branch: `claude/cascivo-sans-font` · Status: approved in conversation, awaiting spec review

## Intent

Give Cascivo Sans its own page on the marketing site so an adopter can **see it, try it, and
get it**: a specimen with a small interactive type tester, downloadable files with a
copy-paste `@font-face`, and a short "how it's made" note drawn from `RESEARCH.md`.

What the user said:

- Purpose: an **adoption page** (specimen + how to get/use it) with **a bit of the design
  story**.
- Scope: **Latin only**. The Georgian, Armenian and Hebrew drafts are not shown.
- Distribution: **download from the site** — the files are copied into `apps/site/public`.
- Approach **A**: a static page with one interactive type tester.
- Static TTFs offered for download (≈300 KB more on the deployed site); **Footer** is the
  only nav entry point.

Assumptions (stated in the design, not contested):

- Route `/cascivo-sans`.
- Marketing copy is hard-coded English, as on every other marketing page (no i18n change).
- The rest of the site keeps its current font. Switching the site to Cascivo Sans is out of
  scope.

Success criteria:

1. `/cascivo-sans` renders the page, set in the real font, loaded with `@font-face` from
   same-origin files.
2. The font downloads **only** on this route — the home route requests no Cascivo Sans file.
3. Every download link resolves, and the site copies are byte-identical to
   `fonts/cascivo-sans/fonts/` (a check fails on drift).
4. The tester changes weight (100–900), optical size (8–48), size and italic live, and the
   sample still renders at the defaults without JavaScript.
5. No horizontal overflow at 320/360/390/414 px; every control has a visible label and is
   keyboard-operable.
6. `pnpm ready` passes.

## Non-goals

- Using Cascivo Sans site-wide or in `@cascivo/tokens`.
- Georgian, Armenian, Hebrew, Cyrillic or Greek specimens (the Latin slice only covers Latin).
- An npm package for the font.
- Wiring `apps/site` unit tests into CI (its `test` script is an `echo`; noted as a follow-up).
- A glyph inspector, OpenType feature toggles, or a system-font comparison.

## Section 1 — Wiring and files

### Font files

`apps/site/public/fonts/cascivo-sans/` holds byte-identical copies of:

| File                                         | Use                             |
| -------------------------------------------- | ------------------------------- |
| `CascivoSans-Latin[opsz,wght].woff2`         | page `@font-face` + download    |
| `CascivoSans-Italic-Latin[opsz,wght].woff2`  | page `@font-face` + download    |
| `CascivoSans-Regular.ttf`                    | download (desktop)              |
| `CascivoSans-Italic.ttf`                     | download (desktop)              |
| `CascivoSans-Bold.ttf`                       | download (desktop)              |
| `CascivoSans-BoldItalic.ttf`                 | download (desktop)              |
| `OFL.txt` (from `fonts/cascivo-sans/`)       | licence                         |

- `scripts/fonts/sync-site.ts` copies them. It runs in `pnpm regen` (script
  `fonts:site:sync`), so a font rebuild followed by `regen` refreshes the site copy.
- The file list lives in one place, `apps/site/src/marketing/pages/cascivo-sans/data.ts`
  (`FONT_FILES`), read by both the sync script and the page, so the two cannot disagree.
- `public/_headers` gets a `/fonts/*` rule: `Access-Control-Allow-Origin: *` and
  `Cache-Control: public, max-age=86400`. Not `immutable`: the file names are not
  content-hashed, so a year-long immutable cache would pin a stale font after a rebuild.

### Page code

- `apps/site/src/marketing/pages/CascivoSansPage.tsx` — the page; lazy-loaded like every
  non-home route, so none of it is in the home bundle.
- `apps/site/src/marketing/pages/cascivo-sans/`
  - `font.css` — the two `@font-face` rules (`font-display: swap`, `font-weight: 100 900`,
    one upright and one italic face of family `"Cascivo Sans"`) and the page styles, in the
    site's canonical layer (whichever `site-layer-order:check` requires for marketing pages).
    Imported by the page module only, so the font is fetched only on this route.
  - `TypeTester.tsx` — the interactive tester (Section 2).
  - `data.ts` — `FONT_FILES`, weight stops, sample strings, and the pure tester helpers.

### Route registration

- `ROUTES['/cascivo-sans']` in `src/marketing/App.tsx`.
- `ROUTE_HEAD['/cascivo-sans']` (title `Cascivo Sans — cascivo`, a description, `ogTitle`)
  and `'cascivo-sans'` in `PRERENDER_ROUTES` in `src/marketing/route-head.ts` (sitemap +
  prerendered head).
- An entry in `src/marketing/search/buildIndex.ts`.
- A "Cascivo Sans" link in the Footer's resources column.

`docs-routes`, `doc-urls` and `landing-links` catch any missing registration.

## Section 2 — Page content and the tester

Top to bottom:

1. **Hero.** "Cascivo Sans" set in the font at weight 800, optical size 48. One line: an
   open-source variable sans — weight 100–900, optical size 8–48, Latin, Cyrillic and Greek,
   OFL. Two buttons: **Download** (anchor to 5) and **Try it** (anchor to 4).
2. **Weight waterfall.** "Signals move fast; the cascade decides." at the nine stops
   100…900, each labelled (100 Thin, 200 ExtraLight, 300 Light, 400 Regular, 500 Medium,
   600 SemiBold, 700 Bold, 800 ExtraBold, 900 Black). Plain HTML and CSS
   (`font-weight` on the variable face).
3. **Upright and italic.** One paragraph set twice side by side; stacks below the canonical
   `40rem` container width. Below it, a strip of the Latin character set (A–Z, a–z, 0–9 and
   common punctuation).
4. **Type tester** (`TypeTester.tsx`, the only client JS):
   - a `contenteditable` sample with a visible label, default text the waterfall sentence;
   - cascivo `Slider`s: **Weight** 100–900 (default 400, step 1), **Optical size** 8–48
     (default 14, step 1), **Size** 14–96 px (default 40, step 1);
   - a cascivo `Toggle` **Italic** (default off).
   - State is signals (`useSignal`); no `useState`/`useEffect`. Values are written as CSS
     custom properties on the sample (`--cs-wght`, `--cs-opsz`, `--cs-size`) plus
     `font-style`. `font.css` declares the same defaults, so with no JS the sample renders
     at 400 / 14 / 40 px upright.
5. **Get the font.** Download links for the two WOFF2s and four TTFs with file sizes, a link
   to `OFL.txt`, and an `@font-face` code block with the repo's copy button, matching the
   README snippet but with the site's URLs. A one-line note: self-host, and serve only the
   axes you need.
6. **How it's made.** Three cards, from `RESEARCH.md`:
   - *Drawn with a pen* — every glyph is a skeleton expanded by a stroke-pen model.
   - *Five masters, two axes* — Thin, Regular, Black, Caption, Display; what optical size
     does.
   - *Built in Python, checked like code* — lint, tests and Font Bakery run in the build.
   Links to `RESEARCH.md` and `CHANGELOG.md` on GitHub.

Then the standard Footer.

### Error handling

- If a font file fails to load, `font-display: swap` leaves the text in the site's fallback
  font; the page stays usable. No JS error path exists.
- Tester helpers clamp out-of-range input to the axis range and round to an integer, so a
  stray value can never produce an invalid `font-variation-settings`.

## Section 3 — Testing and verification

`apps/site` has no unit-test runner in CI (`"test": "echo 'site: no unit tests yet'"`), so a
`*.test.tsx` there would never run. Tests go where gates run:

1. **`scripts/checks/font-site-sync.test.ts`** (`node --test`, added to `meta:check`), written
   first and seen failing before the files are copied:
   - every `FONT_FILES` entry exists in `apps/site/public/fonts/cascivo-sans/` and is
     byte-identical to its source;
   - no extra files sit in that folder;
   - the tester helpers clamp and round (e.g. `clampAxis('wght', 1200) === 900`,
     `clampAxis('opsz', 7.6) === 8`, `clampAxis('wght', 412.4) === 412`).
2. **Existing gates** cover the rest: `docs-routes`, `doc-urls`, `landing-links`,
   `site-layer-order`, `layers`, `unlayered`, `breakpoint`, type check, `compiler:check`, and
   the build's head prerender of `/cascivo-sans`.
3. **Browser verification** before committing (Playwright + the pre-installed Chromium,
   against the built site):
   - `document.fonts` reports "Cascivo Sans" loaded on `/cascivo-sans`;
   - the home route makes no request under `/fonts/cascivo-sans/`;
   - moving each slider changes the sample's computed `font-variation-settings` /
     `font-size`, and the Italic toggle changes `font-style`;
   - no horizontal overflow at 320/360/390/414 px;
   - controls are reachable by keyboard and have visible labels;
   - screenshots in light and dark, sent to the user.

## Risks

- **Stale caches after a font rebuild**: mitigated by a 1-day `max-age` rather than
  `immutable` (file names are not hashed).
- **Drift between font build and site copy**: mitigated by `font-site-sync.test.ts`.
- **`regen` touching font binaries**: the sync only copies existing build output; it never
  runs the Python build, so `regen` stays fast and dependency-free.
