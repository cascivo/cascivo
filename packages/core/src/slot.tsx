'use client'
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cn, composeRefs, mergeProps } from './utils.ts'

export interface SlotProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  [key: string]: unknown
}

type ElementWithRef = ReactElement<Record<string, unknown>> & { ref?: Ref<unknown> }

/**
 * Slot renders its single child element while merging the Slot's own props and ref onto it —
 * the Radix-style `asChild` composition primitive, built on cascivo's existing
 * `mergeProps`/`composeRefs`/`cn`.
 *
 * - Non-handler props: child wins (so the consumer's element controls its own identity).
 * - `on*` handlers: chained (Slot's runs, then the child's) via `mergeProps`.
 * - `className`: unioned via `cn`. `style`: shallow-merged (child wins on conflicts).
 * - `ref`: composed so both the Slot consumer's ref and the child's own ref receive the node.
 *
 * Fails fast if `children` is not exactly one valid React element.
 */
export const Slot = forwardRef<unknown, SlotProps>(function Slot(props, forwardedRef) {
  const { children, className: slotClassName, style: slotStyle, ...slotProps } = props

  if (!isValidElement(children) || Children.count(children) !== 1) {
    throw new Error(
      'Slot expects exactly one valid React element child (asChild requires a single element).',
    )
  }

  const child = children as ElementWithRef
  const childProps = child.props
  const merged = mergeProps<Record<string, unknown>>(slotProps, childProps)

  merged['className'] = cn(
    slotClassName as string | undefined,
    childProps['className'] as string | undefined,
  )
  merged['style'] = {
    ...((slotStyle as CSSProperties | undefined) ?? {}),
    ...((childProps['style'] as CSSProperties | undefined) ?? {}),
  }
  // React 19 exposes ref as a regular prop; React 18 keeps it on the element. Prefer props.ref to
  // avoid touching the deprecated `element.ref` getter when it isn't needed.
  const childRef = (childProps['ref'] as Ref<unknown> | undefined) ?? child.ref
  merged['ref'] = composeRefs(forwardedRef, childRef)

  return cloneElement(child, merged)
})
