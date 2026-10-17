# Cascivo Sans Landing View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/cascivo-sans` marketing page — specimen, live type tester, downloads, short design story — that serves the Latin font files from `apps/site/public`.

**Architecture:** Font files are copied from `fonts/cascivo-sans/` into `apps/site/public/fonts/cascivo-sans/` by a regen script driven by one file list (`FONT_FILES`); a `node --test` check fails on drift. The page is a lazy-loaded Preact route whose CSS (with the `@font-face` rules) is imported only by the page module, so no other route downloads the font. The tester is the only client logic; its value→style mapping lives in pure helpers that the node check tests.

**Tech Stack:** Preact + `@cascivo/core` signals (apps/site), `@cascivo/components` Slider / Toggle / CopyButton, Node `--experimental-strip-types --test`, Playwright + pre-installed Chromium for browser verification.

**Spec:** `docs/superpowers/specs/2026-10-14-cascivo-sans-landing-view-design.md`

## Global Constraints

- Route: `/cascivo-sans`. Title `Cascivo Sans — cascivo`.
- Latin only. Files: `CascivoSans-Latin[opsz,wght].woff2`, `CascivoSans-Italic-Latin[opsz,wght].woff2`, `CascivoSans-Regular.ttf`, `CascivoSans-Italic.ttf`, `CascivoSans-Bold.ttf`, `CascivoSans-BoldItalic.ttf`, `OFL.txt`.
- Axes: weight 100–900 (default 400), optical size 8–48 (default 14); tester size 14–96 px (default 40); all step 1.
- Sample sentence: `Signals move fast; the cascade decides.`
- `_headers` `/fonts/*`: `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=86400` (not `immutable`).
- No `useState` / `useEffect` / `useContext`; state is `useSignal` from `@cascivo/core`.
- Site marketing CSS follows the existing page pattern (`create/create.css`): page-scoped, unlayered, every selector under the page root class `.cs-page`. Breakpoint literals only from the canonical scale (`40rem` here).
- Marketing copy is hard-coded English (as on every marketing page).
- Never touch `fonts/cascivo-sans/fonts/*` (shipped font binaries) — the sync only reads them.
- Commit trailers on every commit:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_018GMr8MKJ9kdBTRa5FE88Rj`.

**Spec clarification:** the site is a client-rendered SPA with head-only prerender, so "renders at defaults without JS" means: the CSS defaults equal the tester's initial signal values, so the sample never jumps when the tester mounts. Asserted in Task 4.

## Review Focus

1. **Rich text pasted into the tester** — must arrive as plain text (no injected markup, colours or fonts). Sample uses `contentEditable="plaintext-only"`; Task 4 pastes HTML and asserts no child elements.
2. **A long unbroken word at 96 px on a 320 px screen** — must wrap, not scroll the page sideways. `.cs-tester-sample { overflow-wrap: anywhere }`; Task 4 types a 40-char word at size 96 at 320 px and asserts no horizontal overflow.
3. **Font rebuilt but site copy not refreshed** — downloads would serve stale files. `font-site-sync.test.ts` byte-compares (Task 1).
4. **Out-of-range or fractional slider value** (programmatic set, browser quirk) — must clamp and round, never emit an invalid `font-variation-settings`. `clampAxis` tests in Task 1.
5. **Keyboard-only visitor** — arrow keys move each slider, Space toggles Italic, all with visible labels. Task 4 drives them by keyboard.

---

### Task 1: Font files, sync script, drift check

**Files:**
- Create: `apps/site/src/marketing/pages/cascivo-sans/data.ts`
- Create: `apps/site/src/marketing/pages/cascivo-sans/sizes.generated.ts` (written by the script)
- Create: `scripts/fonts/sync-site.ts`
- Create: `scripts/checks/font-site-sync.test.ts`
- Create: `apps/site/public/fonts/cascivo-sans/*` (7 files, written by the script)
- Modify: `package.json` — add `"fonts:site:sync": "node --experimental-strip-types scripts/fonts/sync-site.ts"`; append `&& pnpm fonts:site:sync` to the end of `regen`; append `scripts/checks/font-site-sync.test.ts` to the file list of `meta:check`.
- Modify: `apps/site/public/_headers` — add the `/fonts/*` block (values in Global Constraints).

**Interfaces:**
- Produces (in `data.ts`, no imports — node must load it directly):
  - `export interface FontFile { name: string; source: string; kind: 'web' | 'desktop' | 'licence'; label: string }` — `source` is repo-relative (`fonts/cascivo-sans/fonts/<name>` or `fonts/cascivo-sans/OFL.txt`).
  - `export const FONT_FILES: readonly FontFile[]` — the 7 files, in the order of Global Constraints.
  - `export const FONT_BASE = '/fonts/cascivo-sans/'`
  - `export const AXES = { wght: { min: 100, max: 900, initial: 400 }, opsz: { min: 8, max: 48, initial: 14 }, size: { min: 14, max: 96, initial: 40 } } as const`
  - `export type AxisName = keyof typeof AXES`
  - `export function clampAxis(axis: AxisName, value: number): number` — round to integer, then clamp; `NaN` → the axis `initial`.
  - `export interface TesterState { wght: number; opsz: number; size: number; italic: boolean }`
  - `export function testerStyle(s: TesterState): Record<string, string>` → `{ '--cs-wght': '<n>', '--cs-opsz': '<n>', '--cs-size': '<n>px', 'font-style': 'italic' | 'normal' }`, every number passed through `clampAxis`.
  - `export const SAMPLE = 'Signals move fast; the cascade decides.'`
  - `export const WEIGHT_STOPS: readonly { value: number; name: string }[]` — 100 Thin, 200 ExtraLight, 300 Light, 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold, 900 Black.
- Produces (`sizes.generated.ts`): `export const FONT_SIZES: Record<string, number>` — bytes per `FontFile.name`, written by the script with a "generated — do not edit" header.

- [ ] **Step 1: Write the failing test** `scripts/checks/font-site-sync.test.ts` (imports `../../apps/site/src/marketing/pages/cascivo-sans/data.ts` and `.../sizes.generated.ts`):
  - `every FONT_FILES entry is in public and byte-identical to its source` (`readFileSync` + `Buffer.equals`)
  - `public/fonts/cascivo-sans holds no extra files` (`readdirSync` sorted equals sorted names)
  - `FONT_SIZES matches the source byte length for every file`
  - `clampAxis`: `clampAxis('wght', 1200) === 900`, `clampAxis('opsz', 7.6) === 8`, `clampAxis('wght', 412.4) === 412`, `clampAxis('size', NaN) === 40`
  - `testerStyle({ wght: 1000, opsz: 14, size: 40, italic: true })` deep-equals `{ '--cs-wght': '900', '--cs-opsz': '14', '--cs-size': '40px', 'font-style': 'italic' }`
- [ ] **Step 2: Run it, expect FAIL** — `node --experimental-strip-types --test scripts/checks/font-site-sync.test.ts` → fails on missing module `data.ts`.
- [ ] **Step 3: Implement `data.ts`** per Interfaces.
- [ ] **Step 4: Run, expect FAIL** on the file/size tests only (helpers pass).
- [ ] **Step 5: Implement `scripts/fonts/sync-site.ts`** — `mkdirSync(recursive)`, delete files in the target not in `FONT_FILES`, `copyFileSync` each, write `sizes.generated.ts`. Then run `pnpm fonts:site:sync` and `pnpm exec vp fmt apps/site/src/marketing/pages/cascivo-sans/sizes.generated.ts`.
- [ ] **Step 6: Run, expect PASS** (all 5 tests).
- [ ] **Step 7: Confirm idempotent** — run `pnpm fonts:site:sync` again, then `git status --short` shows no new modification.
- [ ] **Step 8: Add the `_headers` block and the `package.json` script wiring**; run `pnpm meta:check` → PASS.
- [ ] **Step 9: Commit** — `feat(site): ship Cascivo Sans Latin files with a drift check`.

### Task 2: The page and the type tester

**Files:**
- Create: `apps/site/src/marketing/pages/cascivo-sans/font.css`
- Create: `apps/site/src/marketing/pages/cascivo-sans/TypeTester.tsx`
- Create: `apps/site/src/marketing/pages/CascivoSansPage.tsx`

**Interfaces:**
- Consumes: everything in Task 1's `data.ts` and `FONT_SIZES`.
- Produces: `export function CascivoSansPage(): JSX` (named export, same shape as `ModernCssPage`); `export function TypeTester(): JSX`.

- [ ] **Step 1: `font.css`** — two `@font-face` rules, family `"Cascivo Sans"`, `font-weight: 100 900`, `font-display: swap`, `src: url('/fonts/cascivo-sans/CascivoSans-Latin[opsz,wght].woff2') format('woff2')` (italic face: `font-style: italic`, the italic file). Page root `.cs-page { font-family: 'Cascivo Sans', var(--cascivo-font-sans); }`. Tester sample: `--cs-wght: 400; --cs-opsz: 14; --cs-size: 40px; font-variation-settings: 'wght' var(--cs-wght), 'opsz' var(--cs-opsz); font-size: var(--cs-size); overflow-wrap: anywhere;` (defaults equal `AXES.*.initial`). Upright/italic pair: inside `container-type: inline-size`, one column by default (mobile-first), two columns from `@container (min-width: 40rem)`. Waterfall lines use `font-weight` per stop.
- [ ] **Step 2: `TypeTester.tsx`** — `useSignal` for `wght`, `opsz`, `size` (initials from `AXES`) and `italic` (false). Three `Slider`s from `@cascivo/components/slider` with `label` "Weight" / "Optical size" / "Size", `min`/`max` from `AXES`, `value`, `onInput` → `clampAxis(axis, Number(e.currentTarget.value))`. `Toggle` from `@cascivo/components/toggle` with `label="Italic"`, `checked`, `onValueChange`. Sample: `<p id=… contentEditable="plaintext-only" aria-labelledby=<visible label id> style={testerStyle(...)}>{SAMPLE}</p>`, with `useId()` for the label id. Show current values next to each label.
- [ ] **Step 3: `CascivoSansPage.tsx`** — structure copies `ModernCssPage` (`SkipNavLink`, `Header`, `SkipNavTarget > main`, `Footer`), imports `./cascivo-sans/font.css`, wraps `main` content in `.cs-page`. Sections in spec order with ids `cs-specimen`, `cs-weights`, `cs-styles`, `cs-try`, `cs-get`, `cs-making`. Hero buttons are anchors to `#cs-get` / `#cs-try`. "Get the font": one link per `FONT_FILES` entry, `href={FONT_BASE + encodeURIComponent(name)}`, `download`, size as KB from `FONT_SIZES`; the `@font-face` snippet in `<pre><code>` with `CopyButton value={snippet}`. "How it's made": three cards with the spec's headings and one-paragraph bodies; links to `https://github.com/cascivo/cascivo/blob/main/fonts/cascivo-sans/RESEARCH.md` and `.../CHANGELOG.md`.
- [ ] **Step 4: Type check** — `pnpm exec vp run @cascivo/site#check` → 0 errors.
- [ ] **Step 5: Format + lint** — `pnpm exec vp check --fix` → clean.
- [ ] **Step 6: Commit** — `feat(site): Cascivo Sans page with a live type tester`.

### Task 3: Route registration

**Files:**
- Modify: `apps/site/src/marketing/App.tsx` — lazy import `CascivoSansPage` next to `ModernCssPage`; `ROUTES['/cascivo-sans'] = { Page: CascivoSansPage, title: ROUTE_HEAD['/cascivo-sans']?.title ?? 'cascivo' }`.
- Modify: `apps/site/src/marketing/route-head.ts` — `ROUTE_HEAD['/cascivo-sans']` (`title: 'Cascivo Sans — cascivo'`, a ≤160-char `description` naming the axes, Latin/Cyrillic/Greek and OFL, `ogTitle: 'Cascivo Sans — cascivo'`); `'cascivo-sans'` in `PRERENDER_ROUTES` after `'modern-css'`.
- Modify: `apps/site/src/marketing/search/buildIndex.ts` — `{ id: 'page-cascivo-sans', title: 'Cascivo Sans', section: 'Landing', href: '/cascivo-sans', type: 'page', description: 'The cascivo variable typeface — try it and download it' }`.
- Modify: `apps/site/src/marketing/sections/Footer.tsx` — `{ label: 'Cascivo Sans', href: '/cascivo-sans' }` after the `Modern CSS` entry.

- [ ] **Step 1: Run the route gates first, expect PASS** (baseline): `pnpm docs-routes:check && pnpm doc-urls:check && pnpm links:check`.
- [ ] **Step 2: Add only the Footer link; re-run `pnpm links:check`, expect FAIL** naming `/cascivo-sans` (proves the gate sees it).
- [ ] **Step 3: Add the App/route-head/search entries; re-run all three, expect PASS.**
- [ ] **Step 4: Build the site** — `pnpm exec vp run @cascivo/site#build` → succeeds and `apps/site/dist/cascivo-sans/index.html` exists with `<title>Cascivo Sans — cascivo</title>`.
- [ ] **Step 5: Commit** — `feat(site): route, head, search entry and footer link for /cascivo-sans`.

### Task 4: Browser verification, docs, full gate

**Files:**
- Create: `scripts/quality/cascivo-sans-page.mjs` (scratch-style verification script kept in the repo so it can be re-run; not wired into `ready`)
- Modify: `fonts/cascivo-sans/README.md` (link to `https://cascivo.com/cascivo-sans`), `fonts/cascivo-sans/CHANGELOG.md` (Unreleased: site page)

- [ ] **Step 1: Write `cascivo-sans-page.mjs`** — serves `apps/site/dist` with `vite preview`, launches Chromium (`executablePath: '/opt/pw-browsers/chromium'` if the pinned Playwright differs) and asserts, exiting non-zero on any failure:
  - on `/cascivo-sans`: `document.fonts.check('16px "Cascivo Sans"')` after `document.fonts.ready`;
  - on `/`: no request URL contains `/fonts/cascivo-sans/`;
  - sample's computed `font-variation-settings` before any interaction contains `"wght" 400` and `"opsz" 14` (no jump);
  - focus the Weight slider, press `End` → computed contains `"wght" 900`; Optical size `Home` → `"opsz" 8`; Size `End` → `font-size: 96px`; focus Italic, press `Space` → `font-style: italic`;
  - paste `<b style="color:red">x</b>` as `text/html` into the sample → sample has no element children;
  - at widths 320/360/390/414, with size 96 and a 40-char unbroken word typed: `document.documentElement.scrollWidth <= innerWidth`;
  - each slider and the toggle has an accessible name (`getByLabel('Weight')`, etc.);
  - screenshots of `/cascivo-sans` at 1280 and 390 wide, light and dark (`data-theme`), into the scratchpad.
- [ ] **Step 2: Run it, expect PASS**; fix and re-run until it does. Send the screenshots to the user.
- [ ] **Step 3: Docs** — README link and CHANGELOG line.
- [ ] **Step 4: Shipped fonts untouched** — `git status --short fonts/cascivo-sans/fonts/` → empty.
- [ ] **Step 5: Full gate** — `pnpm ready` → exit 0. Commit any regen/`--fix` output.
- [ ] **Step 6: Commit and push** — `docs(fonts): link the Cascivo Sans page; browser check`; `git push -u origin claude/cascivo-sans-font` (retry 2/4/8/16 s on network errors). PR #282 updates.
