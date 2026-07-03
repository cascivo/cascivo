# Trading Dashboard Showcase — Analysis & Implementation Spec

**Status:** Approved plan, ready for implementation
**Date:** 2026-07-03
**Deliverable:** A new example app `apps/examples/trade` (a Trade Republic-style brokerage
trading workspace) plus two small, targeted enhancements to `@cascivo/charts`.
**Audience:** Implementing agent (Opus/Sonnet). Follow CLAUDE.md rules throughout —
signals only (no `useState`/`useEffect`), `useSignals()` first in every render-reading
React component, i18n for every user-visible string, mobile-first CSS on the canonical
breakpoint scale, `pnpm ready` green before every commit.

---

## 1. Goal

Recreate the essential experience of a professional retail trading dashboard
(reference: Trade Republic's web trading view) entirely with cascivo, and ship it as the
sixth showcase demo. The reference UI has:

1. **Top bar** — workspace tabs, portfolio value + day change, cash balance, profile
   avatar opening a card-based profile panel (profile card, accounts/net-worth card pair,
   grouped help/tax/statements/settings items).
2. **Order ticket panel** — execution-venue selector ("Best Price", bid/ask), Buy/Sell
   side toggle, order type (Market/Limit/Stop), validity (Today/GTC), shares number
   input, fees/total summary, available cash, disclaimer, submit button.
3. **Chart panel** (dominant) — instrument header with live price/change/bid/ask,
   interval selector (10m, 1h, D, W), candlestick chart with volume sub-pane, last-price
   tag on the y-axis, crosshair, range selector (1D…All), zoom/pan.
4. **Instrument summary panel** — price, bid/ask, Summary/Insights tabs, range-selectable
   sparkline (1D/1W/1M/1Y/Max), position value, return %, key statistics (day's range meter).
5. **Orderbook panel** — best bid/ask, mirrored depth histogram, bid/ask ladder
   (size/price | price/size rows).
6. **Time & Sales panel** — live-streaming trade tape (time, price, size).
7. **Your Orders panel** — order history table (instrument, status, side, type, venue, placed).

Everything is fed by a **seeded, deterministic market simulation** with live ticks
(pausable), exactly like the existing `pulse` demo's simulation pattern.

### Non-goals

- No TradingView-style drawing toolbar (trendlines, fibs, annotations UI). Out of scope;
  it is chart-vendor chrome, not a design-system demonstration.
- No real market data, no network calls, no auth. Simulation only.
- No "Research" workspace — the top bar shows the tab for visual fidelity but only the
  Trading view is implemented (the Research tab is disabled with a tooltip, **not** hidden).
- No real brand assets. Use fictional instruments (e.g. "Global Tech Index USD (Acc)",
  "Nordic Green Energy ETF") and neutral "cascivo trade" branding. Do not use
  "Trade Republic", "S&P", "TradingView" or other trademarks in code, UI strings, or docs.
- No new npm package. App-local composition + two small `@cascivo/charts` enhancements.

---

## 2. Feasibility evaluation (codebase audit, 2026-07-03)

A full audit of `@cascivo/charts`, `packages/components`, `packages/layouts`,
`packages/themes/tokens/i18n`, and the `apps/examples/*` conventions was performed.
Verdict: **the dashboard is buildable today with ~95% existing primitives.** Findings:

### 2.1 What exists and maps directly

| Reference UI element | cascivo primitive | Notes |
| --- | --- | --- |
| Candlestick + volume | `Candlestick` (`@cascivo/charts`) | `CandlestickDatum = {t, open, high, low, close, volume?}`, `volume` prop renders sub-pane bars. Only rendered in Storybook today — this demo makes it a flagship. |
| Live tick streaming | `useStreamSeries` / `bindStream` (`@cascivo/charts`), `createStreamBuffer` (`@cascivo/core`) | Ring buffer → `ReadonlySignal<readonly P[]>`; the `StreamSource` seam is exactly a simulated feed. Proven in `apps/examples/deploy` BuildMonitor. |
| Summary sparkline | `Sparkline` | `data: number[]`, `endDot`, theme color prop. |
| Day's-range indicator | `Meter` (`@cascivo/charts`) | min=day low, max=day high, value=last price. |
| Portfolio/price stats | `Stat` (`trend: 'up'\|'down'\|'flat'` drives green/red) | |
| Zoom/pan/range machinery | `ChartFrame` `zoom` prop, `zoomWindow`/`panWindow`, `DataZoom`, `Brush`, `getSyncGroup` | Already wired in LineChart/AreaChart; **not yet exposed on Candlestick** (gap, see 2.2). |
| Last-price line | `Annotation` (`threshold`/`line`) + `renderAnnotations` (`chrome/reference.tsx`) | **Not yet accepted by Candlestick** (gap, see 2.2). |
| Order ticket | `Form`, `Field`, `SegmentedControl` (Buy/Sell), `Select` (type/validity), `NumberInput` (shares — steppers, clamping, `Intl` format), `Button`, `DataList` (fees/total) | |
| Venue selector ("Best Price") | `Dropdown` (declarative trigger + items) | |
| Orderbook ladder / T&S rows | `StructuredList` or plain rows in `ScrollArea` | Custom rows recommended (see 5.6/5.7) — tabular-nums density styling. |
| Orders table | `DataTable` (`density:'compact'`, `stickyHeader`, `sortable`, `Badge` status cells) | |
| Panels | `Card` (+ `CardHeader`), `Separator`, `Skeleton`, `EmptyState` | |
| Layout | `Grid`/`GridItem` (12-col), `Resizable` (drag-resizable pane splits), `Stack` | |
| Shell + top bar | Kit `AppShell` (`apps/examples/kit`) — theme cycling, CommandMenu, nav | Same as all five existing demos. |
| Profile panel (screenshot 2) | `HeaderPanel` + `Card` surfaces + `User` + `Item` | `HeaderPanel` is purpose-built for this: a non-modal panel anchored below the shell header at the inline-end edge (native Popover API, focus restore, light-dismiss/Escape). Its `children` are arbitrary, so the card-based composition drops straight in — see the TopBar spec in 5.5. |
| Instrument switcher | `CommandMenu` (Cmd+K) | Also satisfies the demo-coverage test. |
| Tabs (Summary/Insights) | `Tabs` | |
| Range pills (1D/1W/…) | `SegmentedControl` size `sm` | |
| Market open dot / order status | `Status` (`pulse` prop), `Badge` (`success` variant for Executed) | |
| Timestamps | `RelativeTime`, `formatDate`/`formatNumber` (`@cascivo/i18n`) | |
| Toasts on order submit | `Toast` | |
| Mobile order ticket | `Sheet`/`Drawer` (bottom sheet) | Keeps content reachable — never `display:none`. |
| Green/red semantics | `--cascivo-color-success` / `--cascivo-color-error` (+ `-subtle`, `-content`) | Defined in every theme; use these — **not** `--cascivo-chart-3/6` (categorical palette). |
| Dark look | `data-theme="dark"` (kit default), also verify `midnight` | Kit theme toggle cycles dark/light/warm. |

### 2.2 Gaps (the ~5%)

| Gap | Decision | Rationale |
| --- | --- | --- |
| **G1 — Candlestick has no zoom/range/crosshair.** It band-scales string labels, accepts no `zoom`/`dataZoom`, no axis-mode tooltip, no annotations. | **Enhance `Candlestick` in `@cascivo/charts`** (Phase A). | All machinery exists (`ChartFrame.zoom`, `DataZoom`, axis tooltip mode, `renderAnnotations`); LineChart shows the exact wiring. ~Small diff, benefits every consumer, keeps the demo app free of forked chart code. |
| **G2 — No horizontal price crosshair / y-axis price tag.** `ChartFrame` draws only the vertical rule. | **Approximate with an `Annotation` last-price `threshold` line + label** (part of G1's `annotations` prop). Do **not** build a bidirectional crosshair overlay in this project. | The last-price tag is the visually load-bearing element in the reference; a full 2-D crosshair is chart-engine work beyond a showcase and can be a follow-up backlog item. |
| **G3 — No orderbook depth component.** | **Build app-local** `DepthBars` (a ~60-line SVG composed from `linearScale` — mirrored bid/ask histograms). | Depth display is domain-specific; the owned-code philosophy favors app-level composition. Do not add a new chart type to the package for one demo. |
| **G4 — No time & sales tape component.** | **Build app-local** rows over a `createStreamBuffer` signal inside `ScrollArea`. | `LogViewer` is the only virtualized list but is semantically a log console (ansi, follow). A 30–50-row capped tape needs no virtualization. |

### 2.3 Risks / constraints the implementer must respect

- **React demo, no signals transform:** every component reading `signal.value` in render
  **must** open with `useSignals()`. Symptom of forgetting: handlers fire, UI freezes.
- **`@cascivo/charts` is dist-exporting** — the app's `vite.config.ts` **must** alias it
  (and every other dist-exporting workspace package) to source, same block as `pulse`.
- **Storage keys** must be prefixed `trade.` and the slug added to the
  `demo-storage-keys` check (see Phase C).
- **Determinism in tests:** simulation uses the kit's seeded Mulberry32 RNG; tests assert
  on seeded data, never on wall-clock or live ticks.
- **Perf:** tick interval ≥ 500ms, trades buffer capped (≤ 64), candles decimated/windowed —
  signals make re-render cost trivial but SVG node count must stay bounded (≤ ~200 visible candles).
- **`pnpm ready` gates everything**; `readme.body.md` (not `README.md`) is the editable file;
  regen artifacts must be committed.

---

## 3. Architecture overview

```
Phase A  @cascivo/charts: Candlestick zoom + dataZoom + axis tooltip + annotations
Phase B  apps/examples/trade: the showcase app
Phase C  Wiring: deploy/CI/marketing/coverage registration
```

Recommended as **two PRs**: PR-1 = Phase A (independently reviewable chart change),
PR-2 = Phases B + C. (A single PR is acceptable if preferred; keep commits phase-scoped.)

---

## 4. Phase A — `@cascivo/charts` Candlestick enhancements

Goal: bring `Candlestick` to parity with `LineChart`'s interaction surface, reusing the
existing primitives verbatim. **No new engine code.**

### 4.1 New props (mirror LineChart's names and semantics exactly)

```ts
export interface CandlestickProps {
  // …existing: data, title, upColor, downColor, volume, tooltip, yTicks, width, height, plain
  /** Enable wheel/drag/keyboard zoom-pan over the candle index window. */
  zoom?: boolean
  /** Render a DataZoom slider bound to the same window signal. */
  dataZoom?: boolean
  /** Mirror the zoom window with other charts sharing this id. */
  syncId?: string
  /** 'item' (default, current behavior) or 'axis' — vertical crosshair + shared tooltip. */
  tooltipMode?: 'item' | 'axis'
  /** Reference annotations (line/threshold/note) in candle-index × price space. */
  annotations?: readonly Annotation[]
}
```

Implementation notes:

- Window state: `useSignal<[number, number]>` window over the candle index range, sliced
  exactly the way `line-chart.tsx` does (`zoomWindow`/`panWindow` via `ChartFrame`'s
  `zoom={{ window, count }}` + `<DataZoom>` when `dataZoom`). Copy the LineChart wiring;
  do not invent new state shapes.
- `syncId` → `getSyncGroup`/`releaseSyncGroup` exactly as LineChart.
- `tooltipMode: 'axis'` → build the `TooltipModel` in axis mode so `ChartFrame` renders
  its vertical crosshair rule; tooltip rows = O/H/L/C (+ Volume when present), values
  formatted with the existing number formatting used by the current item tooltip.
- `annotations` → pass through to `renderAnnotations` with the candlestick's band/linear
  scales. A `threshold` at the last close is the demo's "last price line". Label renders
  at the right edge (existing annotation label behavior is sufficient).
- Volume sub-pane, colors, and existing default behavior must be byte-for-byte unchanged
  when the new props are omitted.

### 4.2 Files to touch

- `packages/charts/src/charts/candlestick/candlestick.tsx` — the enhancement.
- `packages/charts/src/charts/candlestick/candlestick.meta.ts` — add the new props with
  descriptions (this feeds registry/docs/MCP; keep wording consistent with LineChart's meta).
- `packages/charts/src/charts/candlestick/candlestick.test.tsx` — new tests (see 4.3).
- `apps/storybook/stories/chart/candlestick.stories.tsx` — add a "Zoomable with
  annotations" story exercising `zoom + dataZoom + tooltipMode:'axis' + annotations`.
- Regenerated artifacts (`pnpm regen`): registry entry, `apps/site/public/context/chart/candlestick.md`,
  `public/llms/`, `public/r/chart-candlestick.json`. Commit whatever regen changes.

### 4.3 Phase A tests (write first, then implement)

1. `zoom` renders the zoom affordance and slicing: with 100 candles and a narrowed window,
   only the windowed candles render (`data-candle` count assertion — pattern exists in
   LineChart's zoom tests; mirror it).
2. `dataZoom` renders the slider; dragging/keyboard updates the visible count.
3. `tooltipMode:'axis'` renders the crosshair rule on hover and a tooltip containing
   O/H/L/C labels.
4. `annotations={[{ type:'threshold', y: lastClose, label }]}` renders a rule + label at
   the mapped y position.
5. Regression: default-prop render (existing tests) unchanged; volume pane unchanged.

**Verify:** `vp run @cascivo/charts#test`, `vp run @cascivo/charts#check`, storybook story
manually, then full `pnpm ready`.

---

## 5. Phase B — the `trade` example app

### 5.1 Scaffold (copy `pulse`, follow conventions exactly)

```
apps/examples/trade/
  package.json          # "@cascivo/example-trade", private, 0.0.1, standard scripts
  vite.config.ts        # port 4186, strictPort, base:'./', full source-alias block (incl. @cascivo/charts)
  tsconfig.json         # extends ../../../tsconfig.base.json, same paths/excludes pattern as pulse
  index.html            # @layer order + reset, #root, title "cascivo trade"
  readme.body.md        # hand-written; README.md is generated by `pnpm regen`
  src/
    main.tsx            # createRoot + StrictMode
    App.tsx             # 'use client', useSignals(), kit AppShell, theme CSS imports
    i18n.ts             # defineMessages('trade', {...}) — every UI string
    data/
      instruments.ts    # fictional instrument catalog (id, name, isin-like code, currency)
      seed.ts           # seeded candle history + orders + portfolio (seededRandom)
      candles.ts        # random-walk OHLCV generators + interval aggregation (pure, unit-tested)
    sim/market.ts       # createSimulation tick: price walk, book, tape, candle updates
    store/
      market.ts         # signals: selected instrument, last/bid/ask, candles by interval, book, tape
      portfolio.ts      # signals: cash, positions, orders (persistedSignal where noted)
      ticket.ts         # order-ticket state signals + computed fees/total/validity
    format.ts           # money/quantity helpers over @cascivo/i18n formatNumber
    sections/
      TopBar.tsx        # portfolio value, cash, profile HeaderPanel (screenshot 2)
      OrderTicket.tsx   # + OrderTicket.module.css
      PriceChart.tsx    # candlestick panel + interval/range controls
      InstrumentSummary.tsx
      Orderbook.tsx     # + app-local DepthBars.tsx (SVG)
      TimeAndSales.tsx
      OrdersTable.tsx
      *.module.css      # colocated, mobile-first
    setup.ts            # vitest jsdom setup (copy track)
  test/smoke.spec.ts    # seed invariants
```

`package.json` deps: `@cascivo/{example-kit,react,charts,core,i18n,storage,themes,tokens,icons}`
as `workspace:*`; react/react-dom/typescript/vite-plus/vitest/testing-library from `catalog:`.
Since the app has component tests, include the `test` block in `vite.config.ts`
(jsdom, globals, `setupFiles: ['./src/setup.ts']`) — copy from `track`.

### 5.2 Data model

```ts
interface Instrument { id: string; name: string; code: string; currency: 'EUR' }
type Interval = '10m' | '1h' | 'D' | 'W'
interface Candle { t: number /* epoch ms */; open: number; high: number; low: number; close: number; volume: number }
interface BookLevel { price: number; size: number }
interface Trade { id: number; time: number; price: number; size: number; side: 'buy' | 'sell' }
interface Order {
  id: string; instrumentId: string; status: 'executed' | 'open' | 'cancelled'
  side: 'buy' | 'sell'; type: 'market' | 'limit' | 'stop'; venue: string
  shares: number; price: number; placed: number
}
interface Position { instrumentId: string; shares: number; costBasis: number }
```

**Seeding (`data/seed.ts`, `data/candles.ts`):** 4–6 fictional instruments. Per instrument,
generate ~2 years of daily candles with a seeded geometric random walk (drift + vol chosen
so one flagship instrument shows the reference's ~+30% arc), aggregate to weekly, and
synthesize the last 5 trading days of 10m/1h candles consistent with the daily closes.
Pure functions, fixed seed, unit-tested for invariants (`high ≥ max(open, close)`,
`low ≤ min(open, close)`, positive volume, correct aggregation).

Seeded portfolio: cash ≈ €12, one large position in the flagship instrument
(cost basis ⇒ ~+32% return), ~15 seeded historical `executed` buy orders spread over past
months across two venues ("Best Price", "Lang & Schwarz"-like fictional venue —
use fictional names, e.g. "Prime Exchange").

**Live simulation (`sim/market.ts`):** kit `createSimulation({ tickMs: 800, seed, onTick(rng) })`.
Each tick, for the **selected** instrument:
- walk `lastPrice` (bounded ±0.05% steps around a slow drift), derive `bid = last − spread/2`,
  `ask = last + spread/2` with seeded sizes,
- emit 0–2 `Trade`s → push into the tape's `createStreamBuffer` (capacity 64),
- update the in-progress 10m candle (close/high/low/volume) and roll a new candle when the
  bucket boundary passes; keep 1h/D/W consistent by updating their last candle's close,
- jitter the 8 book levels each side (sizes; occasionally shift prices by one step),
- update the day's range low/high signals.

Pause/resume via kit sim `toggle()` (kit AppShell already exposes the control pattern —
follow `pulse`).

### 5.3 State (all signals; module-level in `store/`)

- `selectedInstrumentId = persistedSignal('trade.instrument', DEFAULT_ID)`
- `lastPrice`, `bid`, `ask`, `dayLow`, `dayHigh`, `prevClose` — `signal<number>`
- `candlesByInterval: Record<Interval, Signal<readonly Candle[]>>`
- `book: signal<{ bids: BookLevel[]; asks: BookLevel[] }>`
- `tape = createStreamBuffer<Trade>({ capacity: 64 })`
- `orders = signal<readonly Order[]>(SEED_ORDERS)`; `cash = signal<number>`
- computeds: `dayChangePct`, `positionValue`, `returnPct`, `portfolioValue = cash + Σ positions`
- ticket: `side`, `orderType`, `validity`, `shares` signals; computed `fees` (flat €1 when
  shares > 0), `total = shares × (side === 'buy' ? ask : bid) + fees`, `canSubmit`
  (shares > 0 and, for buys, `total ≤ cash + ε`; selling capped at held shares)

Switching instruments re-seeds market signals from that instrument's seed data.
Only `trade.instrument` and the kit theme key persist; everything else is session state.

### 5.4 Layout & responsiveness (mobile-first, canonical scale only)

Kit `AppShell` (nav: single "Trading" section + disabled "Research"; CommandMenu items =
instrument switcher + panel jumps). Inside, a CSS grid in `App.module.css`:

- **base (320–479px):** single column, order: chart → instrument summary → orderbook →
  time & sales → orders. Order ticket lives in a bottom `Sheet` opened by a sticky
  "Trade" `Button` (touch target ≥ 44px via `--cascivo-target-min-coarse`). Nothing is
  `display:none` — panels stack.
- **`40rem` (md):** two columns — chart spans full width; summary + orderbook side by side;
  ticket still a Sheet.
- **`64rem` (lg):** three columns — ticket becomes an inline left panel (Sheet trigger hidden
  because the same `OrderTicket` component now renders inline — the *content* is never lost);
  center = chart + orders; right = summary + orderbook + tape.
- **`80rem` (xl):** the reference's four-column density: `Resizable` between chart column and
  right rail; left = ticket + tape; right rail = summary/orderbook stacked; orders under summary.

Use `Grid`/`GridItem` + `@container` queries in module CSS; width literals only from
{30rem, 40rem, 64rem, 80rem}. Verify with `pnpm breakpoint:check` and the manual overflow
sweep at 320/360/390/414.

### 5.5 Panel specs

**TopBar (`sections/TopBar.tsx`)** — rendered into the kit AppShell header end slot (or the
closest slot the kit exposes; `pulse` shows the pattern):
- portfolio pill: `formatNumber(portfolioValue, currency)` + day change `Stat`-style delta
  (green/red via `success`/`error` tokens),
- cash pill: `€{cash}`,
- profile: `Avatar` (initials "AU", fictional user "Alex Urban") as a toggle button
  controlling a **`HeaderPanel`** (`open` signal + `onClose`; the component brings native
  Popover-API anchoring below the header at the inline-end edge, focus restore, Escape and
  light-dismiss for free). The panel body reproduces screenshot 2's **card-based**
  composition as a `Stack` of `Card` surfaces on a dimmed backdrop:
  1. **Profile card** — `Card` containing `User` (avatar + "Profile" eyebrow + full name);
     the whole card is a button navigating nowhere (demo stub).
  2. **Two-up card row** — `Columns`/`Grid` (2 cols): an "Accounts" `Card` (label +
     `AvatarGroup` of account avatars) and a "Net Worth" `Card` (label + formatted value —
     reuse the `portfolioValue` computed).
  3. **Menu card** — `Card` (`padding:'none'`) with a "Profile" section heading and a
     stack of `Item` rows (`ItemMedia` = icon from `@cascivo/icons`, `ItemContent` =
     `ItemTitle` + `ItemDescription`): Get help / Invite friends / Tax / Statements /
     Settings — each rendered as a `<button>`; selecting fires a `Toast`
     ("Not part of this demo") and closes the panel.
  Do **not** use `Dropdown` here — its declarative `items` API cannot host card content;
  `HeaderPanel` exists precisely for this rich header-anchored surface.

**OrderTicket** — `Card` containing:
- venue `Dropdown` ("Best Price — Bid €x.xx · Ask €x.xx", one fictional alternative venue),
- `SegmentedControl` Buy/Sell (`size:'md'`),
- `Select` order type (Market/Limit/Stop; Limit/Stop reveal a `NumberInput` limit price —
  conditional render is fine, it's user-driven disclosure),
- `Select` validity (Today / Good-til-cancelled),
- `NumberInput` shares (min 0, step 1, precision 0 for the demo; `error` when exceeding
  cash/holdings),
- `DataList` (size `sm`): Fees, Total, Available cash,
- disclaimer paragraph (i18n string) with a non-navigating link,
- submit `Button` (`variant: side === 'buy' ? 'primary' : 'destructive'`, label "Buy"/"Sell",
  disabled until `canSubmit`). Submit → append an `executed` `Order` (market fill at
  bid/ask), adjust `cash` + position, reset shares, fire success `Toast`.

**PriceChart** — `Card` with:
- header: instrument name, `Stat` (last price, delta vs `prevClose`, trend), bid/ask with
  sizes (small muted text, tabular-nums), venue `Dropdown`, "Trade" `Button`
  (scrolls to / opens the ticket),
- controls row: `SegmentedControl` interval (10m/1h/D/W) + range `SegmentedControl`
  (1D/1W/1M/3M/1Y/All) — range presets set the zoom window signal over the active
  interval's candle array (e.g. "1M" on D = last ~22 candles),
- the enhanced `Candlestick`: `data` = windowed active-interval candles (cap ≤ 200 via
  range), `volume`, `zoom`, `dataZoom`, `tooltipMode:'axis'`,
  `annotations=[{type:'threshold', y:lastClose, label:formatted price}]`,
  `upColor:'var(--cascivo-color-success)'`, `downColor:'var(--cascivo-color-error)'`.
  Candle `t` label = `formatDate` appropriate to interval.
- Live behavior: on 10m/1h intervals, the last candle updates with ticks (signal-driven).

**InstrumentSummary** — `Card`:
- `Tabs`: Summary / Insights. Insights = `EmptyState` ("Sample data only") — honest stub,
  still exercises the component.
- Summary tab: price `Stat`, 1D/1W/1M/1Y/Max `SegmentedControl` (size `sm`) driving a
  `Sparkline` (closes of the chosen window; color = success/error by window direction),
  a three-up row of `Stat`s (Position value, Return % with trend, Activity count),
  "Key statistics": `DataList` (prev close, open, volume) + day's-range `Meter`
  (min=dayLow, max=dayHigh, value=lastPrice, formatted labels).

**Orderbook** — `Card`:
- Best Bid / Best Ask `Stat` pair,
- `DepthBars` (app-local, ~60 lines): one `<svg>`; cumulative sizes via `linearScale`
  from `@cascivo/charts`; bids grow leftward from center (fill
  `var(--cascivo-color-success-subtle)`, stroke success), asks rightward (error tones);
  `aria-hidden` with an adjacent visually-hidden text summary ("Best bid …, best ask …,
  N levels"), since the ladder below carries the accessible data,
- ladder: 8 rows × (bid size, bid price | ask price, ask size) — semantic `<table>` or
  `StructuredList`, tabular-nums, right-aligned numerics, subtle row background
  proportional to size (inline `style` custom property + CSS),
- footnote (i18n): "Aggregated sample data across venues."

**TimeAndSales** — `Card` + `ScrollArea` (max-height token-based):
- header row Time/Price/Size; rows from `tape` signal (newest first),
- price cell colored by uptick/downtick vs previous trade (success/error `-content` tones),
- brief highlight on entry via CSS animation, gated by `prefers-reduced-motion`,
- time = `formatDate` with `HH:mm:ss` (not `RelativeTime` — tape needs absolute stamps).

**OrdersTable** — `Card` + `DataTable`:
- `density:'compact'`, `stickyHeader`, `zebra` off, columns: Instrument, Status
  (`Badge variant:'success'` for Executed), Side, Type, Venue, Placed (`formatDate`),
- sortable by Placed (default desc), `pagination: { pageSize: 10 }`,
- a "Brokerage" `SegmentedControl` header stub (single option — matches reference chrome;
  or omit if it reads as dead UI — implementer's call, note it in the PR).

### 5.6 i18n & formatting

- All strings in `src/i18n.ts` via `defineMessages('trade', {...})`; render via `t(msg.key)`.
  No hardcoded JSX strings (the coverage/lint rules and CLAUDE.md both require this).
- Money: `formatNumber(value, { style:'currency', currency:'EUR' })` through a `format.ts`
  helper; sizes/shares via plain `formatNumber`. Tabular numerals
  (`font-variant-numeric: tabular-nums`) on every numeric column.
- Optional stretch (skip if time-boxed): register a `de` catalog like first-party packages do.

### 5.7 Styling rules

- CSS Modules per section, mobile-first, tokens only — **no hex literals**; price colors via
  `--cascivo-color-success/error(-subtle/-content)`; surfaces via `--cascivo-color-surface/bg-subtle/border`.
- Density: this is the one showcase that should read "terminal-dense" — smaller paddings via
  spacing tokens, `sm` component sizes in rails, `compact` table density.
- Touch targets ≥ 44px under `(pointer: coarse)` via `min-block-size: var(--cascivo-target-min-coarse, 2.75rem)`
  on all interactive controls (ticket controls, segmented controls, table rows' actions).
- Any CSS `@function`/`if()` use needs the static-fallback-first pattern (`pnpm fallback:check`).

### 5.8 Phase B tests

- `test/smoke.spec.ts`: seed invariants — candle OHLC consistency, aggregation correctness
  (weekly from daily), seeded orders shape, portfolio math (`returnPct` from cost basis).
- `src/store/ticket.test.ts`: total/fees computeds; `canSubmit` false when total > cash;
  sell capped at holdings; submit appends executed order, debits cash, resets shares.
- `src/data/candles.test.ts`: generator determinism (same seed ⇒ same series), bucket rolling.
- `src/sections/OrderTicket.test.tsx` (jsdom + testing-library): render, enter shares,
  submit, assert order appended + toast fired. Use fixed seeds and manual tick invocation —
  **never** timing-dependent assertions; drive `onTick` directly rather than waiting on
  intervals.
- Component reactivity gotcha to test-guard: at least one test asserting the price header
  updates after a manual tick (catches a forgotten `useSignals()`).

---

## 6. Phase C — wiring & registration checklist

Every item is required; miss one and CI or deploy silently skips the app.

1. **`scripts/assemble-demos.mjs`** — add `trade: '@cascivo/example-trade'` to the `DEMOS` map.
2. **`.github/workflows/cf-pages.yml`** — add `apps/examples/trade/**` to the `site`
   paths-filter list.
3. **`apps/site/src/marketing/pages/examples/data.ts`** — extend the `DemoSlug` union +
   `DEMOS` array: slug `trade`, tagline (e.g. "A brokerage trading workspace — live
   candlesticks, orderbook, and order flow"), `feelsLike`, `coverage[]` (Candlestick,
   Sparkline, Meter, DataTable, NumberInput, SegmentedControl, CommandMenu, Resizable,
   Sheet, Stat, HeaderPanel, Item, …), `liveHref: '/demos/trade/'`, `detailHref: '/examples/trade'`.
4. **Screenshots** — run `screenshots:generate` (`scripts/gen-demo-screenshots.mjs`) and
   commit the generated assets referenced by the marketing page.
5. **`scripts/checks/demo-storage-keys.test.ts`** — add `'trade'` to the `DEMOS` array;
   ensure all `persistedSignal` keys are `trade.`-prefixed.
6. **`apps/examples/coverage.test.ts`** — add `'trade'` to the `APPS` scan list.
   Optionally add `'Candlestick'` to `REQUIRED_CHARTS` (this demo guarantees it — nice
   ratchet; recommended).
7. **Root `package.json`** — add the app to the `dev:landing:full` filter list.
8. **`readme.body.md`** — write it; run `pnpm regen` to produce `README.md`; commit both.
9. **Port** — 4186 (4180–4185 are taken).

No `pnpm-workspace.yaml` or root task changes needed — `apps/examples/*` globs pick the
app up automatically for `vp run -r` build/check/test.

---

## 7. Acceptance criteria

1. `pnpm ready` exits 0 (regen, format+lint, build, type check, tests) and `pnpm ready:ci`
   passes (cold-cache build order — will catch a missing vite source alias).
2. `pnpm breakpoint:check` and `pnpm fallback:check` pass.
3. `vp dev` in `apps/examples/trade` at 4186: all seven panels render with seeded data;
   ticks visibly move price header, tape, book, and the last candle; pause/resume works.
4. Order flow: enter shares → total/fees update → Buy → toast + row in Orders + cash debited;
   over-cash buy is blocked with a visible error.
5. Interval + range selectors re-window the candlestick; wheel/drag zoom and the DataZoom
   slider work; last-price threshold annotation tracks ticks.
6. Profile `HeaderPanel` matches screenshot 2's card composition — profile `Card`,
   accounts/net-worth two-up `Card` row, grouped menu `Card` with five `Item` entries —
   anchored below the header at the inline-end edge, closing on Escape and light-dismiss
   with focus restored to the avatar button.
7. Mobile sweep at 320/360/390/414: no horizontal overflow, ticket reachable via bottom
   sheet, touch targets ≥ 44px, nothing display:none'd away.
8. Keyboard-only pass: ticket fully operable, chart zoom keys (+/−/0) work, dropdown/menu/
   command-menu operable, tape/book content reachable (scroll areas focusable).
9. No `useState`/`useContext`/`useEffect`/`useLayoutEffect`/`useReducer` anywhere in the app
   (grep gate); every render-reading component starts with `useSignals()`.
10. All user-visible strings via `t()`; no trademarked names anywhere.
11. Storybook builds; the new Candlestick story renders.
12. Demo deploys under `/demos/trade/` via the landing build (verify `pnpm run build:landing-demos`
    locally produces `apps/site/dist/demos/trade/index.html`).

---

## 8. Suggested execution order (each step ends verified)

```
A1 Candlestick tests for zoom/dataZoom/axis-tooltip/annotations (red)
A2 Implement props mirroring LineChart wiring (green)         → vp run @cascivo/charts#test
A3 Meta + story + pnpm regen artifacts                        → pnpm ready
B1 Scaffold app from pulse (rename, port, aliases, i18n ns)   → vp dev renders shell
B2 data/candles.ts + seed.ts + tests                          → vp test (app)
B3 stores (market/portfolio/ticket) + tests                   → vp test (app)
B4 sim/market.ts + pause/resume                               → manual: ticks move signals
B5 PriceChart + InstrumentSummary panels                      → visual check vs reference
B6 OrderTicket (+ mobile Sheet) + tests                       → order flow e2e in browser
B7 Orderbook (DepthBars) + TimeAndSales                       → visual + a11y check
B8 OrdersTable + TopBar/profile menu + CommandMenu items      → visual check
B9 Responsive pass (320→1440) + touch targets + reduced motion → breakpoint:check + sweep
C1 Wiring checklist items 1–9                                 → build:landing-demos locally
C2 readme.body.md + screenshots + marketing entry             → site examples page renders
F  pnpm ready && pnpm ready:ci                                → commit/push
```

## 9. Decisions already made (do not re-litigate; flag only if blocked)

- Enhance `Candlestick` in the package (G1) rather than forking chart code into the app.
- Last-price **annotation**, not a full 2-D crosshair (G2). A bidirectional crosshair with
  y-axis price tag is a reasonable *follow-up* `@cascivo/charts` feature — if desired,
  file it in `factory-backlog.json`, don't build it here.
- Depth histogram and trade tape are **app-local** compositions (G3, G4).
- New example app slug **`trade`**, port **4186**, React (not Preact), kit AppShell chrome,
  default theme dark, fictional data/branding, two-PR split (A, then B+C).
