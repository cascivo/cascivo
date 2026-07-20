# cascivo experience report — TanStack Start (Vercel-style dashboard), v0.7.1 packages

> Source: external AI adopter report, received 2026-07-18. Reproduced verbatim below
> (original H1 retained). Third TanStack Start report in this series.
> Fix plan: `fix-plan-tanstack-start-adopter-2026-07-18.md` (same directory).

---

# cascivo experience report — TanStack Start (Vercel-style dashboard)

- **Date:** 2026-07-18
- **Framework:** TanStack Start (`@tanstack/react-start` 1.168, TanStack Router 1.170) on Vite 8, SSR
- **cascivo packages:** `@cascivo/react` 0.7.1, `@cascivo/themes` 0.4.1, `@cascivo/charts` 0.3.12, `@cascivo/icons` 0.3.0, `@cascivo/core` 0.4.0 (transitive), peer `@preact/signals-react` 3.10.3
- **What I built:** an app-shell dashboard with KPI stats + sparklines, an area chart and a bar chart, and a deployments `DataTable` (search / sort / pagination / multi-select / batch actions), on the `dark` theme.
- **Outcome:** shipped and verified. `build`, `lint`, `typecheck` all green; SSR renders real themed markup; the client hydrates and charts/search work (checked in a headless browser). No blockers.

Findings below. Everything marked **[verified]** I confirmed directly (types read, build output, or browser); items marked **[impression]** are subjective friction worth flagging even though nothing broke.

---

## What went well

1. **The shipped TypeScript types are the best part of the library.** `@cascivo/react` bundles one `index.d.ts` with full prop interfaces *and* genuinely useful JSDoc — e.g. `AppShell.header` documents that it auto-binds the header burger to nav state, and `SideNavItem.render` explains the link-escape-hatch contract inline. I built the entire app straight from the `.d.ts` and it was faster and more reliable than any prose doc. **[verified]**

2. **SSR with TanStack Start worked as documented.** The compatibility matrix says "add `ssr.noExternal: [/^@cascivo\//]`" and that was the *only* Vite change needed. Both client and SSR bundles built on the first try after that. **[verified]**

3. **Server-rendered output is correct and accessible.** SSR HTML carried `data-theme="dark"`, real `oklch(...)` token values on `body`, `role="img"` on charts with text descriptions, and `aria-current`/pulse semantics on nav/status. Accessibility is clearly built in rather than bolted on (e.g. `Sparkline` *requires* a `label`, and `Status pulse` is documented to respect reduced-motion). **[verified]**

4. **`DataTable` is a lot of dashboard for very little code.** One declarative component gave me client search, per-column sort, pagination with page-size options, multi-select, and batch actions. In a headless browser, typing in the search box filtered rows live (5 → 3). This is the component that made the "Vercel-like" table trivial. **[verified]**

5. **The chart API is clean and type-safe.** `@cascivo/charts` uses accessor functions (`x: (d) => d.hour`, `y: (d) => d.requests`) over a `series: [{ id, label, data }]` array, so charts bind directly to my own row shape with no reshaping. Charts render an accessible container on the server and draw the SVG on the client after measuring — no hydration errors. **[verified]**

6. **Machine-readable docs surface is excellent for discovery.** `llms.txt` maps everything: `registry.json`, per-component `llms/<name>.md`, `context/<name>.md`, a token catalog, an icon catalog, and an MCP server (`npx @cascivo/mcp`). This is exactly what an AI-assisted workflow wants. **[verified]**

7. **Icon set is broad and sensibly named.** 459 exported icons; the names I guessed (`Home`, `Layers`, `Globe`, `Activity`, `Server`, `Triangle`, …) mostly existed, and icons are plain `size`/`color` SVG components. **[verified]**

---

## What went badly (friction)

1. **The aggregated "read-everything" bundle disagreed with the real API.** The single-fetch getting-started/`llms-full` material I read first left me with several *wrong* API beliefs, all of which the TypeScript types then contradicted:
   - `DataTable` takes `rows=` + columns keyed by `key` — not `data=` + `id`.
   - `Button` variants are `primary | secondary | ghost | destructive` — there is no `default`/`outline`.
   - Charts use accessor functions + a `series` array — not `xKey`/`yKey` strings.

   The **per-component** docs (`docs.cascivo.com/llms/<name>.md`) that I checked afterward were accurate (Stat and Card matched the types exactly). So the authoritative docs are right; it's the *aggregated/summarised* entry point — the one an LLM is most likely to slurp wholesale — that's stale. For a library that markets itself to AI-assisted builders, the big bundle being the least accurate source is the wrong way round. **[verified for Stat/Card; impression for DataTable/Button/charts, where my source was the aggregate summary]**

2. **`Stat`'s per-component doc omits the `visual` prop.** `Stat` has a real, useful `visual?: ReactNode` slot (that's where a `Sparkline` goes — the whole reason KPI cards look good), but `docs.cascivo.com/llms/stat.md` lists only `label/value/delta/trend/helpText`. I only found `visual` by reading the `.d.ts`. A doc that omits the prop that makes the component look like the marketing screenshots is a real gap. **[verified]**

3. **Router-link integration is documented against a package you don't have.** The recommended way to make `SideNav`/nav links do client-side routing is `setLinkComponent` from `@cascivo/core`. But `@cascivo/core` is a *transitive* dep of `@cascivo/react`, not something the getting-started tells you to install — so under pnpm's strict `node_modules`, `import { setLinkComponent } from '@cascivo/core'` is a phantom-dependency error. `setLinkComponent` is not re-exported from `@cascivo/react` either. I sidestepped it with the per-item `render` hatch (which *is* in `@cascivo/react` and worked well), but the documented happy path would fail for a pnpm user until they add `@cascivo/core` by hand. **[verified]**

4. **Naming collisions with other design systems cost me a wrong first attempt.** Two papercuts, both from assuming conventions common elsewhere:
   - `Avatar` has no `name` prop — it's `fallback` + `alt`. No initials-from-name convenience. **[verified]**
   - `Stack` is **not** a vertical flow primitive here — it has an `offset` and is an overlap/z-stack. The flow primitive is `Flex direction="vertical"`. Anyone reaching for `<Stack>` to space children (as in Chakra/Radix/MUI) gets overlapping content. **[verified]**

5. **`@cascivo/themes/all` ships every theme.** The getting-started's "critical setup" step is `import '@cascivo/themes/all'`, which produced a **287 kB** CSS chunk (≈39 kB gzip) containing all 15 themes when I only use one. `@cascivo/themes` does export per-theme entries (`./base`, `./dark`, …), so the quick-start should steer new users to `base` + their one theme instead of `all`. **[verified]**

6. **Inconsistent `exports` maps across packages.** `@cascivo/react` exposes `./package.json`; `@cascivo/charts` does not. Any tooling that does `require.resolve('@cascivo/charts/package.json')` (version probes, bundler plugins, my own inspection scripts) throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. Small, but the kind of inconsistency that trips build tooling. **[verified]**

7. **Docs are spread across three hosts with 404s between them.** Getting-started lives at `cascivo.com/docs/*.md`, per-component docs at `docs.cascivo.com/llms/*.md`, framework guides in the GitHub repo. Several referenced paths didn't resolve for me: `cascivo.com/docs/components.md` (404) and the chart component doc `docs.cascivo.com/llms/area-chart.md` returned an empty shell. Finding the canonical source for a given component was trial and error. **[verified]**

---

## Red flags / things a real adopter should know

1. **Trust the types, not the prose.** The single biggest risk: the aggregated docs read as authoritative and are exactly what a "vibe-coding" audience will paste, yet they diverge from the shipped API on core components (see friction #1). The excellent `.d.ts` saves you — *if* you read it. A team that codes from the summary and skips the types will generate code that doesn't compile. **[verified]**

2. **Everything is 0.x.** `react` 0.7.1, `charts` 0.3.12, `icons` 0.3.0, `core` 0.4.0, `themes` 0.4.1. There's a published `breaking-changes.json`, which is honest but tells you churn is expected. Pin exact versions; don't use `^`. **[verified]**

3. **The theme-export → `data-theme`-value mapping isn't spelled out in the quick start.** I inferred that `@cascivo/themes/dark` corresponds to `data-theme="dark"` and it worked, but the getting-started only shows `data-theme="light"` and mentions a `ThemeProvider`/`useTheme` that persists a choice — with no note about the SSR hydration implication of a stored theme. For SSR I deliberately hard-coded `data-theme="dark"` on `<html>` to avoid a client/server mismatch; the docs should call this out. **[verified for what I did; the SSR/ThemeProvider interaction I did not exercise]**

4. **Not a cascivo issue, logged for context:** TanStack Start 1.170 expects the router module to export `getRouter` (an older `createRouter` export name failed the build), and its plain `vite build` output (`dist/server/server.js`) is an SSR *handler*, not a self-listening server — production serving needs a server preset. Neither is cascivo's fault; both are the kind of integration friction that shows up around, not inside, the library.

---

## Not covered (honesty about scope)

This was a one-shot build; I did **not** exercise the MCP server, the CLI copy-paste path (`npx cascivo add`), `ThemeProvider`/runtime theme switching, `useForm`/validation, or large-dataset `DataTable` virtualization. Findings here are limited to the npm-package path with a static theme.
