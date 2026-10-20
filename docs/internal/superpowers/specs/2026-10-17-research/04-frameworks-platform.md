# 04 - Frameworks, platform features, beyond-React, design tooling (as of 2026-10-17)

Method. Local: read docs/COMPATIBILITY.md, USING-WITH-{NEXTJS,ASTRO,PREACT,A-ROUTER}.md,
docs/plans/modern-css-adoption-plan.md, market-analysis-2026-09 s2.4-2.6/4/8.3, grep over
packages/{components,themes,tokens,core,layouts,app}. Web: official sources where reachable
(react.dev, nextjs.org, reactrouter.com, astro.build, tanstack.com, vite.dev, figma.com,
shadcn changelog, Chromatic, DTCG/Style Dictionary/Terrazzo docs) plus the machine-readable
`web-features@3.43.0` dataset (npm, published 2026-10-16; it is the data behind
webstatus.dev/MDN Baseline badges) which I parsed locally for every Baseline row in section 3.
Confidence tags: [V] verified from a primary/authoritative source, [S] single secondary source,
[I] my inference. Browser versions "today": Chrome 155 (2026-10-06), Firefox 158 (2026-10-13),
Safari 27 (2026-09-14) per the dataset's release tables.

---------------------------------------------------------------------------------------------

## 1. Framework / runtime reach

### 1.1 State of the world (Oct 2026)

| Platform | State [source] | Does CSS-module + signals DS work? | Pain points / evidence |
|---|---|---|---|
| **React** | 19.2 (2025-10-01): Activity, useEffectEvent, Performance Tracks. **19.3 (2026-09-09)**: `<ViewTransition>` and Fragment refs go **stable**, new `browser()` (suspends on server, opts a component out of SSR), Trusted Types, transition types as `:active-view-transition-type()`, Server Components can render Context exported from a `'use client'` module [V react.dev/blog, react.dev/blog/2026/09/09/react-19-3]. React Foundation (Linux Foundation) launched 2026-02-24. Dec 2025: two critical RSC CVEs (RCE, DoS/source exposure). | Yes. Repo catalog pins react ^19.2.7. | Zero use of Activity / ViewTransition / Fragment refs / useEffectEvent / `browser()` in packages/{core,components} (grep). `browser()` is a cleaner answer than the current client-only patterns [I]. 19.3 not in any CI leg [I - catalog says ^19.2.7, so it floats to 19.3 only on lockfile bump]. |
| **Next.js** | 16 (2025-10-21) -> 16.4 (2026-10-06). **Cache Components (`cacheComponents` + `partialPrefetching`, `'use cache'`) now recommended for every app, on by default for new apps, default in Next 17**; React 19.3 bundled; `reactCompiler: true` is stable but opt-in; **Rust React Compiler is experimental** (`turbopackRustReactCompiler`); Turbopack shortens CSS-module class names in prod [V nextjs.org/blog/next-16-4]. | Yes for RSC + CSS modules (documented, `react-server` export condition, rsc-css.mjs test). | `apps/examples/react-next/next.config.ts` is empty: **no `cacheComponents`, no `reactCompiler`** are exercised. Under Cache Components, client components SSR'd inside the static shell must not read time/random before a Suspense/`connection()` boundary; DatePicker/Calendar/relative-time/Toast-style components are candidates to fail prerender [I - needs a test]. |
| **React Router** | **8.0.0 2026-06-17**, 8.4.0 2026-09-15. v8 baseline: Node 22.22+, React 19.2.7+, Vite 7+, ESM-only, `react-router-dom` removed, Vite Environment API default. **RSC framework mode still marked unstable (flask)**; 8.4 docs: every RSC Server Function is a public endpoint [V reactrouter.com/changelog]. | Yes (client components + CSS imports through Vite). | `docs/COMPATIBILITY.md` framework table has **no React Router row** (only mentioned in USING-WITH-A-ROUTER.md for link wiring). v8 ESM-only + `react-router/dom` import split is not documented. |
| **TanStack Start** | **1.0 stable 2026-10-13** (4 days ago); CVE-2026-102989 reflected XSS fix 2026-09-30; RSC support added Apr 2026 but described as early [V tanstack.com/blog; S LogRocket]. | Yes; CI already runs real ESLint over a TanStack Start scaffold (`scripts/checks/host-lint/eslint`). | COMPATIBILITY lumps it with "Vite SSR" with footnote 1. Needs a 1.0 re-verification and its own row. |
| **Astro** | **Astro 7.0 2026-06-22** (Vite 8, Rust compiler, Advanced Routing), 7.4 on 2026-10-15 [V astro.build/blog]. Astro 6 made Content Layer mandatory [S]. | Yes with the two documented fixes (`module` condition ordering + `resolve.noExternal`). | Example pins `astro ^7` (good). Preact-under-Astro still broken (documented). Server islands (`server:defer`) with owned-code React islands: not covered by any doc/test [I]. |
| **Vite / Rolldown** | Vite 8 stable 2026-03-12 (Rolldown only bundler, Oxc, `@vitejs/plugin-react` v6 without Babel, **Lightning CSS now a regular dependency**); Rolldown 1.0 2026-05-07 [V vite.dev/blog/announcing-vite8; S voidzero]. | Yes (repo itself runs on vite-plus/Rolldown). | See 1.3: Lightning CSS minification claims in docs are stale. |
| **Remix 3** | Yes, it dropped React: ground-up rebuild on web platform APIs, **forked Preact JSX runtime**, imperative components (`this.update()`), "frames", no migration path from Remix 2 (point to React Router). Beta: v3.0.0-beta.5, weekly betas (InfoQ 2026-07-28) [V InfoQ; S others]. | **No, by design.** Hooks/signals-react components cannot run on a Preact fork without `preact/compat`; unknown whether Remix 3 ships a compat layer [I]. Tokens/themes (pure CSS) do work. | Not a target; one-line "tokens/themes only" row suffices. |
| **Waku** | 1.0.0-rc.2 (2026-09-28) [S, third-party posts; unverified on waku.gg]. Vite + Hono + RSC. | Likely yes via `react-server` condition [I]. | Untested. |
| **RedwoodSDK** | 1.0 beta; Vite plugin, RSC, **Cloudflare Workers only** [S rwsdk.com]. | Likely yes [I]. | Repo has `starters/cloudflare` + `--framework cloudflare` (client-rendered), which is the nearest asset. |
| **Expo / React Native** | SDK 56 (2026-05-21): RN 0.85, React 19.2, Hermes V1 default; React Compiler Babel auto-configured since SDK 54 [V expo.dev/changelog, docs.expo.dev]. react-native-web reportedly in maintenance mode; Meta's React Strict DOM (StyleX) is the successor and still "experimental" per its README [S itnext; V repo README]. HeroUI v3 ships a separate 37-component RN library [S]. | **No** for native (CSS modules, `<dialog>`, popover, container queries do not exist). Possible only via Expo DOM components (`'use dom'` webview) [I from prior knowledge, not re-verified]. | Correct to declare out of scope; say so explicitly. |
| **Preact** | 10.29.x current; Preact 11 still beta (Hydration 2.0 unstable); `preact/compat` lacks React 19 `use()` [S openreplay/pkgpulse]. | CSR verified in repo; SSR unverified; Astro broken (already documented). | Doc is honest. Cheap upgrade: an SSR/prerender smoke test (`preact-iso` is already in the catalog). |

### 1.2 Is `@preact/signals-react` healthy and compatible?

- Latest 3.12.0 (2026-08-04); 3.11.1 on 2026-07-31; steady minors (For/Show utilities, `useModel`, `componentName` debug). ~208k weekly downloads per the repo's market analysis (npm page blocked for me, not re-verified) [V github releases/changelog].
- 3.0.0 removed `/auto` automatic tracking "incompatible with React 19"; 2.3.0 first bumped the peer to 19.x [V CHANGELOG]. cascivo's `>=3.0.0` floor is correct.
- **Nothing in the changelog mentions React 19.2/19.3, Activity, the Compiler or `use`** [V]. No stated support policy; compatibility is by absence of reports.
- **Issue #652 ("React-compiler not working with `@preact/signals-react-transform`")** - opened 2025-02-01, **closed 2025-04-08 without a fix**; reopened by a comment in June 2025 where maintainer JoviDeCroock said *global (module-scope) signals likely don't work with the React Compiler; use `useSignal`*; a July 2025 follow-up asking about global-signal support got no answer [V github.com/preactjs/signals/issues/652]. Of the 4 open `react`-labelled issues, none concern React 19/Compiler/RSC (all 2022-2024) [V].
  - Nuance vs the market analysis (s2.5 says "conflicts"): the report was about the **Babel transform + compiler**. cascivo uses the `useSignals()` hook path, not the transform, and has a CI leg (`pnpm compiler:check`, `apps/examples/react-vite/vite.compiler.config.ts`, `panicThreshold: 'all_errors'`) that compiles one app with babel-plugin-react-compiler 1.x. That is real evidence, but **it covers one Vite app only**: not Next's compiler path (Rust compiler is now the direction), not 19.3, not the library's own components compiled by an adopter.
  - **Module-scope signals in cascivo's own packages are exactly the case the maintainer flagged**: `packages/i18n/src/locale.ts` (`const activeLocale = signal('en')`), `messages.ts` (`catalogVersion`). Two consequences [I]: (a) Compiler: reads inside components go through `.value` property loads which the compiler tracks as dependencies, so likely fine, but unproven for the library path; (b) **SSR**: a module-level locale signal is a process-wide singleton, so per-request locale on a Node/Next server can leak across concurrent requests. Worth a test + a documented per-request pattern.
- Practical read: the library is alive and maintained but is a one-package, hook-based adapter whose React 19.x compatibility is not contractually stated. This is the biggest *dependency* risk and it is reputational (adopters' `react-hooks/immutability` lint, TROUBLESHOOTING #1) rather than functional.

### 1.3 Stale or contradicted claims in the repo docs (fix candidates)

1. `docs/COMPATIBILITY.md` says `@function`/`if()` are "Chrome 133+". web-features: `if()` Chrome 137, `@function` Chrome 139, neither in Firefox/Safari [V dataset].
2. COMPATIBILITY / USING-WITH-TAILWIND claim lightningcss "silently drops `@function`". I ran lightningcss **1.33.0** (npm latest) over `@function --d(...)`, `width: --d(2px)`, and `if(media(...):...)`, minified and not, with and without a Chrome-100 target: **all are preserved verbatim** (script in scratchpad/lcss/t.js). Either Tailwind 4.3 bundles an older lightningcss or the claim is outdated. Re-test against the exact Tailwind 4.3 / Vite 8 pipeline before deleting the opt-in; if it holds, `functions.css` could be on by default (still behind fallbacks). [V for my test; I for the conclusion]
3. COMPATIBILITY: `field-sizing` "FF 121" - dataset says **Firefox 152**; Baseline Newly available **2026-06-16**.
4. COMPATIBILITY / plan: `appearance: base-select` "Chrome 135+ only" - **Safari 27 now ships it** (Sept 2026); Firefox does not.
5. Modern-CSS plan intro says `commandfor` and `@scope` are already used. **Neither appears anywhere in packages/{components,core,layouts,themes,tokens,app}** (case-insensitive grep, `commandFor`/`command` JSX props included; `@scope` only appears as a pass-through in cli/css-layers.ts). View transitions are used only in `packages/app` router + `apps/site`, not in components.
6. The plan's table puts `sibling-index()` at "Chrome 138" and `interesttarget` as "flag in every engine". Now: sibling-index/count Baseline Newly **2026-08-18** (Chrome 138, FF 154, Safari 26.2); interest invokers ship in **Chrome 142 only** (still no FF/Safari).
7. `masonry.module.css` has two `@supports` blocks, `grid-template-rows: masonry` and `display: masonry`. The syntax that actually shipped is **`display: grid-lanes`** (WebKit blog; web-features: Safari 26.4/iOS 26.4 only, Chrome/Firefox none). Neither existing block matches it, so Safari 26.4+ falls through to the multi-column fallback [V webkit.org/blog/17660, dataset]. Cheap win: add a `@supports (display: grid-lanes)` block (tracks via `grid-template-columns`).

### 1.4 What competitors support (Oct 2026)

| Library | Framework / platform posture | Signal for cascivo |
|---|---|---|
| **shadcn/ui** | `init` detects Next, Vite, React Router, Astro, Laravel, TanStack Start. **Base UI is now the default primitive layer (Jul 2026)**; React Aria offered as a base (Jul 2026); Radix unified package (Feb); RTL (Jan 2026); CLI v4 (Mar); `shadcn eject`, private GitHub registries (Aug), presets, chat/AI blocks [V ui.shadcn.com/docs/changelog]. | cascivo's differentiators (CSS-native, signals, 12 themes, MCP) must be set against a shadcn that is now primitive-agnostic and has RTL and private registries. |
| **Base UI** | 1.0 stable 2025-12-11 (package renamed `@base-ui/react`), 1.6.0 current; MUI folded MUI Base into it [V release notes]. | Direct heir to Radix; unstyled, CSS-friendly - closest philosophical neighbour. |
| **Radix** | WorkOS-owned; activity slowed since early 2026 (last repo push 2026-02-13 per snapshot), no official roadmap [S]. | Radix-dependency anxiety is a selling point for cascivo's native `<dialog>`/popover approach. |
| **React Aria / RAC** | 30+ locales, 13 calendars, RTL, documented SSR + Next App Router locale provider; HeroUI v3 and (Jul 2026) shadcn build on it [V Adobe docs; S]. | The a11y/i18n bar. cascivo i18n = en + de only (market analysis s8.3). |
| **Ark UI / Zag / Park UI** | Zag state machines with adapters for React, Solid, Vue, Svelte; Ark UI exposes the same API in four frameworks; Chakra v3 is built on it [V ark/zag READMEs; S]. | The only mainstream *multi-framework state-machine* precedent; see section 2. |
| **Mantine 9** | Requires **React 19.2+**, CSS-modules based [V mantine.dev/guides/8x-to-9x; S date 2026-03-31]. | Precedent for raising the React floor; cascivo's `react >=18` blocks Activity/ViewTransition/`useEffectEvent`. |
| **Chakra v3** | Ark-based; Next App Router, Vite, Remix setups documented; anecdotal Ark+RSC rough edges [S]. | - |
| **HeroUI v3** | Stable 2026-03-21; rewrite on React Aria Components + Tailwind v4, OKLCH tokens, styling package usable from other frameworks, RN library, 75+ web components [S InfoQ/HeroUI docs]. | OKLCH tokens + a standalone styling package: closest in token story. |

### 1.5 Top framework gaps (ranked)

1. **No React 19.3 / Next 16.4 Cache Components / Compiler matrix.** Add CI legs: `react-next` with `cacheComponents: true` + `reactCompiler: true` (and optionally the Rust compiler), React 19.3 on the existing compiler leg, `react-vite-ssr` under 19.3. Evidence: empty next.config.ts; one compiler leg on react-vite only.
2. **SSR-safety of module-scope signals** (`@cascivo/i18n` locale/catalog; `@cascivo/storage`) - singleton per server process. Needs a per-request pattern or an explicit "client-only locale" statement.
3. **COMPATIBILITY matrix omits React Router 8 (framework mode), TanStack Start 1.0 as its own row, Waku, RedwoodSDK, Remix 3, Expo/RN**; no React-version policy statement (18 vs 19.3 features).
4. **Zero adoption of React 19.2/19.3 primitives** where they replace cascivo code: `<ViewTransition>` (vs hand-rolled `startViewTransition` in packages/app router), Fragment refs (vs wrapper elements in focus/roving/typeahead code), `browser()` (vs mounted-flag patterns), `useEffectEvent` (banned by house rule anyway: stays signals).
5. **Dependency-health hedge for `@preact/signals-react`**: no support policy for React 19.x; a "signals adapter" seam (so `useSignal/useComputed/useSignalEffect` imports route through one internal module, already largely true via `@cascivo/core`) would limit blast radius.

---------------------------------------------------------------------------------------------

## 2. Beyond React

Evidence of demand/precedent (mixed):
- Shopify deprecated Polaris React in favour of framework-agnostic `s-*` web components from a CDN (late 2025), **without Shadow DOM**; community reaction mixed (missing features, e.g. IndexTable-equivalent) [S InfoQ 2026-10, Shopify community forum].
- Web Awesome (Shoelace 3) raised ~$718-780k on Kickstarter [S FontAwesome blog]; Material Web in maintenance mode (market analysis).
- Ark UI/Zag: the only popular *state-machine-first, multi-framework* design: React/Solid/Vue/Svelte adapters [V READMEs].
- Mitosis (Builder.io) still compiles to React/Vue/Svelte/Solid/Qwik/Angular/Lit but I found no dated 2026 status; treat as low-momentum [S].
- Lit: only Lit 3 / Lit-labs SSR evidence found; React 19 added proper custom-element props support [S].
- Platform tailwinds: Declarative Shadow DOM is Baseline, `@scope` Baseline Newly (2026-03-24), scoped custom element registries exist in Chrome 146/Safari 26 only [V dataset].

What cascivo already has that makes cross-framework cheap (local evidence):
- 159 registry components; manifest `clientJs`: **56 `none`** (pure markup + CSS), **46 `enhancement`**, **57 `required`** (grep of `*.meta.ts`).
- Only **11** component files call `useMachine`; `packages/core/src/machine.ts` is a 20-line wrapper around a plain declarative `{initial, states:{on}}` object. The FSM is trivially portable; the *costly* part of a port is not the FSM but React-shaped helpers (Portal, Presence, FocusScope, DismissableLayer, Slot/asChild, controllable props, roving focus, typeahead, i18n hooks): 21 non-test files in core import React.
- Tokens + 12 themes are pure CSS and already work in Vue/Svelte/Angular/Ghost (docs say so, and a Ghost theme is validated in CI).
- Native `<dialog>`/popover/anchor positioning means *behavior is increasingly the platform's*, which reduces what a port must re-implement.

Options, cheapest first:

| Path | Cost | Value | Verdict |
|---|---|---|---|
| **A. "HTML + CSS recipes" for the 56 `clientJs: none` components** (class/data-attribute contract + copy-paste markup in `llms/<name>.md` and docs), CSS shipped as plain CSS modules -> global CSS bundle | Very low: manifests already enumerate them; CSS already framework-agnostic; need a build step emitting non-hashed class names and a test that renders the markup | Real for Vue/Svelte/Astro/Rails/Ghost users; zero new runtime | **Yes, do this.** Extends the existing "tokens/themes only" row to "tokens + 56 CSS-only components". |
| **B. Machine-spec export** (`createMachine` configs as JSON/`.d.ts`, documented as the interaction contract, plus tiny `~100 LOC` vanilla `bindMachine(el, machine)` with `data-state`) | Low | Gives community ports a reference; serves AI agents; keeps one source of truth | **Yes, opportunistic** - only if A shows pull. |
| **C. Custom elements (Lit) for the ~10 highest-value interactive components** (Dialog, Popover, Tabs, Menu) on top of native `<dialog>`/popover | Medium-high: a second implementation per component, SSR/DSD story, form association, light-DOM vs shadow trade-off (CSS layers + container queries cross shadow boundaries awkwardly; Shopify chose light DOM) | Enterprise "framework independence" optics | **No for now.** It doubles the maintenance and tests surface (a11y matrix, RTL, visual baselines) for a team that already has "two type worlds". Revisit if A yields demand. |
| **D. Mitosis / generated Vue-Svelte-Solid ports** | High (signals + hooks semantics do not map; owned-code CLI would need per-framework output) | Low evidence of momentum | **No.** |
| **E. Adopt Zag/Ark as the multi-framework machine layer** | Very high: abandons cascivo's own micro-FSM and signals story | Contradicts the product thesis | **No.** |

Recommendation: **No to framework-agnostic *components* in 2026; Yes to framework-agnostic *CSS + contracts* (A, then B).** Reasoning: the signal-driven React identity is the differentiation; demand evidence for design-system web components is real but mostly from platform-vendor-scale orgs (Shopify) and contested; cascivo's unfair advantage is that the CSS layer is already portable. [I]

---------------------------------------------------------------------------------------------

## 3. Web platform features (data: web-features 3.43.0, 2026-10-16)

"Baseline" values are the dataset's: **Newly** = in all three engines (date = became Newly), **-** = not Baseline. Cascivo use = grep over packages/{components,themes,tokens,core,layouts}.

| Feature | Chrome / Firefox / Safari (first stable) | Baseline | cascivo today | Call |
|---|---|---|---|---|
| Anchor positioning (core: `anchor-name`, `position-area`, `anchor-size()`, `position-try`) | 125 (area 129) / 147 / 26 | Umbrella **not** Baseline only because `position-visibility: anchor-valid/anchor-visible` is Safari-27-only; every other of 325 keys is Newly | Yes: popover, dropdown, multi-select, share-menu, menu, native-select, tooltip, hover-card (with `@supports`) | **Adopt now** (already). Use `anchors-visible` (aliases are supported Chrome 125, FF 147, Safari 26.2; the new `anchor-visible` name is Safari-27-only - keep the alias). Delete the JS `anchor.tsx` capture-scroll fallback once FF 147+ is the floor (plan Phase 7 trigger is now met). |
| `appearance: base-select` / `::picker(select)` | 135 / none / **27** | - | Yes, NativeSelect, gated | **Progressive** (now 2 of 3 engines; consider promoting NativeSelect as the default select recipe). |
| Interest invokers (`interestfor`) | 142 / - / - | - | No | **Wait.** Chrome-only. |
| Invoker commands (`command`/`commandfor`) | 135 / 144 / 26.2 | **Newly 2025-12-12** | **No** (despite plan text) | **Adopt now** for Modal/Drawer/Sheet/Popover triggers (`command="show-modal"`, `close`, `toggle-popover`): removes open-state JS and the `useEffect`-ish showModal sync. Check @types/react exposes `command`/`commandFor` for the adopter's strict config [I]. |
| `@scope` | 118 / 146 / 17.4 (Safari 26.4 for full) | **Newly 2026-03-24** | No (cli passes it through) | **Adopt now (selectively)**: donut scoping for slot-nesting (`@scope (.card) to (.card-slot)`) and for `data-theme` isolation; keeps inside `@layer`. Watch lightningcss/Tailwind handling (passed through in my test). |
| Scroll-driven animations | 115 / (landing in 151-157, not yet flagged shipped in dataset) / 26 | - | Only large-title-header | **Progressive** (`@supports (animation-timeline: view())`); good for reveal/progress, not for JS state. |
| View transitions, same-document | 111 / 144 / 18 | **Newly 2025-10-14** | Router (`packages/app`) + site only | **Adopt now** in router already; add `view-transition-name` hooks on Tabs/Accordion/Tag lists; pair with React 19.3 `<ViewTransition>`. |
| View transitions, cross-document (`@view-transition`) | 126 / none / 18.2 | - | Site only | **Progressive**; MPA (Astro) recipe. |
| `view-transition-class` | 125 / 144 / 18.2 | **Newly 2025-10-14** | No | **Adopt now** when adding component-level transition names. |
| `@starting-style` | 117 / 129 / 17.5 | Newly 2024-08-06 | **Yes** (33 files) | Done. |
| `field-sizing` | 123 / **152** / 26.2 | **Newly 2026-06-16** | Yes (Textarea, gated) | **Adopt now**; relax gating/docs (COMPATIBILITY lists FF 121 wrongly); extend to Input/TagsInput. |
| CSS `if()` | 137 / - / - | - | 1 hit (core theme.tsx, unrelated) | **Wait / PE only.** |
| `@function` | 139 / - / - | - | `functions.css` (opt-in) | **PE only**; re-test the "minifier drops it" claim (section 1.3 #2). |
| `sibling-index()` / `sibling-count()` | 138 / 154 / 26.2 | **Newly 2026-08-18** | No | **Adopt now** for stagger/index (Toast stack, Timeline, Stepper, list reveals); static fallback = inline `--i` only where you already have one. |
| `text-box` / `text-box-trim` / `text-box-edge` | 133 / 154 / 18.2 | **Newly 2026-08-18** (shorthand + edge) | Yes (Heading, Text; `text text`) | **Adopt now**; consider retiring the "Firefox split" caveat from the plan. |
| `reading-flow` | 137 / - / - | - | No (investigated, no call site) | **Wait.** |
| `:open` pseudo | 133 / 136 / 26.5 | **Newly 2026-05-11** | Only native-select | **Adopt now** to replace `[open]`/`data-state` selectors on details/dialog/select/popover styling. |
| `popover="hint"` | 151 / 153 / - | - | No (`popover="auto"`/`manual` used) | **Progressive**: tooltips/hover cards should be `hint` so they don't close open menus; 2 of 3 engines. Needs the existing JS fallback. |
| `<dialog closedby>` | 134 / 141 / - | - | No (JS light-dismiss) | **Progressive**: set `closedby="any"` and skip JS backdrop-click where supported; Safari still needs JS. |
| `light-dark()` | 123 / 120 / 17.5 | Newly 2024-05-13 | No (rejected by design, ROADMAP-V58 C-1; 12 `[data-theme]` themes) | **Keep rejected** for themes; optional inside light/dark pair only. `light-dark(<image>)` Newly 2026-09-14 is irrelevant. |
| Relative color syntax | 125 / 128 / 18 | Newly 2024-09-16 | **Yes** (19 files) | Done. |
| `contrast-color()` | 147 / 146 / 26 | **Newly 2026-04-10** | Yes, 12 theme files + components, gated | **Adopt now**: Baseline now; keep static fallback (needed for <3 versions old browsers). Note: algorithm is WCAG2-ratio black/white only, not APCA [I - check spec drift]. |
| Scroll-state container queries | 133 / - / - | - | Yes (ScrollArea, DataTable), gated | **Progressive** (Chrome-only; keep JS fallback). |
| CSS carousel (`::scroll-marker`, `::scroll-button`, `scroll-marker-group`) | 135 (markers-target 142) / - / - | - | No | **Wait**; prototype only, a11y semantics moving. |
| Masonry / `display: grid-lanes` | none / none / **26.4** | - | `masonry.module.css` (pre-final syntaxes only) | **Progressive: add `grid-lanes` block now** (see 1.3 #7). |
| Container style queries | 111 / 151 / 18 | **Newly 2026-05-19** | No (deferred in THEMING) | **Adopt now (cautiously)**: unlocks the deferred "palette branching by surface" idea; non-custom-property style() still Chrome-only. |
| Container `name` queries | 148 / 149 / 26.4 | Newly 2026-05-07 | n/a | Note only. |
| `calc-size()` / `interpolate-size` | 129 / - / - | - | calc-size yes (accordion/collapsible), interpolate-size rejected | Keep PE. |
| `attr()` typed | 133 / 155 / - | - | No | Wait. |
| `corner-shape` | 139 / - / - | - | No | Wait (theme flourish). |
| `scrollbar-color/width/gutter` | 121 / 64 / 26.2 | Newly 2025-12-12 | Yes (2 files) | Done. |
| `text-wrap: balance/pretty` | 114/117 / 121 / 17.5 (pretty: Safari 26, no FF) | balance Newly; pretty not | Yes (6 files) | Done. |
| `focusgroup` | none | - | - | Watch (would replace `useRovingFocus`). |

Condensed call list:
- **Adopt now:** `command`/`commandFor` invokers; `@scope`; `:open`; `sibling-index()`; `view-transition-class` (+ names); `contrast-color()` ungated-fallback; `field-sizing` (broaden); `text-box` (done); container style queries (cautious).
- **Progressive enhancement (keep fallback):** base-select (2/3), scroll-driven animations, cross-doc view transitions, `popover="hint"` (2/3), `closedby` (2/3), scroll-state, `grid-lanes`, `@function`/`if()`.
- **Wait:** interest invokers, CSS carousel, `reading-flow`, `attr()`, `corner-shape`, `focusgroup`.

Cross-check with a build tool: lightningcss 1.33.0 parses and preserves every syntax above in the test file (including `::picker(select)`, `@scope`, `sibling-index()`, `@container scroll-state()`, `::scroll-marker`, `interestfor` pseudos, `display: grid-lanes`); the one transformation is `light-dark()` -> a `var(--lightningcss-light, ...)` hack when targeting older browsers.

---------------------------------------------------------------------------------------------

## 4. Design tooling / ecosystem

### 4.1 External state

- **DTCG 2025.10** first stable spec published 2025-10-28 (Display P3 / Oklch / CSS Color 4 spaces, theming via resolver, aliases); not on the W3C standards track [V w3.org/community/design-tokens].
- **Style Dictionary**: first-class DTCG since v4; **full 2025.10 support is "a work in progress in v5"** (issue #1590), resolver support not documented [V styledictionary.com/info/dtcg]. **Terrazzo**: full DTCG, resolver support "planned for 2.0" (docs may lag), `tz check` validates, `tz bundle` merges resolver files [V terrazzo.app/docs].
- **Figma**: Config 2026 (2026-10-15): code layers (open beta), Specs, Figma Motion (dev-mode CSS/JSON/React output, MCP-compatible), design **agent GA 2026-10-06** with Skills/Connectors; MCP server is remote and Code Connect mapping moved into the Figma UI (2025) [V figma.com/blog, S designcompass]. Figma still has **no native DTCG import/export** (plugins only) and variables publishing to team libraries needs a paid plan [V help.figma.com]. I could not confirm whether the Variables REST API is still Enterprise-only (page silent) - check before promising a "sync variables" feature.
- **Penpot**: native tokens with DTCG claims, but a community report says the built-in export is Tokens Studio format, not 2025.10; plugins fill the gap; token Plugins API opened in 2.14, further work 2.16/2.17 (June/July 2026) [S community.penpot.app, DEV]. **Tokens Studio** added a Penpot integration [S tokens.studio].
- **Storybook 10** (Nov 2025: ESM-only, ~29% lighter, module automocking, CSF Factories) and **10.3** (Apr 2026: MCP support for React, a11y upgrades, Vite 8 / Next 16.2 compatibility) [S alternativeto; couldn't confirm 10.4 notes]. Repo pins ^10.4.2.
- **Chromatic**: Free 5k snapshots/mo (Chrome only), Starter $179/mo (35k, + Safari/Firefox/Edge), Pro $399 (85k), TurboSnap [V chromatic.com/pricing].
- shadcn/ui and React Aria both ship MCP/skills/registry features (section 1.4); the "agent-readable DS" bar is moving.

### 4.2 What cascivo has (repo evidence)

- **DTCG 2025.10 export already shipped**: `packages/tokens/dtcg/{cascivo.tokens.json, cascivo.resolver.json, themes/*.tokens.json}` with a 2025.10 resolver and a `theme` modifier; `scripts/tokens/{dtcg.ts,generate-dtcg.ts}`; CI test `scripts/checks/dtcg-export.test.ts`; values DTCG can't express (calc, em, color-mix) are listed rather than guessed. README advertises Figma variables / Tokens Studio / Style Dictionary / Terrazzo loadability. Also `tokens.json` manifest, `style-contract.json`, generated `DESIGN.md`.
- **Storybook 10.4** app with stories generated from manifests (`pnpm stories:generate`), `addon-a11y`, `addon-themes`, plus a Playwright+axe sweep (`axe-sweep.mjs`, `at-sweep.mjs`), a "context-prompt" panel (AI context).
- **Visual regression**: Playwright snapshots on `apps/site` (`test/visual.spec.ts`), 3 themes, **PR job already exists** (`.github/workflows/visual.yml`: on `pull_request` for packages/{components,layouts,tokens,themes}, `scripts/visual/select.ts` picks affected components) plus nightly full run and a `workflow_dispatch update` baseline regenerator; `visual:baselines:check` in `ready`; separate email visual tests. *(The market analysis s8.3 item 4, "visual regression runs nightly only", is out of date.)*
- Compiler leg, rsc:check, rtl:check, host-lint ESLint with adopter plugins, bare-page, pack/isolated checks.

### 4.3 What cascivo lacks

| Gap | Evidence | Why it matters | Suggested move |
|---|---|---|---|
| **No Figma kit / Code Connect / variables sync** | ROADMAP "Later: Design-tool bridge"; no `figma`/`code-connect` file in repo (grep) | Gate for design-team and enterprise adoption (market analysis s4); Figma's agent/Specs/MCP world rewards a DS with machine-readable components | Cheapest path: DTCG -> Figma variables via Tokens Studio or a plugin (no REST dependence), plus Code Connect mappings **generated from `.meta.ts`** (props/variants already structured). Publish a community Figma file, not a paid kit. |
| **No consumer of the DTCG output proven in CI** (Style Dictionary 5 / Terrazzo) | `dtcg-export.test.ts` validates structure; no test that SD or Terrazzo actually *builds* from it | README claims loadability; SD v5 2025.10 support is still WIP, Penpot export isn't DTCG - claims could rot | Add a CI job: `tz check`/`tz build` on `dtcg/` (Terrazzo supports 2025.10 fully) and an SD-5 smoke build; document SD caveat. |
| **Tokens Studio / Penpot recipes** | not in docs | Easy adopters win | One docs page: import `dtcg/` into Tokens Studio, Penpot (via DTCG plugin), Figma. |
| **No hosted visual review/baseline UI** (Chromatic or equivalent) | Playwright PNG diffs uploaded as artifacts only | Review ergonomics, cross-browser (Firefox/Safari) baselines: repo baselines are Chromium only | Optional: Chromatic Free covers Chrome only (5k snaps) - low value; better to add WebKit/Firefox projects to the existing Playwright run for the progressive features in section 3 (base-select, popover hint, scroll-state vary by engine). |
| **No cross-browser visual/behaviour tests for progressive CSS** | `fallback:check` verifies *source* has fallbacks, not that fallback *renders* | Every PE feature in section 3 has an untested "no-support" path | Run the fallback leg in Playwright WebKit/Firefox (cheap, already installed via Playwright). |
| **Storybook MCP / CSF Factories not adopted** | stories generated; no MCP addon in apps/storybook/package.json | Storybook 10.3 ships MCP for React; cascivo already has its own `@cascivo/mcp` - overlap, so low priority | Evaluate only for "publish Storybook MCP as second AI surface". |
| **Storybook vs React 19.3 / Cache Components / compiler** | none | - | Covered by 1.5 #1. |

---------------------------------------------------------------------------------------------

## Priority summary

Frameworks: (1) CI matrix for React 19.3 + Next 16.4 Cache Components + reactCompiler; (2) SSR-safety audit for module-scope signals (i18n/storage); (3) fill COMPATIBILITY rows (React Router 8, TanStack Start 1.0, Waku/Redwood/Remix 3/Expo statements) and a React-floor policy; (4) adopt `<ViewTransition>`/Fragment refs/`browser()` where they remove code.

Platform: ship `command/commandFor`, `@scope`, `:open`, `sibling-index()`, `view-transition-class`, `grid-lanes`, `popover=hint`/`closedby` progressively; fix four stale doc claims (section 1.3 #1-#5, #7).

Tooling: Figma/Code Connect bridge generated from manifests; CI-prove the DTCG output with Terrazzo + SD5; WebKit/Firefox legs for progressive CSS; publish Tokens Studio/Penpot import recipe.

---------------------------------------------------------------------------------------------

## Sources

- React blog index / 19.3: https://react.dev/blog , https://react.dev/blog/2026/09/09/react-19-3
- Next.js 16.4 (2026-10-06): https://nextjs.org/blog/next-16-4 ; blog index https://nextjs.org/blog ; Next 16: https://nextjs.org/blog/next-16
- React Router changelog: https://reactrouter.com/changelog
- TanStack blog: https://tanstack.com/blog ; Start v1 announcement: https://tanstack.com/blog/announcing-tanstack-start-v1
- Astro blog: https://astro.build/blog/
- Vite 8: https://vite.dev/blog/announcing-vite8 ; Rolldown 1.0: https://voidzero.dev/posts/announcing-rolldown-1-0
- Remix 3 beta (InfoQ): https://www.infoq.com/news/2026/07/remix-3-beta-preview ; https://www.infoq.com/news/2025/08/remix-run-v3-drops-react
- RedwoodSDK: https://rwsdk.com/blog/redwoodsdk-v1-beta ; Waku (secondary): https://blog.openreplay.com/waku-react-server-components-without-nextjs/
- Expo SDK 56: https://expo.dev/changelog/sdk-56 ; Expo compiler docs: https://docs.expo.dev/guides/react-compiler/ ; React Strict DOM: https://github.com/facebook/react-strict-dom ; RNW maintenance note: https://itnext.io/react-native-web-enters-maintenance-mode-a-drop-in-photo-gallery-and-the-strictest-button-ever-872c57a76c94
- Preact 11 status (secondary): https://blog.openreplay.com/whats-new-preact-2026/
- preactjs/signals: releases https://github.com/preactjs/signals/releases ; changelog https://github.com/preactjs/signals/blob/main/packages/react/CHANGELOG.md ; issue 652 https://github.com/preactjs/signals/issues/652 ; open react issues https://github.com/preactjs/signals/issues?q=is%3Aissue+is%3Aopen+label%3Areact
- shadcn changelog: https://ui.shadcn.com/docs/changelog
- Base UI 1.0 notes: https://app.unpkg.com/@base-ui/react@1.6.0/files/docs/react/overview/releases/v1-0-0.md ; MUI 2026: https://mui.com/blog/2026-and-beyond/
- Radix status (secondary): https://www.pkgpulse.com/guides/shadcn-ui-vs-base-ui-vs-radix-components-2026
- React Aria: https://react-spectrum.adobe.com/react-aria/ssr.html ; https://react-aria.adobe.com/releases/v1-0-0
- Ark/Zag: https://www.zagjs.com ; https://cdn.jsdelivr.net/gh/chakra-ui/ark@main/README.md
- Mantine 9 migration: https://mantine.dev/guides/8x-to-9x
- Chakra v3: https://chakra-ui.com/blog/announcing-v3
- HeroUI v3: https://heroui.com/docs/react/releases/v3-0-0 ; https://infoq.com/news/2026/07/heroui-v3-rewrite
- Shopify web components (InfoQ): https://infoq.com/news/2026/10/shopify-web-components ; community: https://community.shopify.dev/t/polaris-react-migration-to-web-components/25672
- Web Awesome: https://blog.fontawesome.com/web-awesome-kickstarter/
- Mitosis: https://github.com/BuilderIO/mitosis
- web-features dataset: https://www.npmjs.com/package/web-features (3.43.0, parsed from https://cdn.jsdelivr.net/npm/web-features@latest/data.json); WebKit Grid Lanes: https://webkit.org/blog/17660/introducing-css-grid-lanes/ ; Firefox 157 notes: https://developer.mozilla.org/Firefox/Releases/157
- DTCG 2025.10: https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/ ; Style Dictionary DTCG: https://styledictionary.com/info/dtcg/ ; Terrazzo: https://terrazzo.app/docs/
- Figma blog: https://www.figma.com/blog/ ; Config recap: https://www.figma.com/blog/config-2026-recap/ ; Variables guide: https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-the-Variables-REST-API ; MCP/Code Connect 2025: https://www.figma.com/blog/design-context-everywhere-you-build/
- Penpot tokens: https://penpot.app/collaboration/design-tokens ; community export thread: https://community.penpot.app/t/token-export-is-tokens-studio-format-not-dtcg-2025-10/10544
- Storybook 10: https://alternativeto.net/news/2025/11/storybook-10-debuts-esm-only-29-lighter-module-automocking-and-typesafe-csf-factories ; 10.3: https://alternativeto.net/news/2026/4/storybook-10-3-brings-mcp-for-react-accessibility-upgrades-and-expanded-csf-factories
- Chromatic pricing: https://www.chromatic.com/pricing

Local evidence files: docs/COMPATIBILITY.md; docs/USING-WITH-{NEXTJS,ASTRO,PREACT,A-ROUTER}.md; docs/plans/modern-css-adoption-plan.md; docs/THEMING.md (light-dark rationale); docs/internal/market-analysis-2026-09.md s2.4-2.6, s4, s8.3; pnpm-workspace.yaml (catalog); apps/examples/react-next/next.config.ts; apps/examples/react-vite/vite.compiler.config.ts; packages/i18n/src/locale.ts; packages/core/src/{machine.ts,pure.ts}; packages/layouts/src/masonry/masonry.module.css; packages/tokens/dtcg/; .github/workflows/visual.yml; ROADMAP.md.
Scratch evidence: scratchpad/lcss/t.js (lightningcss 1.33.0 test), scratchpad/wf/data.json (web-features dump).
