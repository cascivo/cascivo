import { createClient } from '@cascivo/app/api'
import { CascivoView } from '@cascivo/render'
import type { ViewConfig } from '@cascivo/render'
import { validateView } from '@cascivo/render/validate'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Grid,
  Heading,
  Input,
  Link,
  Text,
  Textarea,
  computed,
  signal,
  useSignals,
} from '@cascivo/react'
import type { ChangeEvent } from 'react'
import { api } from '../api'
import type { PageSummary } from '../pages'

const client = createClient(api)

const EXAMPLE: ViewConfig = {
  view: {
    regions: {
      main: [
        {
          component: 'Card',
          props: { padding: 'lg' },
          children: [
            {
              component: 'Flex',
              props: { gap: 3 },
              children: [
                { component: 'Badge', props: { variant: 'success' }, children: 'Live' },
                { component: 'ProgressBar', props: { value: 3, max: 5, label: 'Steps done' } },
                {
                  component: 'Alert',
                  props: { variant: 'info', title: 'Published from a view' },
                  children: 'Edit the JSON on /publish and publish again for a new page.',
                },
                {
                  component: 'Link',
                  props: { href: 'https://developers.cloudflare.com/workers/' },
                  children: 'Cloudflare Workers docs',
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

const title = signal('Launch checklist')
const draft = signal(JSON.stringify(EXAMPLE, null, 2))
const published = signal<PageSummary | null>(null)
const failure = signal<string | null>(null)

/**
 * The draft as a view to preview, or what is wrong with it. The Worker checks a page again
 * before storing it: this check is for the preview, not a guard.
 */
const checked = computed((): { view: ViewConfig } | { errors: string[] } => {
  let raw: unknown
  try {
    raw = JSON.parse(draft.value)
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : 'Not JSON'] }
  }
  const result = validateView(raw)
  if (!result.valid) return { errors: result.errors.map((e) => `${e.path}: ${e.message}`) }
  // validateView has checked the whole shape, so the cast states a proven fact.
  return { view: raw as ViewConfig }
})

async function publish(): Promise<void> {
  failure.value = null
  published.value = null
  const current = checked.value
  if ('errors' in current) {
    failure.value = current.errors.join('\n')
    return
  }
  try {
    published.value = await client.publishPage({
      body: { title: title.value, view: current.view },
    })
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not publish'
  }
}

export default function Publish() {
  useSignals()
  const current = checked.value

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Publish</Heading>
        <Text muted>
          Write a view — or have an agent write one — and publish it as a page. A view only arranges
          this app's components, so a page needs no sandbox and no deploy.
        </Text>
      </Flex>
      <Grid cols={2} gap={4}>
        <Flex gap={3}>
          <Input
            label="Title"
            value={title.value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              title.value = event.currentTarget.value
            }}
          />
          <Textarea
            label="View (JSON)"
            rows={18}
            spellCheck={false}
            value={draft.value}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              draft.value = event.currentTarget.value
            }}
          />
          <Flex direction="horizontal" align="center" gap={3} wrap>
            <Button onClick={() => void publish()}>Publish</Button>
            {published.value ? (
              <Link href={`/p/${published.value.slug}`}>Open /p/{published.value.slug}</Link>
            ) : null}
          </Flex>
          {failure.value ? (
            <Alert variant="destructive" title="Not published">
              {failure.value}
            </Alert>
          ) : null}
        </Flex>
        <Card>
          <CardContent>
            {'errors' in current ? (
              <Flex gap={1}>
                {current.errors.map((error) => (
                  <Text key={error} size="sm" muted>
                    {error}
                  </Text>
                ))}
              </Flex>
            ) : (
              <CascivoView config={current.view} />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Flex>
  )
}
