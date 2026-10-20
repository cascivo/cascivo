import type { ElementHandle, Locator, Page } from '@playwright/test'
import { eventually, firstVisible, goTo } from '../_lib.ts'

/**
 * The prompt: "a contact form with name, email and message fields. All three are required and
 * the email must be valid; show an error next to each invalid field when the form is submitted,
 * and a success message when it is valid."
 *
 * "Next to each invalid field" is checked as new visible text in the field's own zone, which is
 * any one of:
 * - an element the field names in `aria-describedby` or `aria-errormessage` (the accessible
 *   association: wherever it sits, it belongs to that field);
 * - the field's own wrapper: its highest ancestor that holds no other of the three fields;
 * - the siblings that follow that wrapper, up to the next field, the next field's label or a
 *   button (flat markup: `<label>Name <input></label><span>error</span>`).
 *
 * ARIA is accepted but not required: the prompt asks for an error beside its field, not for an
 * association, and requiring one would fail a plain-markup app the prompt is satisfied by. A
 * single summary above or below the form ("Please fix 3 errors") is in no field's zone, so it
 * does not count, and neither does a native validation bubble, which is not in the page at all.
 */
const SUCCESS = /thank|sent|success|received/i

type FieldKey = 'name' | 'email' | 'message'

interface FieldSpec {
  key: FieldKey
  name: RegExp
}

const FIELDS: readonly FieldSpec[] = [
  { key: 'name', name: /^(?!.*(e-?mail|message)).*name/i },
  { key: 'email', name: /e-?mail/i },
  { key: 'message', name: /^(?!.*e-?mail).*(message|comment|enquiry|inquiry)/i },
]

/** Long enough for a minimum-length rule on the message, short enough for any maximum. */
const VALID: Record<FieldKey, string> = {
  name: 'Canary Tester',
  email: 'canary@example.com',
  message: 'Hello from the canary. This message is long enough for any minimum length rule.',
}
const BAD_EMAIL = 'not-an-email'

/** What a field's zone shows, or null when the field is gone (a success screen replaced it). */
interface Zone {
  texts: string[]
  invalid: boolean
}

const fieldLocator = (page: Page, spec: FieldSpec) => page.getByRole('textbox', { name: spec.name })

async function fieldHandles(page: Page): Promise<(ElementHandle<Node> | null)[]> {
  return Promise.all(
    FIELDS.map(async (spec) => {
      const field = await firstVisible(fieldLocator(page, spec))
      return field === null ? null : field.elementHandle()
    }),
  )
}

/** Each field's zone texts, in FIELDS order. See the header comment for what a zone is. */
async function zones(page: Page): Promise<(Zone | null)[]> {
  const handles = await fieldHandles(page)
  return page.evaluate((fields) => {
    const present = fields.filter((f): f is Element => f instanceof Element)
    // Rendered and bigger than a visually-hidden (sr-only) clip: an error must be seen.
    const visible = (el: Element) => {
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false
      const box = el.getBoundingClientRect()
      return box.width > 2 && box.height > 2
    }
    const collect = (root: Element, field: Element, out: Set<string>) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const text = (node.nodeValue ?? '').replace(/\s+/g, ' ').trim()
        const parent = node.parentElement
        if (text === '' || parent === null || field.contains(node) || !visible(parent)) continue
        out.add(text)
      }
    }
    return fields.map((field) => {
      if (!(field instanceof Element)) return null
      const others = present.filter((o) => o !== field)
      const holdsOther = (el: Element) => others.some((o) => el.contains(o))
      const labelsOther = (el: Element) =>
        [...(el.matches('label') ? [el] : []), ...Array.from(el.querySelectorAll('label'))].some(
          (label) => label instanceof HTMLLabelElement && others.some((o) => label.control === o),
        )
      const out = new Set<string>()
      for (const attr of ['aria-describedby', 'aria-errormessage'])
        for (const id of (field.getAttribute(attr) ?? '').split(/\s+/)) {
          const target = id === '' ? null : document.getElementById(id)
          if (target !== null) collect(target, field, out)
        }
      let box: Element = field
      for (
        let up = box.parentElement;
        up !== null && up !== document.body && !holdsOther(up);
        up = up.parentElement
      )
        box = up
      collect(box, field, out)
      for (let sib = box.nextElementSibling; sib !== null; sib = sib.nextElementSibling) {
        if (holdsOther(sib) || labelsOther(sib)) break
        if (sib.matches('button, input[type="submit"]') || sib.querySelector('button')) break
        collect(sib, field, out)
      }
      return { texts: [...out], invalid: field.getAttribute('aria-invalid') === 'true' }
    })
  }, handles)
}

/** Zone texts in `after` that no baseline had: what the submit made appear beside the field. */
function newTexts(after: Zone | null, ...baselines: (Zone | null)[]): string[] {
  if (after === null) return []
  const seen = new Set(baselines.flatMap((z) => z?.texts ?? []))
  return after.texts.filter((t) => !seen.has(t) && !SUCCESS.test(t))
}

/** Visible text matching SUCCESS, as a set, so "appeared after submit" can be told apart. */
async function successTexts(page: Page): Promise<Set<string>> {
  const out = new Set<string>()
  for (const el of await page.getByText(SUCCESS).all())
    if (await el.isVisible()) out.add((await el.innerText()).replace(/\s+/g, ' ').trim())
  return out
}

async function openForm(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  const ready = async () => (await fieldHandles(page)).every((h) => h !== null)
  if (await eventually(ready, 3000)) return
  await goTo(page, baseUrl, /contact/i)
  if (!(await eventually(ready))) {
    const missing = (await fieldHandles(page))
      .map((h, i) => (h === null ? FIELDS[i]?.key : null))
      .filter((k) => k != null)
    throw new Error(`form: no textbox named for ${missing.join(', ')}`)
  }
}

async function field(page: Page, spec: FieldSpec): Promise<Locator> {
  const found = await firstVisible(fieldLocator(page, spec))
  if (found === null) throw new Error(`form: the ${spec.key} field vanished`)
  return found
}

/**
 * The form's submit button: one named send/submit, else the last button of the form that holds
 * the email field. The last visible one, because it follows the fields.
 */
async function submit(page: Page): Promise<void> {
  const named = page.getByRole('button', { name: /send|submit/i })
  const email = page.getByRole('textbox', { name: /e-?mail/i })
  const inForm = page.locator('form').filter({ has: email }).getByRole('button')
  let button: Locator | null = null
  for (const candidates of [named, inForm]) {
    for (const el of await candidates.all()) if (await el.isVisible()) button = el
    if (button !== null) break
  }
  if (button === null) throw new Error('submit: no send/submit button and no button in the form')
  try {
    await button.click({ timeout: 5000 })
  } catch {
    throw new Error('submit: the submit button could not be clicked (disabled until valid?)')
  }
}

async function fill(page: Page, values: Record<FieldKey, string>): Promise<void> {
  for (const spec of FIELDS) await (await field(page, spec)).fill(values[spec.key])
}

async function emptySubmitFlagsEachField(page: Page, baseUrl: string): Promise<void> {
  await openForm(page, baseUrl)
  const before = await zones(page)
  await submit(page)
  let lacking: string[] = []
  const allFlagged = async () => {
    const after = await zones(page)
    lacking = FIELDS.filter(
      (_, i) => newTexts(after[i] ?? null, before[i] ?? null).length === 0,
    ).map((s) => s.key)
    return lacking.length === 0
  }
  if (!(await eventually(allFlagged)))
    throw new Error(`empty submit: no error shown next to ${lacking.join(', ')}`)
}

async function invalidEmailFlagged(page: Page, baseUrl: string): Promise<void> {
  await openForm(page, baseUrl)
  const pristine = await zones(page)
  const shown = await successTexts(page)
  await fill(page, { ...VALID, email: BAD_EMAIL })
  await submit(page)
  // A wrong verdict can render a frame late; let the submit settle before judging it.
  await page.waitForTimeout(500)
  const emailFlagged = async () =>
    newTexts((await zones(page))[1] ?? null, pristine[1] ?? null).length > 0
  if (!(await eventually(emailFlagged)))
    throw new Error(
      `invalid email: submitting "${BAD_EMAIL}" showed no error next to the email field`,
    )
  for (const text of await successTexts(page))
    if (!shown.has(text)) throw new Error(`invalid email: the form reported success ("${text}")`)
}

async function validSubmitSucceeds(page: Page, baseUrl: string): Promise<void> {
  await openForm(page, baseUrl)
  const pristine = await zones(page)
  const shown = await successTexts(page)
  await fill(page, VALID)
  // Taken after filling too: a character counter beside the message changes as it is typed.
  const filled = await zones(page)
  await submit(page)
  const succeeded = async () => [...(await successTexts(page))].some((t) => !shown.has(t))
  if (!(await eventually(succeeded)))
    throw new Error('valid submit: no new text matching thank/sent/success/received')
  const after = await zones(page)
  for (const [i, spec] of FIELDS.entries()) {
    const zone = after[i] ?? null
    const errors = newTexts(zone, pristine[i] ?? null, filled[i] ?? null)
    if (errors.length > 0 || zone?.invalid === true)
      throw new Error(
        `valid submit: the ${spec.key} field still shows an error (${errors.join(' | ') || 'aria-invalid'})`,
      )
  }
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  // Each step loads the page afresh, so an error must come from that step's own submit.
  await emptySubmitFlagsEachField(page, baseUrl)
  await invalidEmailFlagged(page, baseUrl)
  await validSubmitSucceeds(page, baseUrl)
}
