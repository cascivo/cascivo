import { createClient } from '@cascivo/app/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Search,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import type { SearchResult } from '../search'

const client = createClient(api)
const result = signal<SearchResult | null>(null)
const failure = signal<string | null>(null)
const indexing = signal(false)

let latest = 0

/** Runs a search (Search debounces typing); an older answer never replaces a newer one. */
function onQuery(q: string): void {
  const ticket = ++latest
  if (q.trim() === '') {
    result.value = null
    return
  }
  client
    .search({ body: { q } })
    .then((answer) => {
      if (ticket === latest) {
        result.value = answer
        failure.value = null
      }
    })
    .catch((error: unknown) => {
      if (ticket === latest)
        failure.value = error instanceof Error ? error.message : 'Search failed'
    })
}

async function indexArticles(): Promise<void> {
  indexing.value = true
  failure.value = null
  try {
    const { indexed } = await client.indexArticles()
    result.value = result.value ? { ...result.value, indexed } : null
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Indexing failed'
  } finally {
    indexing.value = false
  }
}

export default function SearchPage() {
  useSignals()
  const current = result.value

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Search</Heading>
        <Text muted>
          Help articles, searched by meaning once deployed: ask “how do I get my money back” and
          Refunds comes first, though it shares no words with the question. vite dev searches by
          keyword instead.
        </Text>
      </Flex>
      <Search label="Search the help articles" placeholder="Ask a question" onSearch={onQuery} />
      {failure.value ? (
        <Alert variant="destructive" title="Search failed">
          {failure.value}
        </Alert>
      ) : null}
      {current ? (
        <Flex direction="horizontal" align="center" gap={2} wrap>
          <Badge variant={current.mode === 'semantic' ? 'success' : 'warning'}>
            {current.mode === 'semantic'
              ? 'By meaning (Vectorize)'
              : 'By keyword (vite dev stand-in)'}
          </Badge>
          {current.mode === 'semantic' ? (
            <>
              <Text size="sm" muted>
                {current.indexed ?? 0} articles indexed
              </Text>
              <Button
                size="sm"
                variant="secondary"
                loading={indexing.value}
                onClick={() => void indexArticles()}
              >
                Index articles
              </Button>
            </>
          ) : null}
        </Flex>
      ) : null}
      {current && current.hits.length === 0 ? (
        <EmptyState
          title="Nothing found"
          description={
            current.mode === 'semantic' && !current.indexed
              ? 'The index is empty: press Index articles, then search again in a few seconds.'
              : 'Try other words.'
          }
        />
      ) : null}
      {current?.hits.map((hit) => (
        <Card key={hit.id}>
          <CardContent>
            <Flex gap={1}>
              <Text weight="semibold">{hit.title}</Text>
              <Text size="sm" muted>
                {hit.body}
              </Text>
            </Flex>
          </CardContent>
        </Card>
      ))}
    </Flex>
  )
}
