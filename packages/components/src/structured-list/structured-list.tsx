'use client'
import { cn, useControllableSignal, useRovingFocus, useSignals } from '@cascivo/core'
import { useId } from 'react'
import type { ReactNode } from 'react'
import styles from './structured-list.module.css'

/**
 * One row's data. **This is a type, not a component.**
 *
 * `StructuredList` is config-driven: pass `items`, not children. An adopter imported
 * `StructuredListItem` expecting a composable `<StructuredListItem>` — a reasonable guess,
 * since most catalogs ship both forms — wrote markup against it, and only then found the
 * real API. There is no composable form and none is planned; the config shape is what
 * makes the list keyboard-navigable and selectable without per-row wiring.
 */
export interface StructuredListItem {
  id: string
  cells: ReactNode[]
  selected?: boolean
}

export interface StructuredListProps {
  /** The rows. `StructuredList` is config-driven — there is no composable child form. */
  items: StructuredListItem[]
  headers?: ReactNode[]
  /**
   * When true, rows can be selected.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  selectable?: boolean
  value?: string
  defaultValue?: string
  onSelect?: (id: string) => void
  className?: string
  /**
   * Invisible accessible name. `ariaLabel` is the catalog convention (see the
   * accessible-name table in `docs/AI-RULES.md`); the DOM spelling `aria-label` is accepted
   * too, so either guess compiles. Two spellings of one idea inside a package was a coin
   * flip on every component.
   */
  ariaLabel?: string
  /**
   * Alias of `ariaLabel` — same invisible accessible name, the other spelling. Not rendered.
   *
   * `ariaLabel` is the catalog convention and stays preferred, but `label` is the guess an
   * adopter makes when they have not read the convention, and an unaccepted guess costs a
   * compile cycle for nothing (2026-08-21 report item 1). Pass either.
   */
  label?: string
  /** DOM-spelled alias of {@link ariaLabel}. */
  'aria-label'?: string
}

export function StructuredList(props: StructuredListProps) {
  const {
    items,
    headers,
    selectable = false,
    className,
    ariaLabel: ariaLabelProp,
    label,
    'aria-label': ariaLabelAttr,
  } = props
  const ariaLabel = ariaLabelAttr ?? ariaLabelProp ?? label

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
  ariaLabel: ariaLabelProp,
  'aria-label': ariaLabelAttr,
  label,
}: StructuredListProps) {
  const ariaLabel = ariaLabelAttr ?? ariaLabelProp ?? label
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
