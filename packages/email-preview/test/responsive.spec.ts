/**
 * Layer 5: no email may scroll sideways on a phone.
 *
 * This is the gap an adopter found the hard way. The conformance lint reads CSS *feature
 * support* and says nothing about layout, the visual baselines are captured at 640px, and a
 * desktop preview shows a 600px email looking perfect — so a template that overflows every
 * phone passed every gate the project had. Their newsletter measured `clientWidth=320,
 * scrollWidth=600`, and every mobile reader was scrolling.
 *
 * `max-width: 100%` does not prevent it: a table will not lay out below the min-content
 * width of its contents. The rules that do are `Container`'s width override and
 * `Column`'s `stack`, and this is what holds them honest.
 *
 * Built `@cascivo/email`, `createElement`, and the `pnpm email:visual` entry point, all for
 * the reasons `playwright.config.ts` and `visual.spec.ts` give.
 */
import { createElement } from 'react'
import { expect, test } from '@playwright/test'
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  PasswordReset,
  Preview,
  Receipt,
  Row,
  Section,
  Text,
  Welcome,
  renderEmail,
} from '@cascivo/email'

/** The widths the authoring rules name for the mobile sweep. */
const PHONES = [320, 360, 390, 414]

/**
 * A two-column row of fixed-width images — the shape that actually overflows.
 *
 * Prose alone never does: it wraps, so its min-content width is one long word. It takes
 * something with a real minimum — a sized image, a fixed column — for the table to refuse
 * to shrink, which is why this reproduces where a simpler fixture did not.
 */
function TwoColumn({ stack }: { stack: boolean }) {
  return createElement(
    Html,
    null,
    createElement(Head, { title: 'Two column' }),
    createElement(
      Body,
      null,
      createElement(Preview, null, 'Two columns of images'),
      createElement(
        Container,
        null,
        createElement(
          Section,
          { padding: 24 },
          createElement(Heading, { level: 1 }, 'Issue 42'),
          createElement(
            Row,
            null,
            createElement(
              Column,
              { width: '50%', padding: 8, stack },
              createElement(Img, { src: 'https://example.com/a.png', alt: 'a', width: 240 }),
              createElement(Text, null, 'Left blurb.'),
            ),
            createElement(
              Column,
              { width: '50%', padding: 8, stack },
              createElement(Img, { src: 'https://example.com/b.png', alt: 'b', width: 240 }),
              createElement(Text, null, 'Right blurb.'),
            ),
          ),
        ),
      ),
    ),
  )
}

async function overflowAt(page: import('@playwright/test').Page, html: string, width: number) {
  await page.setViewportSize({ width, height: 900 })
  await page.setContent(html)
  return page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))
}

const TEMPLATES = [
  ['welcome', Welcome],
  ['password-reset', PasswordReset],
  ['receipt', Receipt],
] as const

for (const [name, Template] of TEMPLATES) {
  test(`${name} does not scroll sideways on a phone`, async ({ page }) => {
    const { html } = renderEmail(createElement(Template), { subject: name })
    for (const width of PHONES) {
      const { client, scroll } = await overflowAt(page, html, width)
      expect(scroll, `${name} at ${width}px overflows by ${scroll - client}px`).toBeLessThanOrEqual(
        client,
      )
    }
  })
}

test('a stacked row fits a phone', async ({ page }) => {
  const { html } = renderEmail(createElement(TwoColumn, { stack: true }), { subject: 'stacked' })
  for (const width of PHONES) {
    const { client, scroll } = await overflowAt(page, html, width)
    expect(
      scroll,
      `stacked row at ${width}px overflows by ${scroll - client}px`,
    ).toBeLessThanOrEqual(client)
  }
})

test('an unstacked row is what still overflows — the rule is load-bearing', async ({ page }) => {
  // Proves the guard above is measuring the fix rather than something that was always true.
  // Container going fluid is not enough on its own: the row keeps its columns' min-content
  // width until they stack.
  const { html } = renderEmail(createElement(TwoColumn, { stack: false }), { subject: 'flat' })
  const { client, scroll } = await overflowAt(page, html, 320)
  expect(scroll).toBeGreaterThan(client)
})
