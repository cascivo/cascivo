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

async function searchNarrows(page: Page): Promise<void> {
  const box = await searchBox(page)
  if (box === null) throw new Error('search: no searchbox or textbox labelled search/filter')
  const before = await rowTexts(page)
  if (before.length < 2) throw new Error('search: fewer than two rows to narrow')
  const query = await queryFromFirstRow(page, before)
  await box.fill(query)
  if (!(await eventually(async () => (await rowTexts(page)).length < before.length)))
    throw new Error(`search: typing "${query}" did not reduce the ${before.length} visible rows`)
  await box.fill('')
  await eventually(async () => (await rowTexts(page)).length === before.length)
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

/** Fill the name, and any other required text field so validation cannot block the submit. */
async function fillForm(scope: Page | Locator): Promise<Locator> {
  const named = scope.getByRole('textbox', { name: /name|title/i })
  let nameField: Locator | null = null
  await eventually(() => anyVisible(named))
  for (const el of await named.all()) {
    if (!(await el.isVisible())) continue
    // An inline form shares the page with the search box; "Filter by name" is not the field.
    if (/search|filter/i.test((await el.getAttribute('aria-label')) ?? '')) continue
    if (/search|filter/i.test((await el.getAttribute('placeholder')) ?? '')) continue
    nameField = el
    break
  }
  if (nameField === null) throw new Error('create: the form has no textbox labelled name/title')
  await nameField.fill(NEW_NAME)
  for (const field of await scope.getByRole('textbox').all()) {
    if (!(await field.isVisible()) || (await field.inputValue()) !== '') continue
    const required =
      (await field.getAttribute('required')) !== null ||
      (await field.getAttribute('aria-required')) === 'true'
    if (!required) continue
    const email = (await field.getAttribute('type')) === 'email'
    await field.fill(email ? 'canary@example.com' : 'Canary')
  }
  return nameField
}

async function createAddsRow(page: Page, baseUrl: string): Promise<void> {
  // Not goTo's own effect check: opening a native <dialog> only flips its `open` attribute, which
  // goTo deliberately ignores. The form appearing is the evidence, checked by fillForm.
  await goTo(page, baseUrl, /\b(new|create|add)\b/i, { expectNavigation: false })
  const dialog = page.getByRole('dialog')
  const inDialog = await eventually(() => anyVisible(dialog), 2000)
  const scope = inDialog ? dialog : page
  const nameField = await fillForm(scope)
  // Enter submits a real form; a form that only listens to its button gets the click instead.
  await nameField.press('Enter')
  const submitted = await eventually(
    async () => (inDialog && !(await anyVisible(dialog))) || (await nameInTable(page)),
    2000,
  )
  if (!submitted) {
    const submit = scope.getByRole('button', { name: /create|save|add|submit|done/i }).last()
    await submit.click({ timeout: 5000 })
  }
  if (await eventually(() => nameInTable(page), 3000)) return
  // The new row may land on another page of the table: search for it.
  const found = await eventually(async () => (await searchBox(page)) !== null)
  const box = found ? await searchBox(page) : null
  if (box !== null) {
    await box.fill(NEW_NAME)
    if (await eventually(() => nameInTable(page))) return
  }
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
