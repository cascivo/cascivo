'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { createSimulation, useSimulation } from '@cascivo/example-kit'
import { PROCESS_EDGES, PROCESS_NODES } from '../data/fixtures'
import { msg } from '../i18n'
import styles from './FlowDiagram.module.css'

export interface FlowDiagramProps {
  /** The node ID to highlight as the current token position. Null = no highlight. */
  currentNodeId: string | null
}

// Node geometry constants
const TASK_W = 120
const TASK_H = 40
const GATEWAY_SIZE = 36
const CIRCLE_R = 20

function nodeCenter(nodeId: string): { x: number; y: number } {
  const node = PROCESS_NODES.find((n) => n.id === nodeId)
  return { x: node?.x ?? 0, y: node?.y ?? 0 }
}

function edgePath(fromId: string, toId: string): string {
  const from = nodeCenter(fromId)
  const to = nodeCenter(toId)
  const fromNode = PROCESS_NODES.find((n) => n.id === fromId)!
  const toNode = PROCESS_NODES.find((n) => n.id === toId)!

  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return ''
  const ux = dx / len
  const uy = dy / len

  const startMargin =
    fromNode.type === 'task' ? TASK_W / 2 : fromNode.type === 'gateway' ? GATEWAY_SIZE : CIRCLE_R

  const endMargin =
    toNode.type === 'task'
      ? TASK_W / 2 + 6
      : toNode.type === 'gateway'
        ? GATEWAY_SIZE + 6
        : CIRCLE_R + 6

  return `M ${from.x + ux * startMargin} ${from.y + uy * startMargin} L ${to.x - ux * endMargin} ${to.y - uy * endMargin}`
}

function edgeMid(fromId: string, toId: string): { x: number; y: number } {
  const from = nodeCenter(fromId)
  const to = nodeCenter(toId)
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 8 }
}

// Module-level token signal + simulation — shared across all FlowDiagram instances
const diagramToken = signal<string | null>('start')

const diagramSim = createSimulation({
  tickMs: 1500,
  seed: 99,
  onTick: (rng) => {
    const cur = diagramToken.value
    const outgoing = PROCESS_EDGES.filter((e) => e.from === cur)
    if (outgoing.length === 0 || cur === 'end') {
      diagramToken.value = 'start'
      return
    }
    const next = rng.pick(outgoing)
    diagramToken.value = next.to
  },
})

export function FlowDiagram({ currentNodeId }: FlowDiagramProps) {
  useSignals()

  // Sync external prop into the module-level token when provided
  if (currentNodeId !== null) {
    diagramToken.value = currentNodeId
  }

  // Wire up simulation lifecycle to this component's mount/unmount
  useSimulation(diagramSim)

  const activeId = diagramToken.value
  const isRunning = diagramSim.running.value
  const playLabel = isRunning ? t(msg.pauseLabel) : t(msg.playLabel)

  return (
    <div className={styles['wrapper']}>
      <div className={styles['scrollable']}>
        <svg
          className={styles['svg']}
          viewBox="0 0 830 400"
          role="img"
          aria-label="Process flow diagram"
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="var(--cascivo-color-border)" />
            </marker>
          </defs>

          {/* Edges first so nodes render on top */}
          {PROCESS_EDGES.map((edge) => {
            const mid = edgeMid(edge.from, edge.to)
            return (
              <g key={edge.id}>
                <path d={edgePath(edge.from, edge.to)} className={styles['edge']} />
                {edge.label ? (
                  <text x={mid.x} y={mid.y} className={styles['labelEdge']}>
                    {edge.label}
                  </text>
                ) : null}
              </g>
            )
          })}

          {/* Nodes */}
          {PROCESS_NODES.map((node) => {
            const isActive = activeId === node.id
            const cx = node.x
            const cy = node.y

            if (node.type === 'task') {
              return (
                <g key={node.id}>
                  <rect
                    x={cx - TASK_W / 2}
                    y={cy - TASK_H / 2}
                    width={TASK_W}
                    height={TASK_H}
                    rx={6}
                    className={`${styles['nodeTask']} ${isActive ? styles['nodeActive'] : ''}`}
                  />
                  <text x={cx} y={cy} className={styles['labelNode']}>
                    {node.label}
                  </text>
                </g>
              )
            }

            if (node.type === 'gateway') {
              const s = GATEWAY_SIZE
              const points = `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`
              return (
                <g key={node.id}>
                  <polygon
                    points={points}
                    className={`${styles['nodeGateway']} ${isActive ? styles['nodeActive'] : ''}`}
                  />
                  <text x={cx} y={cy} className={styles['labelNode']}>
                    {node.label}
                  </text>
                </g>
              )
            }

            if (node.type === 'start') {
              return (
                <g key={node.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={CIRCLE_R}
                    className={`${styles['nodeStart']} ${isActive ? styles['nodeActive'] : ''}`}
                  />
                  <text
                    x={cx}
                    y={cy}
                    className={`${styles['labelNode']} ${styles['labelNodeStart']}`}
                  >
                    {node.label}
                  </text>
                </g>
              )
            }

            // end
            return (
              <g key={node.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={CIRCLE_R}
                  className={`${styles['nodeEnd']} ${isActive ? styles['nodeActive'] : ''}`}
                />
                <text x={cx} y={cy} className={`${styles['labelNode']} ${styles['labelNodeEnd']}`}>
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className={styles['controls']}>
        <button
          type="button"
          className={styles['playBtn']}
          aria-label={playLabel}
          onClick={() => diagramSim.toggle()}
        >
          {isRunning ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="2" y="2" width="4" height="10" rx="1" fill="currentColor" />
              <rect x="8" y="2" width="4" height="10" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <polygon points="3,2 12,7 3,12" fill="currentColor" />
            </svg>
          )}
          {playLabel}
        </button>
        {activeId ? (
          <span className={styles['activeLabel']}>
            Current step:{' '}
            <strong>{PROCESS_NODES.find((n) => n.id === activeId)?.label ?? activeId}</strong>
          </span>
        ) : null}
      </div>
    </div>
  )
}
