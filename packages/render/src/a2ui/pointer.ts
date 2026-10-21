export class A2uiPathError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'A2uiPathError'
  }
}

// Written by an untrusted agent: these would walk to Object.prototype.
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor'])
const INDEX = /^(0|[1-9]\d*)$/

/** `/a/b` stays absolute; a relative path is joined to the template scope. */
export function resolvePath(path: string, scope: string): string {
  if (path === '' || path.startsWith('/')) return path
  if (scope === '' || scope === '/') {
    throw new A2uiPathError(`relative path "${path}" outside a template scope`)
  }
  return `${scope.replace(/\/$/, '')}/${path}`
}

function assertSafe(segment: string): void {
  if (FORBIDDEN.has(segment)) throw new A2uiPathError(`forbidden path segment "${segment}"`)
}

/** RFC 6901 unescape; `''` and `'/'` are the root. */
export function parsePointer(path: string): string[] {
  if (path === '' || path === '/') return []
  if (!path.startsWith('/')) throw new A2uiPathError(`path "${path}" is not absolute`)
  return path
    .slice(1)
    .split('/')
    .map((raw) => {
      const segment = raw.replace(/~1/g, '/').replace(/~0/g, '~')
      assertSafe(segment)
      return segment
    })
}

const isContainer = (v: unknown): v is Record<string, unknown> | unknown[] =>
  typeof v === 'object' && v !== null

export function getAt(root: unknown, segments: readonly string[]): unknown {
  let cur = root
  for (const segment of segments) {
    if (!isContainer(cur)) return undefined
    if (Array.isArray(cur)) {
      if (!INDEX.test(segment)) return undefined
      cur = cur[Number(segment)]
    } else {
      // Own keys only, so `toString` and friends never leak out of the model.
      if (!Object.hasOwn(cur, segment)) return undefined
      cur = cur[segment]
    }
  }
  return cur
}

/** Immutable upsert/delete with structural sharing; `value === undefined` deletes. */
export function setAt(root: unknown, segments: readonly string[], value: unknown): unknown {
  const [head, ...rest] = segments
  if (head === undefined) return value
  assertSafe(head)

  if (Array.isArray(root)) {
    if (!INDEX.test(head)) throw new A2uiPathError(`"${head}" is not an array index`)
    const index = Number(head)
    if (index > root.length) throw new A2uiPathError(`index ${index} is past the end of the array`)
    // Deleting at the end has nothing to clear.
    if (value === undefined && index === root.length) return root
    const child = setAt(root[index], rest, value)
    if (child === root[index] && index < root.length) return root
    const next = root.slice()
    next[index] = child
    return next
  }

  // Arrays returned above, so a container here is a plain object.
  const obj = (isContainer(root) ? root : {}) as Record<string, unknown>
  const has = Object.hasOwn(obj, head)
  if (value === undefined && !has) return root
  const child = setAt(has ? obj[head] : undefined, rest, value)
  if (has && child === obj[head]) return root
  const next = { ...obj }
  if (rest.length === 0 && value === undefined) delete next[head]
  else next[head] = child
  return next
}
