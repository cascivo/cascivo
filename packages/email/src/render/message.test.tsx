/**
 * The message layer: subject, preheader, plain text, and the MIME envelope.
 *
 * These are the parts that only fail once the mail is already in someone's inbox — a
 * subject that says something the body does not, a preview line the client filled in
 * itself, a text part nobody looked at. They are cheap to assert and expensive to discover.
 */
import { describe, expect, it } from 'vitest'
import { PasswordReset, passwordResetSubject, Receipt, receiptSubject } from '../templates/index.ts'
import { buildMessage, quotedPrintable } from './message.ts'
import { extractPreheader, toPlainText } from './plaintext.ts'
import { assertSendable, renderEmail } from './render.tsx'

const result = renderEmail(<PasswordReset />, {
  theme: 'light',
  subject: passwordResetSubject(),
  tier: 'strict',
})

describe('renderEmail — message metadata', () => {
  it('carries the subject through', () => {
    expect(result.subject).toBe('Reset your password')
  })

  it('extracts the preheader the template declares', () => {
    expect(result.preheader).toBe('Reset your password — the link expires in 30 minutes')
  })

  it('reports a missing preheader as null rather than an empty string', () => {
    // The distinction matters: null means the client will invent one from the body.
    expect(extractPreheader('<div><p>no preview here</p></div>')).toBeNull()
  })

  it('keeps the preheader out of the text part, so it is not said twice', () => {
    expect(result.text.startsWith('Reset your password\n=')).toBe(true)
    expect(result.text).not.toContain('the link expires in 30 minutes —')
  })
})

describe('assertSendable', () => {
  it('passes a complete message', () => {
    expect(() => assertSendable(result)).not.toThrow()
  })

  it('rejects a missing subject', () => {
    expect(() => assertSendable({ ...result, subject: '  ' })).toThrow(/no subject/)
  })

  it('rejects a missing preheader', () => {
    expect(() => assertSendable({ ...result, preheader: null })).toThrow(/no preheader/)
  })

  it('rejects a clipped body', () => {
    expect(() =>
      assertSendable({ ...result, stats: { ...result.stats, clipRisk: 'over' } }),
    ).toThrow(/clip threshold/)
  })

  it('names every problem at once, not just the first', () => {
    expect(() => assertSendable({ ...result, subject: '', text: '', preheader: null })).toThrow(
      /no subject; no plain-text alternative; no preheader/,
    )
  })
})

describe('toPlainText', () => {
  const receipt = renderEmail(<Receipt />, { theme: 'light', subject: receiptSubject() })

  it('underlines headings instead of flattening them', () => {
    expect(receipt.text).toMatch(/Thanks for your payment\n={5,}/)
  })

  it('keeps a list marker', () => {
    const text = toPlainText('<ul><li>one</li><li>two</li></ul>')
    expect(text).toContain('- one')
    expect(text).toContain('- two')
  })

  it('keeps the rule that separates a receipt total from its lines', () => {
    expect(receipt.text).toContain('---')
  })

  it('carries link targets inline by default', () => {
    expect(toPlainText('<a href="https://x.test/a">Go</a>')).toBe('Go (https://x.test/a)')
  })

  it('collects footnotes when asked, so prose stays readable', () => {
    const text = toPlainText(
      '<p><a href="https://x.test/a">A</a> and <a href="https://x.test/b">B</a></p>',
      {
        links: 'footnote',
      },
    )
    expect(text).toContain('A [1]')
    expect(text).toContain('B [2]')
    expect(text).toContain('[1] https://x.test/a')
  })

  it('reuses one footnote number for a repeated destination', () => {
    const text = toPlainText('<a href="https://x.test/a">A</a><a href="https://x.test/a">B</a>', {
      links: 'footnote',
    })
    expect(text).toContain('A [1]')
    expect(text).toContain('B [1]')
    expect(text.match(/^\[1\]/gm)).toHaveLength(1)
  })

  it('strips destinations when asked', () => {
    expect(toPlainText('<a href="https://x.test/a">Go</a>', { links: 'strip' })).toBe('Go')
  })

  it('does not duplicate a link whose label is already the URL', () => {
    expect(toPlainText('<a href="https://x.test/">https://x.test/</a>')).toBe('https://x.test/')
  })

  it('honours data-skip-in-text, as React Email does', () => {
    const text = toPlainText('<p>keep</p><div data-skip-in-text="true"><p>drop</p></div>')
    expect(text).toContain('keep')
    expect(text).not.toContain('drop')
  })

  it('wraps at the requested width without breaking a word', () => {
    const text = toPlainText(`<p>${'word '.repeat(40)}</p>`, { width: 40 })
    for (const line of text.split('\n')) expect(line.length).toBeLessThanOrEqual(40)
  })

  it('leaves an over-long URL unwrapped rather than corrupting it', () => {
    const url = `https://x.test/${'a'.repeat(90)}`
    expect(toPlainText(`<a href="${url}">${url}</a>`, { width: 40 })).toBe(url)
  })

  it('leaves no markup or entity behind', () => {
    expect(receipt.text).not.toMatch(/<[a-z/]/i)
    expect(receipt.text).not.toMatch(/&[a-z]+;|&#/i)
  })
})

describe('buildMessage', () => {
  const eml = buildMessage(result, {
    from: 'noreply@acme.test',
    to: 'sam@example.test',
    boundary: 'FIXED',
    date: new Date('2026-01-15T12:00:00Z'),
  })

  it('is byte-stable given a fixed boundary and date', () => {
    expect(
      buildMessage(result, {
        from: 'noreply@acme.test',
        to: 'sam@example.test',
        boundary: 'FIXED',
        date: new Date('2026-01-15T12:00:00Z'),
      }),
    ).toBe(eml)
  })

  it('puts the text part before the HTML part', () => {
    // RFC 2046 orders alternatives least- to most-faithful; clients take the last they can
    // render. Reversed, every recipient sees plain text.
    expect(eml.indexOf('text/plain')).toBeLessThan(eml.indexOf('text/html'))
  })

  it('uses CRLF line endings throughout', () => {
    expect(eml.split('\n').every((l, i, a) => i === a.length - 1 || l.endsWith('\r'))).toBe(true)
  })

  it('closes the multipart with the terminating boundary', () => {
    expect(eml).toContain('--FIXED--')
  })

  it('encodes a non-ASCII subject per RFC 2047', () => {
    const out = buildMessage({ ...result, subject: 'Your receipt — €60.00' }, { boundary: 'B' })
    expect(out).toMatch(/Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=/)
    expect(out).not.toContain('€')
  })

  it('leaves a pure-ASCII subject unencoded', () => {
    expect(eml).toContain('Subject: Reset your password')
  })

  it('refuses a header value containing a newline', () => {
    // Header injection: without this, a subject can forge a Bcc.
    expect(() => buildMessage({ ...result, subject: 'x\r\nBcc: attacker@evil.test' })).toThrow(
      /inject headers/,
    )
  })

  it('passes through extra headers such as List-Unsubscribe', () => {
    const out = buildMessage(result, { headers: { 'List-Unsubscribe': '<https://x.test/u>' } })
    expect(out).toContain('List-Unsubscribe: <https://x.test/u>')
  })
})

describe('quotedPrintable', () => {
  it('leaves printable ASCII alone', () => {
    expect(quotedPrintable('hello world')).toBe('hello world')
  })

  it('escapes the equals sign, which is the escape character', () => {
    expect(quotedPrintable('a=b')).toBe('a=3Db')
  })

  it('encodes multi-byte UTF-8 per byte', () => {
    expect(quotedPrintable('€')).toBe('=E2=82=AC')
  })

  it('soft-wraps past 75 columns', () => {
    for (const line of quotedPrintable('a'.repeat(200)).split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(76)
    }
  })

  it('agrees with the size accounting renderEmail reports', () => {
    // The budget and the wire must be the same number, not two close estimates.
    expect(quotedPrintable(result.html).length).toBe(result.stats.encodedBytes)
  })
})
