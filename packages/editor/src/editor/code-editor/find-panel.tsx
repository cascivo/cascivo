'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { KeyboardEvent } from 'react'
import styles from './find-panel.module.css'

export interface FindPanelProps {
  query: string
  replaceQuery: string
  replaceMode: boolean
  caseSensitive: boolean
  /** Total match count. */
  matchCount: number
  /** Zero-based current match, or -1 when there are none. */
  currentIndex: number
  onQueryChange: (value: string) => void
  onReplaceChange: (value: string) => void
  onNext: () => void
  onPrev: () => void
  onReplace: () => void
  onReplaceAll: () => void
  onToggleCase: () => void
  onToggleReplace: () => void
  onClose: () => void
}

/**
 * The find / replace bar. A controlled, signal-safe subcomponent: all state lives
 * on the editor and is passed in; the panel only renders and forwards intent. A
 * labelled `search` region — Enter / Shift+Enter step matches, Escape closes.
 */
export function FindPanel(props: FindPanelProps) {
  useSignals()

  const count =
    props.matchCount === 0
      ? t(builtin.editor.noMatches)
      : t(builtin.editor.findCount, { current: props.currentIndex + 1, total: props.matchCount })

  const onFindKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (event.shiftKey) props.onPrev()
      else props.onNext()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      props.onClose()
    }
  }

  const onReplaceKey = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      props.onClose()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      props.onReplace()
    }
  }

  return (
    <div className={styles['panel']} role="search" aria-label={t(builtin.editor.find)}>
      <div className={styles['row']}>
        <button
          type="button"
          className={styles['toggle']}
          aria-label={t(builtin.editor.toggleReplace)}
          aria-expanded={props.replaceMode}
          onClick={props.onToggleReplace}
        >
          {props.replaceMode ? '▾' : '▸'}
        </button>
        <input
          className={styles['input']}
          value={props.query}
          placeholder={t(builtin.editor.findPlaceholder)}
          aria-label={t(builtin.editor.find)}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => props.onQueryChange(event.currentTarget.value)}
          onKeyDown={onFindKey}
        />
        <span className={styles['count']} aria-live="polite">
          {count}
        </span>
        <button
          type="button"
          className={styles['button']}
          aria-label={t(builtin.editor.previous)}
          onClick={props.onPrev}
        >
          ‹
        </button>
        <button
          type="button"
          className={styles['button']}
          aria-label={t(builtin.editor.next)}
          onClick={props.onNext}
        >
          ›
        </button>
        <button
          type="button"
          className={cn(styles['button'], props.caseSensitive && styles['active'])}
          aria-pressed={props.caseSensitive}
          aria-label={t(builtin.editor.matchCase)}
          onClick={props.onToggleCase}
        >
          Aa
        </button>
        <button
          type="button"
          className={styles['button']}
          aria-label={t(builtin.editor.close)}
          onClick={props.onClose}
        >
          ×
        </button>
      </div>
      {props.replaceMode && (
        <div className={styles['row']}>
          <input
            className={styles['input']}
            value={props.replaceQuery}
            placeholder={t(builtin.editor.replacePlaceholder)}
            aria-label={t(builtin.editor.replace)}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => props.onReplaceChange(event.currentTarget.value)}
            onKeyDown={onReplaceKey}
          />
          <button type="button" className={styles['button']} onClick={props.onReplace}>
            {t(builtin.editor.replaceOne)}
          </button>
          <button type="button" className={styles['button']} onClick={props.onReplaceAll}>
            {t(builtin.editor.replaceAll)}
          </button>
        </div>
      )}
    </div>
  )
}
