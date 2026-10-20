import type { ComponentNode } from './types'
import { componentNames } from './component-names'
import { propSchemas, type PropPrimitive, type PropSchema, type ShapeSchema } from './prop-schemas'

export interface ValidationError {
  path: string
  message: string
}

const DATA_REF_RE = /^\$data\./
const STATE_REF_RE = /^\$state\./
const ACTION_REF_RE = /^\$actions\./
const STATE_SET_RE = /^\$state\.set\./
const STATE_TOGGLE_RE = /^\$state\.toggle\./

/**
 * Props that hold a URL the browser will follow or load, at any depth (`Header.links[].href`
 * too). React 19 blocks `javascript:` URLs; Preact writes them to the DOM as given, so a view
 * that crossed the network — a model's, or one a user published — must not carry one.
 */
const URL_KEYS = new Set([
  'href',
  'src',
  'fallbackSrc',
  'skipToContentHref',
  'formAction',
  'poster',
])
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])

/** A relative URL, or one whose scheme cannot run script or smuggle a document. */
function isSafeUrl(url: string): boolean {
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
function checkUrls(value: unknown, key: string, path: string, errors: ValidationError[]): void {
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

/** Declared view-local state: the set of keys and the subset with boolean initial values. */
interface StateInfo {
  keys: Set<string>
  booleans: Set<string>
}

/** A TranslationRef ({ $t }) resolves to a string at render time — accepted for any prop. */
function isTranslationRef(value: unknown): boolean {
  return typeof value === 'object' && value !== null && '$t' in value
}

function primitiveOf(value: unknown): PropPrimitive | 'object' {
  if (value === null) return 'null'
  const t = typeof value
  if (t === 'string' || t === 'number' || t === 'boolean') return t
  return 'object'
}

const typeOf = (value: unknown): string =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

/** Short name of what a shape expects, for an anyOf error. */
function describeShape(shape: ShapeSchema): string {
  const { enum: values, type } = shape
  if (Array.isArray(values)) return values.map((v) => JSON.stringify(v)).join(' | ')
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
function checkShape(
  value: unknown,
  shape: ShapeSchema,
  path: string,
  errors: ValidationError[],
  label: string = path.slice(path.lastIndexOf('.props.') + '.props.'.length),
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
      if (typeof value !== 'string' && !isTranslationRef(value)) {
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
 * Validate a node's `props` against its component's manifest schema: unknown
 * prop (with a Levenshtein "did you mean"), out-of-enum value, and primitive
 * type mismatch. Bound/event props are skipped (they resolve at runtime), as
 * are complex/unconstrained props and TranslationRef values.
 */
function validateProps(
  props: Record<string, unknown>,
  schema: PropSchema[],
  skip: Set<string>,
  componentName: string,
  path: string,
  errors: ValidationError[],
): void {
  const byName = new Map(schema.map((p) => [p.name, p]))
  const propNames = schema.map((p) => p.name)
  for (const [key, value] of Object.entries(props)) {
    if (skip.has(key)) continue
    checkUrls(value, key, `${path}.props.${key}`, errors)
    const prop = byName.get(key)
    if (!prop) {
      const suggestion = closestName(key, propNames)
      const hint = suggestion ? ` Did you mean "${suggestion}"?` : ''
      errors.push({
        path: `${path}.props.${key}`,
        message: `Unknown prop "${key}" for component "${componentName}".${hint}`,
      })
      continue
    }
    if (isTranslationRef(value)) continue
    if (prop.shape) {
      checkShape(value, prop.shape, `${path}.props.${key}`, errors)
    } else if (prop.enum) {
      if (typeof value !== 'string' || !prop.enum.includes(value)) {
        errors.push({
          path: `${path}.props.${key}`,
          message: `Invalid value ${JSON.stringify(value)} for "${key}" — expected one of: ${prop.enum.join(', ')}.`,
        })
      }
    } else if (prop.primitives) {
      const actual = primitiveOf(value)
      if (actual === 'object' || !prop.primitives.includes(actual)) {
        errors.push({
          path: `${path}.props.${key}`,
          message: `Invalid type for "${key}" — expected ${prop.primitives.join(' | ')}, got ${actual}.`,
        })
      }
    }
  }
}

/** Levenshtein distance (≤ 2 cutoff for suggestions). */
function closestName(name: string, candidates: string[]): string | undefined {
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

function validateNode(
  node: unknown,
  path: string,
  errors: ValidationError[],
  state: StateInfo,
  extra: ReadonlySet<string>,
): void {
  if (typeof node !== 'object' || node === null) {
    errors.push({ path, message: 'Expected a component node object' })
    return
  }
  const n = node as Record<string, unknown>
  if (typeof n['component'] !== 'string') {
    errors.push({ path: `${path}.component`, message: 'component must be a string' })
    return
  }
  const componentName = n['component'] as string
  if (!componentNames.has(componentName) && !extra.has(componentName)) {
    const suggestion = closestName(componentName, [...componentNames, ...extra])
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : ''
    errors.push({
      path: `${path}.component`,
      message: `Unknown component "${componentName}".${hint}`,
    })
    return
  }

  const nodeBind = (n['bind'] ?? {}) as Record<string, string>

  // Validate bind refs: "$data.<path>" (host data) or "$state.<key>" (declared view state).
  for (const [key, value] of Object.entries(nodeBind)) {
    if (typeof value !== 'string' || (!DATA_REF_RE.test(value) && !STATE_REF_RE.test(value))) {
      errors.push({
        path: `${path}.bind.${key}`,
        message: `bind values must start with "$data." or "$state." — got "${value}"`,
      })
    } else if (STATE_REF_RE.test(value)) {
      const stateKey = value.slice('$state.'.length)
      if (!state.keys.has(stateKey)) {
        const hint = suggestKey(stateKey, state.keys)
        errors.push({
          path: `${path}.bind.${key}`,
          message: `Unknown state key "${stateKey}" — declare it in the top-level "state" object.${hint}`,
        })
      }
    }
  }

  // Validate events refs: "$actions.<name>" (host action) or "$state.set|toggle.<key>" (state writer).
  const nodeEvents = (n['events'] ?? {}) as Record<string, string>
  for (const [key, value] of Object.entries(nodeEvents)) {
    const isStateWriter = STATE_SET_RE.test(value) || STATE_TOGGLE_RE.test(value)
    if (typeof value !== 'string' || (!ACTION_REF_RE.test(value) && !isStateWriter)) {
      errors.push({
        path: `${path}.events.${key}`,
        message: `events values must start with "$actions.", "$state.set." or "$state.toggle." — got "${value}"`,
      })
    } else if (isStateWriter) {
      const isToggle = STATE_TOGGLE_RE.test(value)
      const stateKey = value.slice(isToggle ? '$state.toggle.'.length : '$state.set.'.length)
      if (!state.keys.has(stateKey)) {
        const hint = suggestKey(stateKey, state.keys)
        errors.push({
          path: `${path}.events.${key}`,
          message: `Unknown state key "${stateKey}" — declare it in the top-level "state" object.${hint}`,
        })
      } else if (isToggle && !state.booleans.has(stateKey)) {
        errors.push({
          path: `${path}.events.${key}`,
          message: `"$state.toggle.${stateKey}" requires a boolean initial value in "state".`,
        })
      }
    }
  }

  // Validate props against the manifest schema (conformance). Bound/event prop
  // names are skipped — their values resolve at runtime from the host context.
  // A host component takes precedence over a built-in of the same name, so the built-in's
  // schema does not describe it.
  const schema = extra.has(componentName) ? undefined : propSchemas[componentName]
  const nodeProps = n['props']
  if (schema && typeof nodeProps === 'object' && nodeProps !== null && !Array.isArray(nodeProps)) {
    const skip = new Set([...Object.keys(nodeBind), ...Object.keys(nodeEvents)])
    validateProps(nodeProps as Record<string, unknown>, schema, skip, componentName, path, errors)
  }

  // Recurse into children
  if (Array.isArray(n['children'])) {
    for (let i = 0; i < n['children'].length; i++) {
      validateNode(n['children'][i], `${path}.children[${i}]`, errors, state, extra)
    }
  }
}

/** " Did you mean …?" hint for an unknown state key, or empty string. */
function suggestKey(key: string, keys: Set<string>): string {
  const suggestion = closestName(key, [...keys])
  return suggestion ? ` Did you mean "${suggestion}"?` : ''
}

/** Options for {@link validateView}. */
export interface ValidateViewOptions {
  /**
   * Component names the view may use beyond the built-in set: the keys of the `components` a
   * host passes to `<CascivoView>`. Their props are not checked against a schema.
   */
  components?: Iterable<string>
}

export function validateView(
  config: unknown,
  options?: ValidateViewOptions,
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const extra: ReadonlySet<string> = new Set(options?.components ?? [])

  if (typeof config !== 'object' || config === null) {
    return { valid: false, errors: [{ path: '', message: 'Config must be an object' }] }
  }

  const c = config as Record<string, unknown>

  // Validate view-local state: an optional object of primitive initial values.
  const state: StateInfo = { keys: new Set(), booleans: new Set() }
  const rawState = c['state']
  if (rawState !== undefined) {
    if (typeof rawState !== 'object' || rawState === null || Array.isArray(rawState)) {
      errors.push({ path: 'state', message: 'state must be an object of primitive values' })
    } else {
      for (const [key, value] of Object.entries(rawState as Record<string, unknown>)) {
        const t = primitiveOf(value)
        if (t === 'object') {
          errors.push({
            path: `state.${key}`,
            message: `state values must be string, number, boolean, or null — got object.`,
          })
          continue
        }
        state.keys.add(key)
        if (t === 'boolean') state.booleans.add(key)
      }
    }
  }

  const view = c['view']

  if (typeof view !== 'object' || view === null) {
    return {
      valid: false,
      errors: [...errors, { path: 'view', message: 'view must be an object' }],
    }
  }

  const v = view as Record<string, unknown>
  const regions = v['regions']

  if (typeof regions !== 'object' || regions === null) {
    errors.push({ path: 'view.regions', message: 'view.regions must be an object' })
    return { valid: false, errors }
  }

  for (const [regionName, nodes] of Object.entries(regions as Record<string, unknown>)) {
    if (!Array.isArray(nodes)) {
      errors.push({
        path: `view.regions.${regionName}`,
        message: `Region "${regionName}" must be an array of component nodes`,
      })
      continue
    }
    for (let i = 0; i < nodes.length; i++) {
      validateNode(
        nodes[i] as ComponentNode,
        `view.regions.${regionName}[${i}]`,
        errors,
        state,
        extra,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}
