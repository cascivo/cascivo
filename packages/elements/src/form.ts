import { define as defineTag, set, targetOf } from './base.ts'

// ValidityState flags in the order a message is picked (kebab = the `data-cv-msg-*` suffix).
const FLAGS = [
  ['value-missing', 'valueMissing'],
  ['type-mismatch', 'typeMismatch'],
  ['too-short', 'tooShort'],
  ['too-long', 'tooLong'],
  ['range-underflow', 'rangeUnderflow'],
  ['range-overflow', 'rangeOverflow'],
  ['bad-input', 'badInput'],
  ['pattern-mismatch', 'patternMismatch'],
  ['step-mismatch', 'stepMismatch'],
] as const

type Control = HTMLInputElement
const INVALID = '[aria-invalid="true"]'

/** The server's message for the first failing flag that has one, else the browser's. */
function messageOf(c: Control): string {
  for (const [kebab, flag] of FLAGS) {
    const msg = c.validity[flag] && c.getAttribute(`data-cv-msg-${kebab}`)
    if (msg) return msg
  }
  return c.validationMessage
}

/** Edit one id in a space-separated attribute; an emptied attribute is removed. */
function ids(el: Element, name: string, id: string, on: boolean): void {
  const rest = (el.getAttribute(name) ?? '').split(/\s+/).filter((t) => t && t !== id)
  set(el, name, (on ? [...rest, id] : rest).join(' ') || null)
}

/**
 * `<cv-form>`: wraps a server-rendered `<form>` (what cascivo-html emits). Without JS the
 * browser validates natively and the server re-renders errors; with it, the same error
 * markup is rendered client-side in place of the browser bubble, a submit in flight blocks a
 * second one (`aria-busy`), htmx swaps 422 responses, and focus lands on the first error.
 * It never sets `novalidate` (a morph would strip it) and holds no state to repair.
 */
export class CvForm extends HTMLElement {
  #batch: Control[] = []
  #idle = () => this.#busy(false)

  constructor() {
    super()
    // `invalid` does not bubble, so capture; one batch per validation pass.
    this.addEventListener(
      'invalid',
      (e) => {
        e.preventDefault()
        const c = targetOf(e) as Control
        this.#show(c)
        if (this.#batch.push(c) > 1) return
        queueMicrotask(() => {
          const first = this.#batch.sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
          )[0]
          this.#batch = []
          first?.focus()
        })
      },
      true,
    )
    const fix = (e: Event) => {
      const c = targetOf(e) as Control
      if (c.validity?.valid && c.matches(INVALID)) this.#hide(c)
    }
    this.addEventListener('input', fix)
    this.addEventListener('change', fix)
    this.addEventListener(
      'submit',
      (e) => {
        const form = targetOf(e) as HTMLFormElement
        // checkValidity() fires `invalid` (rendered above); it is only false without a native check.
        if (form.getAttribute('aria-busy') === 'true' || !form.checkValidity()) {
          e.preventDefault()
          e.stopImmediatePropagation()
        } else this.#busy(true, form)
      },
      true,
    )
    this.addEventListener('htmx:afterRequest', this.#idle)
    // htmx 2 does not swap 4xx; a 422 is the server re-rendering the form with errors.
    this.addEventListener('htmx:beforeSwap', (e) => {
      const d = (e as CustomEvent<{ xhr: XMLHttpRequest; shouldSwap: boolean; isError: boolean }>)
        .detail
      if (d.xhr.status !== 422) return
      d.shouldSwap = true
      d.isError = false
    })
    this.addEventListener('htmx:afterSettle', () => this.#focusError())
  }

  connectedCallback(): void {
    window.addEventListener('pageshow', this.#idle)
    this.#focusError()
  }

  disconnectedCallback(): void {
    window.removeEventListener('pageshow', this.#idle)
  }

  #focusError(): void {
    this.querySelector<HTMLElement>(INVALID)?.focus()
  }

  #busy(on: boolean, form?: HTMLFormElement): void {
    const els = form
      ? [form, ...form.querySelectorAll('[type=submit]')]
      : this.querySelectorAll('[aria-busy]')
    for (const el of els) set(el, 'aria-busy', on ? 'true' : null)
  }

  #show(c: Control): void {
    const id = `${c.id}-error`
    const field = c.closest('.cv-field-field')
    let p = c.ownerDocument.getElementById(id)
    if (!p) {
      p = c.ownerDocument.createElement('p')
      p.id = id
      p.setAttribute('role', 'alert')
      p.className = 'cv-field-error'
      if (field) field.append(p)
      else c.parentElement?.after(p)
    }
    p.textContent = messageOf(c)
    set(c, 'aria-invalid', 'true')
    ids(c, 'aria-describedby', id, true)
    set(field, 'data-state', 'invalid')
  }

  #hide(c: Control): void {
    const id = `${c.id}-error`
    c.ownerDocument.getElementById(id)?.remove()
    set(c, 'aria-invalid', null)
    ids(c, 'aria-describedby', id, false)
    set(c.closest('.cv-field-field'), 'data-state', 'default')
  }
}

export function define(): void {
  defineTag('cv-form', CvForm)
}
