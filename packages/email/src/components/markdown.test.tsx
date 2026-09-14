/**
 * `Markdown` end to end: the tree renders through the primitives, and what comes out is
 * still clean against the conformance matrix.
 *
 * The second half is the load-bearing one. The reason there was no Markdown component was
 * that arbitrary Markdown produces arbitrary HTML the lint cannot vouch for; the claim this
 * file has to keep honest is that this renderer emits nothing the primitives do not.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CASCIVO_ALLOW, lint } from '../conformance/lint.ts'
import { indexFeatures, type CanIEmailData } from '../conformance/support.ts'
import { renderEmail } from '../render/render.tsx'
import { Body, Container, Head, Html, Preview, Section } from './index.ts'
import { Markdown } from './markdown.tsx'

const data = JSON.parse(
  readFileSync(new URL('../../../../scripts/email/vendor/caniemail.json', import.meta.url), 'utf8'),
) as CanIEmailData
const features = indexFeatures(data)

const SOURCE = `# Issue 42

Welcome back. This week we look at **signals**, *email* and \`fontStack()\`.

> The best email is the one that arrives.

- One [link](https://weeklyfoo.com/a)
- Two <https://weeklyfoo.com/b>
- Three

1. First
2. Second

\`\`\`ts
const a = 1
\`\`\`

---

Mail us at <mailto:hi@weeklyfoo.com>.

![The logo](https://weeklyfoo.com/logo.png)
`

function Page({ markdown = SOURCE }: { markdown?: string }) {
  return (
    <Html>
      <Head title="Issue 42" />
      <Body>
        <Preview>This week: signals, email and fontStack()</Preview>
        <Container>
          <Section padding={24}>
            <Markdown imageWidth={552}>{markdown}</Markdown>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const { html } = renderEmail(<Page />, { subject: 'Issue 42' })

describe('Markdown — renders through the primitives', () => {
  it('maps headings, emphasis and code to real elements', () => {
    expect(html).toContain('<h1')
    expect(html).toContain('<strong>signals</strong>')
    expect(html).toContain('<em>email</em>')
    expect(html).toMatch(/<code[^>]*>fontStack\(\)<\/code>/)
    expect(html).toContain('<pre')
  })

  it('maps both list flavours', () => {
    expect(html).toContain('<ul')
    expect(html).toContain('<ol')
  })

  it('renders a link through Link, target and rel included', () => {
    expect(html).toMatch(/<a href="https:\/\/weeklyfoo\.com\/a"[^>]*rel="noopener noreferrer"/)
    expect(html).toContain('href="mailto:hi@weeklyfoo.com"')
  })

  it('renders an image at the width it was given, since Markdown carries none', () => {
    expect(html).toMatch(/<img[^>]*src="https:\/\/weeklyfoo\.com\/logo\.png"[^>]*width="552"/)
    expect(html).toMatch(/<img[^>]*alt="The logo"/)
  })
})

describe('Markdown — the allowlist holds', () => {
  it('escapes raw HTML instead of passing it through', () => {
    // The conformance argument in one assertion: there is no path from source to markup.
    const { html: raw } = renderEmail(
      <Page markdown={'<script>alert(1)</script>\n\n<b>bold</b>'} />,
      { subject: 's' },
    )
    expect(raw).not.toContain('<script')
    expect(raw).not.toContain('<b>bold</b>')
    expect(raw).toContain('&lt;script&gt;')
  })

  it('renders an unsafe href as its own label, with no anchor', () => {
    const { html: raw } = renderEmail(<Page markdown={'[click me](javascript:alert(1))'} />, {
      subject: 's',
    })
    expect(raw).not.toContain('javascript:')
    expect(raw).toContain('click me')
  })

  it('produces no blocked finding the primitives would not have produced', () => {
    // The same bar the shipped templates are held to in conformance/lint.test.tsx.
    const blocked = lint(html, features, { allow: CASCIVO_ALLOW }).filter(
      (f) => f.level === 'blocked',
    )
    expect(blocked, JSON.stringify(blocked, null, 2)).toEqual([])
  })

  it('renders empty source as nothing rather than throwing', () => {
    const { html: raw } = renderEmail(<Page markdown="" />, { subject: 's' })
    expect(raw).toContain('<body')
  })
})
