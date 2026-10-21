'use client'
// Renders one A2UI surface from an `A2uiStore`. Every component is its own `A2uiNode`, which
// subscribes only to the signals it reads, so a data change re-renders the nodes bound to it
// and not their siblings. Everything a node reads (ids, props, data) came from an agent.
import { useSignals } from '@cascivo/core'
import { Skeleton } from '@cascivo/react'
import React from 'react'
import type { ComponentType, ReactNode } from 'react'
import { a2uiComponents } from '../a2ui-catalog-data'
import { componentMap } from '../component-map'
import { checkUrls, isSafeUrl, URL_KEYS } from '../prop-check'
import type { ValidationError } from '../prop-check'
import { propSchemas } from '../prop-schemas'
import { isBinding, isDynamicRef, isFunctionCall } from './catalog-spec'
import { A2uiDataError } from './data-model'
import { resolveDynamic } from './functions'
import type { ResolveContext } from './functions'
import { A2UI_CATALOG_ID, actionMessage, errorMessage, isRecord } from './messages'
import type { A2uiActionMessage, A2uiComponent, A2uiErrorMessage } from './messages'
import { A2uiPathError, resolvePath } from './pointer'
import type { A2uiStore, A2uiSurfaceState } from './store'
import { TWO_WAY, twoWayEmpty, twoWayValue } from './two-way'

export interface AdapterInput {
  readonly component: A2uiComponent
  /** The resolved value; a URL key that fails `isSafeUrl` is `undefined`. */
  prop(name: string): unknown
  /**
   * Renders other nodes, a Skeleton for each id that has not arrived. Call it at most once, while
   * the adapter runs, with every id the adapter needs; place each returned node once. A second or
   * later call renders nothing (see `split`).
   */
  children(ids: readonly string[]): ReactNode[]
  /**
   * A child list, a component id or text, by the shape of the slot's value. Call it at most once
   * per name, while the adapter runs; place each returned node once (see `split`).
   */
  slot(name: string): ReactNode
  /**
   * Resolves a dynamic value nested inside a prop (a `{path}` binding or a function call, such as
   * a Tabs title), as `prop` does for a top-level one; errors are reported once per surface.
   * It does NOT URL-check: use it only for values rendered as text, and `prop()` or
   * `isSafeUrl` for anything that reaches a URL sink (href, src, window.open).
   */
  resolve(value: unknown): unknown
  /** The `component` type of node `id`, or undefined until it arrives; reactive. */
  typeOf(id: string): string | undefined
  /** Set only when `prop` is a `{path}` binding: writes to the bound path. */
  writer(prop: string): ((value: unknown) => void) | undefined
  /** Set only when `prop` holds an Action: dispatches it. */
  action(prop: string): (() => void) | undefined
  /** Messages of the `checks` whose condition is not true. */
  failingChecks(): readonly string[]
  /**
   * Reports an error, once per code and message for the surface; put the component id in
   * `message` for one report per component.
   */
  report(code: string, message: string): void
}

export type A2uiAdapter = (input: AdapterInput) => ReactNode

export interface A2uiRenderCatalog {
  readonly id: string
  adapter(component: string): A2uiAdapter | undefined
}

export interface A2uiSurfaceProps {
  store: A2uiStore
  surfaceId: string
  catalogs: readonly A2uiRenderCatalog[]
  onAction?: (
    message: A2uiActionMessage,
    metadata: { a2uiClientDataModel?: ReturnType<A2uiStore['clientDataModel']> },
  ) => void
  onError?: (message: A2uiErrorMessage) => void
  openUrl?: (url: string) => void
  locale?: string
  fallback?: ReactNode
}

interface Env {
  readonly store: A2uiStore
  readonly surface: A2uiSurfaceState
  readonly catalog: A2uiRenderCatalog
  readonly locale: string
  readonly onAction: A2uiSurfaceProps['onAction']
  readonly openUrl: (url: string) => void
  /** Every call reaches `onError`: for errors raised by a user's action. */
  report(e: A2uiErrorMessage): void
  /** Reaches `onError` once per `key` for the surface: for errors found while rendering. */
  reportOnce(key: string, e: A2uiErrorMessage): void
  renderError(id: string, message: string): void
}

// Per surface, the keys of the render-time errors already reported. A render can run any
// number of times (and a host that sets state in `onError` causes another), so an error found
// while rendering must reach `onError` once, or it loops. Keyed by the surface object so the
// set lives exactly as long as the surface (a re-created surface starts clean) and survives
// re-mounts of <A2uiSurface>, which a component-local ref would not.
const reportedRenderErrors = new WeakMap<A2uiSurfaceState, Set<string>>()

/** Identifies one render-time error: its code, the component it concerns, and where. */
const errorKey = (e: A2uiErrorMessage, componentId: string): string =>
  `${e.error.code}|${componentId}|${e.error.path ?? e.error.message}`

function defaultOpenUrl(url: string): void {
  if (isSafeUrl(url)) window.open(url, '_blank', 'noopener,noreferrer')
}

const hasOwn = (record: object, key: string): boolean => Object.hasOwn(record, key)

function isTemplate(value: unknown): value is { componentId: string; path: string } {
  return (
    isRecord(value) && typeof value['componentId'] === 'string' && typeof value['path'] === 'string'
  )
}

/**
 * How a node's render budget is shared (maxRenderNodes, R19/R20). The surface root gets
 * `maxRenderNodes`; a node spends 1 and splits the remaining R = budget - 1 among its children
 * without any shared counter, so the bound holds however React schedules the renders:
 *
 * 1. Takers: during one adapter call, each `slot(name)` call on a prop holding children (a
 *    child id list, a template, or a component id in an arity-one slot; text excluded) is one
 *    taker, and one `children(ids)` call is one taker. Taker k of the T actually used gets
 *    `split(R, T, k)`, ordered as the slots' props, then `children()` last. Nothing is reserved
 *    for a call the adapter does not make.
 * 2. Within a taker: its m children (list entries, template items, or `children()` ids) get
 *    `split(share, m, i)`.
 * 3. Once per render: a second `slot(name)` for the same name, a second `children()`, or either
 *    call after the adapter has returned takes no share; it renders nothing and reports one
 *    RENDER_ERROR. The shares are fixed when the adapter returns (children render after it),
 *    so a level never hands out more than R and the total is at most `maxRenderNodes` for any
 *    adapter that places each returned node at most once, however many times it calls these.
 *    A node placed twice renders its subtree twice on one share, which the bound cannot see.
 *
 * `split(total, n, i)` is `floor(total / n)` plus 1 for the first `total mod n` children, so a
 * long list is truncated at its end rather than dropped whole. A node rendered with budget < 1
 * renders nothing and reports one RENDER_ERROR for the surface.
 */
function split(total: number, n: number, i: number): number {
  return Math.floor(total / n) + (i < total % n ? 1 : 0)
}

function makeInput(
  component: A2uiComponent,
  scope: string,
  path: readonly Ancestor[],
  env: Env,
  budget: number,
): { readonly input: AdapterInput; seal(): void } {
  const { data, id: surfaceId } = env.surface
  // Render-time resolution reports once per error; dispatch-time (a click) reports each time.
  const reportOnce = (e: A2uiErrorMessage): void => env.reportOnce(errorKey(e, component.id), e)
  const base = { data, scope, locale: env.locale, openUrl: env.openUrl, surfaceId }
  const renderCtx: ResolveContext = { ...base, report: reportOnce }
  const dispatchCtx: ResolveContext = { ...base, report: env.report }
  const raw = (name: string): unknown =>
    hasOwn(component.props, name) ? component.props[name] : undefined
  const resolve = (value: unknown): unknown => resolveDynamic(value, renderCtx)
  const resolveNow = (value: unknown): unknown => resolveDynamic(value, dispatchCtx)
  const pathError = (e: unknown, at: string, report: (e: A2uiErrorMessage) => void): void => {
    if (e instanceof A2uiDataError) return report(errorMessage(e.code, surfaceId, e.message))
    if (!(e instanceof A2uiPathError)) throw e
    report(errorMessage('INVALID_PATH', surfaceId, e.message, at))
  }

  const info = hasOwn(a2uiComponents, component.component)
    ? a2uiComponents[component.component]
    : undefined
  const arityOf = (name: string): 'one' | 'many' | undefined =>
    info !== undefined && hasOwn(info.slots, name) ? info.slots[name]?.arity : undefined
  const holdsChildren = (name: string, value: unknown): boolean =>
    Array.isArray(value) ||
    isTemplate(value) ||
    (typeof value === 'string' && arityOf(name) === 'one')
  const childSlots = Object.keys(component.props).filter((k) =>
    holdsChildren(k, component.props[k]),
  )
  // The share-takers this render used: child-holding slots by name, and one children() call.
  // Local to this render's input, so nothing is carried across renders.
  const remaining = budget - 1
  const slotsCalled = new Set<string>()
  let childrenCalled = false
  let sealed = false
  let takers: readonly (string | null)[] | undefined
  /** The share of taker `key` (a slot name, or null for children()); fixes the takers. */
  const shareOf = (key: string | null): number => {
    sealed = true
    takers ??= [...childSlots.filter((k) => slotsCalled.has(k)), ...(childrenCalled ? [null] : [])]
    return split(remaining, takers.length, takers.indexOf(key))
  }
  const refuse = (key: string, message: string): void =>
    env.reportOnce(
      `RENDER_ERROR|#${key}`,
      errorMessage('RENDER_ERROR', surfaceId, `Component "${component.id}": ${message}`),
    )
  /** Whether a slot or children() call may take a share; reports why not. */
  const take = (what: string, taken: boolean): boolean => {
    if (sealed) {
      refuse(`late:${what}`, `${what} must be called while the adapter renders.`)
      return false
    }
    if (taken) {
      refuse(
        `once:${what}`,
        `${what} may be called once per render; the second call renders nothing.`,
      )
      return false
    }
    return true
  }

  // Keyed by position too, so an agent listing an id twice does not collide React keys.
  const child = (id: string, index: number, share: () => number): ReactNode => (
    <A2uiNode
      key={`${id}#${index}`}
      id={id}
      scope={scope}
      ancestors={path}
      env={env}
      budget={share}
    />
  )

  const template = (componentId: string, at: string, share: () => number): ReactNode => {
    let abs: string
    let items: unknown
    try {
      abs = resolvePath(at, scope)
      items = data.read(abs).value
    } catch (e) {
      pathError(e, at, reportOnce)
      return null
    }
    if (!Array.isArray(items)) return null
    const prefix = abs.replace(/\/$/, '')
    return items.map((_, i) => (
      <A2uiNode
        key={`${componentId}#${i}`}
        id={componentId}
        scope={`${prefix}/${i}`}
        ancestors={path}
        env={env}
        budget={() => split(share(), items.length, i)}
      />
    ))
  }

  const input: AdapterInput = {
    component,
    prop(name) {
      const value = raw(name)
      if (name === 'accessibility' && isRecord(value)) {
        // fromEntries defines own properties, so an agent's `__proto__` key stays a plain key.
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]))
      }
      const resolved = resolve(value)
      if (URL_KEYS.has(name)) {
        return typeof resolved === 'string' && isSafeUrl(resolved) ? resolved : undefined
      }
      // Literals were URL-checked by the store; data the agent bound in was not.
      if (isDynamicRef(value) && typeof resolved === 'object' && resolved !== null) {
        const unsafe: ValidationError[] = []
        checkUrls(resolved, name, name, unsafe)
        if (unsafe.length > 0) return undefined
      }
      return resolved
    },
    children(ids) {
      if (!take('children()', childrenCalled)) return ids.map(() => null)
      childrenCalled = true
      return ids.map((id, i) => child(id, i, () => split(shareOf(null), ids.length, i)))
    },
    resolve(value) {
      return resolve(value)
    },
    typeOf(id) {
      return env.surface.component(id).value?.component
    },
    slot(name) {
      const value = raw(name)
      if (value === undefined) return undefined
      if (holdsChildren(name, value)) {
        if (!take(`slot("${name}")`, slotsCalled.has(name))) return null
        slotsCalled.add(name)
        const share = (): number => shareOf(name)
        if (isTemplate(value)) return template(value.componentId, value.path, share)
        if (Array.isArray(value)) {
          const ids = value.filter((id): id is string => typeof id === 'string')
          return ids.map((id, i) => child(id, i, () => split(share(), ids.length, i)))
        }
        // holdsChildren left only a component id in an arity-one slot.
        return typeof value === 'string' ? child(value, 0, share) : null
      }
      // Only a string or number is text; an object bound in from the data model would crash React.
      const text = resolve(value)
      return typeof text === 'string' || typeof text === 'number' ? text : undefined
    },
    writer(prop) {
      const value = raw(prop)
      if (!isBinding(value) || !isRecord(value)) return undefined
      const at = value['path']
      if (typeof at !== 'string') return undefined
      return (next) => {
        try {
          data.write(resolvePath(at, scope), next)
        } catch (e) {
          pathError(e, at, env.report)
        }
      }
    },
    action(prop) {
      const value = raw(prop)
      if (!isRecord(value)) return undefined
      const event = value['event']
      if (isRecord(event) && typeof event['name'] === 'string') {
        const name = event['name']
        const context = isRecord(event['context']) ? event['context'] : {}
        return () => {
          // Resolved at dispatch, so the context carries what the user sees now.
          const resolved = Object.fromEntries(
            Object.entries(context).map(([k, v]) => [k, resolveNow(v)]),
          )
          const message = actionMessage({
            name,
            surfaceId,
            sourceComponentId: component.id,
            context: resolved,
          })
          // Only this surface's model: the spec sends a model only to the server that made it.
          const model = env.surface.sendDataModel ? env.store.clientDataModel(surfaceId) : undefined
          env.onAction?.(message, model === undefined ? {} : { a2uiClientDataModel: model })
        }
      }
      const call = value['functionCall']
      // resolveDynamic resolves the call's args and runs it through callFunction.
      if (isFunctionCall(call)) return () => void resolveNow(call)
      return undefined
    },
    failingChecks() {
      const checks = raw('checks')
      if (!Array.isArray(checks)) return []
      return checks.flatMap((rule: unknown) =>
        isRecord(rule) && typeof rule['message'] === 'string' && resolve(rule['condition']) !== true
          ? [rule['message']]
          : [],
      )
    },
    report(code, message) {
      // Keyed by code and message only, as documented: an adapter that wants one report per
      // component puts the id in its message.
      env.reportOnce(`${code}|#report|${message}`, errorMessage(code, surfaceId, message))
    },
  }
  return {
    input,
    seal() {
      sealed = true
    },
  }
}

interface NodeProps {
  readonly id: string
  readonly scope: string
  /** Every node from the root to this one, excluding it. */
  readonly ancestors: readonly Ancestor[]
  readonly env: Env
  /** Nodes this subtree may render, itself included; read when the node renders (see `split`). */
  readonly budget: () => number
}

interface Ancestor {
  readonly id: string
  readonly scope: string
}

/**
 * Whether rendering `id` in `scope` under `ancestors` is a cycle. Take the nearest ancestor
 * with the same id, in scope S0. The node is legitimate recursion only when `scope` strictly
 * descends S0: `scope` starts with `S0 + '/'`, or S0 is the root scope '' and `scope` is not.
 * That is a template walking tree data (`children` of each item), bounded by the data.
 * Anything else repeats the id at the same depth of the data, or at a sibling or unrelated
 * path (a template over an ABSOLUTE path re-entering itself), which would otherwise render
 * every ordering of the list's items; it is a cycle. maxRenderDepth stays the backstop.
 */
function isCycle(id: string, scope: string, ancestors: readonly Ancestor[]): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i]!
    if (a.id !== id) continue
    const descends = a.scope === '' ? scope !== '' : scope.startsWith(`${a.scope}/`)
    return !descends
  }
  return false
}

function A2uiNode({ id, scope, ancestors, env, budget }: NodeProps): ReactNode {
  useSignals()
  if (isCycle(id, scope, ancestors)) {
    env.renderError(id, `Component "${id}" is its own ancestor; the cycle is not rendered.`)
    return null
  }
  const max = env.store.limits.maxRenderDepth
  if (ancestors.length >= max) {
    env.renderError(id, `Component "${id}" is nested deeper than maxRenderDepth (${max}).`)
    return null
  }
  const nodes = budget()
  if (nodes < 1) {
    const limit = env.store.limits.maxRenderNodes
    // One report per surface, whichever ids run out.
    env.reportOnce(
      'RENDER_ERROR|#maxRenderNodes',
      errorMessage(
        'RENDER_ERROR',
        env.surface.id,
        `The surface exceeds the render-node limit (maxRenderNodes ${limit}); the rest is not rendered.`,
      ),
    )
    return null
  }
  const component = env.surface.component(id).value
  if (component === undefined) return <Skeleton />
  // Keyed by component type: when an agent swaps the type behind an id the body remounts, so
  // an adapter that calls hooks never sees another adapter's hook order.
  return (
    <A2uiBody
      key={`${id}:${component.component}`}
      component={component}
      scope={scope}
      path={[...ancestors, { id, scope }]}
      env={env}
      budget={nodes}
    />
  )
}

interface BodyProps {
  readonly component: A2uiComponent
  readonly scope: string
  readonly path: readonly Ancestor[]
  readonly env: Env
  readonly budget: number
}

/** Runs the adapter; its own component so the signals the adapter reads re-render only it. */
function A2uiBody({ component, scope, path, env, budget }: BodyProps): ReactNode {
  useSignals()
  const adapter = env.catalog.adapter(component.component)
  if (adapter === undefined) {
    env.renderError(
      component.id,
      `Catalog "${env.catalog.id}" cannot render "${component.component}" (component "${component.id}").`,
    )
    return null
  }
  const { input, seal } = makeInput(component, scope, path, env, budget)
  const out = adapter(input)
  // Children render after this returns, so every share is fixed by the calls made above.
  seal()
  return out
}

/** Renders the surface `surfaceId` of `store`, drawing components through `catalogs`. */
export function A2uiSurface({
  store,
  surfaceId,
  catalogs,
  onAction,
  onError,
  openUrl,
  locale = '',
  fallback,
}: A2uiSurfaceProps): ReactNode {
  useSignals()
  // Read so a surface created after mount re-renders this component.
  void store.surfaceIds.value
  const surface = store.surface(surfaceId)
  if (surface === undefined || !surface.hasRoot.value) return fallback ?? null

  // Deferred: errors are found while rendering, and a host that sets state in `onError`
  // must not update another component mid-render.
  const report = (e: A2uiErrorMessage): void => {
    if (onError !== undefined) queueMicrotask(() => onError(e))
  }
  const reportOnce = (key: string, e: A2uiErrorMessage): void => {
    let seen = reportedRenderErrors.get(surface)
    if (seen === undefined) {
      seen = new Set()
      reportedRenderErrors.set(surface, seen)
    }
    if (seen.has(key)) return
    seen.add(key)
    report(e)
  }
  // Once per id, whatever the reason (a cycle, too deep, no adapter).
  const renderError = (id: string, message: string): void =>
    reportOnce(`RENDER_ERROR|${id}`, errorMessage('RENDER_ERROR', surface.id, message))

  const catalog = catalogs.find((c) => c.id === surface.catalogId)
  if (catalog === undefined) {
    // '' is never a component id, so it marks the surface-level error.
    renderError('', `No render catalog for "${surface.catalogId}".`)
    return fallback ?? null
  }

  const env: Env = {
    store,
    surface,
    catalog,
    locale,
    onAction,
    openUrl: openUrl ?? defaultOpenUrl,
    report,
    reportOnce,
    renderError,
  }
  return (
    <A2uiNode
      id="root"
      scope=""
      ancestors={[]}
      env={env}
      budget={() => store.limits.maxRenderNodes}
    />
  )
}

// ---- The cascivo catalog --------------------------------------------------------------------

function renderGeneric(
  name: string,
  Comp: ComponentType<Record<string, unknown>>,
  input: AdapterInput,
): ReactNode {
  const info = hasOwn(a2uiComponents, name) ? a2uiComponents[name] : undefined
  const slots = info?.slots ?? {}
  const events = info?.events ?? []
  const schemas = hasOwn(propSchemas, name) ? (propSchemas[name] ?? []) : []
  const declares = (prop: string): boolean => schemas.some((s) => s.name === prop)

  const props: Record<string, unknown> = {}
  for (const key of Object.keys(input.component.props)) {
    if (key === 'checks' || key === 'accessibility') continue
    // Slots and events win over a same-named data prop, as in the catalog spec.
    if (hasOwn(slots, key)) props[key] = input.slot(key)
    else if (events.includes(key)) {
      const handler = input.action(key)
      if (handler !== undefined) props[key] = handler
    } else if (declares(key)) props[key] = input.prop(key)
  }

  const twoWay = hasOwn(TWO_WAY, name) ? TWO_WAY[name] : undefined
  const write = twoWay === undefined ? undefined : input.writer(twoWay.prop)
  if (twoWay !== undefined && write !== undefined) {
    if (props[twoWay.prop] === undefined) props[twoWay.prop] = twoWayEmpty(name, props)
    const dispatch = input.action(twoWay.event)
    // Write first, so an Action on the same event resolves its context against the new value.
    props[twoWay.event] = (arg: unknown) => {
      write(twoWayValue(name, arg))
      dispatch?.()
    }
  }

  const failing = input.failingChecks()[0]
  if (failing !== undefined) {
    if (name === 'Button') props['disabled'] = true
    if (declares('error') && (props['error'] === undefined || props['error'] === '')) {
      props['error'] = failing
    }
  }

  const a11y = input.prop('accessibility')
  if (
    isRecord(a11y) &&
    typeof a11y['label'] === 'string' &&
    declares('ariaLabel') &&
    props['ariaLabel'] === undefined
  ) {
    props['ariaLabel'] = a11y['label']
  }

  return React.createElement(Comp, props)
}

/** Draws every cascivo component through its manifest: data props, slots, events, checks. */
export const cascivoCatalog: A2uiRenderCatalog = {
  id: A2UI_CATALOG_ID,
  adapter(component) {
    const Comp = hasOwn(componentMap, component) ? componentMap[component] : undefined
    if (Comp === undefined) return undefined
    return (input) => renderGeneric(component, Comp, input)
  },
}
