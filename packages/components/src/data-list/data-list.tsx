import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './data-list.module.css'

/** One label/value pair in a config-driven `DataList`. */
export interface DataListEntry {
  id?: string
  label: ReactNode
  value: ReactNode
}

/**
 * The label/value pair shape.
 *
 * @deprecated Use `DataListEntry`. `DataListItem` is now also the **component** — every
 * structural sibling in the catalog is one (`AccordionItem`, `ContextMenuItem`,
 * `TimelineItem`, `ListItem`, `ContainedListItem`, `StructuredListItem`, `SwipeItem`), so an
 * adopter wrote `<DataList><DataListItem label="Domain">…</DataListItem></DataList>` and hit
 * a type where a component belonged (2026-08-31 report §22). TypeScript keeps a type and a
 * function of the same name in separate spaces, so this alias holds existing
 * `DataListItem[]` annotations compiling while the JSX now works; it is removed at 2.0.
 */
export type DataListItem = DataListEntry

export interface DataListProps extends HTMLAttributes<HTMLDListElement> {
  /**
   * The pairs to render. Omit it and pass `<DataListItem>` children instead when a value
   * needs surrounding JSX (a `Status`, a `CopyButton`) that reads better inline.
   */
  items?: DataListEntry[]
  /**
   * Where each **value** sits relative to its own label — not the axis of the list.
   *
   * `'horizontal'` puts the value beside its label; `'vertical'` puts it underneath. Items
   * are stacked vertically either way, which is the part the name does not say: an adopter
   * read `orientation="vertical"` as "lay the items out vertically" and got a very tall
   * block from six rows (2026-08-21 report item 9). In a summary card, prefer
   * `'horizontal'`.
   *
   * @defaultValue `horizontal`
   * @see the component manifest
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * When true, shows dividers between items.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  dividers?: boolean
  size?: 'sm' | 'md'
  /** `<DataListItem>` rows, as an alternative to `items`. */
  children?: ReactNode
}

export function DataList({
  items,
  orientation = 'horizontal',
  dividers = false,
  size = 'md',
  className,
  children,
  ...props
}: DataListProps) {
  return (
    <dl
      data-orientation={orientation}
      data-size={size}
      data-dividers={dividers ? '' : undefined}
      className={cn(styles['list'], className as string | undefined)}
      {...props}
    >
      {items?.map((item, i) => (
        <div key={item.id ?? i} className={styles['row']}>
          <dt className={styles['term']}>{item.label}</dt>
          <dd className={styles['detail']}>{item.value}</dd>
        </div>
      ))}
      {children}
    </dl>
  )
}

export interface DataListItemProps {
  /** The term. Rendered as the row's `<dt>`. */
  label: ReactNode
  /** The value. Rendered as the row's `<dd>`. */
  children: ReactNode
}

/**
 * One row of a `DataList`, for when a value needs surrounding JSX that reads better inline
 * than inside an `items` array.
 *
 * Must be a direct child of `DataList` — it renders the `<dt>`/`<dd>` pair that a `<dl>`
 * expects, and inherits every layout token (`orientation`, `size`, `dividers`) from it.
 */
export function DataListItem({ label, children }: DataListItemProps) {
  return (
    <div className={styles['row']}>
      <dt className={styles['term']}>{label}</dt>
      <dd className={styles['detail']}>{children}</dd>
    </div>
  )
}
