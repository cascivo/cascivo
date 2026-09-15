/**
 * `Button` alignment, which reached production wrong once.
 *
 * A button is its own table carrying its own `align` attribute, so whatever that attribute
 * says beats the alignment of the cell around it. The rule is therefore that the attribute
 * is absent unless the caller asked for it — and the assertion has to be about the emitted
 * markup, because the bug was invisible in the types.
 */
import { describe, expect, it } from 'vitest'
import { renderEmail } from '../render/render.tsx'
import { Button, Card } from './content.tsx'
import { Column, Row } from './layout.tsx'
import { Text } from './typography.tsx'

const render = (element: Parameters<typeof renderEmail>[0]) =>
  renderEmail(element, { subject: 's' }).html

describe('Button — alignment', () => {
  it('emits no align attribute of its own by default', () => {
    // The default used to be 'left', which is why <Column align="right"> did nothing.
    const html = render(<Button href="https://example.com">Go</Button>)
    expect(html).not.toMatch(/<table[^>]*\salign=/i)
    expect(html).not.toMatch(/<td[^>]*\salign=/i)
  })

  it('leaves the containing cell the only thing stating an alignment', () => {
    const html = render(
      <Row>
        <Column width="50%" align="right">
          <Button href="https://example.com">Loved it</Button>
        </Column>
      </Row>,
    )
    const aligned = [...html.matchAll(/\salign="([^"]*)"/g)].map((m) => m[1])
    expect(aligned).toEqual(['right'])
  })

  it('leaves the cell stating its alignment once, as the attribute', () => {
    // The bug this replaced: `Column` emitted `align="right"` *and* `text-align:right`. The
    // attribute is a legacy hint that also moves block-level children — a button is a nested
    // <table>, so that is the one that matters — and the explicit declaration beat it. Two
    // statements of the same intent, and the weaker one won.
    const html = render(
      <Row>
        <Column width="50%" align="right">
          <Button href="https://example.com">Loved it</Button>
        </Column>
      </Row>,
    )
    const cell = /<td[^>]*align="right"[^>]*>/.exec(html)?.[0] ?? ''
    expect(cell).toContain('align="right"')
    expect(cell, cell).not.toMatch(/text-align/)
  })

  it('still overrides the cell when asked', () => {
    const html = render(
      <Row>
        <Column width="50%" align="right">
          <Button href="https://example.com" align="left">
            Override
          </Button>
        </Column>
      </Row>,
    )
    expect([...html.matchAll(/\salign="([^"]*)"/g)].map((m) => m[1])).toEqual([
      'right',
      'left',
      'left',
    ])
  })
})

describe('className on the content primitives', () => {
  it('gives Card and Text a media-query hook', () => {
    // The two shapes a responsive email actually needs one for: a panel whose padding
    // shrinks, and a hero that comes down a size. The first cut shipped classes on the
    // layout primitives only, and an adopter kept their `[style*="--flag"]` workaround.
    const html = render(
      <Card className="panel">
        <Text className="hero">Big</Text>
      </Card>,
    )
    expect(html).toMatch(/<td[^>]*class="panel"/)
    expect(html).toMatch(/<p[^>]*class="hero"/)
  })

  it('emits no class attribute when none was asked for', () => {
    const html = render(<Text>Plain</Text>)
    expect(html).not.toMatch(/<p[^>]*class=/)
  })
})
