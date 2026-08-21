import { cn, Slot } from '@cascivo/core/pure'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './icon-button.module.css'

interface IconButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon to render. Alias for `children`. Any ReactNode — `@cascivo/icons`
   * ships ~440 ready-made SVG icon components, or pass your own. */
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /**
   * `ghost` is transparent until hover, `outline` adds a border, `filled` gives the button a
   * solid surface.
   *
   * @defaultValue `ghost`
   * @see the component manifest
   */
  variant?: 'ghost' | 'outline' | 'filled'
  /**
   * When true, renders the child element as the root via Slot, merging props (polymorphic
   * rendering).
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  asChild?: boolean
}

/**
 * Exactly one of `label` / `ariaLabel` is required — an icon-only control with no
 * accessible name is a bug, so this stays enforced by the type rather than a dev warning.
 * `ariaLabel` is the catalog's convention for an invisible accessible name; `IconButton`
 * predates it and shipped `label`, so both work and neither is deprecated.
 */
export type IconButtonProps = IconButtonBaseProps &
  ({ label: string; ariaLabel?: never } | { ariaLabel: string; label?: never })

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    ariaLabel,
    icon,
    size = 'md',
    variant = 'ghost',
    asChild = false,
    className,
    children,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      type={asChild ? undefined : 'button'}
      aria-label={label ?? ariaLabel}
      data-size={size}
      data-variant={variant}
      className={cn(styles['iconButton'], className as string | undefined)}
      ref={ref as never}
      {...(props as Record<string, unknown>)}
    >
      {children ?? icon}
    </Comp>
  )
})
