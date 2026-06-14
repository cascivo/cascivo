'use client'
import { cn, useClipboard, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './code-snippet.module.css'

export interface CodeSnippetProps {
  /** The code to display (and copy). */
  code: string
  /** inline = a <code> span; single = one-line <pre>; multi = multi-line <pre>. */
  variant?: 'inline' | 'single' | 'multi'
  /** Show line numbers (multi only). */
  showLineNumbers?: boolean
  /** Show the copy-to-clipboard button. Defaults true for single/multi, false for inline. */
  showCopyButton?: boolean
  labels?: { copy?: string; copied?: string }
  className?: string
}

/**
 * Plain code display (no syntax highlighting). `inline` renders a `<code>` chip in flowing text;
 * `single` a horizontally scrolling one-liner; `multi` a block with optional line numbers. An
 * optional copy button uses `useClipboard` to copy the raw `code`.
 */
export function CodeSnippet({
  code,
  variant = 'single',
  showLineNumbers,
  showCopyButton,
  labels,
  className,
}: CodeSnippetProps) {
  useSignals()
  const { copied, copy } = useClipboard()
  const copyLabel = labels?.copy ?? t(builtin.codeSnippet.copy)
  const copiedLabel = labels?.copied ?? t(builtin.codeSnippet.copied)
  const withCopy = showCopyButton ?? variant !== 'inline'

  const copyButton = withCopy ? (
    <button
      type="button"
      aria-label={copied.value ? copiedLabel : copyLabel}
      data-state={copied.value ? 'copied' : 'idle'}
      className={styles['copy']}
      onClick={() => void copy(code)}
    >
      {copied.value ? (
        <svg aria-hidden="true" viewBox="0 0 16 16" className={styles['icon']}>
          <path
            d="M13.5 4.5 6 12 2.5 8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 16 16" className={styles['icon']}>
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </button>
  ) : null

  if (variant === 'inline') {
    return (
      <span className={cn(styles['root'], className)} data-variant="inline">
        <code className={styles['inlineCode']}>{code}</code>
        {copyButton}
      </span>
    )
  }

  const lines = code.split('\n')

  return (
    <div className={cn(styles['root'], className)} data-variant={variant}>
      <pre className={styles['pre']}>
        {variant === 'multi' && showLineNumbers ? (
          <code className={styles['code']}>
            {lines.map((line, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <span key={i} className={styles['line']}>
                <span aria-hidden="true" className={styles['lineNumber']}>
                  {i + 1}
                </span>
                <span className={styles['lineText']}>{line}</span>
              </span>
            ))}
          </code>
        ) : (
          <code className={styles['code']}>{code}</code>
        )}
      </pre>
      {copyButton}
    </div>
  )
}
