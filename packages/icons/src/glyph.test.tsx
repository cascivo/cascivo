import { describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Glyph, type GlyphName } from './index'

function glyph(ui: React.ReactElement): HTMLElement {
  const { container } = render(ui)
  return container.querySelector('.cascivo-glyph') as HTMLElement
}

describe('Glyph', () => {
  it('renders a span carrying the class and data-glyph', () => {
    const el = glyph(<Glyph name="chevron-down" />)
    expect(el.tagName).toBe('SPAN')
    expect(el).toHaveClass('cascivo-glyph')
    expect(el).toHaveAttribute('data-glyph', 'chevron-down')
    cleanup()
  })

  it('is aria-hidden by default and drops it when labelled', () => {
    expect(glyph(<Glyph name="x" />)).toHaveAttribute('aria-hidden', 'true')
    cleanup()
    const labelled = glyph(<Glyph name="x" aria-label="Close" />)
    expect(labelled).toHaveAttribute('aria-label', 'Close')
    expect(labelled).not.toHaveAttribute('aria-hidden')
    cleanup()
  })

  it('maps a numeric size to a px custom property and passes strings through', () => {
    expect(
      glyph(<Glyph name="check" size={20} />).style.getPropertyValue('--cascivo-glyph-size'),
    ).toBe('20px')
    cleanup()
    expect(
      glyph(<Glyph name="check" size="2rem" />).style.getPropertyValue('--cascivo-glyph-size'),
    ).toBe('2rem')
    cleanup()
    // no size → property is not set (CSS default applies)
    expect(glyph(<Glyph name="check" />).style.getPropertyValue('--cascivo-glyph-size')).toBe('')
    cleanup()
  })

  it('sets data-state="open" only for the open morph state', () => {
    expect(glyph(<Glyph name="chevron-toggle" />)).not.toHaveAttribute('data-state')
    cleanup()
    expect(glyph(<Glyph name="chevron-toggle" open />)).toHaveAttribute('data-state', 'open')
    cleanup()
  })

  it('merges className and forwards arbitrary props and style', () => {
    const el = glyph(<Glyph name="menu" className="mine" id="m1" style={{ opacity: 0.5 }} />)
    expect(el).toHaveClass('cascivo-glyph', 'mine')
    expect(el).toHaveAttribute('id', 'm1')
    expect(el.style.opacity).toBe('0.5')
    cleanup()
  })

  it('accepts every static glyph name (type + render coverage)', () => {
    const names: GlyphName[] = [
      'chevron-down',
      'chevron-up',
      'chevron-left',
      'chevron-right',
      'x',
      'check',
      'plus',
      'minus',
      'menu',
      'arrow-right',
      'arrow-left',
      'arrow-up',
      'arrow-down',
    ]
    for (const name of names) {
      expect(glyph(<Glyph name={name} />), name).toHaveAttribute('data-glyph', name)
      cleanup()
    }
  })
})
