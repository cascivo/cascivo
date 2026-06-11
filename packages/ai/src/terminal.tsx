'use client'
import { useRef } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import styles from './terminal.module.css'

export type TerminalLineType = 'command' | 'output' | 'error' | 'comment'

export interface TerminalLine {
  text: string
  prefix?: string
  type?: TerminalLineType
}

export interface TerminalProps {
  lines: TerminalLine[]
  speed?: number
  loop?: boolean
  onComplete?: () => void
  className?: string
}

export function Terminal({ lines, speed = 3, loop = false, onComplete, className }: TerminalProps) {
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
        }
        return
      }
      const line = lines[li]!
      const target = line.text
      if (ci < target.length) {
        charIndex.value = ci + speed
      } else {
        lineIndex.value = li + 1
        charIndex.value = 0
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
      <div key={i} className={styles.line} data-type={line.type ?? 'output'}>
        {line.prefix && <span className={styles.prefix}>{line.prefix}</span>}
        <span className={styles.text}>{text}</span>
        {isCurrentLine && lineIndex.value < lines.length && (
          <span className={styles.cursor} aria-hidden="true" />
        )}
      </div>
    )
  })

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Terminal output"
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {renderedLines}
    </div>
  )
}
