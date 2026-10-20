import type { Locator, Page } from '@playwright/test'
import { anyVisible, eventually, goTo, type AriaRole } from '../_lib.ts'

const PAGES: { label: string; heading: RegExp }[] = [
  { label: 'profile', heading: /profile/i },
  { label: 'billing', heading: /billing/i },
  { label: 'notifications', heading: /notification/i },
]

/** Every role a settings control can take; a button is an action, not a setting. */
const CONTROL_ROLES: AriaRole[] = [
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'checkbox',
  'switch',
  'radio',
  'spinbutton',
  'slider',
]

/**
 * The page's own content: a header search box or an account menu sits on every page, and
 * would make each page look like it has a control. Without exactly one `main`, the whole page.
 */
async function content(page: Page): Promise<Page | Locator> {
  const main = page.getByRole('main')
  return (await main.count()) === 1 && (await main.isVisible()) ? main : page
}

async function labelledControl(page: Page): Promise<boolean> {
  const scope = await content(page)
  for (const role of CONTROL_ROLES)
    if (await anyVisible(scope.getByRole(role, { name: /\S/ }))) return true
  return false
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  // Rendered first, so the short per-page probe below cannot mistake a slow first paint for a
  // landing page that is none of the three.
  await eventually(() => anyVisible(page.getByRole('heading')))
  // The landing page may already be one of the three; the other two must each take a click.
  let navigations = 0
  for (const { label, heading } of PAGES) {
    const headingOf = page.getByRole('heading', { name: heading })
    if (!(await eventually(() => anyVisible(headingOf), 1000))) {
      await goTo(page, baseUrl, heading)
      navigations += 1
      if (!(await eventually(() => anyVisible(headingOf))))
        throw new Error(`${label}: navigating to it showed no heading matching ${String(heading)}`)
    }
    if (!(await eventually(() => labelledControl(page))))
      throw new Error(`${label}: no form control with an accessible name on the page`)
  }
  if (navigations < 2)
    throw new Error('profile, billing and notifications are not each on a page of their own')
}
