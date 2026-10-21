import type { ComponentNode } from './types'
import { componentNames } from './component-names'
import { checkPropValue, checkUrls, closestName, primitiveOf } from './prop-check'
import { propSchemas, type PropSchema } from './prop-schemas'
import type { ValidationError } from './prop-check'

export type { ValidationError }

const DATA_REF_RE = /^\$data\./
const STATE_REF_RE = /^\$state\./
const ACTION_REF_RE = /^\$actions\./
const STATE_SET_RE = /^\$state\.set\./
const STATE_TOGGLE_RE = /^\$state\.toggle\./

/** Declared view-local state: the set of keys and the subset with boolean initial values. */
interface StateInfo {
  keys: Set<string>
  booleans: Set<string>
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
    checkPropValue(prop, value, `${path}.props.${key}`, key, errors)
  }
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
