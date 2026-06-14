# v19 Master Plan — The Hardening Layer (landing audit fixes)

> **For agentic workers:** This is the umbrella document. Implement tranche by tranche:
> `2026-06-14-v19-tranche-1.md` … `2026-06-14-v19-tranche-8.md`, in order. Each tranche uses
> superpowers:subagent-driven-development or superpowers:executing-plans. For any visual change, also
> use compound-engineering:frontend-design and screenshot-verify at each mobile breakpoint.
>
> **Re-verify each named file/route/count/command at tranche start. If absent or different, STOP and
> re-read the tranche's "Current-state assumptions" before proceeding.**

**Goal:** Execute `docs/ROADMAP-V19.md` — fix every broken/sub-ideal finding from the full
`apps/landing` audit (SEO, social previews, favicons, crawlability, 404s, link/nav semantics,
accessibility, performance, mobile, and test coverage), each grounded in a 2026 best practice and
guarded by an acceptance test. No new product features, no new marketing claims.

**Architecture:** `apps/landing` only, plus the static host artifacts the landing build emits
(`robots.txt`, `sitemap.xml`, `404.html`, `site.webmanifest`, favicon assets, `og.png`) and
`apps/landing/vite.config.ts` build wiring. No `@cascivo/*` package changes, no `registry.json`
changes, no new npm runtime dependencies.

**Tech stack:** unchanged. React 18+ + `@preact/signals-react` (`useSignals()` for signal reads,
`useSignalEffect` for DOM side effects, never `useEffect`/`useState`). `React.lazy`/`Suspense` are
permitted. Mobile-first, token-based CSS. Playwright for e2e/build-time rendering.

---

## Research findings (ground truth — verified 2026-06-14)

### Current-state facts (re-verify at use)

- **Routes** (`apps/landing/src/App.tsx`): `/` (HomePage), `/accessibility`, `/performance`,
  `/guides`, `/og`. Routing is **history-API** based off `window.location.pathname` (~`App.tsx:63`);
  `document.title` is set per route (~`App.tsx:67`). Unknown paths fall back to HOME (no 404).
- **Deep links** are made to work on static hosts by `deepLinkCopies()` in `vite.config.ts:11–23`,
  which copies the built `index.html` into `accessibility/`, `performance/`, `guides/` at
  `closeBundle`. It does **not** cover `/og`, arbitrary paths, or inject per-route head.
- **Counts:** `jq '.components | length' registry.json` → **118**. `packages/themes/src/*.css` → **10**
  (brutalist, corporate, dark, flat, light, midnight, minimal, pastel, terminal, warm). WCAG **2.2 AA**.
- **index.html** og:description hardcodes **"97+ components"** and **"five themes"** (both stale). It
  has og:title/description/url/image/type, twitter:card/image — but **no** canonical, robots,
  `twitter:title`, `twitter:description`, `og:image:alt`, `og:image:width/height`, or JSON-LD.
- **OG image:** `test/og.spec.ts` renders `/og` at 1200×630 and writes `public/og.png`, tagged `@og`
  and excluded from the normal run (`playwright.config.ts` grep `^(?!.*@og)`). So `public/og.png` is
  **absent on a cold clone** → broken `og:image`. `public/` currently has only `favicon.svg`,
  `logo.svg`, `logo-mark.svg`.
- **Brand color:** `--cascivo-brand-primary` = `oklch(0.55 0.15 240)`, static hex fallback `#0079bf`
  (used in `favicon.svg` and `index.html` `theme-color`). The theme-color is therefore likely correct;
  T2 verifies rather than assumes.
- **Footer** (`Footer.tsx`): all links — internal (`/docs`, `/storybook`, `/why`,
  `/docs/benchmarks`, `/llms.txt`, `/registry.json`) and external (`REPO` = GitHub) — render through a
  single `<a href={link.href}>` (~line 53) with no `rel`/`target` distinction.
- **Button-as-nav:** `Hero.tsx` (~41–54), `CtaBand.tsx`, `pages/guides/GuidesCta.tsx`,
  `pages/accessibility/A11yCta.tsx` navigate via `onClick → window.location.href`.
- **Skip-nav:** present in `AccessibilityPage.tsx` and `GuidesPage.tsx`; **absent** in HomePage
  (in `App.tsx`) and `PerformancePage.tsx`.
- **Mobile drawer** (`Header.tsx`): `useSignals()` first ✓; Esc + scrim close it; **no focus trap /
  `inert`** on the background while open.
- **Signal correctness:** audit found landing components correctly call `useSignals()` where they read
  signals; the only `useState` is the **sanctioned** comparison twin in `SignalsDemo.tsx` (v7 decision 9) — do not touch it.
- **Code-splitting:** none. `App.tsx` eagerly imports every home section including heavy
  `ChartShowcase` (`@cascivo/charts`) and `RelayConsole` (DataTable/Modal/Toast/etc.).
- **Tests:** `a11y.spec.ts` (`/`, `/accessibility`, `/performance`, light+dark, modal);
  `mobile.spec.ts` (`/`, `/guides` at 320/375/390/414); `smoke.spec.ts` (home); `motion.spec.ts`
  (reduced motion, home); `og.spec.ts` (`@og`). Gaps: `/guides` axe, `/accessibility`+`/performance`
  mobile, anchor/link integrity, perf budget.
- **`#axe` is VALID** — `AccessibilityStatement.tsx:82` → `AxeComparison.tsx:17` `id="axe"`. Not a bug.

### Best-practice synthesis (2026 — informs the fixes, not literal copy)

- **Core Web Vitals targets:** LCP < 2.5s, INP < 200ms, CLS < 0.1; mobile is 30–50% worse than desktop
  — optimize mobile first. Preload the LCP element; don't lazy-load it. → T6 framing.
- **SPA SEO:** prerender static marketing routes so crawlers/AI answer-engines/agentic crawlers (which
  often skip JS) get real HTML. Each virtual page needs its **own** title + description + canonical.
  Client-side-only meta injection is missed by social/AI crawlers. → T1/T3.
- **Never** `user-scalable=no` / `maximum-scale=1` (current viewport is clean — keep it). Don't hide
  ranking-relevant content with `display:none` on mobile. → T5/T6 guardrail.
- **Favicons (2026):** ship `favicon.svg` + `favicon.ico` + `apple-touch-icon.png` (180×180) +
  `site.webmanifest` (PNG 192/512, theme_color, background_color, display) + the matching head tags
  (Safari iOS ignores `link rel=icon`). → T2.
- **Social previews:** `og:image` 1200×630, with `og:image:alt`, `twitter:title`,
  `twitter:description`; crawlers must see them in server-rendered HTML. → T1/T2/T3.
- **Audit tooling:** axe-core (full rule set) for a11y regression; Playwright for overflow + render;
  Lighthouse/Unlighthouse for CWV; a link/anchor checker for integrity. Automated tools catch ~30–40%
  of WCAG — keep the manual keyboard/drawer checks too. → T5/T7.

---

## Key decisions

1. **Scope = landing app + its emitted host artifacts.** Source under `apps/landing/src`, static files
   under `apps/landing/public`, build wiring in `apps/landing/vite.config.ts`. No package/registry/dep
   changes.

2. **One source of truth per number.** Component count from `registry.json`, theme count from
   `packages/themes/src/*.css`. Inject at build where possible; where a static constant is unavoidable,
   feed it from one module and add a drift assertion. Re-verify 118/10/2.2-AA at implementation.

3. **Prerender, graded.** Primary: a post-build prerender that renders each route (reusing the existing
   Playwright/`/og` infra) and writes real HTML with per-route `<head>`. Fallback (if alpha `vp` makes
   full prerender impractical): extend `deepLinkCopies` to emit per-route static HTML with correct head
   tags (title/description/canonical/og) even if the body is the app shell. T3 decides explicitly and
   documents which path shipped — it never silently skips.

4. **OG image is a build artifact.** Wire OG generation into the build/regen flow so `public/og.png`
   exists on a cold clone; drift-check it. Keep `og.spec.ts` as the generator.

5. **Semantic navigation.** Replace every `window.location.href` navigation with an `<a>` (styled as a
   button via existing classes). External links: `target="_blank"` + `rel="noopener noreferrer"`.
   Internal links stay plain SPA anchors.

6. **A11y parity.** Skip-nav on Home + Performance; focus trap (or `inert` background) on the mobile
   drawer with focus restore on close; axe across all four public routes.

7. **Perf via splitting, not rewrites.** Route-level `React.lazy` for `/accessibility`, `/performance`,
   `/guides`, `/og`; lazy-load heavy below-the-fold home sections (`ChartShowcase`, `RelayConsole`)
   behind `Suspense` with a lightweight fallback. Measure home bundle before/after. Verify LCP element
   (hero) is not lazy and fonts aren't render-blocking.

8. **Signal + mobile-first rules hold.** `useSignals()` first when reading signals; `useSignalEffect`
   for DOM side effects (the drawer focus trap qualifies); no `useState`/`useEffect`/`useContext`.
   Mobile-first, token-only CSS. `React.lazy`/`Suspense` are allowed.

9. **Test-guarded fixes.** Extend `mobile.spec.ts` (all four routes), `a11y.spec.ts` (`/guides`), add
   an anchor/link-integrity spec, and (optional) a perf-budget assertion. Commit per task; the full
   gate runs at T8.

10. **No new claims, no new sections** (except `NotFound`). Privacy posture documented, not changed.
    `theme-color` and `#axe` are verified-then-left-alone unless proven wrong.

---

## Tranche map

| T#  | Focus                        | Files changed (primary)                                                                                                                         | Risk     |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| T1  | SEO metadata foundation      | `index.html`, new per-route head model (`App.tsx` + a `seo.ts`), `public/robots.txt`, `public/sitemap.xml`, JSON-LD                             | Medium   |
| T2  | OG image + favicon/PWA set   | `vite.config.ts` (OG build step), `public/og.png`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/site.webmanifest`, `index.html` | Medium   |
| T3  | Crawlability + 404           | `vite.config.ts` (prerender), per-route HTML, `App.tsx` (`NotFound`), `public/404.html`                                                         | **High** |
| T4  | Links + nav semantics        | `Footer.tsx`, `Hero.tsx`, `CtaBand.tsx`, `pages/guides/GuidesCta.tsx`, `pages/accessibility/A11yCta.tsx`, `landing.css`                         | Low      |
| T5  | Accessibility hardening      | `App.tsx`/HomePage, `PerformancePage.tsx` (skip-nav), `Header.tsx` (focus trap), `landing.css`                                                  | Medium   |
| T6  | Performance / code-splitting | `App.tsx` (lazy routes), home section lazy boundaries, `landing.css` (fallbacks)                                                                | Medium   |
| T7  | Test coverage                | `test/mobile.spec.ts`, `test/a11y.spec.ts`, new `test/links.spec.ts`, `playwright.config.ts`                                                    | Low      |
| T8  | Final gate + DoD + close     | `docs/ROADMAP-V19.md`                                                                                                                           | Low      |

**Risk notes:**

- **T3 (High):** Prerendering under alpha `vp`/Rolldown is the riskiest item. Spike it first; if the
  primary path is impractical, ship the documented fallback (per-route static HTML head) and record the
  decision. Whatever ships must let `curl`/JS-disabled view show per-route title + description + og.
- **T1/T2 (Medium):** Head tags and OG/favicon assets must be correct and present on a cold clone.
  Build wiring (OG step, manifest) is the failure point — verify on a fresh checkout, not just locally.
- **T5/T6 (Medium):** Focus trap must use `useSignalEffect` (not `useEffect`) and not break Esc/scrim
  close. Lazy boundaries must keep the LCP hero eager and not introduce layout shift (CLS) via late
  fallbacks. Re-run the mobile + a11y harness after each.
- **T4/T7 (Low):** Mechanical, well-scoped; the new link-integrity test pins finding #17.
