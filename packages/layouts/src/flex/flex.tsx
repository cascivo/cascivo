'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './flex.module.css'
import type { SpaceStep } from '../space'

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal'
  gap?: SpaceStep
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
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
