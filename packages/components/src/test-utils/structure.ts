/**
 * Structural DOM serializer for the PR-blocking structure snapshot
 * (structure.test.tsx). It captures the *accessibility-relevant shape* of a
 * rendered component — element tag plus `role`, `aria-*`, and `data-state` /
 * `data-*` hooks — and deliberately drops classes, inline styles, and text.
 *
 * Why: the nightly pixel suite (apps/site/test/visual.spec.ts) catches visual
 * regressions but does not run on PRs (hosted-runner noise). This gives PRs a
 * fast, deterministic structural gate so an agent-authored change that silently
 * drops a landmark, a `role`, or an `aria-*` wiring fails with a readable tree
 * diff — without the churn of snapshotting classes/text.
 */

/** A normalized structural node: tag + accessibility-relevant attrs + children. */
export interface StructNode {
  tag: string
  attrs?: Record<string, string>
  children?: StructNode[]
}

// aria-* attributes whose *value* is a generated id (useId → ":r0:" etc.) —
// unstable across runs. We keep the attribute (the wiring is structural) but
// normalize the value so only its presence is asserted, not the volatile id.
// (`id`/`for` themselves are dropped entirely — see the keep-filter below.)
const ARIA_ID_REF_ATTRS = new Set([
  'aria-describedby',
  'aria-labelledby',
  'aria-controls',
  'aria-owns',
  'aria-activedescendant',
])

/** Keep only accessibility-relevant attributes; normalize volatile id refs. */
function normalizeAttrs(el: Element): Record<string, string> | undefined {
  const attrs: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name
    const keep =
      name === 'role' ||
      name === 'type' ||
      name === 'href' ||
      name.startsWith('aria-') ||
      name.startsWith('data-')
    if (!keep) continue
    attrs[name] = ARIA_ID_REF_ATTRS.has(name) ? '<id>' : attr.value
  }
  // href values are often placeholders; keep only whether it is present + a marker.
  if (attrs['href'] !== undefined) attrs['href'] = '<href>'
  return Object.keys(attrs).length > 0 ? sortKeys(attrs) : undefined
}

function sortKeys(obj: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of Object.keys(obj).sort()) out[k] = obj[k]!
  return out
}

/** Serialize an element subtree into a stable structural tree. */
export function structuralTree(el: Element): StructNode {
  const node: StructNode = { tag: el.tagName.toLowerCase() }
  const attrs = normalizeAttrs(el)
  if (attrs) node.attrs = attrs
  const children: StructNode[] = []
  for (const child of Array.from(el.children)) {
    children.push(structuralTree(child))
  }
  if (children.length > 0) node.children = children
  return node
}

/** Serialize a container's children (a render root may hold multiple roots). */
export function structuralRoots(container: Element): StructNode[] {
  return Array.from(container.children).map(structuralTree)
}
