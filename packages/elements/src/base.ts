import { createMachine, transition } from '@cascivo/core/pure'
import { effect, signal } from '@preact/signals-core'

let counter = 0

/**
 * Write an attribute only when it differs (`null` removes it). Every `render()` goes through
 * this, so a re-render that changes nothing produces no mutation record and the
 * MutationObserver below settles instead of looping.
 */
export function set(el: Element | null | undefined, name: string, value: string | null): void {
  if (!el) return
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name)
  } else if (el.getAttribute(name) !== value) el.setAttribute(name, value)
}

/** Keyboard target as an element (events from text nodes do not reach here). */
export const targetOf = (event: Event): Element => event.target as Element

/**
 * Light-DOM base: state lives in signals on the instance; `render()` projects it onto
 * whatever markup is currently inside the element. It reruns on every signal change (effect)
 * and on every DOM change (MutationObserver), so an htmx/idiomorph morph that resets
 * attributes or replaces children is repaired on the next microtask and the element keeps
 * its state, provided it keeps its `id` (idiomorph then reuses the node).
 */
export abstract class CvElement extends HTMLElement {
  protected uid = ''
  #stop: (() => void)[] = []

  connectedCallback(): void {
    this.uid ||= this.id || `cv${++counter}`
    const mo = new MutationObserver(() => this.render())
    mo.observe(this, { attributes: true, childList: true, subtree: true })
    this.#stop = [effect(() => this.render()), () => mo.disconnect()]
  }

  disconnectedCallback(): void {
    for (const stop of this.#stop) stop()
    this.#stop = []
  }

  protected abstract render(): void

  protected emit(type: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }))
  }

  protected $<T extends Element = HTMLElement>(selector: string): T | null {
    return this.querySelector<T>(selector)
  }

  protected $$<T extends Element = HTMLElement>(selector: string): T[] {
    return Array.from(this.querySelectorAll<T>(selector))
  }
}

/** The popup both form elements run (combobox listbox, date-picker dialog). */
const popup = createMachine({
  initial: 'closed',
  states: { closed: { on: { OPEN: 'open' } }, open: { on: { CLOSE: 'closed' } } },
})

/**
 * Shared by the two form-associated elements: popup FSM, value property, form value,
 * events, reset and dismissal. The `value` attribute is the initial value (like
 * `<input value>`); the live value is the `value` property, so a morph that rewrites the
 * attribute does not clobber what the user picked.
 */
export abstract class CvFormElement extends CvElement {
  static formAssociated = true
  readonly state = signal(popup.initial)
  readonly current = signal<string | undefined>(undefined)
  protected internals: ElementInternals

  constructor() {
    super()
    this.internals = this.attachInternals()
    // The inner native field's own input/change would reach listeners with the wrong target
    // and the wrong value (typed text, not the committed value); the host fires its own.
    for (const type of ['input', 'change'])
      this.addEventListener(type, (e) => e.target !== this && e.stopPropagation())
    // Dismiss when focus leaves. Deferred: a re-render can blur the focused node with no
    // relatedTarget, and render() puts focus back before this runs.
    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget as Node | null))
        queueMicrotask(() => !this.contains(document.activeElement) && this.close(false))
    })
  }

  connectedCallback(): void {
    if (!this.uid) this.setValue(this.getAttribute('value') ?? '', true)
    super.connectedCallback()
  }

  get value(): string {
    return this.current.value ?? ''
  }

  set value(v: string) {
    this.setValue(v, true)
  }

  get name(): string | null {
    return this.getAttribute('name')
  }

  get form(): HTMLFormElement | null {
    return this.internals.form
  }

  get isOpen(): boolean {
    return this.state.value === 'open'
  }

  formResetCallback(): void {
    this.value = this.getAttribute('value') ?? ''
  }

  protected send(event: 'OPEN' | 'CLOSE'): void {
    this.state.value = transition(popup, this.state.peek(), event)
  }

  protected close(focus = true): void {
    this.send('CLOSE')
    if (focus) this.$('[role="combobox"]')?.focus()
  }

  /** Set the value; unless `quiet`, fire `cv-value-change` + native `input`/`change`. */
  protected setValue(v: string, quiet = false): void {
    const value = v || undefined
    this.current.value = value
    this.internals.setFormValue(v)
    if (quiet) return
    this.emit('cv-value-change', { value })
    this.dispatchEvent(new Event('input', { bubbles: true }))
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  /**
   * The parts both fields share: ARIA wiring and disabled (on the input and an optional
   * popup button), the visible text, validity.
   */
  protected renderField(
    input: HTMLInputElement,
    controls: string,
    text: string,
    placeholder: string,
    valueMissing: string,
    button?: Element | null,
  ): void {
    const disabled = this.hasAttribute('disabled') ? '' : null
    for (const el of [input, button]) {
      set(el, 'aria-controls', controls)
      set(el, 'aria-expanded', String(this.isOpen))
      // Through set(): assigning `.disabled = true` re-sets the attribute and queues a
      // mutation record even when nothing changed, which would re-run render() forever.
      set(el, 'disabled', disabled)
    }
    set(input, 'placeholder', this.getAttribute('placeholder') ?? placeholder)
    set(input, 'aria-required', this.hasAttribute('required') ? 'true' : null)
    set(this.$('[class$="-wrapper"]'), 'data-state', this.isOpen ? 'open' : 'closed')
    // Mirrored to the attribute so a morph that strips it leaves a mutation record to repair.
    set(input, 'value', text)
    if (input.value !== text) input.value = text
    if (this.hasAttribute('required') && this.current.value === undefined)
      this.internals.setValidity({ valueMissing: true }, valueMissing, input)
    else this.internals.setValidity({})
  }
}

/** Idempotent `customElements.define`: a second bundle or a re-run script is a no-op. */
export function define(tag: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, ctor)
}
