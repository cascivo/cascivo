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

/**
 * Land on the sign-in form: on `/` itself, or one click away from it. `fresh: false` first tries
 * the page as it is and the click from there, because an app that keeps accounts in memory loses
 * the one just registered on a reload.
 */
async function openSignIn(page: Page, baseUrl: string, fresh = true): Promise<void> {
  if (!fresh && (await eventually(() => onSignIn(page), 1000))) return
  if (fresh || !(await follow(page, baseUrl, SIGN_IN))) {
    await page.goto(baseUrl)
    if (await eventually(() => onSignIn(page), 3000)) return
    if (!(await follow(page, baseUrl, SIGN_IN)))
      throw new Error(
        'sign-in: no sign-in form on / and no link, button or tab named sign in/log in',
      )
  }
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

/** The dashboard must replace the form: a "Dashboard" heading beside a still-open sign-in form
 * (a nav item, a product screenshot's caption) is not having logged in. */
async function onDashboard(page: Page): Promise<boolean> {
  return (
    (await firstVisible(page.getByRole('heading', { name: DASHBOARD }))) !== null &&
    (await passwordField(page)) === null
  )
}

/**
 * Submit the form `field` belongs to: Enter first, as a user would. A form that only listens to
 * its button gets the click instead: the first matching button after the field, in document
 * order, which is the form's own and not a header link before it or a "Continue with Google"
 * after it.
 */
async function submitFrom(page: Page, field: Locator, name: RegExp): Promise<void> {
  await field.press('Enter')
  if (await eventually(() => onDashboard(page), 2000)) return
  // The press may already have moved the app on (sign-up done, back to sign-in): no second click.
  if (!(await field.isVisible())) return
  const handle = await field.elementHandle()
  let submit: Locator | null = null
  for (const button of await page.getByRole('button', { name }).all()) {
    if (!(await button.isVisible())) continue
    const after = await button.evaluate(
      (el, from) =>
        from !== null &&
        (from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      handle,
    )
    if (after) {
      submit = button
      break
    }
    submit ??= button
  }
  await submit?.click({ timeout: 5000 }).catch(() => {})
}

async function signIn(page: Page, baseUrl: string, fresh: boolean): Promise<boolean> {
  await openSignIn(page, baseUrl, fresh)
  const identity = await identityField(page)
  const password = await passwordField(page)
  if (identity === null || password === null) throw new Error('sign-in: the form vanished')
  await identity.fill(IDENTITY_VALUE)
  await password.fill(PASSWORD_VALUE)
  await submitFrom(page, password, /sign\s*in|log\s*in|login|continue|submit/i)
  return eventually(() => onDashboard(page), 8000)
}

/**
 * Register IDENTITY_VALUE / PASSWORD_VALUE through the sign-up form, filling every other empty
 * text box (name, confirm password) too. Best effort: whether the dashboard follows decides.
 */
async function register(page: Page, baseUrl: string): Promise<void> {
  if (!(await follow(page, baseUrl, SIGN_UP))) {
    await page.goto(baseUrl)
    if (!(await follow(page, baseUrl, SIGN_UP))) return
  }
  if (!(await eventually(() => onSignUp(page)))) return
  // By accessible name, like the sign-in fields; whatever is left empty (a name) gets a name.
  let last: Locator | null = null
  const plan: [Locator, string][] = [
    [page.getByRole('textbox', { name: PASSWORD }), PASSWORD_VALUE],
    [page.getByRole('textbox', { name: IDENTITY }), IDENTITY_VALUE],
    [page.getByRole('textbox'), 'Canary Tester'],
  ]
  for (const [boxes, value] of plan)
    for (const box of await boxes.all()) {
      if (!(await box.isVisible()) || (await box.inputValue().catch(() => 'x')) !== '') continue
      await box.fill(value, { timeout: 2000 }).catch(() => {})
      last = box
    }
  if (last !== null)
    await submitFrom(page, last, new RegExp(`${SIGN_UP.source}|continue|submit`, 'i'))
}

/**
 * The prompt names no account, so the EVAL signs in with plausible values. An app that only
 * admits registered users gets what a user would do next: sign up with the same values, then
 * (unless sign-up itself lands on the dashboard) sign in again, without reloading.
 */
async function signInReachesDashboard(page: Page, baseUrl: string): Promise<void> {
  if (await signIn(page, baseUrl, true)) return
  await register(page, baseUrl)
  if (await eventually(() => onDashboard(page), 3000)) return
  if (await signIn(page, baseUrl, false)) return
  throw new Error(
    'dashboard: submitting sign-in with an email and password (also after signing up with them) ' +
      'showed no heading named dashboard',
  )
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  // Sign-up first: signing in may persist a session that skips the forms on the next visit.
  await signUpReachable(page, baseUrl)
  await signInReachesDashboard(page, baseUrl)
}
