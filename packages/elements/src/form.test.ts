import axe from 'axe-core'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { define } from './form.ts'

const field = (
  name: string,
  extra: string,
  err = '',
) => `<div class="cv-field-field" data-state="${err ? 'invalid' : 'default'}">
<label id="f-${name}-label" for="f-${name}" class="cv-label-root">${name}</label>
<div class="cv-input-root"><input id="f-${name}" class="cv-input-input" name="${name}" aria-labelledby="f-${name}-label"${err ? ` aria-invalid="true" aria-describedby="f-${name}-error"` : ''} ${extra}/></div>
${err ? `<p id="f-${name}-error" role="alert" class="cv-field-error">${err}</p>` : ''}</div>`

const title = `required minlength="3" data-cv-msg-value-missing="Title is required." data-cv-msg-too-short="Use at least 3 characters."`
const html = (inner = field('title', title) + field('note', 'required')) =>
  `<cv-form id="host"><form id="f" method="post" action="/x">${inner}<button type="submit">Save</button></form></cv-form>`

const tick = () => new Promise<void>((r) => setTimeout(r, 0))
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const form = () => $<HTMLFormElement>('f')

async function mount(markup = html()) {
  document.body.innerHTML = markup
  await tick()
}

beforeAll(define)

describe('cv-form', () => {
  it('invalid submit renders the server message, wires ARIA, focuses the first control', async () => {
    await mount()
    const submit = vi.fn()
    form().addEventListener('submit', submit)
    form().requestSubmit()
    await tick()
    const err = $('f-title-error')
    expect(err.textContent).toBe('Title is required.')
    expect(err.getAttribute('role')).toBe('alert')
    expect(err.className).toBe('cv-field-error')
    expect(err.parentElement?.className).toBe('cv-field-field')
    expect($('f-title').getAttribute('aria-invalid')).toBe('true')
    expect($('f-title').getAttribute('aria-describedby')).toBe('f-title-error')
    expect($('f-title').closest('.cv-field-field')?.getAttribute('data-state')).toBe('invalid')
    expect($('f-note-error').textContent).not.toBe('')
    expect(document.activeElement).toBe($('f-title'))
    expect(submit).not.toHaveBeenCalled()
    expect(form().hasAttribute('aria-busy')).toBe(false)
  })

  it('picks the first failing flag with a message, else validationMessage', async () => {
    // jsdom only reports tooShort after user edits, so use type/pattern mismatches.
    await mount(
      html(
        field(
          'mail',
          'type="email" data-cv-msg-type-mismatch="Not an email." data-cv-msg-pattern-mismatch="Wrong shape." pattern="a.*"',
        ) + field('note', 'pattern="a.*"'),
      ),
    )
    $<HTMLInputElement>('f-mail').value = 'x'
    $<HTMLInputElement>('f-note').value = 'x'
    form().requestSubmit()
    await tick()
    expect($('f-mail-error').textContent).toBe('Not an email.')
    // no data attribute for this flag: browser text
    expect($('f-note-error').textContent).toBe($<HTMLInputElement>('f-note').validationMessage)
  })

  it('keeps other describedby ids and reuses a server-made error', async () => {
    await mount(
      html(field('title', title, 'Server says no.')).replace(
        'aria-describedby="f-title-error"',
        'aria-describedby="hint f-title-error"',
      ),
    )
    $('f-title').dispatchEvent(new Event('invalid'))
    expect(document.querySelectorAll('#f-title-error')).toHaveLength(1)
    expect($('f-title-error').textContent).toBe('Title is required.')
    expect($('f-title').getAttribute('aria-describedby')).toBe('hint f-title-error')
  })

  it('fixing the input clears the error', async () => {
    await mount()
    form().requestSubmit()
    await tick()
    const t = $<HTMLInputElement>('f-title')
    t.value = 'abc'
    t.dispatchEvent(new Event('input', { bubbles: true }))
    expect(document.getElementById('f-title-error')).toBeNull()
    expect(t.hasAttribute('aria-invalid')).toBe(false)
    expect(t.hasAttribute('aria-describedby')).toBe(false)
    expect(t.closest('.cv-field-field')?.getAttribute('data-state')).toBe('default')
    expect($('f-note-error')).not.toBeNull()
  })

  it('valid submit sets aria-busy, blocks a second submit, afterRequest clears it', async () => {
    await mount()
    $<HTMLInputElement>('f-title').value = 'abc'
    $<HTMLInputElement>('f-note').value = 'x'
    const submit = vi.fn((e: Event) => e.preventDefault())
    form().addEventListener('submit', submit)
    form().requestSubmit()
    expect(form().getAttribute('aria-busy')).toBe('true')
    expect(document.querySelector('[type=submit]')?.getAttribute('aria-busy')).toBe('true')
    form().requestSubmit()
    expect(submit).toHaveBeenCalledTimes(1)
    $('host').dispatchEvent(new CustomEvent('htmx:afterRequest', { bubbles: true }))
    expect(form().hasAttribute('aria-busy')).toBe(false)
    form().requestSubmit()
    expect(submit).toHaveBeenCalledTimes(2)
    window.dispatchEvent(new Event('pageshow'))
    expect(form().hasAttribute('aria-busy')).toBe(false)
  })

  it('blocks a submit event when the form is invalid (novalidate case)', async () => {
    await mount()
    form().noValidate = true
    const submit = vi.fn()
    form().addEventListener('submit', submit)
    const e = new Event('submit', { bubbles: true, cancelable: true })
    form().dispatchEvent(e)
    await tick()
    expect(e.defaultPrevented).toBe(true)
    expect(submit).not.toHaveBeenCalled()
    expect($('f-title-error')).not.toBeNull()
  })

  it('htmx:beforeSwap flips a 422 into a swap, leaves other statuses', async () => {
    await mount()
    const swap = (status: number) => {
      const detail = { xhr: { status }, shouldSwap: false, isError: true }
      $('f').dispatchEvent(new CustomEvent('htmx:beforeSwap', { bubbles: true, detail }))
      return detail
    }
    expect(swap(422)).toMatchObject({ shouldSwap: true, isError: false })
    expect(swap(500)).toMatchObject({ shouldSwap: false, isError: true })
  })

  it('afterSettle focuses the first aria-invalid control', async () => {
    await mount()
    $('f-note').setAttribute('aria-invalid', 'true')
    $('f-title').setAttribute('aria-invalid', 'true')
    $('host').dispatchEvent(new CustomEvent('htmx:afterSettle', { bubbles: true }))
    expect(document.activeElement).toBe($('f-title'))
  })

  it('connecting with server errors focuses the first; without errors it does not', async () => {
    await mount(html(field('title', title, 'Title is required.') + field('note', 'required')))
    expect(document.activeElement).toBe($('f-title'))
    ;($('f-title') as HTMLElement).blur()
    await mount()
    expect(document.activeElement).toBe(document.body)
  })

  it('stops listening to pageshow once disconnected', async () => {
    await mount()
    const f = form()
    f.setAttribute('aria-busy', 'true')
    $('host').remove()
    window.dispatchEvent(new Event('pageshow'))
    expect(f.getAttribute('aria-busy')).toBe('true')
  })

  it('define is idempotent', () => {
    expect(() => define()).not.toThrow()
  })

  it('is axe clean in the error state', async () => {
    await mount()
    form().requestSubmit()
    await tick()
    const r = await axe.run(document.body, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(r.violations.map((v) => v.id)).toEqual([])
  })
})
