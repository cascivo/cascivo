import type { ViewConfig } from './validate.js'
import { validateView } from './validate.js'
import type { Registry } from './registry.js'
import { RENDERABLE, buildGrammar, formatGrammar } from './grammar.js'

interface ScaffoldViewInput {
  description: string
  components?: string[]
}

/** Pick sensible components from the registry matching keywords in description. */
function pickComponents(description: string, registry: Registry, explicit?: string[]): string[] {
  if (explicit && explicit.length > 0) return explicit.map((c) => c.toLowerCase())
  const d = description.toLowerCase()
  const candidates: string[] = []
  for (const entry of registry.components) {
    if (!RENDERABLE.has(entry.meta.name)) continue
    const name = entry.meta.name.toLowerCase()
    const tags = entry.tags.join(' ').toLowerCase()
    if (d.includes(name) || tags.split(' ').some((t) => d.includes(t))) {
      candidates.push(entry.meta.name)
    }
  }
  // Always add at least one component
  if (candidates.length === 0) candidates.push('Badge')
  return candidates.slice(0, 4)
}

function makeNode(
  componentName: string,
  registry: Registry,
): { component: string; props?: Record<string, string | number | boolean> } {
  const entry = registry.components.find(
    (c) => c.meta.name.toLowerCase() === componentName.toLowerCase(),
  )
  if (!entry) return { component: componentName }
  const props: Record<string, string | number | boolean> = {}
  for (const prop of entry.meta.props ?? []) {
    if (prop.required && prop.default !== undefined) {
      props[prop.name] = prop.default
    } else if (
      prop.default !== undefined &&
      ['string', 'number', 'boolean'].includes(typeof prop.default)
    ) {
      // Skip defaults that are complex
    }
  }
  return Object.keys(props).length > 0
    ? { component: entry.meta.name, props }
    : { component: entry.meta.name }
}

export function scaffoldView(
  input: ScaffoldViewInput,
  registry: Registry,
): {
  config: ViewConfig
  errors: { path: string; message: string }[]
  /** Bound-vocabulary grammar (v40 T1) for the scaffolded components, so a caller gets both a starter scaffold and the allowed props/enums to refine it. */
  grammar: string
} {
  const componentNames = pickComponents(input.description, registry, input.components)

  const config: ViewConfig = {
    $schema:
      'https://raw.githubusercontent.com/cascivo/cascivo/main/packages/render/schema/view.v1.json',
    version: 1,
    view: {
      regions: {
        main: componentNames.map((name) => makeNode(name, registry)),
      },
    },
  }

  const registryNames = new Set(registry.components.map((c) => c.meta.name))
  const { errors } = validateView(config, RENDERABLE, registryNames)
  const grammar = formatGrammar(buildGrammar(registry, componentNames))
  return { config, errors, grammar }
}
