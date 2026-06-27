import { describe, expect, it } from 'vitest'
import { download, serializeSvg, svgToPngBlob } from './export'

function makeSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '100')
  svg.setAttribute('height', '50')
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  // Token-based paint that must be resolved to a concrete colour for a standalone file.
  rect.setAttribute('fill', 'var(--cascivo-chart-1)')
  svg.appendChild(rect)
  return svg
}

describe('serializeSvg', () => {
  it('produces a standalone SVG string with xmlns and inlines resolved (non-var) paint', () => {
    const out = serializeSvg(makeSvg())
    expect(out).toContain('<svg')
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"')
    // The var() token is replaced by the computed colour, so no var() survives.
    expect(out).not.toContain('var(--')
    // A concrete colour was inlined (rgb()/hex from getComputedStyle).
    expect(out).toMatch(/fill="(rgb|#)/)
  })
})

describe('svgToPngBlob', () => {
  it('resolves without throwing in jsdom (no canvas raster support)', async () => {
    const blob = await svgToPngBlob('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
      width: 100,
      height: 50,
      dpr: 2,
    })
    // jsdom can't rasterize, so null is the expected, non-throwing outcome.
    expect(blob === null || typeof blob === 'object').toBe(true)
  })
})

describe('download', () => {
  it('does not throw for a string or a blob', () => {
    expect(() => download('<svg/>', 'chart.svg')).not.toThrow()
    expect(() => download(new Blob(['x']), 'chart.txt')).not.toThrow()
  })
})
