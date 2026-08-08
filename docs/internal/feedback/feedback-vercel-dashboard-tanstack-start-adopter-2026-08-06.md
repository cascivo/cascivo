# Experience report — Vercel-like dashboard with TanStack Start + cascivo

**Date:** 2026-08-06
**Framework:** TanStack Start 1.170 (Router, file routes, server functions) + TanStack Query 5, React 19, Vite 8, SSR on
**cascivo:** CLI `0.7.1`, registry `0.16.0`, copy-paste path (`cascivo init` + `cascivo add`), `@cascivo/core` 0.16.0, `@cascivo/charts` 0.16.0, `@cascivo/themes` 0.4.10, `@cascivo/icons` 0.3.7
**Scope built:** 9 routes — overview, projects grid, project detail (deployments / analytics / build logs / settings), team-wide observability, streaming runtime logs, team settings. ~45 cascivo components vendored.
**Outcome:** builds, typechecks, lints clean; all 9 routes server-render and hydrate with zero console errors.

---

## What went well

1. **Discovery is a single command.** `npx cascivo list` printed the entire catalog — name, category, one-line description — grouped by channel (copy-paste / npm / blocks / charts / layouts / sections / flow). I never had to browse a website to find out what existed. `cascivo search chart` was equally direct.

2. **`llms.txt` is the best agent-facing doc surface I have used.** It front-loads exactly the things that are normally learned by failing: the CSS layer contract, the signals rules, the event-handler naming convention (`onValueChange` vs `onChange` vs `onSelect`, with the exceptions named), the icon-name mapping table (`Rocket → Spaceship`), and an offline fallback (`npx @cascivo/docs`). Every icon I imported compiled on the first guess.

3. **The copied source is documentation.** Once components landed in `src/components/ui/`, I stopped fetching docs entirely and read the TSX. The JSDoc carries rationale, `@defaultValue`, and ⚠ warnings that cite prior adopter reports by date — e.g. `AreaChart.title` explains it is an accessible name and *not* a visible heading, pre-empting the exact mistake I was about to make. `Column.width` explains the content floor and the `table-layout: fixed` switch. This is unusually high-quality API documentation.

4. **Component coverage is genuinely dashboard-grade.** `AppShell` + `ShellHeader` + `SideNav` produced a working Vercel-style shell (sticky header, full-height nav, single scroll container, burger wired to the nav, `inert` on hide, Escape-to-close, mobile drawer + scrim) in about 50 lines of my code. `DataTable` shipped sort / search / pagination / selection / expandable rows out of the box. `LogViewer` (virtualized, follow-mode, in-viewer search, copy) and `CodeSnippet` (terminal chrome, highlighting, copy button) are precisely the pieces a deploy dashboard needs and are normally hand-rolled badly.

5. **Charts are a real differentiator.** 25 types, zero runtime dependencies, they server-render and hydrate, and series colours come from the theme so a multi-series chart looks right with no configuration. The dev-time warning was outstanding:

   > `[cascivo charts] AreaChart: "Errors" (max 42) is more than 20× smaller than "Requests" (max 2,769) on the same axis, so it renders as a flat line at the baseline while the legend still names both. Put the smaller series on its own scale with axis: 'right' + secondAxis, or split it into a second chart.`

   It named the problem, the numbers, and the two exact props to reach for. More libraries should do this.

6. **SSR under TanStack Start needed zero Vite config.** No `ssr.noExternal`, no `<ClientOnly>`, no `Unknown file extension ".css"`. Nine server-rendered routes, no hydration mismatches. This claim in the docs held up exactly.

7. **`setLinkComponent` is the right abstraction.** One five-line adapter and every config-driven nav (`SideNav`, `ShellHeader`, `Breadcrumb`) became client-side routed while staying real `<a>` elements. `asChild` on `Link` and `Button` composed with TanStack's `<Link>` cleanly for in-content links.

8. **The layer contract does its job.** Declaring the order once and putting page CSS in `@layer cascivo.app` meant my styles never fought component styles. No `!important`, no specificity escalation, no `:root:not([data-theme])` tricks — for a whole app.

9. **`cascivo doctor --drift` is a good idea** and caught both my hand-edit to `checkbox.tsx` and an accidental Prettier reformat of `side-nav.tsx`.

10. **Consuming components needs no signals knowledge.** The docs promise this and it is true — plain props and handlers throughout. `useSignals()` was only needed where *my own* code read `signal.value` during render.

---

## What went badly

### Setup and the CLI

11. **`cascivo init`'s dependency install is all-or-nothing and leaves a half-configured project.** One unrelated bad version range in my `package.json` made the whole `pnpm add` fail. `init` wrote `cascivo.config.ts` and then printed "Failed to install" — it did **not** record the packages in `package.json` as a fallback. The project was left claiming to be cascivo-configured with none of the runtime installed. `--no-install` exists as a flag but is not what a failing install falls back to.

12. **`init`/`add` shell out to the host package manager with no isolation, and got a badly stale version as a result.** In a pnpm workspace the install printed warnings sourced from *sibling* packages, and pnpm resolved `@cascivo/i18n` to **0.2.14** when latest is **0.16.0** — because another workspace package's lockfile entry won. cascivo then warned about the version it had itself just installed:

    > `Warning: @cascivo/i18n 0.2.14 is installed, but the copied component source needs @cascivo/i18n >=0.16.0. Run: pnpm add @cascivo/i18n@latest`

    If the CLI knows the floor, it should install `@latest` (or the floor) rather than a bare name.

13. **`cascivo doctor` reports "No violations found" while `cascivo doctor --drift` reports 5 real issues.** The default invocation reading clean when the project has unresolvable dependency problems is a bad default — drift should be part of the standard check, or the plain output should say it did not look.

### Red flag: the registry advertises a package that does not exist

14. **`@cascivo/components` is not published on npm (404), but the registry depends on it.** Adding `user` printed:

    > `Warning: @cascivo/components is not installed, but the copied component source needs @cascivo/components >=0.0.0. Run: pnpm add @cascivo/components@latest`

    Running that command:

    > `@cascivo/components is not in the npm registry, or you have no permission to fetch it.`

    `cascivo doctor --drift` repeats the same unsatisfiable requirement (`user: needs @cascivo/components >=0.0.0, but it is not installed`), so the project can never report clean. Note also the `>=0.0.0` floor — a manifest entry that constrains nothing, which suggests the requirement was generated rather than authored.

15. **`overflow-menu` is deprecated in favour of the same nonexistent package.** Its source header reads `@deprecated OverflowMenu is deprecated. Use Menu from @cascivo/components/menu instead.` — an import path that cannot resolve. Meanwhile `cascivo list` still lists `overflow-menu` with no deprecation marker, so the CLI actively recommends it. I only found out after installing it. I deleted it and used `menu` instead.

### Red flag: shipped source does not pass a mainstream toolchain

16. **Vendored source fails `tsc --noEmit` under `noUnusedLocals`.** `checkbox/checkbox.tsx` imports `useSignal` and never uses it. `noUnusedLocals: true` is what the *official TanStack Start scaffolder* generates, so this is the default configuration for the framework I was asked to use. My whole app typechecked clean; the one error in the build was cascivo's. Fixing it means hand-editing vendored source, which then shows as permanent drift.

17. **Following the official strict-ESLint guidance still left 13 errors — all 13 in cascivo's own source, none in mine.**

    | rule | files |
    |---|---|
    | `react-hooks/refs` | `app-shell`, `dropdown`, `use-popover` (×3), `search`, `toast`, `tooltip` |
    | `react-hooks/static-components` | `shell-header` |
    | `react-hooks/purity` | `relative-time` |
    | `@typescript-eslint/no-empty-object-type` | `card` (×3) |

    `@cascivo/eslint-config` exists precisely for this class of problem, and its `cascivoSignals` fragment does correctly silence `react-hooks/immutability` on the documented `signal.value = next` idiom. But its `cascivoVendoredSource()` fragment scopes off only *stylistic* rules (`array-type`, `import/order`, `naming-convention`, …) — none of the correctness rules that cascivo's own code actually trips. I had to author my own override block on top of the official config. That block is in `eslint.config.js` and is a workaround, not a fix.

18. **The documented ESLint entry point is wrong for flat config.** `llms.txt` says the offending rule set is `recommended-latest`. Wiring `reactHooks.configs['recommended-latest']` into a flat config throws `A config object has a "plugins" key defined as an array of strings` — in `eslint-plugin-react-hooks@7` the flat variant is `configs.flat['recommended-latest']`. The doc names a rule set rather than an import path, which reads as an instruction and is not one.

19. **`prettier --write .` reformats vendored source and immediately manufactures drift.** Owning the code means excluding it from your formatter, which nothing says. `@cascivo/eslint-config` solves the lint half of this problem and there is no equivalent for the format half — I had to add `src/components/ui` to `.prettierignore` and re-run `cascivo add side-nav` to restore the file.

### Red flag: theming is missing from the copy-paste path

20. **`ThemeProvider`, `useTheme`, `applyTheme`, and `themePreloadScript` only exist in `@cascivo/react`.** `llms.txt` documents them as *the* theming answer, with a detailed paragraph on precedence, SSR no-FOUC, `suppressHydrationWarning`, and the `useTheme()`-returns-a-tuple gotcha — and never says these are unavailable on the copy-paste path. They are not in `@cascivo/core`; I checked all 114 of its exports. `setLinkComponent` *is* there and its doc even says "copied source can import from `@cascivo/core`", which made the absence of the theming API more surprising, not less.

    The copy-paste path is the one `cascivo init` configures and the one the CLI's whole surface is built around, so this is the biggest gap I hit. I hand-wrote `src/lib/theme.ts`: a theme signal, a `localStorage` writer, the inline no-FOUC preload script, and the `data-theme` + `color-scheme` application. All of it is re-implementation of documented library behaviour.

### API surprises that produce silently wrong UI

21. **`Badge variant="neutral"` renders in the brand accent colour.** The tone table maps `neutral → default`, and `[data-variant='default']` is `background-color: var(--cascivo-color-accent)`. Every "neutral" chip on my first pass — framework labels, preview-environment tags, member roles — came out as a primary-blue pill. The actually-neutral look is `secondary`, which is typed as a `BadgeShape` rather than a tone and so is invisible if you are working from the catalog tone vocabulary. `Badge`'s own JSDoc sells the tone aliasing as letting "one domain enum drive `Badge`, `Tag`, `Status` and `Notification`" — that promise breaks on the single most common value. No error, no warning; you have to look at the screen.

22. **`Tag` with no variant is nearly invisible in the dark theme** — it reads as plain text, not a chip. So `Badge`'s default is loud (accent) and `Tag`'s default is silent. Two chip components with opposite defaults.

23. **`Link external` renders its own ↗ indicator.** Passing an `ExternalLink` icon as a child — the obvious composition, and what you would do with any other link component — gives you two arrows side by side. The `external` prop doc says "opens in a new tab with rel safety" and does not mention the visual affordance.

24. **`Search`'s `label` prop renders nothing visible.** `Input`'s `label` renders a real label; `Search`'s appears to be an accessible name only. Same prop name, different contract.

### Layout and sizing

25. **Charts ignore their container's height.** The `width` prop's ⚠ block says "**Omit for a responsive chart** — the chart fills and tracks its container via a ResizeObserver". Only the *width* does. `height` defaults to a fixed 300px, so a chart in a `block-size: 15rem` grid cell rendered a 300px SVG that overflowed the cell by 60px and spilled 35px past the card's bottom border. Measured directly:

    ```
    frame: { w: 681, h: 240 }
    svg:   { w: 681, h: 300, viewBox: '0 0 680.65625 300' }
    ```

    The fix is to pass `height` explicitly and keep it in sync with the CSS by hand — this app has a `CHART_HEIGHT` constant and a `/* keep in sync */` comment purely to serve that.

26. **`height` sizes the SVG only; the legend renders below it.** After fixing #25 the legend was clipped by the wrapper that was sized to `height`. Two independent sizing rules, neither documented — I ended up using `min-block-size` on the wrapper.

27. **`Meter` is not responsive at all, but carries the responsive prop doc.** It renders at a hard 200×100 with no `viewBox` and does not track its container, yet its `width` prop carries the identical "⚠ Omit for a responsive chart — … tracks its container via a ResizeObserver" boilerplate as the charts that genuinely do. Shared prop documentation is being applied to a component where it is false.

### Composition gaps

28. **`Tabs` cannot render links.** `TabsTrigger` hardcodes `<button>` with no `asChild` and no `href`. The canonical dashboard pattern — and Vercel's — is one URL per tab. I had to drive `navigate()` from `onValueChange`, which loses middle-click, cmd-click, open-in-new-tab, and real hrefs for crawlers and screen readers. `Link`'s own JSDoc argues that `asChild` is "**the supported way to style an in-content router link**", so the pattern is understood by the library — just absent on the component that needs it most for an app shell. The workaround also makes the `aria-controls` wiring awkward: I have one `TabsContent` whose `value` tracks the route, holding the router `<Outlet>`.

29. **`Menu`'s children are positional.** `Menu` does `const [trigger, ...items] = childArray` — the first child is the trigger, everything else is panel content. Wrapping the trigger in a fragment or a conditional silently breaks the component with no runtime guard, and nothing in `MenuProps` (`{ children: ReactNode }`) hints at the contract.

30. **No barrel export, and inconsistent about it.** ~45 vendored components means ~45 deep import lines like `../components/ui/card/card`. `shell-header` shipped an `index.ts`; nothing else did. There is no `cascivo add` flag to emit one, and no documented convention for adding your own.

### Documentation inconsistencies

31. **The layer-order statement in `llms.txt` contradicts the authoritative file.** `llms.txt` prescribes:

    ```
    @layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component,
      cascivo.platform, cascivo.theme, cascivo.blocks, cascivo.override;
    ```

    `@cascivo/tokens/src/layers.css` — which calls itself "the ONE authoritative declaration" — has no `cascivo.platform` at all. That file's own header says a guard test asserts every shipped `@layer` statement is an ordered subsequence of the canonical one; the statement in `llms.txt` is not. I followed `layers.css`.

32. **Token names differ from the obvious guess.** Font sizes are `--cascivo-text-sm`, not `--cascivo-font-size-sm` (there is a `--cascivo-font-*` family, but it holds weights and families). A closed catalog exists at `tokens.catalog.json`, which is good, but the naming split is a trap for anyone typing from memory.

33. **`cascivo init`'s completion message is incomplete for what you actually need.** It prints `import '@cascivo/themes/dark.css'` and `<html data-theme="dark">`, but does not say which stylesheet carries the tokens, does not mention `light-dark.css` as the switchable-theme bundle, and (understandably, but consequentially) says nothing about `@cascivo/charts/styles.css`, which becomes mandatory the moment `cascivo add area-chart` runs. That later `add` *does* print the import, but only in a block that scrolls past under an install log.

34. **`add` blurs copy-paste and npm entries.** `cascivo add area-chart` reads like every other `add`, but copies no source — it installs the `@cascivo/charts` npm package. `cascivo list` does group these under a `Charts (npm: @cascivo/charts)` header, so it is signposted, but the identical command syntax and the "you own the code" framing set a different expectation.

---

## Summary of red flags

| # | Red flag | Why it would stop a real adopter |
|---|---|---|
| 14, 15 | `@cascivo/components` is unpublished but required by the registry, and a shipped `@deprecated` notice points at it | The CLI's own remediation command fails; `doctor --drift` can never report clean |
| 16 | Vendored source fails `tsc` under the official TanStack scaffolder's tsconfig | Broken build on step one; fixing it creates permanent drift |
| 17 | 13 lint errors in shipped source that the official `@cascivo/eslint-config` does not cover | The documented remedy does not remedy it; every adopter must write the same private override |
| 20 | Theming API (`ThemeProvider`/`useTheme`/`themePreloadScript`) exists only on the npm path, undisclosed | The flagship copy-paste path has no theme switching; SSR no-FOUC must be re-implemented by hand |
| 21 | `variant="neutral"` renders as the brand accent | Silently wrong UI, no error, contradicts the component's own JSDoc |
| 25, 27 | Charts ignore container height; `Meter` is not responsive despite carrying the responsive doc | Charts visibly overflow their cards on a first attempt, and the doc points the wrong way |

## Workarounds carried in this app

Each of these is a workaround for a finding above and should be fixed upstream, not here.

- `src/lib/theme.ts` — hand-rolled theme signal, persistence, no-FOUC preload script (#20).
- `eslint.config.js`, `app/vendored-source-correctness` block — disables 4 correctness rules over `src/components/ui/**` (#17).
- `src/components/ui/checkbox/checkbox.tsx` — unused `useSignal` import removed by hand (#16).
- `.prettierignore` — excludes `src/components/ui` to stop the formatter manufacturing drift (#19).
- `src/lib/charts.ts` (`CHART_HEIGHT`) + `min-block-size` on `.chart-frame` — explicit chart height kept in sync with CSS (#25, #26).
- `src/routes/projects.$projectId.tsx` — `navigate()` driven from `Tabs.onValueChange` instead of link tabs (#28).
- `variant="secondary"` used wherever a neutral chip was wanted (#21).
- `overflow-menu` deleted after install; `menu` used instead (#15).
