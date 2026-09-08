/**
 * Layer 4: visual baselines for the email templates.
 *
 * Screenshots the rendered email directly via `setContent`, not through the preview app's
 * chrome. The thing worth sharing between the preview and these tests is `renderEmail` and
 * `simulate` — the logic that decides what a client sees — and both are imported here. Going
 * through the app's UI as well would make every baseline sensitive to a toolbar tweak, which
 * buys nothing and guarantees churn.
 *
 * The simulated pass is the one that earns its keep: it renders each template with the
 * declarations Outlook Windows cannot support removed, so a layout that only holds together
 * because of a feature that client lacks shows up as a diff here rather than in an inbox.
 *
 * Update with `pnpm exec playwright test --update-snapshots` from this directory, and read
 * the diff before committing it — a changed baseline is a changed email.
 *
 * Elements are built with `createElement` rather than JSX on purpose. Playwright installs
 * its own JSX runtime in spec files for component testing, so `<Welcome />` here produces a
 * Playwright locator descriptor, not a React element, and `renderToStaticMarkup` rejects it
 * with "Objects are not valid as a React child".
 */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { expect, test } from '@playwright/test'
import {
  indexFeatures,
  PasswordReset,
  Receipt,
  renderEmail,
  simulate,
  SIMULATED_CLIENTS,
  Welcome,
  type CanIEmailData,
} from '@cascivo/email'

const features = indexFeatures(
  JSON.parse(
    readFileSync(new URL('../../../scripts/email/vendor/caniemail.json', import.meta.url), 'utf8'),
  ) as CanIEmailData,
)

const TEMPLATES = [
  ['welcome', createElement(Welcome)],
  ['password-reset', createElement(PasswordReset)],
  ['receipt', createElement(Receipt)],
] as const

/** Three themes, matching `apps/site/test/visual.spec.ts`. Twelve would be churn, not cover. */
const THEMES = ['light', 'dark', 'warm'] as const

const OUTLOOK = SIMULATED_CLIENTS.find((c) => c.platform === 'windows')!

for (const [name, element] of TEMPLATES) {
  for (const theme of THEMES) {
    test(`${name} renders in ${theme}`, async ({ page }) => {
      await page.setContent(renderEmail(element, { theme }).html)
      await expect(page).toHaveScreenshot(`${name}-${theme}.png`, { fullPage: true })
    })
  }

  test(`${name} survives Outlook Windows support`, async ({ page }) => {
    const { html } = renderEmail(element, { theme: 'light' })
    await page.setContent(simulate(html, features, OUTLOOK))
    await expect(page).toHaveScreenshot(`${name}-outlook.png`, { fullPage: true })
  })
}
