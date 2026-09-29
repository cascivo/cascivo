/**
 * Path patterns: `/`, `/settings`, `/c/:id`, `/files/*`. Shared by the router (which matches
 * `location.pathname`) and the API handler (which matches request URLs), so the two cannot
 * disagree about what a pattern means. No React, no DOM.
 */

type Segments<P extends string> = P extends `${infer Head}/${infer Tail}`
  ? Head | Segments<Tail>
  : P
type ParamName<S extends string> = S extends `:${infer Name}` ? Name : S extends '*' ? '*' : never

/**
 * The params a pattern declares: `PathParams<'/c/:id'>` is `{ id: string }`, and a trailing
 * `*` is `{ '*': string }`. A pattern without params gives `{}`.
 */
export type PathParams<P extends string> = { [K in ParamName<Segments<P>>]: string }

export interface CompiledPath {
  readonly pattern: string
  readonly keys: readonly string[]
  readonly regex: RegExp
  /** Per segment: 3 static, 2 param, 1 splat. Compared lexicographically, higher first. */
  readonly score: readonly number[]
}

/** `/a/b/` → `/a/b`, `a` → `/a`, `` → `/`. */
export function normalizePath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') || '/' : withSlash
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function compilePath(pattern: string): CompiledPath {
  const segments = normalizePath(pattern).split('/').filter(Boolean)
  const keys: string[] = []
  const score: number[] = []
  let source = ''
  segments.forEach((segment, i) => {
    if (segment === '*') {
      if (i !== segments.length - 1) {
        throw new Error(`"*" must be the last segment of a path pattern: "${pattern}"`)
      }
      keys.push('*')
      score.push(1)
      // The splat may be empty, so `/files/*` also matches `/files`.
      source += '(?:/(.*))?'
    } else if (segment.startsWith(':')) {
      const name = segment.slice(1)
      if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
        throw new Error(`Invalid param name "${name}" in path pattern "${pattern}"`)
      }
      keys.push(name)
      score.push(2)
      source += '/([^/]+)'
    } else {
      score.push(3)
      source += `/${escapeRegex(segment)}`
    }
  })
  return { pattern, keys, regex: new RegExp(`^${source || '/'}/?$`), score }
}

/** The decoded params of `pathname` against `compiled`, or `null` if it does not match. */
export function matchPath(compiled: CompiledPath, pathname: string): Record<string, string> | null {
  const found = compiled.regex.exec(normalizePath(pathname))
  if (!found) return null
  const params: Record<string, string> = {}
  try {
    compiled.keys.forEach((key, i) => {
      const raw = found[i + 1] ?? ''
      params[key] =
        key === '*' ? raw.split('/').map(decodeURIComponent).join('/') : decodeURIComponent(raw)
    })
  } catch {
    // A malformed escape (`/c/%E0`) is not a match for anything.
    return null
  }
  return params
}

/** Orders patterns most specific first: `/c/new` before `/c/:id` before `/c/*`. */
export function compareSpecificity(a: CompiledPath, b: CompiledPath): number {
  const length = Math.max(a.score.length, b.score.length)
  for (let i = 0; i < length; i++) {
    const diff = (b.score[i] ?? 0) - (a.score[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Fills a pattern's params, encoding each one: `buildPath('/c/:id', { id: 'a b' })` is
 * `/c/a%20b`. Typed, so a missing or misspelled param is a compile error.
 */
export function buildPath<P extends string>(pattern: P, params: PathParams<P>): string {
  const values = params as Record<string, string>
  const segments = normalizePath(pattern)
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (segment === '*') return (values['*'] ?? '').split('/').map(encodeURIComponent).join('/')
      if (segment.startsWith(':')) {
        const value = values[segment.slice(1)]
        if (value === undefined)
          throw new Error(`Missing param "${segment.slice(1)}" for "${pattern}"`)
        return encodeURIComponent(value)
      }
      return segment
    })
    .filter((segment) => segment !== '')
  return `/${segments.join('/')}`
}
