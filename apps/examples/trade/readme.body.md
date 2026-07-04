Cascivo Trade — a functional mock of a retail brokerage trading workspace (feels like Trade Republic).

**Mock demo: no real market data.** Prices, the orderbook, and the trade tape update live via a
pausable, seeded simulation engine. The selected instrument persists across reload via
`@cascivo/storage`. All instruments, figures, and branding are fictional.

## What it demos

`Candlestick` (zoom + dataZoom + axis crosshair + last-price annotation), `Sparkline`, `Meter`
(charts); `NumberInput`, `Select`, `SegmentedControl`, `DataTable`, `HeaderPanel`, `Item`, `Sheet`,
`ScrollArea`, `Stat`, `DataList`, `Tabs`, `Badge`, `Toast`, `CommandMenu` (react);
`AppShell` + live simulation engine + seeded RNG from `@cascivo/example-kit`

## Layout

An order ticket, a candlestick price chart with interval/range controls, an instrument summary, a
depth-histogram orderbook, a streaming time-and-sales tape, and your order history — arranged in a
responsive grid. On small screens the order ticket moves into a bottom `Sheet`; the profile menu is
a card-based `HeaderPanel` anchored below the header.

## Run

```sh
# From this directory
pnpm exec vp dev

# From monorepo root
pnpm exec vp run @cascivo/example-trade#dev
```

## Live demo

Deployed at **https://cascivo.com/demos/trade/** — assembled into the cascivo landing site (same
origin) by `scripts/assemble-demos.mjs`. Built with Vite `base: './'`, so the same build runs both
standalone (`vp preview`, served at `/`) and under `/demos/trade/`.
