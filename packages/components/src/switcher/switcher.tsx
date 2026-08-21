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
   * Accessible name for the switcher list. Not rendered — screen readers only.
   *
   * @defaultValue `Switch application`
   * @see the component manifest
   */
  label?: string
  /**
   * Alias of `label` — the same invisible accessible name under the catalog's own spelling.
   *
   * `ariaLabel` is what the catalog calls a name nothing paints, so it is the guess an agent
   * makes after reading one other component (2026-08-21 report item 1). This component
   * predates the convention and shipped `label`; both work and neither is deprecated.
   */
  ariaLabel?: string
  className?: string | undefined
}

/**
 * An **always-visible** list of apps/workspaces. Every entry renders at once and stays on
 * screen — despite the name, nothing collapses and there is no trigger.
 *
 * For the shape most consoles want — one row showing the current workspace, a menu on click
 * — use `Dropdown`. An adopter picked `Switcher` from its name for a Vercel-style team
 * switcher and got both teams stacked permanently in the sidebar (2026-08-21 report item 5).
 */
export function Switcher({ items, label, ariaLabel, className }: SwitcherProps) {
  useSignals()
  const LinkComponent = getLinkComponent()
  return (
    <ul
      aria-label={ariaLabel ?? label ?? t(builtin.switcher.label)}
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
