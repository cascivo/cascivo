// Single source of truth for the six showcase demos, shared by:
//   - pages/ExamplesPage.tsx        (the /examples hub)
//   - pages/ExampleDetailPage.tsx   (the /examples/<slug> detail pages)
//
// Live apps are assembled into the landing under /demos/<slug>/ (see
// scripts/assemble-demos.mjs); marketing pages live at /examples/<slug>.
// Import-free of React so build-time code can reuse the slugs.

export type DemoSlug = 'deploy' | 'pay' | 'flow' | 'track' | 'pulse' | 'trade'

export interface DemoScreenshots {
  /** 1280×800 captures. */
  desktopLight: string
  desktopDark: string
  /** 390×844 captures. */
  mobileLight: string
  mobileDark: string
}

export interface Demo {
  slug: DemoSlug
  name: string
  /** The recognisable product whose interaction shape this re-creates. */
  feelsLike: string
  /** One line for cards/hubs. */
  tagline: string
  /** Longer paragraph for the detail-page hero. */
  description: string
  /** What library surface this demo exercises — the evaluator's "why it matters". */
  proves: string
  /** Featured components/charts shown as chips. */
  coverage: string[]
  /** The live, drivable app (same origin). */
  liveHref: string
  /** The marketing detail page. */
  detailHref: string
  screenshots: DemoScreenshots
}

function screenshots(slug: DemoSlug): DemoScreenshots {
  const base = `/screenshots/${slug}`
  return {
    desktopLight: `${base}/light-desktop.png`,
    desktopDark: `${base}/dark-desktop.png`,
    mobileLight: `${base}/light-mobile.png`,
    mobileDark: `${base}/dark-mobile.png`,
  }
}

export const DEMOS: Demo[] = [
  {
    slug: 'deploy',
    name: 'Cascivo Deploy',
    feelsLike: 'Vercel',
    tagline: 'Projects, deployments, and build logs with a live simulation engine.',
    description:
      'A deployments dashboard in the shape of Vercel: projects, environments, and a build pipeline whose stages advance in real time. Click into a deployment, watch a build progress, and inspect its logs — all driven by a seeded, client-side simulation with no backend.',
    proves:
      'Exercises the full application shell — header, side navigation, command menu, and a dense DataTable — alongside the async states a real product needs: skeletons while data loads, a live ProgressBar as a build advances, and Toasts on completion.',
    coverage: [
      'AppShell',
      'DataTable',
      'Status',
      'Badge',
      'Stat',
      'Sparkline',
      'CommandMenu',
      'ProgressBar',
      'Toast',
    ],
    liveHref: '/demos/deploy/',
    detailHref: '/examples/deploy',
    screenshots: screenshots('deploy'),
  },
  {
    slug: 'pay',
    name: 'Cascivo Pay',
    feelsLike: 'Stripe',
    tagline: 'Revenue, payments, and customer management with date-range filtering.',
    description:
      'A payments dashboard in the shape of Stripe: revenue charts, a filterable transactions table, and customer detail. Change the date range, page through payments, and issue an optimistic refund that persists across a reload — proving the data layer is real, not a static mock.',
    proves:
      'Leans hard on @cascivo/charts (AreaChart, BarChart, KPI) composed with a paginated DataTable, date-range and combobox filtering, and an optimistic-update flow with rollback — the bread and butter of analytics surfaces.',
    coverage: [
      'AreaChart',
      'BarChart',
      'KPI',
      'DataTable',
      'DateRangePicker',
      'Combobox',
      'Pagination',
      'Toast',
    ],
    liveHref: '/demos/pay/',
    detailHref: '/examples/pay',
    screenshots: screenshots('pay'),
  },
  {
    slug: 'flow',
    name: 'Cascivo Flow',
    feelsLike: 'Camunda',
    tagline: 'Process instances, task queues, and incidents with a live process diagram.',
    description:
      'A process-orchestration console in the shape of Camunda: running instances, a task queue you can claim and complete, incidents, and a hand-built process diagram with a token that moves as the simulation advances. A faithful visual of a BPMN workflow — without a BPMN engine.',
    proves:
      'Composes a bespoke SVG diagram with Timeline, TreeView, and a DataTable, plus task forms (claim/complete) wired to persisted state and the empty/error states a queue-driven product must handle gracefully.',
    coverage: [
      'Timeline',
      'TreeView',
      'DataTable',
      'Drawer',
      'Tabs',
      'EmptyState',
      'Status',
      'Badge',
    ],
    liveHref: '/demos/flow/',
    detailHref: '/examples/flow',
    screenshots: screenshots('flow'),
  },
  {
    slug: 'track',
    name: 'Cascivo Track',
    feelsLike: 'Linear',
    tagline: 'Issues board and backlog with Cmd+K command menu and persisted mutations.',
    description:
      'An issue tracker in the shape of Linear: a board and a backlog you can switch between, issues you can open, edit, and move — entirely by keyboard if you like. Cmd+K opens a command menu; every change persists to local storage and survives a reload.',
    proves:
      'A keyboard-first surface: CommandMenu + Kbd, a SegmentedControl board↔list switch, Drawer-based forms, MultiSelect and Combobox filtering, a ContextMenu, and @cascivo/storage persistence carrying the whole workspace across reloads.',
    coverage: [
      'CommandMenu',
      'Kbd',
      'SegmentedControl',
      'Drawer',
      'MultiSelect',
      'ContextMenu',
      'storage',
    ],
    liveHref: '/demos/track/',
    detailHref: '/examples/track',
    screenshots: screenshots('track'),
  },
  {
    slug: 'pulse',
    name: 'Cascivo Pulse',
    feelsLike: 'Datadog',
    tagline:
      'Metrics, alerts, and a log stream with a real-time simulation and time-range selector.',
    description:
      'An observability dashboard in the shape of Datadog: live metrics, a heatmap, alerts you can acknowledge, and a streaming log view. A pausable simulation ticks the charts in real time; pick a time range and watch the surface respond — all client-side.',
    proves:
      'The heaviest chart composition of the set — LineChart, Heatmap, Sparkline, Meter, Bullet, and ProgressCircle — driven by a live simulation engine, plus an alert list and a log stream with the loading states real-time ops UIs demand.',
    coverage: [
      'LineChart',
      'Heatmap',
      'Sparkline',
      'Meter',
      'Bullet',
      'ProgressCircle',
      'Alert',
      'Skeleton',
    ],
    liveHref: '/demos/pulse/',
    detailHref: '/examples/pulse',
    screenshots: screenshots('pulse'),
  },
  {
    slug: 'trade',
    name: 'Cascivo Trade',
    feelsLike: 'Trade Republic',
    tagline:
      'A brokerage trading workspace — live candlesticks, an orderbook, and an order ticket.',
    description:
      'A retail trading terminal in the shape of Trade Republic: a candlestick chart with a volume pane, zoom, and a last-price rule; a live orderbook with a depth histogram; a streaming time-and-sales tape; an order ticket that fills against the book; and your order history. A pausable, seeded simulation ticks the price, book, and tape in real time — all client-side.',
    proves:
      'The densest financial composition of the set — Candlestick (zoom + dataZoom + axis crosshair + annotations), Sparkline, and Meter over a live streaming buffer — plus an order ticket built from NumberInput, SegmentedControl and Select, a compact DataTable of orders, and a card-based profile HeaderPanel.',
    coverage: [
      'Candlestick',
      'Sparkline',
      'Meter',
      'NumberInput',
      'SegmentedControl',
      'DataTable',
      'HeaderPanel',
      'CommandMenu',
      'Sheet',
      'Stat',
    ],
    liveHref: '/demos/trade/',
    detailHref: '/examples/trade',
    screenshots: screenshots('trade'),
  },
]

export function demoBySlug(slug: string): Demo | undefined {
  return DEMOS.find((d) => d.slug === slug)
}
