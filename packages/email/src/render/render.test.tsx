/**
 * End-to-end render, and the structural invariants that stand in for the client testing
 * this project deliberately does not buy (`docs/specs/email-target.md` §5.2).
 *
 * The fixture is a realistic transactional email rather than one element at a time: the
 * failures worth catching — a nested table too deep, padding landing on a `<div>`, a
 * `<style>` block appearing from nowhere — only show up once components are composed.
 */
import { describe, expect, it } from 'vitest'
import {
  Alert,
  Badge,
  Body,
  Button,
  Card,
  Column,
  Container,
  Footer,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  List,
  Preview,
  Row,
  Section,
  Spacer,
  Text,
} from '../components/index.ts'
import { EMAIL_THEMES } from '../tokens/palettes.generated.ts'
import { renderEmail } from './render.tsx'

function Fixture() {
  return (
    <Html>
      <Head title="Reset your password" />
      <Body>
        <Preview>Reset your password — the link expires in 30 minutes</Preview>
        <Container>
          <Section padding={32}>
            <Heading level={1}>Reset your password</Heading>
            <Spacer height={16} />
            <Text>Someone asked to reset the password for your account.</Text>
            <Spacer height={24} />
            <Button href="https://example.com/reset">Choose a new password</Button>
            <Spacer height={24} />
            <Alert tone="warning" title="This link expires in 30 minutes">
              <Text style={{ margin: 0 }}>Request a new one from the sign-in page.</Text>
            </Alert>
            <Spacer height={24} />
            <Card>
              <Row>
                <Column width="50%">
                  <Text variant="muted" size="14px">
                    Requested from
                  </Text>
                </Column>
                <Column width="50%">
                  <Badge tone="warning">Pending</Badge>
                </Column>
              </Row>
            </Card>
            <Spacer height={24} />
            <Img src="https://example.com/logo.png" alt="Example Inc" width={120} />
            <List
              items={[
                'Never share this link',
                <Link href="https://example.com/help">Support</Link>,
              ]}
            />
            <Hr spacing={24} />
          </Section>
          <Footer>Sent by Example Inc</Footer>
        </Container>
      </Body>
    </Html>
  )
}

const { html, text, stats } = renderEmail(<Fixture />, { theme: 'light' })

describe('renderEmail — document', () => {
  it('opens with the XHTML Transitional doctype', () => {
    // Without it Outlook Windows uses a quirks-mode box model and every width is wrong.
    expect(html.startsWith('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"')).toBe(
      true,
    )
  })

  it('declares the VML and Office namespaces on <html>', () => {
    expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"')
    expect(html).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"')
  })

  it('keeps the Outlook DPI conditional comment intact through minification', () => {
    expect(html).toContain('<!--[if mso]>')
    expect(html).toContain('<o:PixelsPerInch>96</o:PixelsPerInch>')
  })

  it('sets lang and dir on both html and body, since clients strip one', () => {
    expect(html).toMatch(/<html[^>]*lang="en"/)
    expect(html).toMatch(/<body[^>]*lang="en"/)
    expect(html).toMatch(/<html[^>]*dir="ltr"/)
    expect(html).toMatch(/<body[^>]*dir="ltr"/)
  })
})

describe('renderEmail — structural invariants', () => {
  it('emits no class attribute anywhere', () => {
    // Everything is inlined; a class would depend on a stylesheet Gmail may strip.
    expect(html).not.toMatch(/\sclass="/)
  })

  it('emits no <style> block', () => {
    expect(html).not.toMatch(/<style/i)
  })

  it('leaks no custom property, oklch, or rem into the output', () => {
    for (const banned of ['var(--', 'oklch(', 'color-mix(']) {
      expect(html).not.toContain(banned)
    }
    // `rem` is blocked in Outlook Windows and Yahoo; every length must be converted.
    expect(html).not.toMatch(/[\d.]rem\b/)
  })

  it('uses no layout property that is blocked in Outlook Windows', () => {
    for (const banned of [/display:\s*flex/i, /display:\s*grid/i, /(^|[;"\s])gap:/i]) {
      expect(html).not.toMatch(banned)
    }
  })

  it('marks every table as presentational', () => {
    const tables = [...html.matchAll(/<table\b[^>]*>/gi)].map((m) => m[0])
    expect(tables.length).toBeGreaterThan(0)
    for (const tag of tables) {
      expect(tag, tag).toContain('role="presentation"')
      expect(tag, tag).toMatch(/cellpadding="0"/i)
      expect(tag, tag).toMatch(/cellspacing="0"/i)
      expect(tag, tag).toMatch(/border="0"/i)
    }
  })

  it('gives every image alt text and an explicit width', () => {
    const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0])
    expect(imgs.length).toBeGreaterThan(0)
    for (const tag of imgs) {
      expect(tag, tag).toMatch(/\salt="/)
      expect(tag, tag).toMatch(/\swidth="\d+"/)
      expect(tag, tag).toMatch(/\ssrc="https?:\/\//)
    }
  })

  it('makes every link absolute and externally targeted', () => {
    const links = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0])
    expect(links.length).toBeGreaterThan(0)
    for (const tag of links) {
      expect(tag, tag).toMatch(/href="https?:\/\//)
      expect(tag, tag).toContain('target="_blank"')
    }
  })

  it('puts layout padding only on table cells and anchors', () => {
    /*
     * `css-padding` is partial in Outlook Windows precisely because it applies to `<td>`
     * and not to `<div>`. The anchor exception is the Button, where the padding is what
     * makes the whole rectangle clickable.
     *
     * `padding:0` is exempt: it is a UA reset (Body zeroes the default body padding), it
     * cannot lay anything out, and it is safe on every element in every client.
     *
     * `span` is exempt because Badge is inline by necessity and carries its own `&nbsp;`
     * fallback for clients that drop the padding — see the note on `Badge`. What this
     * invariant is really guarding against is padding on a block wrapper (`div`, `p`,
     * `table`), where Outlook Windows silently loses the layout with no fallback.
     */
    const ALLOWED = ['td', 'a', 'ul', 'ol', 'span']
    for (const m of html.matchAll(/<([a-z]+)\b[^>]*style="([^"]*)"[^>]*>/gi)) {
      const tag = m[1]!.toLowerCase()
      if (ALLOWED.includes(tag)) continue
      const padding = /(?:^|;)\s*padding[a-z-]*:\s*([^;]+)/i.exec(m[2]!)
      if (!padding) continue
      expect(
        padding[1]!.trim().replace(/0(px)?/g, '0'),
        `layout padding on <${tag}>: ${padding[0]}`,
      ).toMatch(/^0( 0)*$/)
    }
  })

  it('keeps table nesting shallow enough for Outlook', () => {
    // Depth is where the bytes and the Outlook layout bugs both live.
    expect(stats.maxTableDepth).toBeLessThanOrEqual(4)
  })
})

describe('renderEmail — plain text', () => {
  it('carries the headline and the link target', () => {
    expect(text).toContain('Reset your password')
    expect(text).toContain('https://example.com/reset')
  })

  it('drops the hidden preview padding', () => {
    expect(text).not.toMatch(/[​⁠]/)
  })

  it('leaves no markup behind', () => {
    expect(text).not.toMatch(/<[a-z/]/i)
  })
})

describe('renderEmail — size accounting', () => {
  it('reports encoded bytes above raw bytes', () => {
    // Gmail measures the encoded body. Budgeting on raw under-reports by up to a third.
    expect(stats.encodedBytes).toBeGreaterThanOrEqual(stats.bytes)
  })

  it('keeps a realistic transactional email inside the strict tier', () => {
    const strict = renderEmail(<Fixture />, { theme: 'light', tier: 'strict' })
    expect(
      strict.stats.clipRisk,
      `encoded ${strict.stats.encodedBytes} of ${strict.stats.budget}`,
    ).toBe('ok')
  })

  it('minifies — pretty output is strictly larger', () => {
    const pretty = renderEmail(<Fixture />, { theme: 'light', pretty: true })
    expect(pretty.stats.bytes).toBeGreaterThan(stats.bytes)
  })
})

describe('renderEmail — themes', () => {
  it('renders in every shipped theme with no unresolved token', () => {
    for (const theme of EMAIL_THEMES) {
      const out = renderEmail(<Fixture />, { theme })
      expect(out.html, theme).not.toContain('var(--')
      expect(out.html, theme).not.toContain('oklch(')
    }
  })

  it('actually changes colour between light and dark', () => {
    const dark = renderEmail(<Fixture />, { theme: 'dark' })
    expect(dark.html).not.toBe(html)
  })

  it('refuses to render outside a palette scope', () => {
    // A silent light-theme fallback would only be visible in an inbox.
    expect(() => Text({ children: 'x' })).toThrow(/No palette in scope/)
  })
})
