'use client'
import { cn, useComputed, useSignals } from '@cascivo/core'
import { useId, type ReactNode } from 'react'
import { edgePath } from '../../engine/path.ts'
import type { EdgePathType, HandlePosition } from '../../engine/types.ts'
import styles from './flow-edge.module.css'

export interface FlowEdgeProps {
  id?: string
  /** Resolved source anchor (flow coords). */
  sourceX: number
  sourceY: number
  /** Resolved target anchor (flow coords). */
  targetX: number
  targetY: number
  sourcePosition?: HandlePosition
  targetPosition?: HandlePosition
  type?: EdgePathType
  animated?: boolean
  label?: ReactNode
  selected?: boolean
  /** Render an arrowhead at the target. Default true. */
  markerEnd?: boolean
  /** Direction the dash travels when animated. Default 'forward'. */
  direction?: 'forward' | 'reverse'
  /** Highlight the edge (used by FlowStory's active step). */
  active?: boolean
  className?: string
}

/**
 * An SVG edge: computes its path from source→target anchors using the owned
 * bezier/straight/smoothstep builders, draws an arrowhead marker, and (if
 * `label`) an HTML label at the midpoint. Animation is CSS-only.
 * `useSignals()` first; no `useState`/`useEffect`.
 */
export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = 'right',
  targetPosition = 'left',
  type = 'bezier',
  animated = false,
  label,
  selected = false,
  markerEnd = true,
  direction = 'forward',
  active,
  className,
}: FlowEdgeProps) {
  useSignals()
  const reactId = useId()
  const markerId = `flow-arrow-${id ?? reactId}`

  const path = useComputed(() =>
    edgePath(type, {
      source: { x: sourceX, y: sourceY },
      target: { x: targetX, y: targetY },
      sourcePosition,
      targetPosition,
    }),
  )

  const { d, mid } = path.value

  return (
    <>
      <svg
        className={cn(styles['edgeSvg'], className)}
        data-animated={animated || undefined}
        data-selected={selected || undefined}
        data-active={active || undefined}
        data-direction={direction}
        aria-hidden="true"
      >
        {markerEnd && (
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path className={styles['arrow']} d="M0,0 L10,5 L0,10 z" />
            </marker>
          </defs>
        )}
        {/* Wide transparent hit path for pointer interaction. */}
        <path className={styles['hit']} d={d} />
        <path
          className={styles['edgePath']}
          d={d}
          markerEnd={markerEnd ? `url(#${markerId})` : undefined}
        />
      </svg>
      {label != null && (
        <div
          className={styles['label']}
          style={{
            ['--flow-label-x' as string]: `${mid.x}px`,
            ['--flow-label-y' as string]: `${mid.y}px`,
          }}
        >
          {label}
        </div>
      )}
    </>
  )
}
