import type { Locator, Page } from '@playwright/test'
import { anyVisible, eventually, firstVisible, goTo } from '../_lib.ts'

/**
 * The prompt: "a page that lists three projects, each with a Delete button. Deleting asks for
 * confirmation in a dialog; Cancel keeps the project and Confirm removes it."
 *
 * A dialog is the `dialog` or `alertdialog` role (cascivo's and shadcn's AlertDialog are the
 * latter) and must have an accessible name, its title: a design system's dialog gets one, and
 * an unnamed dialog is announced as just "dialog". The dialog is opened with a plain click, not
 * goTo: a native `<dialog>` opening only flips an attribute, which goTo does not count (R10).
 */
const DELETE = /delete|remove|trash/i
/** A bulk action is not one project's Delete button. */
const BULK = /\ball\b|selected/i
const CANCEL = /cancel|keep|^\s*no\b/i
const CONFIRM = /confirm|delete|remove|yes/i

const dialogs = (page: Page) => page.getByRole('dialog').or(page.getByRole('alertdialog'))

/** Visible per-project Delete buttons: outside any dialog, in document order. */
async function deleteButtons(page: Page): Promise<Locator[]> {
  const out: Locator[] = []
  for (const button of await page.getByRole('button', { name: DELETE }).all()) {
    if (!(await button.isVisible())) continue
    const inDialog = await button.evaluate(
      (el) => el.closest('dialog, [role="dialog"], [role="alertdialog"]') !== null,
    )
    const name = (await button.getAttribute('aria-label')) ?? (await button.innerText())
    if (!inDialog && !BULK.test(name)) out.push(button)
  }
  return out
}

/**
 * Each Delete button's project, as text: its row, list item or card, found as the highest
 * ancestor holding no other Delete button, minus the buttons' own text. DOM text, compared only.
 */
async function projectLabels(page: Page): Promise<string[]> {
  const handles = await Promise.all((await deleteButtons(page)).map((b) => b.elementHandle()))
  return page.evaluate((buttons) => {
    const all = buttons.filter((b): b is HTMLElement | SVGElement => b !== null)
    return all.map((button) => {
      let item: Element = button
      for (
        let up = item.parentElement;
        up !== null && !all.some((o) => o !== button && up?.contains(o));
        up = up.parentElement
      )
        item = up
      // Flat markup (name, button, name, button) leaves the button alone: take its neighbour.
      const source = item === button ? (button.previousElementSibling ?? button) : item
      const copy = source.cloneNode(true)
      if (copy instanceof Element)
        for (const b of Array.from(copy.querySelectorAll('button'))) b.remove()
      const text = (copy.textContent ?? '').replace(/\s+/g, ' ').trim()
      return text === '' ? (button.getAttribute('aria-label') ?? '') : text
    })
  }, handles)
}

async function openDialogFor(page: Page, index: number): Promise<Locator> {
  const button = (await deleteButtons(page))[index]
  if (button === undefined) throw new Error(`delete: no Delete button for project ${index + 1}`)
  await button.click({ timeout: 5000 })
  if (!(await eventually(() => anyVisible(dialogs(page)), 3000)))
    throw new Error('delete: clicking Delete opened no dialog (role dialog or alertdialog)')
  const named = await firstVisible(
    page.getByRole('dialog', { name: /\S/ }).or(page.getByRole('alertdialog', { name: /\S/ })),
  )
  if (named === null) throw new Error('delete: the confirmation dialog has no accessible name')
  return named
}

/** The last matching visible button in the dialog: dialogs put the primary action last. */
async function dialogButton(dialog: Locator, name: RegExp, not?: RegExp): Promise<Locator | null> {
  let found: Locator | null = null
  for (const button of await dialog.getByRole('button', { name }).all()) {
    if (!(await button.isVisible())) continue
    if (not !== undefined && not.test(await button.innerText())) continue
    found = button
  }
  return found
}

const closed = (page: Page) => eventually(async () => !(await anyVisible(dialogs(page))), 3000)

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  const listed = async () => (await deleteButtons(page)).length >= 3
  if (!(await eventually(listed, 3000))) {
    await goTo(page, baseUrl, /projects/i).catch(() => {})
    await eventually(listed)
  }
  const count = (await deleteButtons(page)).length
  if (count !== 3)
    throw new Error(`list: expected three projects with a Delete button, found ${count}`)
  const labels = await projectLabels(page)

  const cancelling = await openDialogFor(page, 0)
  const cancel = await dialogButton(cancelling, CANCEL)
  if (cancel === null) throw new Error('cancel: the dialog has no Cancel button')
  await cancel.click({ timeout: 5000 })
  if (!(await closed(page))) throw new Error('cancel: the dialog stayed open')
  // A wrong delete can land a frame after the dialog closes; give it the chance to show.
  await page.waitForTimeout(500)
  const afterCancel = await projectLabels(page)
  if (!same(afterCancel, labels))
    throw new Error(
      `cancel: the projects changed (${labels.length} before, ${afterCancel.length} after)`,
    )

  const confirming = await openDialogFor(page, 0)
  const confirm = await dialogButton(confirming, CONFIRM, CANCEL)
  if (confirm === null) throw new Error('confirm: the dialog has no confirm/delete/yes button')
  await confirm.click({ timeout: 5000 })
  if (!(await closed(page))) throw new Error('confirm: the dialog stayed open')
  const expected = labels.slice(1)
  if (!(await eventually(async () => same(await projectLabels(page), expected))))
    throw new Error(
      `confirm: expected the first project gone and two left, found ${(await projectLabels(page)).length}`,
    )
}
