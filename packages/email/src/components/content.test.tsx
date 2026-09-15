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
import { Button } from './content.tsx'
import { Column, Row } from './layout.tsx'

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
