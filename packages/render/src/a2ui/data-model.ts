import { batch, computed, signal } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import { A2uiPathError, getAt, parsePointer, setAt } from './pointer'

export interface DataModel {
  readonly root: ReadonlySignal<unknown>
  /** Absolute path only; one cached computed per path. */
  read(path: string): ReadonlySignal<unknown>
  /** `undefined` and `null` delete; `''` or `'/'` replace the whole model. */
  write(path: string, value: unknown): void
  snapshot(): unknown
}

const DEFAULT_MAX_NODES = 10_000

function countNodes(value: unknown, max: number): number {
  let count = 0
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const cur = stack.pop()
    if (++count > max) return count
    if (typeof cur === 'object' && cur !== null) {
      for (const child of Object.values(cur)) stack.push(child)
    }
  }
  return count
}

export function createDataModel(initial?: unknown, limits?: { maxNodes: number }): DataModel {
  const maxNodes = limits?.maxNodes ?? DEFAULT_MAX_NODES
  const root = signal<unknown>(initial)
  // Unbounded by design: one entry per distinct path a surface binds.
  const reads = new Map<string, ReadonlySignal<unknown>>()

  const absolute = (path: string): string[] => {
    if (path !== '' && !path.startsWith('/')) {
      throw new A2uiPathError(`path "${path}" must be absolute`)
    }
    return parsePointer(path)
  }

  return {
    root,
    read(path) {
      const hit = reads.get(path)
      if (hit) return hit
      const segments = absolute(path)
      const made = computed(() => getAt(root.value, segments))
      reads.set(path, made)
      return made
    },
    write(path, value) {
      const segments = absolute(path)
      const next = value === null ? undefined : value
      if (countNodes(next, maxNodes) > maxNodes) throw new A2uiPathError('limit')
      batch(() => {
        root.value = setAt(root.peek(), segments, next)
      })
    },
    snapshot() {
      return root.peek()
    },
  }
}
