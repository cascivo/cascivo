# Experience report — Vercel-like dashboard, Vite + React Router, cascivo

- **Date:** 2026-08-14
- **Prompt:** "create a vercel like dashboard with vite and react router, no tanstack"
- **Stack:** Vite 7 · React 19 · React Router 7 (`createBrowserRouter`, lazy route modules) · TypeScript 5.9
- **cascivo:** prebuilt path — `@cascivo/react` 0.17.0, `@cascivo/themes` 0.4.11, `@cascivo/charts` 0.17.0, `@cascivo/icons` 0.3.8, `@cascivo/eslint-config` 0.2.2 (registry v0.17.0)
- **Starting point:** `npx cascivo create <dir> --yes --theme dark`
- **Outcome:** five routes (overview, project detail, analytics, logs, settings) + 404. Typecheck, lint, format and production build all clean; every route verified in a real browser.

Ordering below is roughly by how much each finding would cost a real adopter, not by how it was found.

---

## What went well

1. **`npx cascivo create` produced a working app in one command.** 16 files: Vite config, tsconfig, prettier, ESLint flat config, `index.html` with the `@layer` order statement already declared, `src/vite-env.d.ts` (so the bare CSS side-effect imports typecheck), and an `AGENTS.md` restating the CSS layer contract. Nothing in it needed fixing to build.
2. **The scaffold pre-empts the traps the docs warn about, in comments, at the place you would hit them.** `eslint.config.js` ships with three comments explaining (a) that `tseslint.configs.recommended` is what registers the `.ts`/`.tsx` `files` patterns and without it ESLint silently lints zero files, (b) that `reactHooks.configs.flat['recommended-latest']` is the flat-config entry point and the non-`.flat` one applies nothing while still passing, (c) that `...cascivo` must be spread last to disable `react-hooks/immutability`. This is the single best thing in the onboarding path — the failure modes it heads off are all silent ones.
3. **The shipped `.d.ts` is the best documentation surface, as the docs claim.** Every prop I was unsure about had the answer plus the rationale plus, often, the dated adopter report that caused the note: `AppShell.padding` defaults to `6` (and why), `Flex.direction` defaults to `vertical`, `Column.width`'s "size some columns, not all", charts' `title` being an accessible name rather than a visible heading, `Stat.delta` (string, you format) vs `Kpi.delta` (number, it formats). I never had to guess and then compile to find out.
4. **Router integration is one line and it works.** `setLinkComponent(({ href, ...rest }: LinkComponentProps) => <Link to={href ?? '#'} {...rest} />)` in `main.tsx` made `SideNav`, `ShellHeader` (both flat links and dropdown menus) and `Breadcrumb` all render real React Router `<Link>`s. Verified in the browser: clicking a sidebar project navigates without a document reload, and the links stay real `<a>`s so middle-click still works. `Button asChild` / `Link asChild` covered the in-content case.
5. **The behavior layer really is finished.** `CommandMenu` gave a ⌘K palette with fuzzy search, arrow-key navigation, grouped results, a footer hint bar and Escape-to-close from nothing but a `groups` array. `DataTable` gave sorting, search and pagination from props. `LogViewer` gave a virtualized console with search, follow/pause and copy. `OverflowMenu`, `Tabs`, `Toggle`, `Select`, `SegmentedControl`, `Search` all worked on the first try. I wrote no ARIA, no keyboard handlers, no outside-click listeners.
6. **I never touched signals.** The "consuming components requires no signals" claim held exactly: plain `useState` throughout, no `useSignals()` anywhere, no state-fights-the-DOM bugs. That claim is load-bearing for adoption and it is true.
7. **Charts were correct on first render.** `AreaChart` with a second series as `type: 'line'` on `axis: 'right'`, `BarChart`, a donut `PieChart`, four `Kpi` tiles and inline `Sparkline`s. Omitting `width` and passing only `height` gave responsive charts inside `Card`s with zero configuration, and series colours came from the theme palette automatically.
8. **Theming took four lines.** `@cascivo/themes/light-dark.css` + `<ThemeProvider defaultTheme="dark">` + `const [theme, setTheme] = useTheme()`. Both the header icon action and a `Select` on the settings page drive it; every component including the charts restyles, and the choice persists.
9. **One compile error in the whole build**, and its message named the missing prop (`CodeSnippet` needs `code`). Everything else typechecked first time.
10. **Monorepo fit was free.** The generated `package.json` already exposes `build`/`dev`/`lint`/`typecheck`/`format`, so `turbo run typecheck lint build --filter=…` worked with no edits.
11. **Bundle came in under the warning.** 451 kB entry JS (148 kB gzip) + 59 kB entry CSS, with React Router `lazy()` route modules splitting each page. The dashboard recipe warns that a stock cascivo console trips Vite's 500 kB warning; with route splitting in place from the start, it did not.

---

## What went badly

### 1. `cascivo create` scaffolds a _non-routed_ architecture, and the prompt was router-first

The generated `src/App.tsx` holds a module-level `signal<Section>` and swaps between three `sections/*.tsx` files with `section.value === 'dashboard' && <Dashboard />`. There is no router and no flag to ask for one. For any prompt that mentions a router — arguably most real apps — you delete `App.tsx` and all of `src/sections/`, which is the majority of what `create` generated, and re-derive the shell wiring yourself. The shell composition (`AppShell` + `ShellHeader` + `SideNav`) is the valuable part and it is welded to the section-switcher. Shipping the shell as its own `Shell.tsx` with a `children` slot, or a `--router react-router|tanstack|none` flag, would keep the scaffold useful past the first minute.

### 2. The router guide the `.d.ts` points at does not exist

`LinkProps.asChild` and `setLinkComponent` both cite `docs/USING-WITH-A-ROUTER.md`. `https://cascivo.com/docs/using-with-a-router.md` returns **404**, and `npx @cascivo/docs --list` has no `using-with-a-router` entry either (the guide list is: ai-rules, compatibility, components, enterprise-readiness, getting-started, headless, migrating-from-shadcn, recipe-dashboard, styling-internals, theming, tokens, troubleshooting, using-with-astro, using-with-nextjs, using-with-preact, using-with-strict-eslint, using-with-tailwind, using-with-vite-ssr). The actual recipe survives only inside the `setLinkComponent` doc comment (which shows TanStack Router and Next.js, not React Router) and one bullet in `using-with-vite-ssr`. Two dead cross-references to the same missing file is a strong signal it was planned and dropped; for a design system whose nav components are config-driven, "how do I wire my router" is a top-three question.

### 3. The catalog-wide tone type is not importable on the prebuilt path

`Status.status` and `Badge.variant` are typed with `ToneInput`. `@cascivo/react` re-exports `LinkComponentProps`, `Responsive`, `Column` and `SortState` — but **not** `ToneInput`, `Tone`, `SpaceStep` or `ProgressInput`. So the very first thing a TypeScript dashboard writes — a `Record<DeployState, Tone>` mapping deployment states to tones — has no supported import, and the documented answer for prebuilt users is explicitly _not_ to install `@cascivo/core`. I worked around it with:

```ts
type Tone = NonNullable<StatusProps['status']>
```

which works but is a workaround, not an API. `SpaceStep` has the same problem for anyone writing a helper that passes `gap` through. These are one-line additions to the export list.

### 4. `Sparkline` sizing: three numbers and two behaviours across two docs

- `recipe-dashboard.md`: "120×32 is a _preferred_ size — it **shrinks to fit** a narrow flex/grid track rather than pushing siblings onto the next line."
- The `.d.ts` on the same prop: "**This chart is fixed-width by default** … omitting `width` gives you 120px", with `@defaultValue 80` in the same block.

So: 120 or 80, and shrink-to-fit or fixed. Observed behaviour is fixed — in my project cards the sparkline held its width and pushed "Deployed 2 hours ago" onto two lines. The `.d.ts` is supposed to win, but here it disagrees with itself.

### 5. `Toggle`'s `label` renders visibly, with no note saying so

The canonical settings row is a title + description on the left and a switch on the right. `<Toggle label="Automatic deployments">` renders that string _next to the switch_, duplicating the row's own title. The `.d.ts` entry for `label` is bare — compare `Sparkline`, which is explicit that `label`/`ariaLabel` are two spellings of an invisible accessible name. I had to fall back to `aria-label`, which works but means the accessible-name prop is spelled differently on `Toggle` than on the components that document one. A `labelVisibility` or a documented "use `aria-label` when the row already has a label" note would close it.

### 6. `Stat card` and `Kpi` still don't match

The `.d.ts` warns that `Kpi` ships card chrome and `Stat` doesn't, and offers `<Stat card>` as the fix. With `card` set they share surface/border/radius/padding — but the internal layout still differs: `Kpi` puts value and delta on one line with the sparkline below, `Stat` stacks the delta under the value and puts the sparkline in a trailing slot. My overview (`Stat card`) and analytics (`Kpi`) rows still read as two different tile designs, which is the exact symptom the `card` prop was introduced to cure. Either the layouts should converge or the docs should say `card` fixes only the chrome.

### 7. `PageHeader.title` and `.description` are `string`, not `ReactNode`

A deploy console's project header wants the domain as a link and a status badge beside the name. `breadcrumb` and `actions` are `ReactNode`; `title`/`description` are `string`. The restriction reads accidental rather than intentional, and the recipe explicitly says not to hand-compose `PageHeader` from `Heading`/`Text`/`Flex` — so there is no sanctioned way to get a link into a page title.

### 8. `CodeSnippet` takes `code`, not children

Every other content component in the catalog (`Card*`, `Alert`, `Badge`, `Text`, `Status`, `EmptyState`'s action) takes children or a ReactNode slot. `CodeSnippet` takes a `code: string` prop and ignores children. It was the only compile error in the run — cheap because the type caught it, but it is an odd shape for the one component whose content is literally text.

### 9. `BreadcrumbItem` was missed by the `id` sweep

The `SwitcherLink.id` doc comment lists the components that already carry a stable-key `id` — `SideNavItem`, `ShellHeaderNavLink`, `ShellHeaderNavMenuItem`, `HeaderLink`, `CommandItem` — and notes `Switcher` was missed. `BreadcrumbItem` is `{ label, href? }` with no `id`, and a real breadcrumb repeats hrefs (mine has "Overview" and "Projects" both pointing at `/`). No duplicate-key warning appeared in practice, so it presumably keys by index today, but it is the same gap the sweep was meant to close.

### 10. Charts CSS: is the import required or redundant?

`llms.txt` says charts ship their own stylesheet and "skipping the charts stylesheet is a common mistake: the chart's screen-reader data-table fallback then renders visibly". Getting-started says component CSS auto-includes per component on the bundler path and there is "no component-CSS import to add". Those are opposite defaults for two packages in the same install, and the stated failure mode is a visual regression you'd notice only if you looked. I imported `@cascivo/charts/styles.css` defensively and never established whether it was needed on a CSR Vite build.

### 11. `create` leaves loose ends it doesn't mention

- No `cascivo.config.ts` is written (that's `init`'s job), so a later `npx cascivo add <component>` has no config to read. The "Next steps" output doesn't mention it.
- The printed next steps are `npm install` / `npm run dev` even though the app was created inside a pnpm workspace with a root lockfile. `init` and `add` document careful package-manager detection; `create` appears to skip it.
- `package.json` `name` and the HTML `<title>` are both set to the directory name, so `2026-08-14-vercel-dashboard-vite-react-router` shipped as the browser tab title until I changed it.

### 12. The scaffold imports the aggregate component stylesheet

The generated `App.tsx` has `import '@cascivo/react/styles.css'`, which getting-started describes as _optional_ on the bundler path (per-component CSS auto-includes and tree-shakes) and ~273 kB / ~37 kB gzip when you do pull it. A CSR scaffold that imports it by default hands every new app the aggregate sheet as its baseline. After dropping it my build emits 59 kB of entry CSS plus small per-route chunks. If the import is there for a reason on this path, the reason isn't in the file.

### 13. Small things worth a line each

- The dashboard recipe's `PieChart` example omits `id`, which `PieChartDatum` requires. Only the `.d.ts` says so.
- No primitive expresses "deployment state". Every console in this space hand-writes the same `deploy state → tone → label` maps; `Status` takes a tone, not a semantic state.
- `@cascivo/core` isn't a direct dependency on the prebuilt path, so its `.d.ts` — which the docs cite for `LinkComponentProps` and the theming primitives — is only reachable through the pnpm store (`node_modules/.pnpm/@cascivo+core@…`). Ctrl-click works in an editor; grepping from a terminal does not, without knowing pnpm's layout.
- The `registry v0.17.0` header line on every doc page and the per-package version list in `llms.txt` made it trivial to confirm the docs matched what was installed. Good practice, worth keeping.

---

## Red flags and blockers

**No blockers.** The build never stalled; every friction point above had a workaround inside the library.

The three findings most likely to cost a real adopter, in order:

1. **The missing router guide (§2).** Routers are how apps are built. The recipe exists only as a doc comment showing two other routers, and the file both cross-references point at is a 404.
2. **`ToneInput` not being exported (§3).** Every TypeScript dashboard writes a status→tone map within the first hour, and the documented install path makes the correct import unavailable. The workaround is unobvious enough that most people will inline a string union and lose the type link.
3. **`cascivo create` modelling "no router" as the default architecture (§1).** A fresh adopter following the happy path builds an app they then gut. The cost is small in absolute terms but it lands in the first five minutes, which is where impressions form.
