import { Badge } from '@cascivo/components/badge'
import { Stat } from '@cascivo/components/stat'
import { CopyButton } from '@cascivo/components/copy-button'
import { componentCount, themeCount, axeViolations, gzip, kb, partial } from './figures'

const INIT = 'npx cascivo init'

/** The three stat blocks stacked down the hero's right column. */
const stats: { value: string; label: string; tone: string }[] = [
  ...(gzip ? [{ value: kb(gzip.cascivo), label: 'total gzip · benchmark app', tone: 'acid' }] : []),
  ...(partial
    ? [
        {
          value: `${partial.speedup.toFixed(1)}×`,
          label: 'faster partial updates',
          tone: 'surface',
        },
      ]
    : []),
  ...(axeViolations !== undefined
    ? [{ value: String(axeViolations), label: 'axe violations · 4 app states', tone: 'invert' }]
    : []),
]

export function PosterHero() {
  return (
    <section className="pg-section pg-cols pg-cols--8-4" id="hero" aria-label="cascivo">
      <div className="pg-pad pg-hero-lead">
        <Badge className="pg-hero-badge" variant="outline">
          {componentCount} components · {themeCount} themes · MIT
        </Badge>
        <h1 className="pg-display pg-display--hero">
          Own
          <br />
          your
          <br />
          <span className="pg-mark">stylesheet.</span>
        </h1>
        <p className="pg-lede">
          A React design system with no Tailwind, no runtime, and no utility soup. The CLI copies
          the source into your repo — plain CSS and tokens you can read, and so can your agent.
        </p>
        <div className="pg-hero-actions">
          <a className="pg-btn pg-btn--primary" href="/docs/getting-started">
            Get started
          </a>
          <div className="pg-command">
            <code>{INIT}</code>
            <CopyButton className="pg-command-copy" value={INIT} />
          </div>
        </div>
      </div>

      <div className="pg-hero-stats">
        {stats.map((s) => (
          <div key={s.label} className={`pg-hero-stat pg-hero-stat--${s.tone}`}>
            <Stat className="pg-stat" value={s.value} label={s.label} />
          </div>
        ))}
        <p className="pg-hero-aside pg-mono">
          measured, not claimed →{' '}
          <a className="pg-hero-aside-link" href="/performance">
            benchmarks
          </a>
        </p>
      </div>
    </section>
  )
}
