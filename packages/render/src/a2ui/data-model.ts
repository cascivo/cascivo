import { batch, computed, signal } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import { A2uiPathError, getAt, parsePointer, setAt } from './pointer'

export interface DataModel {
  readonly root: ReadonlySignal<unknown>
  /** Absolute path only; one cached computed per path. */
  read(path: string): ReadonlySignal<unknown>
  /**
   * `undefined` and `null` delete; `''` or `'/'` replace the whole model with an object.
   * Throws `A2uiPathError` for a bad path, `A2uiDataError` for a value it refuses.
   */
  write(path: string, value: unknown): void
  /** The whole model; `{}` while it is empty. */
  snapshot(): unknown
}

const DEFAULT_MAX_NODES = 10_000

/** A write the model refuses for its value, not its path; `code` is the A2UI error code. */
export class A2uiDataError extends Error {
  readonly code: 'LIMIT_EXCEEDED' | 'INVALID_VALUE'
  constructor(code: 'LIMIT_EXCEEDED' | 'INVALID_VALUE', message: string) {
    super(message)
    this.name = 'A2uiDataError'
    this.code = code
  }
}

const isObject = (v: unknown): boolean => typeof v === 'object' && v !== null && !Array.isArray(v)

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
      // client_data_model.json: each surface's model is an object, so the root is one or empty.
      if (segments.length === 0 && next !== undefined && !isObject(next)) {
        throw new A2uiDataError('INVALID_VALUE', 'The data model root must be an object.')
      }
      if (countNodes(next, maxNodes) > maxNodes) {
        throw new A2uiDataError('LIMIT_EXCEEDED', `At most ${maxNodes} JSON nodes per value.`)
      }
      batch(() => {
        root.value = setAt(root.peek(), segments, next)
      })
    },
    snapshot() {
      return root.peek() ?? {}
    },
  }
}
