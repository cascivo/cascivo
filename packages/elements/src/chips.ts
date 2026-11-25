import { signal } from '@preact/signals-core'
import { CvElement, set } from './base.ts'
import { elements } from './messages.ts'
import { t } from '@cascivo/i18n'

/**
 * Shared by `cv-multi-select` and `cv-tags-input`: a form-associated element whose value is a
 * list. It does not extend `CvFormElement` because that holds one string; here the form value
 * is a `FormData` with one entry per item, so a plain `<form>` submits `name=a&name=b`.
 */
export abstract class CvChips extends CvElement {
  static formAssociated = true
  readonly values = signal<string[]>([])
  protected internals = this.attachInternals()
  #init: string[] | undefined

  constructor() {
    super()
    // The inner native field's own input/change carry the wrong target and the typed text.
    for (const type of ['input', 'change'])
      this.addEventListener(type, (e) => e.target !== this && e.stopPropagation())
  }

  /** The value the server rendered; also what a form reset restores. */
  protected abstract initial(): string[]

  connectedCallback(): void {
    this.#init ??= this.values.value = this.initial()
    super.connectedCallback()
  }

  get value(): string[] {
    return this.values.value
  }

  set value(v: string[]) {
    this.commit(v, true)
  }

  get name(): string | null {
    return this.getAttribute('name')
  }

  get form(): HTMLFormElement | null {
    return this.internals.form
  }

  formResetCallback(): void {
    this.commit(this.#init ?? [], true)
  }

  /** Replace the value; unless `quiet`, fire `cv-value-change` + native `input`/`change`. */
  protected commit(v: string[], quiet = false): void {
    this.values.value = v
    if (quiet) return
    this.emit('cv-value-change', { value: v })
    this.dispatchEvent(new Event('input', { bubbles: true }))
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  /** Project the value onto the form (`name` entries) and `required` validity. */
  protected sync(anchor: HTMLElement | null | undefined): void {
    const name = this.getAttribute('name')
    const v = this.values.value
    let data: FormData | null = null
    if (name) {
      data = new FormData()
      for (const item of v) data.append(name, item)
    }
    this.internals.setFormValue(data)
    if (this.hasAttribute('required') && !v.length)
      this.internals.setValidity(
        { valueMissing: true },
        t(elements.valueMissing),
        anchor ?? undefined,
      )
    else this.internals.setValidity({})
  }
}

const make = (tag: string, cls: string): HTMLElement => {
  const el = document.createElement(tag)
  el.className = cls
  return el
}

/**
 * Reconcile the chips among `parent`'s children (`[value, label]` pairs, in order, ahead of
 * `before`) without touching the ones already right, so a render that changes nothing
 * mutates nothing. A chip is `<span class=chip data-value>label<button class=remove></span>`;
 * `o.label` wraps the label in a span, `o.glyph` puts a visible glyph in the button.
 */
export function syncChips(
  parent: Element,
  before: Element | null,
  items: [string, string][],
  o: { chip: string; remove: string; text: string; off: boolean; label?: string; glyph?: string },
): void {
  const have = [...parent.children].filter((c): c is HTMLElement => c.classList.contains(o.chip))
  const want = items.map(([value]) => have.find((c) => c.dataset['value'] === value))
  have.forEach((c) => want.includes(c) || c.remove())
  let at = want.find(Boolean) ?? before
  items.forEach(([value, label], i) => {
    let chip = want[i]
    if (!chip) {
      chip = make('span', o.chip)
      chip.dataset['value'] = value
      const button = make('button', o.remove)
      button.setAttribute('type', 'button')
      if (o.glyph) {
        const glyph = make('span', '')
        glyph.setAttribute('aria-hidden', 'true')
        glyph.textContent = o.glyph
        button.append(glyph)
      }
      chip.append(o.label ? make('span', o.label) : '', button)
    }
    const text = o.label ? chip.firstElementChild! : chip.firstChild!
    if (text.textContent !== label) text.textContent = label
    const button = chip.lastElementChild!
    set(button, 'aria-label', o.text.replace('{label}', label))
    set(button, 'disabled', o.off ? '' : null)
    if (chip === at) at = chip.nextElementSibling
    else parent.insertBefore(chip, at)
  })
}
