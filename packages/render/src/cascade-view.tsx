'use client'
import { signal, useSignals } from '@cascivo/core'
import { translateKey } from '@cascivo/i18n'
import React from 'react'
import type { Signal } from '@preact/signals-react'
import { componentMap } from './component-map'
import type { ComponentNode, PropValue, TranslationRef, ViewConfig } from './types'
import { validateView } from './validate'

/** View-local state: each declared key backed by a signal. */
type StateSignals = Map<string, Signal<unknown>>

/**
 * Unwrap a DOM event into the value a `$state.set` handler should store. A
 * checkbox/radio contributes its `checked`; any other input its `value`; a plain
 * value (a component that already emits the value) passes through untouched.
 */
function coerceEventValue(arg: unknown): unknown {
  if (arg && typeof arg === 'object' && 'target' in arg) {
    const target = (arg as { target: unknown }).target
    if (target && typeof target === 'object') {
      const t = target as { type?: string; checked?: boolean; value?: unknown }
      if (t.type === 'checkbox' || t.type === 'radio') return t.checked
      if ('value' in t) return t.value
    }
  }
  return arg
}

export interface CascadeViewProps {
  config: ViewConfig | Signal<ViewConfig>
  data?: Record<string, unknown>
  actions?: Record<string, (...args: unknown[]) => unknown>
  /** 'throw' (default) | 'render' — render mode shows errors inline for the playground. */
  onInvalid?: 'throw' | 'render'
}

function isSignal(v: unknown): v is Signal<ViewConfig> {
  return typeof v === 'object' && v !== null && 'value' in v && 'peek' in v
}

function isTranslationRef(v: unknown): v is TranslationRef {
  return (
    typeof v === 'object' && v !== null && '$t' in v && typeof (v as TranslationRef).$t === 'string'
  )
}

/** Resolve a dot-path like "users.active" against a data object. */
export function getPath(data: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = data
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function resolvePropValue(value: PropValue): unknown {
  if (isTranslationRef(value)) {
    return translateKey(value.$t, value.params)
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolvePropValue(v))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolvePropValue(v as PropValue)]),
    )
  }
  return value
}

function renderNode(
  node: ComponentNode,
  data: Record<string, unknown> | undefined,
  actions: Record<string, (...args: unknown[]) => unknown> | undefined,
  state: StateSignals,
  key: string,
): React.ReactNode {
  const Comp = componentMap[node.component]
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
        renderNode(child as ComponentNode, data, actions, state, `${key}-${i}`),
      )
    }
  }

  return React.createElement(Comp, { ...props, key }, children)
}

export function CascadeView({
  config,
  data,
  actions,
  onInvalid = 'throw',
}: CascadeViewProps): React.ReactElement | null {
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

  const { valid, errors } = validateView(resolvedConfig)
  if (!valid) {
    const msg = errors.map((e) => `${e.path}: ${e.message}`).join('\n')
    if (onInvalid === 'render') {
      return (
        <div role="alert" style={{ color: 'red', whiteSpace: 'pre' }}>
          {msg}
        </div>
      )
    }
    throw new Error(`CascadeView: invalid config\n${msg}`)
  }

  const { regions } = resolvedConfig.view

  return (
    <div className="cascade-view">
      {Object.entries(regions).map(([regionName, nodes]) => (
        <div key={regionName} className={`cascade-region cascade-region--${regionName}`}>
          {nodes.map((node, i) => renderNode(node, data, actions, state, `${regionName}-${i}`))}
        </div>
      ))}
    </div>
  )
}
