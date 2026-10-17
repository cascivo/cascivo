# cascivo × Astro — empirical compatibility investigation

Date: 2026-10-17 · Repo HEAD `d0f3e44f` · cascivo `@cascivo/react` 1.9.0 / `@cascivo/core` 1.9.0 / `@cascivo/themes` 1.0.3 / CLI `cascivo` 1.8.0
Lab: a temporary session directory (`astro-lab/`, no longer available; the sources the plan needs are in [`01-astro-lab-sources.md`](./01-astro-lab-sources.md)) (every project installs cascivo **from `pnpm pack` tarballs, outside the monorepo**, with `pnpm-workspace.yaml` overrides pinning every inter-cascivo edge — the same technique as `scripts/checks/framework-install.test.ts`).
Browser checks: Playwright 1.61 driving the preinstalled Chromium 141 headless shell (`/opt/pw-browsers/chromium_headless_shell-1194`).

No tracked file in the repo was modified (only `pnpm install` + package builds, all gitignored).

---

## 0. Versions on npm today, and what changed in Astro

| Package | Latest | Notes |
| --- | --- | --- |
| `astro` | **7.4.0** (2026-10-15) | Vite ^8.3.4 + Rolldown, `@astrojs/compiler-rs` (Rust compiler), `@astrojs/markdown-satteri` |
| `@astrojs/react` | **7.1.0** (2026-10-15) | Vite ^8, `@vitejs/plugin-react` ^6, optional peer `oxc-transform-react` |
| `@astrojs/preact` | 6.1.0 | |
| `@astrojs/mdx` | 8.1.0 | |
| `@astrojs/starlight` | 0.42.6 | peer `astro ^7.2.10` |
| `@astrojs/node` | 11.1.8 | |
| `@astrojs/check` | 0.9.10 | **refuses TypeScript 7** (now `latest` on npm): "astro check does not currently support TypeScript 7.0"; Astro says `astro check` will be deprecated for `@astrojs/ts-content-mapper` |

Astro features relevant to cascivo, as present in 7.4.0's source:

- **Vite Environment API.** Astro runs separate Vite environments `ssr`, `client`, `astro` (dev-only runnable) and **`prerender`** (`ASTRO_VITE_ENVIRONMENT_NAMES` in `astro/dist/core/constants.js`). This is why `vite.ssr.*` options do not reach static prerendering and why `resolve.noExternal` (applied per-environment) is the key that works.
- **Framework-package crawl.** `astro/dist/core/create-vite.js` uses `vitefu.crawlFrameworkPkgs` and treats a dependency as an "Astro framework package" when its `package.json` has `peerDependencies.astro`, `dependencies.astro`, `keywords` containing `"astro"` or `"astro-component"`, or a name matching `astro-*`. `vite-plugin-environment/index.js` then puts those packages into **`resolve.noExternal` of the ssr/prerender/astro/client environments**. This is the zero-config hook cascivo can use (§3, root cause R1).
- **`<ClientRouter />` view transitions** with `transition:persist`; on browsers with `Element.prototype.moveBefore` Astro moves persisted islands without detaching them (`transitions/swap-functions.js`).
- **Server islands** (`server:defer`), on-demand SSR via adapters, **stable CSP** (`security.csp`, auto-hashes inline scripts), **Fonts API** (`fonts: [...]`), sessions, Actions, Content Layer. Experimental flags in 7.4: `clientPrerender`, `incrementalBuild`, `parallelPrerender`, `svgOptimizer`, …
- **`astro dev` / `astro preview` are now singleton background daemons per project** ("Dev server already running at … Stop: astro dev stop"). A second `astro dev` in the same project silently attaches to the first one — this bit the test harness and will bite any CI script that starts dev twice.

---

## 1. Pass/fail matrix

Legend: ✅ pass · ❌ fail · ⚠️ works with caveat · — not applicable. "cfg" = `vite.resolve.noExternal: [/^@cascivo\//]`. "kw" = the proposed zero-config fix (`"astro-component"` keyword in `@cascivo/react`'s package.json, tested with a repacked tarball, **no** config).

### 1a. Styling + hydration per directive (`lab/`, Astro 7.4.0 + @astrojs/react 7.1.0, tarball install)

Measured by (1) `check-css.mjs`: every `_name_hash_line` class in built HTML has a rule in linked/inline CSS; (2) Playwright computed style of the Card (`background-color`, `border-radius`) and a click on a signal counter.

| Directive | build, no cfg | build, `ssr.noExternal` | build, cfg | build, kw (no cfg) | dev, no cfg | dev, cfg | dev, kw |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `client:load` | ❌ unstyled forever (5/5 classes unmatched; card `bg rgba(0,0,0,0)`, radius 0) — hydrates OK | ❌ same | ✅ | ✅ | ⚠️ SSR HTML has 0 card rules → FOUC until hydration, then styled | ✅ | ✅ |
| `client:visible` | ❌ | ❌ | ✅ | ✅ | ⚠️ FOUC | ✅ | ✅ |
| `client:idle` | ❌ | ❌ | ✅ | ✅ | ⚠️ FOUC | ✅ | ✅ |
| `client:only="react"` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| no directive | ❌ unstyled, no JS | ❌ | ✅ | ✅ | ❌ unstyled | ✅ | ✅ |
| 11 complex comps (Modal, Tabs, Accordion, Select, Combobox, DataTable, Tooltip, Popover, Menu, DatePicker) `client:load` | ❌ 65/65 unmatched | ❌ | ✅ modal `:modal`, popover opens, tabs switch, no dup ids | ✅ | ⚠️ | ✅ | ✅ |
| same, no directive | ❌ | ❌ | ✅ renders, builds, no window/document crash, no dup ids (inert, as expected) | ✅ | ❌ | ✅ | ✅ |
| `astro preview` | same as build column | | ✅ | ✅ | | | |
| **`cascivo create --framework astro` scaffold** (tarballs) | — | — | ✅ build: 3 routes, 0 unmatched, 1 island/page; dev & preview: console clean, hydrated; `astro check` 0 errors | | | ✅ | |

Hydration itself never failed: clicks incremented in every hydrated variant. Only CSS was missing.

### 1b. Everything else

| # | Area | Result | Evidence |
| --- | --- | --- | --- |
| b1 | No-flash theme with `themePreloadScript()` inline in `<head>` | ✅ | persisted `dark`: `data-theme` already `dark` at DOMContentLoaded, history `["dark@13","dark@81"]` (preload, then ThemeProvider) |
| b2 | Theme without preload script | ❌ flash | DOMContentLoaded `light` → `dark@88ms` (build), `@521ms` (dev) |
| b3 | `useTheme()` in an SSR'd island | ❌ hydration error | build: `Minified React error #418 (text)`; dev: "Hydration failed because the server rendered text didn't match the client" — server renders `Theme: light`, client `Theme: dark` |
| b4 | Theme persists across full navigations (MPA) | ✅ | `["dark","dark"]` after link nav (preload re-runs) |
| c1 | `<ClientRouter/>` soft nav: islands on new page hydrate | ✅ | modal opens on page B after soft nav |
| c2 | CSS / cascade layers survive soft nav | ✅ with cfg/kw · ❌ without (card unstyled on B even in dev) | |
| c3 | `transition:persist` with a signal island | ✅ | counter `Count 2` survives A→B, increments to 3, back nav → 4 |
| c4 | **Theme across soft nav** | ❌ **reverts to `light`** | `vt2 theme after soft nav A->B: ["page b","light"]`; ClientRouter copies the incoming SSR `<html data-theme="light">` attributes; head preload script does not re-run. Wrong theme until a ThemeProvider island (if any) hydrates |
| c5 | Navigate from a link inside an open (non-persisted) Modal | ✅ | after nav: 0 `dialog[open]`, 0 `:modal`, `html.inert=false`, page clickable |
| c6 | Open popover, then soft nav | ✅ | closed, not orphaned |
| c7 | Open Modal/popover inside a `transition:persist` island, Chromium (has `moveBefore`) | ✅ | modal still `:modal` on next page; popover still open |
| c8 | Same, browser **without `moveBefore`** (simulated: `delete Element.prototype.moveBefore` in Chromium; real Safari/Firefox UNTESTED — not installed) | ❌ | modal degrades to non-modal `<dialog open>` (`modal:0`), **Escape no longer closes it** (stuck open); open popover silently closes while island state still says open |
| c9 | Fresh island reading a module signal after soft nav | ⚠️ #418 | `SharedA` server-renders `A sees 0`, client has `1` (module state survives soft nav) → hydration mismatch |
| d1 | Two islands sharing a module-level `signal()` (build + dev) | ✅ | `A sees 2` / `B sees 2` |
| d2 | `useToast()` in island X, `<ToastProvider>` in island Y | ✅ | toast rendered by other island (module-level `toastQueue`) |
| d3 | `ThemeProvider` in one island, `useTheme` toggle in another | ✅ (state) / ❌ (b3 mismatch) | toggle writes `localStorage` + `data-theme` |
| d4 | **Compound components composed in `.astro`** (`<Tabs><TabsList><TabsTrigger>…` directly in the page) — no directive | ❌ **silent content loss** | HTML: `<div class=…><div role="tablist"></div></div>` — 0 tabs, 0 panels, no text, no error |
| d5 | Same with `<Tabs client:load>` and `.astro` children | ❌ silent content loss **and** ships whole library | 0 tabs; island `component-url` = the `@cascivo/react` barrel → client JS **326 KB** + CSS **331 KB** (vs 29 KB JS + 8 KB CSS through a local `.tsx` wrapper) |
| d6 | Popover/Menu parts composed in `.astro` | ❌ build error (loud) | `PopoverTrigger must be used inside <Popover>` (throws, unlike Tabs) |
| e1 | `cascivo init` + `cascivo add button modal data-table combobox tabs` in a fresh Astro 7.4 project (hand-made minimal template + `astro add react`) | ✅ | files → `src/components/ui/<name>/`, deps (popover, checkbox, editable, overflow-menu, dropdown, spinner) resolved, relative imports, `@cascivo/i18n` auto-installed; **vanilla `astro.config` builds styled (34/34 classes)**, dev+preview console clean, `astro check` 0 errors (TS 5.9) |
| e2 | CLI Astro awareness | ⚠️ none | `init` prints SPA "entry file" advice; `doctor` on an Astro + `@cascivo/react` app **without** the required config reports nothing |
| f1 | Preact compat, SSR'd island (`client:load`), build | ❌ (confirms doc) | `TypeError: Cannot read properties of null (reading 'useRef')` at `react.production.js` ← `@preact/signals-react/runtime` |
| f2 | + inline `@preact/signals-*` / `resolve.noExternal: true` / inline preact+react | ❌ new error | `Cannot read properties of undefined (reading '__H')` in `preact/hooks` — two Preact instances (CJS `preact/compat/dist/compat.js` vs the renderer's ESM preact) |
| f3 | Preact compat, SSR'd island, **dev** | ❌ | same `useRef` null |
| f4 | `client:only="preact"`, build + dev | ✅ **refutes doc** | hydrated, click increments, console clean, 35 KB island chunk |
| g1 | Static (no-directive) render of complex components | ✅ | 11 components incl. DataTable/DatePicker/Modal render at build, no `window` crash, no duplicate ids across islands |
| g2 | Static render of `clientJs: 'required'` components | ⚠️ by design | 57 registry components are `clientJs: 'required'` (e.g. Modal, Tabs switching) — inert without a directive, nothing warns |
| h1 | cascivo in MDX (`@astrojs/mdx`) — static + `client:load` | ✅ build · ⚠️ dev | dev: MDX `layout:` frontmatter loads the layout's CSS **after** the page's component CSS → `@layer` order statement is not first → `cascivo.reset` beats `cascivo.component` (Alert `padding-top: 0px` in dev vs `16px` in build) |
| h2 | Starlight 0.42.6 + cascivo via `customCss` + React in MDX | ✅ | styled, island hydrates, console clean; **Starlight's theme picker drives cascivo dark mode for free** (both use `<html data-theme="light|dark">`): card bg flips `oklch(0.985…)` ↔ `oklch(0.185…)` |
| i1 | Console on hydrated pages | ✅ except b3/c9 | DataTable without `title` in dev also logs React "Cannot update a component while rendering a different component (DataTable)" — not Astro-specific, not isolated |
| x1 | Server islands (`server:defer`, `@astrojs/node`) | ✅ with cfg · ❌ without | island CSS hoisted into page CSS, nested `client:load` hydrates |
| x2 | **On-demand SSR: cross-request state leak** | ❌ | `/leak` → `light`, `/leak?t=dark` → `dark`, **`/leak` → `dark`**, `/leak?t=midnight` → `midnight`, **`/leak` → `midnight`** (module-level theme store is process-global on the server) |
| x3 | CSP (`security.csp: true`) with an integration-injected `head-inline` theme script | ✅ | script's sha256 present in the emitted CSP meta |
| x4 | Scaffold dependency pins | ❌ stale | scaffold pins `@astrojs/react ^5.0.0` with `astro ^7.0.0` → installs **two Vites** (7.3.7 + 8.3.4) and prints **21** `esbuild`/`optimizeDeps.esbuildOptions` deprecation warnings per build. The monorepo fixture/lock has the same pair (`astro 7.1.4` + `@astrojs/react 5.0.7`). With 7.1.0: 0 warnings |
| x5 | CSS over-delivery (cfg) | ⚠️ perf | page with only `<Panel>` links a 57 KB `Rich.css` chunk (other pages' components) because the bundled `@cascivo/react` lands in shared server chunks; dev injects **159** component `<style>` tags per page (whole barrel) |

---

## 2. Root causes

### R1 — `@cascivo/react` is externalized in Astro's server/prerender builds (cascivo-side, fixable with zero config)
Vite externalizes `node_modules` deps in server environments; Node then imports `@cascivo/react` at runtime, its module graph (and its `import './x.css'` edges) is never walked, and Astro collects page CSS by walking that graph. Confirmed again on Astro 7.4: build unstyled, dev FOUC, server islands unstyled. `vite.ssr.noExternal` does nothing (prerender env). The required `resolve.noExternal` line is what the scaffold writes; adopters who `astro add react && pnpm add @cascivo/react` never see it.

**New finding:** Astro already auto-inlines "framework packages" detected by `isFrameworkPkgByJson` (keyword `astro`/`astro-component`, or an `astro` peer/dep). Adding `"astro-component"` to `@cascivo/react`'s `keywords` made the **vanilla** config pass every directive in build, dev, MDX, and VT (verified with a repacked tarball, `lab-kw/`). The dev request profile was identical to the explicit config (191 requests, 159 cascivo). This is one line of metadata, works for every Astro ≥ the vitefu crawl (long-standing), and leaves non-Astro tools untouched. Caveat: it is a heuristic Astro owns; the `@cascivo/astro` integration (below) should still set `resolve.noExternal` explicitly as belt-and-braces, and a CI arm must pin the behaviour.

### R2 — Astro composes components across island boundaries; React context does not cross them (Astro architecture; cascivo makes it silent)
In `.astro` files each JSX component is rendered independently; children are pre-rendered HTML passed as slots. So `TabsTrigger`/`TabsContent` render with no `TabsContext` → cascivo returns `null` (`tabs.tsx:125,176`) → content silently disappears. Popover/Menu throw instead (loud, good). Hydrating a library export directly (`<Tabs client:load>` imported from `@cascivo/react`) makes the barrel the island entry, so tree-shaking cannot drop anything: 326 KB JS + 331 KB CSS, which then pollutes every other island's shared chunk (even `client:only` pages got the 355 KB CSS).

### R3 — Theme runtime assumes one document lifetime and one request (cascivo-side)
- `useTheme()` returns the persisted client value during the hydration render → #418 whenever the persisted theme ≠ SSR default (`packages/core/src/theme.tsx` `useTheme`/`themeStore`).
- `themePreloadScript()` only runs at parse time; `<ClientRouter>` swaps `<html>` attributes to the new SSR document's `data-theme` → theme reverts on every soft navigation.
- The theme store is a module singleton; on the server, `ThemeProvider value=…` writes it during render → leaks into the next request (x2). Same class of hazard: `toastQueue` (toast.tsx) and any app-level module signal in SSR.

### R4 — Layer order depends on CSS arrival order (cascivo-side robustness)
Component CSS files are `@layer cascivo.component{…}` with no order statement (`dist/card/card.css`). Whichever stylesheet arrives first fixes the order. Astro's dev CSS collection for MDX with `layout:` frontmatter puts the page's component CSS before the layout's `layers.css`, so reset/base end up above components. Build happened to be fine; dev was wrong.

### R5 — Preact under Astro (mostly upstream)
SSR'd islands: `@preact/signals-react` external → Node resolves bare `react` to real React → null dispatcher (`useRef`). Inlining it exposes the next layer: preact/compat resolves to its CJS build while the renderer's preact is ESM → dual Preact instances (`__H`). That is an `@astrojs/preact` compat/aliasing problem, not fixable from cascivo alone. `client:only="preact"` **works** today — the doc's claim that it crashes client-side is stale.

### R6 — Non-`moveBefore` browsers lose top-layer state in persisted islands (platform + cascivo)
Re-inserting an open modal `<dialog>` drops it from the top layer; `Modal` keeps believing it is open (Escape is dead). Popover is closed by the platform without notifying cascivo's signal.

### R7 — Scaffold/fixture drift (cascivo-side)
`packages/cli/src/commands/create.ts:851` pins `@astrojs/react ^5.0.0` against `astro ^7.0.0`; `apps/examples/astro-islands/package.json` uses `"@astrojs/react": "^5"`. Two Vite majors in one app.

### R8 — CI blind spots
`framework:check` (Astro arm) only runs `astro build` + HTML/CSS class matching. It never runs `astro dev`, never opens a browser, never checks hydration/console, VT, theme, MDX, `client:only`, or compound composition, and its negative arm hard-codes "removing the config must break" — which will (correctly) start failing the day R1's keyword fix lands.

---

## 3. Fix proposals (prioritized)

### P0 — zero-config styling (R1)
1. **`packages/react/package.json`**: add `"astro-component"` to `keywords` (also `packages/charts`, `ai`, `editor`, `flow` — every package with CSS-bearing modules; harmless elsewhere). Verified fix.
2. **`scripts/checks/css-contract.test.ts`** (or a new `astro-keyword.test.ts`): assert every CSS-bearing package that ships a `node` twin carries the keyword, mirroring the existing `module`-before-`node` guard.
3. **`scripts/checks/framework-install.test.ts`**: flip the negative arm: a *vanilla* `astro.config.mjs` must now build styled; the canary becomes "repack `@cascivo/react` **without** the keyword → unstyled".
4. **`packages/cli/src/commands/create.ts`** (`astroConfig`, ~line 875): keep the explicit `noExternal` (or replace with the integration from P1); bump `'@astrojs/react': '^7.1.0'` (line ~851). **`apps/examples/astro-islands/package.json`**: `@astrojs/react ^7`, refresh lock.
5. **`docs/USING-WITH-ASTRO.md`, `docs/COMPATIBILITY.md`**: "zero config from vX.Y"; keep the manual line for older versions.

### P1 — first-party `@cascivo/astro` integration (new `packages/astro/`)
Prototype (`lab-int/cascivo-astro.mjs`, ~30 lines) passed build + dev for every directive, MDX dev layer order, no-flash theme, **and theme persistence across ClientRouter**, and its inline script was auto-hashed under `security.csp`. Shape:

```js
cascivo({ theme: '@cascivo/themes/light-dark.css', storageKey, defaultTheme })
// astro:config:setup
updateConfig({ vite: { resolve: { noExternal: [/^@cascivo\//] }, plugins: [layersVirtualModule] } })
injectScript('page-ssr', `import 'virtual:cascivo/layers.css'; import '${theme}';`) // layer order first, theme once
injectScript('head-inline', pre + `document.addEventListener('astro:after-swap',()=>{${pre}})`) // no flash + VT-safe
```
Add next:
- **Dev toolbar app** (`addDevToolbarApp`): flag (a) cascivo compound parts rendered outside their root (TabsTrigger etc. in `.astro`), (b) `clientJs: 'required'` components (from `registry.json` manifests) used with no `client:*` directive, (c) islands whose `component-url` is the `@cascivo/react` barrel (the 300 KB trap), (d) unloaded theme CSS.
- **`.astro` wrappers** (`@cascivo/astro/components`): `<ThemeScript/>` (for users who don't want `injectScript`), optional `<CascivoHead/>`. Do **not** wrap every React component in `.astro` — that cannot fix R2 (context still does not cross).
- **`astro add @cascivo/astro`** works automatically if the package has the `astro-integration` keyword.
- Files: `packages/astro/{package.json,src/index.ts,src/toolbar.ts,src/theme-script.ts}`, `apps/site` + `apps/storybook` Vite aliases (CLAUDE.md rule), `docs/USING-WITH-ASTRO.md`, `packages/cli/src/commands/create.ts` (emit `integrations: [react(), cascivo()]`), changeset.

Zero-config (P0) and the integration are complementary: P0 makes the naive path render styled; P1 owns everything that needs page-level injection (layer order, theme, VT, linting) — no package-exports trick can inject a head script.

### P1 — theme runtime (R3) — `packages/core/src/theme.tsx`
- Hydration-safe `useTheme`: return the SSR default (`config.defaultTheme`) until mounted, then the persisted value (a `useSyncExternalStore` with `getServerSnapshot`, or a `hydrated` signal flipped in `useSignalEffect`); document that theme-dependent *visuals* should be CSS (`[data-theme=dark] &`).
- `themePreloadScript({ viewTransitions: true })`: also re-apply on `astro:after-swap` (generic: any `*:after-swap`-style event name option).
- Server isolation: never mutate the module store when `typeof window === 'undefined'`; resolve controlled `value` per render (React context *inside core*, or `React.cache`-scoped store). Regression test: two sequential `renderToString` calls with/without `value`.
- Same audit for `toastQueue` (`packages/components/src/toast/toast.tsx`): `enqueue` should no-op on the server.

### P1 — compound components in `.astro` (R2)
- `packages/components/src/tabs/tabs.tsx` (and Accordion parts): replace silent `null` with a dev error/warning naming the Astro cause ("TabsTrigger rendered outside <Tabs> — in Astro, compose compound components inside one .tsx island"). Bring Tabs in line with Popover/Menu which already throw.
- Docs: "Compose in `.tsx`, hydrate the wrapper; never `client:*` a `@cascivo/react` export directly from `.astro`" with the measured 326 KB/331 KB numbers.
- Consider per-component subpath exports (`@cascivo/react/tabs` → `dist/tabs/tabs.js`, already emitted per component) so a direct island costs one component, not the library — needs per-entry `.d.ts` (today types are flattened into `dist/index.d.ts`), so P2.

### P2 — layer robustness (R4)
Prepend the canonical order statement (`@layer cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.override;`, idempotent) to every emitted component CSS file in `packages/react/vite.config.ts` (and the registry CSS for owned code). ~120 B per file before gzip; removes the "import layers.css first" footgun everywhere, not only Astro. Guard in `pnpm layers:check`.

### P2 — persisted overlays (R6)
`Modal`: on reconnection (`useSignalEffect` + `isConnected`/`astro:after-swap`), if `open` signal is true and `!dialog.matches(':modal')`, call `close()` then `showModal()`. `usePopover`: listen to the native `toggle` event and sync the signal (fixes any external close, not just Astro). Document that browsers without `moveBefore` lose top-layer state.

### P2 — CLI awareness (e2)
`cascivo init`/`doctor`: detect `astro.config.*`; print Astro-shaped guidance (Layout.astro import, `client:*`, `@cascivo/astro`) and in `doctor` warn when `@cascivo/react` is used with neither the integration, the keyword-bearing version, nor `resolve.noExternal`. Files: `packages/cli/src/commands/{init,doctor}.ts`.

### P2 — Preact (R5)
Update `docs/USING-WITH-ASTRO.md`: `client:only="preact"` works (verified build+dev, Astro 7.4/@astrojs/preact 6.1); SSR'd Preact islands still fail (`useRef` null → `__H` dual instance). File upstream issue with the minimal repro in `astro-lab/lab-preact/`.

---

## 4. CI gate design — `pnpm framework:check`, Astro arm v2

Keep the existing tarball machinery (`scaffold()` in `scripts/checks/framework-install.test.ts`). Add a **hand-written "naive adopter" fixture** (not the scaffold) because the scaffold hides exactly the bugs adopters hit:

1. Install from tarballs: `astro@latest`, `@astrojs/react@latest`, `@astrojs/mdx`, cascivo tarballs; **vanilla** config (after P0) / `cascivo()` integration (after P1) as two variants.
2. Pages (one directive per page, like `apps/examples/astro-islands`): `load`, `visible`, `idle`, `only`, `none`, `mdx`, `vt/a`+`vt/b` (ClientRouter, `transition:persist`), `shared` (two islands + Toast), `theme`.
3. `astro build` → existing class-matching assertion **plus** "no island `component-url` points at `@cascivo/react`'s barrel".
4. `astro preview` + `astro dev` (stop with `astro dev stop` — they are daemons now) → Playwright (preinstalled Chromium): computed style is themed on first response HTML (fetch SSR HTML: card rule present), clicks hydrate, zero `pageerror`/`#418`, theme survives soft nav, layer statement is the first layer rule (dev MDX case).
5. Negative arms (non-vacuity): repack `@cascivo/react` without the keyword → unstyled; remove the integration's after-swap → theme reverts.
6. Weekly scheduled run against `astro@latest`/`@astrojs/react@latest` (not just the lockfile), so the next Astro major is caught before an adopter reports it.

Runtime cost: one extra install (~5 s warm) + ~3 builds + ~60 s browser.

---

## 5. Not tested / limits

- Real Safari/Firefox (only Chromium 141 is installed; non-`moveBefore` behaviour simulated by deleting the method).
- `astro create` official templates (giget download failed: "Template minimal could not be found"); used an equivalent hand-made minimal project + `astro add react`.
- The hosted registry (`https://cascivo.com/registry.json`, same byte size as the repo's `registry.json`) was used for `cascivo add`, not the local build.
- Fonts API, Actions, Content Layer: no cascivo interaction expected; not exercised beyond Starlight's content collection. Fonts API could feed `--cascivo-font-sans` via the integration (design idea only).
- ThemeProvider's *controlled* inline `<script>` under `security.csp` (rendered by React, likely un-hashed) — not tested.
- The DataTable "Cannot update a component while rendering" dev error was observed in Astro dev but not isolated.

## 6. Repro index (all under `astro-lab/`)

`tarballs/` packed packages · `wire.mjs` tarball wiring · `check-css.mjs` class/rule matcher · `probe.mjs` full Playwright probe · `quick.mjs`, `click.mjs`, `order.mjs`, `persist.mjs`, `persist-nomove.mjs`, `starlight.mjs`, `si.mjs`, `reqs.mjs` focused probes · `scaffold/` (`cascivo create --framework astro`) · `lab/` (main matrix; `NOEXT=0`, `SSRNOEXT=1` env switches) · `lab-kw/` (keyword fix) · `lab-int/` (integration prototype `cascivo-astro.mjs`) · `lab-min/` (barrel-island isolation) · `owned/` (`cascivo add`) · `lab-preact/` (`V=0..4` variants) · `lab-starlight/` · `lab-si/` (server islands + `/leak`) · logs `probe-*.log`, `build-*.log`, `preact-build-*.log`.
