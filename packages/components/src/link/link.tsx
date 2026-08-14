import { cn, Slot } from '@cascivo/core/pure'
import { forwardRef } from 'react'
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
   * content. See https://cascivo.com/docs/using-with-a-router.md — offline:
   * `npx -y @cascivo/docs guide using-with-a-router`.
   *
   * ```tsx
   * <Link asChild><RouterLink to="/projects/a">Project A</RouterLink></Link>
   * ```
   */
  asChild?: boolean
}

/**
 * `forwardRef` so `ref` reaches the underlying `<a>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10). `forwardRef` rather than a
 * bare `ref?: Ref<T>` prop keeps the `react >= 18` peer floor honest, since ref-as-prop does
 * not work there.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    variant = 'standalone',
    size = 'md',
    external = false,
    asChild = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : 'a'
  return (
    <Comp
      data-variant={variant}
      data-size={size}
      data-external={external || undefined}
      className={cn(styles['link'], className)}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      ref={ref as never}
      {...props}
    >
      {children}
    </Comp>
  )
})
