import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'

const OPENER = 'data-cv-dialog-open'

/**
 * `<cv-dialog>`: wraps a native `<dialog>` (the markup `Modal` renders). Open state is a signal
 * (initial value: the `open` attribute); render opens the dialog with `showModal()`, so the
 * browser traps focus, makes the rest inert and closes on Escape. Opens from
 * `[data-cv-dialog-open="<id>"]` or `.show()`; closes from `[data-cv-dialog-close]`, a
 * backdrop click (unless `static`), `.close()` or the `cv-dialog-close` event (htmx glue).
 * Focus returns to the opener; if a swap replaced it, to the element with its id, else to the
 * opener control, else to `<main>`, never to `<body>`. Fires `cv-open` / `cv-close`.
 */
export class CvDialog extends CvElement {
  readonly state = signal(false)
  #opener: { el: Element; id: string } | undefined

  constructor() {
    super()
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      if (
        t.closest('[data-cv-dialog-close]') ||
        (t.localName === 'dialog' && !this.hasAttribute('static'))
      )
        this.close()
    })
    // The dialog is modal, but a native Tab past its last control leaves for the browser UI:
    // wrap instead (APG dialog).
    this.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return
      const items = this.$$(
        'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
      ).filter((el) => el.checkVisibility())
      const edge = items[e.shiftKey ? 0 : items.length - 1]
      if (edge && edge === document.activeElement) {
        e.preventDefault()
        items[e.shiftKey ? items.length - 1 : 0]?.focus()
      }
    })
    // Escape and form[method=dialog] close natively; follow them. Neither bubbles.
    this.addEventListener('close', () => this.close(), true)
    this.addEventListener('cancel', () => this.close(), true)
  }

  connectedCallback(): void {
    if (!this.uid) this.state.value = this.hasAttribute('open')
    super.connectedCallback()
  }

  get open(): boolean {
    return this.state.value
  }

  show(): void {
    if (this.state.peek()) return
    const el = document.activeElement
    this.#opener = el && el !== document.body ? { el, id: el.id } : undefined
    this.state.value = true
    this.emit('cv-open')
  }

  close(): void {
    if (!this.state.peek()) return
    this.state.value = false
    this.emit('cv-close')
    // After render has closed the dialog: focus goes back to where the user came from.
    queueMicrotask(() => this.#restore())
  }

  #restore(): void {
    if (this.state.peek() || this.contains(document.activeElement)) return
    const was = this.#opener
    this.#opener = undefined
    const target =
      (was?.el.isConnected ? was.el : was?.id ? document.getElementById(was.id) : null) ??
      document.querySelector(`[${OPENER}="${this.id}"]`) ??
      document.querySelector('main')
    if (!(target instanceof HTMLElement)) return
    // `<main>` is not focusable by default.
    if (target.tabIndex < 0 && !target.matches('button,a[href],input,select,textarea'))
      target.tabIndex = -1
    target.focus()
  }

  protected render(): void {
    const dialog = this.$<HTMLDialogElement>('dialog')
    if (!dialog) return
    const open = this.state.value
    set(this, 'open', open ? '' : null)
    set(dialog, 'data-state', open ? 'open' : 'closed')
    // jsdom has no showModal; `open` still carries the state there.
    if (typeof dialog.showModal !== 'function') return set(dialog, 'open', open ? '' : null)
    if (open && !dialog.matches(':modal')) {
      // `showModal()` throws on a dialog that is already open non-modally (server `<dialog open>`).
      dialog.removeAttribute('open')
      dialog.showModal()
    } else if (!open && dialog.open) dialog.close()
  }
}

export function define(): void {
  defineTag('cv-dialog', CvDialog)
  // One delegated opener for every `[data-cv-dialog-open="<id>"]`, swapped-in markup included.
  const g = globalThis as { __cvDialogOpen?: boolean }
  if (g.__cvDialogOpen) return
  g.__cvDialogOpen = true
  document.addEventListener('click', (e) => {
    const id = targetOf(e).closest(`[${OPENER}]`)?.getAttribute(OPENER)
    const dialog = id ? document.getElementById(id) : null
    if (dialog instanceof CvDialog) dialog.show()
  })
}
