'use client'
import { useRef } from 'react'
import { cn, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { VisuallyHidden } from '../visually-hidden/visually-hidden'
import styles from './terminal.module.css'

export type TerminalLineType = 'command' | 'output' | 'error' | 'comment'

export interface TerminalLine {
  text: string
  prefix?: string
  type?: TerminalLineType
}

export interface TerminalProps {
  lines: TerminalLine[]
  /**
   * Characters typed per animation frame.
   *
   * @defaultValue `3`
   * @see the component manifest
   */
  speed?: number
  /**
   * Restart from the first line after the last one.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  loop?: boolean
  onComplete?: () => void
  labels?: { label?: string }
  className?: string
}

export function Terminal({
  lines,
  speed = 3,
  loop = false,
  onComplete,
  labels,
  className,
}: TerminalProps) {
  useSignals()
  const lineIndex = useSignal(0)
  const charIndex = useSignal(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useSignalEffect(() => {
    if (lines.length === 0) return
    let rafId: number
    function tick() {
      const li = lineIndex.value
      const ci = charIndex.value
      if (li >= lines.length) {
        onCompleteRef.current?.()
        if (loop) {
          lineIndex.value = 0
          charIndex.value = 0
        } else {
          return
        }
      } else {
        const target = lines[li]!.text
        if (ci < target.length) {
          charIndex.value = ci + speed
        } else {
          lineIndex.value = li + 1
          charIndex.value = 0
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  })

  const renderedLines = lines.slice(0, lineIndex.value + 1).map((line, i) => {
    const isCurrentLine = i === lineIndex.value
    const text = isCurrentLine ? line.text.slice(0, charIndex.value) : line.text
    return (
      <div key={i} className={styles['line']} data-type={line.type ?? 'output'}>
        {line.prefix && <span className={styles['prefix']}>{line.prefix}</span>}
        <span className={styles['text']}>{text}</span>
        {isCurrentLine && lineIndex.value < lines.length && <span className={styles['cursor']} />}
      </div>
    )
  })

  return (
    <div
      role="group"
      aria-label={labels?.label ?? t(builtin.terminal.label)}
      className={cn(styles['root'], className)}
    >
      {/* Screen readers get the whole script once, in order, from the first render. The
          typing animation is visual only: as a live region it fed them fragments. */}
      <VisuallyHidden>
        {lines.map((line, i) => (
          <span key={i}>
            {line.prefix ? `${line.prefix} ` : ''}
            {line.text}
            {'\n'}
          </span>
        ))}
      </VisuallyHidden>
      <div aria-hidden="true">{renderedLines}</div>
    </div>
  )
}
