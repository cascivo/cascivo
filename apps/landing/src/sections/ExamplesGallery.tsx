const EXAMPLES = [
  {
    name: 'Cascade Deploy',
    feelsLike: 'Vercel',
    description: 'Projects, deployments, and build logs with a live simulation engine.',
    slice: 'AppShell, DataTable, Status, Badge, Stat, Sparkline, CommandMenu, ProgressBar, Toast',
    href: '#',
  },
  {
    name: 'Cascade Pay',
    feelsLike: 'Stripe',
    description: 'Revenue, payments, and customer management with date-range filtering.',
    slice: 'AreaChart, BarChart, KPI, DataTable, DateRangePicker, Combobox, Pagination, Toast',
    href: '#',
  },
  {
    name: 'Cascade Flow',
    feelsLike: 'Camunda',
    description: 'Process instances, task queues, and incidents with a live process diagram.',
    slice: 'Timeline, TreeView, DataTable, Drawer, Tabs, EmptyState, Status, Badge',
    href: '#',
  },
  {
    name: 'Cascade Track',
    feelsLike: 'Linear',
    description:
      'Issues board and backlog with Cmd+K command menu and storage-persisted mutations.',
    slice: 'CommandMenu, SegmentedControl, Drawer, MultiSelect, ContextMenu, storage',
    href: '#',
  },
  {
    name: 'Cascade Pulse',
    feelsLike: 'Datadog',
    description:
      'Metrics, alerts, and log stream with a real-time simulation and time-range selector.',
    slice: 'LineChart, Heatmap, Sparkline, Meter, Bullet, ProgressCircle, Alert, Skeleton',
    href: '#',
  },
]

export function ExamplesGallery() {
  return (
    <section id="examples" className="section examples-gallery" data-reveal>
      <h2>Drive it, don&rsquo;t read about it.</h2>
      <p className="section-sub examples-gallery-sub">
        Five functional mock dashboards, each modelled on a well-known SaaS product. No backend, no
        accounts, no setup — open the URL and play. Collectively they exercise every component and
        every chart in the library.
      </p>
      <div className="examples-grid">
        {EXAMPLES.map((ex) => (
          <div key={ex.name} className="examples-card">
            <div className="examples-card-header">
              <span className="examples-name">{ex.name}</span>
              <span className="examples-feels-like">feels like {ex.feelsLike}</span>
            </div>
            <p className="examples-desc">{ex.description}</p>
            <ul className="examples-chips" aria-label="Featured components">
              {ex.slice.split(', ').map((chip) => (
                <li key={chip} className="examples-chip">
                  {chip}
                </li>
              ))}
            </ul>
            <div className="examples-card-footer">
              <a className="examples-link" href={ex.href} aria-disabled="true">
                View demo &rarr;
              </a>
              <span className="examples-mock-note">Mock demo &mdash; no real data</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
