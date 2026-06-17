import { Stat } from '@cascivo/components/stat'
import bench from 'virtual:bench'

type StatItem = { label: string; value: string | number; helpText: string }

const cascadeBundle = bench.bundle?.apps.cascade
const cascadeAxe = bench.a11y?.cascade
const typeRenders = bench.renders?.['type-20-chars']?.cascade

const STATS: StatItem[] = [
  {
    label: 'Registry entries',
    value: __CASCIVO_COMPONENT_COUNT__,
    helpText: 'Components, charts, layouts, blocks — each with a machine-readable manifest.',
  },
  ...(cascadeBundle
    ? [
        {
          label: 'Total gzip',
          value: `${cascadeBundle.totalGzKb.toFixed(1)} KB`,
          helpText: 'JS + CSS of the full benchmark app — measured, not estimated.',
        },
      ]
    : []),
  ...(cascadeAxe
    ? [
        {
          label: 'axe violations',
          value: cascadeAxe.violations,
          helpText: 'WCAG 2.2 AA scan across four app states. CI fails on any.',
        },
      ]
    : []),
  ...(typeRenders !== undefined
    ? [
        {
          label: 'Commits for 20 keystrokes',
          value: typeRenders,
          helpText: 'React Profiler commit count while typing — the signals story.',
        },
      ]
    : []),
]

export function StatsBand() {
  if (STATS.length < 2) return null
  return (
    <section className="stats-band" aria-label="By the numbers" data-reveal="">
      <div className="stats-band-row">
        {STATS.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} helpText={s.helpText} />
        ))}
      </div>
      <a className="stats-band-link" href="/performance">
        See the numbers &rarr;
      </a>
    </section>
  )
}
