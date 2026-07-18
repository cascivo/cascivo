'use client'
import { cn, useControllableSignal, useRovingFocus, useSignals } from '@cascivo/core'
import { useId } from 'react'
import type { ReactNode } from 'react'
import styles from './structured-list.module.css'

export interface StructuredListItem {
  id: string
  cells: ReactNode[]
  selected?: boolean
}

export interface StructuredListProps {
  items: StructuredListItem[]
  headers?: ReactNode[]
  selectable?: boolean
  value?: string
  defaultValue?: string
  onSelect?: (id: string) => void
  className?: string
  'aria-label'?: string
}

export function StructuredList(props: StructuredListProps) {
  const { items, headers, selectable = false, className, 'aria-label': ariaLabel } = props

  if (selectable) {
    return <SelectableStructuredList {...props} />
  }

  return (
    <div role="table" aria-label={ariaLabel} className={cn(styles['list'], className)}>
      {headers && (
        <div role="row" className={styles['headerRow']}>
          {headers.map((header, i) => (
            <div role="columnheader" key={i} className={styles['headerCell']}>
              {header}
            </div>
          ))}
        </div>
      )}
      <div role="rowgroup" className={styles['body']}>
        {items.map((item) => (
          <div role="row" key={item.id} className={styles['row']}>
            {item.cells.map((cell, i) => (
              <div role="cell" key={i} className={styles['cell']}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SelectableStructuredList({
  items,
  headers,
  value,
  defaultValue,
  onSelect,
  className,
  'aria-label': ariaLabel,
}: StructuredListProps) {
  useSignals()
  const groupId = useId()
  const [selected, setSelected] = useControllableSignal<string>({
    value,
    defaultValue: defaultValue ?? items.find((item) => item.selected)?.id ?? '',
    onChange: onSelect,
  })
  const roving = useRovingFocus({ orientation: 'vertical', loop: false })

  const select = (id: string) => {
    setSelected(id)
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(styles['list'], styles['selectable'], className)}
    >
      {headers && (
        <div className={styles['headerRow']}>
          <div className={styles['headerCell']} aria-hidden="true" />
          {headers.map((header, i) => (
            <div key={i} className={styles['headerCell']}>
              {header}
            </div>
          ))}
        </div>
      )}
      <div className={styles['body']}>
        {items.map((item, index) => {
          const checked = selected.value === item.id
          const { ref: itemRef, ...rovingProps } = roving.getItemProps(index)
          return (
            <div
              key={item.id}
              role="radio"
              aria-checked={checked}
              aria-labelledby={`${groupId}-${item.id}-label`}
              data-selected={checked || undefined}
              className={styles['row']}
              ref={itemRef}
              {...rovingProps}
              onClick={() => select(item.id)}
              onKeyDown={(event) => {
                rovingProps.onKeyDown(event)
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  select(item.id)
                }
              }}
            >
              <div className={styles['cell']} aria-hidden="true">
                <span className={styles['indicator']} />
              </div>
              <div className={styles['cell']} id={`${groupId}-${item.id}-label`}>
                {item.cells[0]}
              </div>
              {item.cells.slice(1).map((cell, i) => (
                <div role="cell" key={i} className={styles['cell']}>
                  {cell}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
