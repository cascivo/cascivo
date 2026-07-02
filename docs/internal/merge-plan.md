# Merge `apps/docs` + `apps/landing` into a single app

## Decision summary

- **Domain:** single domain `cascivo.com`. Docs move under sub-paths (`/components/*`,
  `/tokens`, `/icons`, …). `docs.cascivo.com/*` is retired with 301 redirects.
- **Framework:** **Preact** (host on the docs shell; port landing's React pages in).
  Signals are natively reactive — no `useSignals()` ceremony.
- **Approach:** big-bang single PR on branch `claude/practical-wozniak-7lyavu`.

## Why merge

The two apps duplicate a large shared surface: theme system (`theme.ts`, 12-theme CSS
imports), search-over-`registry.json`, SEO/`route-head`, Cmd+K, AppShell-style nav.
A single app removes that duplication, enables true in-app navigation between marketing
and docs (no cross-domain reloads), and unifies the sitemap + SEO into one source of
truth. The only real cost is unifying the Preact/React split — chosen as Preact.

## Auto-generation mechanism (must keep working)

`pnpm regen` runs ~14 generators. Output zones today:

- Heavy → `apps/docs/public/`: `r/registry.json` + per-item + `r/shadcn/*`, `schema/*`,
  `icons.catalog.json`, `tokens.catalog.json`, `context.json` + `context/*.md`,
  `llms.txt` + `llms/**`, `parity.json`, `boundaries.json`, `sitemap.xml`.
- Light → `apps/landing/public/`: `sitemap.xml` (generated), `registry.json` (copied via
  `predev`/`prebuild`).
- Also → `apps/storybook/public/`: `tokens.catalog.json` (keep this copy).

The sitemap generator (`scripts/sitemap/generate.ts`) already emits **both** sitemaps
from one script. Merging collapses it to one output + one route source-of-truth.

## Target app

Host on the docs shell, renamed `apps/site` (serves `cascivo.com`). Delete `apps/landing`
and `apps/docs` after porting.

## Worklist (one PR, applied in this order to stay bisectable)

1. **Framework unification (Preact host).** Keep docs' Preact entry (`render` from
   `preact`). Port landing pages/sections in; strip `useSignals()` from the ~20 landing
   files (signals are native under Preact). Drop `react`/`react-dom` deps. Re-validate
   `SignalsDemo.tsx` (the React `useState` vs signals contrast still holds under Preact —
   verify the re-render counter).
2. **Unify routing.** One router serving marketing routes (`/`, `/blocks`, `/examples/*`,
   `/create`, `/accessibility`, `/performance`, `/guides`, …) + docs routes
   (`/components/*`, `/tokens`, `/icons`, `/charts`, `/ai`, …). Pick one router
   implementation (preact-iso, already in docs).
3. **De-dupe shared modules.** Single `theme.ts`, single search (over `registry.json`),
   single SEO/`route-head` module. Merge the two nav structures into one coherent nav
   (marketing + component categories).
4. **Repoint generators.** Update every `scripts/*/generate.ts` path constant to the one
   app's `public/`. Keep storybook's `tokens.catalog.json` copy. Collapse the sitemap
   generator to one file + one route source-of-truth (registry + unified route-head).
5. **Merge build config.** One `vite.config.ts` combining preact aliasing + landing's
   plugins: `injectCounts`, `prerenderHeads` (per-route static heads for crawlers),
   `minifyLandingCss`, `benchData`, `serveExampleDemos`, `removeSpinnerLink`,
   `preloadMainCss`. Removes one of the three alias blocks the CLAUDE.md sync rule tracks
   (docs/landing/storybook → site/storybook).
6. **CI / deploy.** Collapse `deploy-docs` + `deploy-landing` into one CF Pages job
   (keep demo assembly `build:landing-demos` → `/demos/<slug>/`). Update `paths-filter`
   globs in `.github/workflows/cf-pages.yml`.
7. **SEO migration.** 301 `docs.cascivo.com/*` → `cascivo.com/*`. Unify canonicals, one
   `robots.txt`, one `sitemap.xml`. Lazy-load docs routes so the marketing Lighthouse
   budget is preserved.
8. **Delete `apps/docs` + `apps/landing`** once `apps/site` builds and serves everything.

## Verification (single final gate — no incremental safety net)

- `pnpm ready:ci` (cold cache: clean → regen → check --fix → brand:check → build →
  typecheck → test) green.
- Drift: `pnpm regen && git diff --exit-code`.
- Playwright: migrated docs (visual/perf/layouts/mobile) + landing
  (smoke/motion/og/mobile/links/a11y) suites.
- Lighthouse budget on marketing routes (perf ≥0.95, LCP ≤1500ms, CLS ≤0.05).
- `pnpm breakpoint:check`, `pnpm fallback:check`.

## Highest-risk items (verify hardest)

- The `docs.cascivo.com/*` → `cascivo.com/*` 301 redirect map (SEO continuity).
- The drift gate — every generated artifact must land in the one app.
- Demo assembly — `/demos/<slug>/` must survive the deploy collapse.
- Lighthouse budget on marketing routes after docs routes are bundled in.
