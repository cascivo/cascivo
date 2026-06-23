'use client'
import { cn, useSignals } from '@cascivo/core'
import type { CSSProperties, HTMLAttributes, Ref } from 'react'
import { getGrammar } from '../../engine/registry.ts'
import { tokenizeDocument } from '../../engine/tokenize.ts'
import '../../grammars/builtins.ts'
import { Gutter, renderLines } from '../view.tsx'
import styles from './highlight.module.css'

export interface HighlightProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Code to render. */
  value: string
  /** Grammar name (defaults to `plaintext`; unknown names fall back to it). */
  language?: string
  /** Show the line-number gutter. */
  lineNumbers?: boolean
  /** Soft-wrap long lines instead of scrolling horizontally. */
  wrap?: boolean
  /** Spaces per tab stop (default 2). */
  tabSize?: number
  /** Accessible label for the read-only code block. */
  label?: string
  /** Ref to the scrollable `<pre>` (used by `CodeEditor` for scroll-sync). */
  preRef?: Ref<HTMLPreElement>
  /** Ref to the gutter column (used by `CodeEditor` for scroll-sync). */
  gutterRef?: Ref<HTMLDivElement>
}

/**
 * Read-only, syntax-highlighted `<pre><code>` rendered from the owned tokenizer.
 * The same render layer `CodeEditor` overlays its `<textarea>` on. Signal-safe,
 * themeable, and accessible — no banned hooks.
 */
export function Highlight({
  value,
  language = 'plaintext',
  lineNumbers = false,
  wrap = false,
  tabSize = 2,
  label,
  className,
  preRef,
  gutterRef,
  style,
  ...rest
}: HighlightProps) {
  useSignals()
  const lines = tokenizeDocument(getGrammar(language), value)
  const tabStyle = { '--cascivo-editor-tab-size': tabSize, ...style } as CSSProperties

  return (
    <div
      className={cn(styles['root'], className)}
      data-wrap={wrap}
      data-line-numbers={lineNumbers}
      style={tabStyle}
      aria-label={label}
      {...rest}
    >
      {lineNumbers && (
        <Gutter count={lines.length} className={styles['gutter']} gutterRef={gutterRef} />
      )}
      <pre ref={preRef} className={styles['pre']}>
        <code className={styles['code']}>{renderLines(lines)}</code>
      </pre>
    </div>
  )
}
