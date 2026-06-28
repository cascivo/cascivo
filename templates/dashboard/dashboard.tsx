import './dashboard.module.css'
import { dashboardFixtures } from './fixtures'

// Components installed via this template's registryDependencies: card, badge,
// data-table. After install they live in your components directory — import them
// from there and swap them in for the placeholders below.

/**
 * Analytics dashboard template page. Owned, copy-paste source — adapt freely.
 * Presentational only: no useState/useEffect (cascade house rules).
 */
export function DashboardPage() {
  const { kpis, activity } = dashboardFixtures
  return (
    <main className="dashboard">
      <header className="dashboard__head">
        <h1>Overview</h1>
        <p>Last 30 days</p>
      </header>

      <section className="dashboard__kpis" aria-label="Key metrics">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="dashboard__kpi">
            <p className="dashboard__kpi-label">{kpi.label}</p>
            <p className="dashboard__kpi-value">{kpi.value}</p>
            <p className="dashboard__kpi-delta" data-trend={kpi.trend}>
              {kpi.delta}
            </p>
          </article>
        ))}
      </section>

      <section className="dashboard__chart" aria-label="Trend">
        {/*
          Static trend: drop a <LineChart> from @cascivo/charts here.

          For a LIVE chart, bind a poll/SSE/WebSocket source with useStreamSeries
          (@cascivo/charts) into a capped, decimated signal:

            const series = useStreamSeries({ capacity: 600, decimate: { to: 200, y: s => s.v },
              source: push => { const es = new EventSource('/metrics'); es.onmessage = e => push(JSON.parse(e.data)); return () => es.close() } })
            <AreaChart series={[{ id: 'm', label: 'Metric', data: series.value }]} x={s => s.t} y={s => s.v} />

          See docs/cookbooks/vercel-dashboard.md + charts-streaming.md.
        */}
        <div className="dashboard__chart-placeholder">Chart</div>
      </section>

      <section className="dashboard__logs" aria-label="Live output">
        {/*
          Live build/deploy log: feed a bounded ring buffer (createStreamBuffer /
          useStreamBuffer from @cascivo/core) and render it with <LogViewer> from
          @cascivo/react — only the visible rows mount, so it scales to 100k lines:

            const logs = useStreamBuffer({ capacity: 1000 })
            socket.onmessage = e => logs.append({ id: seq++, text: e.data })
            <LogViewer lines={logs.signal} />

          Wrap per-workspace state in createScope() and dispose() on workspace
          switch so live effects never leak. See docs/cookbooks/vercel-dashboard.md.
        */}
        <div className="dashboard__chart-placeholder">Live log</div>
      </section>

      <section className="dashboard__activity" aria-label="Recent activity">
        <h2>Recent activity</h2>
        <table className="dashboard__table">
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">User</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((row) => (
              <tr key={row.id}>
                <td>{row.when}</td>
                <td>{row.user}</td>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
