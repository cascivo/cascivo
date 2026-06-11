'use client'
import { useSignals } from '@cascade-ui/core'
import { translateKey } from '@cascade-ui/i18n'
import React from 'react'
import type { Signal } from '@preact/signals-react'
import { componentMap } from './component-map'
import type { ComponentNode, PropValue, TranslationRef, ViewConfig } from './types'
import { validateView } from './validate'

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
  key: string,
): React.ReactNode {
  // data param used for bind resolution below
  const Comp = componentMap[node.component]
  if (!Comp) return null

  const props: Record<string, unknown> = {}

  // Spread static props, resolving TranslationRefs
  if (node.props) {
    for (const [k, v] of Object.entries(node.props)) {
      props[k] = resolvePropValue(v)
    }
  }

  // Bind data props
  if (node.bind && data) {
    for (const [k, ref] of Object.entries(node.bind)) {
      const path = ref.replace(/^\$data\./, '')
      props[k] = getPath(data, path)
    }
  }

  // Wire events from actions
  if (node.events && actions) {
    for (const [k, ref] of Object.entries(node.events)) {
      const actionName = ref.replace(/^\$actions\./, '')
      const fn = actions[actionName]
      if (fn) props[k] = fn
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
        renderNode(child as ComponentNode, data, actions, `${key}-${i}`),
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
          {nodes.map((node, i) => renderNode(node, data, actions, `${regionName}-${i}`))}
        </div>
      ))}
    </div>
  )
}
