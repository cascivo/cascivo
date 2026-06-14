# cascivo — Roadmap v22: Demos On-Domain (the showcase, integrated)

**Last updated:** 2026-06-14
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-14-v22-master-plan.md` + tranches 1–5

---

## Vision

v21 shipped five functional example dashboards — Cascade Deploy/Pay/Flow/Track/Pulse — each a faithful,
mock-backed re-creation of a recognisable SaaS product, proving cascivo composes into real products.
But they shipped as **five standalone apps deployed to five separate Cloudflare Pages projects**, each
on its own disconnected `.pages.dev` URL. The landing page advertises them in an `ExamplesGallery`
section, yet every "View demo" link is `href="#"` with `aria-disabled` — **the demos are unreachable
from the marketing site.** The single most persuasive asset cascivo has is currently a dead end.

v22 closes that gap. It makes the five demos **first-class citizens of the landing domain**: reachable
in one click, presented with marketing-grade detail pages, and served from the **same origin**
(`cascivo.com`) with no domain switch — so an evaluator who lands on the homepage can go _read the
pitch → see the proof → drive the product_ without ever leaving the site or trusting a second host.

> Concept: **"The proof is one click away, on the same page you pitched it."** No subdomains, no
> `.pages.dev` detours, no iframes. The demos live at `cascivo.com/demos/<name>/`, the marketing for
> each lives at `cascivo.com/examples/<name>`, and the homepage gallery finally links to both.

## What "integrated" means here (the decision)

Two architectural choices were settled up front (see "Decisions baked in"):

1. **Mounting:** the five demos are **assembled into the landing's build output** and shipped as part
   of the landing's single Cloudflare Pages project. No per-demo CF projects, no Cloudflare path-routing
   config, no second host. The landing deploy builds each demo, copies its `dist/` into the landing
   `dist/demos/<name>/`, and the existing CF Pages "serve real files first" behaviour does the rest.
2. **Presentation:** **full per-example detail pages.** A landing `/examples` hub indexes all five, and
   each demo gets a dedicated `/examples/<name>` marketing page (hero, screenshots in light + dark,
   "what it proves", component-coverage chips, a prominent "Open live demo" CTA, and the mock-demo
   disclaimer). The homepage `ExamplesGallery` cards link into this hub.

## URL scheme (collision-free by design)

| Path               | Served by                         | Kind             | Example                 |
| ------------------ | --------------------------------- | ---------------- | ----------------------- |
| `/examples`        | Landing SPA (prerendered)         | Marketing hub    | index of all five demos |
| `/examples/<name>` | Landing SPA (prerendered)         | Marketing detail | `/examples/deploy`      |
| `/demos/<name>/`   | Assembled static app (real files) | The live demo    | `/demos/deploy/`        |

The live apps deliberately mount under **`/demos/`**, not `/examples/`, because a landing SPA route
`/examples/deploy` and a real directory `/examples/deploy/index.html` would collide on Cloudflare
Pages' directory-index resolution. Splitting marketing (`/examples/*`) from running apps (`/demos/*`)
removes the ambiguity entirely.

## Why assemble-into-landing (not separate projects + routing)

- **Zero out-of-repo infra.** Unlike `/docs` and `/storybook` (separate CF projects mapped onto the
  apex domain via Cloudflare routing the repo can't see), the demos ship inside the landing deploy.
  Everything that makes the integration work is in the repo and verifiable locally.
- **One origin, one deploy.** Same-origin means `@cascivo/storage` persistence, theme cookies, and
  relative links all "just work" with no CORS, no cross-subdomain quirks.
- **Trade-off accepted:** the landing deploy now also builds five apps, and per-demo deploy isolation
  is lost (a change to one demo redeploys the landing). For five small static SPAs this is cheap, and
  the paths-filter keeps the landing job from running on unrelated changes.

## Mount-portability: relative base, not hardcoded paths

Each demo is a single-page app with **no internal client routing** (verified: no `pushState`/router in
any of the five). That makes them trivially mount-portable: set Vite `base: './'` so every asset and
entry reference is **relative**, and the same build runs correctly at `/demos/<name>/` _and_ unchanged
at `/` under standalone `vp dev`/`vp preview` (so existing per-app Playwright specs keep passing). No
app needs to know the path it's mounted at.

## Workstreams

| #   | Workstream                | Tranche | Summary                                                                                                                                                                                                    |
| --- | ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Mount-portability + build | T1      | `base: './'` on all five demos; an assembly script that builds + copies each into `landing/dist/demos/<name>/`; storage-key collision audit; local end-to-end preview.                                     |
| B   | Examples hub route        | T2      | Landing `/examples` hub page (index of five, thumbnails, coverage chips); wire homepage `ExamplesGallery` cards to it; nav + footer + sitemap.                                                             |
| C   | Per-example detail pages  | T3      | `/examples/<name>` ×5: hero, screenshots, "what it proves", coverage, "Open live demo" CTA → `/demos/<name>/`, mock disclaimer; prerender heads + sitemap.                                                 |
| D   | Screenshot assets         | T4      | Deterministic Playwright capture (light + dark, desktop + mobile) for each demo, committed as static assets consumed by the hub + detail pages.                                                            |
| E   | CI consolidation + gate   | T5      | Fold the five `deploy-*` CF jobs into `deploy-landing` (build → assemble → deploy); widen the `landing` paths-filter; remove redundant per-demo jobs/vars; update READMEs; full CLAUDE.md gate; close DoD. |

## Decisions baked in

1. **Assemble into the landing dist — one CF project.** The five demos ship inside the landing deploy
   under `/demos/<name>/`. No separate CF Pages projects, no Cloudflare routing config.
2. **Full per-example detail pages.** A `/examples` hub plus a `/examples/<name>` marketing page per
   demo. The homepage gallery links into the hub; detail pages link out to the live `/demos/<name>/`.
3. **`/demos/*` for live apps, `/examples/*` for marketing.** Prevents the directory-index collision
   between a landing SPA route and a real assembled app directory.
4. **Relative base, never hardcoded paths.** `base: './'` keeps each demo portable and keeps standalone
   `vp dev`/`preview` + the existing Playwright specs working unchanged.
5. **No new components, no new runtime deps, no server.** v22 is wiring + marketing pages + a build
   step. It consumes the existing library and the v21 apps; it adds no `@cascivo/*` components.
6. **Determinism holds.** Screenshots derive from the demos' seeded fixtures (v21 rule) so captures are
   reproducible; the capture script pauses each demo's simulation engine before snapping.
7. **Signal + mobile-first rules hold.** New landing pages call `useSignals()` before reading signals,
   use `useSignalEffect` for DOM side effects, no `useState`/`useEffect`/`useContext`, token-only CSS,
   mobile-first, i18n strings — same as every other landing surface.
8. **Mock nature stays explicit.** Every detail page and the hub carry the "mock demo — no real data"
   disclaimer the v21 apps already show, so no one mistakes a demo for the real service.

## Definition of Done

- [ ] All five demos build with `base: './'` and run correctly both standalone (`vp preview` at `/`)
      and when assembled under `/demos/<name>/`. _Verify: T1._
- [ ] An assembly script (`scripts/assemble-demos.mjs` or equivalent) builds each demo and copies its
      output into `apps/landing/dist/demos/<name>/`; a single command produces a landing `dist/` that
      previews the homepage **and** every live demo from one local server. _Verify: T1._
- [ ] No `@cascivo/storage` key collides across the five demos now that they share one origin; a check
      asserts each demo's keys are uniquely prefixed. _Verify: T1._
- [ ] `/examples` hub route exists, lists all five with thumbnail, "feels like", and coverage chips, and
      is reachable from the header nav and footer; sitemap + prerendered head updated. _Verify: T2._
- [ ] The homepage `ExamplesGallery` cards link to `/examples/<name>` (no more `href="#"`/`aria-disabled`).
      _Verify: T2._
- [ ] Five `/examples/<name>` detail pages exist (hero, light+dark screenshots, "what it proves",
      coverage chips, "Open live demo" CTA → `/demos/<name>/`, mock disclaimer), each prerendered with a
      unique head + sitemap entry. _Verify: T3._
- [ ] A deterministic screenshot script produces committed light/dark (+ mobile) captures for each demo,
      consumed by the hub and detail pages; re-running it yields a no-op diff. _Verify: T4._
- [ ] `deploy-landing` builds the five demos, assembles them, and deploys one CF Pages project; the
      redundant per-demo `deploy-*` jobs and `CF_PROJECT_*` vars are removed; the `landing` paths-filter
      includes the demo apps + kit + packages. _Verify: T5._
- [ ] Each demo's README and Playwright spec reflect the relative base and the new live URL
      (`/demos/<name>/`). _Verify: T5._
- [ ] Full CLAUDE.md gate exits 0 (`vp check` → build → `vp run -r check` → test → regen + diff →
      `breakpoint:check`). _Verify: T5._
- [ ] `ROADMAP-V22.md` DoD boxes all checked; status → ✅ Shipped. _Verify: T5._

## Non-goals (explicitly out of scope)

| Claim                        | Substance                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **No Cloudflare routing**    | The demos are assembled into the landing dist; no apex path-routing/Worker config is added or required.          |
| **No iframes**               | Detail pages link out to the live demo; they do not embed it in an iframe.                                       |
| **No separate demo domains** | The five per-demo CF Pages projects are retired; everything lives under `cascivo.com`.                           |
| **No new components / deps** | v22 wires up and markets the v21 apps; it adds no `@cascivo/*` components and no runtime dependencies.           |
| **No backend**               | Unchanged from v21 — mock-API + storage + sim engine only.                                                       |
| **No demo feature work**     | v22 does not change demo functionality; bug-fix-only touches to the demos are allowed where integration demands. |

## Deferred (do not re-litigate in v22)

- **Cloudflare apex path-routing for demos** — only if a future scale reason makes the single-project
  assembly too heavy; its own infra-reviewed change.
- **Live-embedded (iframe) previews on detail pages** — static screenshots ship in v22; embedding is a
  follow-up if evaluators ask.
- **A unified cross-demo "product family" shell/switcher** between the running demos — the demos stay
  independent; a shared top-bar that hops between them is deferred.
- **Per-demo OG cards / social previews** — the landing OG card covers `/` and the marketing routes;
  bespoke per-demo OG images are a follow-up.
- **Retiring v21's standalone-preview affordances** — `vp dev`/`preview` per demo stays for local work.
