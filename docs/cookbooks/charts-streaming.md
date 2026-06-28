# Cookbook: Live, streaming charts (poll / SSE / WebSocket)

> **Goal:** Push a live metrics stream — HTTP polling, Server-Sent Events, or a WebSocket — into a
> `@cascivo/charts` `LineChart`/`AreaChart` without unbounded memory growth or dropped frames, and
> overlay two metrics on independent y-axes (e.g. bandwidth vs requests/sec).

---

## TL;DR

`useStreamSeries` binds a live **source** to a bounded, O(1) ring buffer (from `@cascivo/core`'s
`createStreamBuffer`) and hands the chart a capped, optionally **decimated** window as a signal. The
source is the only seam you write — a polling loop, an `EventSource`, or a socket — and the helper
never opens a connection itself.

```tsx
import { AreaChart, useStreamSeries } from '@cascivo/charts'

interface Sample { t: number; mbps: number }

function BandwidthChart() {
  const series = useStreamSeries<Sample>({
    capacity: 600, // keep the last 600 samples — O(capacity) memory, O(1) append
    decimate: { to: 200, y: (s) => s.mbps }, // never render more than 200 points
    source: (push) => {
      const es = new EventSource('/api/metrics')
      es.onmessage = (e) => push(JSON.parse(e.data) as Sample)
      return () => es.close() // teardown runs on unmount
    },
  })

  return (
    <AreaChart
      title="Bandwidth"
      series={[{ id: 'bw', label: 'Mbps', data: series.value }]}
      x={(s) => s.t}
      y={(s) => s.mbps}
    />
  )
}
```

Why each piece matters:

- **`capacity`** bounds memory. The ring buffer overwrites the oldest sample in place — it never
  reallocates the array, so a stream running for hours stays at `O(capacity)`, not `O(total)`.
- **rAF coalescing** (built into `createStreamBuffer`) means a burst of samples within one animation
  frame produces **one** re-render, so a fast stream can't starve the main thread.
- **`decimate`** caps the *rendered* point count (LTTB by default, shape-preserving). The buffer can
  hold 600 samples while the chart draws at most 200 — first and last always kept.

> **Never** do `signal.value = [...signal.value.slice(1), sample]`. That reallocates and re-copies the
> whole array on every sample (O(n) per sample) and re-renders per sample — the exact GC pressure the
> ring buffer avoids.

---

## 1. The `source` seam

`source: (push) => unsubscribe` is where your transport lives. Three common shapes:

**Polling:**

```tsx
source: (push) => {
  const id = setInterval(async () => {
    const r = await fetch('/api/metrics/latest')
    push(await r.json())
  }, 1000)
  return () => clearInterval(id)
}
```

**Server-Sent Events:**

```tsx
source: (push) => {
  const es = new EventSource('/api/metrics')
  es.onmessage = (e) => push(JSON.parse(e.data))
  return () => es.close()
}
```

**WebSocket:**

```tsx
source: (push) => {
  const ws = new WebSocket('wss://example.com/metrics')
  ws.onmessage = (e) => push(JSON.parse(e.data))
  return () => ws.close()
}
```

The returned function is called on unmount (and is also wired to cancel any pending flush), so the
connection always closes cleanly.

---

## 2. Two metrics, two axes

When two series have different units/ranges (bandwidth in Mbps, requests/sec in the thousands), put
one on a right-hand axis with `axis: 'right'` and enable `secondAxis`. The left axis covers the
default series; the right axis is scaled independently.

```tsx
<LineChart
  title="Traffic"
  series={[
    { id: 'bw', label: 'Mbps', data: bw.value },
    { id: 'rps', label: 'Req/s', axis: 'right', data: rps.value },
  ]}
  x={(s) => s.t}
  y={(s) => s.v}
  secondAxis={{ format: (n) => `${n}/s` }}
  tooltipMode="axis"
/>
```

- `axis: 'right'` moves a series onto a second y-scale derived from *its own* extent.
- `secondAxis.format` formats the right-axis ticks.
- `tooltipMode="axis"` gives a shared crosshair tooltip listing both series at the hovered x.
- Omitting `axis`/`secondAxis` leaves the chart byte-identical to the single-axis default.

Multi-axis applies to `LineChart` and the **non-stacked** `AreaChart` (stacking is single-axis by
definition).

---

## 3. Imperative use outside a component

`bindStream` is the non-hook form — useful in a store or controller. It returns the window signal
plus a `stop()`:

```ts
import { bindStream } from '@cascivo/charts'

const { signal, stop } = bindStream<Sample>({
  capacity: 600,
  decimate: { to: 200, y: (s) => s.mbps },
  source: (push) => subscribeToMetrics(push),
})
// …later, on teardown:
stop()
```

---

## Notes

- `useStreamSeries`/`bindStream` are **client-side** — they cap and (optionally) decimate; they do
  not open a connection. Wire your real transport in `source`.
- The chart's fallback `<table>` always carries the data passed to it, so decimation never affects
  accessibility.
- For extremely dense *static* series, the chart's own `decimate` prop downsamples at draw time; the
  stream helper's `decimate` is the streaming analogue, applied to the live window.
