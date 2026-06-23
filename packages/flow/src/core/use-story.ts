'use client'
import {
  useComputed,
  useControllableSignal,
  useSignalEffect,
  type ReadonlySignal,
  type Signal,
} from '@cascivo/core'
import { useRef } from 'react'
import type { ResolvedStep } from '../engine/script.ts'

export interface StoryClock {
  setTimeout: (callback: () => void, ms: number) => unknown
  clearTimeout: (handle: unknown) => void
}

export interface UseStoryOptions {
  steps: ResolvedStep[]
  loop?: boolean | undefined
  /** Controlled play state. */
  playing?: boolean | undefined
  defaultPlaying?: boolean | undefined
  onPlayingChange?: ((playing: boolean) => void) | undefined
  /** Controlled step index. */
  currentStep?: number | undefined
  defaultCurrentStep?: number | undefined
  onStepChange?: ((step: number) => void) | undefined
  /** Default per-step duration (ms). */
  stepDuration?: number | undefined
  /** Injectable clock for deterministic tests (default real timers). */
  clock?: StoryClock | undefined
}

export interface UseStoryReturn {
  currentStep: Signal<number>
  playing: Signal<boolean>
  activeStep: ReadonlySignal<ResolvedStep | null>
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  restart: () => void
}

const DEFAULT_STEP_MS = 1500

/**
 * The storyline sequencer: a `currentStep` signal advanced by a timer inside
 * `useSignalEffect` (the carousel/relative-time idiom) with an injectable clock
 * for deterministic tests. Loops when `loop`. No `useEffect`/wall-clock.
 */
export function useStory(options: UseStoryOptions): UseStoryReturn {
  const { steps, loop = true, stepDuration = DEFAULT_STEP_MS } = options

  const [currentStep, setStep] = useControllableSignal<number>({
    value: options.currentStep,
    defaultValue: options.defaultCurrentStep ?? 0,
    onChange: options.onStepChange,
  })
  const [playing, setPlaying] = useControllableSignal<boolean>({
    value: options.playing,
    defaultValue: options.defaultPlaying ?? true,
    onChange: options.onPlayingChange,
  })

  const activeStep = useComputed(() => steps[currentStep.value] ?? null)

  const clockRef = useRef<StoryClock | undefined>(options.clock)
  clockRef.current = options.clock
  const stepsRef = useRef(steps)
  stepsRef.current = steps

  const clock = (): StoryClock =>
    clockRef.current ?? {
      setTimeout: (cb, ms) => window.setTimeout(cb, ms),
      clearTimeout: (h) => window.clearTimeout(h as number),
    }

  const advance = (delta: number): void => {
    const total = stepsRef.current.length
    if (total === 0) return
    const raw = currentStep.peek() + delta
    const wrapped = loop ? ((raw % total) + total) % total : Math.max(0, Math.min(total - 1, raw))
    setStep(wrapped)
  }

  useSignalEffect(() => {
    if (!playing.value) return
    const i = currentStep.value
    const total = steps.length
    if (total === 0) return
    if (typeof window === 'undefined' && !clockRef.current) return
    const dur = steps[i]?.duration ?? stepDuration
    const c = clock()
    const handle = c.setTimeout(() => {
      const nextIndex = i + 1
      if (nextIndex >= total) {
        if (loop) setStep(0)
        else setPlaying(false)
      } else {
        setStep(nextIndex)
      }
    }, dur)
    return () => c.clearTimeout(handle)
  })

  return {
    currentStep,
    playing,
    activeStep,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying(!playing.peek()),
    next: () => advance(1),
    prev: () => advance(-1),
    restart: () => {
      setStep(0)
      setPlaying(true)
    },
  }
}
