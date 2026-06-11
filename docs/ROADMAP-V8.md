# cascade — Roadmap v8: Assembly Included

**Last updated:** 2026-06-11
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-11-v8-master-plan.md` + tranches 1–6

---

## Vision

cascade ships 97 registry entries, and every one of them is a _part_. Users still hand-assemble
every page from scratch. v8 ships **ready-to-use composition, out of the box**:

1. **Section layouts** — a new `section/` registry family: hero (centered + split), feature
   grid, CTA banner, masonry media gallery, stats band, page footer. Copy-pasted like blocks,
   built on plain CSS — static slot components with zero state, zero signals, zero JS layout.
2. **Layout primitives to carry them** — `Masonry` (native CSS masonry where supported,
   CSS-columns fallback, no JS measurement) and `AutoGrid` (`auto-fill`/`minmax()` responsive
   grid with no media queries).
3. **Plain charts** — a `plain` mode on every chart that renders chrome: no axes, no grid
   lines, no legend, collapsed margins, small default height. Any chart becomes a micro chart
   that drops into a table cell, a KPI card, a list row — anywhere.
4. **A docs surface that shows all of it** — today the 11 layouts and 10 blocks that already
   exist are _invisible_ (the docs nav only renders the five component categories). v8 ships
   the `/layouts` gallery v7 deferred.

> Concept: **"Assembly included."** A user should get from `npx cascade init` to a credible
> marketing page or dashboard shell in minutes — by copying sections they own, not by
> reinventing hero CSS for the hundredth time. And every chart should shrink to 120×32
> without ceremony.

## The diagnosis

1. **Layouts exist, but only for apps.** `packages/layouts` has app-shell, dashboard,
   auth and settings scaffolding plus 10 app blocks. There is nothing for content or
   marketing pages — no hero, no feature grid, no gallery, no footer.
2. **No masonry, no auto-responsive grid.** `Grid` is a 12-column span grid; the two most
   requested content layouts (masonry, "cards that wrap to fit") have no primitive.
3. **The whole layouts family is invisible.** `apps/docs` nav is built from the five
   component categories only; `layout/*` and `block/*` entries never appear, and there is no
   gallery page. v7 explicitly deferred this ("Blocks gallery page — v8 candidate").
4. **Charts are all-or-nothing.** Every cartesian chart hardwires axes + grid lines (and
   defaults to a legend and 300px height). Only Sparkline, Meter and Kpi are usable inline.
   You cannot drop an `AreaChart` into a DataTable cell today.
5. **The registry is already shaped for this.** `scripts/registry/generate.ts` scans typed
   source roots (`component`/`layout`/`block`/`chart`) and the CLI strips prefixes on `add` —
   adding a `section/` family is an extension, not a rework.

## Workstreams

| #   | Workstream             | Tranche | Summary                                                                                                                                                             |
| --- | ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Plain charts           | T1      | `plain` prop on every chrome-bearing chart in `@cascade-ui/charts`: no axes/grid/legend, collapsed margins, small default height, a11y preserved; micro-chart docs. |
| B   | Layout primitives      | T2      | `Masonry` (dual `@supports` native masonry + CSS-columns fallback) and `AutoGrid` (`auto-fill`/`minmax(min(…,100%),1fr)`), tests + manifests.                       |
| C   | Section concept + hero | T3      | New `section/` registry type wired through generate.ts/CLI/MCP; `Section` wrapper primitive; `Hero` (centered + split variants) and `Cta` sections.                 |
| D   | Sections wave 2        | T4      | `FeatureGrid`, `MediaMasonry`, `StatsBand` (dogfoods plain charts), `PageFooter` — all static, plain CSS, props-driven content.                                     |
| E   | Docs gallery           | T5      | `/layouts` gallery page (primitives, sections, blocks — live previews + copy-paste commands), docs nav entry, Storybook stories for new entries.                    |
| F   | Quality gates          | T6      | Docs Playwright smoke + axe (light/dark) for the gallery, RTL spot check, masonry fallback verification, regeneration/drift, DoD walkthrough.                       |

## Decisions baked in

1. **Sections are a first-class registry type.** `packages/layouts/src/sections/` →
   `section/<name>` entries, copy-paste distributed like layouts/blocks (not published to
   npm). The generator's typed-roots design extends; the CLI's prefix stripping already
   handles it.
2. **Sections are static.** Zero state, zero signals, zero machines, zero effects. Slots and
   props in, markup and CSS out. If a section seems to need state, it's a block, not a
   section.
3. **All copy via props with demo defaults.** Sections follow the existing block convention
   (placeholder content the user replaces), not the i18n builtin-catalog rule — sections are
   content scaffolding, not component chrome. Heading levels are configurable
   (`headingLevel` prop) so pages keep a sane outline.
4. **Masonry is CSS-only.** Native masonry via dual `@supports` (both the
   `display: masonry` and `grid-template-rows: masonry` syntaxes — re-verify current browser
   reality at implementation), universal fallback via CSS multi-columns. The column-order
   caveat is documented, not papered over with JS measurement.
5. **AutoGrid uses zero media queries.**
   `repeat(auto-fill, minmax(min(var(--_min, 16rem), 100%), 1fr))` — intrinsically
   responsive, container-friendly, RTL-free by construction.
6. **`plain` is a prop, not a fork.** One boolean per chart component; plain mode removes
   Axis/GridLines/Legend, collapses margins to a hairline pad, defaults height to 48, and
   sets `data-plain` for CSS hooks. The SVG keeps its `role="img"`/title/desc and the table
   fallback — minimal is not inaccessible.
7. **Sparkline, Meter and Kpi don't change.** They are the already-plain reference
   implementations; no `plain` prop noise on components with no chrome to remove.
8. **Plain charts ship via npm**, not copy-paste — they're a feature of
   `@cascade-ui/charts` (the registry's `install` pathway). Chart manifests regenerate to
   document the new prop.
9. **The gallery shows, it doesn't tell.** `/layouts` renders live previews (real
   components, fixture content) grouped Primitives / Sections / Blocks, each with its
   `npx cascade add <name>` command. No screenshots, no descriptions-only rows.
10. **v5 design language and the anti-slop rules bind sections.** Tokens only, hairlines,
    quiet shadows, no gradients, no glassmorphism, CSS logical properties throughout. A hero
    section that ships slop multiplies slop into every user project.

## Definition of Done

- [ ] `npx cascade add section/hero` copies `hero.tsx` + `hero.module.css` into a user
      project; `cascade list` shows all six sections; MCP `list_components` returns them.
- [ ] `registry.json` has ≥105 entries (97 + 2 primitives + 6 sections); drift gate green.
- [ ] All six sections contain zero `useState`/`useSignal`/`useMachine`/`useSignalEffect`
      imports (grep-verified) — static slot components only.
- [ ] `Masonry` renders native masonry in supporting browsers and the columns fallback
      elsewhere; both paths verified (force the fallback by disabling the `@supports`
      blocks); order caveat documented in the manifest description.
- [ ] Every chrome-bearing chart accepts `plain`; plain renders zero axis/grid-line/legend
      DOM nodes (test-asserted per chart) and works at 120×32 inside a DataTable cell —
      demonstrated live on the docs Charts page ("Micro charts" section).
- [ ] Docs `/layouts` gallery renders live previews of all primitives, sections and blocks
      with copy-paste commands; linked from the docs nav; axe zero violations in light AND
      dark.
- [ ] Sections render correctly under `dir="rtl"` (logical properties only — no
      `left`/`right` physical properties in new CSS, grep-verified).
- [ ] Storybook stories exist for both new primitives, all six sections, and a plain-charts
      story.
- [ ] `@cascade-ui/charts` bundle stays within its 80KB gz budget after the plain-mode
      changes.
- [ ] Full local CI gate exits 0: `vp check`, build, type check, tests, regeneration +
      `git diff --exit-code`.

## Deferred (do not re-litigate in v8)

- Pricing and testimonial sections — testimonial sections are in anti-slop tension; pricing
  needs design exploration. Revisit with real demand.
- Full page _templates_ (entire landing/marketing page compositions) — sections compose into
  these; templates are a v9 candidate once sections prove out.
- Landing-page adoption of `section/hero` — only after v7 ships; don't couple the tranches.
- CascadeView (`@cascade-ui/render`) schema support for sections — needs schema versioning
  thought; sections work today via copy-paste.
- JS-measured row-major masonry fallback — violates the plain-CSS thesis; wait for native
  support to widen instead.
- Animated/scroll-triggered section variants — motion design is its own effort and must
  clear `prefers-reduced-motion` rules.
- Chart tooltips/hover layers in plain mode beyond what exists — audit only; no new
  interaction work in v8.
