'use client'
import { cn, useControllableSignal, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { getGrammar } from '../../engine/registry.ts'
import { tokenizeDocument } from '../../engine/tokenize.ts'
import '../../grammars/builtins.ts'
import { Gutter, renderRows } from '../view.tsx'
import styles from './code-editor.module.css'
import { createHistory, type History, type Snapshot } from './history.ts'
import { createIndentCommands, dispatch, mergeKeymap, type KeyMap } from './keymap.ts'
import { diff, rebaseSelection } from './sync.ts'

/**
 * Imperative handle (via `ref`) for callers that drive their own transactions —
 * a remote pull, a programmatic insert, a reset. Edits route through the same
 * history as keyboard edits, so they stay undoable.
 */
export interface CodeEditorHandle {
  /** Replace `[from, to)` with `text` (an undoable edit), leaving the caret after it. */
  applyEdit(range: { from: number; to: number }, text: string): void
  /** Current selection offsets. */
  getSelection(): { start: number; end: number }
  /** Focus the editing surface. */
  focus(): void
  /** Undo / redo the owned history. */
  undo(): void
  redo(): void
}

/** Auto-enable windowing above this line count (unless `wrap` makes rows variable-height). */
const VIRTUALIZE_THRESHOLD = 1000
/** Extra rows rendered above/below the viewport so fast scrolls stay covered. */
const OVERSCAN = 12

export interface CodeEditorProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue' | 'onChange' | 'wrap'
> {
  /** Controlled value. */
  value?: string
  /** Initial value for uncontrolled use. */
  defaultValue?: string
  /** Called with the new text on every edit. */
  onValueChange?: (value: string) => void
  /** Grammar name (defaults to `plaintext`; unknown names fall back to it). */
  language?: string
  /** Show the line-number gutter (default true). */
  lineNumbers?: boolean
  /** Spaces per tab stop (default 2). */
  tabSize?: number
  /** Insert spaces (default) vs a literal tab on Tab. */
  insertSpaces?: boolean
  /** Soft-wrap long lines instead of scrolling horizontally (default false). */
  wrap?: boolean
  /**
   * Render only the visible lines for large documents. Defaults to auto
   * (on above ~1000 lines); disabled when `wrap` makes row heights variable.
   */
  virtualize?: boolean
  /** Accessible label for the editor (defaults to the i18n "Code editor"). */
  label?: string
}

/**
 * A lightweight code editor: a native `<textarea>` overlaid on a syntax-highlighted
 * `Highlight` layer. The browser owns editing/caret/IME/undo/a11y; JS handles only
 * tokenizing, scroll-sync, and Tab/Shift-Tab indent. Signal-driven, no banned hooks.
 *
 * Performance: tokenization is per-line memoized, the highlight layer is
 * rAF-debounced (typing never blocks), and large documents window to the visible
 * range while the textarea always holds the full text.
 */
export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  {
    value,
    defaultValue,
    onValueChange,
    language = 'plaintext',
    lineNumbers = true,
    tabSize = 2,
    insertSpaces = true,
    wrap = false,
    virtualize,
    readOnly = false,
    disabled = false,
    spellCheck = false,
    label,
    className,
    style,
    onKeyDown,
    ...rest
  },
  ref,
) {
  useSignals()
  const [text, setText] = useControllableSignal<string>({
    value,
    defaultValue: defaultValue ?? '',
    onChange: onValueChange,
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Owned undo/redo history (survives programmatic `value` writes, unlike native
  // textarea undo). Seeded once with the initial state.
  const historyRef = useRef<History | null>(null)
  if (historyRef.current === null) {
    historyRef.current = createHistory()
    historyRef.current.reset({ text: text.value, selectionStart: 0, selectionEnd: 0 })
  }
  const history = historyRef.current

  // Edit-tracking refs: `prevText` is the last value we know about, `lastEmitted`
  // is the value we last pushed via onValueChange (to tell our own echo from an
  // external/controlled change), `applying` guards snapshot restores, and `sel`
  // mirrors the live selection for history + external rebasing.
  const prevTextRef = useRef(text.value)
  const lastEmittedRef = useRef<string | undefined>(undefined)
  const applyingRef = useRef(false)
  const selRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 })

  // Commit an edit: route through the controllable signal and record an undo step.
  const commit = (next: string, sel: { start: number; end: number }, coalesce: boolean): void => {
    // Update tracking + history BEFORE setText: writing the signal runs the
    // external-change effect synchronously, which must see this as our own edit.
    lastEmittedRef.current = next
    prevTextRef.current = next
    history.record({ text: next, selectionStart: sel.start, selectionEnd: sel.end }, { coalesce })
    setText(next)
  }

  // setText shim handed to keymap commands (indent/dedent) — reads the post-edit
  // selection off the textarea and records a (non-coalescing) step.
  const commitFromCommand = (next: string): void => {
    const ta = taRef.current
    const sel = ta ? { start: ta.selectionStart, end: ta.selectionEnd } : selRef.current
    commit(next, sel, false)
  }

  // Apply an undo/redo snapshot: write text + selection imperatively and sync the
  // signal, without recording a new step or tripping the external-change path.
  const applySnapshot = (snap: Snapshot): void => {
    const ta = taRef.current
    if (!ta) return
    applyingRef.current = true
    ta.value = snap.text
    ta.setSelectionRange(snap.selectionStart, snap.selectionEnd)
    setText(snap.text)
    lastEmittedRef.current = snap.text
    prevTextRef.current = snap.text
    selRef.current = { start: snap.selectionStart, end: snap.selectionEnd }
    const line = snap.text.slice(0, snap.selectionStart).split('\n').length - 1
    rootRef.current?.style.setProperty('--cascivo-editor-caret-line', String(line))
    applyingRef.current = false
  }

  const doUndo = (): void => {
    const snap = history.undo()
    if (snap) applySnapshot(snap)
  }
  const doRedo = (): void => {
    const snap = history.redo()
    if (snap) applySnapshot(snap)
  }

  // Imperative handle for callers driving their own transactions. Edits go through
  // `commit`, so they record undo steps like keyboard edits.
  useImperativeHandle(ref, () => ({
    applyEdit: ({ from, to }, insert) => {
      const ta = taRef.current
      if (!ta) return
      ta.setRangeText(insert, from, to, 'end')
      commit(ta.value, { start: ta.selectionStart, end: ta.selectionEnd }, false)
    },
    getSelection: () => {
      const ta = taRef.current
      return ta ? { start: ta.selectionStart, end: ta.selectionEnd } : { ...selRef.current }
    },
    focus: () => taRef.current?.focus(),
    undo: doUndo,
    redo: doRedo,
  }))

  // rAF-debounced highlight: editing writes `text` synchronously (never blocked);
  // the highlight layer reads `highlightText`, updated at most once per frame.
  const highlightText = useSignal(text.value)

  // Viewport metrics for windowing (written in the scroll/measure listener).
  const scrollTop = useSignal(0)
  const viewport = useSignal(0)
  const lineHeight = useSignal(0)

  useSignalEffect(() => {
    const next = text.value
    if (typeof requestAnimationFrame !== 'function') {
      highlightText.value = next
      return
    }
    const id = requestAnimationFrame(() => {
      highlightText.value = next
    })
    return () => cancelAnimationFrame(id)
  })

  // External/controlled value changes: when `text` changes to something we did not
  // emit ourselves (a parent reset / remote pull), it is an external update. Rebase
  // the live selection across the diff so the caret tracks the same logical spot
  // (no jump-to-end), and seed history to the new state. The `applying` guard plus
  // the `lastEmitted` echo check keep our own edits from looping back through here.
  useSignalEffect(() => {
    const next = text.value
    if (applyingRef.current) return
    if (next === prevTextRef.current) return
    if (next === lastEmittedRef.current) {
      prevTextRef.current = next
      return
    }
    const ta = taRef.current
    const change = diff(prevTextRef.current, next)
    const sel = rebaseSelection(selRef.current.start, selRef.current.end, change)
    if (ta) {
      applyingRef.current = true
      if (ta.value !== next) ta.value = next
      ta.setSelectionRange(sel.start, sel.end)
      applyingRef.current = false
    }
    selRef.current = sel
    history.reset({ text: next, selectionStart: sel.start, selectionEnd: sel.end })
    prevTextRef.current = next
  })

  // Scroll-sync (textarea → highlight + gutter), viewport measurement, and the
  // imperative current-line marker. The only DOM side effects — run in a signal
  // effect, not a React lifecycle hook.
  useSignalEffect(() => {
    const ta = taRef.current
    if (!ta) return
    const measure = (): void => {
      const lh = Number.parseFloat(getComputedStyle(ta).lineHeight)
      lineHeight.value = Number.isFinite(lh) && lh > 0 ? lh : 0
      viewport.value = ta.clientHeight
    }
    const syncScroll = (): void => {
      scrollTop.value = ta.scrollTop
      viewport.value = ta.clientHeight
      if (preRef.current) {
        preRef.current.scrollTop = ta.scrollTop
        preRef.current.scrollLeft = ta.scrollLeft
      }
      if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop
    }
    const syncCaret = (): void => {
      const line = ta.value.slice(0, ta.selectionStart).split('\n').length - 1
      rootRef.current?.style.setProperty('--cascivo-editor-caret-line', String(line))
      selRef.current = { start: ta.selectionStart, end: ta.selectionEnd }
    }
    measure()
    syncCaret()
    ta.addEventListener('scroll', syncScroll)
    ta.addEventListener('keyup', syncCaret)
    ta.addEventListener('click', syncCaret)
    ta.addEventListener('input', syncCaret)
    return () => {
      ta.removeEventListener('scroll', syncScroll)
      ta.removeEventListener('keyup', syncCaret)
      ta.removeEventListener('click', syncCaret)
      ta.removeEventListener('input', syncCaret)
    }
  })

  const lines = tokenizeDocument(getGrammar(language), highlightText.value)
  const total = lines.length

  // Windowing: render only the visible slice for large docs (never when wrapping,
  // where row heights are variable). Spacers preserve scroll height + alignment.
  const lh = lineHeight.value
  const windowed = (virtualize ?? total > VIRTUALIZE_THRESHOLD) && !wrap && lh > 0
  let start = 0
  let end = total
  if (windowed) {
    start = Math.max(0, Math.floor(scrollTop.value / lh) - OVERSCAN)
    const visibleRows = Math.ceil(viewport.value / lh)
    end = Math.min(total, start + visibleRows + OVERSCAN * 2)
  }
  const topPad = start * lh
  const bottomPad = (total - end) * lh

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    const ta = event.currentTarget
    const editable = !readOnly && !disabled
    const bindings: KeyMap = {}
    if (editable) {
      const { indent, dedent } = createIndentCommands({ tabSize, insertSpaces })
      bindings['Tab'] = indent
      bindings['Shift-Tab'] = dedent
      bindings['Mod-z'] = () => {
        doUndo()
        return true
      }
      const redo = (): boolean => {
        doRedo()
        return true
      }
      bindings['Mod-Shift-z'] = redo
      bindings['Mod-y'] = redo
    }
    const map = mergeKeymap(bindings)
    const handled = dispatch(map, { textarea: ta, event, setText: commitFromCommand })
    if (handled) event.preventDefault()
    onKeyDown?.(event)
  }

  const rootStyle = { '--cascivo-editor-tab-size': tabSize, ...style } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={cn(styles['root'], className)}
      data-wrap={wrap}
      data-line-numbers={lineNumbers}
      style={rootStyle}
    >
      {lineNumbers && (
        <Gutter
          count={total}
          className={styles['gutter']}
          gutterRef={gutterRef}
          start={start}
          end={end}
          topPad={topPad}
          bottomPad={bottomPad}
        />
      )}
      <div className={styles['codeArea']}>
        <pre ref={preRef} className={styles['pre']} aria-hidden="true">
          <div className={styles['currentLine']} />
          {topPad > 0 && <div style={{ blockSize: topPad }} />}
          <code>{renderRows(lines, start, end)}</code>
          {bottomPad > 0 && <div style={{ blockSize: bottomPad }} />}
        </pre>
        <textarea
          ref={taRef}
          className={styles['textarea']}
          value={text.value}
          onChange={(event) => {
            const ta = event.currentTarget
            const next = ta.value
            const coalesce = Math.abs(next.length - prevTextRef.current.length) === 1
            commit(next, { start: ta.selectionStart, end: ta.selectionEnd }, coalesce)
          }}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          disabled={disabled}
          spellCheck={spellCheck}
          aria-label={label ?? t(builtin.editor.label)}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap={wrap ? 'soft' : 'off'}
          {...rest}
        />
      </div>
    </div>
  )
})
