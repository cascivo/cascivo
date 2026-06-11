import type { ComponentNode, PropValue } from './types'
import { componentByName, knownComponentNames } from './registry-data'

export interface ValidationError {
  path: string
  message: string
}

const DATA_REF_RE = /^\$data\./
const ACTION_REF_RE = /^\$actions\./

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

/**
 * Parse union literal types like `'sm' | 'md' | 'lg'` or `sm | md | lg`.
 * Returns the literal values if all branches are quoted or unquoted identifiers, else null.
 */
function parseUnionLiterals(typeStr: string): string[] | null {
  const branches = typeStr.split('|').map((s) => s.trim())
  const literals: string[] = []
  for (const branch of branches) {
    // Handle quoted strings: 'sm' or "sm"
    const quoted = branch.match(/^['"](.+)['"]$/)
    if (quoted?.[1] !== undefined) {
      literals.push(quoted[1])
      continue
    }
    // Handle unquoted identifiers (no spaces/parens)
    if (/^[a-zA-Z_$][\w$-]*$/.test(branch)) {
      literals.push(branch)
      continue
    }
    return null // complex type — skip
  }
  return literals
}

function checkPropType(
  value: PropValue,
  typeStr: string,
  path: string,
  errors: ValidationError[],
): void {
  const t = typeStr.trim()
  if (t === 'string') {
    if (typeof value !== 'string') {
      errors.push({ path, message: `Expected string, got ${typeof value}` })
    }
    return
  }
  if (t === 'number') {
    if (typeof value !== 'number') {
      errors.push({ path, message: `Expected number, got ${typeof value}` })
    }
    return
  }
  if (t === 'boolean') {
    if (typeof value !== 'boolean') {
      errors.push({ path, message: `Expected boolean, got ${typeof value}` })
    }
    return
  }
  // Try union literals
  const literals = parseUnionLiterals(t)
  if (literals && literals.length > 0) {
    if (typeof value !== 'string' || !literals.includes(value)) {
      errors.push({
        path,
        message: `${path.split('.').pop()} — expected one of ${literals.map((l) => `'${l}'`).join(' | ')}, got ${typeof value}${typeof value === 'string' ? ` ('${value}')` : ''}`,
      })
    }
  }
  // Otherwise (ReactNode, function, object generics, etc.) — skip check
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
  const entry = componentByName(componentName)
  if (!entry) {
    const suggestion = closestName(componentName, knownComponentNames())
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : ''
    errors.push({
      path: `${path}.component`,
      message: `Unknown component "${componentName}".${hint}`,
    })
    return
  }

  const propMetas = entry.meta.props ?? []
  const propMetaByName = new Map(propMetas.map((p) => [p.name, p]))

  // Check required props
  const nodeProps = (n['props'] ?? {}) as Record<string, PropValue>
  const nodeBind = (n['bind'] ?? {}) as Record<string, string>
  for (const meta of propMetas) {
    if (meta.required && meta.default === undefined) {
      if (!(meta.name in nodeProps) && !(meta.name in nodeBind)) {
        errors.push({
          path: `${path}.props.${meta.name}`,
          message: `Required prop "${meta.name}" is missing`,
        })
      }
    }
  }

  // Check prop types
  for (const [key, value] of Object.entries(nodeProps)) {
    const meta = propMetaByName.get(key)
    if (!meta) {
      const valid = propMetas.map((p) => p.name)
      errors.push({
        path: `${path}.props.${key}`,
        message: `Unknown prop "${key}" for ${componentName}. Valid props: ${valid.join(', ')}`,
      })
      continue
    }
    checkPropType(value, meta.type, `${path}.props.${key}`, errors)
  }

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
