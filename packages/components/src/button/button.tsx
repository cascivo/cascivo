import { cn, Slot } from '@cascivo/core/pure'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '../spinner/spinner'
import styles from './button.module.css'

/**
 * Button.
 *
 * ⚠ **DOM shape:** children are wrapped in an inner `<span>` so the loading `Spinner` can be
 * a sibling rather than being nested inside the label. Layout CSS written against
 * `.my-button > span` therefore targets that wrapper, not your content — one adopter's
 * `> span { display: flex }` hit the wrapper and collapsed the spacing inside it. The wrapper
 * is already a flex row that inherits the button's `gap`, so composing an icon with a label
 * needs no CSS of your own.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * `primary` for the main action, `secondary` for a supporting one, `ghost` for a
   * borderless action in dense UI, `destructive` for anything that deletes.
   *
   * @defaultValue `primary`
   * @see the component manifest
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  /**
   * When true, shows a loading state.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  loading?: boolean
  /**
   * Render the single child element instead of a native `<button>` so the button
   * styling lands on, e.g., a real `<a href>` (preserves middle-click / open-in-new-tab).
   * The child owns its own content; the loading spinner is not rendered in this mode.
   */
  asChild?: boolean
}

/**
 * `forwardRef` so `ref` reaches the underlying `<button>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10).
 *
 * Under `asChild` the ref goes to `Slot`, which composes it onto the child element, so a
 * consumer's ref lands on whatever they rendered rather than being dropped.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    asChild = false,
    className,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const shared = {
    'data-variant': variant,
    'data-size': size,
    'data-state': loading ? 'loading' : 'idle',
    'aria-busy': loading || undefined,
    className: cn(styles['button'], className),
  }

  if (asChild) {
    return (
      <Slot {...shared} ref={ref as never} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button {...shared} ref={ref} disabled={disabled || loading} {...props}>
      {loading && <Spinner size="sm" aria-hidden="true" />}
      <span className={styles['label']}>{children}</span>
    </button>
  )
})
