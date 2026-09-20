/**
 * The one shape both inputs collapse to.
 *
 * Machine mode has two sources — an HTML string from `renderToStaticMarkup`, and a live DOM
 * subtree in the browser — and exactly one set of rules for turning a UI into Markdown.
 * Writing those rules twice would guarantee they drift, so both adapters build this tree and
 * `emit()` is the only thing that knows what a `<table>` or a checked checkbox means.
 *
 * `attrs` is deliberately a flat string map rather than a DOM-ish accessor: the live-DOM
 * adapter writes the *current* value of a control into it (`input.value`, not the `value`
 * attribute it was born with), which is the whole reason <TextView> can show what someone
 * has typed. By the time a tree exists, the distinction is already resolved.
 */
export interface TextNode {
  /** Lowercased tag name, or `#text` for a text node, or `#root` for the tree's root. */
  tag: string
  /** The text content — only ever non-empty on a `#text` node. */
  text: string
  attrs: Record<string, string>
  children: TextNode[]
}

export function element(
  tag: string,
  attrs: Record<string, string> = {},
  children: TextNode[] = [],
): TextNode {
  return { tag, text: '', attrs, children }
}

export function text(value: string): TextNode {
  return { tag: '#text', text: value, attrs: {}, children: [] }
}

/** `null` rather than `undefined` so a missing attribute reads the same as `getAttribute`. */
export function attr(node: TextNode, name: string): string | null {
  return node.attrs[name] ?? null
}

/** A boolean HTML attribute is present-or-absent; `disabled=""` is still disabled. */
export function hasAttr(node: TextNode, name: string): boolean {
  return name in node.attrs
}

/**
 * Marks a node the live-DOM adapter proved closed.
 *
 * `#` cannot appear in an attribute name parsed from markup, so this can never collide with
 * something an author wrote. It exists because "no `open` attribute" and "proved closed" are
 * different facts — see `dialog()` in emit.ts.
 */
export const CLOSED = '#closed'

/** Elements that never have children and never close. */
export const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

/** Elements whose content is text, not markup — a `<` inside them opens nothing. */
export const RAW_TEXT_TAGS = new Set(['script', 'style', 'textarea', 'title'])
