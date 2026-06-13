'use client'
import { useRef } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import styles from './streaming-text.module.css'

export interface StreamingTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
}

export function StreamingText({ text, speed = 2, onComplete, className }: StreamingTextProps) {
  useSignals()
  const displayed = useSignal('')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Reset when text prop changes
  displayed.value = displayed.value.length > text.length ? '' : displayed.value

  useSignalEffect(() => {
    const target = text
    if (displayed.value === target) {
      onCompleteRef.current?.()
      return
    }
    let rafId: number
    function tick() {
      const current = displayed.value
      if (current.length >= target.length) {
        onCompleteRef.current?.()
        return
      }
      displayed.value = target.slice(0, current.length + speed)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  })

  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')}>
      {displayed.value}
      {displayed.value !== text && <span className={styles.cursor} aria-hidden="true" />}
    </span>
  )
}
