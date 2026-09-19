/**
 * Client simulation.
 *
 * The last test here is the one that matters: after simulating Outlook Windows, the button
 * must still be a button. The first version of the simulator turned it into a bare
 * underlined link — not because Outlook drops those styles, but because the simulator's own
 * CSS parser mangled them (see `css-attr.test.ts`).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PasswordReset } from '../templates/index.ts'
import { renderEmail } from '../render/render.tsx'
import { EMAIL_FONTS } from '../runtime/fonts.ts'
import { decodeAttribute } from './css-attr.ts'
import { simulate, SIMULATED_CLIENTS } from './simulate.ts'
import { indexFeatures, type CanIEmailData } from './support.ts'

const data = JSON.parse(
  readFileSync(new URL('../../../../scripts/email/vendor/caniemail.json', import.meta.url), 'utf8'),
) as CanIEmailData
const features = indexFeatures(data)

const OUTLOOK = SIMULATED_CLIENTS.find((c) => c.platform === 'windows')!
const APPLE = SIMULATED_CLIENTS.find((c) => c.family === 'apple-mail')!
const GMAIL = SIMULATED_CLIENTS.find((c) => c.family === 'gmail')!

const { html } = renderEmail(<PasswordReset />, { theme: 'light' })

function buttonStyle(source: string): string {
  const tag = /<a[^>]*href="https:\/\/example\.com\/reset"[^>]*>/.exec(source)?.[0] ?? ''
  return decodeAttribute(/style="([^"]*)"/.exec(tag)?.[1] ?? '')
}

describe('simulate', () => {
  it('removes what the client does not support', () => {
    // border-radius is `n` in Outlook Windows; the square button is the expected outcome.
    expect(buttonStyle(html)).toContain('border-radius')
    expect(buttonStyle(simulate(html, features, OUTLOOK))).not.toContain('border-radius')
  })

  it('keeps what the client does support', () => {
    const style = buttonStyle(simulate(html, features, OUTLOOK))
    expect(style).toContain('background-color:#006bbb')
    expect(style).toContain('padding:12px 24px')
    expect(style).toContain('color:#fff')
  })

  it('leaves the font stack intact — the entity-splitting regression', () => {
    // The whole stack, not a fragment ending at the first escaped apostrophe.
    expect(buttonStyle(simulate(html, features, OUTLOOK))).toContain(EMAIL_FONTS.sans)
  })

  it('re-escapes what it writes back, so the document stays well-formed', () => {
    const out = simulate(html, features, OUTLOOK)
    // A raw apostrophe inside a double-quoted attribute would be legal but inconsistent;
    // more importantly an unescaped `"` would end the attribute early.
    expect(out).not.toMatch(/style="[^"]*[^&]"[^>]/)
    expect(out).toContain('&#x27;')
  })

  it('strips svg where it is blocked and keeps it where it is not', () => {
    const doc = '<div><svg viewBox="0 0 1 1"><rect /></svg></div>'
    expect(simulate(doc, features, OUTLOOK)).not.toContain('<svg')
    expect(simulate(doc, features, APPLE)).toContain('<svg')
  })

  it('applies the Gmail style-block quirk', () => {
    const doc = '<style>.a{color:red}</style><p>x</p>'
    expect(simulate(doc, features, GMAIL)).not.toContain('<style')
    expect(simulate(doc, features, GMAIL, { quirks: false })).toContain('<style')
  })

  it('keeps Outlook conditional comments only for Outlook Windows', () => {
    const doc = '<!--[if mso]><b>x</b><![endif]-->'
    expect(simulate(doc, features, OUTLOOK)).toContain('[if mso]')
    expect(simulate(doc, features, GMAIL)).not.toContain('[if mso]')
  })

  it('drops the style attribute entirely when nothing survives', () => {
    expect(simulate('<div style="display:flex"></div>', features, OUTLOOK)).toBe('<div></div>')
  })
})
