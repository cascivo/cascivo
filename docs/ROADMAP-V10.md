# cascade — Roadmap v10: Proof Pages

**Last updated:** 2026-06-12
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-12-v10-master-plan.md` + tranches 1–6

---

## Vision

cascade claims accessibility and performance; the landing page proves neither. v10 turns
claims into **proof pages**: a dedicated `/accessibility` page that shows — with live data,
not adjectives — how mature a11y is in the library, and a dedicated `/performance` page that
renders the bench suite's numbers (bundle, latency, re-renders, Lighthouse, axe) as cascade's
own charts. The home page absorbs the best persuasion patterns from chakra-ui.com and
bulma.io, and the component catalog grows by the highest-value gaps those two libraries
expose — starting with the components the new pages themselves need.

> Concept: **"Proof, not promises."** Chakra's landing page makes zero performance claims
> (it ships a CSS-in-JS runtime). Bulma's landing page quantifies nothing (tweets carry the
> message). cascade has a benchmark runner, axe suites, and machine-readable a11y metadata
> in every manifest — and shows none of it. v10 closes that gap: every number on the new
> pages is generated from `registry.json` or `apps/bench/results/results.json` at build
> time. No hand-written numbers, ever.

## What we learned from the competition

### chakra-ui.com

- Accessibility is the **second word** of their hero subheadline, and 2 of 4 testimonials
  repeat it — but v3 docs have **no per-component a11y sections** (no keyboard tables, no
  ARIA docs; delegated upstream to Ark/Zag). cascade's `component.meta.ts` accessibility
  block (role, WCAG level, keyboard) can out-document them with a generated matrix.
- Copyable install command directly in the hero — one less click to adoption.
- Stats band (downloads / stars / community) as social proof.
- **No performance story at all** on the landing page — cascade's strongest attack vector,
  backed by an actual cross-library benchmark (cascade vs shadcn vs Carbon).
- Ships Skip Nav and Visually Hidden as first-class components — a11y credibility through
  the catalog itself.

### bulma.io

- Show-don't-tell: interactive demos (grid widget, progressive `is-primary is-large
is-loading` modifier demo, dark-mode toggle) do the persuasion. cascade already has this
  DNA (Relay console, SignalsDemo, ThemeDemo) — v10 extends it to the proof pages.
- Hero feature chip list ("CSS Variables, Dark Mode, Flexbox, Modular…") — scannable
  modernity proof in one glance.
- 4-column value-prop band, each cell answering a buyer objection in two words.
- "No JavaScript required" as an integration story — cascade's analog is "no styling
  runtime, no re-render tax", and unlike Bulma we can put numbers on it.
- Per-page docs pattern: live example first, code below, **token/variable reference table
  at the bottom of every page** — cascade manifests already encode `tokens`; surfacing them
  is generation work, not authoring work (docs app already does this; noted for parity).

### Component gap analysis (Bulma elements + Chakra v3 catalog vs cascade's 60)

Worth building, in two batches:

- **Batch A — components the proof pages dogfood** (tranche 2): `copy-button` (Chakra
  Clipboard; the landing's `CopyCommand` is app-local today), `stat` (Chakra Stat / KPI
  display for the stats band), `status` (Chakra Status dot), `visually-hidden` +
  `skip-nav` (a11y credibility through the catalog, used by the a11y page itself),
  `progress-circle` (Chakra Progress Circle).
- **Batch B — typography/content set** (tranche 6): `heading`, `text`, `code` (inline),
  `blockquote`, `list`, `prose` (Bulma "content" — styles raw HTML you don't control).
  cascade currently has no typography category at all; both competitors do.
- **Queued to the factory backlog, not built in v10**: tree-view, color-picker, carousel,
  timeline, data-list, collapsible, code-block (syntax highlighting), splitter.
- **Deliberately skipped**: Marquee (slop), QR code (gimmick), Scroll Area (native CSS
  covers it), Drawer (cascade `sheet` exists), Pin Input (`otp-input` exists), Rating
  (`rating-group` exists), File Upload (`file-uploader` exists).

## The diagnosis

1. **The landing app is a single page with no room for depth.** Routing is a pathname check
   for `/og` only (`App.tsx:18`). A11y and performance each need a full page of evidence —
   they can't live in a home-page section.
2. **The performance data exists but is invisible.** `apps/bench` measures bundle size,
   interaction latency, re-render counts, Lighthouse, and axe violations across cascade /
   shadcn / Carbon — but `apps/bench/results/results.json` is a **placeholder** (`meta`
   only, "run pnpm bench to populate") and the only consumer is a table page buried in
   `/docs/benchmarks`. The bench must actually run, and the results deserve charts on the
   storefront, rendered with `@cascade-ui/charts` (dogfood).
3. **The a11y story is documented but unassembled.** Every one of the 106 registry entries
   carries `meta.accessibility` (role, WCAG level, keyboard keys); the landing and bench
   apps run axe (WCAG 2.1 AA) in CI; themes are contrast-audited; all CSS uses logical
   properties (RTL); all motion is reduced-motion-gated. No page tells this story.
4. **The hero undersells, the footer underdelivers.** No feature chips, no quantified
   stats band, footer is a flat link row. Chakra and Bulma both do better with cheap,
   well-understood patterns.
5. **The catalog has gaps both competitors fill.** No typography components at all; no
   copy-to-clipboard component (the landing hand-rolls one); no skip-nav/visually-hidden
   (table stakes for a system claiming a11y maturity).

## Workstreams

| #   | Workstream            | Tranche | Summary                                                                                                                                                          |
| --- | --------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Multi-page foundation | T1      | Pathname router + shared page chrome in the landing app; `/accessibility` + `/performance` routes; bench data module; run `pnpm bench` to populate real results. |
| B   | Components batch A    | T2      | `copy-button`, `stat`, `status`, `visually-hidden`, `skip-nav`, `progress-circle` — manifests, tests, i18n, react exports, registry regen.                       |
| C   | Accessibility page    | T3      | Hero claim + topline numbers, comparative axe chart, generated keyboard/ARIA matrix from registry.json, engineering-practices grid, CI-gate section.             |
| D   | Performance page      | T4      | Bundle / latency / re-render / Lighthouse charts from results.json via `@cascade-ui/charts`, per-component cost matrix, methodology + honesty section.           |
| E   | Home page upgrades    | T5      | Hero feature chips, stats band (registry + bench numbers), a11y + performance teaser sections, footer columns.                                                   |
| F   | Typography + backlog  | T6      | `heading`, `text`, `code`, `blockquote`, `list`, `prose`; queue 8 components to factory-backlog.json; final quality gates + DoD.                                 |

## Decisions baked in

1. **Every number is generated.** Pages import `registry.json` and
   `apps/bench/results/results.json` at build time. If a results section is absent
   (placeholder state), the dependent UI section hides — the page never renders fake or
   stale-labeled numbers. The bench meta block (date, CPU, throttle, source) is printed
   beside the charts.
2. **The bench actually runs in T1.** `pnpm bench` populates results.json on a dev machine;
   the committed JSON records its provenance in `meta`. Machine-specific numbers are fine —
   the methodology section discloses conditions, mirroring `apps/bench/METHODOLOGY.md`.
3. **Routing stays dependency-free.** The `/og` pathname pattern extends to a tiny route
   map (`/`, `/accessibility`, `/performance`, `/og`). No router library. The build copies
   `index.html` to `accessibility/index.html` and `performance/index.html` so static hosts
   serve deep links without rewrite rules.
4. **Proof pages dogfood the system.** Charts come from `@cascade-ui/charts` (including
   `plain` mode for micro charts), tables from `DataTable`, keys from `Kbd`, stats from the
   new `Stat`, copy affordances from the new `CopyButton`, and the a11y page itself uses
   `SkipNav` — the page about accessibility is built with the a11y components it announces.
5. **The a11y matrix is generated from manifests.** One section renders all registry
   entries' `meta.accessibility` as a filterable table (role, WCAG, keyboard keys as
   `Kbd`). This out-documents Chakra v3, whose per-component a11y docs regressed to
   upstream links.
6. **Comparative claims stay honest.** Axe and benchmark comparisons name pinned versions
   and disclose the axe ~57% detection ceiling; the Mann-Whitney parity note ships next to
   latency charts. We beat competitors with disclosed methodology, not cherry-picks.
7. **No testimonials.** Chakra and Bulma lean on social proof; cascade has no users yet.
   Faking it is off the table — the stats band quantifies what is real (components, gzip
   size, axe violations, re-render counts).
8. **New components follow every house rule**: signals-only reactivity, CSS-only visual
   states, i18n builtin catalog for chrome strings (`copyButton.copy/copied`,
   `skipNav.label`), logical properties, manifest + tests + react export + registry regen.
9. **Typography components are presentational.** No FSMs, no signals — they're styled
   elements (`Heading` renders `h1`–`h6` via `level`, `Prose` styles descendant HTML).
   The simplest components in the catalog; batch B is deliberately low-risk.
10. **Backlog, not scope creep.** Tree-view, color-picker, carousel, timeline, data-list,
    collapsible, code-block, splitter are specs in `factory-backlog.json` for the dark
    factory — not v10 tranches.

## Definition of Done

- [ ] `/accessibility` renders: topline stats (manifest coverage, axe violation count vs
      shadcn/Carbon), a comparative axe bar chart, a filterable keyboard/ARIA matrix
      generated from registry.json, an engineering-practices grid, and the CI-gate story —
      all numbers build-time generated.
- [ ] `/performance` renders: bundle-size comparison chart, per-component incremental cost
      table, interaction-latency charts (median + spread), re-render count comparison,
      Lighthouse stats, and a methodology section with the bench meta block — all from
      results.json, rendered with `@cascade-ui/charts`.
- [ ] `apps/bench/results/results.json` contains real populated results (bundle, runtime,
      renders, lighthouse, a11y) with provenance meta; the placeholder is gone.
- [ ] Six batch-A components (`copy-button`, `stat`, `status`, `visually-hidden`,
      `skip-nav`, `progress-circle`) ship with manifests, tests, i18n chrome strings,
      react exports, and registry entries; the proof pages use them.
- [ ] Six typography components (`heading`, `text`, `code`, `blockquote`, `list`, `prose`)
      ship the same way.
- [ ] Home page: hero feature chips, stats band with ≥4 generated numbers, a11y +
      performance teaser sections linking to the proof pages, footer with link columns.
- [ ] Header navigation reaches both new pages; deep links work in the deployed static
      build (`dist/accessibility/index.html` exists).
- [ ] All new pages pass axe (WCAG 2.1 AA) in the landing Playwright suite, in light and
      dark themes.
- [ ] `factory-backlog.json` gains 8 queued specs (tree-view, color-picker, carousel,
      timeline, data-list, collapsible, code-block, splitter).
- [ ] Full local CI gate exits 0: `vp check`, build, type check, tests, regeneration +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v10)

- Testimonials / showcase sections — revisit when real users exist.
- Sponsor/funding section (both competitors have one) — premature.
- Interactive "edit the tokens, watch the theme change" playground (Bulma grid-widget
  analog) — ThemeDemo covers the show-don't-tell slot; a full playground is its own
  roadmap.
- CI-automated bench refresh (running the full bench suite in GitHub Actions) — local
  populated results with provenance are enough for v10; CI variance needs its own design.
- Per-component a11y pages in the docs app (axe-per-component, screen-reader notes) — the
  landing matrix is the v10 scope; docs depth is a docs-roadmap item.
- The 8 backlog components — they're queued for the factory, not for v10 tranches.
- llms.txt / MCP surfacing of bench results — interesting AI-layer follow-up, not v10.
