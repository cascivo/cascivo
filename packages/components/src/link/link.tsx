'use client'
import { cn, Slot } from '@cascivo/core'
import type { AnchorHTMLAttributes } from 'react'
import styles from './link.module.css'

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * `standalone` (default) owns its own typography and underlines on hover;
   * `inline` inherits the surrounding prose font and is always underlined.
   */
  variant?: 'standalone' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  /**
   * When true, treats the link as external (opens in a new tab with rel safety).
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  external?: boolean
  /**
   * Render the single child element instead of cascivo's own `<a>`, so the link
   * styling lands on your router's `Link`. **This is the supported way to style an
   * in-content router link** — `setLinkComponent` only covers the config-driven nav
   * components (SideNav, ShellHeader, Breadcrumb, …), not links you write in page
   * content. See `docs/USING-WITH-A-ROUTER.md`.
   *
   * ```tsx
   * <Link asChild><RouterLink to="/projects/a">Project A</RouterLink></Link>
   * ```
   */
  asChild?: boolean
}

export function Link({
  variant = 'standalone',
  size = 'md',
  external = false,
  asChild = false,
  className,
  children,
  ...props
}: LinkProps) {
  const Comp = asChild ? Slot : 'a'
  return (
    <Comp
      data-variant={variant}
      data-size={size}
      data-external={external || undefined}
      className={cn(styles['link'], className)}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...props}
    >
      {children}
    </Comp>
  )
}
