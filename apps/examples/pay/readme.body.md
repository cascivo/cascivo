Cascade Pay — a functional mock of a payments and revenue dashboard (feels like Stripe).

**Mock demo: no real backend.** Data loads via a client-side mock API with seeded latency. Refund
mutations persist across reload via `@cascivo/storage`.

## What it demos

`AreaChart`, `BarChart`, `KPI`, `DataTable`, `DateRangePicker`, `Combobox`, `Pagination`, `Stat`,
`Badge`, `Alert`, `SegmentedControl`, `Toast`, `Skeleton`, `EmptyState`

## Run

```sh
# From this directory
pnpm exec vp dev

# From monorepo root
pnpm exec vp run @cascivo/example-pay#dev
```
