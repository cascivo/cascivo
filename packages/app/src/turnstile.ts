/**
 * `@cascivo/app/turnstile` — the Turnstile widget in the page, without a framework.
 *
 * ```tsx
 * let widget: TurnstileWidget | null = null
 * <div ref={(el) => {
 *   widget?.remove()
 *   widget = el ? mountTurnstile(el, { siteKey, onToken: (t) => (token.value = t) }) : null
 * }} />
 * // send `token` with the form; the Worker checks it with verifyTurnstile. It is single-use:
 * widget.reset() after each submit.
 * ```
 */

interface TurnstileApi {
  render(
    element: HTMLElement,
    options: {
      sitekey: string
      action?: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

export interface TurnstileWidget {
  /** Clears the token and starts a new challenge — after every submit. */
  reset(): void
  /** Takes the widget out of the page. */
  remove(): void
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<TurnstileApi> | null = null

function api(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => {
      const turnstile = (window as unknown as { turnstile?: TurnstileApi }).turnstile
      if (turnstile) resolve(turnstile)
      else reject(new Error('Turnstile did not load'))
    }
    script.onerror = () => {
      loading = null
      reject(new Error('Turnstile could not be loaded'))
    }
    document.head.appendChild(script)
  })
  return loading
}

/** Renders a Turnstile widget into `element`; `onToken` gets each token it issues. */
export function mountTurnstile(
  element: HTMLElement,
  options: {
    siteKey: string
    /** Checked by `verifyTurnstile({ action })`, so a token cannot be reused on another form. */
    action?: string
    onToken: (token: string) => void
    /** The token expired or the challenge failed: there is no valid token now. */
    onExpire?: () => void
  },
): TurnstileWidget {
  let id: string | null = null
  let removed = false
  const clear = () => options.onExpire?.()
  void api().then((turnstile) => {
    if (removed) return
    id = turnstile.render(element, {
      sitekey: options.siteKey,
      ...(options.action ? { action: options.action } : {}),
      callback: options.onToken,
      'expired-callback': clear,
      'error-callback': clear,
    })
  })
  return {
    reset() {
      if (id !== null) void api().then((t) => t.reset(id!))
      clear()
    },
    remove() {
      removed = true
      if (id !== null) void api().then((t) => t.remove(id!))
    },
  }
}
