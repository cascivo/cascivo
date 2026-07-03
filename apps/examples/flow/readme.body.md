Cascivo Flow — a functional mock of a process orchestration dashboard (feels like Camunda).

**Mock demo: no real backend.** Data loads via a client-side mock API with seeded latency. Task claim
and completion state persists across reload via `@cascivo/storage`.

## What it demos

`Timeline`, `TreeView`, `DataTable`, `Drawer`, `Tabs`, `EmptyState`, `Status`, `Badge`, `Toast`,
`Skeleton`, hand-built SVG flow diagram with a simulated process token

## Run

```sh
# From this directory
pnpm exec vp dev

# From monorepo root
pnpm exec vp run @cascivo/example-flow#dev
```

## Live demo

Deployed at **https://cascivo.com/demos/flow/** — assembled into the cascivo landing site (same
origin) by `scripts/assemble-demos.mjs`. Built with Vite `base: './'`, so the same build runs both
standalone (`vp preview`, served at `/`) and under `/demos/flow/`.
