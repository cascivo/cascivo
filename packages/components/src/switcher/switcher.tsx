'use client'
import { cn, getLinkComponent, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { ReactNode } from 'react'
import styles from './switcher.module.css'

export interface SwitcherLink {
  /**
   * Stable React key. Provide when `label`/`href` may repeat (e.g. placeholder `#` links).
   *
   * Without it the rows key on `href`, so three sibling teams that all link to `/` produce
   * duplicate-key warnings on every render and the adopter has to make the hrefs artificially
   * distinct (2026-08-08 report A). `SideNavItem`, `ShellHeaderNavLink`,
   * `ShellHeaderNavMenuItem`, `HeaderLink` and `CommandItem` all carry this field already;
   * `Switcher` was missed by that sweep.
   */
  id?: string
  label: string
  href: string
  active?: boolean
  icon?: ReactNode
}

export type SwitcherEntry = SwitcherLink | { divider: true }

export interface SwitcherProps {
  items: SwitcherEntry[]
  /**
   * Text label for the control.
   *
   * @defaultValue `Switch application`
   * @see the component manifest
   */
  label?: string
  className?: string | undefined
}

export function Switcher({ items, label, className }: SwitcherProps) {
  useSignals()
  const LinkComponent = getLinkComponent()
  return (
    <ul
      aria-label={label ?? t(builtin.switcher.label)}
      className={cn(styles['switcher'], className)}
    >
      {items.map((entry, i) =>
        'divider' in entry ? (
          // Keep the <li> a real listitem (a <ul> may only contain listitems);
          // the separator role lives on an inner element.
          <li key={`divider-${i}`}>
            <span role="separator" aria-orientation="horizontal" className={styles['divider']} />
          </li>
        ) : (
          <li key={entry.id ?? entry.href}>
            <LinkComponent
              href={entry.href}
              aria-current={entry.active ? 'page' : undefined}
              data-state={entry.active ? 'active' : undefined}
              className={styles['item']}
            >
              {entry.icon && (
                <span className={styles['icon']} aria-hidden="true">
                  {entry.icon}
                </span>
              )}
              {entry.label}
            </LinkComponent>
          </li>
        ),
      )}
    </ul>
  )
}
