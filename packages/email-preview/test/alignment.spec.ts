/**
 * Layer 6: a button goes where the cell around it says.
 *
 * `ButtonProps.align` documents that omitting it makes the button follow its cell. That
 * claim shipped a release before it was true, and an adopter deleted their explicit `align`
 * props on the strength of it — the two buttons of a feedback row splayed to opposite edges
 * of the message again.
 *
 * It is a browser assertion because it cannot be anything else. The markup was *already*
 * what you would want — `<td align="right">` wrapping the button's table — and reading it
 * tells you nothing about where the button lands. Only layout does: `align` on a cell is a
 * legacy hint that moves block-level children, a plain `text-align` is not, and `Column`
 * used to emit both and lose.
 *
 * `createElement` rather than JSX, and the built package, both for the reasons
 * `playwright.config.ts` and `visual.spec.ts` give.
 */
import { createElement } from 'react'
import { expect, test } from '@playwright/test'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Preview,
  Row,
  Section,
  renderEmail,
} from '@cascivo/email'

/** The reporter's feedback row: two halves pulling towards each other. */
function FeedbackRow({ explicit }: { explicit: boolean }) {
  const button = (href: string, label: string, align: 'left' | 'right') =>
    createElement(Button, { href, ...(explicit ? { align } : {}) }, label)
  return createElement(
    Html,
    null,
    createElement(Head, { title: 'Feedback' }),
    createElement(
      Body,
      null,
      createElement(Preview, null, 'How was this issue?'),
      createElement(
        Container,
        null,
        createElement(
          Section,
          { padding: 24 },
          createElement(
            Row,
            null,
            createElement(
              Column,
              { width: '50%', align: 'right' },
              button('https://example.com/yes', 'Loved it', 'right'),
            ),
            createElement(Column, { width: 12 }, ' '),
            createElement(
              Column,
              { width: '50%', align: 'left' },
              button('https://example.com/no', 'Not this time', 'left'),
            ),
          ),
        ),
      ),
    ),
  )
}

/** Which edge of its cell each button is flush against. */
async function edges(page: import('@playwright/test').Page, html: string) {
  await page.setViewportSize({ width: 600, height: 700 })
  await page.setContent(html)
  return page.evaluate(() => {
    const out: string[] = []
    for (const td of document.querySelectorAll('td[align]')) {
      const anchor = td.querySelector('a')
      if (!anchor) continue
      const cell = td.getBoundingClientRect()
      // Skip the button's own inner cell, which hugs the anchor by construction.
      if (cell.width < 200) continue
      const box = anchor.getBoundingClientRect()
      out.push(
        `${td.getAttribute('align')}:${
          Math.abs(box.left - cell.left) < 2
            ? 'left'
            : Math.abs(box.right - cell.right) < 2
              ? 'right'
              : 'middle'
        }`,
      )
    }
    return out
  })
}

test('a button with no align of its own follows its cell', async ({ page }) => {
  const { html } = renderEmail(createElement(FeedbackRow, { explicit: false }), { subject: 'x' })
  expect(await edges(page, html)).toEqual(['right:right', 'left:left'])
})

test('an explicit align still wins', async ({ page }) => {
  const { html } = renderEmail(createElement(FeedbackRow, { explicit: true }), { subject: 'x' })
  expect(await edges(page, html)).toEqual(['right:right', 'left:left'])
})

test('a centred cell centres the button', async ({ page }) => {
  // `center` was broken the same way and is the more common case of the two.
  const element = createElement(
    Html,
    null,
    createElement(Head, { title: 'CTA' }),
    createElement(
      Body,
      null,
      createElement(Preview, null, 'CTA'),
      createElement(
        Container,
        null,
        createElement(
          Section,
          { padding: 24, align: 'center' },
          createElement(Button, { href: 'https://example.com' }, 'Read the issue'),
        ),
      ),
    ),
  )
  const { html } = renderEmail(element, { subject: 'x' })
  await page.setViewportSize({ width: 600, height: 400 })
  await page.setContent(html)
  const offset = await page.evaluate(() => {
    const cell = document.querySelector('td[align="center"]')!.getBoundingClientRect()
    const box = document.querySelector('a')!.getBoundingClientRect()
    return Math.round(box.left - cell.left) - Math.round(cell.right - box.right)
  })
  expect(Math.abs(offset)).toBeLessThanOrEqual(2)
})
