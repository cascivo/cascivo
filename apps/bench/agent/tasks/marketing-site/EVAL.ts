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

interface TextRun {
  text: string
  /** Index of the FAQ block holding it (see `textRuns`); -1 outside every FAQ block. */
  faqBlock: number
  /** Part of the FAQ's own heading ("Frequently asked questions"), so never one of its questions. */
  faqHeading: boolean
}

/**
 * The text a reader can see right now, in document order. Playwright's visibility treats a
 * 0-height panel as hidden only for the panel itself, not for its text, so a collapsed panel
 * animated by height is checked through its clipping ancestors.
 *
 * Each run is placed in the FAQ block that holds it, found the ways `sectionOnPage` finds the
 * FAQ: the section, article or region around a heading matching /faq|question/, a region so
 * named, or the in-page target of a link so named.
 */
function textRuns(page: Page): Promise<TextRun[]> {
  return page.evaluate(() => {
    const faqName = /faq|question/i
    const all = (selector: string) => Array.from(document.querySelectorAll(selector))
    const faqHeadings = all('h1, h2, h3, h4, h5, h6, [role="heading"]').filter((h) =>
      faqName.test(h.textContent ?? ''),
    )
    const blocks: Element[] = []
    const add = (el: Element | null) => {
      if (el !== null && el !== document.body && !blocks.includes(el)) blocks.push(el)
    }
    for (const h of faqHeadings)
      add(h.closest('section, article, [role="region"]') ?? h.parentElement)
    for (const region of all('section[aria-label], [role="region"]'))
      if (faqName.test(region.getAttribute('aria-label') ?? '')) add(region)
    for (const link of all('a[href^="#"]')) {
      const name = `${link.textContent ?? ''} ${link.getAttribute('aria-label') ?? ''}`
      let id = ''
      try {
        id = decodeURIComponent((link.getAttribute('href') ?? '').slice(1))
      } catch {
        continue
      }
      if (faqName.test(name) && id !== '' && !id.startsWith('/')) add(document.getElementById(id))
    }

    const runs: { text: string; faqBlock: number; faqHeading: boolean }[] = []
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
      if (clipped) continue
      runs.push({
        text,
        faqBlock: blocks.findIndex((block) => block.contains(el)),
        faqHeading: faqHeadings.some((h) => h.contains(el)),
      })
    }
    return runs
  })
}

async function visibleText(page: Page): Promise<Set<string>> {
  return new Set((await textRuns(page)).map((run) => run.text))
}

const isQuestion = (text: string) => text.length >= 8 && text.endsWith('?')

/** Two answered questions: an FAQ is plural, and one "?" is a tagline ("Tired of slow deploys?"). */
const MIN_ANSWERED = 2

/**
 * A static FAQ: inside the FAQ block, at least two visible questions each followed, before the
 * next question, by enough visible text to be its answer. The FAQ's own heading ("Have
 * questions?") is not one of its questions. The prompt asks for "an FAQ", not an accordion.
 */
async function staticAnswerVisible(page: Page): Promise<boolean> {
  const runs = await textRuns(page)
  const blocks = new Set(runs.map((run) => run.faqBlock).filter((block) => block !== -1))
  for (const block of blocks) {
    const inBlock = runs.filter((run) => run.faqBlock === block && !run.faqHeading)
    let answered = 0
    inBlock.forEach((run, i) => {
      if (!isQuestion(run.text)) return
      let answer = ''
      for (const next of inBlock.slice(i + 1)) {
        if (isQuestion(next.text)) break
        answer += ` ${next.text}`
      }
      if (answer.trim().length >= MIN_ANSWER) answered += 1
    })
    if (answered >= MIN_ANSWERED) return true
  }
  return false
}

/**
 * Collapsed disclosures, split by whether they read as FAQ questions (names ending in "?"):
 * buttons that say they are collapsed, closed `<details>`, and a hand-rolled toggle that is a
 * question-named button with no `aria-expanded` at all. Handles, not locators: a role locator
 * with `expanded: false` re-resolves after each click and would point at another trigger.
 */
async function collapsedDisclosures(
  page: Page,
): Promise<{ questions: ElementHandle[]; others: ElementHandle[] }> {
  const untagged: ElementHandle[] = []
  for (const el of await page.getByRole('button', { name: /\?\s*$/ }).elementHandles())
    if ((await el.getAttribute('aria-expanded')) === null) untagged.push(el)
  const candidates = [
    ...(await page.getByRole('button', { expanded: false }).elementHandles()),
    ...(await page.locator('details:not([open]) > summary').elementHandles()),
    ...untagged,
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
  return { questions, others }
}

async function anyReveals(page: Page, triggers: ElementHandle[]): Promise<boolean> {
  for (const trigger of triggers.slice(0, 5)) {
    const before = await visibleText(page)
    // A trigger an earlier click removed or covered is skipped, not waited on.
    const clicked = await trigger.click({ timeout: 2000 }).then(
      () => true,
      () => false,
    )
    if (!clicked) continue
    const revealed = await eventually(async () => {
      const added = [...(await visibleText(page))].filter((t) => !before.has(t))
      return added.join(' ').length >= MIN_ANSWER
    }, 3000)
    if (revealed) return true
  }
  return false
}

/**
 * An FAQ answers its questions: by opening a question disclosure, or on screen already. A
 * toggle that hides its answer for good fails both. A collapsed control that is not a question
 * (a header menu) is tried only when no question is a disclosure.
 */
async function faqAnswerable(page: Page): Promise<boolean> {
  const { questions, others } = await collapsedDisclosures(page)
  if (questions.length > 0 && (await anyReveals(page, questions))) return true
  if (questions.length === 0 && others.length > 0 && (await anyReveals(page, others))) return true
  return staticAnswerVisible(page)
}

/**
 * The page footer. A `<footer>` nested in `main` or a `section` is no `contentinfo` landmark,
 * but it is still the footer the prompt asked for; one inside a quote or a card is a byline.
 */
async function footerVisible(page: Page): Promise<boolean> {
  if (await anyVisible(page.getByRole('contentinfo'))) return true
  return page
    .locator('footer')
    .evaluateAll((els) =>
      els.some(
        (el) =>
          el.checkVisibility() && el.closest('blockquote, figure, article, aside, dialog') === null,
      ),
    )
}

export default async function evaluate(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl)
  if (!(await eventually(() => anyVisible(page.getByRole('heading', { level: 1 })))))
    throw new Error('hero: no visible h1 on /')
  if (!(await eventually(() => footerVisible(page))))
    throw new Error('footer: no contentinfo landmark or page <footer> on /')

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
  if (!(await faqAnswerable(page)))
    throw new Error(
      'FAQ: no question disclosure reveals its answer, and no question has a visible answer',
    )
}
