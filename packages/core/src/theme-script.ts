// No imports, and no `'use client'`: `@cascivo/core/pure` re-exports this, and an Astro
// integration calls it in the config process (Node), where neither react-dom nor the signals
// runtime may be loaded.

export const DEFAULT_KEY = 'cascivo-theme'
export const DEFAULT_ATTR = 'data-theme'

/**
 * A tiny script to inline in your document `<head>` (before the app bundle) so
 * the persisted theme paints on the first byte — no flash of the wrong theme on
 * SSR or a hard reload. Pass the same `storageKey`/`attribute`/`defaultTheme`
 * you give `ThemeProvider`.
 *
 * Precedence matches `ThemeProvider`: persisted value > `defaultTheme`
 * (if set) > OS `prefers-color-scheme` > `'light'`. Passing `defaultTheme`
 * suppresses the OS check, so a "dark by default" app stays dark on a light-OS
 * visitor.
 *
 * `reapplyOn` names document events after which the script runs again. A
 * client-side router that swaps in the next page's `<html>` attributes (Astro's
 * `<ClientRouter>` fires `astro:after-swap`) would otherwise reset `data-theme`
 * to the server-rendered value on every soft navigation. Without it the output
 * is byte-identical to earlier releases, so an existing CSP hash still matches.
 *
 * The script sets `data-theme` **before** React hydrates, so add
 * `suppressHydrationWarning` to the element that carries the attribute (usually
 * `<html>`) — the mutation is intentional, and without the flag React 19 logs a
 * hydration mismatch.
 *
 * ```tsx
 * // Next.js app/layout.tsx
 * <html suppressHydrationWarning>
 *   <head>
 *     <script dangerouslySetInnerHTML={{ __html: themePreloadScript({ defaultTheme: 'dark' }) }} />
 *   </head>
 * </html>
 * ```
 */
export function themePreloadScript(
  options: {
    storageKey?: string
    attribute?: string
    defaultTheme?: string
    reapplyOn?: string | readonly string[]
  } = {},
): string {
  const key = JSON.stringify(options.storageKey ?? DEFAULT_KEY)
  const attr = JSON.stringify(options.attribute ?? DEFAULT_ATTR)
  const fallback = JSON.stringify(options.defaultTheme ?? 'light')
  // OS preference is consulted only when no explicit defaultTheme was given; an
  // explicit default (especially a custom theme like 'midnight') must win over OS.
  // The persisted value is read last, so it always wins.
  const osBlock =
    options.defaultTheme === undefined
      ? `if(typeof matchMedia==='function'){` +
        `if(matchMedia('(prefers-color-scheme: dark)').matches)v='dark';` +
        `else if(matchMedia('(prefers-color-scheme: light)').matches)v='light';}`
      : ''
  // Reads the persistedSignal envelope ({"v":1,"value":"dark"}) and the bare
  // string form, matching decode() in @cascivo/storage.
  const body =
    `try{var v=${fallback};` +
    osBlock +
    `var raw=localStorage.getItem(${key});` +
    `if(raw){v=raw;try{var e=JSON.parse(raw);if(e&&typeof e==='object'&&'value'in e)v=e.value;}catch(_){}}` +
    `document.documentElement.setAttribute(${attr},v);}catch(_){}`
  const events =
    typeof options.reapplyOn === 'string' ? [options.reapplyOn] : (options.reapplyOn ?? [])
  if (events.length === 0) return `(function(){${body}})();`
  const listeners = events
    .map((event) => `document.addEventListener(${JSON.stringify(event)},a);`)
    .join('')
  return `(function(){function a(){${body}}a();${listeners}})();`
}
