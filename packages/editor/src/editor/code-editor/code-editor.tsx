'use client'
import { cn, useControllableSignal, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef, type CSSProperties, type KeyboardEvent, type TextareaHTMLAttributes } from 'react'
import { getGrammar } from '../../engine/registry.ts'
import { tokenizeDocument } from '../../engine/tokenize.ts'
import '../../grammars/builtins.ts'
import { Gutter, renderRows } from '../view.tsx'
import styles from './code-editor.module.css'

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
export function CodeEditor({
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
}: CodeEditorProps) {
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
    if (event.key === 'Tab' && !readOnly && !disabled) {
      event.preventDefault()
      const ta = event.currentTarget
      const { selectionStart, selectionEnd, value: current } = ta
      const indent = insertSpaces ? ' '.repeat(tabSize) : '\t'
      const lineStart = current.lastIndexOf('\n', selectionStart - 1) + 1

      if (event.shiftKey) {
        const block = current.slice(lineStart, selectionEnd)
        const dedented = block.replace(new RegExp(`^(?:\\t| {1,${tabSize}})`, 'gm'), '')
        ta.setRangeText(dedented, lineStart, selectionEnd, 'select')
      } else if (selectionStart === selectionEnd) {
        ta.setRangeText(indent, selectionStart, selectionEnd, 'end')
      } else {
        const block = current.slice(lineStart, selectionEnd)
        const indented = block.replace(/^/gm, indent)
        ta.setRangeText(indented, lineStart, selectionEnd, 'select')
      }
      setText(ta.value)
    }
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
          onChange={(event) => setText(event.currentTarget.value)}
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
}
