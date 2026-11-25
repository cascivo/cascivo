import type { CvToaster, ToastInput } from './toaster.ts'

/**
 * `@cascivo/elements/htmx`: the glue between htmx swaps and the elements. Pure DOM events, no
 * htmx import. `install()` is idempotent (a boosted page that re-runs the module, or two
 * bundles, wire the document once) and runs on import.
 *
 * - Focus after a swap: remembers the focused element's id before the swap; when focus fell
 *   to `<body>` it goes back to that id, else to the swap target (made focusable), else
 *   `<main>`. Never leaves focus on `<body>` (plan checkpoint γ).
 * - `HX-Trigger: cv-dialog-close` closes the dialog around the trigger (else every open one).
 * - `HX-Trigger: {"cv-toast": [{kind, message}]}` (B1 `View::toast` without an OOB toaster)
 *   adds toasts to `<cv-toaster>`.
 * - Idiomorph defaults: the focused field keeps its typed value, and an open `<dialog>`'s `open`
 *   is browser state, not markup; a morph must not
 *   strip it.
 */
const lost = (): boolean => !document.activeElement || document.activeElement === document.body

function focusIn(el: Element | null | undefined): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el.tabIndex < 0 && !el.matches('button,a[href],input,select,textarea')) el.tabIndex = -1
  el.focus({ preventScroll: true })
  return !lost()
}

export function install(): void {
  const g = globalThis as { __cvHtmx?: boolean; Idiomorph?: { defaults: IdiomorphDefaults } }
  if (g.__cvHtmx) return
  g.__cvHtmx = true

  let was = ''
  document.addEventListener('htmx:beforeSwap', () => {
    was = document.activeElement?.id ?? ''
  })
  // `afterSettle`, not `afterSwap`: attribute transitions of the new content have finished.
  document.addEventListener('htmx:afterSettle', (e) => {
    if (!lost()) return
    const target = (e as CustomEvent<{ target?: Element }>).detail.target
    // Focus the same control, else the first focusable thing the swap rendered, else its target.
    if (focusIn(was ? document.getElementById(was) : null)) return
    const first = target?.querySelector(
      '[autofocus],a[href],button:not([disabled]),input:not([disabled]),select,textarea',
    )
    focusIn(first) || focusIn(target) || focusIn(document.querySelector('main'))
  })

  document.addEventListener('cv-dialog-close', (e) => {
    const own = (e.target as Element | null)?.closest?.('cv-dialog')
    const open = own ? [own] : [...document.querySelectorAll('cv-dialog[open]')]
    for (const d of open) (d as { close?: () => void }).close?.()
  })

  document.addEventListener('cv-toast', (e) => {
    const toaster = document.querySelector<CvToaster>('cv-toaster')
    const d = (e as CustomEvent<unknown>).detail
    // htmx wraps a non-object detail as `{value}`; an array is kept as `value` too.
    const list = (Array.isArray(d) ? d : ((d as { value?: unknown })?.value ?? d)) as unknown
    for (const t of Array.isArray(list) ? list : [list])
      if (t && typeof (t as ToastInput).message === 'string') toaster?.add(t as ToastInput)
  })

  const defaults = g.Idiomorph?.defaults
  if (defaults) {
    // What the user is typing into survives a morph back to the server's (empty) markup.
    defaults.ignoreActiveValue = true
    const before = defaults.callbacks.beforeAttributeUpdated
    defaults.callbacks.beforeAttributeUpdated = (name, el, type) =>
      !(name === 'open' && el.localName === 'dialog') && before(name, el, type)
  }
}

interface IdiomorphDefaults {
  ignoreActiveValue: boolean
  callbacks: {
    beforeAttributeUpdated: (name: string, el: Element, type: 'update' | 'remove') => boolean
  }
}

install()
