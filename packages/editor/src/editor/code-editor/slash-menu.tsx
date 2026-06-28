'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { forwardRef, type CSSProperties } from 'react'
import styles from './slash-menu.module.css'

/** A view-model row in the slash menu (derived from a {@link SlashCommand}). */
export interface SlashMenuItem {
  id: string
  label: string
  hint?: string
}

export interface SlashMenuProps {
  /** Base id; each option is `${id}-opt-${index}` (matches the textbox's aria-activedescendant). */
  id: string
  items: readonly SlashMenuItem[]
  activeIndex: number
  onSelect: (index: number) => void
  onHover: (index: number) => void
  /** Positioning styles from the caret anchor. */
  style?: CSSProperties
}

/**
 * The slash-command popup — a controlled, signal-safe `listbox`. All state lives
 * on the editor and is passed in; the menu only renders and forwards intent.
 * Keyboard navigation is handled at the textarea (the real focus owner); pointer
 * hover/click are mirrored here. Positioned at the caret by the parent.
 */
export const SlashMenu = forwardRef<HTMLUListElement, SlashMenuProps>(function SlashMenu(
  { id, items, activeIndex, onSelect, onHover, style },
  ref,
) {
  useSignals()

  return (
    <ul
      ref={ref}
      id={id}
      className={styles['menu']}
      role="listbox"
      aria-label={t(builtin.editor.commandMenu)}
      style={style}
    >
      {items.length === 0 ? (
        <li className={styles['empty']} role="presentation">
          {t(builtin.editor.commandMenuEmpty)}
        </li>
      ) : (
        items.map((item, index) => (
          <li
            key={item.id}
            id={`${id}-opt-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            className={cn(styles['option'], index === activeIndex && styles['active'])}
            onMouseEnter={() => onHover(index)}
            // Keep textarea focus (preventDefault) so the caret/IME never blur.
            onMouseDown={(event) => {
              event.preventDefault()
              onSelect(index)
            }}
          >
            <span className={styles['label']}>{item.label}</span>
            {item.hint !== undefined && <span className={styles['hint']}>{item.hint}</span>}
          </li>
        ))
      )}
    </ul>
  )
})
