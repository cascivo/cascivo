import type { ElementHandle, Page } from '@playwright/test'
import { anyVisible, eventually, findOnAnyPage } from '../_lib.ts'

/** Matches what `re` matches, unless the whole name is a question (an FAQ entry). */
const statement = (re: RegExp) => new RegExp(`^(?!.*\\?\\s*$).*(?:${re.source})`, 'i')

/**
 * Section headings are marketing copy, so each pattern covers the usual phrasings, not one
 * word: "Simple, transparent pricing", "Plans for every team", "Loved by developers". A heading
 * that asks a question is an FAQ entry ("Is there a free plan?"), so only the FAQ may match one.
 */
const SECTIONS: { label: string; name: RegExp }[] = [
  { label: 'features', name: statement(/feature/) },
  { label: 'pricing', name: statement(/pricing|plans?\b/) },
  { label: 'testimonials', name: statement(/testimonial|customer|review|loved by|what .* say/) },
  { label: 'FAQ', name: /faq|question/i },
]

/** Answer text shorter than this is a label or an icon name, not a revealed answer. */
const MIN_ANSWER = 10

/**
 * A section is there when a heading or a named region says so, or when a link of that name
 * leads to an in-page target that holds a heading: a features section headed "Everything you
 * need", linked from a "Features" nav item, is still the features section.
 */
async function sectionOnPage(page: Page, name: RegExp): Promise<boolean> {
  if (await anyVisible(page.getByRole('heading', { name }))) return true
  if (await anyVisible(page.getByRole('region', { name }))) return true
  for (const link of await page.getByRole('link', { name }).all()) {
    const href = await link.getAttribute('href')
    const id = href?.startsWith('#') ? decodeURIComponent(href.slice(1)) : ''
    if (id === '' || id.startsWith('/')) continue
    const target = await page.evaluate((targetId) => {
      const el = document.getElementById(targetId)
      return el !== null && el.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]') !== null
    }, id)
    if (target) return true
  }
  return false
}

/**
 * Text a reader can see right now. Playwright's visibility treats a 0-height panel as hidden only
 * for the panel itself, not for its text, so a collapsed panel animated by height is checked
 * through its clipping ancestors.
 */
function visibleText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out = new Set<string>()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
      const el = node.parentElement
      if (text === '' || el === null) continue
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
      let clipped = false
      for (let a: Element | null = el; a !== null && a !== document.body; a = a.parentElement) {
        const box = a.getBoundingClientRect()
        if ((box.height < 1 || box.width < 1) && getComputedStyle(a).overflow !== 'visible') {
          clipped = true
          break
        }
      }
      if (!clipped) out.add(text)
    }
    return [...out]
  })
}

/**
 * Collapsed disclosures: buttons that say they are collapsed, and closed `<details>`. Questions
 * first (their names end in "?"), so a header menu button is tried only when nothing else is.
 * Handles, not locators: a role locator with `expanded: false` re-resolves after each click and
 * would point at a different trigger, or none, once the first one expands.
 */
async function collapsedDisclosures(page: Page): Promise<ElementHandle[]> {
  const candidates = [
    ...(await page.getByRole('button', { expanded: false }).elementHandles()),
    ...(await page.locator('details:not([open]) > summary').elementHandles()),
  ]
  const questions: ElementHandle[] = []
  const others: ElementHandle[] = []
  for (const el of candidates) {
    if (!(await el.isVisible())) continue
    const text = ((await el.textContent()) ?? '').trim()
    const label = ((await el.getAttribute('aria-label')) ?? '').trim()
    if (text.endsWith('?') || label.endsWith('?')) questions.push(el)
    else others.push(el)
  }
  return [...questions, ...others]
}

async function disclosureReveals(page: Page): Promise<boolean> {
  const triggers = await collapsedDisclosures(page)
  for (const trigger of triggers.slice(0, 5)) {
    const before = new Set(await visibleText(page))
    // A trigger an earlier click removed or covered is skipped, not waited on.
    const clicked = await trigger.click({ timeout: 2000 }).then(
      () => true,
      () => false,
    )
    if (!clicked) continue
    const revealed = await eventually(async () => {
      const added = (await visibleText(page)).filter((t) => !before.has(t))
      return added.join(' ').length >= MIN_ANSWER
    }, 3000)
    if (revealed) return true
  }
  return false
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  if (!(await eventually(() => anyVisible(page.getByRole('heading', { level: 1 })))))
    throw new Error('hero: no visible h1 on /')
  if (!(await eventually(() => anyVisible(page.getByRole('contentinfo')))))
    throw new Error('footer: no contentinfo landmark (a page-level <footer>) on /')

  for (const { label, name } of SECTIONS) {
    await page.goto(baseUrl)
    if (await eventually(() => sectionOnPage(page, name), 2000)) continue
    // A multi-page site: the section is its own route, under a heading of its own.
    await findOnAnyPage(page, baseUrl, 'heading', name).catch(() => {
      throw new Error(`${label}: no heading, named region or in-page link matching ${String(name)}`)
    })
  }

  // findOnAnyPage left the browser where the FAQ is when it lives on a page of its own.
  if (!(await sectionOnPage(page, /faq|question/i))) await page.goto(baseUrl)
  if (!(await disclosureReveals(page)))
    throw new Error('FAQ: no collapsed disclosure that reveals hidden text when expanded')
}
