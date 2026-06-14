Cascade Deploy — a functional mock of a deployment platform (feels like Vercel).

**Mock demo: no real backend.** Data loads via a client-side mock API with seeded latency. Theme and
simulation state persist across reload via `@cascivo/storage`.

## What it demos

`AppShell`, `DataTable`, `Status`, `Badge`, `Stat`, `Sparkline`, `CommandMenu`, `ProgressBar`,
`Toast`, `Skeleton`, `EmptyState`

## Run

```sh
# From this directory
pnpm exec vp dev

# From monorepo root
pnpm exec vp run @cascivo/example-deploy#dev
```
