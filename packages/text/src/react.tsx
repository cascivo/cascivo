'use client'
import { useEffectPropSignal, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { elementToMarkdown } from './element-to-markdown.ts'
import type { TextOptions } from './options.ts'

/**
 * A signal holding the Markdown for a live DOM subtree, kept current as the UI changes.
 *
 * Two signals are needed and neither is optional. Structure arrives as mutations; typing
 * does not — `value` is a property, and setting it mutates no attribute, so a
 * MutationObserver alone would show a form that never fills in.
 *
 * Takes a ref rather than children because the caller decides what happens to the UI:
 * `<TextView>` hides it, and a side-by-side view (the one on cascivo.com) shows it. A hook
 * that owned the markup could only do one of those.
 */
export function useLiveMarkdown(
  // Structural rather than `RefObject`, which changed shape across React versions.
  ref: { current: Element | null },
  options?: TextOptions,
): ReadonlySignal<string> {
  const markdown = useSignal('')

  // Read inside the effect, never during render, so each is a deferred mirror — and split
  // into primitives because an `options` object is a new identity every render, which would
  // tear down and rebuild the observer on each one.
  const annotate = useEffectPropSignal(options?.annotate ?? true)
  const links = useEffectPropSignal(options?.links ?? 'inline')
  const width = useEffectPropSignal(options?.width ?? 0)

  useSignalEffect(() => {
    const source = ref.current
    if (source === null) return
    const resolved: TextOptions = {
      annotate: annotate.value,
      links: links.value,
      width: width.value,
    }
    const update = (): void => {
      markdown.value = elementToMarkdown(source, resolved)
    }
    update()

    const observer = new MutationObserver(update)
    observer.observe(source, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    })
    // Capture phase: `toggle` (details, dialog, popover) does not bubble.
    for (const type of ['input', 'change', 'toggle']) {
      source.addEventListener(type, update, true)
    }
    return () => {
      observer.disconnect()
      for (const type of ['input', 'change', 'toggle']) {
        source.removeEventListener(type, update, true)
      }
    }
  })

  return markdown
}

/**
 * The children render, and are never seen: `display:none` keeps them off the page, `inert`
 * takes them out of the focus order, and `aria-hidden` takes them out of the accessibility
 * tree. What survives is one DOM tree, not two — no duplicated `useId()` values, no second
 * copy of the page competing for a screen reader's attention.
 *
 * They have to render at all because that is where the state lives. A `<TextView>` that
 * serialized React elements instead would know what a form was given, never what someone
 * typed into it.
 */
const SOURCE: CSSProperties = { display: 'none' }

export interface TextViewProps {
  /** The UI to render as text. It is mounted, hidden, and read — never shown. */
  children: ReactNode
  /** Serialization options, forwarded to `elementToMarkdown`. */
  options?: TextOptions
  /** Class for the `<pre>` that holds the document. */
  className?: string
}

/**
 * Machine mode as a component: render a UI and show its Markdown instead of the UI.
 *
 * ```tsx
 * <TextView>
 *   <Dashboard />
 * </TextView>
 * ```
 *
 * The document follows the live DOM, so it shows what the UI currently holds — a typed
 * value, a checked box, an opened disclosure — not the props it was mounted with.
 *
 * To show the UI *and* its text, use `useLiveMarkdown` against your own container instead.
 */
export function TextView({ children, options, className }: TextViewProps) {
  useSignals()
  const sourceRef = useRef<HTMLDivElement>(null)
  const markdown = useLiveMarkdown(sourceRef, options)

  return (
    <>
      <div ref={sourceRef} aria-hidden="true" inert style={SOURCE}>
        {children}
      </div>
      <pre className={className}>{markdown.value}</pre>
    </>
  )
}
