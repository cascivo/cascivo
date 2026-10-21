import { currentLocale } from '@cascivo/i18n'
import { isSafeUrl } from '../prop-check'
import { isBinding, isFunctionCall } from './catalog-spec'
import type { DataModel } from './data-model'
import { errorMessage, isRecord } from './messages'
import type { A2uiErrorMessage } from './messages'
import { A2uiPathError, resolvePath } from './pointer'

export interface ResolveContext {
  data: DataModel
  /** Template scope that relative paths resolve against; '' outside a template. */
  scope: string
  /** '' means the app's current locale. */
  locale: string
  openUrl: (url: string) => void
  report: (e: A2uiErrorMessage) => void
  surfaceId: string
  /** Internal, for deterministic tests; adopters leave it unset (runtime local zone). */
  timeZone?: string
}

export const BASIC_FUNCTIONS: readonly string[] = [
  'required',
  'regex',
  'length',
  'numeric',
  'email',
  'formatString',
  'formatNumber',
  'formatCurrency',
  'formatDate',
  'pluralize',
  'openUrl',
  'and',
  'or',
  'not',
]

const MAX_DEPTH = 16
const MAX_REGEX_PATTERN = 256
const MAX_REGEX_INPUT = 10_000

// ---- Regex safety -------------------------------------------------------------------------

/**
 * JS has no linear-time regex engine, so the shapes that backtrack exponentially are refused
 * before they run: backreferences, and a group holding a quantifier or an alternation that is
 * itself repeated. Conservative on purpose (`(a|b)+` is refused too).
 */
export function isSafeRegexPattern(pattern: string): boolean {
  if (pattern.length > MAX_REGEX_PATTERN) return false
  // One flag per open group: does it contain a quantifier or an alternation?
  const stack: boolean[] = []
  let inClass = false
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!
    if (ch === '\\') {
      const next = pattern[i + 1]
      if (!inClass && next !== undefined && ((next >= '1' && next <= '9') || next === 'k')) {
        if (next !== 'k' || pattern[i + 2] === '<') return false
      }
      i++
      continue
    }
    if (inClass) {
      if (ch === ']') inClass = false
      continue
    }
    if (ch === '[') inClass = true
    else if (ch === '(') stack.push(false)
    else if (ch === '+' || ch === '*' || ch === '{' || ch === '|') {
      if (stack.length > 0) stack[stack.length - 1] = true
    } else if (ch === ')') {
      const holds = stack.pop() ?? false
      if (holds) {
        const after = pattern[i + 1]
        if (after === '+' || after === '*' || after === '{') return false
        if (stack.length > 0) stack[stack.length - 1] = true
      }
    }
  }
  return true
}

// WHATWG `input[type=email]` valid e-mail address.
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// ---- Formatting helpers -------------------------------------------------------------------

const localeOf = (ctx: ResolveContext): string => (ctx.locale === '' ? currentLocale() : ctx.locale)

function toNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}

const optInt = (v: unknown): number | undefined => {
  const n = toNumber(v)
  return n === undefined ? undefined : Math.min(20, Math.max(0, Math.trunc(n)))
}

function formatNumeric(
  args: Readonly<Record<string, unknown>>,
  ctx: ResolveContext,
  money: boolean,
) {
  const n = toNumber(args['value'])
  if (n === undefined) return ''
  const decimals = optInt(args['decimals'])
  const currency = args['currency']
  try {
    return new Intl.NumberFormat(localeOf(ctx), {
      ...(money
        ? { style: 'currency' as const, currency: typeof currency === 'string' ? currency : '' }
        : {}),
      ...(decimals === undefined
        ? {}
        : { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
      useGrouping: args['grouping'] !== false,
    }).format(n)
  } catch {
    return String(n)
  }
}

function formatDate(value: unknown, format: string, ctx: ResolveContext): string {
  const date =
    value instanceof Date ? value : new Date(typeof value === 'number' ? value : String(value))
  if (Number.isNaN(date.getTime())) return ''
  const locale = localeOf(ctx)
  const tz = ctx.timeZone === undefined ? {} : { timeZone: ctx.timeZone }
  try {
    const part = (opts: Intl.DateTimeFormatOptions, type: string, nu = false): string =>
      new Intl.DateTimeFormat(locale, {
        ...tz,
        ...opts,
        ...(nu ? { numberingSystem: 'latn' } : {}),
      })
        .formatToParts(date)
        .find((p) => p.type === type)?.value ?? ''
    const num = (opts: Intl.DateTimeFormatOptions, type: string): number =>
      Number(part({ ...opts, hourCycle: 'h23' }, type, true))
    const year = num({ year: 'numeric' }, 'year')
    const month = num({ month: 'numeric' }, 'month')
    const day = num({ day: 'numeric' }, 'day')
    const hour = num({ hour: 'numeric' }, 'hour')
    const minute = num({ minute: 'numeric' }, 'minute')
    const second = num({ second: 'numeric' }, 'second')
    const pad = (n: number) => String(n).padStart(2, '0')
    const h12 = hour % 12 === 0 ? 12 : hour % 12

    const token = (letter: string, count: number): string | undefined => {
      const key = letter.repeat(count)
      switch (key) {
        case 'yy':
          return pad(year % 100)
        case 'yyyy':
          return String(year).padStart(4, '0')
        case 'M':
          return String(month)
        case 'MM':
          return pad(month)
        case 'MMM':
          return part({ month: 'short' }, 'month')
        case 'MMMM':
          return part({ month: 'long' }, 'month')
        case 'd':
          return String(day)
        case 'dd':
          return pad(day)
        case 'E':
          return part({ weekday: 'short' }, 'weekday')
        case 'EEEE':
          return part({ weekday: 'long' }, 'weekday')
        case 'h':
          return String(h12)
        case 'hh':
          return pad(h12)
        case 'H':
          return String(hour)
        case 'HH':
          return pad(hour)
        case 'mm':
          return pad(minute)
        case 'ss':
          return pad(second)
        case 'a':
          return part({ hour: 'numeric', hour12: true }, 'dayPeriod')
        default:
          return undefined
      }
    }

    let out = ''
    for (let i = 0; i < format.length;) {
      const ch = format[i]!
      if (ch === "'") {
        if (format[i + 1] === "'") {
          out += "'"
          i += 2
          continue
        }
        let j = i + 1
        while (j < format.length) {
          if (format[j] === "'") {
            if (format[j + 1] === "'") {
              out += "'"
              j += 2
              continue
            }
            break
          }
          out += format[j]
          j++
        }
        i = j + 1
        continue
      }
      if (/[A-Za-z]/.test(ch)) {
        let j = i
        while (format[j] === ch) j++
        out += token(ch, j - i) ?? format.slice(i, j)
        i = j
        continue
      }
      out += ch
      i++
    }
    return out
  } catch {
    return ''
  }
}

// ---- Function dispatch --------------------------------------------------------------------

const bool = (v: unknown): boolean => v === true

export function callFunction(
  call: string,
  args: Readonly<Record<string, unknown>>,
  ctx: ResolveContext,
): unknown {
  const invalid = (message: string, name: string): void =>
    ctx.report(errorMessage('VALIDATION_FAILED', ctx.surfaceId, message, `/args/${name}`))

  switch (call) {
    case 'required': {
      const v = args['value']
      return !(v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0))
    }
    case 'regex': {
      const { value, pattern } = args
      if (typeof pattern !== 'string' || !isSafeRegexPattern(pattern)) {
        invalid(
          'Regex pattern is missing or unsafe (too long, backreference or nested quantifier).',
          'pattern',
        )
        return false
      }
      if (typeof value !== 'string') return false
      if (value.length > MAX_REGEX_INPUT) {
        invalid(`Regex input exceeds ${MAX_REGEX_INPUT} characters.`, 'value')
        return false
      }
      try {
        return new RegExp(pattern, 'u').test(value)
      } catch {
        invalid('Regex pattern is invalid.', 'pattern')
        return false
      }
    }
    case 'length': {
      const { value } = args
      const min = toNumber(args['min'])
      const max = toNumber(args['max'])
      if (typeof value !== 'string' || (min === undefined && max === undefined)) return false
      return (
        (min === undefined || value.length >= min) && (max === undefined || value.length <= max)
      )
    }
    case 'numeric': {
      const value = args['value']
      if (typeof value !== 'number' || !Number.isFinite(value)) return false
      const min = toNumber(args['min'])
      const max = toNumber(args['max'])
      return (min === undefined || value >= min) && (max === undefined || value <= max)
    }
    case 'email': {
      const value = args['value']
      return typeof value === 'string' && value.length <= 254 && EMAIL.test(value)
    }
    case 'and': {
      const values = args['values']
      return Array.isArray(values) && values.length > 0 && values.every(bool)
    }
    case 'or': {
      const values = args['values']
      return Array.isArray(values) && values.some(bool)
    }
    case 'not':
      return args['value'] !== true
    case 'formatString': {
      const value = args['value']
      return typeof value === 'string' ? formatString(value, ctx) : ''
    }
    case 'formatNumber':
      return formatNumeric(args, ctx, false)
    case 'formatCurrency':
      return formatNumeric(args, ctx, true)
    case 'formatDate': {
      const format = args['format']
      return formatDate(args['value'], typeof format === 'string' ? format : 'yyyy-MM-dd', ctx)
    }
    case 'pluralize': {
      const other = args['other']
      if (typeof other !== 'string') {
        invalid('pluralize requires an "other" form.', 'other')
        return ''
      }
      const n = toNumber(args['value'])
      if (n === undefined) return other
      let category = 'other'
      try {
        category = new Intl.PluralRules(localeOf(ctx)).select(n)
      } catch {
        // An unknown locale falls back to the `other` form.
      }
      const form = category === 'other' ? undefined : args[category]
      return typeof form === 'string' ? form : other
    }
    case 'openUrl': {
      const url = args['url']
      if (typeof url === 'string' && isSafeUrl(url)) ctx.openUrl(url)
      else invalid('openUrl refused a missing or unsafe URL.', 'url')
      return undefined
    }
    default:
      ctx.report(errorMessage('UNKNOWN_FUNCTION', ctx.surfaceId, `Unknown function "${call}".`))
      return undefined
  }
}

// ---- Dynamic values -----------------------------------------------------------------------

function resolveAt(value: unknown, ctx: ResolveContext, depth: number): unknown {
  if (isBinding(value) && isRecord(value)) {
    const path = value['path'] as string
    try {
      return ctx.data.read(resolvePath(path, ctx.scope)).value
    } catch (e) {
      if (e instanceof A2uiPathError) {
        ctx.report(errorMessage('INVALID_PATH', ctx.surfaceId, e.message, path))
        return undefined
      }
      throw e
    }
  }
  if (isFunctionCall(value) && isRecord(value)) {
    if (depth >= MAX_DEPTH) {
      ctx.report(
        errorMessage('VALIDATION_FAILED', ctx.surfaceId, 'Function calls nest too deeply.'),
      )
      return undefined
    }
    const raw = isRecord(value['args']) ? value['args'] : {}
    const args: Record<string, unknown> = {}
    // `and`/`or` take an array of dynamic values, so arrays resolve element-wise.
    for (const [k, v] of Object.entries(raw)) {
      args[k] = Array.isArray(v)
        ? v.map((x) => resolveAt(x, ctx, depth + 1))
        : resolveAt(v, ctx, depth + 1)
    }
    return callFunction(value['call'] as string, args, ctx)
  }
  return value
}

export function resolveDynamic(value: unknown, ctx: ResolveContext): unknown {
  return resolveAt(value, ctx, 0)
}

// ---- formatString -------------------------------------------------------------------------

type Parsed = { value: unknown; end: number }

const isIdent = (c: string | undefined): boolean => c !== undefined && /[A-Za-z0-9_]/.test(c)
const skipWs = (s: string, i: number): number => {
  while (s[i] === ' ' || s[i] === '\t' || s[i] === '\n') i++
  return i
}

/** Parses the inside of `${…}` starting after the opener; `end` is past the closing brace. */
function parseInterpolation(
  s: string,
  start: number,
  ctx: ResolveContext,
  depth: number,
): Parsed | null {
  if (depth > 8) return null
  let i = skipWs(s, start)
  let j = i
  while (j < s.length && s[j] !== '}' && s[j] !== '(') j++
  if (j >= s.length) return null

  if (s[j] === '}') {
    const path = s.slice(i, j).trim()
    return { value: resolveDynamic({ path }, ctx), end: j + 1 }
  }

  const name = s.slice(i, j).trim()
  if (name === '' || ![...name].every(isIdent)) return null
  const args: Record<string, unknown> = {}
  i = j + 1
  for (;;) {
    i = skipWs(s, i)
    if (s[i] === ')') {
      i++
      break
    }
    let k = i
    while (isIdent(s[k])) k++
    if (k === i) return null
    const key = s.slice(i, k)
    k = skipWs(s, k)
    if (s[k] !== ':') return null
    k = skipWs(s, k + 1)
    const arg = parseArg(s, k, ctx, depth)
    if (arg === null) return null
    args[key] = arg.value
    i = skipWs(s, arg.end)
    if (s[i] === ',') i++
    else if (s[i] !== ')') return null
  }
  i = skipWs(s, i)
  if (s[i] !== '}') return null
  return { value: callFunction(name, args, ctx), end: i + 1 }
}

function parseArg(s: string, i: number, ctx: ResolveContext, depth: number): Parsed | null {
  const ch = s[i]
  if (ch === '$' && s[i + 1] === '{') return parseInterpolation(s, i + 2, ctx, depth + 1)
  if (ch === "'" || ch === '"') {
    let out = ''
    for (let j = i + 1; j < s.length; j++) {
      const c = s[j]!
      if (c === '\\' && j + 1 < s.length) {
        out += s[j + 1]
        j++
      } else if (c === ch) return { value: out, end: j + 1 }
      else out += c
    }
    return null
  }
  let j = i
  while (j < s.length && s[j] !== ',' && s[j] !== ')') j++
  if (j >= s.length) return null
  const word = s.slice(i, j).trim()
  if (word === 'true') return { value: true, end: j }
  if (word === 'false') return { value: false, end: j }
  const n = Number(word)
  return word !== '' && Number.isFinite(n) ? { value: n, end: j } : null
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v)
    } catch {
      return ''
    }
  }
  return String(v)
}

/** Hand-written scanner: agent text never reaches eval, Function or a backtracking parser. */
export function formatString(template: string, ctx: ResolveContext): string {
  let out = ''
  let i = 0
  while (i < template.length) {
    if (template[i] === '\\' && template[i + 1] === '$' && template[i + 2] === '{') {
      out += '${'
      i += 3
    } else if (template[i] === '$' && template[i + 1] === '{') {
      const parsed = parseInterpolation(template, i + 2, ctx, 0)
      if (parsed === null) {
        out += '${'
        i += 2
      } else {
        out += stringify(parsed.value)
        i = parsed.end
      }
    } else {
      out += template[i]
      i++
    }
  }
  return out
}
