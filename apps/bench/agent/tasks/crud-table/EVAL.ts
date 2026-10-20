import type { Locator, Page } from '@playwright/test'
import { anyVisible, eventually, goTo } from '../_lib.ts'

/** Unlikely to collide with seed data, so finding it proves the create flow added it. */
const NEW_NAME = 'Canary Orbit 7391'
const NO_MATCH = 'zzqx-no-such-project'

/** Agents use `<table>` or an ARIA grid (a data table with keyboard navigation) for the same thing. */
const tables = (page: Page) => page.getByRole('table').or(page.getByRole('grid'))

async function firstVisible(locator: Locator): Promise<Locator | null> {
  for (const el of await locator.all()) if (await el.isVisible()) return el
  return null
}

/**
 * The text of each data row of the first visible table, in order. A row with no data cell is a
 * header row; an empty-state row ("No projects match") is a row and counts as one.
 */
async function rowTexts(page: Page): Promise<string[]> {
  const table = await firstVisible(tables(page))
  if (table === null) return []
  const rows = table
    .getByRole('row')
    .filter({ has: page.getByRole('cell').or(page.getByRole('gridcell')) })
  return (await rows.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim())
}

function searchBox(page: Page): Promise<Locator | null> {
  return firstVisible(
    page.getByRole('searchbox').or(page.getByRole('textbox', { name: /search|filter/i })),
  )
}

/**
 * Something to search for that is in the first row but not in every row, so a working search
 * must drop rows. Cells are tried in order; a name column usually comes first.
 */
async function queryFromFirstRow(page: Page, rows: string[]): Promise<string> {
  const table = await firstVisible(tables(page))
  const first = table
    ?.getByRole('row')
    .filter({ has: page.getByRole('cell').or(page.getByRole('gridcell')) })
    .first()
  const cells = first
    ? await first.getByRole('cell').or(first.getByRole('gridcell')).allInnerTexts()
    : []
  for (const raw of cells) {
    const text = raw.trim()
    if (text.length < 3) continue
    if (rows.some((row) => !row.toLowerCase().includes(text.toLowerCase()))) return text
  }
  return NO_MATCH
}

/**
 * Type into the box and wait until `settled`. A search that runs on Enter (a search form, a
 * "press Enter to search" box) gets the Enter it waits for.
 */
async function search(
  box: Locator,
  text: string,
  settled: () => Promise<boolean>,
): Promise<boolean> {
  await box.fill(text)
  if (await eventually(settled, 2000)) return true
  await box.press('Enter')
  return eventually(settled)
}

const rowCount = async (page: Page) => (await rowTexts(page)).length

async function searchNarrows(page: Page): Promise<void> {
  const box = await searchBox(page)
  if (box === null) throw new Error('search: no searchbox or textbox labelled search/filter')
  const before = await rowTexts(page)
  if (before.length < 2) throw new Error('search: fewer than two rows to narrow')
  const query = await queryFromFirstRow(page, before)
  if (!(await search(box, query, async () => (await rowCount(page)) < before.length)))
    throw new Error(`search: searching "${query}" did not reduce the ${before.length} visible rows`)
  await search(box, '', async () => (await rowCount(page)) === before.length)
}

async function paginationMoves(page: Page): Promise<void> {
  const name = /next/i
  const control =
    (await firstVisible(page.getByRole('button', { name }).or(page.getByRole('link', { name })))) ??
    (await firstVisible(
      page
        .getByRole('button', { name: /^\s*(page\s*)?2\s*$/i })
        .or(page.getByRole('link', { name: /^\s*(page\s*)?2\s*$/i })),
    ))
  if (control === null) throw new Error('pagination: no "next" or "page 2" control')
  const before = (await rowTexts(page)).join('\n')
  await control.click()
  if (!(await eventually(async () => (await rowTexts(page)).join('\n') !== before)))
    throw new Error('pagination: the next-page control did not change the visible rows')
}

async function nameInTable(page: Page): Promise<boolean> {
  return anyVisible(tables(page).getByRole('row').filter({ hasText: NEW_NAME }))
}

/** An accessible name that is not a search or filter box's ("Search by name" is no name field). */
const NOT_SEARCH = /^(?!.*(search|filter))/i
const NAME_FIELD = /^(?!.*(search|filter)).*(name|title)/i

const TEXT_BY_TYPE: Record<string, string> = {
  email: 'canary@example.com',
  url: 'https://example.com',
  tel: '5550100',
  date: '2026-01-15',
  'datetime-local': '2026-01-15T10:00',
  month: '2026-01',
  week: '2026-W03',
  time: '10:00',
}

async function firstVisibleOf(locator: Locator): Promise<Locator | null> {
  await eventually(() => anyVisible(locator))
  return firstVisible(locator)
}

/**
 * Give an empty field a valid value, whatever its kind, so a form whose other fields are
 * required (owner, status, due date) can still be submitted. Best effort: a field this cannot
 * fill is left for the app's validation to report.
 */
async function fillField(page: Page, field: Locator): Promise<void> {
  const kind = await field.evaluate((el) => ({
    tag: el.tagName,
    type: el.getAttribute('type') ?? '',
    value: 'value' in el && typeof el.value === 'string' ? el.value : null,
  }))
  try {
    if (kind.tag === 'SELECT') {
      if (kind.value !== '') return
      const value = await field.evaluate((el) =>
        el instanceof HTMLSelectElement
          ? (Array.from(el.options).find((o) => o.value !== '' && !o.disabled)?.value ?? null)
          : null,
      )
      if (value !== null) await field.selectOption(value, { timeout: 2000 })
    } else if (kind.tag === 'INPUT' || kind.tag === 'TEXTAREA') {
      if (kind.value !== '') return
      const number = kind.type === 'number' || kind.type === 'range'
      await field.fill(number ? '1' : (TEXT_BY_TYPE[kind.type] ?? 'Canary'), { timeout: 2000 })
    } else {
      // A custom combobox (a button that opens a listbox): pick its first option.
      await field.click({ timeout: 2000 })
      const option = await firstVisibleOf(page.getByRole('option'))
      if (option === null) await page.keyboard.press('Escape')
      else await option.click({ timeout: 2000 })
    }
  } catch {
    // Left empty: if the app requires it, the submit fails and the check reports that.
  }
}

/** Fill the name, then every other empty field in the form, skipping search and filter boxes. */
async function fillForm(page: Page, scope: Page | Locator): Promise<Locator> {
  const nameField =
    (await firstVisibleOf(scope.getByRole('textbox', { name: NAME_FIELD }))) ??
    (await firstVisible(scope.getByRole('textbox', { name: NOT_SEARCH })))
  if (nameField === null) throw new Error('create: the form has no text field for a name')
  await nameField.fill(NEW_NAME)
  const fields = scope
    .getByRole('textbox', { name: NOT_SEARCH })
    .or(scope.getByRole('spinbutton', { name: NOT_SEARCH }))
    .or(scope.getByRole('combobox', { name: NOT_SEARCH }))
    // Date and time inputs have no ARIA role to find them by.
    .or(scope.locator('input[type="date"], input[type="datetime-local"], input[type="month"]'))
    .or(scope.locator('input[type="week"], input[type="time"]'))
  for (const field of await fields.all()) if (await field.isVisible()) await fillField(page, field)
  return nameField
}

async function createAddsRow(page: Page, baseUrl: string): Promise<void> {
  // Not goTo's own effect check: opening a native <dialog> only flips its `open` attribute, which
  // goTo deliberately ignores. The form appearing is the evidence, checked by fillForm.
  await goTo(page, baseUrl, /\b(new|create|add)\b/i, { expectNavigation: false })
  const dialog = page.getByRole('dialog')
  const inDialog = await eventually(() => anyVisible(dialog), 2000)
  const scope = inDialog ? dialog : page
  const nameField = await fillForm(page, scope)
  // Enter submits a real form; a form that only listens to its button gets the click instead.
  await nameField.press('Enter')
  const submitted = await eventually(
    async () => (inDialog && !(await anyVisible(dialog))) || (await nameInTable(page)),
    2000,
  )
  if (!submitted) {
    // The last visible one: the form's own button follows its fields and any page-level trigger.
    const buttons = scope.getByRole('button', { name: /create|save|add|submit|done/i })
    let submit: Locator | null = null
    for (const button of await buttons.all()) if (await button.isVisible()) submit = button
    // A click that cannot land is not the verdict; whether the row appears is.
    await submit?.click({ timeout: 5000 }).catch(() => {})
  }
  if (await eventually(() => nameInTable(page), 3000)) return
  // The new row may land on another page of the table: search for it.
  const found = await eventually(async () => (await searchBox(page)) !== null)
  const box = found ? await searchBox(page) : null
  if (box !== null && (await search(box, NEW_NAME, () => nameInTable(page)))) return
  throw new Error(`create: "${NEW_NAME}" was submitted but never appeared in the table`)
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  if (!(await eventually(async () => (await rowTexts(page)).length > 0))) {
    await goTo(page, baseUrl, /projects/i)
    if (!(await eventually(async () => (await rowTexts(page)).length > 0)))
      throw new Error('table: no table with data rows')
  }
  await searchNarrows(page)
  await paginationMoves(page)
  await createAddsRow(page, baseUrl)
}
