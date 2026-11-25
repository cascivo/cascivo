import { signal } from '@preact/signals-core'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'

const OPENER = 'data-cv-drawer-open'
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
const SIDES = ['start', 'end', 'top', 'bottom']

/**
 * `<cv-drawer>`: wraps the markup `Drawer` renders (`.cv-drawer-overlay` > `[role="dialog"]`
 * panel). cv-dialog's native `<dialog>` does not apply: the drawer is a div overlay, so closed
 * means `inert` + `data-state="closed"` (the CSS fades and slides on that) and open traps focus
 * by making everything outside the panel inert, with Tab wrapping as a fallback. Open state is
 * a signal (initial: the `open` attribute); `side` (start | end | top | bottom) is written to
 * the overlay and panel. Opens from `[data-cv-drawer-open="<id>"]` or `.show()`; closes from
 * `[data-cv-drawer-close]` or `.cv-drawer-close`, Escape, a backdrop click (unless `static`) or
 * `.close()`. Focus returns to the opener (else the element with its id, else `<main>`).
 * Fires `cv-open` / `cv-close`. Body scroll is not locked (the React `Drawer` does that).
 */
export class CvDrawer extends CvElement {
  readonly state = signal(false)
  #opener: { el: Element; id: string } | undefined
  #inerted: Element[] = []

  constructor() {
    super()
    this.addEventListener('click', (e) => {
      const t = targetOf(e)
      if (
        t.closest('[data-cv-drawer-close],.cv-drawer-close') ||
        (t.classList.contains('cv-drawer-overlay') && !this.hasAttribute('static'))
      )
        this.close()
    })
    this.addEventListener('keydown', (e) => {
      if (!this.state.peek()) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        return this.close()
      }
      if (e.key !== 'Tab') return
      const items = this.$$(FOCUSABLE).filter((el) => el.checkVisibility())
      const edge = items[e.shiftKey ? 0 : items.length - 1]
      if (edge && edge === document.activeElement) {
        e.preventDefault()
        items[e.shiftKey ? items.length - 1 : 0]?.focus()
      }
    })
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
    const panel = this.$('[role="dialog"]')
    const first =
      this.$('[autofocus]') ?? this.$$(FOCUSABLE).find((c) => !c.matches('.cv-drawer-close'))
    if (panel && !this.contains(document.activeElement)) {
      if (!first) set(panel, 'tabindex', '-1')
      ;(first ?? panel).focus()
    }
  }

  close(): void {
    if (!this.state.peek()) return
    this.state.value = false
    this.emit('cv-close')
    const was = this.#opener
    this.#opener = undefined
    const target =
      (was?.el.isConnected ? was.el : was?.id ? document.getElementById(was.id) : null) ??
      document.querySelector(`[${OPENER}="${this.id}"]`) ??
      document.querySelector('main')
    if (!(target instanceof HTMLElement)) return
    if (target.tabIndex < 0 && !target.matches('button,a[href],input,select,textarea'))
      target.tabIndex = -1
    target.focus()
  }

  protected render(): void {
    const overlay = this.$('.cv-drawer-overlay')
    if (!overlay) return
    const open = this.state.value
    const side = this.getAttribute('side')
    set(this, 'open', open ? '' : null)
    set(overlay, 'data-state', open ? 'open' : 'closed')
    set(overlay, 'inert', open ? null : '')
    const panel = this.$('[role="dialog"]')
    set(panel, 'aria-modal', 'true')
    if (side && SIDES.includes(side)) for (const el of [overlay, panel]) set(el, 'data-side', side)
    // Inert every sibling on the path from the overlay to <body>: the drawer owns focus.
    if (open && !this.#inerted.length) {
      let from: Element = overlay
      for (let n = from.parentElement; n; from = n, n = n.parentElement)
        for (const s of Array.from(n.children))
          if (s !== from && !s.hasAttribute('inert')) {
            s.setAttribute('inert', '')
            this.#inerted.push(s)
          }
    } else if (!open) {
      for (const s of this.#inerted) s.removeAttribute('inert')
      this.#inerted = []
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    for (const s of this.#inerted) s.removeAttribute('inert')
    this.#inerted = []
  }
}

export function define(): void {
  defineTag('cv-drawer', CvDrawer)
  const g = globalThis as { __cvDrawerOpen?: boolean }
  if (g.__cvDrawerOpen) return
  g.__cvDrawerOpen = true
  document.addEventListener('click', (e) => {
    const id = targetOf(e).closest(`[${OPENER}]`)?.getAttribute(OPENER)
    const drawer = id ? document.getElementById(id) : null
    if (drawer instanceof CvDrawer) drawer.show()
  })
}
