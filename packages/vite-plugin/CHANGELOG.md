# @cascivo/vite-plugin

## 0.1.0

### Minor Changes

- 2945720: Adopter-friction fixes (TanStack Start / Vite SSR report):

  - **vite-plugin:** new `cascivoSsr()` plugin sets `ssr.noExternal` for every
    `@cascivo/*` package, so Vite SSR / TanStack Start / workerd no longer throw
    `Unknown file extension ".css"`. See docs/USING-WITH-VITE-SSR.md.
  - **registry:** page blocks are now projected into `/r/<name>.json` and
    `/r/shadcn/block-<name>.json` (was: components only), so blocks install via the
    shadcn CLI and appear in every machine-readable surface.
  - **mcp:** new `search_icons` tool resolves an icon by intent or foreign name
    (LayoutDashboard→Dashboard, Rocket→Spaceship), backed by the icon catalog.
  - **icons:** added `GitBranch`/`GitCommit`/`GitMerge`/`GitPullRequest`, plus an
    alias layer so familiar Lucide/Radix names resolve to the cascivo export
    (surfaced as an `aliases` field in icons.catalog.json).
  - **charts:** area-chart solid-fill opacity is now the `--cascivo-chart-fill-opacity`
    token (default 0.25), raised on dark themes so fills keep their hue instead of
    muddying into the dark surface.
  - **themes:** new `--cascivo-chart-fill-opacity` token (0.4 on dark-surface themes,
    0.25 elsewhere).

## 0.0.1

### Patch Changes

- 62a02e6: DX improvements
