import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Glyph, glyphPath, type GlyphShape } from './glyph'
import { ScatterChart } from '../charts/scatter-chart/scatter-chart'

const SHAPES: GlyphShape[] = ['circle', 'square', 'diamond', 'triangle', 'cross', 'star']

describe('glyphPath', () => {
  it('returns a path for every non-circle shape, empty for circle', () => {
    expect(glyphPath('circle', 10)).toBe('')
    for (const s of SHAPES.filter((x) => x !== 'circle')) {
      const d = glyphPath(s, 10)
      expect(d.startsWith('M')).toBe(true)
      expect(d.endsWith('Z')).toBe(true)
      expect(d).not.toContain('NaN')
    }
  })

  it('scales with size', () => {
    expect(glyphPath('square', 10)).not.toBe(glyphPath('square', 20))
  })
})

describe('Glyph', () => {
  it('renders a <circle> for circle and a <path> for others, centered at (x,y)', () => {
    const c = render(
      <svg>
        <Glyph shape="circle" x={5} y={6} size={8} color="red" />
      </svg>,
    )
    expect(c.container.querySelector('circle')?.getAttribute('cx')).toBe('5')

    const d = render(
      <svg>
        <Glyph shape="diamond" x={5} y={6} size={8} color="red" />
      </svg>,
    )
    const path = d.container.querySelector('path')!
    expect(path.getAttribute('transform')).toBe('translate(5,6)')
    expect(path.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('ScatterChart glyph encoding', () => {
  const series = [
    {
      id: 'a',
      label: 'A',
      data: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
    },
  ]
  it('renders glyph paths instead of circles when a shape is given', () => {
    const { container } = render(
      <ScatterChart series={series} title="S" width={400} height={300} glyph="diamond" />,
    )
    expect(container.querySelectorAll('path[data-glyph="diamond"]').length).toBe(2)
  })

  it('can encode a category by shape via a function', () => {
    const { container } = render(
      <ScatterChart
        series={series}
        title="S"
        width={400}
        height={300}
        glyph={(d) => (d.x > 2 ? 'star' : 'square')}
      />,
    )
    expect(container.querySelector('path[data-glyph="star"]')).toBeTruthy()
    expect(container.querySelector('path[data-glyph="square"]')).toBeTruthy()
  })
})
