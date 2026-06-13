# cascade — Roadmap v7: The Console Is the Homepage

**Last updated:** 2026-06-11
**Status:** 📋 Planned
**Plan documents:** `docs/superpowers/plans/2026-06-11-v7-master-plan.md` + tranches 1–5

---

## Vision

The landing page must do what ui.shadcn.com does — make visitors _feel_ the quality in the
first two seconds — without copying it. shadcn's homepage is a dense, realistic finance
dashboard built from its own components, ~40 words of marketing copy, one CTA. Our equivalent
is **a live ops console rendered by cascade, where the page itself demonstrates the three
things only cascade can do**:

1. **Theme any region live** — five themes, `data-theme` on any element, switched in the hero.
2. **Count the re-renders** — a live Profiler counter on the page, honest integers, not claims.
3. **Talk to agents through artifacts** — the real `component.meta.ts`, a copyable MCP install,
   JSON rendered to UI by CascadeView, `/llms.txt` in the footer.

> Concept: **"The console is the homepage."** Show one excellent, realistic product surface
> composed from 25+ cascade components — then let the visitor switch its themes, watch its
> commit counter, and read the manifest that lets an agent rebuild it. Don't tell. Render.

Research basis (2026-06-11): shadcn homepage teardown (hero = 3 lines + demo wall with
cents-precision finance data, zero marketing sections, "Open Source. Open Code." voice, CTA
"Build Your Own"); Evil Martians' 100-devtool-landing study (live product embed > screenshots;
function lists are the weakest storytelling); Mantine/Chakra/Stripe AI-section conventions
(credible = clickable artifacts, cringe = adjectives); AI-slop literature (Inter + purple
gradients + glassmorphism + testimonial carousels = instant disqualification). Full findings
in the master plan.

## The diagnosis

The current landing is _correct_ but not _felt_:

1. **It tells.** "Six reasons to switch" is a feature-card wall — the weakest pattern in the
   Evil Martians study. shadcn ships zero feature cards.
2. **The component grid shows parts, not products.** 12 isolated tiles prove we have buttons;
   they don't prove buttons compose into software. Visitors evaluate composition quality.
3. **The hero leads with a competitor's name** ("ships like _shadcn_") — derivative framing
   for a page whose job is to establish identity.
4. **The AI story is a sentence, not an artifact.** We genuinely have manifests, MCP, skills,
   llms.txt, CascadeView — none are clickable/copyable on the page. Mantine puts its AI section
   first; we bury ours in a feature card.
5. **The signals story is an adjective.** "Zero unnecessary re-renders" with nothing counted.
   We can put a live counter on the page (and v6 benchmark numbers when they land).
6. **Zero brand hygiene.** No favicon, no OG image, no meta description strategy — a link
   shared in Slack/X renders as a naked URL.
7. **What already works stays.** Theme demo ("five personalities"), QuickStart, dynamic
   registry count, full dogfooding, zero webfonts — these survive into v7.

## Workstreams

| #   | Workstream             | Tranche | Summary                                                                                                                                                                                                                                                                                       |
| --- | ---------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Shell, hero, brand     | T1      | Slim sticky header (dogfooded ShellHeader: Docs/Storybook/GitHub + 5-theme switcher), new hero copy ("Native to the web. Fluent in agent."), copyable install command, principles strip replacing the six feature cards, footer with llms.txt/registry.json links, favicon + OG image + meta. |
| B   | Demo wall              | T2      | "Relay" deploy-ops console: AppShell/SideNav/ShellHeader frame, KPI cards, area chart + sparklines, deploys DataTable, incident Alert, feature-flag Switch card, deploy Modal + Toast — realistic fixture data, one warm-scoped card proving per-region theming. Replaces ComponentGrid.      |
| C   | Signals proof          | T3      | "Count the re-renders" section: cascade input/form vs useState twin, live Profiler commit counters, honest microcopy; conditional benchmark teaser reading v6 `results.json` when present.                                                                                                    |
| D   | Agent layer            | T4      | "Your agent already knows cascade": real Button `component.meta.ts` excerpt, MCP install tabs (Claude Code/Cursor/VS Code) with copy buttons, example agent prompt, CascadeView JSON→UI demo retargeted to a slice of the Relay console.                                                      |
| E   | Quality gates + polish | T5      | Landing Playwright suite (smoke + axe zero violations), Lighthouse pass, prefers-reduced-motion audit, responsive pass, screenshot-driven design review loop, copy edit, DoD verification.                                                                                                    |

## Decisions baked in

1. **Show one product, not twenty parts.** The Relay console replaces the 12-tile grid. A
   small "97+ components in the docs" link (dynamic count) replaces enumeration.
2. **Realism is the quality signal.** Fixture data has real-looking SHAs, durations, error
   rates, masked tokens, microcopy that adds up. Zero lorem ipsum, zero "Item 1".
3. **Hero copy:** H1 "Native to the web. Fluent in agent." Sub names CSS-native, signals,
   manifests in one sentence. No competitor names above the fold. CTAs: "Start building"
   (docs) + GitHub; copyable `npx cascade add button` beneath.
4. **Feature cards die.** Replaced by a four-item principles strip (one line each: Platform
   CSS / Signals, counted / Owned code / Agent-ready) — each line links to the section that
   _demonstrates_ it.
5. **The theme switcher is the hero interaction.** All five themes (not three), defaulting to
   `prefers-color-scheme`; the demo wall re-skins live; one card stays warm-scoped to prove
   `data-theme` works on any element.
6. **AI claims must be clickable or copyable within one viewport.** Manifest code is real
   (imported from the repo, not retyped), MCP commands are real, llms.txt/registry.json are
   linked. Forbidden: "AI-powered", sparkle emoji, unverifiable claims ("zero hallucinations").
7. **No testimonials, no logos, no stats we don't have.** Absence beats weak proof (shadcn
   model). GitHub link carries the social weight.
8. **Anti-slop constraints are hard rules**: no gradients, no glassmorphism, no emoji bullets,
   no icon-grid features, system font stack stays (zero webfonts — the performance _is_ the
   brand), mono accents via `--cascivo-font-mono` for eyebrows/labels/numbers.
9. **The page is the benchmark.** Landing keeps dogfooding cascade exclusively; served CSS
   shows `@layer`/`:has()`/`@container` to anyone who opens DevTools; motion is CSS-only and
   honors `prefers-reduced-motion`.
10. **v5 design language is law.** Tokens only, no new colors, 6px controls, hairlines, quiet
    shadows. v7 changes composition and content, not the design system.

## Definition of Done

- [ ] Above the fold: header (nav + 5-theme switcher), H1/sub per decision 3, both CTAs, the
      copyable install command, and the top of the live Relay console — at 1440×900 and 390×844.
- [ ] Relay console renders ≥25 distinct cascade components (counted by import list) with
      realistic fixture data; zero placeholder text; interactions work (sortable table, modal,
      toast, switches, tabs).
- [ ] Theme switcher cycles all five themes on `<html>` (View Transitions where supported);
      default follows `prefers-color-scheme`; the scoped warm card stays warm in every theme.
- [ ] Re-render counter section shows live commit counts for cascade vs useState twin; numbers
      update as the visitor types; microcopy explains the measurement honestly (dev-tools
      verifiable).
- [ ] Agent section: Button manifest excerpt imported from `packages/components`, MCP install
      tabs with working copy buttons, one example prompt, CascadeView demo rendering a Relay
      slice from visible JSON; footer links llms.txt + registry.json + BENCHMARKS (docs page).
- [ ] `index.html` ships real title/description, favicon (SVG), OG/Twitter card image
      (1200×630, generated from a `/og` route screenshot, committed).
- [ ] Landing Playwright suite green: smoke (sections render, console interactive) + axe sweep
      zero violations in light AND dark.
- [ ] Lighthouse (local, preview build): Performance ≥ 95, Accessibility = 100, CLS = 0;
      no webfonts; JS budget noted in the plan respected.
- [ ] `prefers-reduced-motion: reduce` disables the hero carousel/auto-cycling and all
      nonessential animation (manually verified + one Playwright check).
- [ ] Slop checklist pass: no gradients, glassmorphism, emoji bullets, testimonials, fake
      logos, or unverifiable claims anywhere on the page.
- [ ] Full local CI gate exits 0; landing deploys via existing cf-pages workflow unchanged.

## Deferred (do not re-litigate in v7)

- Blocks gallery page (`/blocks`-style) — needs block registry entries first; v8 candidate.
- Interactive theme _builder_ on landing (shadcn `/create`-style customizer) — big; the
  `cascade:create-theme` skill covers the workflow for now.
- "Open in playground" per demo region (depends on docs playground deep-linking).
- Benchmark headline numbers hard-wired into the hero — only the conditional teaser ships in
  v7; promote after v6 numbers are public and stable.
- Landing localization/RTL showcase section.
- Custom display webfont — revisit only with a measured LCP budget and a real brand reason.
