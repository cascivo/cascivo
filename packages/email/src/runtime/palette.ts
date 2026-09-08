/**
 * The theme a render is currently using.
 *
 * Email primitives need theme colours, and none of the usual mechanisms fit. React context
 * is out (`useContext` is forbidden across this codebase, and a hook would stop these
 * components working outside a React renderer). Threading a `theme` prop through twenty
 * components would put it on every call site for no benefit — an email is rendered in
 * exactly one theme, decided once at the top.
 *
 * So the palette is a synchronously-scoped module binding. This is safe *because* email
 * rendering is synchronous end to end: `renderToStaticMarkup` cannot yield, so two renders
 * can never interleave on one thread. `withPalette` restores the previous binding in a
 * `finally`, so a throwing render cannot leak its theme into the next one.
 *
 * The payoff is that every primitive is a plain function with no hooks at all — usable from
 * a React Server Component, under any React version, and portable off React entirely.
 */
import { PALETTES, type EmailTheme } from '../tokens/palettes.generated.ts'
import type { Palette } from '../tokens/resolve.ts'

let current: Palette | null = null

/** Run `render` with `palette` bound. Restores the previous binding, exceptions included. */
export function withPalette<T>(palette: Palette | EmailTheme, render: () => T): T {
  const previous = current
  current = typeof palette === 'string' ? (PALETTES[palette] as Palette) : palette
  try {
    return render()
  } finally {
    current = previous
  }
}

/**
 * The palette in scope.
 *
 * Throws outside a render rather than falling back to light: a silent default would ship a
 * light-theme email to someone who asked for dark, and the failure would only be visible in
 * an inbox.
 */
export function palette(): Palette {
  if (!current) {
    throw new Error(
      'No palette in scope. Email primitives must be rendered inside renderEmail() or withPalette().',
    )
  }
  return current
}

/**
 * Read one token, resolved to a literal.
 *
 * `fallback` covers tokens a theme legitimately may not define. A missing token with no
 * fallback throws, because the alternative is an empty CSS value that silently drops the
 * declaration.
 */
export function token(name: string, fallback?: string): string {
  const value = palette()[name] ?? fallback
  if (value === undefined) throw new Error(`Token ${name} is not defined in this theme`)
  return value
}
