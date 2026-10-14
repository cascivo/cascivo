import { createClient } from '@cascivo/app/api'
import { connectRoom } from '@cascivo/app/sync'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
  signal,
  useSignals,
} from '@cascivo/react'
import type { MouseEvent } from 'react'
import { api } from '../../api'
import { MAX_BODY, MAX_SUBJECT, parseIssue } from '../../newsletter'
import type { Issue, Overview } from '../../newsletter'

const client = createClient(api)
const overview = signal<Overview | null>(null)
const previewHtml = signal<string | null>(null)
const busy = signal<'load' | 'preview' | 'send' | null>(null)
const failure = signal<string | null>(null)
const notice = signal<string | null>(null)

/** The composer's fields, read from the form the clicked button belongs to. */
function fields(event: MouseEvent<HTMLButtonElement>) {
  const form = event.currentTarget.form
  const data = form ? new FormData(form) : new FormData()
  const read = (name: string) => {
    const value = data.get(name)
    return typeof value === 'string' ? value : ''
  }
  return { key: read('key'), subject: read('subject'), body: read('body') }
}

async function run(kind: 'load' | 'preview' | 'send', task: () => Promise<void>): Promise<void> {
  busy.value = kind
  failure.value = null
  notice.value = null
  try {
    await task()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Something went wrong'
  } finally {
    busy.value = null
  }
}

/** Shows an issue's progress as the Worker pushes it, until every reader has had their copy. */
function watch(issue: Issue): void {
  const room = connectRoom(`/api/newsletter/issues/${issue.id}/live`)
  const pushed = room.signal<Issue | null>('issue', null, (raw) =>
    raw === null ? null : parseIssue(raw),
  )
  const stop = pushed.signal.subscribe((latest) => {
    const current = overview.peek()
    if (!latest || !current) return
    overview.value = {
      ...current,
      issues: current.issues.map((i) => (i.id === latest.id ? latest : i)),
    }
    if (latest.sent + latest.failed >= latest.total) {
      stop()
      room.close()
    }
  })
}

function load(event: MouseEvent<HTMLButtonElement>): void {
  const { key } = fields(event)
  void run('load', async () => {
    overview.value = await client.newsletterOverview({ body: { key } })
  })
}

function preview(event: MouseEvent<HTMLButtonElement>): void {
  const input = fields(event)
  void run('preview', async () => {
    previewHtml.value = (await client.previewIssue({ body: input })).html
  })
}

function send(event: MouseEvent<HTMLButtonElement>): void {
  const input = fields(event)
  const readers = overview.value?.subscribers.subscribed ?? 0
  if (!window.confirm(`Send "${input.subject}" to ${readers} subscribers?`)) return
  void run('send', async () => {
    const issue = await client.sendIssue({ body: input })
    overview.value = await client.newsletterOverview({ body: { key: input.key } })
    notice.value = `Queued for ${issue.total} subscribers.`
    watch(issue)
  })
}

export default function SendNewsletter() {
  useSignals()
  const counts = overview.value?.subscribers
  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Send the newsletter</Heading>
        <Text muted>
          Written in Markdown, rendered with @cascivo/email, sent through Amazon SES to every
          confirmed subscriber. Only someone with NEWSLETTER_KEY can send.
        </Text>
      </Flex>
      <form onSubmit={(event) => event.preventDefault()}>
        <Flex gap={3}>
          <Flex direction="horizontal" align="end" gap={2} wrap>
            <Input name="key" type="password" label="Newsletter key" autoComplete="off" required />
            <Button variant="secondary" loading={busy.value === 'load'} onClick={load}>
              Show subscribers
            </Button>
          </Flex>
          <Input name="subject" label="Subject" maxLength={MAX_SUBJECT} required />
          <Textarea
            name="body"
            label="Body"
            hint="Markdown: headings, **bold**, links, lists, quotes and images."
            rows={12}
            maxLength={MAX_BODY}
            required
          />
          <Flex direction="horizontal" gap={2} wrap>
            <Button variant="secondary" loading={busy.value === 'preview'} onClick={preview}>
              Preview
            </Button>
            <Button loading={busy.value === 'send'} disabled={!counts} onClick={send}>
              Send to {counts ? counts.subscribed : '…'} subscribers
            </Button>
          </Flex>
        </Flex>
      </form>
      {failure.value ? (
        <Alert variant="destructive" title="Not done">
          {failure.value}
        </Alert>
      ) : null}
      {notice.value ? (
        <Alert variant="success" title="Sending">
          {notice.value}
        </Alert>
      ) : null}
      {previewHtml.value ? (
        <Card>
          <CardContent>
            {/* sandbox: the preview runs no script and cannot reach this page. */}
            <iframe
              title="Preview"
              sandbox=""
              srcDoc={previewHtml.value}
              width="100%"
              height="640"
            />
          </CardContent>
        </Card>
      ) : null}
      {counts ? (
        <Flex direction="horizontal" gap={2} wrap>
          <Badge variant="success">{counts.subscribed} subscribed</Badge>
          <Badge variant="warning">{counts.pending} not confirmed</Badge>
          <Badge variant="secondary">{counts.unsubscribed} unsubscribed</Badge>
          <Badge variant="destructive">{counts.suppressed} suppressed</Badge>
        </Flex>
      ) : null}
      {overview.value && overview.value.issues.length === 0 ? (
        <EmptyState title="No issues yet" description="Write one above and send it." />
      ) : null}
      {overview.value && overview.value.issues.length > 0 ? (
        <Flex gap={2} role="list" aria-label="Issues">
          {overview.value.issues.map((issue) => (
            <Flex key={issue.id} role="listitem" direction="horizontal" align="center" gap={2} wrap>
              <Badge variant={issue.sent + issue.failed >= issue.total ? 'success' : 'warning'}>
                {issue.sent}/{issue.total} sent
              </Badge>
              {issue.failed > 0 ? <Badge variant="destructive">{issue.failed} failed</Badge> : null}
              <Text>{issue.subject}</Text>
              <Text size="sm" muted>
                {new Date(issue.createdAt).toLocaleString()}
              </Text>
            </Flex>
          ))}
        </Flex>
      ) : null}
    </Flex>
  )
}
