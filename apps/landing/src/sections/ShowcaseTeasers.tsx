// Lightweight static teasers for the showcase's non-default tabs. They show a
// representative screenshot plus a deep link to the full demo on /examples —
// the heavy ChartShowcase / RelayConsole live there, not in the home bundle.

export function ChartsTeaser() {
  return (
    <div className="showcase-teaser">
      <a className="showcase-teaser-media" href="/examples#charts" aria-hidden="true" tabIndex={-1}>
        <img
          src="/screenshots/pulse/light-desktop.png"
          alt=""
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
        />
      </a>
      <div className="showcase-teaser-body">
        <h3>17 chart types. CVD-safe. Keyboard-first.</h3>
        <p>
          BarChart, AreaChart, LineChart, Heatmap, Sparkline and more — every chart adapts to the
          active theme, palettes verified under protanopia, deuteranopia, and tritanopia.
        </p>
        <a className="showcase-teaser-link" href="/examples#charts">
          See the charts &rarr;
        </a>
      </div>
    </div>
  )
}

export function RelayTeaser() {
  return (
    <div className="showcase-teaser">
      <a className="showcase-teaser-media" href="/examples" aria-hidden="true" tabIndex={-1}>
        <img
          src="/screenshots/deploy/light-desktop.png"
          alt=""
          width={1280}
          height={800}
          loading="lazy"
          decoding="async"
        />
      </a>
      <div className="showcase-teaser-body">
        <h3>Real apps, not toy demos.</h3>
        <p>
          Five drivable dashboards — shaped like Vercel, Stripe, Camunda, Linear, and Datadog — plus
          a live relay console. App shells, data tables, command menus, and async states, all built
          with cascivo.
        </p>
        <a className="showcase-teaser-link" href="/examples">
          Open the examples &rarr;
        </a>
      </div>
    </div>
  )
}
