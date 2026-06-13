# cascivo — Roadmap v15: The Rebrand & Mobile

**Last updated:** 2026-06-13
**Status:** 📋 Planned (builds on v14 — Earned Quality)
**Plan documents:** `docs/superpowers/plans/2026-06-13-v15-master-plan.md` + tranches 1–7

---

## Vision

Two things are now true that the codebase doesn't yet reflect:

1. **The project has a real name and a real domain.** `cascade-ui` collided with an existing
   library and had no clean domain (see `docs/BRAND.md`). The owner purchased **`cascivo.com`**.
   The repository still ships ~1,305 files mentioning `cascade`, 24 `@cascade-ui/*` packages, a
   `--cascivo-*` CSS token prefix across 113 CSS files, a `cascade` CLI, a registry pinned to
   `raw.githubusercontent.com/urbanisierung/cascade-ui`, and an MCP server pointed at
   `cascade-ui.dev`. The name is decided; the code hasn't caught up. v15 makes the rename total
   and coherent — name, packages, tokens, CLI, registry, domain, and a first-class brand identity
   (logo + color system) — instead of a half-applied label.

2. **The first two things a user touches — the landing page and the docs — are not mobile
   friendly.** The landing is desktop-first: grids collapse but the hero CTAs don't wrap, the
   `RelayConsole` dashboard demo and the chart/signals demos are built for wide viewports, there
   is no breakpoint below 32rem, and no section uses container queries. The docs `.doc-page` is a
   fixed 760px with no small-screen handling and only a single 64rem AppShell breakpoint. A design
   system that ships beautiful components but whose own shop window breaks on a phone undercuts its
   own thesis. v15 rebuilds both surfaces mobile-first, landing before docs, to a world-class bar
   benchmarked against the sites that master it.

> Concept: **"Name it, then make the front door flawless."** v15 converts a purchased domain into
> a coherent brand applied everywhere, and converts a desktop-first marketing surface into one that
> is verifiably perfect from 320px up.

## The diagnosis (pain → what cascade has → what v15 closes)

| #   | Pain                                     | Today                                                                                                          | Gap v15 closes                                                                                                   |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Name collides; no owned domain reflected | `@cascade-ui/*`, `--cascivo-*`, CLI `cascade`, registry on `urbanisierung/cascade-ui`, MCP on `cascade-ui.dev` | `cascivo.com` purchased but applied nowhere; brand is a placeholder, not an identity                             |
| 2   | No brand identity                        | `docs/BRAND.md` is a domain-search log; no logo, no brand colors, no name derivation recorded                  | No logo, no brand palette, no documented "cascade-ui → cascivo" rationale                                        |
| 3   | npm/distribution naming undecided        | Packages scoped `@cascade-ui/*`; CLI unscoped `cascade`                                                        | No decision recorded on the post-rename namespace / CLI invocation                                               |
| 4   | Landing not mobile friendly              | Desktop-first; grids collapse but heavy demos overflow; no <32rem breakpoint; no container queries             | Hero CTAs don't wrap; `RelayConsole`/charts/signals demos built wide; no real-device verification                |
| 5   | Docs not mobile friendly                 | `.doc-page` fixed 760px; single 64rem AppShell breakpoint; no small-screen pass                                | No mobile-first layout; narrow-viewport content squeeze; tables/code overflow not designed, just `overflow:auto` |

## The pitch additions (extends v14's claims 1–24)

| #   | Claim                                  | Substance                                                                                                                         |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 25  | **One coherent brand — cascivo**       | Single name across every package, token, CLI, registry URL, and domain; derivation documented; logo + brand color system shipped. |
| 26  | **The landing is flawless on a phone** | Mobile-first rebuild, real-device verified at 320/375/390/414px; zero horizontal overflow; heavy demos get mobile treatments.     |
| 27  | **The docs match it**                  | Mobile-first docs: off-canvas nav, fluid type, responsive tables/code, container-query sections — full parity with the landing.   |

## Workstreams

| #   | Workstream            | Tranche | Summary                                                                                                                                      |
| --- | --------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Brand identity        | T1      | Rewrite `BRAND.md` (name derivation, logo proposal, brand palette); logo SVG spec; brand color decisions. Docs/assets only — no code rename. |
| B   | Token rename          | T2      | `--cascivo-*` → `--cascivo-*` across tokens, 10 themes, all component CSS, and every consumer; introduce `--cascivo-brand-*` tokens.         |
| C   | Package namespace     | T3      | `@cascade-ui/*` → `@cascivo/*`: 24 `package.json`, all imports, tsconfig paths, **vite aliases**, 72 component `meta.dependencies`, exports. |
| D   | CLI / registry / ext. | T4      | CLI → `@cascivo/cli` (bin `cascivo`); registry raw URLs + `cascivo.com`; MCP server + base URLs; skills `cascivo:*`; external checklist.     |
| E   | Mobile — landing      | T5      | First-principles, mobile-first rebuild of every landing section + heavy-demo mobile treatments; real-device screenshot audit + verification. |
| F   | Mobile — docs         | T6      | Off-canvas nav, fluid type scale, responsive tables/code/charts, container-query sections; small-viewport AppShell pass.                     |
| G   | Receipts + launch     | T7      | Brand page + mobile showcase; OG/meta refresh; README/llms.txt rename; "Why cascivo" claims 25–27; external go-live checklist; DoD.          |

## Decisions baked in

1. **The name is `cascivo`; the rename is total.** `cascivo.com` is owned (`docs/BRAND.md`
   already recommended it). Every brand-bearing surface — packages, tokens, CLI, registry, MCP,
   domain, docs copy — moves to `cascivo`. No half-rename; no lingering `cascade-ui`.
2. **Name derivation is recorded.** `cascade-ui → cascivo`: drop the generic, collision-prone
   `-ui`; keep the `casc-` root (the CSS cascade, the token cascade primitive→semantic→component,
   the waterfall image); add the Romance agentive/adjectival suffix `-ivo` (as in _attivo_,
   _motivo_) — "active, alive, flowing." One coined, pronounceable word (/kas-ˈ(s)ee-vo/) with a
   free `.com`. BRAND.md states this.
3. **The CSS token prefix is renamed: `--cascivo-*` → `--cascivo-*`.** A full rename (113 CSS
   files + every component + every consumer), accepted as a deliberate breaking change while the
   project is pre-1.0. No `--cascivo-*` aliases are kept (rejected: a half-measure that dilutes the
   rebrand). A drift/grep gate proves zero `--cascivo-` survive.
4. **npm namespace: scoped `@cascivo/*` only.** All 15 publishable packages become `@cascivo/<name>`
   (`@cascivo/core`, `@cascivo/themes`, …), a 1:1 map of today's `@cascade-ui/*`. Requires the npm
   org `cascivo`. The CLI becomes `@cascivo/cli` with bin name `cascivo` — invoked as
   `npx @cascivo/cli init`. Reserving the unscoped `cascivo` package as an `npx cascivo` shorthand
   is **deferred** (optional courtesy redirect, not v15 scope).
5. **`data-theme` is unchanged.** The theming attribute is generic, not brand-bearing; renaming it
   would break every consumer's theme switch for no brand gain. Themes stay `data-theme="light|…"`.
6. **A brand color system, distinct from the neutral component themes.** The ten component themes
   stay neutral/utility. A separate **brand palette** — a cascade-blue → flow-teal identity — lives
   as `--cascivo-brand-*` semantic tokens, used by the landing hero, logo, and OG imagery only.
   Proposed anchors (oklch, contrast-checked in T1): primary `oklch(0.55 0.15 240)` (cascade blue),
   accent `oklch(0.72 0.13 195)` (flow teal), ink `oklch(0.22 0.03 250)`, plus a primary→accent
   gradient. Final values pinned in T1 against WCAG contrast on the surfaces they land on.
7. **A logo proposal, theme-aware SVG.** Mark: three descending, offset rounded bars (a
   cascade/waterfall) that also resolve into a "C"; it echoes the CSS cascade and the token
   cascade. Lowercase geometric-sans wordmark `cascivo`. Ships as SVG with `currentColor`/token
   fills so it adapts to theme and brand color. T1 specifies; assets land where the apps consume them.
8. **Mobile is first-principles and mobile-first, landing before docs.** Not a patch pass. T5/T6
   audit real viewports (320/375/390/414) with Playwright screenshots first, benchmark against
   sites that master responsive (Stripe, Linear, Vercel, Tailwind/Radix/shadcn docs, Apple),
   then rebuild each surface mobile-first. Verification is screenshots at every breakpoint with
   **zero horizontal overflow**, recorded in the PR.
9. **Heavy demos get mobile treatments, not a squish.** The `RelayConsole` dashboard, the chart
   demos, and the signals demo are designed for width. On mobile they get deliberate treatments
   (simplified mobile variant, scroll-snap carousel, or stacked single-column with a "view full"
   affordance) — chosen per demo in T5, never an unreadable shrink.
10. **Mobile nav obeys house rules.** The off-canvas drawer + hamburger use `useSignal` /
    `useSignalEffect` (no `useEffect`); the landing/React app calls `useSignals()`; the drawer is
    focus-trapped, closes on Escape/scrim/route-change, has ≥44px touch targets, and honors
    `env(safe-area-inset-*)`.
11. **No new runtime packages.** Brand tokens land in `@cascivo/tokens` + `@cascivo/themes`; the
    logo is an asset/SVG in the apps; mobile work is CSS + a handful of signal-driven layout tweaks
    in `apps/landing` and `apps/docs` (plus shared `@cascivo/layouts` breakpoints where reused).
12. **External steps are an out-of-code checklist.** npm org creation, `cascivo.com` DNS + hosting,
    and the GitHub repo rename (`urbanisierung/cascade-ui` → `urbanisierung/cascivo`, redirect-safe)
    are documented in T4/T7 as steps the human performs; the code is parameterized
    (`REGISTRY_BASE_URL`, base URLs) so it works the moment those flip.

## Definition of Done

- [ ] `docs/BRAND.md` documents the final name, the `cascade-ui → cascivo` derivation, the logo
      proposal (with an in-repo SVG or precise spec), and the brand color palette with rationale +
      contrast results. A logo asset exists and renders in the landing header/footer.
- [ ] Zero `--cascivo-` token references remain (grep gate); all tokens, themes, and component CSS
      use `--cascivo-`; `--cascivo-brand-*` tokens exist; all theme/parity/contrast tests pass.
- [ ] Zero `@cascade-ui/` references remain in source (grep gate); 24 packages are `@cascivo/*`;
      all imports, tsconfig paths, **all three app vite aliases** (docs/landing/storybook), and 72
      component `meta.dependencies` updated; build + type check + tests green.
- [ ] CLI is `@cascivo/cli` (bin `cascivo`); registry raw URLs + `REGISTRY_BASE_URL` point to the
      renamed repo; MCP server name + base URLs use `cascivo.com`; skills are `cascivo:*`;
      README/llms.txt/OG/meta carry the new name; `pnpm regen` produces no drift.
- [ ] The landing page renders with **zero horizontal overflow** and a world-class layout at
      320/375/390/414px (Playwright screenshots in the PR); the hero, nav, and every section are
      mobile-first; `RelayConsole`/chart/signals demos have explicit mobile treatments.
- [ ] The docs render with zero horizontal overflow at the same breakpoints; off-canvas nav with
      focus trap; fluid type; responsive tables/code/charts; small-viewport AppShell pass.
- [ ] A brand + mobile showcase exists; the "Why cascivo" surface states claims 25–27; the external
      go-live checklist (npm org, DNS, repo rename) is written and its code prerequisites are done.
- [ ] Full local CI gate exits 0: `vp check`, build, `vp run -r check`, tests, regen +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v15)

- **Unscoped `cascivo` npm package / `npx cascivo` shorthand** — `@cascivo/cli` (bin `cascivo`) is
  the v15 invocation; an unscoped redirect package is an optional later courtesy.
- **`--cascivo-*` back-compat aliases** — rejected; the rename is hard. Pre-1.0 breakage accepted.
- **Renaming the GitHub org** — only the repo is renamed (redirect-safe); the `urbanisierung` org
  stays.
- **A full marketing site** (blog, changelog microsite) — v15 ships the landing + docs, not a CMS.
- **Animated logo / brand motion system** — a static, theme-aware SVG is the v15 ceiling.
- **Native / React Native targets** — out of scope.
- **Per-component mobile redesign** — components are already responsive enough; v15 mobile work is
  the landing and docs _surfaces_, not a component-by-component overhaul.
  </content>
  </invoke>
