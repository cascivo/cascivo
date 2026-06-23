/** A point-in-time editor state: document text plus the selection to restore with it. */
export interface Snapshot {
  text: string
  selectionStart: number
  selectionEnd: number
}

/**
 * An owned undo/redo stack. Unlike the browser's native textarea history (which is
 * wiped the moment `value` is set programmatically — the controlled/remote-sync
 * case), this survives external writes: callers `record` committed states and
 * `reset` on an external set, and `undo`/`redo` return the {@link Snapshot} to
 * apply (text **and** selection). Pure infrastructure — the component owns the DOM.
 */
export interface History {
  /** Push a committed state. `coalesce` folds a run of single-character typing into one undo step. */
  record(snapshot: Snapshot, opts?: { coalesce?: boolean }): void
  /** Move to and return the previous state, or `undefined` at the start. */
  undo(): Snapshot | undefined
  /** Move to and return the next state, or `undefined` at the tip. */
  redo(): Snapshot | undefined
  /** Re-seed the stack to a single state (mount, or an external `value` change). */
  reset(snapshot: Snapshot): void
  canUndo(): boolean
  canRedo(): boolean
}

/** Create an owned history bounded to `capacity` snapshots (oldest dropped). */
export function createHistory(capacity = 200): History {
  let stack: Snapshot[] = []
  let index = -1
  // Whether the entry at the tip came from a coalescing edit (so the next
  // coalescing edit replaces it instead of pushing a new step).
  let tipCoalesced = false

  return {
    record(snapshot, opts) {
      const coalesce = opts?.coalesce ?? false
      // A new edit invalidates any redo tail.
      if (index < stack.length - 1) stack = stack.slice(0, index + 1)

      if (coalesce && tipCoalesced && index >= 0) {
        stack[index] = snapshot // fold the typing run into the current step
      } else {
        stack.push(snapshot)
        index = stack.length - 1
        if (stack.length > capacity) {
          stack.shift()
          index--
        }
      }
      tipCoalesced = coalesce
    },

    undo() {
      if (index <= 0) return undefined
      index--
      tipCoalesced = false
      return stack[index]
    },

    redo() {
      if (index >= stack.length - 1) return undefined
      index++
      tipCoalesced = false
      return stack[index]
    },

    reset(snapshot) {
      stack = [snapshot]
      index = 0
      tipCoalesced = false
    },

    canUndo() {
      return index > 0
    },

    canRedo() {
      return index < stack.length - 1
    },
  }
}
