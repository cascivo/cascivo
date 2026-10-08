import { queryRows } from '@cascivo/app/db'
import { ConnectionError, connectionTokens, markReconnect } from '@cascivo/app/oauth-server'
import { PublishError } from '@cascivo/app/social'
import { WorkflowEntrypoint } from 'cloudflare:workers'
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers'
import { asSocialPost, NETWORKS, postsOnce, publisherFor } from '../src/social'
import type { ImageLink, PostImage, ScheduledPost, Target } from '../src/social'
import type { Env } from './index'
import {
  BUFFER_SEPARATOR,
  mediaKey,
  readPosts,
  secretOf,
  serverLimits,
  signedMediaUrl,
  socialProviders,
  spendBuffer,
} from './social'
import type { SocialPostParams } from './social'

type TargetResult = Pick<Target, 'status' | 'url' | 'error'>

/**
 * One scheduled post, as a Workflow: it sleeps until the post is due, then posts to each
 * account in its own step, so one network failing does not hold up or repeat the others.
 *
 * Retrying is decided per network. Mastodon takes an idempotency key and Bluesky a fixed record
 * key, so a step that failed mid-request is retried and cannot post twice. Buffer, LinkedIn and
 * Threads take none (`postsOnce`): their steps are never retried, and an account found mid-post
 * (a crash between the request and the record) is reported for a person to check instead of
 * being posted again.
 */
export class SocialPost extends WorkflowEntrypoint<Env, SocialPostParams> {
  override async run(event: WorkflowEvent<SocialPostParams>, step: WorkflowStep) {
    const { postId, userId } = event.payload
    const post = await step.do('load', () => loadPost(this.env, postId))
    if (!post) return
    // A Workflow refuses to sleep until a past time ("post now"). Decided in a step, so a
    // replay after the sleep takes the same path.
    const due = await step.do('due later', async () => Date.parse(post.at) > Date.now())
    const postTo = async (target: Target) => {
      const name = `post to ${target.accountId}`
      try {
        await step.do(
          name,
          postsOnce(target.network)
            ? { retries: { limit: 0, delay: '1 second' } }
            : { retries: { limit: 3, delay: '30 seconds', backoff: 'exponential' } },
          () => publishTo(this.env, post, target, userId),
        )
      } catch (error) {
        await step.do(`${name}: give up`, () =>
          record(this.env, postId, target.accountId, {
            status: 'failed',
            url: null,
            error: postsOnce(target.network)
              ? `${NETWORKS[target.network]} did not answer. Check before posting this again.`
              : `${NETWORKS[target.network]} did not take it: ${String(error)}`,
          }),
        )
      }
    }
    // "Let Buffer hold it": Buffer accounts go to Buffer now, with the post's time, and wait in
    // Buffer's queue (editable there) instead of here. Cancelling here cannot withdraw them.
    const handedOver =
      due && post.inBuffer ? post.targets.filter((t) => t.network === 'buffer') : []
    for (const target of handedOver) await postTo(target)
    if (due) await step.sleepUntil('wait until due', new Date(post.at))
    const started = await step.do('start', () =>
      setStatus(this.env, postId, 'scheduled', 'publishing'),
    )
    // Cancelled while it waited.
    if (!started) return
    for (const target of post.targets) {
      if (!handedOver.includes(target)) await postTo(target)
    }
    await step.do('finish', () => finish(this.env, postId))
  }
}

async function loadPost(env: Env, postId: string): Promise<ScheduledPost | null> {
  const [post] = await readPosts(env.DB, 'id = ?', [postId])
  return post ?? null
}

async function setStatus(env: Env, postId: string, from: string, to: string): Promise<boolean> {
  const rows = await queryRows(
    env.DB,
    'UPDATE social_posts SET status = ? WHERE id = ? AND status = ? RETURNING id',
    [to, postId, from],
    (raw) => raw,
  )
  return rows.length === 1
}

async function record(env: Env, postId: string, accountId: string, result: TargetResult) {
  await env.DB.prepare(
    'UPDATE social_targets SET status = ?, url = ?, error = ? WHERE post_id = ? AND account_id = ?',
  )
    .bind(result.status, result.url, result.error, postId, accountId)
    .run()
}

async function publishTo(env: Env, post: ScheduledPost, target: Target, userId: string) {
  // Claim the account before calling the network, so a second attempt knows a first began.
  const claimed = await queryRows(
    env.DB,
    `UPDATE social_targets SET status = 'publishing'
     WHERE post_id = ? AND account_id = ? AND status = 'pending' RETURNING status`,
    [post.id, target.accountId],
    (raw) => raw,
  )
  if (claimed.length === 0) {
    const [current] = await readPosts(env.DB, 'id = ?', [post.id])
    const now = current?.targets.find((t) => t.accountId === target.accountId)
    if (!now || now.status !== 'publishing') return
    if (postsOnce(target.network)) {
      await record(env, post.id, target.accountId, {
        status: 'failed',
        url: null,
        error: `Interrupted while posting. Check ${NETWORKS[target.network]} before posting this again.`,
      })
      return
    }
  }
  // A Buffer channel's id is its connection's, then the channel's.
  const [connectionId = '', channelId] = target.accountId.split(BUFFER_SEPARATOR)
  try {
    const { connection, tokens } = await connectionTokens(
      env.DB,
      { secret: secretOf(env), providers: socialProviders(env) },
      { connectionId, userId },
    )
    // Checked again as it goes out, against the same server limits the composer used.
    const limits =
      target.network === 'mastodon' && connection.server
        ? await serverLimits(env, connection.server)
        : null
    // The images' bytes, from R2. Threads and Buffer fetch them instead, by a signed link that
    // lasts until a day after the post is due (Buffer may fetch a queued one only then).
    const data = await Promise.all(post.images.map((image) => loadImage(env, userId, image)))
    const keys = new Map(data.map((blob, i) => [blob, mediaKey(userId, post.images[i]!.key)]))
    const until = Math.max(Date.parse(post.at), Date.now()) + 86_400_000
    const imageLink: ImageLink = (image) => signedMediaUrl(env, keys.get(image.data)!, until)
    if (target.network === 'buffer') await spendBuffer(env)
    const published = await publisherFor({ ...target, limits }, imageLink).publish(
      { tokens, subject: channelId ?? connection.subject, server: connection.server },
      asSocialPost(post, data),
      // Fixed for every attempt: Mastodon's key, and Bluesky's record key, make a retry safe.
      { idempotencyKey: `${post.id}:${target.accountId}`, createdAt: new Date(post.at) },
    )
    await record(env, post.id, target.accountId, {
      // Buffer, given a later time, holds the post in its queue.
      status:
        target.network === 'buffer' && Date.parse(post.at) > Date.now() + 60_000
          ? 'queued'
          : 'posted',
      url: published.url,
      error: null,
    })
  } catch (error) {
    if (
      error instanceof ConnectionError ||
      (error instanceof PublishError && error.kind === 'reconnect')
    ) {
      await markReconnect(env.DB, connectionId)
      await record(env, post.id, target.accountId, {
        status: 'failed',
        url: null,
        error: `${target.label} needs connecting again before it can post.`,
      })
      return
    }
    if (error instanceof PublishError && !error.retryable) {
      await record(env, post.id, target.accountId, {
        status: 'failed',
        url: null,
        error: error.message,
      })
      return
    }
    // Retryable, or the network did not answer: the step's retry policy decides.
    throw error
  }
}

async function loadImage(env: Env, userId: string, image: PostImage): Promise<Blob> {
  const object = await env.SOCIAL_MEDIA.get(mediaKey(userId, image.key))
  if (!object) throw new PublishError('social', 'invalid', 'An image of this post is gone')
  return new Blob([await new Response(object.body).arrayBuffer()], { type: image.type })
}

async function finish(env: Env, postId: string) {
  const [post] = await readPosts(env.DB, 'id = ?', [postId])
  if (!post) return
  const posted = post.targets.filter((t) => t.status === 'posted' || t.status === 'queued').length
  const status = posted === post.targets.length ? 'done' : posted > 0 ? 'partial' : 'failed'
  await setStatus(env, postId, 'publishing', status)
}
