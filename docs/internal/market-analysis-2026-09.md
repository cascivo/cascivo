# cascivo against the market: a deep analysis (2026-09-24)

This document has three parts:

- A research pass over the UI component-library market, the design-with-AI market, and the ecosystems next to them. It covers charts, email, grids, editors, icons, tokens, docs tooling and enterprise requirements.
- An audit of what cascivo actually ships (registry v1.3.1).
- An evaluation of where cascivo leads and where it lags, plus a ranked list of what to fix. That includes the presentation.

**How the evidence was collected**

| Source | Detail |
|---|---|
| npm weekly downloads | `api.npmjs.org`, week of 2026-09-15 to 2026-09-21 |
| Versions and licenses | `registry.npmjs.org` |
| GitHub stars | GitHub API |
| Bundle sizes | bundlephobia (whole-package, before tree-shaking) |
| News | vendor blogs, changelogs, InfoQ, TechCrunch |
| cascivo facts | read from this repository at `claude/loving-fermi-t9fwt2` |

Claims marked **[unverified]** had only one source, or the sources disagreed.

> **A warning on download numbers.** Between 2025 and 2026, npm downloads across the UI space rose 4–18×. Tailwind rose about 4×, `@radix-ui/react-dialog` about 4×, and the `shadcn` CLI about 18×. Much of that is AI-agent sandboxes and CI running fresh installs. Read downloads as relative signals, not as counts of users.

---

## 0. Executive summary

**The market in one paragraph.** shadcn/ui is the centre of gravity. It has about 124.5k stars and the CLI gets 6.7M downloads a week. In July 2026 it switched its default primitives from Radix to Base UI, added React Aria as an option, and grew into a distribution platform: registries, a directory, MCP, skills, presets, `shadcn create`, and private GitHub registries.

The headless layer has consolidated around three players:

- **Base UI** (MUI): reached 1.0 in February 2026.
- **React Aria** (Adobe): about 4× year over year.
- **Radix**: largest by downloads, but maintenance has slowed under WorkOS.

**Ark UI / Zag** is the one headless library at scale built on finite state machines.

The styled incumbents are all leaving runtime CSS-in-JS behind:

| Library | Move |
|---|---|
| MUI v9 | CSS variables plus `color-mix()`; Pigment CSS paused |
| antd 6 | `zeroRuntime` mode |
| Primer v38 | CSS Modules |
| HeroUI v3 | CSS-only animations |

Two new signals matter most:

- **Meta open-sourced Astryx** (June 2026): StyleX-based, 150+ components, 7–10 themes, a JSON manifest and an MCP server, marketed as "agent-ready". It gained 13k stars in three months.
- **Shopify acquired Tailwind Labs** (2026-09-09). This came after AI hollowed out Tailwind's business model built on docs traffic: 75% of engineers laid off in January 2026.

**The AI layer in one paragraph.** By July 2026, 20 of the 21 surveyed design systems shipped an MCP server, 19 shipped agent skills and 15 shipped `llms.txt` (see the survey in the Sources). **Having an MCP, skills and llms.txt is now table stakes, not a differentiator.** Every major builder can now ingest "your design system":

| Builder | How it ingests a design system |
|---|---|
| Figma Make | Make kits built from a React 18 + Vite npm package |
| Lovable | design systems (npm packages on Enterprise) |
| v0 | shadcn registry |
| Claude Design | `/design-sync` |
| Builder Fusion | reads your repository |

Runtime generative UI has converged on one architecture: a **closed component catalog, a JSON tree the LLM emits, and a validator**. json-render, A2UI v0.9, Tambo and OpenUI all follow it, and so does `@cascivo/render`.

The measured evidence favours **structured context plus validation after generation** over prose dumps:

- **Atlassian:** one big DESIGN.md cost about 92% more tokens than their MCP.
- **Indeed:** JSON context was about 5× cheaper than MDX, and just as accurate or better.

That is exactly cascivo's design.

**Where cascivo stands.** The engineering is unusually deep for its age, and the product breadth is larger than any competitor's. It is one of very few React systems that:

- is **CSS-native with no Tailwind**, and does it at scale;
- builds overlays on **native `<dialog>` and Popover** instead of Floating UI and JS focus traps;
- ships **charts, email, flow, an editor and a "machine mode"** from one token system;
- **checks** agent output (`audit --ai`, `validate_view`, `validate_component`), rather than just describing components to the agent.

**Its problems are not engineering.** They are:

1. **Distribution and social proof are close to zero.**
   - 1 GitHub star, 0 forks.
   - About 1.1k monthly npm downloads for `@cascivo/react`.
   - One registry in its own directory.
   - A showcase made mostly of the maintainer's own projects.
2. **Credibility drift.** Numbers and claims on the public surfaces contradict each other, or contradict the repo:
   - "no runtime"
   - "0.x" next to 1.3.1 badges
   - three component counts in circulation
   - benchmarks from June, before 1.0
   - accessibility copy that says "pending" and "not tested" although AT results landed
3. **Message overload.** The landing page has 17 bands full of insider jargon. The README has no screenshot. The getting-started guide renders its first component at line 519.
4. **Two structural bets against the current:**
   - Preact Signals inside React, which is a niche (about 208k weekly downloads) and conflicts with the React Compiler lint direction.
   - A non-Tailwind vocabulary in a world where LLMs default to shadcn + Tailwind.
5. **Validation monoculture.** Most "adopter reports" are AI-agent dry runs building Vercel-style dashboards.
6. **Release discipline.** The 1.0 cut skipped its own 4–6-week stabilization window. Three minors followed in about two weeks, and one of them removed a prop (`ComboboxLabels.search`), which breaks the semver contract.

**Positioning recommendation:**

> *"The React design system that uses the browser instead of reimplementing it — plain layered CSS, native dialogs and popovers, signal-level re-renders — and whose AI layer doesn't just describe components, it **checks** what your agent wrote. Install from npm or own the source. Charts, email and 12 themes from one token set."*

Lead with **conformance** (the audit loop) and **platform-native** (no Tailwind, no Floating UI). Stop leading with "AI-first", "MCP" and component counts. Everyone claims those now.

---

## 1. Market map

### 1.1 Ecosystem layers

```
[Design tool]      Figma (Agent, Make + Make kits, MCP write-to-canvas, Code Connect), Claude Design,
                   Google Stitch (DESIGN.md), Framer, Subframe, Onlook, Builder Fusion
      ↓  variables / DESIGN.md / Code Connect
[Tokens]           DTCG 2025.10 (first stable spec) → Style Dictionary v5 / Terrazzo / Tokens Studio
                   (Specify shut down 2025-11 — standalone token pipelines are not a business)
      ↓
[Component lib]    shadcn registry · Base UI / React Aria / Radix / Ark · MUI / antd / Mantine / Chakra /
                   HeroUI / PrimeReact · Carbon / Fluent / Primer / Atlassian / Spectrum / Astryx
      ↓  AGENTS.md · Agent Skills · llms.txt · MCP · Storybook components-manifest
[Codegen agent]    Claude Code, Cursor, Codex; v0, Lovable, Bolt, Replit, Figma Make, AI Studio
      ↓
[Runtime gen-UI]   MCP Apps (whole iframes) · A2UI v0.9 / json-render / Tambo / OpenUI (catalog trees)
                   · AG-UI (transport) · Vercel AI SDK 6 + AI Elements
      ↓
[QA]               axe MCP, Storybook test-run, Chromatic / Percy / Applitools, Figma Check designs, antd lint
```

**Where the value is flowing:**

- **Up, into distribution.** Lovable is valued at $13.3B on about $500M ARR, and Replit at $9B. Chat hosts can now render MCP Apps: Claude, ChatGPT, VS Code and Goose.
- **Down, into enforced systems of record.** That means tokens, manifests and validators, shown by:
  - Claude Design's "validate and auto-correct against your system"
  - Figma MCP writing to the canvas "using your design system as the source of truth"
  - A2UI v0.9's "use the app's existing design system"
- **Squeezed out:** documentation sites monetised by traffic (Tailwind), standalone token SaaS (Specify), and first-generation prompt-to-mockup tools (Uizard, Webflow App Gen **[unverified]**).

cascivo's natural home is the **enforced system of record** layer. That is where the value is moving.

### 1.2 Segments

| Segment | Leaders | Model | Money |
|---|---|---|---|
| Owned-code platform | shadcn/ui plus its registries (coss ui, Magic UI, Aceternity, Kibo, 21st.dev, Tailark, Tremor) | Registry + CLI + MCP, Tailwind | Free core; paid blocks and marketplaces |
| Headless primitives | Base UI, React Aria, Radix, Ark/Zag, Ariakit, Headless UI | npm, unstyled | Sponsored by MUI, Adobe, WorkOS, Chakra |
| Styled suites | MUI (+X), antd, Mantine, Chakra, PrimeReact, HeroUI, Fluent | npm, themed | Open core (MUI X, HeroUI Pro, PrimeBlocks) |
| Corporate public DS | Carbon, Spectrum 2, Fluent, Primer, Atlassian, Polaris, SLDS, EUI, **Astryx** | npm or web components | Corporate cost centre |
| Tailwind kits | daisyUI 5, Flowbite 4, Tailwind Plus/Catalyst (closed to new buyers after the Shopify deal) | Classes / plugins | Pro templates |
| Web components | Web Awesome (948k/wk, ~360× YoY), Polaris WC, Carbon WC, Spectrum WC | Lit, CDN | Crowdfunded open core |
| CSS-native / classless | Open Props (+ Open Props UI), Pico | Pure CSS | Hobby / sponsor |

**cascivo spans three segments:** owned code, styled suite (through `@cascivo/react`), and CSS-native. The only other CSS-native project with copy-paste distribution is **Open Props UI**, which has about 25 components, is not React-first, and gets 24k weekly downloads.

---

## 2. The component-library competitors in detail

### 2.1 Owned-code: shadcn/ui and its ecosystem

**shadcn/ui** (MIT, 124.5k stars, CLI 4.21.0, 6.74M downloads a week):

- **Timeline** (from its changelog):

  | Date | What shipped |
  |---|---|
  | Aug 2025 | CLI 3 + MCP |
  | Oct 2025 | Registry Directory (~149 third-party registries by mid-2026) |
  | Dec 2025 | `shadcn create` |
  | Jan 2026 | RTL and logical properties |
  | Mar 2026 | CLI v4 (full-project templates for Next, Vite, Laravel, React Router, Astro, TanStack Start); `shadcn/skills`; presets; `--dry-run/--diff`; `info/docs` |
  | Apr–May 2026 | `apply`, `eject`, registry include/validate |
  | Jun 2026 | chat components, GitHub registries |
  | Jul 2026 | **Base UI default, React Aria option**, migration **delivered as an agent skill instead of a codemod** |
  | Aug 2026 | private GitHub registries |
  | Sep 2026 | standalone `cn` package |

- **Survey:** State of React 2025 says its usage rose from 20% to 56% in two years and that it is "on the verge of overtaking" MUI.
- **Weak spots cascivo can exploit:**
  - It is **Tailwind-mandatory**.
  - Its upgrade story is weak (copy-paste and diff).
  - Its charts are Recharts wrappers with known accessibility gaps: no table alternative, and a `role="application"` trap.
  - There is **no official Figma kit** (community kits only).
  - The primitive layer has now changed twice (Radix → Base UI), and every adopter owns that migration.

**Around it:**

- **21st.dev:** 12k+ components, a generating MCP at about $20/month, claims 1.4M developers.
- **Magic UI / Aceternity:** motion-heavy marketing components, with Pro tiers at about $99–199 lifetime.
- **Kibo UI:** Gantt, Kanban, editor. Acquired by Shadcnblocks.
- **Tremor:** acquired by Vercel in January 2025. The npm package has been frozen since; blocks are MIT.
- **coss ui** (formerly Origin UI, from Cal.com): rebuilt on Base UI.
- **Park UI:** Ark + Panda.
- Ports: shadcn-svelte and shadcn-vue.

**Incumbents are adding copy-paste as a delivery mode.** PrimeReact v11 (July 2026) now ships in four ways: styled, primitive, Tailwind copy-paste, and headless. HeroUI v3 also offers copy-paste. **Copy-paste is no longer a category of its own. It is a checkbox**, and cascivo's dual mode (copy + `@cascivo/react`) is now matched by PrimeReact and HeroUI.

### 2.2 Headless primitives

| Library | Version | Weekly | Stars | Model | Note |
|---|---|---|---|---|---|
| Radix | `radix-ui` 1.6.7 | 53M (dialog) | 19.3k | hooks/context | Slowed under WorkOS; not deprecated |
| **Base UI** | 1.8.0 | 9.8M | 11.0k | hooks + render props + Floating UI | 1.0 in Feb 2026; shadcn default; MUI's long-term direction |
| **React Aria** | RAC 1.21.1 | 3.1M (4× YoY) | 15.9k | hooks + react-stately | Best a11y and i18n (30+ locales); powers HeroUI v3 and Spectrum 2 |
| **Ark UI / Zag.js** | 5.39 / 1.44 (2.0-next) | 725k / 1.0M | 5.4k / 5.2k | **finite state machines**, 5 frameworks | Ark MCP (Aug 2026); Zag 2 tunes prop→machine reactivity |
| Headless UI | 2.2.10 | 5.1M | 28.7k | hooks | Shopify-owned now; slow cadence |
| Ariakit | 0.4.40 | 879k | 8.6k | stores | Mature, still 0.x |

**What this means for cascivo.** Adopters now choose a behaviour layer on **maintainer credibility**: Base UI is funded by MUI and React Aria by Adobe. cascivo's micro-FSM is React-only and maintained by one person. Zag has already proven FSM-driven behaviour at scale (70+ machines, 5 frameworks, and an MCP). **"We use state machines" is therefore not a differentiator.** cascivo's real behavioural differentiators are these:

- **Delegating to the platform:** `<dialog>.showModal()`, `popover="auto"`, `<details name>` for the no-JS disclosure.
- **`clientJs: 'none'`:** components that need no client JavaScript.
- **Small per-component cost.**

None of the major React libraries has moved its menus and popovers to native popover plus anchor positioning by default. Base UI, Mantine, Carbon, Blueprint, Headless UI, Web Awesome, bits-ui, reka-ui and Kobalte all still ship Floating UI. **cascivo is ahead here, and it should say so loudly.**

### 2.3 Styled suites and corporate systems

| Library | Latest | Weekly | Stars | Styling | AI surface | 2025–26 news |
|---|---|---|---|---|---|---|
| MUI | 9.4.0 | 7.4M | 99.1k | Emotion + CSS vars | `@mui/mcp`, llms.txt | v9 (Apr 2026); Pigment paused; Joy/Toolpad inactive |
| antd | 6.6.5 | 2.9M | 99.6k | CSS-vars mode, `zeroRuntime` | MCP, skills, **`@ant-design/cli` (`antd info/lint/migrate`)**, per-component md, design.md | v6 dropped IE, requires React 18+ |
| Mantine | 9.6.2 | 1.7M | 31.8k | CSS Modules + vars | MCP, llms.txt (4.2 MB full), 3 skills | v9 requires React 19.2+ |
| Chakra v3 | 3.37 | 1.2M | 40.7k | Emotion + recipes, on Ark | MCP (with a v2→v3 review tool), 3 skills | v4 exploration: Panda v2, multi-framework |
| HeroUI v3 | 3.2.6 | 481k | 30.8k | Tailwind v4, CSS-only animation, on React Aria | MCP, skills, llms.txt | Ground-up rewrite |
| PrimeReact | 11.1 | 241k | 8.3k | token engine; 4 delivery modes | [unverified] | Rebuilt July 2026 |
| Fluent 2 | 9.74 | 373k | 20.3k | Griffel (AOT atomic) | community MCP | Steady |
| Carbon | v11.117 | 94k (+16k WC) | 9.5k | Sass + custom properties | **Carbon MCP (preview): components, tokens, a11y validation** | "Carbon for AI" guidelines |
| Primer | 38.40 | 41k | 3.9k | CSS Modules (v38 removed styled-components) | `@primer/mcp` (version-aware), progressive disclosure | — |
| Atlassian | — | — | — | Compiled | **Hosted ADS MCP; measured +4.9% accuracy, −11% errors, −16% tokens** | DESIGN.md comparison study |
| **Astryx (Meta)** | 0.6.3 | 101k | **13.3k** | StyleX | **CLI JSON manifest + MCP, "human-AI parity"** | Open-sourced 2026-06-27; 150+ components; React 19+; beta |

**Astryx is the most direct thesis competitor**, for two reasons:

- It validated the "a JSON manifest stops agents hallucinating props" story in public. It was trending on GitHub in July 2026 with that exact headline.
- It has Meta's brand behind it.

cascivo built the same idea earlier and deeper: manifests generate registry, llms, context, MCP, prop-schemas and boundaries, all drift-checked in CI. But cascivo has almost no mindshare. **The market lesson is that the idea sells, and the brand and distribution decide who gets credit.**

**antd's CLI (`antd lint` for deprecated APIs, `antd migrate`) is the closest analogue to `cascivo audit --ai`.** Carbon's MCP includes accessibility validation. Atlassian publishes measured accuracy gains. **cascivo has the validators but publishes no measurements.** That is the gap.

### 2.4 Styling engines and the platform

- **Tailwind 4.3** has 95.6M downloads a week and uses a CSS-first config. It is now Shopify-owned: the framework stays MIT, and Tailwind Plus is closed to new buyers. State of CSS 2025 ranks it the most-used framework.
- **Runtime CSS-in-JS is in retreat.** styled-components is in maintenance mode; Primer, antd and Atlassian are all migrating off it.
- The compile-time engines are **StyleX** (1.4M/wk; adopted by Figma, Snowflake, HubSpot; powers Astryx), **vanilla-extract** (2.0M/wk) and **Panda** (245k/wk).
- **Browser status (Interop 2026):**
  - Baseline: `:has()`, size container queries, `@layer`, nesting and Popover.
  - Anchor positioning reached Baseline in early 2026 **[browser versions conflict across sources]**.
  - `@function` and `if()` are Chromium-only (about 71% global coverage), so progressive enhancement only.
  - `appearance: base-select` is shipped in Chrome; Safari and Firefox are partial.
  - Interop 2026 focus areas: anchor positioning, container *style* queries, dialogs/popovers, scroll-driven animations, view transitions, `attr()` and `contrast-color()`.

  cascivo's CSS rules (static fallbacks, `fallback:check`) are exactly right for this.
- **State of CSS 2025:** `:has()` is both the most used and the most loved feature. That supports cascivo's "the platform is ready" message.

### 2.5 Signals in React (cascivo's riskiest bet)

- **`@preact/signals-react` 3.12.0 has about 208k weekly downloads** (+19% YoY). Compare Zustand at 39.8M and Jotai at 4.2M (Jotai 3.0 shipped 2026-09-08).
- **TC39 Signals is still Stage 1.** It has backing from the Angular, Vue, Solid, Preact, Svelte, Qwik and MobX teams, but there is no Stage 2.
- **React's own answer is the Compiler (auto-memoisation), not signals.**
  - The signals Babel transform conflicts with the React Compiler (`preactjs/signals#652`).
  - `eslint-plugin-react-hooks@7` (`react-hooks/immutability`) flags every documented `signal.value = …` write. This is TROUBLESHOOTING entry #1 in cascivo's own docs. The official remedy is to turn the rule off "for the foreseeable future" and exclude signal-writing components from the Compiler.
- **No other mainstream React design system is signal-driven.** That makes the approach unique and an adoption risk at the same time.
- The main failure mode is **silent**: a component that reads `.value` without `useSignals()` never re-renders ("handlers fire, UI freezes"). Recent hooks auto-subscribe, which mitigates this.

**The honest framing:** the benchmark win comes mostly from the signals approach. cascivo won 4 of the 7 latency scenarios and lost *select-row* and *clear* to shadcn and *type-20-chars* to Carbon. That is a real win, but it is **not** a runaway. Present signals as an **internal implementation detail**: the public API is plain props and callbacks (`onValueChange`), and signals are optional power for people who want them. Add a CI leg that runs the examples under **React Compiler 1.x** and prove it works. Whether manual `useSignals()` is fully Compiler-safe is **unverified in the market**, so the first library to prove it gets to own that answer.

### 2.6 Web components

Shopify Polaris deprecated its React library in favour of evergreen web components served from a CDN (October 2025). Web Awesome is the fastest-growing web-component library, crowdfunded with $718k from Kickstarter. Material Web went into maintenance mode, which serves as a warning. **The lesson for cascivo** is that framework independence is what enterprises ask for. The tokens and themes already work in Vue, Svelte, Angular and Ghost. **CSS-only components** (those with `clientJs: 'none'`) could be marketed as framework-agnostic HTML + CSS recipes without writing any web components. That would be a cheap reach expansion.

---

## 3. The AI design market in detail

### 3.1 Prompt-to-app builders: what they generate against

| Product | Status (2026) | Business | What it generates against |
|---|---|---|---|
| **v0** | "New v0" (Feb) with Git and agents; Design Mode; **v0 API GA (Aug)** | Credits: $20 / $30 per user / $100 per user | **shadcn + Tailwind by default; custom design systems via a shadcn registry** |
| **Lovable** | ~$500M ARR; $13.3B valuation (Aug) | Subscription + credits | shadcn default; "Design systems" feature (npm package wrapping is **Enterprise-only**) |
| Bolt.new | v2 + Bolt Cloud; Azure partnership | Tokens | React/Tailwind |
| Replit Agent 4 | design canvas, parallel agents; $9B valuation | Effort-based | React/Tailwind |
| **Figma Make** | **Make kits (Mar 2026): bring a React 18 + Vite npm DS package**; Figma Agent GA; Code Layers | Seats + credits | Your npm package |
| **Claude Design** | Launched Apr 2026; **June overhaul: imports design systems from repos, validates and auto-corrects; `/design-sync` from Claude Code** | Included in Claude plans | Your codebase |
| Google Stitch | infinite canvas; exports React/Vue/Flutter/SwiftUI and MCP; **open-sourced DESIGN.md** | Free | DESIGN.md |
| Builder.io Fusion | agent on existing repos | Seats + credits | Your repo's components |
| Magic Patterns, Subframe, Onlook, Anima, Locofy, Framer, Webflow | — | — | Mostly Tailwind; Onlook **requires** Next + Tailwind |

**Quality evidence.** In UI-Bench (arXiv 2508.20410), expert judges ranked v0 9th of 10 on visual quality. The judges said the gaps were "layout planning, typography, color systems". Those are exactly what a token system encodes.

**What this means.** Every one of these builders is an **ingestion channel that costs cascivo nothing**, provided `@cascivo/react` installs cleanly under Vite and the registry speaks shadcn's schema. cascivo **already projects its registry into shadcn's schema** (`packages/registry/src/shadcn.ts`, `apps/site/public/r/shadcn/`, 211 files), so `npx shadcn add` and "Open in v0" work in principle. **The site does not market this.** Two things still need checking:

- Does v0 accept non-Tailwind registry items? v0 ignores `cssVars`/`css` and namespaced registries **[unverified for cascivo's items]**.
- Does `@cascivo/react` pass Figma Make kit ingestion and Claude Design `/design-sync`?

Each one is a checkable claim, and each one is a landing-page line.

### 3.2 Design-system-aware AI: the context layer

- **Figma**
  - Its MCP server now **writes to the canvas** (Feb 2026).
  - Code Connect UI maps components to repository files in one click.
  - Its "Check designs" lint uses a custom model rather than an LLM to match raw values to variables.
  - Native DTCG variable import and export was announced; GA is **[unverified]**.
- **DTCG 2025.10** is the first stable tokens spec. It covers theming and resolvers, OKLCH and Display-P3, and aliases. Terrazzo has the most complete implementation, Style Dictionary v5 is DTCG-based, and Tokens Studio is making incremental progress.
- **Storybook `addon-mcp`** builds on a **components manifest** (props, slots, events, snippets) and exposes `docs-list/docs-show/test-run`, including a11y. Chromatic hosts published Storybook MCPs (Mar 2026).
- **Supernova, Knapsack and zeroheight** all ship MCP servers.
- **Deque axe MCP** is included in axe DevTools.
- **DESIGN.md.** Atlassian measured it at 7.21M vs 3.75M tokens (+92%) with 2.7× the variance compared with their MCP. Their verdict: fine for prototyping, not for production. The Indeed test (1,056 runs) found JSON context about 5× cheaper than MDX with the best accuracy.

**What this means for cascivo:**

1. **cascivo's format bet is correct.** Closed-set JSON manifests, a token catalog and validators are the measured winners.
2. **Its entry file contradicts that bet.** `llms.txt` is **105 KB (about 26k tokens)** and is called "start here". `llms-full.txt` is **642 KB (about 160k tokens)** and `context.json` is **1.2 MB**. On top of that come docs, docspack and per-component files, so there are four overlapping entry channels. That is the DESIGN.md anti-pattern Atlassian measured. **Trim `llms.txt` to an index of about 5–8 KB and push everything else behind MCP and per-component files.**
3. **No DTCG export.** The token catalog is closed-set JSON, but it is not in the format that Figma, Tokens Studio, Terrazzo and Supernova read. A `tokens.dtcg.json` with resolver-based themes costs little and unlocks the whole design-tool side.
4. **No DESIGN.md.** It is cheap to generate from the manifests and makes cascivo readable by Stitch and quick-prototype tools.
5. **No Storybook components-manifest.** cascivo has Storybook, and `.meta.ts` could emit a Storybook-compatible manifest. That gives the Storybook/Chromatic MCP ecosystem for free.

### 3.3 Generative UI runtimes

| Runtime | Model | Status |
|---|---|---|
| **Vercel json-render** | Zod catalog → LLM JSON spec → validated render; streaming; renderers for React, Vue, Svelte, Solid, RN, PDF, email, Remotion | Apache-2.0, Jan 2026, 13k+ stars by March |
| **Google A2UI v0.9** | "Use the app's existing design system"; flat component list with `parentId` for streaming; bidirectional; React/Flutter/Lit/Angular renderers; transports over MCP/WS/REST/AG-UI/A2A | v1.0 RC |
| **MCP Apps** (SEP-1865) | `ui://` resources in sandboxed iframes; supported by Claude, ChatGPT, VS Code, Goose | First official MCP extension (2026-01-26) |
| AG-UI (CopilotKit) | agent↔UI event transport | $27M raised; adopted by LangChain, AWS, Google, Microsoft |
| Tambo 1.0, assistant-ui, Hashbrown, Thesys C1/OpenUI | register components, stream props / compact DSL | Various |
| Vercel AI SDK 6 | `streamUI` paused; tool calls + client render; **AI Elements** (shadcn-based chat UI) | Stable |

**How `@cascivo/render` compares.** Its `ViewConfig` has the same shape as these runtimes:

- registry-name `component` plus `props`
- `bind` to `$data`/`$state`
- `events` to `$actions`/`$state.set`
- `$t` translation refs
- named `regions`
- `validateView`
- prop schemas generated from manifests

**What it has that the others lack:**

- Schemas derived from the registry, with no hand-written Zod.
- Declarative view-local state.
- i18n refs.
- **`viewToMarkdown` / machine mode.** It renders the real components and serialises them to Markdown. This has **no peer in json-render, A2UI or Tambo**.

**Gaps:**

- The package is **unpublished**, even though the MCP `scaffold_view`/`validate_view` tools depend on its grammar.
- No A2UI catalog adapter, no json-render catalog export, no MCP Apps wrapper.
- No streaming or partial-tree rendering, which A2UI and json-render headline.
- Nested `children` instead of a flat `parentId` list, which streams better.
- It still carries the old name `CascadeView`.

**`@cascivo/ai`** (StreamingText, AiChat, Terminal) competes in a crowded, shadcn-dominated category: AI Elements, assistant-ui, CopilotKit and shadcn's June 2026 chat components. It should be kept as a demonstration, not marketed as a pillar.

### 3.4 AI-readable documentation conventions

- **AGENTS.md** is used in 60k+ repos and is now governed by the Linux Foundation's Agentic AI Foundation. **Agent Skills** (agentskills.io) installs with `npx skills add`, which is the de facto path for shadcn, antd, Mantine and Chakra.
- **llms.txt:** about 9–10% of top sites have one, but **crawlers almost never fetch it**. Its value is agent and IDE ingestion, not SEO. Tailwind refused an llms.txt PR.
- **Context7** hosts documentation for third parties, whether or not the library ships its own.

**Where cascivo stands:**

- It has AGENTS.md, llms.txt and six skills.
- **The skills install by manual settings.json editing.** Competitors use one command: `npx skills add cascivo/…`, or `shadcn mcp init` for the MCP.
- **The MCP server's 23 tools are undersold.** The README lists 7 and CLAUDE.md lists 5.

### 3.5 What LLMs generate best: the gravity problem

Agents default to shadcn + Tailwind + Radix idioms: `className="flex gap-4"`, `variant="outline"`, `asChild`, `useState`. MCP context helps only modestly (Atlassian measured +4.9% accuracy). **The robust gains come from validation after generation**: json-render's schema, Claude Design's auto-correct, `antd lint`, Storybook `test-run`. cascivo has already met this pressure in its own feedback loop ("nine wrong prop guesses in one small dashboard"; `gap="4"` cost 20 type errors). Its answer is sound: vocabulary rules, an ESLint plugin, and `audit --ai`. **That answer is the product.**

---

## 4. The adjacent ecosystems cascivo competes in

cascivo does not just compete with shadcn. Through its extra packages it competes with category leaders. For each package, the table below gives the leader, what a newcomer must match, and cascivo's angle.

| Area | Leader (weekly) | Table stakes | cascivo's position | Verdict |
|---|---|---|---|---|
| **Charts** | Recharts 3 (42.5M; 151 KB gz full), shadcn charts on Recharts; Highcharts leads a11y (commercial, with ACR and sonification); MUI X Charts v9 has keyboard nav on by default | Keyboard point navigation on by default, theme tokens, honest sizes | 25 chart types, zero dependencies, token-themed, keyboard tooltips, **hidden data tables** (serialised in machine mode), 40.4 KB gz full entry, 3.5 KB sparkline | **Real wedge.** Publish per-chart gzip against Recharts' 151 KB and a table fallback that most libraries lack. An **ACR for the chart set** would put cascivo in Highcharts territory for free. |
| **Email** | React Email 6 (merged into one `react-email` package, visual editor, Can I Email checker, **free**); MJML 5; Maizzle 6 | Compatibility check, preview server, Outlook-safe layout, dark mode | `@cascivo/email` 0.4.1: 12 themes resolved to sRGB, table layout, Can I Email lint, preview (2.0.0), 3 templates | The lint is **table stakes** because React Email ships it free. The **differentiator is the same tokens on web and email.** Needs Litmus / Email on Acid proof screenshots and more templates. |
| **Data table** | TanStack Table v9 (14.8M; shadcn's data table uses it); AG Grid (Enterprise $999/dev/yr) | Sort, filter, paginate, select, pin, resize, **virtualise 10k+ rows**, `grid` role with keyboard cells | `DataTable` component | Document a **TanStack Table adapter**, since adopters already own that state. Do not compete with AG Grid. |
| **Editor** | CodeMirror 6 (10.2M; **GitHub repos archived, development moved to a self-hosted forge**); Monaco | Native undo/IME/mobile/screen reader (textarea-based), Tab-trap escape | `@cascivo/editor`: textarea-overlay, "lightweight CSS-native" | Position it for snippets, config and forms, with a size comparison. **Don't claim IDE parity.** |
| **Flow** | React Flow / xyflow (8.2M + 1.6M legacy; React Flow UI ships **through the shadcn CLI**) | Pan/zoom, custom nodes, minimap, keyboard node moves, serialisable state | `@cascivo/flow` 1.3.1 with 10 registry parts | Hard to beat head-on. Say "MIT, token-themed, no Pro tier". **Consider a React Flow theme adapter** as well. |
| **Video** | Remotion (60k stars; **source-available, license required for companies of 4+**) | Player with accessible controls, captions | `@cascivo/video` is private and experimental, and **built on Remotion** | It inherits Remotion's licence. Don't market it as an MIT alternative. |
| **i18n** | react-i18next (11.7M); momentum is with compilers (Paraglide) | ICU plural/select, typed keys, lazy catalogs, RTL, **i18next/ICU JSON interop** | `@cascivo/i18n`: signal-driven, **only en + de** | Call it "two reference locales" and ship an **i18next/ICU interop** path. |
| **Persistence** | zustand `persist` (39.8M) | Versioned migrations, partial persistence, cross-tab sync, SSR-safe, IndexedDB | `@cascivo/storage` | Check parity point by point against `zustand/persist`. |
| **Icons** | Lucide 1.x (77.2M; decorative by default) | Tree-shakable ESM, `currentColor`, decorative by default | `@cascivo/icons`: 424 exports ("~440" is claimed) | **Document "bring Lucide"**, because adopters will not switch icon sets. |
| **Theme editor** | tweakcn (10.4k stars in about 18 months): live preview, contrast checks, AI themes from an image or prompt, oklch export | Visual editor, contrast, one-click export | `/create` theme builder (theme-kit); **the CLI hand-off is still on the roadmap** | Close the loop: `/create` → `npx cascivo theme apply <code>`. Add "theme from prompt" through MCP `create_theme`, which already exists. |
| **Docs / showcase** | Storybook 10, Fumadocs; patterns: blocks gallery, **"Open in v0"**, **"Copy page as Markdown / Open in Claude"**, live theme customiser, editable examples (Sandpack) | — | Storybook, a data-driven docs site, templates marketplace (3 items) | Add Copy-as-Markdown / Open-in-Claude per docs page (cascivo has `llms/<name>.md` already), plus Open-in-v0 buttons. |
| **Figma** | MUI, Carbon and antd have official kits; shadcn has **community kits only** (Obra 2.0) | Figma variables that mirror code tokens | **None** (ROADMAP "Later") | Not a gate for developer adoption, but **a gate for design teams and enterprise.** Generate a kit from manifests and tokens (DTCG → Figma variables). |

---

## 5. What cascivo actually is (audit summary)

### 5.1 Product surface (registry v1.3.1)

- **Packages.** 29 in total, 23 of them publishable, with versions from **0.0.5 to 2.0.0**:
  - **1.x:** core, react, charts, flow, editor, i18n, storage, ai, text, tokens, themes, icons, CLI.
  - **0.x:** mcp 0.7.2, registry, docs, docspack, email 0.4.1, eslint-config/plugin, platform 0.0.5, vite-plugin.
  - **email-preview 2.0.0.**
  - **Private:** render, search, theme-kit, video.
- **"198 components".**
  - The split is 131 standalone UI components, 25 charts, 14 layouts, 10 flow parts, 10 blocks, 6 sections and 2 editor entries. There are also 12 blocks and 3 templates.
  - Parity: 58 of 59 shadcn components have an equivalent.
- **Themes:** 12, plus `light-dark.css`, `all.css` and `tailwind.css`.
- **AI layer:**
  - MCP with **23 tools**.
  - 6 skills.
  - llms.txt and llms-full.txt, plus 198/198 per-component `llms/` and `context/` files.
  - `context.json`; `tokens.catalog.json` (353 tokens); `icons.catalog.json`.
  - `boundaries`, `specs`, `exceptions` and `audit-contract` JSON.
  - `cascivo audit --ai`, `@cascivo/eslint-plugin` and machine mode (`@cascivo/text`).
- **CLI:** `create` (Vite, Astro), `init`, `add`, `list`, `update` (a **three-way merge** against 7,284 versioned registry files, which is a genuine answer to shadcn's upgrade problem), `search`, `view`, `theme`, `eject`, `generate`, `registry`, `template`, `doctor --drift`, `audit`, `email`, `tokens`.
- **Quality gates:**
  - Tests: 465 test files and about 3,354 tests.
  - axe: runs on every PR (3×220 shards); the July baseline had 107 of 561 stories failing and is now at 0.
  - Visual regression: 486 baselines, but **nightly only, not per PR**.
  - Other gates: isolated packed-tarball install, RSC boundary walk, API-surface snapshot, RTL, host-ESLint over vendored source, and a recurrence ledger.
- **Compatibility:**
  - ✅ React 18/19, Next App Router, Vite CSR.
  - ✅ with a footnote: Vite SSR / TanStack Start.
  - Preact: CSR only.
  - Astro: requires `noExternal`.
  - Vue, Svelte, Angular and Ghost: tokens only.
  - **SSR CSS packaging is the most fragile area.**

### 5.2 Benchmarks (`docs/BENCHMARKS.md`, 2026-06-16, pre-1.0, one machine, self-run)

| | cascivo | shadcn | Carbon |
|---|---|---|---|
| Benchmark app total gz | **78.6 KB** | 96.5 KB | 189.7 KB |
| create-1k (ms) | **345** | 418 | 727 |
| update-every-10th | **918** | 1765 | 3884 |
| open-dialog | **10.5** | 174.8 | 107.4 |
| toggle-50 | **8.7** | 17.5 | 121.7 |
| select-row | 86.3 | **41.5** | 293.5 |
| clear | 308.6 | **228.4** | 1729 |
| type-20-chars | 138.8 | 175.0 | **124.4** |

**Contradiction:** the 1.0 readiness doc measures the full `@cascivo/react` at **167.7 KB gz**, while the benchmark's treeshake table shows 70.18 KB. The landing-page hero stat still uses the June data, even though `bench.yml` runs weekly.

### 5.3 Adoption reality (live, 2026-09-24)

| Signal | cascivo | For scale |
|---|---|---|
| GitHub stars / forks | **1 / 0** (repo created 2026-06-09) | Astryx 13.3k in 3 months; shadcn 124.5k |
| npm downloads, last 30 days | core 1,434 · react 1,139 · themes 785 · CLI 704 · charts 663 · mcp 516 | `@base-ui/react` 9.8M **per week** |
| Registries in its own directory | 1 (its own) | shadcn ~149 |
| Marketplace templates | 3 first-party, with SVG placeholder screenshots | shadcn blocks, 21st.dev 12k+ |
| Maintainers | 1 human, plus a bot for 30 of the last 50 commits | Base UI/MUI, React Aria/Adobe, Astryx/Meta |
| Showcase | 10 sites; several are the maintainer's own projects | — |

---

## 6. Head-to-head scorecard

Ratings: ●●● leads the market · ●● competitive · ● behind · ○ absent.

| Dimension | cascivo | shadcn/ui | Base UI / React Aria | MUI / antd / Mantine | Astryx | Comment |
|---|---|---|---|---|---|---|
| Component breadth | ●●● | ●● | ●● | ●●● | ●●● | 131 true components plus charts, flow, editor and email is more than anyone else |
| Styling model | ●●● (layered CSS, tokens) | ●● (Tailwind) | n/a | ●● (moving to CSS vars) | ●● (StyleX) | cascivo is the purest "no build step for styles" option |
| Platform-native overlays | ●●● | ● (Floating UI) | ● | ● | ? | Real lead; under-marketed |
| Behaviour / a11y trust | ●● | ●● (borrowed) | ●●● | ●●● | ●● | AT results: 3 pass, 21 partial; no VPAT; no external audit |
| Theming | ●●● (12 themes, scoped, oklch) | ●● (+ tweakcn) | n/a | ●●● | ●● | Theme editor hand-off missing |
| Upgrade story | ●●● (three-way merge, drift doctor) | ● | ●●● (npm) | ●●● (codemods, LTS) | ● | Undercut by semver slips |
| AI context (MCP, llms, skills) | ●●● | ●●● | ● | ●● | ●●● | Table stakes now; entry file too big |
| AI **conformance** (validate / audit) | ●●● | ● | ○ | ●● (antd lint, Carbon a11y) | ●● | **The real differentiator; unmeasured** |
| Runtime gen-UI | ●● (render + machine mode) | ● (AI Elements via Vercel) | ○ | ○ | ? | No A2UI / MCP Apps / streaming yet |
| Charts | ●● | ●● (Recharts) | ○ | ●●● (MUI X) | ? | Needs published numbers and an ACR |
| Email | ●● | ○ | ○ | ○ | ○ | React Email is the real competitor |
| Figma kit | ○ | ● (community) | ○ | ●●● | ? | Design-team gate |
| Framework reach | ● (React; tokens elsewhere) | ●●● (ports) | ● | ● | ● | Zag/Ark covers 5 frameworks |
| LLM prior (is it the default?) | ○ | ●●● | ●● | ●● | ● | The structural headwind |
| Maturity / bus factor | ● | ●● | ●●● | ●●● | ●● | 3.5 months old, one maintainer |
| Social proof | ○ | ●●● | ●●● | ●●● | ●● | The single largest gap |

---

## 7. Presentation: what's lacking

These findings come from reading `README.md`/`readme.body.md`, `apps/site/src/marketing/**`, `docs/**` and the generated artifacts.

### 7.1 Claims that contradict the repo (fix first; they cost trust)

> **Status (2026-09-24):** addressed in a follow-up commit. The exceptions are:
> - #4: timings still need a re-run on the disclosed bench machine; only the labels were fixed.
> - #10: the exported `CascadeView` and internal file/app names were left as they are, because renaming them is an API change.

| # | Where | Problem |
|---|---|---|
| 1 | `apps/site/src/marketing/poster/PosterHero.tsx:41` and `sections/EnterprisePitch.tsx:148` | "**no runtime**". `@preact/signals-react` plus the FSM *is* a runtime. A sceptic will spot it in one `npm ls`. Say "no styling runtime" / "no CSS-in-JS runtime". |
| 2 | `README.md` "Versioning and stability" | "Every package is `0.x` … `@cascivo/react@0.18.x`", beside 1.3.1 badges. `docs/COMPATIBILITY.md` repeats "All packages are 0.x and released together"; `ENTERPRISE-READINESS.md` §7 cites 0.18.0. |
| 3 | `AccessibilityStatement.tsx:124`, `WhyCascadePage.tsx:105`, README | "manual sessions pending / every cell reads 'not tested'". AT results landed on 2026-09-23 (3 pass, 21 partial), so the copy is wrong in both directions. "Partial" also needs explaining next to a "WCAG 2.2 AA" badge. |
| 4 | Hero stat, `docs/BENCHMARKS.md` | "Measured, not claimed" rests on **pre-1.0 data from June**, titled "cascade benchmarks". Re-run on 1.3, reconcile 70 KB against 167.7 KB, and state the three lost scenarios openly. The honesty itself is persuasive. |
| 5 | Component counts | 192 (`docs/ROADMAP.md`), 197 (`ROADMAP.md`) and 198 (README) are all in circulation. The 198 also hides the fact that about 131 are standalone components. Say "131 components + 25 charts + 14 layouts + blocks & flow". A sceptic comparing against shadcn's 59 will check. |
| 6 | `docs/CONTRIBUTING-REGISTRY.md:146,193,252` | Documents `cascade registry build …`, a binary that does not exist. It fails as written, and it sits in the ecosystem-growth path. |
| 7 | `apps/site/public/parity.json` | 24 stale "Queued (v18-t5/t6)" notes for components that ship (e.g. "drawer queued", yet `drawer` exists). The shadcn migration table is generated from this file. |
| 8 | README MCP section / CLAUDE.md | Lists 7 or 5 MCP tools; 23 exist. Undersells the strongest feature. |
| 9 | README trivia | "Mirrored at https://cascivo.com/llms.txt" is the same URL it mirrors; "cascivo.com + cascivo.com"; the `astro-islands` description is empty; the Okabe-Ito palette claim may be stale after #232. |
| 10 | Old names | `CascadeView`, `WhyCascadePage`, `app-cascade`; `CLAUDE.md` still says "native-ui", "three first-party themes", "~20 components", "vite+ v0.1.24"; `docs/specs/cascivo-launch-checklist.md` has every box unchecked. Contributors and agents read these. |
| 11 | ROADMAP files | `ROADMAP.md` says "last updated 2026-07-05", and two of its "Next" items are already done. `docs/ROADMAP.md` is a second, inconsistent roadmap. |
| 12 | `@cascivo/text` | Published at 1.3.1 but missing from UPGRADING's 1.x coverage table. |

### 7.2 Structural presentation problems

> **Status (2026-09-24):** addressed in a follow-up commit.
> - Hero and README now show a screenshot of the pulse example in both themes.
> - The landing page went from 17 bands to 9 plus the CTA, with plain-language headings.
> - The AI band shows a real `cascivo audit --ai` before/after.
> - A "More than components" band surfaces the previously unmarketed wins.
> - The showcase discloses that the sites are the maintainer's own.
> - `/guides/alternatives` is new, and `when-not-to-use` is expanded.
> - Getting started opens with a two-minute path and a "which versions go together" rule.
>
> Still open: a recorded demo video (#8) and a single umbrella version (#10, deliberately docs-only).

1. **There is no visual proof, anywhere.**
   - The README has zero images apart from the logo.
   - The landing hero is text plus three stats; nothing is interactive above the fold. The July review (`docs/specs/shadcn-comparison-2026-07.md`) flagged this, and it is still true.
   - shadcn's first screen is a working dashboard, and so is tweakcn's.
   - cascivo *has* stunning material: deploy, pulse, trade, pay and track are Vercel-, Datadog-, Stripe-, Linear- and Trade Republic-class dashboards. **Put one, live and theme-switchable, in the hero, and a GIF of it at the top of the README.**
2. **Too many messages.** The landing page is a 17-band poster covering the wedge, five differences, reactivity, proof, vs shadcn, vs StyleX, colocation, gallery, themes, AI, primitives, quick start, marketplace, production, email, machine mode and a CTA. A newcomer cannot tell which one matters. Cut it to about 6 bands:
   1. hero with a live demo
   2. "why no Tailwind" (the stylesheet, side by side)
   3. proof (numbers and a11y, honest)
   4. the AI conformance loop (demo: agent writes invented props → audit catches → fix)
   5. breadth (charts, email, themes)
   6. quick start
3. **Insider jargon.** Phrases like "02 / the wedge", "colocation", "machine mode", "path A / path B", "mechanism D/G" and "dark factory" mean nothing to a visitor. Section eyebrows should say what the reader gets.
4. **The value of signals is abstract.** "Signal-driven, micro-FSM" doesn't land. "Updating one row doesn't re-render the table; here's the React DevTools flame chart" does.
5. **The onboarding is too long.**
   - `GETTING-STARTED.md` is 652 lines; the first component appears at line 519, and it opens with "don't read this linearly".
   - `TROUBLESHOOTING.md` lists 22 failure modes.
   - Two install paths (copy vs `@cascivo/react`) double every instruction.

   Fix: first screen = one command + one import + a rendered component. Move the path decision after the first success.
6. **Weak social proof, some of it self-referential.** The showcase mixes the maintainer's own projects with adopters without saying so. No logos, no testimonials, no numbers.
   - Label your own projects honestly ("built by the maintainer"). It reads better than being found out.
   - Chase 3–5 genuine external adopters.
7. **Comparison coverage is narrow.** There are pages against shadcn, StyleX and Carbon. **There are none against Base UI / React Aria, MUI, Mantine, Chakra or Astryx.** Those are the choices real evaluators are weighing in 2026. `WhenNotToUse` lists only 4 limits. Adding the real ones earns trust:
   - one maintainer
   - React-only behaviour
   - the signals/Compiler lint trade-off
   - only en + de built in
   - no Figma kit
8. **The AI story is presented as a feature list rather than a demonstrated loop.** Every competitor now lists MCP, llms.txt and skills. Nobody *shows* "agent hallucinates `variant="outline"` → `cascivo audit --ai` fails with the fix → agent corrects". That 20-second video is cascivo's best marketing asset, and it does not exist yet.
9. **Unmarketed wins.** These already exist in the repo but appear nowhere on the landing page:
   - shadcn-schema registry projection ("works with `npx shadcn add`", "Open in v0")
   - three-way-merge `update`
   - `doctor --drift` with a machine-readable `breaking-changes.json`
   - native `<dialog>`/Popover (no Floating UI)
   - `clientJs: 'none'` components
   - hidden chart data tables
   - the isolated-tarball and host-ESLint gates ("your strict ESLint config passes on our copied code")
10. **Version-number soup.** Adopters see 0.0.5 to 2.0.0 side by side. The README explains it, but a single "cascivo 1.3" umbrella version, or a lockstep release of all 1.x packages, would read as far more mature.

---

## 8. Product, process and strategy gaps

### 8.1 Credibility and trust (enterprise-blocking)

- **No VPAT/ACR.** Mandatory for US federal sales and increasingly for B2B; the EU Accessibility Act has been in force since June 2025. There is no external accessibility audit, JAWS is untested, and AT results are mostly "partial".
- **No LTS or support policy** beyond "previous major gets 6 months of security fixes". Compare MUI X's 2-year LTS and SLAs.
- **The bus factor is one**, and much of the code is agent-authored. Enterprises will ask. A governance and continuity statement helps.
- **Supply chain.** npm provenance, SBOM and signed releases should be verified and advertised. The dependency-free charts and the validating registry are genuine strengths here.
- **Release discipline:**
  - 1.0 shipped with at most about 13 days of the prescribed 4–6-week stabilization.
  - 1.1.0's changelog is about 560 lines.
  - `ComboboxLabels.search` was removed in a minor, which breaks the published semver contract.
  - Slow the cadence; batch minors; run breaking removals through deprecations.

### 8.2 Validation monoculture

About 13 of the 22 feedback reports in `docs/internal/feedback/` are AI-agent runs of "build a Vercel-like dashboard". Most of the human reports come from the maintainer's own projects. The product is being tuned against one scenario. Scenarios with no coverage:

- forms-heavy CRUD apps
- content and marketing sites
- mobile-first apps
- non-English locales and RTL in practice
- design-team handoff
- a real brownfield migration from shadcn

### 8.3 Technical gaps against the market

1. **React Compiler proof.** Add a CI leg compiling the examples under React Compiler 1.x, and publish the result. Find a path to keep `react-hooks/immutability` enabled, e.g. setter helpers so adopters do not write `signal.value =` in their own code.
2. **SSR/CSS packaging** is still the top recurring failure (Astro islands, TanStack, "Unknown file extension .css", a 273 KB aggregate stylesheet in the scaffold). Consider per-component CSS imports in the prebuilt path, and a single documented recipe per framework.
3. **Deferred to 2.0:** `<details>`-based Accordion; the Combobox/DatePicker outside-click listeners; a shared `useMenu`/`useListbox`.
4. **Visual regression runs nightly only.** Per-PR runs (even a sampled subset) would catch layout regressions such as AppShell padding (reported three times) and Card stretched links.
5. **i18n has only two locales.** Framework-level strings in 10+ locales are a cheap win for international adopters, and React Aria's 30+ locales are the bar.
6. **Data grid:** virtualisation and a TanStack adapter.
7. **The marketplace is empty.** A marketplace with 3 first-party templates and placeholder screenshots reads as vapourware. Either seed it with 10+ real templates or de-emphasise it until it is populated.

### 8.4 AI-layer gaps (to keep the lead that matters)

1. **Measure the audit loop.** Run a small public benchmark in the style of Atlassian and Indeed: N prompts × {no context, MCP only, MCP + audit loop} → type errors, invented props, token violations, tokens spent. This turns "AI-first" from a claim into a number, and nobody else publishes this for generated-code conformance.
2. **One-command AI setup:** `npx cascivo mcp init` (writes the client config) and `npx skills add cascivo/…`.
3. **Shrink `llms.txt`** to an index of about 5–8 KB; make MCP and per-component files the deep path.
4. **Adapters and standards:**
   - **DTCG 2025.10 export** of the tokens, with resolver-based themes.
   - A generated **DESIGN.md**.
   - A **Storybook components-manifest** emitted from `.meta.ts`.
   - An **A2UI v0.9 catalog** and a **json-render catalog** generated from manifests.
   - An **MCP Apps** wrapper that serves a view as a `ui://` resource, so cascivo UIs render inside Claude and ChatGPT.
5. **Publish `@cascivo/render`.** MCP tools depend on its grammar; an unpublished runtime is a hidden runtime. Add streaming/partial validation and consider a flat `parentId` wire format.
6. **Machine mode as an evaluation tool.** Add an MCP tool `render_view_as_markdown` so agents can check what their generated view actually says. It is cheap, deterministic and needs no screenshots. No competitor has it.
7. **Builder ingestion certification.** Verify and advertise:
   - `@cascivo/react` as a Figma Make kit
   - as a Lovable design system
   - as a Claude Design `/design-sync` target
   - as a v0 registry source (`npx shadcn add` against cascivo's shadcn projection)

   Each one is a distribution channel and a landing-page badge.
8. **A "migrate from shadcn" agent skill**, following shadcn's own move from codemods to skills. It works *with* the LLM prior instead of against it, because agents already know shadcn perfectly.

---

## 9. Opportunities: where cascivo can win

In rough order of leverage per unit of effort:

1. **"Conformance, not context."** Everyone has MCP. Almost nobody *verifies* generated code against the system. Make the audit loop the headline, with a benchmark and a demo video.
2. **Ride shadcn's distribution instead of fighting it.** The shadcn-schema projection already exists. Get into the shadcn Registry Directory (about 149 registries, and cascivo would be the only non-Tailwind one of note). Market "`npx shadcn add @cascivo/…`" and "Open in v0". That puts cascivo on the path every agent already walks.
3. **Own "no Tailwind" at scale.** Tailwind changed hands, Tailwind Plus closed, and some teams (enterprise, SSR-heavy, multi-surface, Rails/Ghost/Astro) want plain layered CSS. The only CSS-native peer is Open Props UI at about 25 components.
4. **Own "uses the browser".** Native `<dialog>`, `popover`, `<details name>`, anchor positioning and `@container` are all Interop 2026 focus areas. No major React library has made native overlays its default. Frame cascivo as the library aligned with where browsers are going.
5. **The accessible-chart wedge.** Keyboard navigation, hidden data tables, CVD-safe palettes and zero dependencies, backed by a published ACR for the chart set, would make cascivo the only free, MIT React chart set with Highcharts-grade accessibility documentation.
6. **One token source for web, email, charts, flow and editor.** No competitor spans all of these; React Email, React Flow UI and Tremor each theme only their own island.
7. **Machine mode.** UIs readable by agents, deterministic view testing, and no-JS/accessible fallbacks. It is a genuinely new idea, so give it one crisp demo.
8. **The Figma kit generated from manifests.** It closes the gap shadcn leaves to its community and unlocks design teams and enterprise.
9. **Enterprise package:** ACR, an LTS window, provenance and SBOM, and optional paid support. It is the natural business model if one is wanted (compare MUI X, AG Grid, Highcharts).

**What not to do:**

- Don't compete on chat components (`@cascivo/ai`); that category belongs to AI Elements, assistant-ui and CopilotKit.
- Don't market `@cascivo/video` as an alternative to Remotion, since it *is* Remotion.
- Don't rely on llms.txt for discoverability.
- Don't lead with component counts, "AI-first" or "MCP"; those no longer differentiate.

---

## 10. Prioritised action list

### Now (days): stop losing trust
1. Fix every item in §7.1: "no runtime", 0.x text, AT copy, component count, `cascade registry build`, `parity.json`, MCP tool list, old names, the roadmaps, and the UPGRADING table.
2. Re-run the benchmarks on 1.3, reconcile the bundle figures, and publish the lost scenarios.
3. Add a hero GIF/screenshot to the README and a live, theme-switchable dashboard above the fold on the landing page.
4. Label the maintainer's own showcase projects as such.

### Next (weeks): convert the lead into proof
5. Run the audit-loop benchmark and record the 20-second "agent is caught and corrected" demo.
6. Add `cascivo mcp init` and one-command skills install; trim `llms.txt`.
7. Submit to the shadcn Registry Directory; verify v0, Figma Make, Lovable and Claude Design ingestion, and badge each one.
8. Cut the landing page to about 6 bands; shorten getting started to first-component-in-one-screen.
9. Add comparison pages against Base UI/React Aria, MUI/Mantine and Astryx; expand `WhenNotToUse`.
10. Add a React Compiler CI leg and publish the result.
11. Adopt a release policy: lockstep 1.x releases, deprecate before removing, and a real stabilization window before 2.0.

### Later (quarter): widen the moat
12. DTCG export, DESIGN.md, Storybook manifest, and a Figma kit generated from them.
13. Publish `@cascivo/render`, plus A2UI and json-render catalog adapters and an MCP Apps wrapper; add a `render_view_as_markdown` tool.
14. An ACR/VPAT (charts first), an external accessibility audit, and JAWS coverage.
15. Grow i18n beyond en and de; add a TanStack Table adapter and virtualisation; get visual regression running per PR.
16. Broaden validation: forms/CRUD, content, mobile, RTL and brownfield-migration scenarios, with human adopters.
17. Seed the marketplace with 10+ real templates, or hide it until it is populated.

---

## Sources (selected)

**Component libraries.**
- shadcn:
  - [changelog](https://ui.shadcn.com/docs/changelog)
  - [Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
  - [CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
  - [MCP](https://ui.shadcn.com/docs/mcp)
- Base UI and MUI:
  - [Base UI 1.0](https://www.infoq.com/news/2026/02/baseui-v1-accessible/)
  - [MUI 2026 and beyond](https://mui.com/blog/2026-and-beyond/)
  - [MUI v9](https://mui.com/blog/introducing-material-ui-v9/)
- Astryx:
  - [Astryx](https://github.com/facebook/astryx)
  - [TechTimes on Astryx](https://www.techtimes.com/articles/319202/20260627/metas-astryx-gives-ai-coding-agents-design-system-they-can-actually-read.htm)
- Tailwind:
  - [Tailwind layoffs](https://devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/)
  - [Shopify acquires Tailwind Labs](https://www.cmswire.com/digital-experience/shopify-acquires-tailwind-labs-to-secure-css-framework/)
- Other libraries:
  - [HeroUI v3](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)
  - [Mantine 9](https://mantine.dev/changelog/9-0-0/)
  - [Chakra v4 discussion](https://github.com/chakra-ui/chakra-ui/discussions/10936)
  - [PrimeReact v11](https://primereact.dev/docs/styled/guides/migration/updating-to-v11)
  - [Primer v38](https://github.com/primer/react/discussions/7086)
- Signals:
  - [preactjs/signals#652](https://github.com/preactjs/signals/issues/652)
  - [TC39 Signals](https://github.com/tc39/proposal-signals)
- Surveys and platform:
  - [State of React 2025](https://2025.stateofreact.com/en-US/libraries/component-libraries/)
  - [State of CSS 2025](https://2025.stateofcss.com/en-US/features/)
  - [Interop 2026](https://css-tricks.com/interop-2026/)
  - [`@function` support](https://caniuse.com/mdn-css_at-rules_function)

**AI and design.**
- Research and surveys:
  - [State of AI in Design Systems (2026-09)](https://state-of-ai-in-design-systems.netlify.app/)
  - [Atlassian DESIGN.md vs MCP](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice)
  - [Indeed MCP format study](https://www.intodesignsystems.com/design-systems-mcp)
  - [UI-Bench](https://arxiv.org/html/2508.20410v3)
- Builders and design tools:
  - [Figma Make kits](https://help.figma.com/hc/en-us/articles/43602872461079-Bring-your-design-system-package-to-a-Make-kit)
  - [Figma MCP code-to-canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/)
  - [Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs)
  - [Claude Design overhaul](https://venturebeat.com/technology/anthropic-ships-major-claude-design-overhaul-with-design-system-imports-code-round-trips-and-a-fix-for-its-token-burning-problem)
  - [Lovable design systems](https://docs.lovable.dev/features/design-systems)
  - [v0 API](https://www.infoq.com/news/2026/08/vercel-v0-api/)
  - [DESIGN.md](https://github.com/google-labs-code/design.md)
- Standards and runtimes:
  - [DTCG 2025.10](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
  - [Storybook MCP](https://storybook.js.org/docs/ai/mcp/overview)
  - [json-render](https://github.com/vercel-labs/json-render)
  - [A2UI v0.9](https://developers.googleblog.com/a2ui-v0-9-generative-ui/)
  - [MCP Apps](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
  - [AI SDK 6](https://vercel.com/blog/ai-sdk-6)
- Tooling and conventions:
  - [antd for agents](https://ant.design/docs/react/for-agents/)
  - [Carbon MCP](https://carbondesignsystem.com/developing/carbon-mcp/overview/)
  - [Primer MCP](https://primer.style/product/getting-started/foundations/mcp/)
  - [axe MCP](https://www.deque.com/axe/mcp-server/)
  - [AGENTS.md / AAIF](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)

**Adjacent ecosystems.**
- Charts:
  - [Recharts 3 migration](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
  - [Highcharts accessibility](https://www.highcharts.com/accessibility/)
  - [MUI X Charts a11y](https://mui.com/x/react-charts/accessibility/)
  - [shadcn charts a11y review](https://ashleemboyer.com/blog/a-quick-ish-accessibility-review-shadcn-ui-charts/)
- Email:
  - [React Email 6](https://resend.com/blog/react-email-6)
  - [MJML 5](https://github.com/mjmlio/mjml/releases/tag/v5.0.0)
- Tables, flow and video:
  - [TanStack Table v9](https://tanstack.com/blog/announcing-tanstack-table-v9)
  - [React Flow UI](https://reactflow.dev/ui)
  - [Remotion licensing](https://www.remotion.dev/docs/license/pricing)
- Icons, theming and docs:
  - [Lucide v1](https://lucide.dev/guide/version-1)
  - [tweakcn](https://tweakcn.com/)
  - [Storybook 10](https://storybook.js.org/blog/storybook-10/)
  - [shadcn Open in v0](https://ui.shadcn.com/docs/registry/open-in-v0)
  - [MUI for Figma](https://mui.com/material-ui/design-resources/material-ui-for-figma/)
- Enterprise:
  - [VPAT/ACR guide](https://www.levelaccess.com/blog/vpats-and-acrs-what-you-need-to-know/)
  - [MUI X support/LTS](https://mui.com/x/introduction/support/)

**Most important unverified items:**
- Figma native DTCG GA.
- Whether v0 accepts cascivo's non-Tailwind registry items.
- Whether manual `useSignals()` is fully React Compiler-safe.
- Anchor-positioning and `base-select` browser versions (sources conflict).
- The Webflow App Gen deprecation and ChatGPT canvas removal (single sources).
- The Astryx theme count (7 vs 10).
- Most pricing figures (third-party).
