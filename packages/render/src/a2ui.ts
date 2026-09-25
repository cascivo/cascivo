import type { ComponentNode, PropValue, ViewConfig } from './types'

/** One entry of an A2UI v0.9 `updateComponents.components` list. */
export interface A2uiComponent {
  id: string
  component: string
  [prop: string]: unknown
}

/** The A2UI catalog cascivo's components are described by. */
export const A2UI_CATALOG_ID = 'https://cascivo.com/a2ui/v0_9/catalog.json'

// Properties every A2UI component may carry that are not component props.
const RESERVED = new Set(['id', 'component', 'children', 'text', 'accessibility', 'weight'])

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A2UI binds with a JSON Pointer (`/user/name`); a view binds with `$data.user.name`. */
function dataRef(pointer: string): `$data.${string}` {
  const path = pointer
    .replace(/^\//, '')
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .join('.')
  return `$data.${path}`
}

/**
 * Turn an A2UI v0.9 surface — its flat, id-linked component list — into a view
 * `<CascivoView>` renders, against the catalog at `A2UI_CATALOG_ID`.
 *
 * - `{ "path": "/…" }` values become `bind`s to host data, so pass the surface's data model as
 *   `<CascivoView data>`.
 * - An `{ "event": { "name": "save" } }` action on an event prop becomes `$actions.save`, so
 *   pass the handlers as `<CascivoView actions>`.
 * - `text` becomes the node's text children.
 *
 * Throws on what has no view equivalent — a missing `root`, an unknown child id, a function
 * call, a templated child list — naming the component, so an agent can be told what to fix.
 */
export function fromA2UI(components: readonly A2uiComponent[]): ViewConfig {
  const byId = new Map(components.map((c) => [c.id, c]))
  const visiting = new Set<string>()

  function convert(id: string): ComponentNode {
    const source = byId.get(id)
    if (!source) throw new Error(`A2UI: no component has id "${id}"`)
    if (visiting.has(id)) throw new Error(`A2UI: component "${id}" contains itself`)
    visiting.add(id)
    const node: ComponentNode = { component: source.component }
    const props: Record<string, PropValue> = {}
    const bind: NonNullable<ComponentNode['bind']> = {}
    const events: NonNullable<ComponentNode['events']> = {}

    for (const [key, value] of Object.entries(source)) {
      if (RESERVED.has(key)) continue
      if (isObject(value) && typeof value['path'] === 'string') {
        bind[key] = dataRef(value['path'])
      } else if (isObject(value) && isObject(value['event'])) {
        const name = value['event']['name']
        if (typeof name !== 'string') throw new Error(`A2UI: "${id}".${key} has no event name`)
        events[key] = `$actions.${name}`
      } else if (isObject(value) && ('call' in value || 'functionCall' in value)) {
        throw new Error(`A2UI: "${id}".${key} is a function call, which cascivo does not run`)
      } else {
        props[key] = value as PropValue
      }
    }

    if (Object.keys(props).length) node.props = props
    if (Object.keys(bind).length) node.bind = bind
    if (Object.keys(events).length) node.events = events

    const children = source['children']
    if (Array.isArray(children)) {
      node.children = children.map((child) => {
        if (typeof child !== 'string') throw new Error(`A2UI: "${id}".children must be ids`)
        return convert(child)
      })
    } else if (children !== undefined) {
      throw new Error(`A2UI: "${id}".children is a template; cascivo takes a list of ids`)
    } else if (typeof source['text'] === 'string') {
      node.children = source['text']
    }
    visiting.delete(id)
    return node
  }

  if (!byId.has('root')) throw new Error('A2UI: the surface has no component with id "root"')
  return { version: 1, view: { regions: { main: [convert('root')] } } }
}
