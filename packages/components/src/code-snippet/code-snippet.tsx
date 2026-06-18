'use client'
import { cn, useClipboard, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { type CodeLang, tokenize } from './highlight'
import styles from './code-snippet.module.css'

export type { CodeLang }

export interface CodeSnippetProps {
  /** The code to display (and copy). */
  code: string
  /** inline = a <code> span; single = one-line <pre>; multi = multi-line <pre>. */
  variant?: 'inline' | 'single' | 'multi'
  /**
   * Enables lightweight, dependency-free syntax highlighting for the block
   * variants. Omit for plain text. Inline code is never highlighted.
   */
  language?: CodeLang
  /**
   * Renders terminal-window chrome (a title bar with traffic-light dots). Pair
   * with `language="bash"` for a shell transcript. Block variants only.
   */
  terminal?: boolean
  /** Optional label shown in the terminal title bar. */
  title?: string
  /** Show line numbers (multi only; ignored when `language` is set). */
  showLineNumbers?: boolean
  /** Show the copy-to-clipboard button. Defaults true for single/multi, false for inline. */
  showCopyButton?: boolean
  labels?: { copy?: string; copied?: string }
  className?: string
}

/** Syntax-highlighted `<code>` body — one span per token, coloured via `data-tok`. */
function Highlighted({ code, language }: { code: string; language: CodeLang }) {
  return (
    <code className={styles['code']}>
      {tokenize(code, language).map((tok, i) =>
        tok.type === 'text' ? (
          // eslint-disable-next-line react/no-array-index-key
          <span key={i}>{tok.value}</span>
        ) : (
          // eslint-disable-next-line react/no-array-index-key
          <span key={i} data-tok={tok.type}>
            {tok.value}
          </span>
        ),
      )}
    </code>
  )
}

/**
 * Code display with optional, dependency-free syntax highlighting. `inline`
 * renders a `<code>` chip in flowing text; `single` a horizontally scrolling
 * one-liner; `multi` a block with optional line numbers. Pass `language` to
 * colour bash/css/js/ts, and `terminal` for shell-window chrome. An optional
 * copy button uses `useClipboard` to copy the raw `code`.
 */
export function CodeSnippet({
  code,
  variant = 'single',
  language,
  terminal = false,
  title,
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
  const withNumbers = variant === 'multi' && showLineNumbers && !language

  return (
    <div
      className={cn(styles['root'], className)}
      data-variant={variant}
      data-terminal={terminal ? '' : undefined}
    >
      {terminal && (
        <div className={styles['bar']} aria-hidden="true">
          <span className={styles['dots']}>
            <span className={styles['dot']} />
            <span className={styles['dot']} />
            <span className={styles['dot']} />
          </span>
          {title && <span className={styles['title']}>{title}</span>}
        </div>
      )}
      <pre className={styles['pre']}>
        {withNumbers ? (
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
        ) : language ? (
          <Highlighted code={code} language={language} />
        ) : (
          <code className={styles['code']}>{code}</code>
        )}
      </pre>
      {copyButton}
    </div>
  )
}
