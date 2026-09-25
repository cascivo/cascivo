import { validateView, type ValidationError } from './validate'

export interface PartialValidation {
  /** The text was a complete JSON document. */
  complete: boolean
  /** No errors so far. For an incomplete view this means "nothing wrong yet". */
  valid: boolean
  errors: ValidationError[]
  /** The view parsed from the complete prefix, for progressive rendering; `undefined` if none yet. */
  view: unknown
}

type Container =
  | { kind: 'object'; expect: 'key' | 'colon' | 'value' | 'next' }
  | {
      kind: 'array'
      expect: 'value' | 'next'
    }

/**
 * The longest prefix of `text` that ends on a finished value, closed into valid JSON.
 *
 * A cut only ever lands after a whole value, never inside a string, number or literal, so a
 * half-streamed `"variant": "prim` is dropped with its key instead of reaching the validator as
 * the bogus value `"prim"`.
 */
function completePrefix(text: string): string | undefined {
  const stack: Container[] = []
  let safe: { end: number; closers: string } | undefined
  let inString = false
  let escaped = false
  let stringIsKey = false
  let scalarStart = -1

  const closers = () =>
    stack
      .map((c) => (c.kind === 'object' ? '}' : ']'))
      .reverse()
      .join('')
  const markSafe = (end: number) => {
    safe = { end, closers: closers() }
  }
  // A value just finished at `end`: advance the parent and record a cut point.
  const valueDone = (end: number) => {
    const top = stack.at(-1)
    if (!top) {
      safe = { end, closers: '' }
      return
    }
    top.expect = 'next'
    markSafe(end)
  }
  const endScalar = (end: number) => {
    if (scalarStart >= 0) {
      scalarStart = -1
      valueDone(end)
    }
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') {
        inString = false
        if (stringIsKey) {
          const top = stack.at(-1)
          if (top?.kind === 'object') top.expect = 'colon'
        } else valueDone(i + 1)
      }
      continue
    }
    if (scalarStart >= 0 && /[\s,\]}:]/.test(ch)) endScalar(i)
    const top = stack.at(-1)
    switch (ch) {
      case '"':
        inString = true
        stringIsKey = top?.kind === 'object' && top.expect === 'key'
        break
      case '{':
        stack.push({ kind: 'object', expect: 'key' })
        markSafe(i + 1)
        break
      case '[':
        stack.push({ kind: 'array', expect: 'value' })
        markSafe(i + 1)
        break
      case '}':
      case ']':
        stack.pop()
        valueDone(i + 1)
        break
      case ':':
        if (top?.kind === 'object') top.expect = 'value'
        break
      case ',':
        if (top) top.expect = top.kind === 'object' ? 'key' : 'value'
        break
      default:
        if (!/\s/.test(ch) && scalarStart < 0) scalarStart = i
    }
  }
  return safe && text.slice(0, safe.end) + safe.closers
}

/** The path of every node on the last-open branch: the ones still being streamed. */
function frontier(view: unknown): Set<string> {
  const paths = new Set<string>()
  const regions = (view as { view?: { regions?: unknown } } | null)?.view?.regions
  if (typeof regions !== 'object' || regions === null) return paths
  const last = Object.entries(regions).at(-1)
  if (!last || !Array.isArray(last[1]) || last[1].length === 0) return paths
  let path = `view.regions.${last[0]}[${last[1].length - 1}]`
  let node: unknown = last[1].at(-1)
  for (;;) {
    paths.add(path)
    const children = (node as { children?: unknown } | null)?.children
    if (!Array.isArray(children) || children.length === 0) return paths
    path = `${path}.children[${children.length - 1}]`
    node = children.at(-1)
  }
}

/**
 * Validate a view while it is still being streamed.
 *
 * An agent emitting a view token by token can be checked as it goes: an unknown component or
 * prop is reported the moment it is complete, instead of after the whole document arrives.
 * Errors that only mean "not arrived yet" — no `view` so far, a node whose `component` key has
 * not streamed — are held back until the text is complete. `view` is the parsed prefix, which
 * `CascivoView` can render as it grows.
 */
export function validatePartialView(text: string): PartialValidation {
  try {
    const view: unknown = JSON.parse(text)
    return { complete: true, ...validateView(view), view }
  } catch {
    // Not complete yet — validate the longest finished prefix.
  }
  const prefix = completePrefix(text)
  if (prefix === undefined) return { complete: false, valid: true, errors: [], view: undefined }
  const view: unknown = JSON.parse(prefix)
  const open = frontier(view)
  const errors = validateView(view).errors.filter((e) => {
    if (e.path === 'view' || e.path === 'view.regions') return false
    // A node still streaming may not have its `component` key yet; any other error on it —
    // an unknown name, a bad prop — is about content that has fully arrived.
    const node = e.path.endsWith('.component') ? e.path.slice(0, -'.component'.length) : e.path
    const notArrived =
      e.message === 'component must be a string' || e.message === 'Expected a component node object'
    return !(notArrived && open.has(node))
  })
  return { complete: false, valid: errors.length === 0, errors, view }
}
