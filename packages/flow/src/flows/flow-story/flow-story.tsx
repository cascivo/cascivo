'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { CSSProperties } from 'react'
import { useStory, type StoryClock } from '../../core/use-story.ts'
import { resolveScript, type StoryStep } from '../../engine/script.ts'
import type { FlowEdge as FlowEdgeData, FlowNode as FlowNodeData } from '../../engine/types.ts'
import { Flow } from '../flow/flow.tsx'
import styles from './flow-story.module.css'

export interface FlowStoryLabels {
  play?: string
  pause?: string
  next?: string
  previous?: string
  restart?: string
}

export interface FlowStoryProps {
  nodes: FlowNodeData[]
  edges: FlowEdgeData[]
  /** The storyboard: an ordered, serializable list of steps. */
  script: StoryStep[]
  loop?: boolean
  /** Per-step dwell time (ms). Default 1500. */
  stepDuration?: number
  /** Extra pause added after each step before advancing (ms), so the story is easier to follow. Default 0. */
  stepGap?: number
  playing?: boolean
  currentStep?: number
  onStepChange?: (step: number) => void
  /** Show the play/pause/prev/next controls. Default true. */
  controls?: boolean
  /** Start playing on mount. Default true. */
  autoPlay?: boolean
  background?: boolean
  /**
   * Allow selecting / dragging / connecting nodes. A storyline is a view by
   * default — pan/zoom still work. Default false.
   */
  interactive?: boolean
  labels?: FlowStoryLabels
  /** Injectable clock for deterministic tests. */
  clock?: StoryClock
  className?: string
  style?: CSSProperties
}

const ICON = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
} as const

/**
 * A scripted, sequenced, looping flow animation: walks a graph step by step,
 * fading in a caption at each step so the flow is *understood*. Composes
 * `<Flow>` and drives the active edge via a `currentStep` signal.
 * `useSignals()` first; no banned hooks.
 */
export function FlowStory({
  nodes,
  edges,
  script,
  loop = true,
  stepDuration = 1500,
  stepGap = 0,
  playing,
  currentStep,
  onStepChange,
  controls = true,
  autoPlay = true,
  background = true,
  interactive = false,
  labels,
  clock,
  className,
  style,
}: FlowStoryProps) {
  useSignals()
  const steps = resolveScript(script, edges)
  const story = useStory({
    steps,
    loop,
    stepDuration,
    stepGap,
    playing,
    defaultPlaying: autoPlay,
    currentStep,
    defaultCurrentStep: 0,
    onStepChange,
    clock,
  })

  const active = story.activeStep.value
  const index = story.currentStep.value
  const isPlaying = story.playing.value

  return (
    <div className={cn(styles['story'], className)} style={style}>
      <Flow
        nodes={nodes}
        edges={edges}
        background={background}
        interactive={interactive}
        activeEdgeId={active?.edgeId}
        activeDirection={active?.direction}
      />

      <div className={styles['overlay']}>
        <div className={styles['caption']} aria-live="polite">
          {active?.label && (
            <span key={index} className={styles['captionText']}>
              <strong>{active.label}</strong>
              {active.description && (
                <span className={styles['captionDesc']}> — {active.description}</span>
              )}
            </span>
          )}
        </div>

        {controls && (
          <div className={styles['controls']}>
            <button
              type="button"
              className={styles['button']}
              aria-label={labels?.previous ?? t(builtin.flow.previous)}
              onClick={story.prev}
            >
              <svg {...ICON}>
                <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
            <button
              type="button"
              className={styles['button']}
              aria-label={
                isPlaying
                  ? (labels?.pause ?? t(builtin.flow.pause))
                  : (labels?.play ?? t(builtin.flow.play))
              }
              aria-pressed={isPlaying}
              onClick={story.toggle}
            >
              {isPlaying ? (
                <svg {...ICON}>
                  <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
                </svg>
              ) : (
                <svg {...ICON}>
                  <path d="M7 5l11 7-11 7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={styles['button']}
              aria-label={labels?.next ?? t(builtin.flow.next)}
              onClick={story.next}
            >
              <svg {...ICON}>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
            <span className={styles['indicator']}>
              {t(builtin.flow.step, { current: index + 1, total: steps.length })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
