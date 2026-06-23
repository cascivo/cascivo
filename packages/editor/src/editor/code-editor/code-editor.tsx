'use client'
import { cn, useControllableSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef, type CSSProperties, type KeyboardEvent, type TextareaHTMLAttributes } from 'react'
import { getGrammar } from '../../engine/registry.ts'
import { tokenizeDocument } from '../../engine/tokenize.ts'
import '../../grammars/builtins.ts'
import { Gutter, renderLines } from '../view.tsx'
import styles from './code-editor.module.css'

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
  /** Accessible label for the editor (defaults to the i18n "Code editor"). */
  label?: string
}

/**
 * A lightweight code editor: a native `<textarea>` overlaid on a syntax-highlighted
 * `Highlight` layer. The browser owns editing/caret/IME/undo/a11y; JS handles only
 * tokenizing, scroll-sync, and Tab/Shift-Tab indent. Signal-driven, no banned hooks.
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

  // Scroll-sync (textarea → highlight + gutter) and the imperative current-line
  // marker. The only DOM side effects — run in a signal effect, not a React
  // lifecycle hook.
  useSignalEffect(() => {
    const ta = taRef.current
    if (!ta) return
    const syncScroll = (): void => {
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
    ta.addEventListener('scroll', syncScroll)
    ta.addEventListener('keyup', syncCaret)
    ta.addEventListener('click', syncCaret)
    ta.addEventListener('input', syncCaret)
    syncCaret()
    return () => {
      ta.removeEventListener('scroll', syncScroll)
      ta.removeEventListener('keyup', syncCaret)
      ta.removeEventListener('click', syncCaret)
      ta.removeEventListener('input', syncCaret)
    }
  })

  const lines = tokenizeDocument(getGrammar(language), text.value)

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
        <Gutter count={lines.length} className={styles['gutter']} gutterRef={gutterRef} />
      )}
      <div className={styles['codeArea']}>
        <pre ref={preRef} className={styles['pre']} aria-hidden="true">
          <div className={styles['currentLine']} />
          <code>{renderLines(lines)}</code>
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
