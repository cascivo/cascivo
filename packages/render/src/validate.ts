import type { ComponentNode } from './types'
import { componentMap } from './component-map'
import { propSchemas, type PropPrimitive, type PropSchema } from './prop-schemas'

export interface ValidationError {
  path: string
  message: string
}

const DATA_REF_RE = /^\$data\./
const ACTION_REF_RE = /^\$actions\./

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
    if (prop.enum) {
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

function validateNode(node: unknown, path: string, errors: ValidationError[]): void {
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
  if (!(componentName in componentMap)) {
    const suggestion = closestName(componentName, Object.keys(componentMap))
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : ''
    errors.push({
      path: `${path}.component`,
      message: `Unknown component "${componentName}".${hint}`,
    })
    return
  }

  const nodeBind = (n['bind'] ?? {}) as Record<string, string>

  // Validate bind refs
  for (const [key, value] of Object.entries(nodeBind)) {
    if (typeof value !== 'string' || !DATA_REF_RE.test(value)) {
      errors.push({
        path: `${path}.bind.${key}`,
        message: `bind values must start with "$data." — got "${value}"`,
      })
    }
  }

  // Validate events refs
  const nodeEvents = (n['events'] ?? {}) as Record<string, string>
  for (const [key, value] of Object.entries(nodeEvents)) {
    if (typeof value !== 'string' || !ACTION_REF_RE.test(value)) {
      errors.push({
        path: `${path}.events.${key}`,
        message: `events values must start with "$actions." — got "${value}"`,
      })
    }
  }

  // Validate props against the manifest schema (conformance). Bound/event prop
  // names are skipped — their values resolve at runtime from the host context.
  const schema = propSchemas[componentName]
  const nodeProps = n['props']
  if (schema && typeof nodeProps === 'object' && nodeProps !== null && !Array.isArray(nodeProps)) {
    const skip = new Set([...Object.keys(nodeBind), ...Object.keys(nodeEvents)])
    validateProps(nodeProps as Record<string, unknown>, schema, skip, componentName, path, errors)
  }

  // Recurse into children
  if (Array.isArray(n['children'])) {
    for (let i = 0; i < n['children'].length; i++) {
      validateNode(n['children'][i], `${path}.children[${i}]`, errors)
    }
  }
}

export function validateView(config: unknown): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  if (typeof config !== 'object' || config === null) {
    return { valid: false, errors: [{ path: '', message: 'Config must be an object' }] }
  }

  const c = config as Record<string, unknown>
  const view = c['view']

  if (typeof view !== 'object' || view === null) {
    return { valid: false, errors: [{ path: 'view', message: 'view must be an object' }] }
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
      validateNode(nodes[i] as ComponentNode, `view.regions.${regionName}[${i}]`, errors)
    }
  }

  return { valid: errors.length === 0, errors }
}
