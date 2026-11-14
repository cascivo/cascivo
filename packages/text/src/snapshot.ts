/**
 * A live DOM subtree → a flat JSON list of the nodes an agent can operate.
 *
 * Read-only by design: the snapshot names what exists and which actions fit it; acting (and
 * gating that act) belongs to the caller. Refs come from a module-level WeakMap so the same
 * element keeps the same ref across calls and re-renders for as long as it stays mounted.
 *
 * Duck-typed like `from-dom.ts`: no `instanceof HTMLElement`, so importing this from the
 * serializer entry costs a bare Node process nothing.
 */

export type SnapshotAction = 'setValue' | 'clear' | 'press' | 'select' | 'close'

export interface SnapshotOption {
  value: string
  label: string
}

export interface SnapshotNode {
  ref: string
  role: string
  label: string
  value?: string
  checked?: boolean
  expanded?: boolean
  disabled?: boolean
  confirm?: boolean
  options?: SnapshotOption[]
  actions: SnapshotAction[]
}

export interface Snapshot {
  nodes: SnapshotNode[]
  /** True when the 200-node cap cut the list short. */
  truncated: boolean
}

export const SNAPSHOT_LIMIT = 200
export const REDACTED = '[redacted]'

const refs = new WeakMap<Element, string>()
let counter = 0

function refFor(el: Element): string {
  let ref = refs.get(el)
  if (ref === undefined) {
    ref = `e${++counter}`
    refs.set(el, ref)
  }
  return ref
}

const ACTIONS: Record<string, SnapshotAction[]> = {
  textbox: ['setValue', 'clear'],
  button: ['press'],
  link: ['press'],
  tab: ['press'],
  menuitem: ['press'],
  checkbox: ['press'],
  switch: ['press'],
  radio: ['press'],
  combobox: ['select'],
  listbox: ['select'],
  slider: ['setValue'],
  dialog: ['close'],
}

const NON_TEXT_INPUT = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'reset',
  'image',
  'range',
  'file',
])
const SECRET_AUTOCOMPLETE = /^(one-time-code|cc-|current-password|new-password)/

function roleOf(el: Element): string | undefined {
  const explicit = el.getAttribute('role')
  if (explicit !== null && explicit in ACTIONS) return explicit
  const tag = el.tagName.toLowerCase()
  if (tag === 'button') return 'button'
  if (tag === 'a' && el.hasAttribute('href')) return 'link'
  if (tag === 'select') return 'combobox'
  if (tag === 'textarea') return 'textbox'
  if (tag === 'dialog') return 'dialog'
  if (tag === 'input') {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase()
    if (type === 'checkbox' || type === 'radio') return type
    if (type === 'range') return 'slider'
    if (type === 'button' || type === 'submit' || type === 'reset') return 'button'
    if (!NON_TEXT_INPUT.has(type) && type !== 'hidden') return 'textbox'
  }
  return undefined
}

function isSecret(el: Element): boolean {
  if (el.hasAttribute('data-agent-secret')) return true
  if (el.tagName.toLowerCase() !== 'input') return false
  if ((el.getAttribute('type') ?? '').toLowerCase() === 'password') return true
  return SECRET_AUTOCOMPLETE.test(el.getAttribute('autocomplete') ?? '')
}

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/** Own text of a label, minus any control nested in it (so `Plan<select>` reads "Plan"). */
function labelText(label: Element): string {
  const copy = label.cloneNode(true) as Element
  copy.querySelectorAll('input,select,textarea,button').forEach((c) => c.remove())
  return clean(copy.textContent)
}

function labelOf(el: Element, root: Element): string {
  const aria = clean(el.getAttribute('aria-label'))
  if (aria !== '') return aria
  const by = el.getAttribute('aria-labelledby')
  if (by !== null) {
    const doc = el.ownerDocument
    const text = by
      .split(/\s+/)
      .map((id) => clean(doc.getElementById(id)?.textContent))
      .filter((s) => s !== '')
      .join(' ')
    if (text !== '') return text
  }
  const id = el.getAttribute('id')
  if (id !== null && id !== '') {
    for (const l of Array.from(root.ownerDocument.querySelectorAll('label'))) {
      if (l.getAttribute('for') === id) {
        const t = labelText(l)
        if (t !== '') return t
      }
    }
  }
  const wrap = el.closest('label')
  if (wrap !== null) {
    const t = labelText(wrap)
    if (t !== '') return t
  }
  const tag = el.tagName.toLowerCase()
  if (tag === 'button' || tag === 'a' || el.hasAttribute('role')) {
    const t = clean(el.textContent)
    if (t !== '') return t
  }
  return clean(el.getAttribute('placeholder')) || clean(el.getAttribute('title'))
}

function optionsOf(el: Element): SnapshotOption[] | undefined {
  const tag = el.tagName.toLowerCase()
  const opts =
    tag === 'select'
      ? Array.from(el.querySelectorAll('option'))
      : Array.from(el.querySelectorAll('[role="option"]'))
  if (opts.length === 0) return undefined
  return opts.map((o) => {
    const label = clean(o.textContent)
    const value = (o as unknown as { value?: unknown }).value
    return {
      value:
        tag === 'select' && typeof value === 'string'
          ? value
          : (o.getAttribute('data-value') ?? label),
      label,
    }
  })
}

function describe(el: Element, role: string, root: Element): SnapshotNode {
  const node: SnapshotNode = {
    ref: refFor(el),
    role,
    label: labelOf(el, root),
    actions: [...(ACTIONS[role] ?? [])],
  }
  const live = el as unknown as { value?: unknown; checked?: unknown; disabled?: unknown }
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    if (
      typeof live.value === 'string' &&
      role !== 'checkbox' &&
      role !== 'radio' &&
      role !== 'button'
    ) {
      node.value = isSecret(el) ? REDACTED : live.value
    }
  }
  if (isSecret(el)) node.value = REDACTED
  if (role === 'checkbox' || role === 'radio' || role === 'switch') {
    const aria = el.getAttribute('aria-checked')
    node.checked = tag === 'input' ? live.checked === true : aria === 'true'
  }
  const expanded = el.getAttribute('aria-expanded')
  if (expanded !== null) node.expanded = expanded === 'true'
  if (live.disabled === true || el.getAttribute('aria-disabled') === 'true') node.disabled = true
  if (el.hasAttribute('data-agent-confirm')) node.confirm = true
  if (role === 'combobox' || role === 'listbox') {
    const options = optionsOf(el)
    if (options !== undefined) node.options = options
  }
  return node
}

/** List the operable nodes under `root`, in document order, capped at {@link SNAPSHOT_LIMIT}. */
export function snapshot(root: Element): Snapshot {
  const nodes: SnapshotNode[] = []
  let truncated = false

  const walk = (el: Element): void => {
    if (truncated || el.hasAttribute('data-agent-hidden')) return
    const role = roleOf(el)
    if (role !== undefined) {
      if (nodes.length >= SNAPSHOT_LIMIT) {
        truncated = true
        return
      }
      nodes.push(describe(el, role, root))
    }
    for (const child of Array.from(el.children)) walk(child)
  }
  walk(root)
  return { nodes, truncated }
}
