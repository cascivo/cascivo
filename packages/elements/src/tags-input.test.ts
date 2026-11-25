import axe from 'axe-core'
import { Idiomorph } from 'idiomorph'
import { beforeAll, describe, expect, it } from 'vitest'
import { CvTagsInput, define } from './tags-input.ts'

// jsdom's ElementInternals has no setFormValue/setValidity: record what the element sends.
interface Fake {
  value: FormData | null
  flags: object
}
const fakes = new WeakMap<Element, Fake>()
HTMLElement.prototype.attachInternals = function (this: HTMLElement) {
  const fake: Fake = { value: null, flags: {} }
  fakes.set(this, fake)
  return {
    form: null,
    setFormValue: (v: FormData | null) => (fake.value = v),
    setValidity: (flags: object) => (fake.flags = flags),
  } as unknown as ElementInternals
}

const html = (attrs = '', tags = '') => `<cv-tags-input id="demo" name="tags"${attrs}>
<div class="cv-tags-input-wrapper">${tags}<input class="cv-tags-input-input" aria-label="Tags"></div></cv-tags-input>`
const serverTag = (v: string) =>
  `<span class="cv-tags-input-tag">${v}<button type="button" class="cv-tags-input-dismiss" aria-label="Remove ${v}">x</button></span>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const root = () => document.getElementById('demo') as CvTagsInput
const input = () => root().querySelector('input')!
const tags = () =>
  [...root().querySelectorAll('.cv-tags-input-tag')].map((t) => (t as HTMLElement).dataset['value'])
const submitted = () => fakes.get(root())!.value!.getAll('tags')
const key = (k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  input().dispatchEvent(e)
  return e
}
const typeIn = (text: string) => {
  input().value = text
  input().dispatchEvent(new Event('input', { bubbles: true }))
}
const paste = (text: string) => {
  const e = new Event('paste', { bubbles: true, cancelable: true }) as Event & {
    clipboardData: unknown
  }
  e.clipboardData = { getData: () => text }
  input().dispatchEvent(e)
  return e
}

async function mount(attrs = '', initial = '') {
  document.body.innerHTML = html(attrs, initial)
  await tick()
}

beforeAll(define)

describe('cv-tags-input', () => {
  it('Enter and comma add a tag, clear the field, fire cv-value-change, submit many values', async () => {
    await mount()
    const seen: unknown[] = []
    root().addEventListener('cv-value-change', (e) => seen.push((e as CustomEvent).detail))
    typeIn('one')
    expect(key('Enter').defaultPrevented).toBe(true)
    typeIn('two')
    key(',')
    await tick()
    expect(input().value).toBe('')
    expect(tags()).toEqual(['one', 'two'])
    expect(seen).toEqual([{ value: ['one'] }, { value: ['one', 'two'] }])
    expect(submitted()).toEqual(['one', 'two'])
  })

  it('ignores empty, duplicate and over-max tags', async () => {
    await mount(' max="2"')
    for (const v of ['', ' ', 'a', 'a', 'b', 'c']) {
      typeIn(v)
      key('Enter')
    }
    await tick()
    expect(root().value).toEqual(['a', 'b'])
  })

  it('Backspace on an empty field removes the last tag; not while typing', async () => {
    await mount('', serverTag('a') + serverTag('b'))
    expect(root().value).toEqual(['a', 'b'])
    typeIn('x')
    key('Backspace')
    expect(root().value).toEqual(['a', 'b'])
    typeIn('')
    key('Backspace')
    await tick()
    expect(root().value).toEqual(['a'])
    expect(tags()).toEqual(['a'])
  })

  it('dismiss buttons remove their tag and return focus to the field', async () => {
    await mount()
    for (const v of ['a', 'b', 'c']) {
      typeIn(v)
      key('Enter')
    }
    await tick()
    root().querySelectorAll<HTMLElement>('.cv-tags-input-dismiss')[1]!.click()
    await tick()
    expect(root().value).toEqual(['a', 'c'])
    expect(document.activeElement).toBe(input())
    expect(root().querySelector('.cv-tags-input-dismiss')!.getAttribute('aria-label')).toBe(
      'Remove a',
    )
  })

  it('paste with separators adds every piece; a plain paste is left to the browser', async () => {
    await mount()
    expect(paste('a, b;c\nd,,a').defaultPrevented).toBe(true)
    await tick()
    expect(root().value).toEqual(['a', 'b', 'c', 'd'])
    expect(paste('plain').defaultPrevented).toBe(false)
  })

  it('blur adds the pending text', async () => {
    await mount()
    input().value = 'late'
    input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await tick()
    expect(root().value).toEqual(['late'])
  })

  it('required validity and reset', async () => {
    await mount(' required', serverTag('a'))
    expect(fakes.get(root())!.flags).toEqual({})
    root().querySelector<HTMLElement>('.cv-tags-input-dismiss')!.click()
    await tick()
    expect(fakes.get(root())!.flags).toEqual({ valueMissing: true })
    expect(input().getAttribute('aria-required')).toBe('true')
    root().formResetCallback()
    await tick()
    expect(root().value).toEqual(['a'])
    expect(fakes.get(root())!.flags).toEqual({})
  })

  it('placeholder shows only while empty; disabled blocks everything', async () => {
    await mount(' placeholder="Add"')
    expect(input().placeholder).toBe('Add')
    typeIn('a')
    key('Enter')
    await tick()
    expect(input().hasAttribute('placeholder')).toBe(false)
    root().setAttribute('disabled', '')
    await tick()
    expect(input().disabled).toBe(true)
    expect(root().querySelector('.cv-tags-input-dismiss')!.hasAttribute('disabled')).toBe(true)
    root().querySelector<HTMLElement>('.cv-tags-input-dismiss')!.click()
    expect(root().value).toEqual(['a'])
  })

  it('survives an idiomorph morph back to the server markup', async () => {
    await mount()
    typeIn('a')
    key('Enter')
    await tick()
    Idiomorph.morph(root(), html(), { morphStyle: 'outerHTML' })
    await tick()
    expect(root().value).toEqual(['a'])
    expect(tags()).toEqual(['a'])
    typeIn('b')
    key('Enter')
    await tick()
    expect(submitted()).toEqual(['a', 'b'])
  })

  it('is axe clean', async () => {
    await mount('', serverTag('a'))
    typeIn('b')
    key('Enter')
    await tick()
    const r = await axe.run(document.body, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
