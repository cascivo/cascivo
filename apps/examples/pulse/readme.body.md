Cascivo Pulse — a functional mock of a real-time observability dashboard (feels like Datadog).

**Mock demo: no real backend.** Metrics update live via a pausable, seeded simulation engine.
Alert acknowledgements and time-range preferences persist across reload via `@cascivo/storage`.

## What it demos

The overview is a single-screen service-health page: `Kpi` tiles with deltas and sparklines,
a multi-series `AreaChart` hero with an SLO annotation, an error-budget panel (`ProgressCircle`,
`ProgressBar`, `Meter`, `Bullet`), a per-service table composed from `Status`, `Sparkline` and
`ProgressBar`, an activity `Timeline`, and a latency-distribution `Heatmap`.

`AreaChart`, `Heatmap`, `Kpi`, `Sparkline`, `Meter`, `Bullet` (charts);
`Badge`, `Button`, `EmptyState`, `ProgressBar`, `ProgressCircle`, `SegmentedControl`, `Status`,
`Timeline`, `Toast` (react);
`AppShell` + live simulation engine from `@cascivo/example-kit`

## Run

```sh
# From this directory
pnpm exec vp dev

# From monorepo root
pnpm exec vp run @cascivo/example-pulse#dev
```

## Live demo

Deployed at **https://cascivo.com/demos/pulse/** — assembled into the cascivo landing site (same
origin) by `scripts/assemble-demos.mjs`. Built with Vite `base: './'`, so the same build runs both
standalone (`vp preview`, served at `/`) and under `/demos/pulse/`.
