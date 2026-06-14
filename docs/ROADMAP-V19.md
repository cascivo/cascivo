# cascivo — Roadmap v19: The Landing Audit & Hardening

**Last updated:** 2026-06-14
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-14-v19-master-plan.md` + tranches 1–8

---

## Vision

v16 made the landing an accurate _receipt_. v17 added the _guides_ layer. Both shipped real content.
Neither audited whether the page itself is **technically sound** — whether a search crawler, an AI
answer engine, a phone, or a screen reader actually gets what we intend to ship.

This roadmap is the output of a full, file-level audit of `apps/landing` (routing, links, SEO, social
previews, favicons, accessibility, mobile, performance, runtime correctness, and test coverage),
cross-checked against 2026 best practices. The finding is simple: **the content is excellent; the
delivery layer leaks.** A cold deploy ships a broken social-preview image, stale headline numbers, no
robots/sitemap/canonical/structured-data, a client-only render that crawlers and AI agents see as an
empty shell, two of four pages missing skip-nav, a mobile drawer with no focus trap, no code-splitting,
and a test matrix that skips half the routes.

> Concept: **"The Hardening Layer."** No new product features, no new marketing claims. v19 fixes
> everything the audit found that is broken or sub-ideal, each fix grounded in a current best practice
> and verified against a concrete acceptance test. The goal: a landing page that is correct for
> humans, crawlers, AI agents, phones, and assistive tech — not just for the demo.

## The audit (finding → today → fix v19 ships)

Severity: 🔴 broken · 🟡 not-ideal · 🔵 polish. Every row is a real finding with a file reference;
`#axe` was flagged during the audit and **verified valid** (`id="axe"` exists in
`AxeComparison.tsx:17`) — it is explicitly _not_ a finding and must not be "fixed."

| #   | Sev | Finding                                                                        | Today (file)                                                                          | Fix v19 ships                                                                                |
| --- | --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | 🔴  | Stale headline numbers                                                         | `index.html` og:description: "97+ components", "five themes"                           | Live values: **118 components, 10 themes** (sourced, not re-hardcoded where avoidable)       |
| 2   | 🔴  | Social preview image missing on cold deploy                                    | `/og.png` referenced; generated only by `og.spec.ts` (`@og`, excluded from CI)        | OG image produced as a **build step**, committed/drift-checked, 1200×630, with `og:image:alt`|
| 3   | 🔴  | No crawlable HTML per route                                                    | SPA renders client-side only; `deepLinkCopies` copies the empty shell to 3 routes     | **Prerender** each route's HTML + per-route head so crawlers/AI agents get real content      |
| 4   | 🔴  | No SEO fundamentals                                                            | No canonical, no `robots` meta, no `robots.txt`, no `sitemap.xml`, no JSON-LD          | Add canonical (per route), robots meta, `robots.txt`, `sitemap.xml`, `SoftwareApplication`/`WebSite` JSON-LD |
| 5   | 🔴  | Unknown paths silently render home                                             | `App.tsx` falls back to `HOME` for any path; no 404 view, no `404.html`               | A real `NotFound` view + `404.html` fallback for static hosts                                |
| 6   | 🟡  | Per-route metadata is title-only                                              | `App.tsx` updates `document.title` only; description/og/canonical never change         | Per-route `description` + `og:*` + canonical, set on navigation **and** prerendered          |
| 7   | 🟡  | External links lack `rel`/`target`                                            | `Footer.tsx:53` renders every link (incl. GitHub) via one `<a href>`                   | External links get `target="_blank"` + `rel="noopener noreferrer"`; internal stay plain      |
| 8   | 🟡  | Buttons used for navigation                                                    | `Hero.tsx`, `CtaBand.tsx`, `GuidesCta.tsx`, `A11yCta.tsx` use `window.location.href`   | Replace with real anchors styled as buttons (keyboard + crawlable + semantic)                |
| 9   | 🟡  | Skip-nav missing on 2 of 4 pages                                              | Home (`App.tsx` HomePage) and `PerformancePage` lack `SkipNavLink`/`SkipNavTarget`     | Add skip-nav to Home and Performance (mirror Accessibility/Guides)                           |
| 10  | 🟡  | Mobile drawer has no focus trap                                              | `Header.tsx` opens a drawer; Esc/scrim close it, but focus can escape behind it        | Trap focus while open (or `inert` the background); restore focus on close                    |
| 11  | 🟡  | Favicon/PWA set incomplete                                                    | Only `favicon.svg`; no `.ico`, no `apple-touch-icon`, no manifest, no 192/512 PNGs     | Full set: `favicon.ico`, `apple-touch-icon.png` (180), `site.webmanifest` (192/512), head tags|
| 12  | 🟡  | No code-splitting                                                              | `App.tsx` eagerly imports all sections incl. heavy `ChartShowcase`/`RelayConsole`      | Route-level lazy + `Suspense`; defer below-the-fold heavy home sections                       |
| 13  | 🟡  | Missing `twitter:title`/`twitter:description`                                  | `index.html` has only `twitter:card` + `twitter:image`                                 | Add `twitter:title` + `twitter:description` (per route once prerendered)                      |
| 14  | 🟡  | Mobile-overflow harness skips routes                                          | `mobile.spec.ts` covers only `/` and `/guides`                                         | Add `/accessibility` and `/performance` at 320/375/390/414                                   |
| 15  | 🟡  | axe sweep skips `/guides`                                                     | `a11y.spec.ts` covers `/`, `/accessibility`, `/performance`                            | Add `/guides` to the axe matrix (light + dark)                                               |
| 16  | 🔵  | `theme-color` is a static hex                                                 | `index.html` `theme-color="#0079bf"` (the `--cascivo-brand-primary` fallback hex)      | Verify it equals computed `--cascivo-brand-primary` (`oklch(0.55 0.15 240)`); keep or correct|
| 17  | 🔵  | No link-checker in CI                                                          | No test asserts in-page anchors resolve or that nav targets exist                      | A link/anchor integrity test (every in-page `#anchor` has a matching `id`)                    |
| 18  | 🔵  | Cross-app footer links unverified                                            | `/docs`, `/storybook`, `/why`, `/llms.txt`, `/registry.json` leave the landing app     | Document + verify they resolve on the deployed domain (and that `llms.txt`/`registry.json` are served) |
| 19  | 🔵  | No analytics/privacy posture stated                                          | No analytics, cookie banner, or privacy link (privacy-friendly, but undocumented)      | State the posture explicitly (no-tracking is a feature) — README note; no tracking added     |

## Non-goals (explicitly out of scope)

This is a hardening pass, not a redesign or a feature release.

| #   | Claim                          | Substance                                                                                                                                 |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| —   | **No new marketing claims**    | v16 (1–30) and v17 (31–33) stand. v19 adds zero claims to `/why`. It makes the existing claims _deliverable to crawlers and AI agents_.   |
| —   | **No new sections/pages**      | No new landing route except a `NotFound` view. The five existing routes (`/`, `/accessibility`, `/performance`, `/guides`, `/og`) stay.   |
| —   | **No package/registry changes**| All work is in `apps/landing` (+ root host config + build wiring). No `@cascivo/*` source, no `registry.json`, no new npm runtime deps.    |

## Workstreams

| #   | Workstream                | Tranche | Summary                                                                                                              |
| --- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| A   | SEO metadata foundation   | T1      | Fix stale numbers; add canonical/robots/JSON-LD; `robots.txt` + `sitemap.xml`; per-route head model.                |
| B   | Social image + favicons   | T2      | OG image at build time (1200×630 + alt); full favicon/manifest/apple-touch set + head tags.                          |
| C   | Crawlability + 404        | T3      | Prerender each route to real HTML with per-route head; `NotFound` view + `404.html` static fallback.                |
| D   | Links + nav semantics     | T4      | External `rel`/`target`; buttons→anchors for navigation; verify cross-app links.                                    |
| E   | Accessibility hardening   | T5      | Skip-nav on Home + Performance; mobile-drawer focus trap; axe sweep for `/guides`.                                  |
| F   | Performance               | T6      | Route-level code-splitting (lazy + Suspense); defer heavy home sections; LCP/font check.                            |
| G   | Test coverage             | T7      | Mobile harness for all routes; axe `/guides`; anchor/link-integrity test; optional perf budget.                     |
| H   | Final gate + DoD          | T8      | Full CLAUDE.md gate; Playwright re-verify; DoD walkthrough; roadmap close.                                          |

## Decisions baked in

1. **Landing-scoped, with two justified exceptions.** Nearly all work is in `apps/landing/src`,
   `apps/landing/public`, and `apps/landing/vite.config.ts`. The only out-of-app artifacts are
   host-level static files the landing build emits (`robots.txt`, `sitemap.xml`, `404.html`,
   `site.webmanifest`, favicon assets, `og.png`). No `@cascivo/*` package or `registry.json` change.
2. **Numbers are sourced, not re-hardcoded.** Where a count can be read from a build-available source
   (component count from `registry.json`, theme count from `packages/themes/src/*.css`), the build
   injects it. Where it must live in static HTML, a single constant feeds both the meta and a drift
   check so it can never silently rot again. **118 components, 10 themes, WCAG 2.2 AA** are the current
   ground-truth values — re-verify at implementation, never copy a stale figure.
3. **Prerender is the SEO lever; client-side meta is not enough.** Research is explicit: meta injected
   only after hydration is missed by social and AI crawlers. v19 prerenders each route's HTML with its
   own `<title>`/description/canonical/og — extending the existing build pipeline (the page already
   runs Playwright for the OG image). If full content-prerender proves too costly under alpha `vp`,
   the **fallback** is per-route static HTML with correct head tags via the existing `deepLinkCopies`
   mechanism — graded in T3, never skipped.
4. **The OG image ships from the build, not the test.** `og.spec.ts` stays as the generator, but its
   output is produced during the build/regen flow and drift-checked, so `public/og.png` exists on a
   cold clone+deploy. 1200×630 with a meaningful `og:image:alt`.
5. **Semantic navigation.** Anything that navigates is an `<a>` (styled as a button if needed), not a
   `<button onClick=window.location>`. This restores keyboard behavior, middle-click/open-in-new-tab,
   and crawlability. External links carry `target="_blank"` + `rel="noopener noreferrer"`.
6. **Accessibility parity across all four pages.** Skip-nav on every page; the mobile drawer traps
   focus while open and restores it on close; axe covers every public route (light + dark).
7. **Mobile-first + signal rules still apply.** Any touched/new component reading `signal.value`
   during render calls `useSignals()` first; DOM side effects use `useSignalEffect`; no
   `useState`/`useEffect`/`useContext`. `React.lazy`/`Suspense` are permitted (not banned hooks). New
   CSS is mobile-first, token-based, no hardcoded colors.
8. **Every fix has an acceptance test.** A fix without a test that would have caught the bug is not
   done. The mobile harness, axe matrix, and a new anchor/link-integrity test are extended so the
   audit's findings can never silently regress.
9. **`#axe` is valid — do not touch it.** The audit's lone false positive. `AccessibilityStatement.tsx`
   links to `#axe` and `AxeComparison.tsx:17` defines `id="axe"`. Documented here to prevent churn.
10. **Privacy posture is stated, not changed.** v19 adds **no** analytics or tracking. The absence is a
    feature; it is documented (README) so it reads as intentional, not as an oversight.

## Definition of Done

- [ ] Headline numbers are correct everywhere (118 components, 10 themes); a drift check fails if a
      hardcoded count diverges from source. _Verify: T1._
- [ ] A cold `git clone` + build produces `public/og.png` (1200×630); `index.html` exposes
      `og:image`, `og:image:alt`, `twitter:image`, `twitter:title`, `twitter:description`. _Verify: T2._
- [ ] Each route ships prerendered HTML containing its own `<title>`, meta description, canonical, and
      og tags (viewable with JS disabled / `curl`). _Verify: T3._
- [ ] `robots.txt` and `sitemap.xml` are served at the site root; every public route has a canonical
      link; `SoftwareApplication`/`WebSite` JSON-LD is present and validates. _Verify: T1/T3._
- [ ] An unknown path renders a real `NotFound` view (not a silent home page) and static hosts serve a
      `404.html`. _Verify: T3._
- [ ] No element that navigates is a `<button onClick=window.location>`; external links carry
      `target="_blank"` + `rel="noopener noreferrer"`. _Verify: T4._
- [ ] All four content pages have skip-nav; the mobile drawer traps focus while open and restores it on
      close. _Verify: T5._
- [ ] A complete favicon/PWA set ships (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`,
      `site.webmanifest` with 192/512 icons) with correct head tags. _Verify: T2._
- [ ] Heavy below-the-fold/home sections and non-home routes are code-split (lazy + `Suspense`); the
      initial home bundle shrinks measurably vs. baseline. _Verify: T6._
- [ ] Playwright mobile-overflow covers `/`, `/accessibility`, `/performance`, `/guides` at
      320/375/390/414; axe covers all four (light + dark); an anchor/link-integrity test passes. _Verify: T7._
- [ ] Full CLAUDE.md gate exits 0 (`vp check` → build → `vp run -r check` → test → regen + diff). _Verify: T8._
- [ ] `ROADMAP-V19.md` DoD boxes all checked; status → ✅ Shipped. _Verify: T8._

## Deferred (do not re-litigate in v19)

- **Full SSR / React Server Components for the landing** — prerendering static marketing routes is the
  right-sized fix; a runtime SSR server is a larger architecture change. Out of scope.
- **A real shadcn→cascivo codemod / interactive converter** — still deferred (v17 note stands).
- **Analytics / consent platform** — explicitly not added; privacy-friendly by default.
- **New components / themes** — use the dark factory; v19 is landing-hardening only.
- **Visual-regression (pixel-diff) suite & Lighthouse-CI gating** — valuable, but T7 ships the
  high-value subset (overflow, axe, anchor integrity). A full perf-budget CI job is a follow-up.
- **`/why` claim additions** — v19 deliberately adds none.
