import { Suspense, lazy } from 'react'
import type { VNode } from 'preact'
import { findBlock } from './blocks-data'

type Props = { name: string }

// Cache lazy components by name so re-renders don't create new lazy instances.
const lazyCache = new Map<string, ReturnType<typeof lazy>>()

function getBlock(name: string) {
  const entry = findBlock(name)
  if (!entry) return null
  if (!lazyCache.has(name)) {
    lazyCache.set(name, lazy(entry.load))
  }
  return lazyCache.get(name)!
}

export function BlockPreviewPage({ name }: Props) {
  const block = getBlock(name)
  if (!block) {
    return <p>Block &quot;{name}&quot; not found.</p>
  }
  const Block = block as unknown as (props: Record<string, never>) => VNode
  return (
    <Suspense fallback={null}>
      <Block />
    </Suspense>
  )
}
