import { createClient } from '@cascivo/app/api'
import { startUpload } from '@cascivo/app/uploads'
import type { Upload } from '@cascivo/app/uploads'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  FileUploader,
  Flex,
  Heading,
  Input,
  Link,
  Spinner,
  Text,
  Textarea,
  signal,
  useSignalEffect,
  useSignals,
} from '@cascivo/react'
import type { UploaderFile } from '@cascivo/react'
import type { FormEvent } from 'react'
import { api } from '../api'
import { auth } from '../auth'
import { router } from '../router'
import { asSocialPost, BUFFER_BUDGET, IMAGES, MAX_IMAGES, NETWORKS, publisherFor } from '../social'
import type { Account, PostImage, PostStatus, Social, TargetStatus } from '../social'

const client = createClient(api)
const social = signal<Social | null>(null)
const failure = signal<string | null>(null)
const busy = signal(false)

// The composer. Kept in signals so each network's check runs as you type.
const text = signal('')
const linkUrl = signal('')
const linkTitle = signal('')
const at = signal('')
const chosen = signal<string[]>([])
const inBuffer = signal(false)
// Images go up to R2 as soon as they are picked; each needs a description before posting.
const uploads = signal<Upload[]>([])
const alts = signal<Record<string, string>>({})

function addImages(files: File[]): void {
  const room = MAX_IMAGES - uploads.value.length
  uploads.value = [...uploads.value, ...files.slice(0, room).map((f) => startUpload(IMAGES, f))]
}

function removeImage(id: string): void {
  uploads.value.find((u) => u.id === id)?.abort()
  uploads.value = uploads.value.filter((u) => u.id !== id)
}

/** The uploaded images, in order, with their descriptions. */
function attached(): PostImage[] {
  return uploads.value.flatMap((upload) => {
    const stored = upload.result.value
    return stored ? [{ key: stored.key, type: stored.type, alt: alts.value[upload.id] ?? '' }] : []
  })
}

async function load(): Promise<void> {
  try {
    social.value = await client.getSocial()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Could not load your accounts'
  }
}

/** Why connecting an account failed: /api/connections sends it back as `?error=`. */
const REASONS: Record<string, string> = {
  denied: 'You did not allow access, so nothing was connected.',
  expired: 'Connecting took too long, or started in another browser. Try again.',
  state_mismatch: 'That did not match the connection this browser started. Try again.',
  provider_error: 'The network did not confirm the account. Try again.',
  bad_server: 'That server or handle could not be reached, or did not check out. Check the name.',
  signed_out: 'Sign in first, then connect an account.',
}

/** Badge's tones. */
type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const ACCOUNT_TONE: Record<Account['status'], Tone> = {
  active: 'success',
  expiring: 'warning',
  reconnect: 'danger',
}
const POST_TONE: Record<PostStatus, Tone> = {
  scheduled: 'info',
  publishing: 'info',
  done: 'success',
  partial: 'warning',
  failed: 'danger',
  cancelled: 'neutral',
}
const TARGET_TONE: Record<TargetStatus, Tone> = {
  pending: 'neutral',
  publishing: 'info',
  queued: 'info',
  posted: 'success',
  failed: 'danger',
}

function draft() {
  const url = linkUrl.value.trim()
  return asSocialPost({
    text: text.value,
    link: url ? { url, title: linkTitle.value.trim() } : null,
    images: attached(),
  })
}

/** What each chosen network would refuse, from the same checks the Worker runs. */
function problems(accounts: Account[]): string[] {
  return accounts
    .filter((a) => chosen.value.includes(a.id))
    .flatMap((account) =>
      publisherFor(account)
        .check(draft())
        .map((p) => `${account.label}: ${p.message}`),
    )
}

async function schedule(event: FormEvent<HTMLFormElement>): Promise<void> {
  event.preventDefault()
  busy.value = true
  failure.value = null
  try {
    const url = linkUrl.value.trim()
    await client.schedulePost({
      body: {
        text: text.value,
        link: url ? { url, title: linkTitle.value.trim() } : null,
        images: attached(),
        accountIds: chosen.value,
        // datetime-local is the browser's local time; the Worker keeps UTC.
        at: at.value ? new Date(at.value).toISOString() : null,
        inBuffer: inBuffer.value,
      },
    })
    text.value = ''
    linkUrl.value = ''
    linkTitle.value = ''
    at.value = ''
    inBuffer.value = false
    uploads.value = []
    alts.value = {}
    await load()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Not scheduled'
  } finally {
    busy.value = false
  }
}

async function cancel(id: string): Promise<void> {
  try {
    await client.cancelPost({ params: { id } })
    await load()
  } catch (error) {
    failure.value = error instanceof Error ? error.message : 'Not cancelled'
  }
}

async function remove(id: string): Promise<void> {
  // A Buffer channel goes with its whole Buffer connection (the id before the ~).
  const connectionId = id.split('~')[0] ?? id
  const response = await fetch(`/api/connections/${encodeURIComponent(connectionId)}`, {
    method: 'DELETE',
  })
  if (!response.ok) failure.value = 'The account was not removed'
  chosen.value = chosen.value.filter((c) => c !== id)
  await load()
}

function toggle(id: string, on: boolean): void {
  chosen.value = on ? [...chosen.value, id] : chosen.value.filter((c) => c !== id)
}

export default function SocialPage() {
  useSignals()
  useSignalEffect(() => {
    if (auth.user.value) void load()
  })
  const user = auth.user.value
  const data = social.value
  const reason = new URLSearchParams(router.search.value).get('error')

  if (user === undefined) return <Spinner label="Loading" />
  if (user === null) {
    return (
      <Flex gap={4}>
        <Heading level={1}>Social</Heading>
        <Text>
          <Link href="/account">Sign in</Link> to connect your accounts and schedule posts.
        </Text>
      </Flex>
    )
  }
  const usable = data?.accounts.filter((a) => a.status !== 'reconnect') ?? []
  const images: UploaderFile[] = uploads.value.map((upload) => ({
    id: upload.id,
    name: upload.name,
    size: upload.size,
    status: upload.status.value === 'done' ? 'complete' : upload.status.value,
    ...(upload.error.value ? { errorMessage: upload.error.value } : {}),
  }))
  const uploading = uploads.value.some((upload) => upload.status.value === 'uploading')
  const blocking = data ? problems(data.accounts) : []
  const viaBuffer = usable.some((a) => a.network === 'buffer' && chosen.value.includes(a.id))

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Social</Heading>
        <Text muted>
          Write once, post to Bluesky, LinkedIn, Mastodon and the channels in your Buffer, now or at
          a time you pick.
        </Text>
      </Flex>
      {reason ? (
        <Alert variant="destructive" title="Not connected">
          {REASONS[reason] ?? 'Connecting failed. Try again.'}
        </Alert>
      ) : null}
      {location.hostname === 'localhost' ? (
        <Alert variant="info" title="Connecting Bluesky in development">
          Bluesky's development sign-in only returns to 127.0.0.1: open{' '}
          <Link href={`http://127.0.0.1:${location.port}/social`}>this page on 127.0.0.1</Link>.
        </Alert>
      ) : null}
      {failure.value ? (
        <Alert variant="destructive" title="Something went wrong">
          {failure.value}
        </Alert>
      ) : null}
      {data === null ? (
        <Spinner label="Loading" />
      ) : (
        <>
          <Card>
            <CardContent>
              <Flex gap={3}>
                <Heading level={2}>Accounts</Heading>
                {data.accounts.length === 0 ? <Text muted>No accounts connected yet.</Text> : null}
                {data.accounts.map((account) => (
                  <Flex key={account.id} direction="horizontal" align="center" gap={2} wrap>
                    <Text>
                      {NETWORKS[account.network]}: {account.label}
                    </Text>
                    <Badge variant={ACCOUNT_TONE[account.status]}>
                      {account.status === 'expiring'
                        ? 'expires soon: connect again'
                        : account.status}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => void remove(account.id)}>
                      Remove
                    </Button>
                  </Flex>
                ))}
                {data.bufferUsed !== null ? (
                  <Text muted>
                    Buffer requests in the last 15 minutes, for everyone on this app:{' '}
                    {data.bufferUsed} of {BUFFER_BUDGET}.
                  </Text>
                ) : null}
                <Flex direction="horizontal" align="end" gap={2} wrap>
                  {data.networks.includes('buffer') ? (
                    <Button asChild variant="secondary">
                      <a href="/api/connections/buffer?returnTo=/social">Connect Buffer</a>
                    </Button>
                  ) : null}
                  {data.networks.includes('linkedin') ? (
                    <Button asChild variant="secondary">
                      <a href="/api/connections/linkedin?returnTo=/social">Connect LinkedIn</a>
                    </Button>
                  ) : null}
                  {data.networks.includes('threads') ? (
                    <Button asChild variant="secondary">
                      <a href="/api/connections/threads?returnTo=/social">Connect Threads</a>
                    </Button>
                  ) : null}
                  {/* Plain GET forms: the Worker redirects to the account or server named. */}
                  <form method="get" action="/api/connections/bluesky">
                    <input type="hidden" name="returnTo" value="/social" />
                    <Flex direction="horizontal" align="end" gap={2} wrap>
                      <Input
                        name="server"
                        label="Bluesky handle"
                        placeholder="you.bsky.social"
                        required
                      />
                      <Button type="submit" variant="secondary">
                        Connect Bluesky
                      </Button>
                    </Flex>
                  </form>
                  <form method="get" action="/api/connections/mastodon">
                    <input type="hidden" name="returnTo" value="/social" />
                    <Flex direction="horizontal" align="end" gap={2} wrap>
                      <Input
                        name="server"
                        label="Mastodon server"
                        placeholder="mastodon.social"
                        required
                      />
                      <Button type="submit" variant="secondary">
                        Connect Mastodon
                      </Button>
                    </Flex>
                  </form>
                </Flex>
              </Flex>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <form onSubmit={(event) => void schedule(event)}>
                <Flex gap={3}>
                  <Heading level={2}>New post</Heading>
                  <Textarea
                    label="Text"
                    value={text.value}
                    onInput={(event) => (text.value = event.currentTarget.value)}
                    rows={5}
                  />
                  <Flex direction="horizontal" gap={2} wrap>
                    <Input
                      label="Link (optional)"
                      type="url"
                      value={linkUrl.value}
                      onInput={(event) => (linkUrl.value = event.currentTarget.value)}
                    />
                    <Input
                      label="Link title (LinkedIn shows it)"
                      value={linkTitle.value}
                      onInput={(event) => (linkTitle.value = event.currentTarget.value)}
                    />
                  </Flex>
                  <FileUploader
                    multiple
                    label={`Images (up to ${MAX_IMAGES}, JPEG or PNG, 1 MB each)`}
                    accept={IMAGES.types.join(',')}
                    maxSize={IMAGES.maxBytes}
                    files={images}
                    onFilesAdded={addImages}
                    onRemove={removeImage}
                  />
                  {uploads.value
                    .filter((upload) => upload.status.value === 'done')
                    .map((upload) => (
                      <Input
                        key={upload.id}
                        label={`Describe ${upload.name} (alt text)`}
                        required
                        value={alts.value[upload.id] ?? ''}
                        onInput={(event) =>
                          (alts.value = { ...alts.value, [upload.id]: event.currentTarget.value })
                        }
                      />
                    ))}
                  {usable.length === 0 ? (
                    <Text muted>Connect an account to post.</Text>
                  ) : (
                    usable.map((account) => (
                      <Checkbox
                        key={account.id}
                        label={`${NETWORKS[account.network]}: ${account.label}`}
                        checked={chosen.value.includes(account.id)}
                        onChange={(event) => toggle(account.id, event.currentTarget.checked)}
                      />
                    ))
                  )}
                  <Input
                    label="When (empty: now)"
                    type="datetime-local"
                    value={at.value}
                    onInput={(event) => (at.value = event.currentTarget.value)}
                  />
                  {at.value && viaBuffer ? (
                    <Checkbox
                      label="Let Buffer hold it: Buffer accounts go to Buffer's queue now, where you can still edit them"
                      checked={inBuffer.value}
                      onChange={(event) => (inBuffer.value = event.currentTarget.checked)}
                    />
                  ) : null}
                  {blocking.length > 0 ? (
                    <Alert variant="warning" title="Not ready to post">
                      {blocking.join(' ')}
                    </Alert>
                  ) : null}
                  <Flex direction="horizontal">
                    <Button
                      type="submit"
                      loading={busy.value}
                      disabled={chosen.value.length === 0 || blocking.length > 0 || uploading}
                    >
                      {at.value ? 'Schedule' : 'Post now'}
                    </Button>
                  </Flex>
                </Flex>
              </form>
            </CardContent>
          </Card>
          <Flex gap={3}>
            <Heading level={2}>Posts</Heading>
            {data.posts.length === 0 ? <Text muted>Nothing scheduled yet.</Text> : null}
            {data.posts.map((post) => (
              <Card key={post.id}>
                <CardContent>
                  <Flex gap={2}>
                    <Flex direction="horizontal" align="center" gap={2} wrap>
                      <Badge variant={POST_TONE[post.status]}>{post.status}</Badge>
                      <Text muted>{new Date(post.at).toLocaleString()}</Text>
                      {post.status === 'scheduled' ? (
                        <Button size="sm" variant="ghost" onClick={() => void cancel(post.id)}>
                          Cancel
                        </Button>
                      ) : null}
                    </Flex>
                    <Text>{post.text}</Text>
                    {post.targets.map((target) => (
                      <Flex
                        key={target.accountId}
                        direction="horizontal"
                        align="center"
                        gap={2}
                        wrap
                      >
                        {post.status === 'cancelled' && target.status === 'queued' ? (
                          <Badge variant="warning">still in Buffer's queue</Badge>
                        ) : post.status === 'cancelled' ? (
                          <Badge variant="neutral">not sent</Badge>
                        ) : (
                          <Badge variant={TARGET_TONE[target.status]}>{target.status}</Badge>
                        )}
                        <Text>
                          {NETWORKS[target.network]}: {target.label}
                        </Text>
                        {target.url ? <Link href={target.url}>View</Link> : null}
                        {target.error ? <Text muted>{target.error}</Text> : null}
                      </Flex>
                    ))}
                  </Flex>
                </CardContent>
              </Card>
            ))}
          </Flex>
        </>
      )}
    </Flex>
  )
}
