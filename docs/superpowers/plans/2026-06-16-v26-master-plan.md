# v26 — Mobile Polish, Cross-App Navigation & Screenshot Pipeline — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Console section on mobile (burger menu + sidebar overlay), stabilise animated
container heights, repair five dead footer links, add real Playwright screenshot automation, wire
view transitions between landing pages, and connect the three cascivo apps via a Storybook welcome
page, per-component Storybook links in docs, and a dark-default docs theme.

**Architecture:** All changes span three apps — `apps/landing` (React 18 + signals + CSS modules),
`apps/docs` (Preact + signals), and `apps/storybook` (Storybook 8, MDX + React stories) — plus
the `scripts/` directory. No library package (`packages/`) changes. The landing uses
`useSignal`/`useSignalEffect` from `@cascivo/core`; no `useState`/`useEffect`. CSS changes stay
within each app's existing CSS file.

**Tech Stack:** `@cascivo/core` (useSignal, useSignals, useSignalEffect), `@cascivo/components/side-nav`,
`@cascivo/charts` (BarChart), React 18, Preact, Storybook 8, Playwright, CSS custom properties,
`@view-transition` CSS at-rule, Vite + vite+.

---

## Tranche Overview

| Tranche | Title | Goal |
|---|---|---|
| T1 | Console mobile: burger + overlay sidebar | Add hamburger button; SideNav overlay on mobile |
| T2 | Layout stability: heights, bar chart, QuickStart | Three CSS/layout fixes for shifting content |
| T3 | View transitions | Cross-document CSS fade between landing pages |
| T4 | Footer fixes + static files | Fix /why, llms.txt, registry.json, Methodology, MCP |
| T5 | Screenshot pipeline | Playwright real captures; CI integration |
| T6 | Storybook welcome + docs links + dark theme + gate | Introduction.mdx; story links; dark default; final gate |

---

## Files Created / Modified per Tranche

### T1 — Console mobile

| Action | Path |
|---|---|
| Modify | `apps/landing/src/demo/RelayConsole.tsx` |
| Modify | `apps/landing/src/landing.css` |

### T2 — Layout stability

| Action | Path |
|---|---|
| Modify | `apps/landing/src/landing.css` |
| Modify | `apps/landing/src/sections/ProofTeasers.tsx` |

### T3 — View transitions

| Action | Path |
|---|---|
| Modify | `apps/landing/src/landing.css` |
| Modify | `apps/landing/index.html` |

### T4 — Footer fixes + static files

| Action | Path |
|---|---|
| Modify | `apps/landing/src/sections/Footer.tsx` |
| Create | `apps/landing/public/llms.txt` |
| Modify | `apps/landing/vite.config.ts` (or `package.json`) to copy `registry.json` into `public/` |

### T5 — Screenshot pipeline

| Action | Path |
|---|---|
| Modify | `scripts/gen-demo-screenshots.mjs` |
| Modify | `apps/landing/package.json` (`screenshots:capture` alias) |
| Create | `.github/workflows/screenshots.yml` (or annotation in existing CI) |

### T6 — Storybook + docs + gate

| Action | Path |
|---|---|
| Create | `apps/storybook/stories/Introduction.mdx` |
| Modify | `apps/storybook/.storybook/main.ts` (ensure MDX is enabled) |
| Modify | `apps/docs/src/theme.ts` (default `'dark'`) |
| Modify | `apps/docs/src/pages/ComponentPage.tsx` (Storybook link) |
| Modify | Multiple `apps/storybook/stories/*.stories.tsx` (add `Primary` export where missing) |

---

## Dependency Graph

```
T1 (console mobile) ──────────────────────────────────────────► T6 (gate)
T2 (layout stability) ────────────────────────────────────────► T6
T3 (view transitions) ────────────────────────────────────────► T6
T4 (footer + static) ─────────────────────────────────────────► T6
T5 (screenshots) ─────────────────────────────────────────────► T6
```

T1–T5 are independent and can execute in any order or in parallel. T6 runs last and includes
the final gate check across all changes.

---

## Key Technical Decisions

### Console mobile overlay (T1)

The `SideNav` inside `RelayConsole` renders as a grid column that disappears at `max-width: 56rem`
(the current CSS collapse point). The fix uses CSS scoping:

```css
/* Inside .console-frame on mobile: SideNav becomes a fixed overlay */
@media (max-width: 47.99rem) {
  .console-frame {
    position: relative;
    overflow: hidden;
  }
  .console-frame [class^="side-nav"] {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    z-index: 20;
    transform: translateX(-100%);
    transition: transform 250ms ease;
  }
  .console-frame.sidebar-open [class^="side-nav"] {
    transform: translateX(0);
  }
}
```

A `sidebarOpen` signal in `RelayConsole` drives `.sidebar-open` on `.console-frame`. The
hamburger button is the leftmost element in `.console-titlebar`. A scrim `div` behind the
SideNav closes it on tap.

### Bar chart label space (T2)

The `BarChart` component accepts a `yLabelWidth` prop (pixels reserved for the label column).
The current usage in `ProofTeasers.tsx` does not set it, letting the chart auto-size — which
clips "cascivo" on narrow containers. Fix: pass `yLabelWidth={72}` (enough for the longest
label at the component's default font size).

If `BarChart` has no such prop, wrap the chart in a container with `overflow: visible` and
`padding-inline-start: 5rem` as a fallback.

### Fixed height for animated sections (T2)

`ExamplesGallery` carousel info block: descriptions vary from ~40 to ~80 words. Fix: add
`min-block-size: 8rem` to `.examples-carousel-info` in `landing.css`. The actual tallest
description determines the floor; measure across all five demos.

`ThemeDemo` card container: all ten themes render the same `SignupCard` markup, so height
variation is theme-driven (token sizes, border radius). Fix: set `min-block-size` equal to the
tallest observed card height across all themes.

### View transitions (T3)

The landing prerender produces static HTML pages. Navigation between them is a full browser
navigation (not client-side pushState). The CSS cross-document API handles this:

```css
@view-transition {
  navigation: auto;
}
```

Plus `<meta name="view-transition" content="same-origin">` in `index.html`. The browser
cross-fades `::view-transition-old(root)` and `::view-transition-new(root)`. Named elements
(header, main) can get explicit `view-transition-name` values for element-level morphing.

### registry.json in public (T4)

Root `registry.json` must be available at `/registry.json` on the landing domain. Simplest:
add a Vite plugin (one-liner in `vite.config.ts`) that copies the file during the build:

```ts
// vite.config.ts
import { copyFileSync } from 'node:fs'
// In plugins:
{
  name: 'copy-registry',
  buildStart() { copyFileSync('../../registry.json', 'public/registry.json') },
  buildEnd()   { copyFileSync('../../registry.json', 'public/registry.json') },
}
```

Or simpler: a `prebuild` npm script: `"prebuild": "cp ../../registry.json public/registry.json"`.

### llms.txt (T4)

The file follows the llmstxt.org spec — a Markdown document with an H1 title, a brief
description, and a list of canonical resource URLs:

```
# cascivo

CSS-native, signal-driven, AI-first React design system.

## Links

- [Landing](https://cascivo.com): Marketing and live demos
- [Docs](https://docs.cascivo.com): Component reference and API
- [Storybook](https://storybook.cascivo.com): Interactive component explorer
- [Registry](https://cascivo.com/registry.json): Machine-readable component manifest
- [GitHub](https://github.com/urbanisierung/cascivo): Source code
- [MCP server](https://github.com/urbanisierung/cascivo/tree/main/packages/mcp): AI integration
```

### Storybook URL pattern (T6)

Pattern: `https://storybook.cascivo.com/?path=/story/${category}-${name.toLowerCase()}--primary`

Where `category` comes from `entry.category` in `registry.json` (e.g., `inputs`, `display`,
`overlay`, `navigation`) and `name` is `meta.name` lowercased (e.g., `button`, `alert`, `modal`).

Prerequisite: all component story files must export `Primary` as a named story. Audit is part
of T6. Any story without `Primary` gets one added (typically `export const Primary: Story = {}`
forwarding to whatever the existing canonical variant is).

---

## Conventions to follow in every tranche

1. **Signals over hooks.** `useSignal`, `useComputed`, `useSignalEffect` only. No `useState`,
   `useEffect`, `useContext`, `useReducer`.
2. **`useSignals()` first line** in every React component that reads `.value` during render.
3. **Token-only CSS.** No hardcoded colour hex or raw pixel sizes. Use `var(--cascivo-*)`.
4. **Mobile-first.** Base styles for 320 px; enhancements at `min-width: 30rem / 40rem / 64rem`.
   `pnpm breakpoint:check` must exit 0.
5. **No class-name conflicts.** Console mobile CSS must be scoped under `.console-frame` to
   avoid affecting other `SideNav` usages on the landing or in docs.
6. **Commit after each tranche.** Gate commands must all exit 0 before the commit.

---

## Gate Commands (run before each commit)

```sh
pnpm exec vp check           # fmt + lint + tsc
pnpm build                   # build all packages
pnpm exec vp run -r check    # type-check all packages
pnpm test                    # unit + smoke tests
pnpm regen && pnpm exec vp check --fix && git diff --exit-code
pnpm breakpoint:check
```
