import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { KpiTile } from '../src/sections/KpiTile'
import type { KpiTileProps } from '../src/sections/KpiTile'

const base: KpiTileProps = {
  index: 0,
  label: 'P99 latency',
  value: '250',
  unit: 'ms',
  delta: -12.5,
  goodDirection: 'down',
  series: [200, 260, 240, 250],
  format: (v) => String(v),
}

const html = (props: Partial<KpiTileProps> = {}) =>
  renderToStaticMarkup(<KpiTile {...base} target={500} {...props} />)

describe('KpiTile', () => {
  it('shows value, unit and the low/peak of the trend', () => {
    const out = html()
    expect(out).toContain('250<span')
    expect(out).toContain('>ms<')
    expect(out).toContain('<dd>260</dd>')
    expect(out).toContain('<dd>200</dd>')
  })

  it('labels the objective and stays calm under it', () => {
    const out = html()
    expect(out).toContain('Target 500')
    expect(out).not.toContain('data-breach')
  })

  // The hot colour never stands alone: crossing the objective also changes the words.
  it('turns hot and says so past the objective', () => {
    const out = html({ series: [200, 650], value: '650' })
    expect(out).toContain('data-breach')
    expect(out).toContain('Over target 500')
  })

  it('reads the objective the other way for up-is-good metrics', () => {
    expect(html({ goodDirection: 'up', target: 300, series: [320, 280] })).toContain('data-breach')
  })

  it('keys the delta colour on sentiment, not sign', () => {
    expect(html({ delta: -12.5 })).toContain('data-sentiment="good"')
    expect(html({ delta: 8 })).toContain('data-sentiment="bad"')
  })

  it('omits the rule when there is no objective', () => {
    expect(renderToStaticMarkup(<KpiTile {...base} />)).not.toContain('Target')
  })
})
