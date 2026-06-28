# Cookbook: A Vercel-grade streaming dashboard

> **Goal:** Assemble a production-feeling deployment dashboard on cascivo — an app shell, live build
> logs, live metrics, and a deployments table — using the layout/chart/table components that already
> ship plus the v56 streaming primitives. The hard parts (high-frequency ingestion, leak-free
> workspace switching) are primitives now, not things you hand-roll.

The working reference is `apps/examples/deploy` (the **Build monitor** view assembles exactly this).

---

## The parts, and where each comes from

| Need                        | Use                                                                 | Package           |
| --------------------------- | ------------------------------------------------------------------- | ----------------- |
| Shell (header + side nav)   | `AppShell`, `SideNav`, `DashboardLayout`, `Grid`, `Stack`           | `@cascivo/layouts`/`example-kit` |
| Deployments table           | `DataTable` (sorting, pagination, virtualization)                   | `@cascivo/react`  |
| KPI cards / metrics         | `Card`, `Stat`, `Kpi`                                               | `@cascivo/react` / `@cascivo/charts` |
| **Live build log**          | `createStreamBuffer`/`useStreamBuffer` + `LogViewer`                | `@cascivo/core` + `@cascivo/react` |
| **Live charts**             | `useStreamSeries`/`bindStream` + `AreaChart`/`LineChart`            | `@cascivo/charts` |
| **Per-workspace isolation** | `createScope`/`useScope`                                            | `@cascivo/core`   |

> The shells, table, and charts **already existed** — the only genuinely new pieces are the four
> streaming/scale primitives. This recipe is mostly composition.

---

## 1. Stream the build log

A build log streams tens to hundreds of lines per second and can run for minutes. A naive
`logs.value = [...logs.value.slice(1), line]` reallocates the whole array per line (O(n)) and
re-renders per line — it crashes the tab on long builds. Use the bounded ring buffer instead:

```tsx
import { useStreamBuffer } from '@cascivo/core'
import { LogViewer, type LogLine } from '@cascivo/react'

const logs = useStreamBuffer<LogLine>({ capacity: 1000 }) // O(1) append, O(capacity) memory

// your transport — WebSocket / SSE / poll:
socket.onmessage = (e) => logs.append({ id: seq++, text: e.data })

<LogViewer lines={logs.signal} maxHeight="24rem" />
```

`LogViewer` virtualizes: only the visible rows mount, so a 100k-line buffer stays smooth. It
auto-follows the tail and releases when you scroll up; it has search, copy, and ANSI/level coloring.
The buffer's rAF coalescing means a burst of lines in one frame is one render.

## 2. Stream the metrics chart

Bind a live source to a capped, decimated series and feed it straight to a chart
(see `charts-streaming.md` for the source shapes):

```tsx
import { AreaChart, useStreamSeries } from '@cascivo/charts'

const rps = useStreamSeries<{ t: number; v: number }>({
  capacity: 120,
  decimate: { to: 120, y: (s) => s.v }, // rendered points never exceed 120
  source: (push) => {
    const es = new EventSource('/api/metrics')
    es.onmessage = (e) => push(JSON.parse(e.data))
    return () => es.close()
  },
})

<AreaChart
  title="Requests / sec"
  series={[{ id: 'rps', label: 'Req/s', data: rps.value }]}
  x={(s) => s.t}
  y={(s) => s.v}
  tooltipMode="axis"
/>
```

Need two units at once (bandwidth vs requests)? Put one series on `axis: 'right'` and enable
`secondAxis` — see `charts-streaming.md` §2.

## 3. Isolate per-workspace state

Switching org/workspace must not leak the previous workspace's live effects. Own them in a scope and
dispose on switch:

```tsx
import { createScope, useSignalEffect, useSignal } from '@cascivo/core'

const workspace = useSignal('acme')

useSignalEffect(() => {
  const id = workspace.value
  const scope = createScope()
  scope.effect(() => {
    const stop = subscribeToWorkspace(id)
    return stop
  })
  return () => scope.dispose() // old workspace's effects stop at once
})
```

In the reference app, the **Build monitor** uses exactly this: each "Restart build" creates a fresh
scope for the log generator and disposes the previous one, so no interval leaks.

## 4. Frame it with the shell

```tsx
import { AppShell } from '@cascivo/example-kit'

<AppShell navGroups={navGroups} mockBanner>
  {view === 'builds' && <BuildMonitor />}
  {view === 'deployments' && <Deployments />}
</AppShell>
```

`AppShell`/`DashboardLayout`/`SideNav` ship today — compose them, don't rebuild them. The installable
`dashboard` template (`cascivo add @cascivo/dashboard`) is a starting point that points at these
primitives.

---

## Plug in your real backend

Everything above is **client-side**. The reference app drives the streams from a deterministic mock
(a `setInterval` script) so it runs with no server. To go live, replace the `source` callback (for
charts) and the `socket.onmessage`/append call (for logs) with your real WebSocket/SSE/poll — nothing
else changes. The buffering, decimation, virtualization, and scope teardown are already handled.

## Notes

- `useStreamBuffer`/`createStreamBuffer` and `createScope` are signals-only — no `useState`/
  `useEffect`. Any DOM/timer side effect goes through `useSignalEffect`.
- Decimation never touches accessibility: the chart's fallback `<table>` keeps the full data, and
  `LogViewer` exposes `role="log"` + an `aria-live` line count.
- Multi-axis applies to `LineChart` and non-stacked `AreaChart`.
