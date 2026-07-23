'use client'
import { cn } from '@cascivo/core'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './grid.module.css'
import type { SpaceStep } from '@cascivo/core'

/** A scalar value, or a per-breakpoint object keyed by the canonical scale. */
export type Responsive<T> = T | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl', T>>

function isResponsive<T>(value: Responsive<T>): value is Partial<Record<string, T>> {
  return typeof value === 'object' && value !== null
}

/**
 * Map a responsive number onto CSS custom properties. Scalar → `<prefix>` only
 * (unchanged back-compat). Object → `<prefix>` for `base` plus `<prefix>-<bp>`
 * per declared tier; omitted tiers fall back through the CSS var chain.
 */
function responsiveVars(prefix: string, value: Responsive<number> | undefined): CSSProperties {
  if (value === undefined) return {}
  if (!isResponsive(value)) return { [prefix]: String(value) } as CSSProperties
  const out: Record<string, string> = {}
  if (value.base !== undefined) out[prefix] = String(value.base)
  for (const bp of ['sm', 'md', 'lg', 'xl'] as const) {
    const v = value[bp]
    if (v !== undefined) out[`${prefix}-${bp}`] = String(v)
  }
  return out as CSSProperties
}

/** Grid track alignment keyword (maps directly to `align-items` / `justify-items`). */
export type GridAlign = 'start' | 'center' | 'end' | 'stretch'

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Column count. A number, or `{ base, sm, md, lg, xl }` for responsive columns. */
  cols?: Responsive<number>
  gap?: SpaceStep
  /** Block-axis alignment of items within their cells (`align-items`). Defaults to `stretch`. */
  align?: GridAlign
  /** Inline-axis alignment of items within their cells (`justify-items`). Defaults to `stretch`. */
  justify?: GridAlign
}

export function Grid({
  cols = 12,
  gap = 4,
  align,
  justify,
  className,
  style,
  children,
  ...props
}: GridProps) {
  // The outer element establishes the query container (`container-type`); the inner
  // `.grid` hosts the `@container` column rules, which resolve against that outer
  // element. An element can never be its own query container, so a self-contained
  // Grid needs this wrapper — without it responsive `cols` silently collapse to the
  // base count wherever no ancestor happens to establish containment.
  return (
    <div
      className={cn(styles['grid-container'], className)}
      style={{
        ...responsiveVars('--_grid-cols', cols),
        ['--_grid-gap' as string]: `var(--cascivo-space-${gap})`,
        ...(align ? { ['--_grid-align' as string]: align } : {}),
        ...(justify ? { ['--_grid-justify' as string]: justify } : {}),
        ...style,
      }}
      {...props}
    >
      <div className={styles['grid']} data-responsive={isResponsive(cols) ? '' : undefined}>
        {children}
      </div>
    </div>
  )
}

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Column span. A number, or `{ base, sm, md, lg, xl }` for responsive spans. */
  span?: Responsive<number>
}

export function GridItem({ span, className, style, ...props }: GridItemProps) {
  const responsive = span !== undefined && isResponsive(span)
  return (
    <div
      className={cn(styles['grid-item'], className)}
      data-responsive={responsive ? '' : undefined}
      style={{ ...responsiveVars('--_span', span), ...style }}
      {...props}
    />
  )
}
