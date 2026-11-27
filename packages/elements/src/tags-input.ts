import { define as defineTag, set, targetOf } from './base.ts'
import { CvChips, syncChips } from './chips.ts'

const TAG = 'cv-tags-input-tag'
const DISMISS = 'cv-tags-input-dismiss'

/**
 * `<cv-tags-input>`: the `TagsInput` markup (a `.cv-tags-input-wrapper` of
 * `.cv-tags-input-tag` spans and one `<input>`), form-associated: submits one `name` entry
 * per tag. Enter or comma adds, Backspace on an empty field removes the last tag, a paste
 * with separators (comma, semicolon, newline, tab) adds each piece, blur adds the pending
 * text. Attributes: `name`, `required`, `disabled`, `max`, `placeholder` (shown while there
 * are no tags), `remove-label` (`Remove {label}`).
 */
export class CvTagsInput extends CvChips {
  constructor() {
    super()
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      const tag = t.closest(`.${DISMISS}`)?.parentElement
      if (this.hasAttribute('disabled')) return
      if (tag) this.commit(this.values.peek().filter((v) => v !== tag.dataset['value']))
      if (!t.closest('input')) this.#input()?.focus()
    })
    this.addEventListener('keydown', (e) => {
      const input = this.#input()
      if (e.target !== input || !input) return
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault()
        this.#add([input.value])
      } else if (e.key === 'Backspace' && !input.value) this.commit(this.values.peek().slice(0, -1))
    })
    this.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text') ?? ''
      if (e.target !== this.#input() || !/[,;\n\t]/.test(text)) return
      e.preventDefault()
      this.#add(text.split(/[,;\n\t]/))
    })
    this.addEventListener('focusout', (e) => {
      const input = this.#input()
      if (e.target === input && input?.value) this.#add([input.value])
    })
  }

  protected initial(): string[] {
    return this.$$(`.${TAG}`).map(
      (t) => t.dataset['value'] ?? t.firstChild?.textContent?.trim() ?? '',
    )
  }

  #input(): HTMLInputElement | null {
    return this.$<HTMLInputElement>('input')
  }

  /** Add the new, non-empty, distinct pieces up to `max`; the field is cleared either way. */
  #add(raw: string[]): void {
    const input = this.#input()
    if (input) input.value = ''
    const max = Number(this.getAttribute('max') ?? Infinity)
    const next = [...this.values.peek()]
    for (const piece of raw) {
      const tag = piece.trim()
      if (tag && !next.includes(tag) && next.length < max) next.push(tag)
    }
    if (next.length !== this.values.peek().length) this.commit(next)
  }

  protected render(): void {
    const input = this.#input()
    if (!input) return
    const off = this.hasAttribute('disabled')
    const tags = this.values.value
    set(input, 'disabled', off ? '' : null)
    set(input, 'aria-required', this.hasAttribute('required') ? 'true' : null)
    const placeholder = this.getAttribute('placeholder')
    if (placeholder !== null) set(input, 'placeholder', tags.length ? null : placeholder)
    const wrapper = input.parentElement
    if (wrapper) {
      set(wrapper, 'data-disabled', off ? '' : null)
      syncChips(
        wrapper,
        input,
        tags.map((v) => [v, v]),
        {
          chip: TAG,
          remove: DISMISS,
          glyph: '×',
          text: this.getAttribute('remove-label') ?? 'Remove {label}',
          off,
        },
      )
    }
    this.sync(input)
  }
}

export function define(): void {
  defineTag('cv-tags-input', CvTagsInput)
}
