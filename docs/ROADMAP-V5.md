# cascade — Roadmap v5: Outstanding by Design

**Last updated:** 2026-06-11
**Status:** Planning — `docs/ROADMAP-V4.md` is complete (UI Shell family shipped)
**Plan documents:** `docs/superpowers/plans/2026-06-11-v5-master-plan.md` + tranches 1–6

---

## Vision

v4 made cascade console-capable. v5 makes it **look the part** — and fixes every rough edge a
first-time visitor hits in Storybook, the docs, and the landing page.

> A designer opening cascade next to shadcn/ui, Linear, or Vercel's Geist must not be able to
> tell which one had a smaller team. The defaults must read as deliberate, dense, and quiet —
> not "AI generated".

Research basis (2026-06-11): shadcn/ui new-york (Tailwind v4 era), Linear's token scrape,
Vercel Geist materials/colors, Radix Themes radius system, IBM Carbon v11 tiles/notifications,
Untitled UI focus rings. Full findings are embedded in the master plan.

## The diagnosis

What makes the current design read as "standard / AI generated":

1. **Too round.** Light theme radius base is 10px with 16px cards. The 2026 dev-tool look is
   4–6px controls, ≤10px cards (shadcn base 10px *but* 6px sm-controls; Linear 2–6px; Geist 6px).
2. **The thick left border.** Seven components mark active/emphasis with a 2–3px
   `border-inline-start` (Alert, Toast, SideNav, Switcher, ShellHeader ×3). It's Carbon's 2018
   signature and the single most recognizable "design-system default" cliché. Modern systems use
   background tint + weight (nav), underline indicators (tabs/headers), and full hairline borders
   with tinted icon/title (alerts).
3. **A colorful blue accent doing every job.** shadcn/Linear/Geist use a near-black monochrome
   primary; color is rationed to semantic states and focus.
4. **Default shadow soup.** Shadows on everything instead of: flat surfaces, hairline borders,
   one soft large shadow for floating layers only.
5. **Dark mode solid-gray borders.** The modern move is white-at-low-alpha hairlines
   (`oklch(1 0 0 / 10%)`).

## Workstreams

| # | Workstream | Tranche | Summary |
|---|-----------|---------|---------|
| A | Design language "sharp & quiet" | T1 | Radius retune (6px controls), primary/accent split (monochrome primary), alpha hairline dark borders, shadow rationing, focus halo. Theme files + tokens only. |
| B | Active-state redesign | T2 | Kill the left-border pattern in all 7 components. Alert/Toast → full hairline + tinted icon/title. SideNav/Switcher → bg-tint pill + font-medium. ShellHeader nav → bottom underline (it's a *horizontal* nav — a left border there was always wrong). |
| C | Component capabilities | T3 | InputGroup v2: inline icon adornments (`InputGroupAddon align="inline-start|inline-end"`, shadcn-style composition). Selectable cards: `RadioCardGroup`/`RadioCard` + `CheckboxCard` with hidden native inputs and always-visible control glyph (Carbon v11 guidance). |
| D | Storybook overhaul | T4 | Theme switcher via `@storybook/addon-themes` (`withThemeByDataAttribute`, `parentSelector: 'html'` so top-layer popovers are themed too). Centered layout with realistic widths. Category grouping for all ~63 stories (same taxonomy as docs). 16 chart stories. |
| E | Docs + landing | T5 | Docs app dogfoods the v4 shell (ShellHeader + AppShell + SideNav) instead of its custom sidebar. Shared category grouping. Landing: curated showcase instead of the stale hardcoded "All 20 components" grid. |
| — | Integration sweep + DoD | T6 | Visual baseline regeneration (95×3 snapshots) with human-eye review, drift gates, CLAUDE.md compliance audit, this roadmap's DoD checklist. |

## Decisions baked in

1. **Radius is a one-knob system** (shadcn/Radix model): semantic radius tokens derive from
   `--cascade-radius-base` with multipliers; themes only retune the base. Light/dark base drops
   10px → 6px. Warm stays the deliberately-rounder theme. Flat stays 0. Minimal stays soft.
2. **`--cascade-color-primary` is a new semantic token** (button fills, primary actions):
   near-black in light, near-white in dark, warm-accent in warm. `--cascade-color-accent` keeps
   focus rings, links, info, and active-state tinting. No component re-API — Button's CSS remaps.
3. **No left borders for state.** `border-inline-start` may only be structural (dividers).
4. **Top-layer theming**: theme `data-theme` must live on `<html>` everywhere (docs already does
   this; Storybook gets it via addon-themes `parentSelector`) because Popover-API elements escape
   any wrapper.
5. **One grouping taxonomy** for Storybook + docs + landing, derived from registry
   `meta.category`: Inputs, Display, Overlay, Navigation, Feedback (+ Charts, Blocks in Storybook).
6. **Landing is curated, docs are complete.** "Don't include all components" resolves as: landing
   shows ~12 hand-picked representative tiles + a "95+ components" stat; docs remain the full
   grouped reference (that's their job). If the intent was to also curate docs, that's a one-file
   filter (`apps/docs/src/data.ts`) noted in T5.
7. **Visual snapshots are an output, not a gate, during T1–T2**: the redesign intentionally
   changes all 285 baselines; they are regenerated once in T6 after the design settles, with
   human review.

## Definition of Done

- [ ] Light theme: controls render at 6px radius, cards ≤ 10px; side-by-side with shadcn/ui
      new-york the density and sharpness are comparable.
- [ ] `grep -rn "border-inline-start" packages/components/src/**/*.module.css` shows only
      1px structural dividers — zero 2–3px state indicators.
- [ ] Button primary is monochrome in light/dark themes; focus ring is a soft 3px halo with
      ≥3:1 contrast against adjacent surface.
- [ ] Dark theme borders are alpha hairlines.
- [ ] `<InputGroup><InputGroupAddon><Search/></InputGroupAddon><Input/></InputGroup>` renders a
      leading icon *inside* the field border; trailing variant works; focus ring sits on the group.
- [ ] `RadioCardGroup` (single) and `CheckboxCard` (multi) ship with hidden native inputs,
      arrow-key/Space keyboard support, visible control glyph, registry + stories + docs entries.
- [ ] Storybook: toolbar theme switcher works for all five themes including popover/menu
      stories; default layout is centered with realistic widths; sidebar shows
      Inputs/Display/Overlay/Navigation/Feedback/Shell/Charts/Blocks groups; 16 chart stories exist.
- [ ] Docs app shell is built from ShellHeader + AppShell + SideNav (the library's own
      components); sidebar grouping matches Storybook.
- [ ] Landing no longer claims "All 20 components"; shows curated tiles + real registry count.
- [ ] All 285 visual baselines regenerated and human-reviewed; full local CI gate exits 0.

## Deferred (do not re-litigate in v5)

- Storybook "side-by-side" theme view (was a custom toolbar item; addon-themes doesn't support
  it — re-add later as a dedicated ThemeGallery story/decorator if missed).
- Landing migration to Preact (stays native React).
- New chart types or chart redesign (only *stories* for existing 16 charts are in scope).
- Docs live demos for the ~70 components that show "No live preview" (separate effort).
