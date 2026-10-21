'use client'
import { signal, useSignals } from '@cascivo/core'
import { translateKey } from '@cascivo/i18n'
import React from 'react'
import type { ComponentType } from 'react'
import type { Signal } from '@preact/signals-react'
import { componentMap } from './component-map'
import { coerceEventValue, getPath, isTranslationRef, resolvePropValue } from './node-props'
import type { ComponentNode, ViewConfig } from './types'
import { validateView } from './validate'

/** View-local state: each declared key backed by a signal. */
type StateSignals = Map<string, Signal<unknown>>

/** Props for {@link CascivoView}. */
export interface CascivoViewProps {
  /** The view to render — a {@link ViewConfig}, or a signal of one to re-render on change. */
  config: ViewConfig | Signal<ViewConfig>
  /** Host data that `$data.<path>` references and `bind`s resolve against. */
  data?: Record<string, unknown>
  /** Host callbacks that `$actions.<name>` event references call. */
  actions?: Record<string, (...args: unknown[]) => unknown>
  /** 'throw' (default) | 'render' — render mode shows errors inline for the playground. */
  onInvalid?: 'throw' | 'render'
  /**
   * Components the view may name beyond the built-in set, keyed by the name a node uses, e.g.
   * `{ Kpi, LineChart }` from `@cascivo/charts`. Looked up before the built-ins, and accepted by
   * the validator; their props are passed through unchecked, since no manifest schema covers them.
   * This is how a host renders charts without `@cascivo/render` depending on `@cascivo/charts`.
   */
  components?: Record<string, ComponentType<never>>
}

export { getPath }

function isSignal(v: unknown): v is Signal<ViewConfig> {
  return typeof v === 'object' && v !== null && 'value' in v && 'peek' in v
}

function renderNode(
  node: ComponentNode,
  data: Record<string, unknown> | undefined,
  actions: Record<string, (...args: unknown[]) => unknown> | undefined,
  state: StateSignals,
  key: string,
  components: Record<string, ComponentType<never>> | undefined,
): React.ReactNode {
  // A host component's props are whatever its node carries: unchecked, as the prop documents.
  const Comp =
    (components?.[node.component] as ComponentType<Record<string, unknown>> | undefined) ??
    componentMap[node.component]
  if (!Comp) return null

  const props: Record<string, unknown> = {}

  // Spread static props, resolving TranslationRefs
  if (node.props) {
    for (const [k, v] of Object.entries(node.props)) {
      props[k] = resolvePropValue(v)
    }
  }

  // Bind props: "$state.<key>" reads view-local state; "$data.<path>" reads host data.
  if (node.bind) {
    for (const [k, ref] of Object.entries(node.bind)) {
      if (ref.startsWith('$state.')) {
        const sig = state.get(ref.slice('$state.'.length))
        if (sig) props[k] = sig.value
      } else if (data) {
        props[k] = getPath(data, ref.replace(/^\$data\./, ''))
      }
    }
  }

  // Wire events: "$state.set|toggle.<key>" write view-local state; "$actions.<name>" call host actions.
  if (node.events) {
    for (const [k, ref] of Object.entries(node.events)) {
      if (ref.startsWith('$state.set.')) {
        const sig = state.get(ref.slice('$state.set.'.length))
        if (sig) props[k] = (arg: unknown) => (sig.value = coerceEventValue(arg))
      } else if (ref.startsWith('$state.toggle.')) {
        const sig = state.get(ref.slice('$state.toggle.'.length))
        if (sig) props[k] = () => (sig.value = !sig.value)
      } else if (actions) {
        const fn = actions[ref.replace(/^\$actions\./, '')]
        if (fn) props[k] = fn
      }
    }
  }

  // Resolve children
  let children: React.ReactNode = undefined
  if (node.children !== undefined) {
    if (typeof node.children === 'string') {
      children = node.children
    } else if (isTranslationRef(node.children)) {
      children = translateKey(node.children.$t, node.children.params)
    } else if (Array.isArray(node.children)) {
      children = node.children.map((child, i) =>
        renderNode(child as ComponentNode, data, actions, state, `${key}-${i}`, components),
      )
    }
  }

  return React.createElement(Comp, { ...props, key }, children)
}

/**
 * Render a JSON {@link ViewConfig} with real cascivo components.
 *
 * The config is validated first (see `validateView`); an invalid config throws, or — with
 * `onInvalid="render"` — renders its errors inline.
 */
export function CascivoView({
  config,
  data,
  actions,
  onInvalid = 'throw',
  components,
}: CascivoViewProps): React.ReactElement | null {
  useSignals()

  const resolvedConfig = isSignal(config) ? config.value : config

  // View-local state: one signal per declared key, rebuilt when the config identity
  // changes (a new config — including a swapped Signal<ViewConfig> — resets state).
  const stateRef = React.useRef<{ config: ViewConfig; signals: StateSignals } | null>(null)
  if (!stateRef.current || stateRef.current.config !== resolvedConfig) {
    const signals: StateSignals = new Map()
    for (const [k, v] of Object.entries(resolvedConfig.state ?? {})) {
      signals.set(k, signal(v as unknown))
    }
    stateRef.current = { config: resolvedConfig, signals }
  }
  const state = stateRef.current.signals

  const { valid, errors } = validateView(
    resolvedConfig,
    components ? { components: Object.keys(components) } : undefined,
  )
  if (!valid) {
    const msg = errors.map((e) => `${e.path}: ${e.message}`).join('\n')
    if (onInvalid === 'render') {
      return (
        <div role="alert" style={{ color: 'red', whiteSpace: 'pre' }}>
          {msg}
        </div>
      )
    }
    throw new Error(`CascivoView: invalid config\n${msg}`)
  }

  const { regions } = resolvedConfig.view

  return (
    <div className="cascivo-view">
      {Object.entries(regions).map(([regionName, nodes]) => (
        <div key={regionName} className={`cascade-region cascade-region--${regionName}`}>
          {nodes.map((node, i) =>
            renderNode(node, data, actions, state, `${regionName}-${i}`, components),
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * @deprecated Renamed to {@link CascivoView}; this alias is removed in 2.0.0.
 */
export const CascadeView = CascivoView

/**
 * @deprecated Renamed to {@link CascivoViewProps}; this alias is removed in 2.0.0.
 */
export type CascadeViewProps = CascivoViewProps
