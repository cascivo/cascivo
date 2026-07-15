// Inlined from @cascivo/render — avoids a Node.js binary depending on React components at runtime.
// Component name validation uses the registry (passed by caller) instead of the React component map.

export interface ValidationError {
  path: string
  message: string
}

export interface ComponentNode {
  component: string
  props?: Record<string, unknown>
  bind?: Record<string, string>
  events?: Record<string, string>
  children?: ComponentNode[] | string
}

export interface ViewConfig {
  $schema?: string
  version?: 1
  state?: Record<string, string | number | boolean | null>
  view: {
    regions: Record<string, ComponentNode[]>
  }
}

const DATA_REF_RE = /^\$data\./
const STATE_REF_RE = /^\$state\./
const ACTION_REF_RE = /^\$actions\./
const STATE_SET_RE = /^\$state\.set\./
const STATE_TOGGLE_RE = /^\$state\.toggle\./

interface StateInfo {
  keys: Set<string>
  booleans: Set<string>
}

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
  componentNames: Set<string>,
  state: StateInfo,
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
  if (!componentNames.has(componentName)) {
    const suggestion = closestName(componentName, [...componentNames])
    const hint = suggestion ? ` Did you mean "${suggestion}"?` : ''
    errors.push({
      path: `${path}.component`,
      message: `Unknown component "${componentName}".${hint}`,
    })
    return
  }

  const nodeBind = (n['bind'] ?? {}) as Record<string, string>
  for (const [key, value] of Object.entries(nodeBind)) {
    if (typeof value !== 'string' || (!DATA_REF_RE.test(value) && !STATE_REF_RE.test(value))) {
      errors.push({
        path: `${path}.bind.${key}`,
        message: `bind values must start with "$data." or "$state." — got "${value}"`,
      })
    } else if (STATE_REF_RE.test(value) && !state.keys.has(value.slice('$state.'.length))) {
      errors.push({
        path: `${path}.bind.${key}`,
        message: `Unknown state key "${value.slice('$state.'.length)}" — declare it in the top-level "state" object.`,
      })
    }
  }

  const nodeEvents = (n['events'] ?? {}) as Record<string, string>
  for (const [key, value] of Object.entries(nodeEvents)) {
    const isSet = typeof value === 'string' && STATE_SET_RE.test(value)
    const isToggle = typeof value === 'string' && STATE_TOGGLE_RE.test(value)
    if (typeof value !== 'string' || (!ACTION_REF_RE.test(value) && !isSet && !isToggle)) {
      errors.push({
        path: `${path}.events.${key}`,
        message: `events values must start with "$actions.", "$state.set." or "$state.toggle." — got "${value}"`,
      })
    } else if (isSet || isToggle) {
      const stateKey = value.slice((isToggle ? '$state.toggle.' : '$state.set.').length)
      if (!state.keys.has(stateKey)) {
        errors.push({
          path: `${path}.events.${key}`,
          message: `Unknown state key "${stateKey}" — declare it in the top-level "state" object.`,
        })
      } else if (isToggle && !state.booleans.has(stateKey)) {
        errors.push({
          path: `${path}.events.${key}`,
          message: `"$state.toggle.${stateKey}" requires a boolean initial value in "state".`,
        })
      }
    }
  }

  if (Array.isArray(n['children'])) {
    for (let i = 0; i < n['children'].length; i++) {
      validateNode(
        n['children'][i] as ComponentNode,
        `${path}.children[${i}]`,
        errors,
        componentNames,
        state,
      )
    }
  }
}

/** Validate a ViewConfig object. Component names are checked against the provided set. */
export function validateView(
  config: unknown,
  componentNames: Set<string>,
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = []

  if (typeof config !== 'object' || config === null) {
    return { valid: false, errors: [{ path: '', message: 'Config must be an object' }] }
  }

  const c = config as Record<string, unknown>

  // View-local state: optional object of primitive initial values.
  const state: StateInfo = { keys: new Set(), booleans: new Set() }
  const rawState = c['state']
  if (rawState !== undefined) {
    if (typeof rawState !== 'object' || rawState === null || Array.isArray(rawState)) {
      errors.push({ path: 'state', message: 'state must be an object of primitive values' })
    } else {
      for (const [key, value] of Object.entries(rawState as Record<string, unknown>)) {
        const t = value === null ? 'null' : typeof value
        if (t !== 'string' && t !== 'number' && t !== 'boolean' && t !== 'null') {
          errors.push({
            path: `state.${key}`,
            message: `state values must be string, number, boolean, or null — got ${t}.`,
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
        componentNames,
        state,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}
