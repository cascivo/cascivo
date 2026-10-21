import { a2uiComponents } from '../a2ui-catalog-data'
import { componentNames } from '../component-names'
import { checkPropValue, checkUrls, closestName } from '../prop-check'
import type { ValidationError } from '../prop-check'
import { propSchemas } from '../prop-schemas'
import { A2UI_CATALOG_ID, isRecord } from './messages'
import type { A2uiComponent } from './messages'

/** One problem with a component; `prop` is '' when it concerns the component as a whole. */
export interface A2uiIssue {
  readonly prop: string
  readonly message: string
}

export interface A2uiCatalogSpec {
  readonly id: string
  has(component: string): boolean
  validate(c: A2uiComponent): readonly A2uiIssue[]
}

// ---- Value shapes shared by both catalogs -------------------------------------------------
// Each returns a reason the value is wrong, or undefined when it is acceptable.

const RETURN_TYPES: readonly string[] = [
  'string',
  'number',
  'boolean',
  'array',
  'object',
  'any',
  'void',
]

export function isBinding(value: unknown): boolean {
  if (!isRecord(value)) return false
  const keys = Object.keys(value)
  return keys.length === 1 && keys[0] === 'path' && typeof value['path'] === 'string'
}

export function isFunctionCall(value: unknown): boolean {
  if (!isRecord(value) || typeof value['call'] !== 'string') return false
  for (const [key, v] of Object.entries(value)) {
    if (key === 'call') continue
    if (key === 'args' && isRecord(v)) continue
    if (key === 'returnType' && typeof v === 'string' && RETURN_TYPES.includes(v)) continue
    return false
  }
  return true
}

/** A binding or a function call: resolved at render time, so only its shape is checked. */
export const isDynamicRef = (value: unknown): boolean => isBinding(value) || isFunctionCall(value)

export function checkDynamic(
  value: unknown,
  literal: (v: unknown) => boolean,
  expected: string,
): string | undefined {
  return literal(value) || isDynamicRef(value)
    ? undefined
    : `expected ${expected}, a {path} binding or a {call} function call`
}

export const checkDynString = (v: unknown) =>
  checkDynamic(v, (x) => typeof x === 'string', 'a string')
export const checkDynNumber = (v: unknown) =>
  checkDynamic(v, (x) => typeof x === 'number' && Number.isFinite(x), 'a number')
export const checkDynBool = (v: unknown) =>
  checkDynamic(v, (x) => typeof x === 'boolean', 'a boolean')
export const checkDynStringList = (v: unknown) =>
  checkDynamic(
    v,
    (x) => Array.isArray(x) && x.every((i) => typeof i === 'string'),
    'a string array',
  )

export function checkChildList(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.every((id) => typeof id === 'string' && id !== '')
      ? undefined
      : 'expected an array of component ids'
  }
  if (isRecord(value)) {
    const keys = Object.keys(value)
    const ok =
      keys.length === 2 &&
      typeof value['componentId'] === 'string' &&
      typeof value['path'] === 'string'
    if (ok) return undefined
  }
  return 'expected an array of component ids or {componentId, path}'
}

export function checkComponentId(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? undefined : 'expected a component id string'
}

export function checkAction(value: unknown): string | undefined {
  if (isRecord(value)) {
    const keys = Object.keys(value)
    if (keys.length === 1 && keys[0] === 'event') {
      const event = value['event']
      if (
        isRecord(event) &&
        typeof event['name'] === 'string' &&
        event['name'] !== '' &&
        Object.keys(event).every((k) => k === 'name' || k === 'context') &&
        (event['context'] === undefined || isRecord(event['context']))
      ) {
        return undefined
      }
    }
    if (keys.length === 1 && keys[0] === 'functionCall' && isFunctionCall(value['functionCall'])) {
      return undefined
    }
  }
  return 'expected {event: {name, context?}} or {functionCall: {call, args?}}'
}

/** A text slot takes children or plain text. */
export const checkTextSlot = (v: unknown) =>
  checkChildList(v) === undefined || checkDynString(v) === undefined
    ? undefined
    : 'expected text, a child id list, a {path} binding or a {call} function call'

function checkChecks(value: unknown): string | undefined {
  if (!Array.isArray(value)) return 'expected an array of {condition, message}'
  for (const rule of value) {
    if (
      !isRecord(rule) ||
      typeof rule['message'] !== 'string' ||
      !Object.hasOwn(rule, 'condition') ||
      Object.keys(rule).some((k) => k !== 'condition' && k !== 'message') ||
      checkDynBool(rule['condition']) !== undefined
    ) {
      return 'each check must be {condition: boolean | binding | call, message: string}'
    }
  }
  return undefined
}

function checkAccessibility(value: unknown): string | undefined {
  if (
    isRecord(value) &&
    Object.entries(value).every(
      ([k, v]) => (k === 'label' || k === 'description') && checkDynString(v) === undefined,
    )
  ) {
    return undefined
  }
  return 'expected {label?, description?} dynamic strings'
}

/**
 * The keys every component may carry. Returns undefined when `key` is not a common key at all,
 * else the reasons (possibly none) its value is wrong.
 */
export function checkCommonKey(
  key: string,
  value: unknown,
  opts: { checks: boolean; weight: boolean },
): string | undefined | null {
  if (key === 'accessibility') return checkAccessibility(value) ?? null
  if (key === 'checks') {
    if (!opts.checks) return 'only Checkable components accept "checks"'
    return checkChecks(value) ?? null
  }
  if (key === 'weight' && opts.weight) {
    return typeof value === 'number' && Number.isFinite(value) ? null : 'expected a number'
  }
  return undefined
}

export function unknownProperty(name: string, known: readonly string[]): A2uiIssue {
  const near = closestName(name, [...known])
  return {
    prop: name,
    message: `Unknown property "${name}".${near === undefined ? '' : ` Did you mean "${near}"?`}`,
  }
}

export const unknownComponent = (name: string): A2uiIssue => ({
  prop: '',
  message: `Unknown component "${name}".`,
})

// ---- cascivo catalog ------------------------------------------------------------------------

const hasOwn = <T extends object>(record: T, key: string): boolean => Object.hasOwn(record, key)

export const cascivoCatalogSpec: A2uiCatalogSpec = {
  id: A2UI_CATALOG_ID,
  has: (component) => componentNames.has(component),
  validate(c) {
    if (!componentNames.has(c.component)) return [unknownComponent(c.component)]
    const issues: A2uiIssue[] = []
    const data = hasOwn(propSchemas, c.component) ? (propSchemas[c.component] ?? []) : []
    const info = hasOwn(a2uiComponents, c.component) ? a2uiComponents[c.component] : undefined
    const slots = info?.slots ?? {}
    const events = info?.events ?? []
    const known = [
      ...data.map((p) => p.name),
      ...Object.keys(slots),
      ...events,
      'accessibility',
      'checks',
    ]

    for (const [key, value] of Object.entries(c.props)) {
      const common = checkCommonKey(key, value, { checks: true, weight: false })
      if (common !== undefined) {
        if (common !== null) issues.push({ prop: key, message: `Invalid "${key}": ${common}.` })
        continue
      }
      // Slots and events win over a same-named data prop (Button.children, Button.onClick).
      if (hasOwn(slots, key)) {
        const slot = slots[key]
        const reason =
          slot?.text === true
            ? checkTextSlot(value)
            : slot?.arity === 'one'
              ? checkComponentId(value)
              : checkChildList(value)
        if (reason !== undefined)
          issues.push({ prop: key, message: `Invalid "${key}": ${reason}.` })
        continue
      }
      if (events.includes(key)) {
        const reason = checkAction(value)
        if (reason !== undefined)
          issues.push({ prop: key, message: `Invalid "${key}": ${reason}.` })
        continue
      }
      const prop = data.find((p) => p.name === key)
      if (prop !== undefined) {
        if (isDynamicRef(value)) continue
        const errors: ValidationError[] = []
        checkPropValue(prop, value, key, key, errors)
        checkUrls(value, key, key, errors)
        for (const error of errors) issues.push({ prop: key, message: error.message })
        continue
      }
      issues.push(unknownProperty(key, known))
    }

    for (const prop of data) {
      if (prop.required && !Object.hasOwn(c.props, prop.name)) {
        issues.push({ prop: prop.name, message: `Missing required property "${prop.name}".` })
      }
    }
    return issues
  },
}
