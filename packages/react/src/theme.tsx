'use client'
import { useSignalEffect, useSignals, type Signal } from '@cascivo/core'
import { useRef, type ReactNode, type RefObject } from 'react'
// Reach the sibling package's source directly — the same relative-import pattern
// the layout primitives use below (see index.ts). persistedSignal is SSR-safe:
// with no `window` its driver is a no-op, so the signal still works on the server.
import { persistedSignal } from '../../storage/src/persisted-signal'

const DEFAULT_KEY = 'cascivo-theme'
const DEFAULT_ATTR = 'data-theme'

interface ThemeConfig {
  storageKey: string
  defaultTheme: string
  /** Whether `defaultTheme` was explicitly provided (vs. defaulted to 'light'). */
  explicit: boolean
}

// Single source of truth for the whole app, mirroring the module-level `theme`
// signal pattern in apps/site/src/theme.ts. A module singleton — rather than
// React context — is what lets `useTheme()`/`setTheme()` work from any component
// (a header toggle, a settings page) with no provider prop-drilling, and keeps
// the reactivity signal-based per CLAUDE.md (`useContext` is banned).
let store: Signal<string> | null = null
let config: ThemeConfig = { storageKey: DEFAULT_KEY, defaultTheme: 'light', explicit: false }

function osPreference(fallback: string): string {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return fallback
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  return fallback
}

/**
 * The initial theme before anything is persisted. Precedence:
 * explicit `defaultTheme` (if the author passed one) > OS `prefers-color-scheme`
 * > `'light'`. An explicit default wins over OS so a "dark by default" (or custom
 * `'midnight'`) app is honored; OS only ever resolves to `'light'`/`'dark'`, so it
 * must not clobber a custom theme name.
 */
function initialDefault(): string {
  return config.explicit ? config.defaultTheme : osPreference(config.defaultTheme)
}

function themeStore(): Signal<string> {
  store ??= persistedSignal<string>(config.storageKey, initialDefault())
  return store
}

/**
 * Set the active theme imperatively, from anywhere. Persists the choice and
 * drives the `data-theme` attribute through the mounted {@link ThemeProvider}.
 */
export function setTheme(next: string): void {
  themeStore().value = next
}

/**
 * Read and set the active theme. The returned signal is reactive — a component
 * that reads `.value` re-renders when the theme changes (this hook calls
 * `useSignals()` for you, so it works in React apps with no Babel transform).
 *
 * ```tsx
 * const [theme, setTheme] = useTheme()
 * return <button onClick={() => setTheme(theme.value === 'dark' ? 'light' : 'dark')}>
 *   {theme.value}
 * </button>
 * ```
 */
export function useTheme(): readonly [Signal<string>, (next: string) => void] {
  useSignals()
  return [themeStore(), setTheme] as const
}

export interface ThemeProviderProps {
  /**
   * Theme to use when nothing is persisted yet. When set, it **wins over** the
   * visitor's OS `prefers-color-scheme` — pass it for a "dark by default" or
   * custom-theme (`'midnight'`, …) app. Omit it to follow the OS (light/dark),
   * falling back to `'light'`. Precedence: persisted value > `defaultTheme` (if
   * set) > OS preference > `'light'`.
   */
  defaultTheme?: string
  /**
   * Controlled theme. When set, the provider mirrors it on every render and the
   * persisted value is ignored — the parent owns the state (React semantics).
   */
  value?: string
  /** localStorage key for the persisted choice. Defaults to `cascivo-theme`. */
  storageKey?: string
  /** Attribute written to the target element. Defaults to `data-theme`. */
  attribute?: string
  /**
   * Element to theme. Omit to theme the whole document (`<html>`). Pass a ref to
   * a container to scope the theme to a subtree — cascivo themes resolve against
   * the nearest `data-theme`, so a scoped subtree can differ from the page.
   */
  target?: RefObject<HTMLElement | null>
  /** Called whenever the active theme changes. */
  onChange?: (theme: string) => void
  /**
   * CSP nonce forwarded to the inline attribute-setter script emitted for the
   * controlled ({@link ThemeProviderProps.value}) SSR flow. Set it to match your
   * Content-Security-Policy `script-src 'nonce-…'`.
   */
  nonce?: string
  children?: ReactNode
}

/**
 * Serialize a value for safe interpolation into an inline `<script>` body.
 * `JSON.stringify` handles quoting/escaping; escaping `<` additionally prevents a
 * `</script>` (or `<!--`) sequence in the value from breaking out of the element.
 */
function scriptSafe(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/**
 * Binds the active theme signal to a `data-theme` attribute and persists the
 * choice — the reusable, SSR-safe form of the wiring apps otherwise hand-roll.
 *
 * - No flash of the wrong theme: pair with {@link themePreloadScript} in your
 *   document `<head>` so the correct theme paints on first byte.
 * - No banned React hooks: the DOM write happens in `useSignalEffect`, not
 *   `useEffect`; there is no `useState`/`useContext`.
 * - Uncontrolled by default (persists to localStorage); pass `value` to control.
 * - SSR-safe when controlled: with a `value` (and no scoped `target`), the
 *   provider renders a tiny inline script that sets `data-theme` during HTML
 *   parsing, so the server-rendered first paint is themed — no flash, no
 *   hydration mismatch (the same markup renders on both sides; the client effect
 *   owns every update after hydration). For the uncontrolled/persisted flow, pair
 *   with {@link themePreloadScript} in `<head>` instead.
 */
export function ThemeProvider({
  defaultTheme,
  value,
  storageKey = DEFAULT_KEY,
  attribute = DEFAULT_ATTR,
  target,
  onChange,
  nonce,
  children,
}: ThemeProviderProps): ReactNode {
  // Configure the singleton on this provider's first render. Rebuild the store
  // only when the storage key changes — a single root provider (the 99% case)
  // configures exactly once; controlled re-renders never rebuild.
  const configured = useRef(false)
  if (!configured.current) {
    configured.current = true
    if (store === null || config.storageKey !== storageKey) {
      config = {
        storageKey,
        defaultTheme: defaultTheme ?? 'light',
        explicit: defaultTheme !== undefined,
      }
      store = null
    }
  }

  const theme = themeStore()

  // Controlled: mirror the prop into the signal each render (no-op if unchanged).
  if (value !== undefined) theme.value = value

  // Keep onChange current without an effect (the ref idiom from CLAUDE.md).
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useSignalEffect(() => {
    const next = theme.value
    const el = target
      ? target.current
      : typeof document !== 'undefined'
        ? document.documentElement
        : null
    el?.setAttribute(attribute, next)
    onChangeRef.current?.(next)
  })

  // Controlled + document-scoped: emit an inline setter so the attribute is
  // present during HTML parsing (server-rendered first paint) and on the client's
  // initial render alike. The browser runs it while parsing the SSR'd HTML; on
  // hydration React matches the existing node and does not re-run it, so there is
  // no mismatch. `target`-scoped providers can't be addressed before their ref
  // mounts, so they rely on the effect above (unchanged). Uncontrolled providers
  // use themePreloadScript() in <head>.
  if (value !== undefined && !target) {
    return (
      <>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute(${scriptSafe(attribute)},${scriptSafe(value)})`,
          }}
        />
        {children}
      </>
    )
  }

  return <>{children}</>
}

/**
 * A tiny script to inline in your document `<head>` (before the app bundle) so
 * the persisted theme paints on the first byte — no flash of the wrong theme on
 * SSR or a hard reload. Pass the same `storageKey`/`attribute`/`defaultTheme`
 * you give {@link ThemeProvider}.
 *
 * Precedence matches {@link ThemeProvider}: persisted value > `defaultTheme`
 * (if set) > OS `prefers-color-scheme` > `'light'`. Passing `defaultTheme`
 * suppresses the OS check, so a "dark by default" app stays dark on a light-OS
 * visitor.
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
  options: { storageKey?: string; attribute?: string; defaultTheme?: string } = {},
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
  return (
    `(function(){try{var v=${fallback};` +
    osBlock +
    `var raw=localStorage.getItem(${key});` +
    `if(raw){v=raw;try{var e=JSON.parse(raw);if(e&&typeof e==='object'&&'value'in e)v=e.value;}catch(_){}}` +
    `document.documentElement.setAttribute(${attr},v);}catch(_){}})();`
  )
}
