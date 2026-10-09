import { HttpError } from '@cascivo/app/api'
import { currentUser, requireUser } from '@cascivo/app/auth-server'
import { migrate, queryRows } from '@cascivo/app/db'
import type { Database } from '@cascivo/app/db'
import {
  bluesky,
  blueskyClientMetadata,
  buffer,
  blueskyJwks,
  linkedin,
  mastodon,
  parseBlueskyKey,
  threads,
} from '@cascivo/app/oauth'
import type { OAuthProvider } from '@cascivo/app/oauth'
import {
  connectionTokens,
  expiringConnections,
  handleConnections,
  listConnections,
  mastodonRegistrations,
  refreshConnections,
} from '@cascivo/app/oauth-server'
import type { Connection } from '@cascivo/app/oauth-server'
import { bufferChannels, mastodonServerLimits } from '@cascivo/app/social'
import { handleUploads } from '@cascivo/app/uploads-server'
import type { UploadBucket } from '@cascivo/app/uploads-server'
import {
  asSocialPost,
  BUFFER_BUDGET,
  IMAGES,
  isNetwork,
  MAX_DAYS_AHEAD,
  NETWORKS,
  parseScheduledPost,
  publisherFor,
} from '../src/social'
import type {
  Account,
  PostImage,
  PostInput,
  PostStatus,
  ScheduledPost,
  ServerLimits,
  Social,
} from '../src/social'

/** What the Workflow behind a scheduled post (worker/social-post.ts) is started with. */
export interface SocialPostParams {
  postId: string
  userId: string
}

/** What sending a reminder needs of the Email Service binding (`send_email`). */
export interface ReminderSender {
  send(message: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }): Promise<unknown>
}

/** The R2 bucket images are uploaded to (`SOCIAL_MEDIA` in wrangler.jsonc). */
export type SocialMediaBucket = UploadBucket

/** What scheduling needs of the Worker's env. */
export interface SocialEnv {
  DB: Database
  SOCIAL_MEDIA: SocialMediaBucket
  EMAIL: ReminderSender
  /** Who reconnect reminders come from, and the deployed app they link to (wrangler.jsonc). */
  REMINDER_FROM: string
  APP_URL: string
  /** Seals the connected accounts' tokens (and Mastodon's app registrations). */
  AUTH_SECRET?: string
  LINKEDIN_CLIENT_ID?: string
  LINKEDIN_CLIENT_SECRET?: string
  /** An ES256 private JWK with a kid: makes Bluesky sessions last (README). */
  BLUESKY_PRIVATE_JWK?: string
  /** A Buffer app client (README); Buffer is offered once its id is set. */
  BUFFER_CLIENT_ID?: string
  BUFFER_CLIENT_SECRET?: string
  /** A Meta app with the Threads use case (README); Threads is offered once both are set. */
  THREADS_APP_ID?: string
  THREADS_APP_SECRET?: string
  SOCIAL_POST: Workflow<SocialPostParams>
}

const APP_NAME = '{{appName}}'

const migrations = [
  {
    id: '0001_social',
    statements: [
      `CREATE TABLE social_posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        text TEXT NOT NULL,
        link_url TEXT,
        link_title TEXT,
        at TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      'CREATE INDEX social_posts_user ON social_posts (user_id, at)',
      `CREATE TABLE social_targets (
        post_id TEXT NOT NULL REFERENCES social_posts (id),
        account_id TEXT NOT NULL,
        network TEXT NOT NULL,
        service TEXT,
        label TEXT NOT NULL,
        status TEXT NOT NULL,
        url TEXT,
        error TEXT,
        PRIMARY KEY (post_id, account_id)
      )`,
      `CREATE TABLE social_buffer_channels (
        connection_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        service TEXT NOT NULL,
        name TEXT NOT NULL,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (connection_id, channel_id)
      )`,
    ],
  },
  {
    id: '0002_social_server_limits',
    statements: [
      `CREATE TABLE social_server_limits (
        server TEXT PRIMARY KEY,
        max_chars INTEGER NOT NULL,
        max_images INTEGER NOT NULL,
        url_weight INTEGER NOT NULL,
        fetched_at INTEGER NOT NULL
      )`,
    ],
  },
  {
    id: '0003_social_in_buffer',
    statements: ['ALTER TABLE social_posts ADD COLUMN in_buffer INTEGER NOT NULL DEFAULT 0'],
  },
  {
    id: '0004_social_buffer_budget',
    statements: [
      'CREATE TABLE social_buffer_budget (slot INTEGER PRIMARY KEY, used INTEGER NOT NULL)',
    ],
  },
  {
    id: '0005_social_reminders',
    statements: [
      `CREATE TABLE social_reminders (
        connection_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        sent_at TEXT NOT NULL,
        PRIMARY KEY (connection_id, expires_at)
      )`,
    ],
  },
  {
    id: '0006_social_images',
    statements: ["ALTER TABLE social_posts ADD COLUMN images TEXT NOT NULL DEFAULT '[]'"],
  },
]

export const secretOf = (env: SocialEnv): string => env.AUTH_SECRET ?? ''

/** Bluesky fetches this app's client metadata here: its URL is the client id. */
const BLUESKY_METADATA = '/api/bluesky/client-metadata.json'
const BLUESKY_JWKS = '/api/bluesky/jwks.json'
const BLUESKY_SCOPES = ['atproto', 'transition:generic']

const blueskyKey = (env: SocialEnv) =>
  env.BLUESKY_PRIVATE_JWK ? parseBlueskyKey(env.BLUESKY_PRIVATE_JWK) : undefined

/**
 * The accounts a user can connect: Bluesky and Mastodon always (Bluesky reads this app's
 * client metadata; the app registers itself with each Mastodon server); Buffer, LinkedIn and
 * Threads once their app's values are set. Each asks for the scopes to post.
 */
export function socialProviders(env: SocialEnv): OAuthProvider[] {
  const key = blueskyKey(env)
  const providers: OAuthProvider[] = [
    bluesky({
      clientMetadataPath: BLUESKY_METADATA,
      scopes: BLUESKY_SCOPES,
      ...(key ? { privateKey: key } : {}),
    }),
  ]
  if (env.BUFFER_CLIENT_ID) {
    providers.push(
      buffer({
        clientId: env.BUFFER_CLIENT_ID,
        ...(env.BUFFER_CLIENT_SECRET ? { clientSecret: env.BUFFER_CLIENT_SECRET } : {}),
      }),
    )
  }
  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    providers.push(
      linkedin({
        clientId: env.LINKEDIN_CLIENT_ID,
        clientSecret: env.LINKEDIN_CLIENT_SECRET,
        scopes: ['openid', 'profile', 'w_member_social'],
      }),
    )
  }
  if (env.THREADS_APP_ID && env.THREADS_APP_SECRET) {
    providers.push(threads({ clientId: env.THREADS_APP_ID, clientSecret: env.THREADS_APP_SECRET }))
  }
  providers.push(
    mastodon({
      appName: APP_NAME,
      scopes: ['profile', 'write:statuses', 'write:media'],
      registrations: mastodonRegistrations(env.DB, secretOf(env)),
    }),
  )
  return providers
}

/**
 * /api/connections: list, connect (`/api/connections/mastodon?server=hachyderm.io`) and remove
 * the signed-in user's accounts. A failed connection comes back to /social with `?error=`.
 */
export function connections(env: SocialEnv): (request: Request) => Promise<Response | null> {
  return handleConnections(env.DB, {
    secret: secretOf(env),
    providers: socialProviders(env),
    errorPath: '/social',
  })
}

/**
 * The daily Cron Trigger: renews Threads tokens in their last 30 days. A Threads token renews
 * only while it still works, so one nobody posts with would otherwise lapse after 60 days.
 */
export async function renewConnections(env: SocialEnv): Promise<void> {
  const { renewed, failed } = await refreshConnections(env.DB, {
    secret: secretOf(env),
    providers: socialProviders(env),
  })
  if (renewed + failed > 0) console.log(`[social] renewed ${renewed}, could not renew ${failed}`)
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The daily Cron Trigger, after renewing: a token that cannot be renewed (LinkedIn's 60 days)
 * and ends within a week gets its owner one email with a link to connect it again. Once per
 * token: connecting again issues a new one, with a new expiry.
 */
export async function remindExpiring(env: SocialEnv): Promise<void> {
  if (!env.REMINDER_FROM || !env.APP_URL) {
    console.log('[social] set REMINDER_FROM and APP_URL in wrangler.jsonc to send reminders')
    return
  }
  await migrate(env.DB, migrations)
  for (const { connection, email } of await expiringConnections(env.DB)) {
    if (!email || !isNetwork(connection.provider) || connection.expiresAt === null) continue
    const [sent] = await queryRows(
      env.DB,
      'SELECT sent_at FROM social_reminders WHERE connection_id = ? AND expires_at = ?',
      [connection.id, connection.expiresAt],
      (raw) => raw,
    )
    if (sent) continue
    const network = NETWORKS[connection.provider]
    const account = connection.handle ?? connection.name ?? network
    const path = `/api/connections/${connection.provider}?returnTo=/social`
    const url = new URL(path, env.APP_URL).href
    const ends = new Date(connection.expiresAt * 1000).toUTCString().slice(0, 16)
    await env.EMAIL.send({
      from: env.REMINDER_FROM,
      to: email,
      subject: `Connect ${network} again before ${ends}`,
      text: `${network} lets this app post as ${account} only until ${ends}. Connect it again to keep scheduled posts going: ${url}`,
      html: `<p>${escapeHtml(network)} lets this app post as ${escapeHtml(account)} only until ${escapeHtml(ends)}.</p><p><a href="${escapeHtml(url)}">Connect it again</a> to keep scheduled posts going.</p>`,
    })
    await env.DB.prepare(
      'INSERT INTO social_reminders (connection_id, expires_at, sent_at) VALUES (?, ?, ?)',
    )
      .bind(connection.id, connection.expiresAt, new Date().toISOString())
      .run()
  }
}

/**
 * Bluesky's client metadata and public key, which its servers fetch (no session). Without
 * BLUESKY_PRIVATE_JWK the app is a public client and serves no key.
 */
export function blueskyClient(env: SocialEnv, request: Request): Response | null {
  const url = new URL(request.url)
  if (request.method !== 'GET') return null
  const key = blueskyKey(env)
  if (url.pathname === BLUESKY_METADATA) {
    return Response.json(
      blueskyClientMetadata({
        origin: url.origin,
        redirectPaths: ['/api/connections/bluesky/callback'],
        clientName: APP_NAME,
        clientMetadataPath: BLUESKY_METADATA,
        scopes: BLUESKY_SCOPES,
        jwksPath: BLUESKY_JWKS,
        ...(key ? { privateKey: key } : {}),
      }),
    )
  }
  if (url.pathname === BLUESKY_JWKS && key) return Response.json(blueskyJwks(key))
  return null
}

/** Where a user's image lives in the bucket: under their own prefix, so only they reach it. */
export const mediaKey = (userId: string, key: string) => `social/${userId}/${key}`

/**
 * `/api/social/images`: the signed-in user's uploads (`@cascivo/app/uploads-server`), stored
 * under their own prefix, so they can attach, preview and post only their own.
 */
export async function images(env: SocialEnv, request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url)
  if (pathname !== IMAGES.path && !pathname.startsWith(`${IMAGES.path}/`)) return null
  const user = await currentUser(env.DB, request)
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 })
  return handleUploads(IMAGES, env.SOCIAL_MEDIA, { prefix: mediaKey(user.id, '') })(request)
}

const MEDIA_PATH = '/api/social/media/'

async function mediaSigningKey(env: SocialEnv): Promise<CryptoKey> {
  const secret = secretOf(env)
  if (secret.length < 32) throw new Error('Set AUTH_SECRET (32+ characters) to link images')
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`social-media:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

const toHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

/**
 * A link to an image that works without a session until `until` (ms): Threads and Buffer
 * fetch images by URL. Signed with AUTH_SECRET; the image itself stays private in R2.
 */
export async function signedMediaUrl(env: SocialEnv, objectKey: string, until: number) {
  if (!env.APP_URL) throw new Error('Set APP_URL in wrangler.jsonc so networks can fetch images')
  const expires = String(Math.ceil(until / 1000))
  const signature = await crypto.subtle.sign(
    'HMAC',
    await mediaSigningKey(env),
    new TextEncoder().encode(`${objectKey}:${expires}`),
  )
  const path = MEDIA_PATH + objectKey.split('/').map(encodeURIComponent).join('/')
  const url = new URL(path, env.APP_URL)
  url.searchParams.set('expires', expires)
  url.searchParams.set('signature', toHex(signature))
  return url.href
}

/** `GET /api/social/media/<key>?expires&signature`: an image, for a link `signedMediaUrl` made. */
export async function media(env: SocialEnv, request: Request): Promise<Response | null> {
  const url = new URL(request.url)
  if (request.method !== 'GET' || !url.pathname.startsWith(MEDIA_PATH)) return null
  const refused = () => new Response('Not found', { status: 404 })
  let objectKey: string
  try {
    objectKey = decodeURIComponent(url.pathname.slice(MEDIA_PATH.length))
  } catch {
    return refused()
  }
  const expires = url.searchParams.get('expires') ?? ''
  const signature = url.searchParams.get('signature') ?? ''
  if (!/^\d{1,12}$/.test(expires) || Number(expires) * 1000 < Date.now()) return refused()
  if (!/^[0-9a-f]{64}$/.test(signature)) return refused()
  const bytes = new Uint8Array(signature.match(/../g)!.map((pair) => parseInt(pair, 16)))
  const valid = await crypto.subtle.verify(
    'HMAC',
    await mediaSigningKey(env),
    bytes,
    new TextEncoder().encode(`${objectKey}:${expires}`),
  )
  if (!valid) return refused()
  const object = await env.SOCIAL_MEDIA.get(objectKey)
  if (!object) return refused()
  return new Response(object.body, {
    headers: {
      'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'cache-control': 'private, max-age=300',
      'x-content-type-options': 'nosniff',
    },
  })
}

/** A Buffer channel's account id: its connection, and the channel within it. */
export const BUFFER_SEPARATOR = '~'

/** Buffer's request budget is small: its channel list is kept for an hour. */
const CHANNELS_TTL_MS = 60 * 60 * 1000

interface ChannelRow {
  id: string
  service: string
  name: string
  fetchedAt: number
}

function parseChannelRow(raw: unknown): ChannelRow {
  if (typeof raw !== 'object' || raw === null) throw new Error('Malformed channel row')
  const { channel_id, service, name, fetched_at } = raw as Record<string, unknown>
  if (typeof channel_id !== 'string' || typeof service !== 'string' || typeof name !== 'string') {
    throw new Error('Malformed channel row')
  }
  return { id: channel_id, service, name, fetchedAt: Number(fetched_at) }
}

/**
 * Buffer's request budget (`BUFFER_BUDGET` per 15 minutes, for every user of this app
 * together), counted per window as the app spends it, so the page can show it and channel lists
 * can yield when it runs low. Buffer enforces the real one (a 429 with Retry-After).
 */
const BUFFER_WINDOW_MS = 15 * 60 * 1000
/** Below this, channel lists are not refreshed: the rest is kept for posting. */
const BUFFER_RESERVE = 20

const bufferWindow = () => Math.floor(Date.now() / BUFFER_WINDOW_MS)

/** Counts one Buffer request against the current window. */
export async function spendBuffer(env: SocialEnv): Promise<void> {
  await migrate(env.DB, migrations)
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO social_buffer_budget (slot, used) VALUES (?, 1)
       ON CONFLICT (slot) DO UPDATE SET used = used + 1`,
    ).bind(bufferWindow()),
    env.DB.prepare('DELETE FROM social_buffer_budget WHERE slot < ?').bind(bufferWindow() - 1),
  ])
}

/** Buffer requests this app has made in the current window. */
async function bufferUsed(env: SocialEnv): Promise<number> {
  await migrate(env.DB, migrations)
  const [row] = await queryRows(
    env.DB,
    'SELECT used FROM social_buffer_budget WHERE slot = ?',
    [bufferWindow()],
    (raw) =>
      typeof raw === 'object' && raw !== null ? Number((raw as { used?: unknown }).used) : 0,
  )
  return row ?? 0
}

/**
 * A Buffer connection's channels, from D1 when fresh, else from Buffer. If Buffer cannot be
 * asked, or its budget is running low, the last list known is used.
 */
async function channelsOf(env: SocialEnv, connection: Connection, userId: string) {
  const cached = await queryRows(
    env.DB,
    'SELECT channel_id, service, name, fetched_at FROM social_buffer_channels WHERE connection_id = ?',
    [connection.id],
    parseChannelRow,
  )
  const fresh = cached.length > 0 && cached.every((c) => Date.now() - c.fetchedAt < CHANNELS_TTL_MS)
  if (fresh || (cached.length > 0 && (await bufferUsed(env)) > BUFFER_BUDGET - BUFFER_RESERVE)) {
    return cached
  }
  try {
    const { tokens } = await connectionTokens(
      env.DB,
      { secret: secretOf(env), providers: socialProviders(env) },
      { connectionId: connection.id, userId },
    )
    await spendBuffer(env)
    const listed = await bufferChannels(tokens, connection.subject)
    await env.DB.batch([
      env.DB.prepare('DELETE FROM social_buffer_channels WHERE connection_id = ?').bind(
        connection.id,
      ),
      ...listed.map((c) =>
        env.DB.prepare(
          `INSERT INTO social_buffer_channels (connection_id, channel_id, service, name, fetched_at)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(connection.id, c.id, c.service, c.name, Date.now()),
      ),
    ])
    return listed
  } catch (error) {
    console.warn('[social] could not list Buffer channels:', error)
    return cached
  }
}

/** A Mastodon server's limits change rarely: they are kept for a day. */
const LIMITS_TTL_MS = 24 * 60 * 60 * 1000

/**
 * A Mastodon server's own limits, from D1 when fresh, else from the server. Shared by every
 * account on that server; a server that does not answer gets Mastodon's defaults for now.
 */
export async function serverLimits(env: SocialEnv, server: string): Promise<ServerLimits> {
  await migrate(env.DB, migrations)
  const [cached] = await queryRows(
    env.DB,
    `SELECT max_chars AS maxChars, max_images AS maxImages, url_weight AS urlWeight, fetched_at AS fetchedAt
     FROM social_server_limits WHERE server = ?`,
    [server],
    (raw) => {
      if (typeof raw !== 'object' || raw === null) throw new Error('Malformed limits row')
      const { maxChars, maxImages, urlWeight, fetchedAt } = raw as Record<string, unknown>
      return {
        limits: {
          maxChars: Number(maxChars),
          maxImages: Number(maxImages),
          urlWeight: Number(urlWeight),
        },
        fetchedAt: Number(fetchedAt),
      }
    },
  )
  if (cached && Date.now() - cached.fetchedAt < LIMITS_TTL_MS) return cached.limits
  const limits = await mastodonServerLimits(server)
  await env.DB.prepare(
    `INSERT INTO social_server_limits (server, max_chars, max_images, url_weight, fetched_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (server) DO UPDATE SET max_chars = excluded.max_chars,
       max_images = excluded.max_images, url_weight = excluded.url_weight,
       fetched_at = excluded.fetched_at`,
  )
    .bind(server, limits.maxChars, limits.maxImages, limits.urlWeight, Date.now())
    .run()
  return limits
}

async function userAccounts(env: SocialEnv, userId: string): Promise<Account[]> {
  await migrate(env.DB, migrations)
  const accounts: Account[] = []
  for (const connection of await listConnections(env.DB, userId)) {
    if (!isNetwork(connection.provider)) continue
    if (connection.provider !== 'buffer') {
      accounts.push({
        id: connection.id,
        network: connection.provider,
        label: connection.handle ?? connection.name ?? connection.subject,
        status: connection.status,
        service: null,
        limits:
          connection.provider === 'mastodon' && connection.server
            ? await serverLimits(env, connection.server)
            : null,
      })
      continue
    }
    // Each channel in Buffer is an account of its own to post to.
    for (const channel of await channelsOf(env, connection, userId)) {
      accounts.push({
        id: `${connection.id}${BUFFER_SEPARATOR}${channel.id}`,
        network: 'buffer',
        label: `${channel.name} (${channel.service}, via Buffer)`,
        status: connection.status,
        service: channel.service,
        limits: null,
      })
    }
  }
  return accounts
}

export async function readPosts(db: Database, where: string, params: unknown[]) {
  await migrate(db, migrations)
  const posts = await queryRows(
    db,
    `SELECT id, text, link_url AS linkUrl, link_title AS linkTitle, images, at, in_buffer AS inBuffer,
       status FROM social_posts WHERE ${where} ORDER BY at DESC LIMIT 50`,
    params,
    (raw) => raw as Record<string, unknown>,
  )
  if (posts.length === 0) return []
  const ids = posts.map((p) => String(p['id']))
  const targets = await queryRows(
    db,
    `SELECT post_id AS postId, account_id AS accountId, network, service, label, status, url, error
     FROM social_targets WHERE post_id IN (${ids.map(() => '?').join(', ')})`,
    ids,
    (raw) => raw as Record<string, unknown>,
  )
  return posts.map((p) =>
    parseScheduledPost({
      id: p['id'],
      text: p['text'],
      link:
        typeof p['linkUrl'] === 'string'
          ? { url: p['linkUrl'], title: p['linkTitle'] ?? '' }
          : null,
      images: JSON.parse(String(p['images'] ?? '[]')) as unknown,
      at: p['at'],
      inBuffer: p['inBuffer'],
      status: p['status'],
      targets: targets.filter((t) => t['postId'] === p['id']),
    }),
  )
}

/** The signed-in user's networks, accounts and recent posts: everything /social shows. */
export async function getSocial(env: SocialEnv, request: Request): Promise<Social> {
  const user = await requireUser(env.DB, request)
  return {
    networks: socialProviders(env)
      .map((p) => p.id)
      .filter(isNetwork),
    accounts: await userAccounts(env, user.id),
    posts: await readPosts(env.DB, 'user_id = ?', [user.id]),
    bufferUsed: env.BUFFER_CLIENT_ID ? await bufferUsed(env) : null,
  }
}

/**
 * Schedules a post: each account must be the user's and connected, and each network's
 * publisher must accept the post, before anything is stored. A Workflow then waits until the
 * time and posts to each account (worker/social-post.ts).
 */
export async function schedulePost(
  env: SocialEnv,
  request: Request,
  input: PostInput,
): Promise<ScheduledPost> {
  const user = await requireUser(env.DB, request)
  const accounts = new Map((await userAccounts(env, user.id)).map((a) => [a.id, a]))
  const chosen = input.accountIds.map((id) => {
    const account = accounts.get(id)
    if (!account) throw new HttpError(400, 'Pick accounts you have connected')
    if (account.status === 'reconnect') {
      throw new HttpError(400, `Connect ${account.label} again first`)
    }
    return account
  })
  // Each image must be one this user uploaded; its stored type is the one that counts.
  const images: PostImage[] = []
  for (const image of input.images) {
    const stored = await env.SOCIAL_MEDIA.head(mediaKey(user.id, image.key))
    const type = stored?.httpMetadata?.contentType
    if (!stored || !type) throw new HttpError(400, 'An image is missing: attach it again')
    images.push({ ...image, type })
  }
  const post = asSocialPost({ ...input, images })
  for (const account of chosen) {
    const problems = publisherFor(account).check(post)
    if (problems.length > 0) {
      throw new HttpError(400, `${account.label}: ${problems.map((p) => p.message).join('; ')}`)
    }
  }
  const now = Date.now()
  const at = input.at ? Date.parse(input.at) : now
  if (at > now + MAX_DAYS_AHEAD * 86_400_000) {
    throw new HttpError(400, `Schedule at most ${MAX_DAYS_AHEAD} days ahead`)
  }
  const id = crypto.randomUUID()
  const status: PostStatus = 'scheduled'
  await migrate(env.DB, migrations)
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO social_posts (id, user_id, text, link_url, link_title, images, at, in_buffer,
         status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      user.id,
      input.text,
      input.link?.url ?? null,
      input.link?.title ?? null,
      JSON.stringify(images),
      new Date(Math.max(at, now)).toISOString(),
      input.inBuffer ? 1 : 0,
      status,
      new Date(now).toISOString(),
    ),
    ...chosen.map((account) =>
      env.DB.prepare(
        `INSERT INTO social_targets (post_id, account_id, network, service, label, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
      ).bind(id, account.id, account.network, account.service, account.label),
    ),
  ])
  await env.SOCIAL_POST.create({ id, params: { postId: id, userId: user.id } })
  const [stored] = await readPosts(env.DB, 'id = ?', [id])
  if (!stored) throw new Error('The post was not stored')
  return stored
}

/** Cancels a post that has not started going out. */
export async function cancelPost(
  env: SocialEnv,
  request: Request,
  id: string,
): Promise<ScheduledPost> {
  const user = await requireUser(env.DB, request)
  await migrate(env.DB, migrations)
  const cancelled = await queryRows(
    env.DB,
    `UPDATE social_posts SET status = 'cancelled'
     WHERE id = ? AND user_id = ? AND status = 'scheduled' RETURNING id`,
    [id, user.id],
    (raw) => raw,
  )
  if (cancelled.length === 0) throw new HttpError(409, 'Only a scheduled post can be cancelled')
  try {
    await (await env.SOCIAL_POST.get(id)).terminate()
  } catch (error) {
    // The Workflow checks the status before it posts, so a missed terminate posts nothing.
    console.warn('[social] could not stop the workflow:', error)
  }
  const [post] = await readPosts(env.DB, 'id = ?', [id])
  if (!post) throw new Error('The post disappeared')
  return post
}
