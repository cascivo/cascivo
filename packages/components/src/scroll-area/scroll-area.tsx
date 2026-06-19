'use client'
import { cn, useSignalEffect, useSignals } from '@cascivo/core'
import { useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import styles from './scroll-area.module.css'

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Max block size of the scroll container (any CSS length). */
  height?: string
  /** Max inline size of the scroll container (any CSS length). */
  width?: string
  /** Which axes may scroll. */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** Edge affordance: box-shadow (default), a mask-image fade (HeroUI ScrollShadow), or none. */
  edges?: 'shadow' | 'mask' | 'none'
  children?: ReactNode
}

export function ScrollArea({
  height,
  width,
  orientation = 'vertical',
  edges = 'shadow',
  className,
  style,
  children,
  ...props
}: ScrollAreaProps) {
  useSignals()
  const nodeRef = useRef<HTMLDivElement | null>(null)

  // Drive scroll-shadow data attributes from the scroll position. No useEffect —
  // useSignalEffect runs the subscription once on mount and cleans up on unmount.
  useSignalEffect(() => {
    const node = nodeRef.current
    if (!node) return

    const update = (): void => {
      const atTop = node.scrollTop <= 0
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1
      const atStart = node.scrollLeft <= 0
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1
      node.toggleAttribute('data-scroll-top', !atTop)
      node.toggleAttribute('data-scroll-bottom', !atBottom)
      node.toggleAttribute('data-scroll-start', !atStart)
      node.toggleAttribute('data-scroll-end', !atEnd)
    }

    update()
    node.addEventListener('scroll', update, { passive: true })
    return () => {
      node.removeEventListener('scroll', update)
    }
  })

  const sizeStyle = {
    ...(height !== undefined ? { '--cascivo-scroll-area-height': height } : {}),
    ...(width !== undefined ? { '--cascivo-scroll-area-width': width } : {}),
    ...style,
  } as CSSProperties

  return (
    <div
      ref={nodeRef}
      data-orientation={orientation}
      data-edges={edges}
      className={cn(styles['root'], className)}
      style={sizeStyle}
      {...props}
    >
      {children}
    </div>
  )
}
