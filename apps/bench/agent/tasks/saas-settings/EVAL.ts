import type { Locator, Page } from '@playwright/test'
import { anyVisible, eventually, goTo, type AriaRole } from '../_lib.ts'

/**
 * Profile and notification preferences are settings, so each needs a control. A billing page
 * can be a plan summary with "Upgrade" and "Manage payment" actions, or an invoice table, and
 * the prompt asks for nothing more, so a named action or a table counts there too.
 */
const PAGES: { label: string; heading: RegExp; actionsCount: boolean }[] = [
  { label: 'profile', heading: /profile/i, actionsCount: false },
  { label: 'billing', heading: /billing/i, actionsCount: true },
  { label: 'notifications', heading: /notification/i, actionsCount: false },
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

async function labelledControl(page: Page, actionsCount: boolean): Promise<boolean> {
  const scope = await content(page)
  for (const role of CONTROL_ROLES)
    if (await anyVisible(scope.getByRole(role, { name: /\S/ }))) return true
  if (!actionsCount) return false
  const actions = scope
    .getByRole('button', { name: /\S/ })
    .or(scope.getByRole('link', { name: /\S/ }))
    .or(scope.getByRole('table'))
  // Without a single `main`, the scope is the whole page: its nav buttons are not billing actions.
  return actions.evaluateAll((els) =>
    els.some(
      (el) =>
        el.checkVisibility() &&
        el.closest('nav, header, [role="navigation"], [role="banner"]') === null,
    ),
  )
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  // Rendered first, so the short per-page probe below cannot mistake a slow first paint for a
  // landing page that is none of the three.
  await eventually(() => anyVisible(page.getByRole('heading')))
  // The landing page may already be one of the three; the other two must each take a click. A
  // page counts without a click only when it is that page, heading and control: a settings index
  // with "Profile", "Billing" and "Notifications" card headings is a menu of the three, not one.
  let navigations = 0
  for (const { label, heading, actionsCount } of PAGES) {
    const headingOf = page.getByRole('heading', { name: heading })
    // The control gets the full wait: a page that is this one may render its form after its
    // heading, and clicking its own nav link again would change nothing.
    const here =
      (await eventually(() => anyVisible(headingOf), 1000)) &&
      (await eventually(() => labelledControl(page, actionsCount)))
    if (!here) {
      await goTo(page, baseUrl, heading)
      navigations += 1
      if (!(await eventually(() => anyVisible(headingOf))))
        throw new Error(`${label}: navigating to it showed no heading matching ${String(heading)}`)
    }
    if (!(await eventually(() => labelledControl(page, actionsCount))))
      throw new Error(
        actionsCount
          ? `${label}: no labelled control, named button or link, or table on the page`
          : `${label}: no form control with an accessible name on the page`,
      )
  }
  if (navigations < 2)
    throw new Error('profile, billing and notifications are not each on a page of their own')
}
