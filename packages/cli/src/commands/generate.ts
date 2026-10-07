import { writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import type { CascadeConfig } from '../utils/config.js'

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
  state?: Record<string, string | number | boolean | null>
  view: {
    regions: Record<string, ComponentNode[]>
  }
}

/**
 * Sub-components installed into another component's registry directory. Every other name
 * resolves to its own kebab-case directory (`DataTable` → `data-table`); `generate.test.ts`
 * checks both rules against `registry.json`, so a new exception fails there, not in an
 * adopter's build.
 */
const OWNER_DIRECTORY: Record<string, string> = {
  AppFrame: 'app-shell',
  GridItem: 'grid',
  RadioCardGroup: 'radio-card',
}

/** The registry directory `cascivo add` installs `component` into. */
export function componentDirectory(component: string): string {
  return (
    OWNER_DIRECTORY[component] ?? component.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  )
}

// Everything below is interpolated into TSX source, so the parser admits only names that
// cannot break out of their position: identifiers for components, props and state keys,
// dotted identifier paths for refs and translation keys.
const COMPONENT_RE = /^[A-Z][A-Za-z0-9]*$/
const PROP_RE = /^[A-Za-z_$][\w$]*(?:-[\w$]+)*$/
const IDENT_RE = /^[A-Za-z_$][\w$]*$/
const REF_RE =
  /^\$(?:data|actions|state|state\.set|state\.toggle)\.[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/
const KEY_RE = /^[\w-]+(?:\.[\w-]+)*$/

function fail(path: string, message: string): never {
  throw new Error(`Invalid ViewConfig at ${path}: ${message}`)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseRefs(raw: unknown, path: string): Record<string, string> {
  if (!isRecord(raw)) fail(path, 'expected an object')
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!PROP_RE.test(k)) fail(`${path}.${k}`, 'not a valid prop name')
    if (typeof v !== 'string' || !REF_RE.test(v)) {
      fail(`${path}.${k}`, 'expected a "$data.*", "$actions.*" or "$state.*" reference')
    }
    out[k] = v
  }
  return out
}

function parseTranslationRef(raw: Record<string, unknown>, path: string): { $t: string } {
  if (typeof raw.$t !== 'string' || !KEY_RE.test(raw.$t)) fail(`${path}.$t`, 'invalid key')
  return { $t: raw.$t }
}

function parseNode(raw: unknown, path: string): ComponentNode {
  if (!isRecord(raw)) fail(path, 'expected a component node object')
  const { component, props, bind, events, children } = raw
  if (typeof component !== 'string' || !COMPONENT_RE.test(component)) {
    fail(`${path}.component`, 'expected a PascalCase component name')
  }
  const node: ComponentNode = { component }
  if (props !== undefined) {
    if (!isRecord(props)) fail(`${path}.props`, 'expected an object')
    for (const [k, v] of Object.entries(props)) {
      if (!PROP_RE.test(k)) fail(`${path}.props.${k}`, 'not a valid prop name')
      if (isRecord(v) && '$t' in v) props[k] = parseTranslationRef(v, `${path}.props.${k}`)
    }
    node.props = props
  }
  if (bind !== undefined) node.bind = parseRefs(bind, `${path}.bind`)
  if (events !== undefined) node.events = parseRefs(events, `${path}.events`)
  if (children !== undefined) {
    if (typeof children === 'string') node.children = children
    else if (Array.isArray(children)) {
      node.children = children.map((c, i) => parseNode(c, `${path}.children[${i}]`))
    } else if (isRecord(children) && '$t' in children) {
      node.children = parseTranslationRef(children, `${path}.children`)
    } else fail(`${path}.children`, 'expected a string, a node array or a { $t } reference')
  }
  return node
}

/** Parse an untrusted ViewConfig (model output, a file) into one that is safe to emit as TSX. */
export function parseViewConfig(raw: unknown): ViewConfig {
  if (!isRecord(raw)) fail('$', 'expected an object')
  const { state, view } = raw
  const config: ViewConfig = { view: { regions: {} } }
  if (state !== undefined) {
    if (!isRecord(state)) fail('state', 'expected an object')
    const parsed: NonNullable<ViewConfig['state']> = {}
    for (const [k, v] of Object.entries(state)) {
      if (!IDENT_RE.test(k)) fail(`state.${k}`, 'not a valid identifier')
      if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        parsed[k] = v
      } else fail(`state.${k}`, 'expected a string, number, boolean or null')
    }
    config.state = parsed
  }
  if (!isRecord(view) || !isRecord(view.regions)) fail('view.regions', 'expected an object')
  for (const [name, nodes] of Object.entries(view.regions)) {
    if (!/^[\w-]+$/.test(name)) fail(`view.regions.${name}`, 'not a valid region name')
    if (!Array.isArray(nodes)) fail(`view.regions.${name}`, 'expected an array of nodes')
    config.view.regions[name] = nodes.map((n, i) => parseNode(n, `view.regions.${name}[${i}]`))
  }
  return config
}

function isTranslationRef(v: unknown): v is { $t: string } {
  return typeof v === 'object' && v !== null && '$t' in v
}

/** A JS literal for a state initial value. */
function serializeInitial(value: string | number | boolean | null): string {
  return typeof value === 'string' ? `'${value.replace(/'/g, "\\'")}'` : String(value)
}

function serializeProp(value: unknown): string {
  // A JSX attribute string has no escapes, so anything holding a quote goes through an
  // expression instead.
  if (typeof value === 'string')
    return value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`
  if (typeof value === 'number' || typeof value === 'boolean') return `{${value}}`
  if (value === null) return `{null}`
  if (isTranslationRef(value)) return `{${JSON.stringify(value.$t)}} {/* i18n: ${value.$t} */}`
  return `{${JSON.stringify(value)}}`
}

function renderChildren(
  children: ComponentNode['children'],
  indent: string,
  componentPropNames: string[],
  knownComponents: Set<string>,
): string {
  if (children === undefined) return ''
  // Text with JSX syntax in it (`{`, `<`) would be parsed as code; emit it as a string literal.
  if (typeof children === 'string') {
    return /[{}<>]/.test(children) ? `{${JSON.stringify(children)}}` : children
  }
  if (isTranslationRef(children)) return `{/* i18n: ${children.$t} */}`
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
      if (ref.startsWith('$state.')) {
        propParts.push(`${k}={${ref.slice('$state.'.length)}.value}`)
      } else {
        propParts.push(`${k}={data.${ref.replace(/^\$data\./, '')}}`)
      }
    }
  }

  if (node.events) {
    for (const [k, ref] of Object.entries(node.events)) {
      if (ref.startsWith('$state.set.')) {
        const key = ref.slice('$state.set.'.length)
        propParts.push(`${k}={(e) => (${key}.value = coerceValue(e))}`)
      } else if (ref.startsWith('$state.toggle.')) {
        const key = ref.slice('$state.toggle.'.length)
        propParts.push(`${k}={() => (${key}.value = !${key}.value)}`)
      } else {
        propParts.push(`${k}={actions.${ref.replace(/^\$actions\./, '')}}`)
      }
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
        if (ref.startsWith('$state.')) continue // view-local state, not a host-data prop
        const path = ref.replace(/^\$data\./, '')
        if (!boundProps.includes(path)) boundProps.push(path)
      }
    }
    if (node.events) {
      for (const ref of Object.values(node.events)) {
        if (ref.startsWith('$state.')) continue // state writer, not a host action
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

/** True if any node writes state via "$state.set.*" (needs the coerceValue helper). */
function usesStateSetter(nodes: ComponentNode[]): boolean {
  const walk = (node: ComponentNode): boolean => {
    if (node.events && Object.values(node.events).some((r) => r.startsWith('$state.set.'))) {
      return true
    }
    return Array.isArray(node.children) ? node.children.some(walk) : false
  }
  return nodes.some(walk)
}

/**
 * Where components are imported from: `dir` is the copy-paste components directory (one
 * import per registry directory), `package` a prebuilt package such as `@cascivo/react`.
 */
export type ImportSource = { dir: string } | { package: string }

function importLines(components: Set<string>, source: ImportSource): string {
  const names = [...components].sort()
  if ('package' in source) return `import { ${names.join(', ')} } from '${source.package}'`
  const byDirectory = new Map<string, string[]>()
  for (const name of names) {
    const directory = componentDirectory(name)
    byDirectory.set(directory, [...(byDirectory.get(directory) ?? []), name])
  }
  return [...byDirectory]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([directory, members]) =>
        `import { ${members.join(', ')} } from '${source.dir}/${directory}'`,
    )
    .join('\n')
}

export function generateTsx(
  config: ViewConfig,
  _propMetas: Map<string, PropMeta[]>,
  source: ImportSource,
): string {
  const knownComponents = new Set<string>()
  const allNodes = Object.values(config.view.regions).flat()
  const { boundProps, actionProps } = collectBindAndEvents(allNodes)
  const stateEntries = Object.entries(config.state ?? {})
  const hasState = stateEntries.length > 0
  const needsCoerce = usesStateSetter(allNodes)

  const regionBlocks = Object.entries(config.view.regions)
    .map(([regionName, nodes]) => {
      const rendered = nodes.map((n) => renderNode(n, '      ', [], knownComponents)).join('\n')
      return `    <div className="region-${regionName}">\n${rendered}\n    </div>`
    })
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

  const coreImport = hasState ? "\nimport { useSignal, useSignals } from '@cascivo/core'" : ''
  const coerceHelper = needsCoerce
    ? `
/** Unwrap a DOM event into the value a state setter should store. */
function coerceValue(e: unknown) {
  const t = (e as { target?: { type?: string; checked?: boolean; value?: unknown } })?.target
  if (t) return t.type === 'checkbox' || t.type === 'radio' ? t.checked : t.value
  return e
}
`
    : ''
  const stateDecls = hasState
    ? '  useSignals()\n' +
      stateEntries.map(([k, v]) => `  const ${k} = useSignal(${serializeInitial(v)})`).join('\n') +
      '\n'
    : ''

  return `import React from 'react'${coreImport}
${importLines(knownComponents, source)}
${coerceHelper}
interface PageProps ${propsType}

export function GeneratedPage({ ${hasData ? 'data, ' : ''}${hasActions ? 'actions' : ''} }: PageProps) {
${stateDecls}  return (
    <div className="cascivo-view">
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
  const fromArg = args.find((_, i) => args[i - 1] === '--from')

  if (!inputArg) {
    console.error(
      'Usage: cascivo generate <config.json> [--out output.tsx] [--components-dir ./src/components/ui | --from @cascivo/react]',
    )
    process.exitCode = 1
    return
  }
  if (fromArg && componentsDirArg) {
    console.error('Pass --from or --components-dir, not both.')
    process.exitCode = 1
    return
  }

  const { readFileSync } = await import('node:fs')
  let viewConfig: ViewConfig
  try {
    const raw: unknown = JSON.parse(readFileSync(inputArg, 'utf-8'))
    viewConfig = parseViewConfig(raw)
  } catch (e) {
    console.error(`${inputArg}: ${e instanceof Error ? e.message : String(e)}`)
    process.exitCode = 1
    return
  }

  // Prop metas are not available from the CLI registry type, so this passes an empty map.
  // (There used to be a `fetchRegistry` call here whose result was discarded — a network
  // round-trip on every `cascivo generate` that fed nothing. `noUnusedLocals` surfaced it.)
  const propMetas = new Map<string, PropMeta[]>()

  const source: ImportSource = fromArg
    ? { package: fromArg }
    : { dir: componentsDirArg ?? config.outputDir ?? './src/components/ui' }
  const tsx = generateTsx(viewConfig, propMetas, source)

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
