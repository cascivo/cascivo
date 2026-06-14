Cascade Track — a functional mock of a keyboard-first issue tracker (feels like Linear).

**Mock demo: no real backend.** Data loads via a client-side mock API with seeded latency. Issue
mutations (status, assignee, priority) persist across reload via `@cascivo/storage`.

## What it demos

`CommandMenu` (Cmd+K), `SegmentedControl` (board / list toggle), `Drawer`, `MultiSelect`,
`Combobox`, `ContextMenu`, `DataTable`, `Badge`, `Toast`, `Skeleton`, `EmptyState`

## Run

```sh
# From this directory
pnpm exec vp dev

# From monorepo root
pnpm exec vp run @cascivo/example-track#dev
```

## Live demo

Deployed at **https://cascivo.com/demos/track/** — assembled into the cascivo landing site (same
origin) by `scripts/assemble-demos.mjs`. Built with Vite `base: './'`, so the same build runs both
standalone (`vp preview`, served at `/`) and under `/demos/track/`.
