import type { RouteProps } from '@cascivo/app'
import { createClient } from '@cascivo/app/api'
import { CascivoView } from '@cascivo/render'
import {
  EmptyState,
  Flex,
  Heading,
  Spinner,
  signal,
  useEffectPropSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import { api } from '../../api'
import type { Page } from '../../pages'

const client = createClient(api)
/** Pages already fetched, by slug; `null` when the slug has no page. */
const pages = signal<Readonly<Record<string, Page | null>>>({})

async function load(slug: string): Promise<void> {
  if (slug in pages.peek()) return
  try {
    const page = await client.getPage({ params: { slug } })
    pages.value = { ...pages.peek(), [slug]: page }
  } catch {
    pages.value = { ...pages.peek(), [slug]: null }
  }
}

/** `/p/:slug` — a published page, rendered from its view with the app's own components. */
export default function PublishedPage({ params }: RouteProps<'/p/:slug'>) {
  useSignals()
  const slug = useEffectPropSignal(params.slug)
  useSignalEffect(() => {
    void load(slug.value)
  })
  const page = pages.value[params.slug]

  if (page === undefined) return <Spinner label="Loading" />
  if (page === null) {
    return <EmptyState title="No such page" description="It may never have been published." />
  }
  return (
    <Flex gap={4}>
      <Heading level={1}>{page.title}</Heading>
      <CascivoView config={page.view} onInvalid="render" />
    </Flex>
  )
}
