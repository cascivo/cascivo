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
        {/* Drop a <LineChart> from @cascivo/charts here. */}
        <div className="dashboard__chart-placeholder">Chart</div>
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
