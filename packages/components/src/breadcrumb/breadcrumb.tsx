'use client'
import { cn, getLinkComponent, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import styles from './breadcrumb.module.css'

export interface BreadcrumbItem {
  /**
   * Stable React key. Provide when `label`/`href` may repeat.
   *
   * A real breadcrumb repeats hrefs — "Overview" and "Projects" both pointing at `/` is the
   * normal shape of a console trail — and without an `id` the crumbs key on their index, so
   * reordering or truncating the trail re-keys every row after the change.
   * `SideNavItem`, `ShellHeaderNavLink`, `ShellHeaderNavMenuItem`, `HeaderLink`,
   * `CommandItem` and `SwitcherLink` all carry this field; `BreadcrumbItem` was missed by
   * both earlier sweeps (2026-08-14 report §9).
   */
  id?: string
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  maxVisible?: number
  className?: string
  /**
   * Accessible label for the component.
   *
   * @defaultValue `Breadcrumb`
   * @see the component manifest
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
}

export function Breadcrumb({ items, maxVisible, className, ariaLabel, label }: BreadcrumbProps) {
  useSignals()
  const LinkComponent = getLinkComponent()
  const resolvedAriaLabel = ariaLabel ?? label ?? t(builtin.breadcrumb.nav)
  let visible = items
  const first = items[0]
  if (first !== undefined && maxVisible !== undefined && items.length > maxVisible) {
    visible = [first, { label: '…' }, ...items.slice(items.length - (maxVisible - 2))]
  }

  return (
    <nav aria-label={resolvedAriaLabel} className={cn(styles['breadcrumb'], className)}>
      <ol>
        {visible.map((item, index) => {
          const isLast = index === visible.length - 1
          return (
            <li key={item.id ?? `${index}-${item.label}`}>
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : item.href !== undefined ? (
                <LinkComponent href={item.href}>{item.label}</LinkComponent>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
