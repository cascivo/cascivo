'use client'
import { cloneElement, isValidElement, useRef, type ReactElement, type Ref } from 'react'
import { useSignal, useSignalEffect, useSignals, type Signal } from './signals.ts'
import { composeRefs } from './utils.ts'

export interface PresenceProps {
  /** Whether the content should be present. Accepts a boolean or a Signal. */
  present: boolean | Signal<boolean>
  /** A single element child; receives `data-state="open|closed"` and a composed ref. */
  children: ReactElement
}

type ElementWithRef = ReactElement<Record<string, unknown>> & { ref?: Ref<unknown> }

/**
 * Defers unmount until an exit animation/transition finishes. While `present` is true the child is
 * mounted with `data-state="open"`; when it flips to false the child gets `data-state="closed"` and
 * stays mounted until its `animationend`/`transitionend` fires (or unmounts immediately if there is
 * no animation). CSS drives the visuals via `data-state`; this only manages mount timing. No
 * `useEffect` — the present prop is mirrored into a signal and watched with `useSignalEffect`.
 */
export function Presence({ present, children }: PresenceProps) {
  useSignals()
  const presentVal = typeof present === 'boolean' ? present : present.value

  // Mirror the (boolean or signal) present value into a local signal so the effect reacts to both
  // prop changes (re-render) and signal changes.
  const presentSig = useSignal(presentVal)
  presentSig.value = presentVal

  const isMounted = useSignal(presentVal)
  const state = useSignal<'open' | 'closed'>(presentVal ? 'open' : 'closed')
  const nodeRef = useRef<HTMLElement | null>(null)

  useSignalEffect(() => {
    if (presentSig.value) {
      isMounted.value = true
      state.value = 'open'
      return
    }
    state.value = 'closed'
    const node = nodeRef.current
    if (!node || typeof getComputedStyle === 'undefined') {
      isMounted.value = false
      return
    }
    const styles = getComputedStyle(node)
    const animates =
      (styles.animationName !== 'none' &&
        styles.animationName !== '' &&
        styles.animationDuration !== '0s') ||
      (styles.transitionDuration !== '0s' && styles.transitionDuration !== '')
    if (!animates) {
      isMounted.value = false
      return
    }
    const handleEnd = (event: Event): void => {
      if (event.target === node) isMounted.value = false
    }
    node.addEventListener('animationend', handleEnd)
    node.addEventListener('transitionend', handleEnd)
    return () => {
      node.removeEventListener('animationend', handleEnd)
      node.removeEventListener('transitionend', handleEnd)
    }
  })

  if (!isMounted.value) return null
  if (!isValidElement(children)) {
    throw new Error('Presence expects a single valid React element child')
  }
  const child = children as ElementWithRef
  const childRef = (child.props['ref'] as Ref<unknown> | undefined) ?? child.ref
  return cloneElement(child, {
    'data-state': state.value,
    ref: composeRefs(childRef, (el: HTMLElement | null) => {
      nodeRef.current = el
    }),
  } as Record<string, unknown>)
}
