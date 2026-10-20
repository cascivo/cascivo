import type { Locator, Page } from '@playwright/test'
import { eventually, firstVisible, goTo } from '../_lib.ts'

/**
 * The prompt asks for "a sign-in page and a sign-up page ... with a dashboard after login", so
 * the check is: a sign-in form with an identity field and a password field, a sign-up page
 * reached by navigation, and a dashboard heading once the sign-in form is submitted.
 *
 * No credentials are given in the prompt, so any plausible ones must log in. These are shaped to
 * pass common client-side rules (a valid email, a long mixed password).
 */
const IDENTITY_VALUE = 'canary.user@example.com'
const PASSWORD_VALUE = 'Canary-Pass-7391!'

const SIGN_IN = /sign\s*in|log\s*in|login/i
const SIGN_UP = /sign\s*up|register|create\s+(an?\s+|your\s+)?account|get\s+started/i
const DASHBOARD = /dashboard/i
const PASSWORD = /password/i
/** "Email", "Username", "Email or username"; never the password field ("Your user password"). */
const IDENTITY = /^(?!.*password).*(e-?mail|user)/i

/** Playwright maps `input[type=password]` to the textbox role, so both are found by name. */
const passwordField = (page: Page) => firstVisible(page.getByRole('textbox', { name: PASSWORD }))
const identityField = (page: Page) => firstVisible(page.getByRole('textbox', { name: IDENTITY }))

/**
 * The name of the button that submits `field`'s form, or null when the field is in no form or
 * the form has no submit button (an onClick-only form). DOM data, read as text only.
 */
function submitName(field: Locator): Promise<string | null> {
  return field.evaluate((el) => {
    const form = el.closest('form')
    const submit = form?.querySelector<HTMLElement>(
      'button[type="submit"], button:not([type]), input[type="submit"]',
    )
    if (!submit) return null
    const label = submit.getAttribute('aria-label')
    if (label) return label
    return submit instanceof HTMLInputElement ? submit.value : submit.innerText
  })
}

/** A sign-up page says so in a heading or on its submit button ("Create account", "Sign up"). */
async function saysSignUp(page: Page, field: Locator | null): Promise<boolean> {
  if (await firstVisible(page.getByRole('heading', { name: SIGN_UP }))) return true
  const name = field === null ? null : await submitName(field)
  return name !== null && SIGN_UP.test(name)
}

async function onSignIn(page: Page): Promise<boolean> {
  const password = await passwordField(page)
  if (password === null || (await identityField(page)) === null) return false
  return !(await saysSignUp(page, password))
}

async function onSignUp(page: Page): Promise<boolean> {
  const identity = await identityField(page)
  if (identity === null) return false
  return saysSignUp(page, (await passwordField(page)) ?? identity)
}

/**
 * Follow a link or button named `name`; failing that, a tab, for apps that put both forms
 * behind "Sign in | Sign up" tabs. goTo itself verifies the click had an effect.
 */
async function follow(page: Page, baseUrl: string, name: RegExp): Promise<boolean> {
  try {
    await goTo(page, baseUrl, name)
    return true
  } catch {
    const tab = await firstVisible(page.getByRole('tab', { name }))
    if (tab === null) return false
    await tab.click({ timeout: 2000 })
    return true
  }
}

/** Land on the sign-in form: on `/` itself, or one click away from it. */
async function openSignIn(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  if (await eventually(() => onSignIn(page), 3000)) return
  if (!(await follow(page, baseUrl, SIGN_IN)))
    throw new Error('sign-in: no sign-in form on / and no link, button or tab named sign in/log in')
  if (!(await eventually(() => onSignIn(page))))
    throw new Error(
      'sign-in: no form with a textbox named email/user and one named password (by label, ' +
        'aria-label or placeholder)',
    )
}

async function signUpReachable(page: Page, baseUrl: string): Promise<void> {
  await openSignIn(page, baseUrl)
  // The link usually sits on the sign-in page; a landing page may hold it instead.
  let followed = await follow(page, baseUrl, SIGN_UP)
  if (!followed) {
    await page.goto(baseUrl)
    followed = await follow(page, baseUrl, SIGN_UP)
  }
  if (!followed)
    throw new Error('sign-up: no link, button or tab named sign up/register/create account')
  if (!(await eventually(() => onSignUp(page))))
    throw new Error(
      'sign-up: navigation led to no page with an email/user field and a sign-up heading or button',
    )
}

async function signInReachesDashboard(page: Page, baseUrl: string): Promise<void> {
  await openSignIn(page, baseUrl)
  const identity = await identityField(page)
  const password = await passwordField(page)
  if (identity === null || password === null) throw new Error('sign-in: the form vanished')
  await identity.fill(IDENTITY_VALUE)
  await password.fill(PASSWORD_VALUE)
  // The dashboard must replace the form: a "Dashboard" heading beside a still-open sign-in form
  // (a nav item, a product screenshot's caption) is not having logged in.
  const arrived = async () =>
    (await firstVisible(page.getByRole('heading', { name: DASHBOARD }))) !== null &&
    (await passwordField(page)) === null
  await password.press('Enter')
  if (await eventually(arrived, 2000)) return
  // A form that only listens to its button gets the click instead. The last visible match is the
  // form's own button: it follows the fields and any header "Sign in" link.
  let submit: Locator | null = null
  for (const button of await page
    .getByRole('button', { name: /sign\s*in|log\s*in|login|continue|submit/i })
    .all())
    if (await button.isVisible()) submit = button
  await submit?.click({ timeout: 5000 }).catch(() => {})
  if (!(await eventually(arrived, 8000)))
    throw new Error(
      'dashboard: submitting sign-in with an email and password showed no heading named dashboard',
    )
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  // Sign-up first: signing in may persist a session that skips the forms on the next visit.
  await signUpReachable(page, baseUrl)
  await signInReachesDashboard(page, baseUrl)
}
