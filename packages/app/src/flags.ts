/**
 * Feature flags for a client app whose flags are evaluated in its Worker.
 *
 * One definition is shared by both sides, like `defineApi`: the Worker evaluates it against
 * its flag service (Cloudflare Flagship's binding, or anything with the same four getters),
 * and the browser parses what arrives. Every flag's default is also its type — the value it
 * falls back to when evaluation fails, and the shape an evaluated value is checked against.
 */

/** An object-valued flag: its default, and the parser its evaluated value must pass. */
export interface ObjectFlag<T extends object> {
  readonly kind: 'object'
  readonly default: T
  readonly parse: (raw: unknown) => T
}

export type FlagDefault = boolean | string | number | ObjectFlag<object>

export type FlagValues<D extends Record<string, FlagDefault>> = {
  [K in keyof D]: D[K] extends ObjectFlag<infer T>
    ? T
    : D[K] extends boolean
      ? boolean
      : D[K] extends string
        ? string
        : number
}

/** Targeting attributes: a user id, a country, a plan. */
export type FlagContext = Record<string, string | number | boolean>

/**
 * What evaluates flags in the Worker. Cloudflare Flagship's binding (`env.FLAGS`) has this
 * shape, as do OpenFeature-style clients; typed by shape so this package needs neither.
 */
export interface FlagEvaluator {
  getBooleanValue(key: string, defaultValue: boolean, context?: FlagContext): Promise<boolean>
  getStringValue(key: string, defaultValue: string, context?: FlagContext): Promise<string>
  getNumberValue(key: string, defaultValue: number, context?: FlagContext): Promise<number>
  getObjectValue<T extends object>(key: string, defaultValue: T, context?: FlagContext): Promise<T>
}

export interface Flags<D extends Record<string, FlagDefault>> {
  /** Every flag at its default: the value to render before evaluated flags arrive. */
  readonly defaults: FlagValues<D>
  /**
   * Checks evaluated flags that crossed the network. A flag that is missing or has the wrong
   * type falls back to its default (with a warning), so one bad flag never breaks the app.
   * Use it as an endpoint's `output` parser.
   */
  parse(raw: unknown): FlagValues<D>
  /** Evaluates every flag in the Worker. A flag that fails to evaluate keeps its default. */
  evaluate(evaluator: FlagEvaluator, context?: FlagContext): Promise<FlagValues<D>>
}

/** Declares an object-valued flag, e.g. a theme experiment, with the parser its value must pass. */
export function objectFlag<T extends object>(
  defaultValue: T,
  parse: (raw: unknown) => T,
): ObjectFlag<T> {
  return { kind: 'object', default: defaultValue, parse }
}

function isObjectFlag(value: FlagDefault): value is ObjectFlag<object> {
  return typeof value === 'object'
}

function defaultOf(value: FlagDefault): unknown {
  return isObjectFlag(value) ? value.default : value
}

export function defineFlags<const D extends Record<string, FlagDefault>>(definition: D): Flags<D> {
  const keys = Object.keys(definition) as (keyof D & string)[]
  const defaults = Object.fromEntries(keys.map((k) => [k, defaultOf(definition[k]!)]))

  /** One flag's value, or its default when `raw` is not that flag's type. */
  function check(key: string, raw: unknown): unknown {
    const flag = definition[key]!
    if (isObjectFlag(flag)) {
      try {
        return flag.parse(raw)
      } catch (error) {
        console.warn(`Flag "${key}" is malformed; using its default.`, error)
        return flag.default
      }
    }
    if (typeof raw === typeof flag) return raw
    if (raw !== undefined) console.warn(`Flag "${key}" is not a ${typeof flag}; using its default.`)
    return flag
  }

  return {
    defaults: defaults as FlagValues<D>,
    parse(raw) {
      const record = typeof raw === 'object' && raw !== null ? raw : {}
      // Each value has passed its flag's own check, so the assembled object is the type.
      return Object.fromEntries(
        keys.map((k) => [k, check(k, (record as Record<string, unknown>)[k])]),
      ) as FlagValues<D>
    },
    async evaluate(evaluator, context) {
      const entries = await Promise.all(
        keys.map(async (key) => {
          const flag = definition[key]!
          try {
            const value = isObjectFlag(flag)
              ? await evaluator.getObjectValue(key, flag.default, context)
              : typeof flag === 'boolean'
                ? await evaluator.getBooleanValue(key, flag, context)
                : typeof flag === 'string'
                  ? await evaluator.getStringValue(key, flag, context)
                  : await evaluator.getNumberValue(key, flag, context)
            return [key, check(key, value)] as const
          } catch (error) {
            console.warn(`Flag "${key}" failed to evaluate; using its default.`, error)
            return [key, defaultOf(flag)] as const
          }
        }),
      )
      return Object.fromEntries(entries) as FlagValues<D>
    },
  }
}

/**
 * A theme experiment: which `data-theme` to use and which `--cascivo-*` tokens to override.
 * `theme: null` keeps the page's own theme.
 */
export interface ThemeOverride {
  theme: string | null
  tokens: Record<string, string>
}

const THEME_NAME = /^[a-z][a-z0-9-]{0,63}$/
const TOKEN_NAME = /^--cascivo-[a-z0-9-]{1,96}$/
// A token value is a color, a length, a var() and the like. Braces, semicolons and angle
// brackets never belong in one, and url() would let a flag make every visitor fetch an
// arbitrary host.
const UNSAFE_VALUE = /[;{}<>\\]|url\(|expression\(|@import/i

/**
 * Parses a theme override from a flag service. Throws on anything outside the shape — a
 * theme name that is not a plain identifier, a property outside `--cascivo-*`, or a value
 * that could escape a declaration — so the flag falls back to its default instead.
 */
export function parseThemeOverride(raw: unknown): ThemeOverride {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('A theme override is an object: { theme?, tokens? }')
  }
  const { theme, tokens } = raw as Record<string, unknown>
  if (
    theme !== undefined &&
    theme !== null &&
    (typeof theme !== 'string' || !THEME_NAME.test(theme))
  ) {
    throw new Error(`Theme "${String(theme)}" is not a theme name`)
  }
  const out: Record<string, string> = {}
  if (tokens !== undefined) {
    if (typeof tokens !== 'object' || tokens === null || Array.isArray(tokens)) {
      throw new Error('tokens is an object of --cascivo-* properties')
    }
    for (const [name, value] of Object.entries(tokens)) {
      if (!TOKEN_NAME.test(name)) throw new Error(`"${name}" is not a --cascivo-* token`)
      if (typeof value !== 'string' || value.length > 200 || UNSAFE_VALUE.test(value)) {
        throw new Error(`The value for ${name} is not a plain CSS value`)
      }
      out[name] = value
    }
  }
  return { theme: typeof theme === 'string' ? theme : null, tokens: out }
}

/** The theme override that changes nothing. */
export const NO_THEME_OVERRIDE: ThemeOverride = Object.freeze({ theme: null, tokens: {} })

/** An object flag holding a theme experiment; its default changes nothing. */
export function themeFlag(): ObjectFlag<ThemeOverride> {
  return objectFlag(NO_THEME_OVERRIDE, parseThemeOverride)
}

/**
 * What `applyThemeOverride` touches. Every `HTMLElement` is one; typed by shape so this module
 * compiles in a Worker, where it evaluates flags, without the DOM's types.
 */
export interface ThemeTarget {
  getAttribute(name: string): string | null
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
  readonly style: {
    getPropertyValue(name: string): string
    setProperty(name: string, value: string): void
    removeProperty(name: string): string
  }
}

/**
 * Applies a theme override to an element (usually `document.documentElement`) and returns a
 * function that undoes it — call that before applying the next one.
 */
export function applyThemeOverride(element: ThemeTarget, override: ThemeOverride): () => void {
  const previousTheme = element.getAttribute('data-theme')
  const previousTokens = Object.keys(override.tokens).map(
    (name) => [name, element.style.getPropertyValue(name)] as const,
  )
  if (override.theme) element.setAttribute('data-theme', override.theme)
  for (const [name, value] of Object.entries(override.tokens))
    element.style.setProperty(name, value)
  return () => {
    if (override.theme) {
      if (previousTheme === null) element.removeAttribute('data-theme')
      else element.setAttribute('data-theme', previousTheme)
    }
    for (const [name, value] of previousTokens) {
      if (value) element.style.setProperty(name, value)
      else element.style.removeProperty(name)
    }
  }
}
