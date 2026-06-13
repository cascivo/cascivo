import { writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { CascadeConfig } from '../utils/config.js'
import { fetchRegistry } from '../utils/registry.js'

// Inline validation types to avoid runtime dep on @cascivo/render
interface PropMeta {
  name: string
  type: string
  required?: boolean
  default?: string
}

interface ComponentNode {
  component: string
  props?: Record<string, unknown>
  bind?: Record<string, string>
  events?: Record<string, string>
  children?: ComponentNode[] | string | { $t: string; params?: Record<string, string | number> }
}

interface ViewConfig {
  view: {
    layout?: string
    regions: Record<string, ComponentNode[]>
  }
}

function isTranslationRef(v: unknown): v is { $t: string } {
  return typeof v === 'object' && v !== null && '$t' in v
}

function serializeProp(value: unknown): string {
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`
  if (typeof value === 'number' || typeof value === 'boolean') return `{${value}}`
  if (value === null) return `{null}`
  if (isTranslationRef(value))
    return `{"${(value as { $t: string }).$t}"} {/* i18n: ${(value as { $t: string }).$t} */}`
  return `{${JSON.stringify(value)}}`
}

function renderChildren(
  children: ComponentNode['children'],
  indent: string,
  componentPropNames: string[],
  knownComponents: Set<string>,
): string {
  if (children === undefined) return ''
  if (typeof children === 'string') return children
  if (isTranslationRef(children)) {
    const key = (children as { $t: string }).$t
    return `{/* i18n: ${key} */}`
  }
  if (Array.isArray(children)) {
    return children
      .map((child) =>
        renderNode(child as ComponentNode, indent + '  ', componentPropNames, knownComponents),
      )
      .join('\n')
  }
  return ''
}

function renderNode(
  node: ComponentNode,
  indent: string,
  _parentPropNames: string[],
  knownComponents: Set<string>,
): string {
  const compName = node.component
  knownComponents.add(compName)
  const propParts: string[] = []

  if (node.props) {
    for (const [k, v] of Object.entries(node.props)) {
      propParts.push(`${k}=${serializeProp(v)}`)
    }
  }

  if (node.bind) {
    for (const [k, ref] of Object.entries(node.bind)) {
      const path = ref.replace(/^\$data\./, '').replace(/\./g, '.')
      propParts.push(`${k}={data.${path}}`)
    }
  }

  if (node.events) {
    for (const [k, ref] of Object.entries(node.events)) {
      const actionName = ref.replace(/^\$actions\./, '')
      propParts.push(`${k}={actions.${actionName}}`)
    }
  }

  const propsStr = propParts.length > 0 ? ' ' + propParts.join(' ') : ''
  const childrenStr =
    node.children !== undefined
      ? renderChildren(node.children, indent, [], knownComponents)
      : undefined

  if (childrenStr !== undefined && childrenStr !== '') {
    return `${indent}<${compName}${propsStr}>\n${indent}  ${childrenStr}\n${indent}</${compName}>`
  }
  return `${indent}<${compName}${propsStr} />`
}

function collectBindAndEvents(nodes: ComponentNode[]): {
  boundProps: string[]
  actionProps: string[]
} {
  const boundProps: string[] = []
  const actionProps: string[] = []
  function walk(node: ComponentNode) {
    if (node.bind) {
      for (const ref of Object.values(node.bind)) {
        const path = ref.replace(/^\$data\./, '')
        if (!boundProps.includes(path)) boundProps.push(path)
      }
    }
    if (node.events) {
      for (const ref of Object.values(node.events)) {
        const name = ref.replace(/^\$actions\./, '')
        if (!actionProps.includes(name)) actionProps.push(name)
      }
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(walk)
    }
  }
  nodes.forEach(walk)
  return { boundProps, actionProps }
}

function generateTsx(
  config: ViewConfig,
  _propMetas: Map<string, PropMeta[]>,
  componentsPath: string,
): string {
  const knownComponents = new Set<string>()
  const allNodes = Object.values(config.view.regions).flat()
  const { boundProps, actionProps } = collectBindAndEvents(allNodes)

  const regionBlocks = Object.entries(config.view.regions)
    .map(([regionName, nodes]) => {
      const rendered = nodes.map((n) => renderNode(n, '      ', [], knownComponents)).join('\n')
      return `    <div className="region-${regionName}">\n${rendered}\n    </div>`
    })
    .join('\n')

  const importLines = [...knownComponents]
    .sort()
    .map((c) => `import { ${c} } from '${componentsPath}/${c.toLowerCase()}/${c.toLowerCase()}'`)
    .join('\n')

  const hasData = boundProps.length > 0
  const hasActions = actionProps.length > 0

  const dataParam = hasData
    ? `data: {\n${boundProps.map((p) => `    ${p.replace(/\./g, '_')}: unknown // TODO: type your data`).join('\n')}\n  }`
    : ''

  const actionsParam = hasActions
    ? `actions: {\n${actionProps.map((a) => `    ${a}: (...args: unknown[]) => unknown`).join('\n')}\n  }`
    : ''

  const params = [dataParam, actionsParam].filter(Boolean).join(',\n  ')
  const propsType = params ? `{\n  ${params}\n}` : '{}'

  return `import React from 'react'
${importLines}

interface PageProps ${propsType}

export function GeneratedPage({ ${hasData ? 'data, ' : ''}${hasActions ? 'actions' : ''} }: PageProps) {
  return (
    <div className="cascade-view">
${regionBlocks}
    </div>
  )
}
`
}

export async function generate(args: string[], config: CascadeConfig): Promise<void> {
  const outArg = args.find((_, i) => args[i - 1] === '--out')
  const inputArg = args.find((a) => !a.startsWith('--'))
  const componentsDirArg = args.find((_, i) => args[i - 1] === '--components-dir')

  if (!inputArg) {
    console.error(
      'Usage: cascivo generate <config.json> [--out output.tsx] [--components-dir ./src/components/ui]',
    )
    process.exitCode = 1
    return
  }

  const { readFileSync } = await import('node:fs')
  const configJson = readFileSync(inputArg, 'utf-8')
  const viewConfig = JSON.parse(configJson) as ViewConfig

  // prop metas not available from CLI registry type — pass empty map
  const _registry = await fetchRegistry(config.registry)
  const propMetas = new Map<string, PropMeta[]>()

  const componentsDir = componentsDirArg ?? config.outputDir ?? './src/components/ui'
  const tsx = generateTsx(viewConfig, propMetas, componentsDir)

  const outPath = outArg ?? join(dirname(inputArg), `${basename(inputArg, '.json')}.tsx`)

  writeFileSync(outPath, tsx, 'utf-8')
  console.log(`Generated ${outPath}`)

  // Try to format with vp fmt or prettier
  try {
    const { spawnSync } = await import('node:child_process')
    const fmtResult = spawnSync('pnpm', ['exec', 'vp', 'fmt', outPath], {
      encoding: 'utf8',
      stdio: 'inherit',
    })
    if (fmtResult.status !== 0) {
      const prettyResult = spawnSync('npx', ['--yes', 'prettier', '--write', outPath], {
        encoding: 'utf8',
        stdio: 'inherit',
      })
      if (prettyResult.status !== 0) {
        console.log('(Note: formatter not found — output may need manual formatting)')
      }
    }
  } catch {
    // formatting is best-effort
  }
}
