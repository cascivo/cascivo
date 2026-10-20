import type { Locator, Page } from '@playwright/test'
import { eventually, fillUntil, firstVisible, goTo } from '../_lib.ts'

/**
 * The prompt: "a page that lists team members with a text filter. When no member matches, show
 * a message saying nothing matched, with a way to clear the filter."
 *
 * So: a filter text that matches no one hides the members and shows such a message, and the app
 * offers a control (a button or link: clear, reset, show all) that brings every member back.
 * Emptying the box by hand is the user clearing the filter, not the app offering a way to, so it
 * does not count; the box's own clear button (cascivo's Search has one) does.
 */
/** Must not itself read as an empty-state message: a "Filter: …" chip echoes it (EVAL.test.ts). */
export const NO_MATCH = 'zzqx-7391'
export const EMPTY =
  /no\b.*\b(match|result|member|one|people|teammate)|nothing|nobody|not found|\b0 (results|members|matches)\b/i
const CLEAR = /clear|reset|show all|remove filter/i
/** A box that names itself as the filter; failing that, the page's only text box. */
const FILTER_NAME = /filter|search|member|name|team|people|find/i

/** The visible text of the page, one entry per rendered line: what a user can read. */
async function lines(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText()
  return text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l !== '')
}

async function filterBox(page: Page): Promise<Locator | null> {
  const named = await firstVisible(
    page.getByRole('searchbox').or(page.getByRole('textbox', { name: FILTER_NAME })),
  )
  if (named !== null) return named
  const boxes: Locator[] = []
  for (const box of await page.getByRole('textbox').or(page.getByRole('searchbox')).all())
    if (await box.isVisible()) boxes.push(box)
  return boxes.length === 1 ? (boxes[0] ?? null) : null
}

async function openList(page: Page, baseUrl: string): Promise<Locator> {
  await page.goto(baseUrl)
  const found = () => eventually(async () => (await filterBox(page)) !== null, 3000)
  if (!(await found())) {
    await goTo(page, baseUrl, /team|members|people/i).catch(() => {})
    await found()
  }
  const box = await filterBox(page)
  if (box === null) throw new Error('filter: no searchbox or text box to filter the members with')
  return box
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  const box = await openList(page, baseUrl)
  const before = await lines(page)
  // The query is cut out first, so a line that only echoes it is no message, while a message
  // that quotes it ("No members match “…”") still is one.
  const message = async () =>
    (await lines(page)).find(
      (l) => EMPTY.test(l.replaceAll(NO_MATCH, '')) && !before.includes(l),
    ) ?? null

  if (!(await fillUntil(box, NO_MATCH, async () => (await message()) !== null)))
    throw new Error(`empty state: filtering "${NO_MATCH}" showed no message saying nothing matched`)
  // The members must actually be gone: a message above an unfiltered list is no empty state.
  const now = await lines(page)
  const hidden = before.filter((l) => !now.includes(l))
  if (hidden.length < 2)
    throw new Error('empty state: the message appeared but the members stayed listed')

  const restored = async () => {
    const after = await lines(page)
    return before.every((l) => after.includes(l))
  }
  // Each offered control is tried until one works: a box's own ✕ that only empties the text of
  // an Enter-to-filter box must not hide the message's working "Show all" button. Tried
  // controls are remembered by element, not name: the ✕ and the message's button may both be
  // called "Clear". Bounded, in case a dead control re-renders as a new element on each click.
  await page.evaluate(() => {
    ;(window as unknown as { __evalTried?: WeakSet<Element> }).__evalTried = new WeakSet()
  })
  let clicked = 0
  while (clicked < 5) {
    let clear: Locator | null = null
    for (const el of await page
      .getByRole('button', { name: CLEAR })
      .or(page.getByRole('link', { name: CLEAR }))
      .all()) {
      if (!(await el.isVisible())) continue
      const fresh = await el.evaluate((node) => {
        const tried = (window as unknown as { __evalTried?: WeakSet<Element> }).__evalTried
        if (tried === undefined || tried.has(node)) return false
        tried.add(node)
        return true
      })
      if (fresh) {
        clear = el
        break
      }
    }
    if (clear === null) break
    clicked += 1
    await clear.click({ timeout: 5000 })
    if (await eventually(restored, 3000)) return
  }
  throw new Error(
    clicked === 0
      ? 'clear: no clear/reset/show all button or link once nothing matched'
      : 'clear: no clear control brought the full member list back',
  )
}
