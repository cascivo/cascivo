import type { PropPrimitive, PropSchema, ShapeSchema } from './prop-schemas'

// Shared by the view validator and any second renderer. Must stay React-free: `./validate`
// re-exports through this file and has to run in a Worker.

export interface ValidationError {
  path: string
  message: string
}

/**
 * Props that hold a URL the browser will follow or load, at any depth (`Header.links[].href`
 * too). React 19 blocks `javascript:` URLs; Preact writes them to the DOM as given, so a view
 * that crossed the network — a model's, or one a user published — must not carry one.
 */
export const URL_KEYS = new Set([
  'href',
  'src',
  'fallbackSrc',
  'skipToContentHref',
  'formAction',
  'poster',
])
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])

/** A relative URL, or one whose scheme cannot run script or smuggle a document. */
export function isSafeUrl(url: string): boolean {
  // Browsers drop ASCII whitespace and control characters inside a scheme ("java\tscript:").
  let compact = ''
  for (const char of url) {
    const code = char.charCodeAt(0)
    if (code > 0x20 && code !== 0x7f) compact += char
  }
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)
  return scheme === null || SAFE_SCHEMES.has(scheme[1]!.toLowerCase())
}

/** Reports every URL-carrying string under `value` whose scheme is not safe. */
export function checkUrls(
  value: unknown,
  key: string,
  path: string,
  errors: ValidationError[],
): void {
  if (typeof value === 'string') {
    if (URL_KEYS.has(key) && !isSafeUrl(value)) {
      errors.push({
        path,
        message: `Unsafe URL for "${key}" — use http(s), mailto, tel or a relative URL.`,
      })
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => checkUrls(item, key, `${path}[${i}]`, errors))
  } else if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) checkUrls(v, k, `${path}.${k}`, errors)
  }
}

/** A TranslationRef ({ $t }) resolves to a string at render time — accepted for any prop. */
function hasTranslationRef(value: unknown): boolean {
  return typeof value === 'object' && value !== null && '$t' in value
}

export function primitiveOf(value: unknown): PropPrimitive | 'object' {
  if (value === null) return 'null'
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') return t
  return 'object'
}

const typeOf = (value: unknown): string =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

/** The field that tells an object branch apart: a single-value field, else the first required one. */
function objectDiscriminator(shape: ShapeSchema): string | undefined {
  const properties = shape['properties']
  if (typeof properties === 'object' && properties !== null) {
    for (const [field, sub] of Object.entries(properties as Record<string, ShapeSchema>)) {
      const only = 'const' in sub ? [sub['const']] : sub['enum']
      if (Array.isArray(only) && only.length === 1) return `${field}: ${JSON.stringify(only[0])}`
    }
  }
  const required = shape['required']
  return Array.isArray(required) && typeof required[0] === 'string' ? required[0] : undefined
}

/** Short name of what a shape expects, for an anyOf error. */
function describeShape(shape: ShapeSchema): string {
  const { enum: values, type } = shape
  if (Array.isArray(values)) return values.map((v) => JSON.stringify(v)).join(' | ')
  if (type === 'object') {
    // "object or object" says nothing; name what each branch needs.
    const key = objectDiscriminator(shape)
    return key ? `object with ${key}` : 'object'
  }
  if (typeof type === 'string') return type
  return 'anyOf' in shape ? 'a union' : 'any'
}

/** JSON for an error message, cut short so a large payload is not repeated in every error. */
function preview(value: unknown): string {
  const json = JSON.stringify(value) ?? 'undefined'
  return json.length > 80 ? `${json.slice(0, 80)}…` : json
}

/**
 * Check `value` against the JSON Schema subset the generator emits (type, enum, properties,
 * required, additionalProperties:false, items, anyOf); other keywords are ignored. `path` is
 * the error path, `label` the prop name with its index/field suffix for the message.
 */
export function checkShape(
  value: unknown,
  shape: ShapeSchema,
  path: string,
  errors: ValidationError[],
  label: string,
): void {
  const fail = (reason: string) =>
    errors.push({
      path,
      message: `Invalid value ${preview(value)} for "${label}" — ${reason}.`,
    })

  const branches = shape['anyOf']
  if (Array.isArray(branches)) {
    const passes = branches.some((branch) => {
      const trial: ValidationError[] = []
      checkShape(value, branch as ShapeSchema, path, trial, label)
      return trial.length === 0
    })
    if (!passes) {
      fail(`expected ${branches.map((b) => describeShape(b as ShapeSchema)).join(' or ')}`)
    }
    return
  }

  const values = shape['enum']
  if (Array.isArray(values) && !values.includes(value)) {
    fail(`expected one of: ${values.join(', ')}`)
    return
  }

  switch (shape['type']) {
    case 'null':
      if (value !== null) fail(`expected null, got ${typeOf(value)}`)
      break
    case 'string':
      // A TranslationRef resolves to a string at render time.
      if (typeof value !== 'string' && !hasTranslationRef(value)) {
        fail(`expected string, got ${typeOf(value)}`)
      }
      break
    case 'number':
    case 'boolean':
      if (typeof value !== shape['type']) fail(`expected ${shape['type']}, got ${typeOf(value)}`)
      break
    case 'array': {
      if (!Array.isArray(value)) {
        fail(`expected array, got ${typeOf(value)}`)
        return
      }
      const items = shape['items']
      if (typeof items === 'object' && items !== null) {
        value.forEach((item, i) =>
          checkShape(item, items as ShapeSchema, `${path}[${i}]`, errors, `${label}[${i}]`),
        )
      }
      break
    }
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        fail(`expected object, got ${typeOf(value)}`)
        return
      }
      const record = value as Record<string, unknown>
      const properties = (shape['properties'] ?? {}) as Record<string, ShapeSchema>
      const required = Array.isArray(shape['required']) ? (shape['required'] as string[]) : []
      for (const field of required) {
        if (!Object.hasOwn(record, field)) {
          errors.push({
            path: `${path}.${field}`,
            message: `Missing required field "${field}" for "${label}".`,
          })
        }
      }
      for (const [field, fieldValue] of Object.entries(record)) {
        const sub = Object.hasOwn(properties, field) ? properties[field] : undefined
        if (sub) checkShape(fieldValue, sub, `${path}.${field}`, errors, `${label}.${field}`)
        else if (shape['additionalProperties'] === false) {
          errors.push({
            path: `${path}.${field}`,
            message: `Unknown field "${field}" for "${label}".`,
          })
        }
      }
      break
    }
  }
}

/**
 * Check one prop value against its manifest entry: shape, else enum, else primitive type.
 * `label` names the prop in messages; `path` locates it.
 */
export function checkPropValue(
  prop: PropSchema,
  value: unknown,
  path: string,
  label: string,
  errors: ValidationError[],
): void {
  if (hasTranslationRef(value)) return
  if (prop.shape) {
    checkShape(value, prop.shape, path, errors, label)
  } else if (prop.enum) {
    if (typeof value !== 'string' || !prop.enum.includes(value)) {
      errors.push({
        path,
        message: `Invalid value ${JSON.stringify(value)} for "${label}" — expected one of: ${prop.enum.join(', ')}.`,
      })
    }
  } else if (prop.primitives) {
    const actual = primitiveOf(value)
    if (actual === 'object' || !prop.primitives.includes(actual)) {
      errors.push({
        path,
        message: `Invalid type for "${label}" — expected ${prop.primitives.join(' | ')}, got ${actual}.`,
      })
    }
  }
}

/** Levenshtein distance (≤ 2 cutoff for suggestions). */
export function closestName(name: string, candidates: string[]): string | undefined {
  const target = name.toLowerCase()
  let best: string | undefined
  let bestDist = 3
  for (const candidate of candidates) {
    const dist = levenshtein(target, candidate.toLowerCase())
    if (dist < bestDist) {
      bestDist = dist
      best = candidate
    }
  }
  return best
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
    }
  }
  return dp[m]![n]!
}
