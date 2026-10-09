import {
  blueskyPublisher,
  bufferPublisher,
  linkedinPublisher,
  mastodonPublisher,
  threadsPublisher,
} from '@cascivo/app/social'
import type { Publisher, SocialImage, SocialPost } from '@cascivo/app/social'
import { defineUploads } from '@cascivo/app/uploads'

/**
 * Posts scheduled to the accounts a user connected, shared by the Worker (worker/social.ts)
 * and the /social page. The publishers run on both sides: the page shows what a network would
 * refuse while you type, and the Worker refuses the same post before scheduling it.
 */

export const NETWORKS = {
  bluesky: 'Bluesky',
  buffer: 'Buffer',
  linkedin: 'LinkedIn',
  mastodon: 'Mastodon',
  threads: 'Threads',
} as const
export type Network = keyof typeof NETWORKS

export function isNetwork(value: string): value is Network {
  return Object.keys(NETWORKS).includes(value)
}

/**
 * Networks with no idempotency key: a request that timed out may have posted, so their posts
 * are never retried.
 */
export function postsOnce(network: Network): boolean {
  return network === 'buffer' || network === 'linkedin' || network === 'threads'
}

/**
 * Images attached to a post: uploaded through the Worker into R2 (worker/social.ts). 1 MB and
 * JPEG or PNG, which every network here takes (Bluesky's limit is 1 MB).
 */
export const IMAGES = defineUploads({
  path: '/api/social/images',
  maxBytes: 1_000_000,
  types: ['image/jpeg', 'image/png'],
})
export const MAX_IMAGES = 4

/**
 * Threads and Buffer fetch images by URL. The Worker passes one that signs a link to the image
 * (worker/social-post.ts); the page only checks posts, so this stands in there.
 */
export type ImageLink = (image: SocialImage) => Promise<string>
const checkOnly: ImageLink = async () => {
  throw new Error('Only the Worker links images')
}

const publishers: Record<Exclude<Network, 'buffer' | 'threads'>, Publisher> = {
  bluesky: blueskyPublisher(),
  linkedin: linkedinPublisher(),
  mastodon: mastodonPublisher(),
}

/** A Mastodon server's own limits (`mastodonServerLimits`), which many set above 500. */
export interface ServerLimits {
  maxChars: number
  maxImages: number
  urlWeight: number
}

/**
 * The publisher for an account. A Buffer channel posts through Buffer, checked against the
 * limit of the network behind it (`service`); a Mastodon account, against its server's.
 */
export function publisherFor(
  account: { network: Network; service: string | null; limits?: ServerLimits | null },
  imageLink: ImageLink = checkOnly,
): Publisher {
  if (account.network === 'buffer') {
    return bufferPublisher({
      uploadImage: imageLink,
      ...(account.service ? { service: account.service } : {}),
    })
  }
  if (account.network === 'threads') return threadsPublisher({ uploadImage: imageLink })
  if (account.network === 'mastodon' && account.limits) return mastodonPublisher(account.limits)
  return publishers[account.network]
}

export const MAX_TEXT = 5000
export const MAX_ACCOUNTS = 10
/** How far ahead a post can be scheduled. */
export const MAX_DAYS_AHEAD = 365
/** Buffer's request budget: this many per 15 minutes, for every user of the app together. */
export const BUFFER_BUDGET = 100

export interface Account {
  id: string
  network: Network
  /** `@ada.bsky.social`, `@ada@hachyderm.io`, or the name on a LinkedIn profile. */
  label: string
  /** `expiring`: the token ends soon and cannot be renewed (LinkedIn): connect it again. */
  status: 'active' | 'expiring' | 'reconnect'
  /** For a Buffer channel, the network behind it (`instagram`, `twitter`, …); else `null`. */
  service: string | null
  /** For a Mastodon account, its server's limits; else `null`. */
  limits: ServerLimits | null
}

/** `queued`: handed to Buffer, which holds it until the time (it shows in Buffer's queue). */
export type TargetStatus = 'pending' | 'publishing' | 'queued' | 'posted' | 'failed'

export interface Target {
  accountId: string
  network: Network
  service: string | null
  label: string
  status: TargetStatus
  url: string | null
  error: string | null
}

export type PostStatus = 'scheduled' | 'publishing' | 'done' | 'partial' | 'failed' | 'cancelled'

export interface Link {
  url: string
  /** LinkedIn and Bluesky show it on the card; Mastodon builds its own card from the page. */
  title: string
}

/** An image on a post: its key in the user's uploads, its type, and its description. */
export interface PostImage {
  key: string
  type: string
  alt: string
}

export interface ScheduledPost {
  id: string
  text: string
  link: Link | null
  images: PostImage[]
  /** ISO time it goes out. */
  at: string
  /** Buffer accounts are handed to Buffer at once, to hold until `at`. */
  inBuffer: boolean
  status: PostStatus
  targets: Target[]
}

export interface Social {
  /** The networks this app can connect (LinkedIn needs its client id and secret). */
  networks: Network[]
  accounts: Account[]
  posts: ScheduledPost[]
  /** Buffer requests this app made in the current 15 minutes, of 100; `null` without Buffer. */
  bufferUsed: number | null
}

export interface PostInput {
  text: string
  link: Link | null
  images: PostImage[]
  accountIds: string[]
  /** ISO time, or `null` for now. */
  at: string | null
  /** Hand Buffer accounts to Buffer now, to hold until `at`. */
  inBuffer: boolean
}

/** What `publishers` check: the post as a network sees it. */
/**
 * What `publishers` check and post: the post as a network sees it. Checking needs only each
 * image's type and description; posting passes the bytes (`data`, in the same order).
 */
export function asSocialPost(
  input: { text: string; link: Link | null; images: readonly PostImage[] },
  data: readonly Blob[] = [],
): SocialPost {
  const images = input.images.map((image, i) => ({
    data: data[i] ?? new Blob([], { type: image.type }),
    alt: image.alt,
  }))
  return {
    text: input.text,
    ...(input.link ? { link: input.link } : {}),
    ...(images.length > 0 ? { images } : {}),
  }
}

const record = (raw: unknown, what: string): Record<string, unknown> => {
  if (typeof raw !== 'object' || raw === null) throw new Error(`Malformed ${what}`)
  return raw as Record<string, unknown>
}

const text = (value: unknown, what: string): string => {
  if (typeof value !== 'string') throw new Error(`Malformed ${what}`)
  return value
}

function parseLink(raw: unknown): Link | null {
  if (raw === null || raw === undefined) return null
  const { url, title } = record(raw, 'link')
  return { url: text(url, 'link url'), title: text(title, 'link title') }
}

const IMAGE_KEY = /^[0-9a-f-]{36}\/[\w.-]{1,100}$/

function parseImages(raw: unknown): PostImage[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw) || raw.length > MAX_IMAGES) {
    throw new Error(`Attach at most ${MAX_IMAGES} images`)
  }
  return raw.map((item) => {
    const r = record(item, 'image')
    const key = text(r['key'], 'image key')
    const type = text(r['type'], 'image type')
    const alt = text(r['alt'], 'image description').trim()
    if (!IMAGE_KEY.test(key) || !IMAGES.types.includes(type)) throw new Error('Malformed image')
    if (!alt || alt.length > 1000) throw new Error('Describe each image (alt text), briefly')
    return { key, type, alt }
  })
}

export function parsePostInput(raw: unknown): PostInput {
  const r = record(raw, 'post')
  const body = text(r['text'], 'text')
  if (body.length > MAX_TEXT) throw new Error(`Keep the text under ${MAX_TEXT} characters`)
  const link = parseLink(r['link'])
  if (link && !/^https?:\/\//.test(link.url)) throw new Error('The link must be an http(s) URL')
  const ids = r['accountIds']
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_ACCOUNTS ||
    !ids.every((id) => typeof id === 'string')
  ) {
    throw new Error(`Pick 1 to ${MAX_ACCOUNTS} accounts`)
  }
  const at = r['at'] ?? null
  if (at !== null && (typeof at !== 'string' || Number.isNaN(Date.parse(at)))) {
    throw new Error('Send the time as an ISO date')
  }
  return {
    text: body,
    link,
    images: parseImages(r['images']),
    accountIds: [...new Set(ids)],
    at,
    inBuffer: r['inBuffer'] === true,
  }
}

function parseAccount(raw: unknown): Account {
  const r = record(raw, 'account')
  const network = text(r['network'], 'network')
  const status = text(r['status'], 'status')
  if (!isNetwork(network)) throw new Error('Malformed network')
  if (status !== 'active' && status !== 'expiring' && status !== 'reconnect') {
    throw new Error('Malformed account status')
  }
  return {
    id: text(r['id'], 'account id'),
    network,
    label: text(r['label'], 'label'),
    status,
    service: typeof r['service'] === 'string' ? r['service'] : null,
    limits: parseLimits(r['limits']),
  }
}

function parseLimits(raw: unknown): ServerLimits | null {
  if (raw === null || raw === undefined) return null
  const r = record(raw, 'limits')
  const count = (value: unknown) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error('Malformed limits')
    }
    return value
  }
  return {
    maxChars: count(r['maxChars']),
    maxImages: count(r['maxImages']),
    urlWeight: count(r['urlWeight']),
  }
}

const TARGET_STATUSES: readonly TargetStatus[] = [
  'pending',
  'publishing',
  'queued',
  'posted',
  'failed',
]
const POST_STATUSES: readonly PostStatus[] = [
  'scheduled',
  'publishing',
  'done',
  'partial',
  'failed',
  'cancelled',
]

function parseTarget(raw: unknown): Target {
  const r = record(raw, 'target')
  const network = text(r['network'], 'network')
  const status = TARGET_STATUSES.find((s) => s === r['status'])
  if (!isNetwork(network) || !status) throw new Error('Malformed target')
  return {
    accountId: text(r['accountId'], 'account id'),
    network,
    service: typeof r['service'] === 'string' ? r['service'] : null,
    label: text(r['label'], 'label'),
    status,
    url: typeof r['url'] === 'string' ? r['url'] : null,
    error: typeof r['error'] === 'string' ? r['error'] : null,
  }
}

export function parseScheduledPost(raw: unknown): ScheduledPost {
  const r = record(raw, 'post')
  const status = POST_STATUSES.find((s) => s === r['status'])
  if (!status || !Array.isArray(r['targets'])) throw new Error('Malformed post')
  return {
    id: text(r['id'], 'post id'),
    text: text(r['text'], 'text'),
    link: parseLink(r['link']),
    images: parseImages(r['images']),
    at: text(r['at'], 'time'),
    // D1 hands back 1 and 0.
    inBuffer: r['inBuffer'] === true || r['inBuffer'] === 1,
    status,
    targets: r['targets'].map(parseTarget),
  }
}

export function parseSocial(raw: unknown): Social {
  const r = record(raw, 'social')
  const networks = r['networks']
  if (!Array.isArray(networks) || !Array.isArray(r['accounts']) || !Array.isArray(r['posts'])) {
    throw new Error('Malformed social')
  }
  return {
    networks: networks.filter((n): n is Network => typeof n === 'string' && isNetwork(n)),
    accounts: r['accounts'].map(parseAccount),
    posts: r['posts'].map(parseScheduledPost),
    bufferUsed: typeof r['bufferUsed'] === 'number' ? r['bufferUsed'] : null,
  }
}
