import { t } from '@cascivo/i18n'
import { CvElement, define as defineTag, set, targetOf } from './base.ts'
import { toast as msg } from './messages.ts'

// Contract classes of the `toast` unit (toaster.test.ts checks them against @cascivo/css).
const C = 'cv-toast-'
const VARIANT: Record<string, string> = { info: 'default', danger: 'destructive' }
const ICON: Record<string, string> = { success: '✓', warning: '!', destructive: '✕' }

export interface ToastInput {
  kind?: string
  message: string
  title?: string
}

interface Timer {
  left: number
  since: number
  id: number
}

/**
 * `<cv-toaster id="cv-toaster">`: the live region B1's `View::toast` fills (OOB
 * `beforeend:#cv-toaster`) or notifies (`cv-toast` event, wired by the htmx glue to `.add()`).
 * Toasts are `.cv-toast-toast` rows (`role=status`, `alert` for destructive). Each dismisses
 * itself after `duration` ms (default 5000; 0 keeps them); hover or focus anywhere in the
 * region pauses every timer; the close button or Escape dismisses now. Without the script
 * the server-rendered toasts simply stay (no-JS flash fallback). Fires `cv-toast-dismiss`.
 */
export class CvToaster extends CvElement {
  #timers = new WeakMap<Element, Timer>()
  #live = new Set<Element>()
  #paused = false
  #from: Element | null = null

  constructor() {
    super()
    const pause = (on: boolean) => {
      this.#paused = on
      for (const el of this.#live) this.#clock(el)
    }
    this.addEventListener('pointerenter', () => pause(true))
    this.addEventListener('pointerleave', () => pause(this.matches(':focus-within')))
    this.addEventListener('focusin', (e) => {
      const from = (e as FocusEvent).relatedTarget as Element | null
      if (from && !this.contains(from)) this.#from = from
      pause(true)
    })
    this.addEventListener('focusout', (e) => {
      if (!this.contains((e as FocusEvent).relatedTarget as Node | null))
        pause(this.matches(':hover'))
    })
    this.addEventListener('click', (e) => {
      const toast = targetOf(e).closest(`.${C}close`)?.closest(`.${C}toast`)
      if (toast) this.#dismiss(toast)
    })
    this.addEventListener('keydown', (e) => {
      const toast = targetOf(e).closest(`.${C}toast`)
      if (e.key === 'Escape' && toast) this.#dismiss(toast)
    })
  }

  /** Append a toast built from data (the `cv-toast` trigger path); text only, never HTML. */
  add({ kind = 'info', message, title }: ToastInput): void {
    const variant = VARIANT[kind] ?? kind
    const el = (tag: string, cls: string, text?: string) => {
      const n = document.createElement(tag)
      n.className = C + cls
      if (text !== undefined) n.textContent = text
      return n
    }
    const toast = el('div', 'toast')
    toast.setAttribute('role', variant === 'destructive' ? 'alert' : 'status')
    toast.dataset['variant'] = variant
    const icon = ICON[variant]
    if (icon) {
      const i = el('span', 'icon', icon)
      i.setAttribute('aria-hidden', 'true')
      toast.append(i)
    }
    const body = el('div', 'body')
    body.append(el('div', 'title', title ?? message))
    if (title) body.append(el('div', 'description', message))
    const close = el('button', 'close', '×')
    close.setAttribute('type', 'button')
    toast.append(body, close)
    this.append(toast)
  }

  #dismiss(toast: Element): void {
    this.#forget(toast)
    const next = toast.nextElementSibling?.querySelector<HTMLElement>(`.${C}close`)
    const had = toast.contains(document.activeElement)
    toast.replaceWith()
    this.emit('cv-toast-dismiss')
    if (!had) return
    // Focus was inside the dismissed toast: hand it on, never to <body>.
    const back = this.#from?.isConnected ? this.#from : null
    const target = next ?? this.$(`.${C}close`) ?? back ?? document.querySelector('main')
    if (!(target instanceof HTMLElement)) return
    if (target.tabIndex < 0 && !target.matches('button,a[href],input')) target.tabIndex = -1
    target.focus()
  }

  #forget(toast: Element): void {
    clearTimeout(this.#timers.get(toast)?.id)
    this.#timers.delete(toast)
    this.#live.delete(toast)
  }

  /** Start, pause or resume the countdown of one toast. */
  #clock(toast: Element): void {
    const timer = this.#timers.get(toast)
    if (!timer) return
    clearTimeout(timer.id)
    if (this.#paused) {
      if (timer.since) timer.left -= Date.now() - timer.since
      timer.since = 0
      return
    }
    timer.since = Date.now()
    timer.id = window.setTimeout(() => this.#dismiss(toast), Math.max(timer.left, 0))
  }

  protected render(): void {
    set(this, 'role', 'region')
    if (!this.matches('[aria-label]')) set(this, 'aria-label', t(msg.region))
    const ms = Number(this.getAttribute('duration') ?? 5000)
    const now = new Set<Element>(this.$$(`.${C}toast`))
    for (const toast of this.#live) if (!now.has(toast)) this.#forget(toast)
    for (const toast of now) {
      set(toast, 'data-state', 'visible')
      const close = toast.querySelector(`.${C}close`)
      if (close && !close.hasAttribute('aria-label')) set(close, 'aria-label', t(msg.dismiss))
      if (this.#live.has(toast)) continue
      this.#live.add(toast)
      if (ms <= 0) continue
      this.#timers.set(toast, { left: ms, since: 0, id: 0 })
      this.#clock(toast)
    }
  }
}

export function define(): void {
  defineTag('cv-toaster', CvToaster)
}
