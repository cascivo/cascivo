'use client'
import {
  cn,
  useAnchorPosition,
  useControllableSignal,
  useId,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
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
import { createLineStateIndex, type LineStateIndex } from '../../engine/line-state.ts'
import { tokenizeRange } from '../../engine/tokenize.ts'
import '../../grammars/builtins.ts'
import { Gutter, renderRows, type Decoration } from '../view.tsx'
import hl from '../highlight/highlight.module.css'
import styles from './code-editor.module.css'
import { FindPanel } from './find-panel.tsx'
import { offsetToLineCol, replaceAll, scan, toDecorations, type Match } from './find.ts'
import { matchBracket, toBracketDecorations } from './brackets.ts'
import { createHistory, type History, type Snapshot } from './history.ts'
import { createIndentCommands, dispatch, mergeKeymap, type KeyMap } from './keymap.ts'
import { diff, rebaseSelection } from './sync.ts'
import { caretCoords, caretRectFromPre, measureCharWidth } from './caret.ts'
import { detectTrigger, filterCommands } from './slash-trigger.ts'
import { SlashMenu, type SlashMenuItem } from './slash-menu.tsx'

/**
 * Per-instance theme overrides — a partial map of `--cascivo-editor-*` custom
 * properties spread onto the editor root. Swapping it re-themes live (Zen mode),
 * while global `data-theme` remains the default.
 */
export type EditorTheme = Partial<Record<`--cascivo-editor-${string}`, string>>

/**
 * A slash-command entry. Typing `/` at a word boundary opens a filtered menu of
 * these; choosing one replaces the `/query` span with `insert` (undoable) and/or
 * runs `run`. At least one of `insert` / `run` must be provided.
 */
export interface SlashCommand {
  /** Stable id (menu key). */
  id: string
  /** Shown in the menu and matched against the query. */
  label: string
  /** Optional right-aligned hint (e.g. a shortcut or category). */
  hint?: string
  /** Extra match terms beyond the label. */
  keywords?: readonly string[]
  /** Text inserted in place of the `/query` (an undoable edit). */
  insert?: string
  /** Side effect run after the `/query` is removed (receives the editor handle). */
  run?: (editor: CodeEditorHandle) => void
}

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
  /** Open the find panel. */
  openFind(): void
  /** Open the slash-command menu at the current caret (no-op without `commands`). */
  openCommandMenu(): void
}

/** Auto-enable windowing above this line count (unless `wrap` makes rows variable-height). */
export const VIRTUALIZE_THRESHOLD = 1000
/** Extra rows rendered above/below the viewport so fast scrolls stay covered. */
export const OVERSCAN = 12

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
  /** Called with the current value on `Mod-S` (the browser save dialog is suppressed). */
  onSave?: (value: string) => void
  /** Extra key bindings, merged over the built-ins (user wins on the same chord). */
  keymap?: KeyMap
  /** Extra decorations — offset ranges → CSS class — merged with internal ones. */
  decorations?: readonly Decoration[] | ((value: string) => readonly Decoration[])
  /** Per-instance `--cascivo-editor-*` overrides; swapping it re-themes live. */
  theme?: EditorTheme
  /** Highlight the bracket matching the one adjacent to the caret (default false). */
  bracketMatching?: boolean
  /** Slash-command entries; typing `/` opens a filtered menu. Omit to disable. */
  commands?: readonly SlashCommand[]
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
    onSave,
    keymap,
    decorations,
    theme,
    bracketMatching = false,
    commands,
    className,
    style,
    onKeyDown,
    ...rest
  },
  ref,
) {
  useSignals()

  // Keep the latest onSave reachable from the keymap without rebuilding it.
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
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

  // Persistent per-line grammar-state index — mutable infrastructure (like the
  // history handle), held in a ref so the window's start-state is a read, not a
  // re-walk from line 0. Seeded/recreated below when the grammar changes;
  // `lastIndexedText` tracks the text it currently reflects.
  const indexRef = useRef<LineStateIndex | null>(null)
  const lastIndexedTextRef = useRef<string | undefined>(undefined)

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
    caretOffset.value = snap.selectionStart
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

  // rAF-debounced highlight: editing writes `text` synchronously (never blocked);
  // the highlight layer reads `highlightText`, updated at most once per frame.
  const highlightText = useSignal(text.value)

  // Viewport metrics for windowing (written in the scroll/measure listener).
  const scrollTop = useSignal(0)
  const viewport = useSignal(0)
  const lineHeight = useSignal(0)

  // Find/replace state (signals so reads are reactive).
  const findOpen = useSignal(false)
  const findQuery = useSignal('')
  const replaceQuery = useSignal('')
  const caseSensitive = useSignal(false)
  const replaceMode = useSignal(false)
  const currentMatch = useSignal(0)

  // Live caret offset (reactive, drives bracket matching).
  const caretOffset = useSignal(0)

  // ── Slash commands ───────────────────────────────────────────────────────────
  // Menu state lives in signals (the signal IS the state — no FSM, since the open
  // state is driven by reactive trigger detection, not internal transitions).
  const slashOpen = useSignal(false)
  const slashStart = useSignal(0) // offset of the `/` that opened the menu
  const slashQuery = useSignal('')
  const slashIndex = useSignal(0)
  const slashDismissed = useSignal(-1) // a `/` offset the user dismissed (Escape)
  // Measured once (monospace advance) for the arithmetic caret position.
  const charWidth = useSignal(0)
  const caretProxyRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const menuId = useId('slash-menu')

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
      if (charWidth.value === 0) charWidth.value = measureCharWidth(ta)
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
      caretOffset.value = ta.selectionStart
    }
    // `selectionchange` fires the instant the caret moves for ANY reason (arrow
    // keys, Home/End, mouse, typing) — unlike `keyup`, which waits for the key to
    // be released, leaving the current-line highlight visibly lagging behind fast
    // arrow-key navigation. It's a document-level event, so guard on focus.
    const syncCaretIfActive = (): void => {
      if (document.activeElement === ta) syncCaret()
    }
    measure()
    syncCaret()
    ta.addEventListener('scroll', syncScroll)
    ta.addEventListener('keyup', syncCaret)
    ta.addEventListener('click', syncCaret)
    ta.addEventListener('input', syncCaret)
    document.addEventListener('selectionchange', syncCaretIfActive)
    return () => {
      ta.removeEventListener('scroll', syncScroll)
      ta.removeEventListener('keyup', syncCaret)
      ta.removeEventListener('click', syncCaret)
      ta.removeEventListener('input', syncCaret)
      document.removeEventListener('selectionchange', syncCaretIfActive)
    }
  })

  // Slash-command trigger detection: reactively (after input) inspect the text
  // around the caret. The `/` types into the textarea normally and is detected
  // here — it is never a keymap binding (that would swallow the slash). Inert
  // without `commands`, and in read-only/disabled.
  useSignalEffect(() => {
    const caret = caretOffset.value
    const value = text.value
    if (!commands || commands.length === 0 || readOnly || disabled) {
      if (slashOpen.value) slashOpen.value = false
      return
    }
    const trigger = detectTrigger(value, caret)
    if (!trigger) {
      slashDismissed.value = -1 // moved off any trigger; allow reopening later
      if (slashOpen.value) slashOpen.value = false
      return
    }
    if (trigger.start === slashDismissed.value) {
      if (slashOpen.value) slashOpen.value = false
      return // this trigger was dismissed; stay closed until it changes
    }
    if (!slashOpen.value) slashIndex.value = 0
    slashOpen.value = true
    slashStart.value = trigger.start
    slashQuery.value = trigger.query
  })

  // Position the caret-proxy (the anchor for the menu) at the `/` while open.
  useSignalEffect(() => {
    if (!slashOpen.value) return
    const proxy = caretProxyRef.current
    const ta = taRef.current
    if (!proxy || !ta) return
    const offset = slashStart.value
    const codeArea = proxy.offsetParent as HTMLElement | null
    let top: number
    let left: number
    const pre = preRef.current
    const rect = (wrap || text.value.includes('\t')) && pre ? caretRectFromPre(pre, offset) : null
    if (rect && codeArea) {
      const origin = codeArea.getBoundingClientRect()
      top = rect.bottom - origin.top
      left = rect.left - origin.left
    } else {
      const cs = getComputedStyle(ta)
      const coords = caretCoords(text.value, offset, {
        charWidth: charWidth.value,
        lineHeight: lineHeight.value,
        scrollTop: ta.scrollTop,
        scrollLeft: ta.scrollLeft,
        padTop: Number.parseFloat(cs.paddingTop) || 0,
        padLeft: Number.parseFloat(cs.paddingLeft) || 0,
        tabSize,
      })
      top = coords.top + lineHeight.value // below the caret line
      left = coords.left
    }
    proxy.style.top = `${top}px`
    proxy.style.left = `${left}px`
  })

  // Seed/recreate the line-state index when the grammar changes (mutable infra,
  // like the history handle — never render state).
  const grammar = getGrammar(language)
  if (indexRef.current === null || indexRef.current.grammar !== grammar) {
    indexRef.current = createLineStateIndex(grammar)
    lastIndexedTextRef.current = undefined
  }
  const index = indexRef.current

  // Split for the line COUNT only — no token arrays built for the whole document.
  const allLines = highlightText.value.split('\n')
  const total = allLines.length

  // Keep the index consistent with the current text by invalidating only from the
  // FIRST CHANGED LINE (via v46's diff), not from line 0 — so an edit re-threads
  // just the changed suffix, bounded by where it reconverges or the window bottom,
  // never the whole document. Keying off the rAF-debounced `highlightText` (the text
  // the tokenizer actually consumes) covers every edit path uniformly: typing,
  // indent, find/replace, applyEdit, undo/redo, and external/controlled sync.
  const indexText = highlightText.value
  const lastText = lastIndexedTextRef.current
  if (indexText !== lastText) {
    const changedLine =
      lastText === undefined
        ? 0
        : (() => {
            const change = diff(lastText, indexText)
            return lastText.slice(0, change.from).split('\n').length - 1
          })()
    index.invalidateFrom(changedLine)
    lastIndexedTextRef.current = indexText
  }

  // Windowing: render only the visible slice for large docs (never when wrapping,
  // where row heights are variable). Spacers preserve scroll height + alignment.
  // Under `wrap` the window is the whole document, so RENDER is O(n) — irreducible
  // without wrap-aware pixel virtualization (out of scope). Edits stay cheap: the
  // index/memo above re-tokenize only the changed suffix. Disable `wrap` for very
  // large docs if sustained editing matters (see PERFORMANCE.md).
  const lh = lineHeight.value
  const windowed = (virtualize ?? total > VIRTUALIZE_THRESHOLD) && !wrap && lh > 0
  let start = 0
  let end = total
  if (windowed) {
    start = Math.max(0, Math.floor(scrollTop.value / lh) - OVERSCAN)
    const visibleRows = Math.ceil(viewport.value / lh)
    end = Math.min(total, start + visibleRows + OVERSCAN * 2)
  }
  // Tokenize ONLY the visible window: O(viewport) per render, not O(document).
  const rows = tokenizeRange(grammar, allLines, start, end, index)
  const topPad = start * lh
  const bottomPad = (total - end) * lh

  // ── Find / replace ──────────────────────────────────────────────────────────
  const matches: Match[] = findOpen.value
    ? scan(highlightText.value, findQuery.value, { caseSensitive: caseSensitive.value })
    : []
  if (currentMatch.value >= matches.length) currentMatch.value = Math.max(0, matches.length - 1)
  const findDecorations: Decoration[] =
    matches.length > 0
      ? toDecorations(highlightText.value, matches, currentMatch.value, {
          match: hl['match'] as string,
          current: hl['matchCurrent'] as string,
        })
      : []
  const userDecorations: readonly Decoration[] =
    typeof decorations === 'function' ? decorations(highlightText.value) : (decorations ?? [])
  let bracketDecorations: Decoration[] = []
  if (bracketMatching) {
    const m = matchBracket(highlightText.value, caretOffset.value)
    if (m) {
      bracketDecorations = toBracketDecorations(
        highlightText.value,
        m,
        hl['bracketMatch'] as string,
      )
    }
  }
  const allDecorations = [...userDecorations, ...bracketDecorations, ...findDecorations]
  const decorationList = allDecorations.length > 0 ? allDecorations : undefined

  const selectMatch = (index: number): void => {
    const m = matches[index]
    const ta = taRef.current
    if (!m || !ta) return
    ta.focus()
    ta.setSelectionRange(m.start, m.end)
    selRef.current = { start: m.start, end: m.end }
    if (lh > 0) {
      const { line } = offsetToLineCol(ta.value, m.start)
      const top = line * lh
      if (top < ta.scrollTop || top > ta.scrollTop + ta.clientHeight - lh) {
        ta.scrollTop = Math.max(0, top - ta.clientHeight / 2)
      }
    }
  }
  const findNext = (): void => {
    if (matches.length === 0) return
    currentMatch.value = (currentMatch.value + 1) % matches.length
    selectMatch(currentMatch.value)
  }
  const findPrev = (): void => {
    if (matches.length === 0) return
    currentMatch.value = (currentMatch.value - 1 + matches.length) % matches.length
    selectMatch(currentMatch.value)
  }
  const replaceCurrent = (): void => {
    const m = matches[currentMatch.value]
    const ta = taRef.current
    if (!m || !ta || readOnly || disabled) return
    ta.setRangeText(replaceQuery.value, m.start, m.end, 'end')
    commit(ta.value, { start: ta.selectionStart, end: ta.selectionEnd }, false)
  }
  const replaceAllNow = (): void => {
    if (matches.length === 0 || readOnly || disabled) return
    const next = replaceAll(highlightText.value, matches, replaceQuery.value)
    const ta = taRef.current
    if (ta) ta.value = next
    commit(next, { start: ta?.selectionStart ?? 0, end: ta?.selectionEnd ?? 0 }, false)
  }
  const openFind = (replace: boolean): void => {
    replaceMode.value = replace
    findOpen.value = true
  }
  const closeFind = (): void => {
    findOpen.value = false
    taRef.current?.focus()
  }

  // ── Slash menu derived view ──────────────────────────────────────────────────
  // Filter only while open; clamp the active index into range (like find's match).
  const slashFiltered = slashOpen.value ? filterCommands(commands ?? [], slashQuery.value) : []
  if (slashIndex.value >= slashFiltered.length) {
    slashIndex.value = Math.max(0, slashFiltered.length - 1)
  }
  const slashItems: SlashMenuItem[] = slashFiltered.map((c) => ({
    id: c.id,
    label: c.label,
    ...(c.hint !== undefined && { hint: c.hint }),
  }))

  // Anchor the menu to the caret-proxy (positioned at the `/` in the effect above).
  const { anchorStyle, floatingStyle } = useAnchorPosition({
    anchorRef: caretProxyRef,
    floatingRef: menuRef,
    placement: 'bottom-start',
    enabled: slashOpen,
  })

  // Imperative handle for callers driving their own transactions. Edits go through
  // `commit`, so they record undo steps like keyboard edits.
  const handle: CodeEditorHandle = {
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
    openFind: () => openFind(false),
    openCommandMenu: () => {
      const ta = taRef.current
      if (!ta || !commands || commands.length === 0 || readOnly || disabled) return
      // Insert a `/` so the reactive detector owns the open state uniformly, then
      // sync the caret (setRangeText fires no input event) so it opens at once.
      ta.focus()
      ta.setRangeText('/', ta.selectionStart, ta.selectionEnd, 'end')
      commit(ta.value, { start: ta.selectionStart, end: ta.selectionEnd }, false)
      caretOffset.value = ta.selectionStart
      selRef.current = { start: ta.selectionStart, end: ta.selectionEnd }
    },
  }
  useImperativeHandle(ref, () => handle)

  // Apply the active command: replace the `/query` span (undoable) then run its
  // action. One transaction; focus returns to the textarea.
  const selectCommand = (index: number): void => {
    const cmd = slashFiltered[index]
    const ta = taRef.current
    if (!cmd || !ta || readOnly || disabled) return
    const from = slashStart.value
    const to = ta.selectionStart
    ta.setRangeText(cmd.insert ?? '', from, to, 'end')
    commit(ta.value, { start: ta.selectionStart, end: ta.selectionEnd }, false)
    // Sync the caret so reactive detection sees the post-insert position (an insert
    // may itself contain a `/`, which a stale caret would mis-read as a new trigger).
    caretOffset.value = ta.selectionStart
    selRef.current = { start: ta.selectionStart, end: ta.selectionEnd }
    slashOpen.value = false
    slashIndex.value = 0
    ta.focus()
    cmd.run?.(handle)
  }

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
    bindings['Mod-f'] = () => {
      openFind(false)
      return true
    }
    bindings['Mod-Alt-f'] = () => {
      openFind(true)
      return true
    }
    bindings['Mod-s'] = () => {
      const onSaveNow = onSaveRef.current
      if (!onSaveNow) return false // nothing to save — let the browser default run
      onSaveNow(text.value)
      return true
    }
    if (findOpen.value) {
      bindings['Escape'] = () => {
        closeFind()
        return true
      }
    }
    // Slash menu nav — added after the editable bindings so it overrides `Tab`
    // (select, not indent) and `Enter` (select, not newline) while open.
    if (slashOpen.value) {
      const move =
        (delta: number): (() => boolean) =>
        () => {
          const n = slashFiltered.length
          if (n > 0) slashIndex.value = (slashIndex.value + delta + n) % n
          return true
        }
      bindings['ArrowDown'] = move(1)
      bindings['ArrowUp'] = move(-1)
      const choose = (): boolean => {
        if (slashFiltered.length > 0) selectCommand(slashIndex.value)
        return true // swallow even when empty (no stray newline/tab)
      }
      bindings['Enter'] = choose
      bindings['Tab'] = choose
      bindings['Escape'] = () => {
        slashDismissed.value = slashStart.value
        slashOpen.value = false
        return true
      }
    }
    const map = mergeKeymap(bindings, keymap)
    const handled = dispatch(map, { textarea: ta, event, setText: commitFromCommand })
    if (handled) event.preventDefault()
    onKeyDown?.(event)
  }

  const rootStyle = {
    '--cascivo-editor-tab-size': tabSize,
    ...theme,
    ...style,
  } as CSSProperties

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
          activeLine
        />
      )}
      <div className={styles['codeArea']}>
        <pre ref={preRef} className={styles['pre']} aria-hidden="true">
          <div className={styles['currentLine']} />
          {topPad > 0 && <div style={{ blockSize: topPad }} />}
          <code>{renderRows(rows, start, end, decorationList)}</code>
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
          aria-expanded={slashOpen.value}
          aria-controls={slashOpen.value ? menuId : undefined}
          aria-activedescendant={slashOpen.value ? `${menuId}-opt-${slashIndex.value}` : undefined}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap={wrap ? 'soft' : 'off'}
          {...rest}
        />
        {/* 0×0 caret-proxy: the anchor the menu positions against (placed at the `/`). */}
        <div
          ref={caretProxyRef}
          aria-hidden="true"
          style={{ position: 'absolute', inlineSize: 0, blockSize: 0, ...anchorStyle }}
        />
        {slashOpen.value && (
          <SlashMenu
            ref={menuRef}
            id={menuId}
            items={slashItems}
            activeIndex={slashIndex.value}
            onSelect={selectCommand}
            onHover={(i) => (slashIndex.value = i)}
            style={floatingStyle}
          />
        )}
        {findOpen.value && (
          <FindPanel
            query={findQuery.value}
            replaceQuery={replaceQuery.value}
            replaceMode={replaceMode.value}
            caseSensitive={caseSensitive.value}
            matchCount={matches.length}
            currentIndex={matches.length > 0 ? currentMatch.value : -1}
            onQueryChange={(v) => {
              findQuery.value = v
              currentMatch.value = 0
            }}
            onReplaceChange={(v) => (replaceQuery.value = v)}
            onNext={findNext}
            onPrev={findPrev}
            onReplace={replaceCurrent}
            onReplaceAll={replaceAllNow}
            onToggleCase={() => (caseSensitive.value = !caseSensitive.value)}
            onToggleReplace={() => (replaceMode.value = !replaceMode.value)}
            onClose={closeFind}
          />
        )}
      </div>
    </div>
  )
})
