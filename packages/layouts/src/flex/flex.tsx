import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes } from 'react'
import styles from './flex.module.css'
import type { SpaceStep } from '@cascivo/core'

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Flex direction. ⚠ Defaults to `vertical`, unlike CSS `flex-direction` (and unlike
   * Chakra/MUI/Radix `Flex`, which default to a row) — `<Flex justify="between">` alone
   * produces a centered vertical stack.
   *
   * @defaultValue `vertical`
   * @see the component manifest
   */
  direction?: 'vertical' | 'horizontal'
  /**
   * Spacing token step
   *
   * @defaultValue `4`
   * @see the component manifest
   */
  gap?: SpaceStep
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  /**
   * Allow wrapping
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  wrap?: boolean
}

export function Flex({
  direction = 'vertical',
  gap = 4,
  align,
  justify,
  wrap = false,
  className,
  style,
  ...props
}: FlexProps) {
  return (
    <div
      className={cn(styles['flex'], className)}
      data-direction={direction}
      data-wrap={wrap ? '' : undefined}
      style={{
        ['--_flex-gap' as string]: `var(--cascivo-space-${gap})`,
        ...(align
          ? { alignItems: align === 'start' || align === 'end' ? `flex-${align}` : align }
          : {}),
        ...(justify
          ? {
              justifyContent:
                justify === 'between'
                  ? 'space-between'
                  : justify === 'start' || justify === 'end'
                    ? `flex-${justify}`
                    : justify,
            }
          : {}),
        ...style,
      }}
      {...props}
    />
  )
}

/**
 * How a `Flex` child sizes itself along the main axis.
 *
 * `'auto'` grows and shrinks (`flex: 1 1 auto`); `'fixed'` does neither (`flex: 0 0 auto`),
 * which is what a fixed-width child like `Sparkline` needs; `'grow'` takes the leftover space
 * without shrinking below its content; `'shrink'` gives way but never grows.
 */
export type FlexItemSize = 'auto' | 'fixed' | 'grow' | 'shrink'

export interface FlexItemProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Main-axis sizing behaviour.
   *
   * `Flex` had no item-level control at all, so the documented fix for a fixed-width child —
   * pull it out of flex sizing — was unwritable in cascivo and every dashboard reached for a
   * raw `style={{ flex: '0 0 auto' }}` wrapper. All four raw-CSS escapes in one 1,500-line
   * app were this (2026-08-31 report §24).
   *
   * @defaultValue `auto`
   * @see the component manifest
   */
  size?: FlexItemSize
  /**
   * `flex-basis` — the child's size before free space is distributed. Any CSS length; `0`
   * with `size="grow"` gives equal-width columns regardless of content.
   */
  basis?: string
  /**
   * Allow the child to shrink below its intrinsic content width.
   *
   * A flex item defaults to `min-width: auto`, so a long unbreakable string (a deployment
   * URL, a commit sha) refuses to shrink and pushes its siblings out of the row. This is the
   * `minWidth: 0` every layout eventually writes by hand.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  truncate?: boolean
}

/**
 * A `Flex` child with main-axis sizing, the counterpart to `GridItem`.
 *
 * Only needed for a child that must NOT size like the rest — a fixed-width `Sparkline`, the
 * one field in a toolbar that should absorb the leftover width, a cell whose text must be
 * allowed to ellipsize. Children with no special sizing need no wrapper.
 */
export function FlexItem({
  size = 'auto',
  basis,
  truncate = false,
  className,
  style,
  ...props
}: FlexItemProps) {
  return (
    <div
      className={cn(styles['flex-item'], className)}
      data-size={size}
      data-truncate={truncate ? '' : undefined}
      style={{ ...(basis !== undefined ? { flexBasis: basis } : {}), ...style }}
      {...props}
    />
  )
}
