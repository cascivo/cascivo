import { diff } from './sync.ts'

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

interface Selection {
  start: number
  end: number
}

/**
 * One recorded edit, stored as the **span it changed** rather than the document it
 * produced: undo puts `removed` back over `inserted`, redo does the reverse. The
 * stack therefore grows with what was edited, not with the document — 200 edits to
 * a 2.7 MB file used to retain 200 copies of it (~550 MB); as spans they retain a
 * few hundred bytes.
 */
interface Step {
  from: number
  removed: string
  inserted: string
  /** Selection in the state before the edit (what undo restores). */
  before: Selection
  /** Selection in the state after the edit (what redo restores). */
  after: Selection
}

/**
 * Copy a span out of the document so the step does not pin the document alive.
 * `String.prototype.slice` returns a *view* onto its source in V8 (for anything
 * beyond a dozen characters), so a 300-char span stored as-is would keep the whole
 * multi-megabyte text it was cut from reachable for as long as the step lives —
 * which is exactly the retention this representation exists to avoid.
 * `structuredClone` yields a string with its own storage.
 */
function detach(span: string): string {
  return span.length === 0 ? span : structuredClone(span)
}

function makeStep(prev: string, next: Snapshot, before: Selection): Step {
  const change = diff(prev, next.text)
  return {
    from: change.from,
    removed: detach(prev.slice(change.from, change.to)),
    inserted: detach(change.insert),
    before,
    after: { start: next.selectionStart, end: next.selectionEnd },
  }
}

/** The text before `step` was applied to `text`. */
function unapply(text: string, step: Step): string {
  return text.slice(0, step.from) + step.removed + text.slice(step.from + step.inserted.length)
}

/** The text after `step` is applied to `text`. */
function apply(text: string, step: Step): string {
  return text.slice(0, step.from) + step.inserted + text.slice(step.from + step.removed.length)
}

/** Create an owned history bounded to `capacity` snapshots (oldest dropped). */
export function createHistory(capacity = 200): History {
  // `capacity` counts states; the seed state is one of them, so the stack holds one
  // step fewer than that.
  const maxSteps = Math.max(1, capacity - 1)
  let steps: Step[] = []
  // Number of applied steps: `steps[index - 1]` is the tip, `steps[index]` the redo.
  let index = 0
  // The text and selection at the current position, kept so a `record` can be
  // diffed and an `undo`/`redo` can be applied without a stored copy per state.
  let current = ''
  let selection: Selection = { start: 0, end: 0 }
  // Whether the tip step came from a coalescing edit (so the next coalescing edit
  // folds into it instead of pushing a new step).
  let tipCoalesced = false

  const snapshot = (): Snapshot => ({
    text: current,
    selectionStart: selection.start,
    selectionEnd: selection.end,
  })

  return {
    record(next, opts) {
      const coalesce = opts?.coalesce ?? false
      // A new edit invalidates any redo tail.
      if (index < steps.length) steps = steps.slice(0, index)

      const tip = steps[index - 1]
      if (coalesce && tipCoalesced && tip) {
        // Fold the typing run into the current step: re-diff from the state the
        // tip started at, so one undo reverts the whole run.
        steps[index - 1] = makeStep(unapply(current, tip), next, tip.before)
      } else {
        steps.push(makeStep(current, next, selection))
        index = steps.length
        if (steps.length > maxSteps) {
          steps.shift()
          index--
        }
      }
      current = next.text
      selection = { start: next.selectionStart, end: next.selectionEnd }
      tipCoalesced = coalesce
    },

    undo() {
      if (index === 0) return undefined
      const step = steps[--index] as Step
      current = unapply(current, step)
      selection = step.before
      tipCoalesced = false
      return snapshot()
    },

    redo() {
      if (index >= steps.length) return undefined
      const step = steps[index++] as Step
      current = apply(current, step)
      selection = step.after
      tipCoalesced = false
      return snapshot()
    },

    reset(next) {
      steps = []
      index = 0
      current = next.text
      selection = { start: next.selectionStart, end: next.selectionEnd }
      tipCoalesced = false
    },

    canUndo() {
      return index > 0
    },

    canRedo() {
      return index < steps.length
    },
  }
}
