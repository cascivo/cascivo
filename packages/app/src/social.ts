import { dpopFetch } from './dpop'
import { bufferQuery } from './oauth'
import type { TokenSet } from './oauth'

/**
 * `@cascivo/app/social` — posting on someone's behalf with the tokens of an account they
 * connected (`handleConnections` in `@cascivo/app/oauth-server`, or any `TokenSet` you hold).
 * One `Publisher` per network: `check` says what a network would refuse, before anything is
 * queued; `publish` posts. Like `@cascivo/app/oauth` it has no database or Worker code.
 *
 * ```ts
 * const li = linkedinPublisher()
 * li.check({ text })                      // [] or [{ code: 'too_long', message }], as you type
 * const { url } = await li.publish({ tokens, subject }, { text, link: { url, title } })
 * ```
 */

export interface SocialImage {
  /** JPEG, PNG or GIF. */
  data: Blob
  /** Read aloud by screen readers. Required: an image without it is refused. */
  alt: string
}

export interface SocialPost {
  text: string
  /** A link card. Networks that build no preview themselves (LinkedIn) show these fields. */
  link?: { url: string; title: string; description?: string; thumbnail?: SocialImage }
  images?: readonly SocialImage[]
}

export interface PostProblem {
  code: 'empty' | 'too_long' | 'too_many_images' | 'link_and_images' | 'bad_link' | 'bad_image'
  message: string
}

/** Who posts: the connection's tokens and its subject at the provider. */
export interface PublishTarget {
  tokens: TokenSet
  subject: string
  /** The account's server, for a network that is many (Mastodon). */
  server?: string | null
}

export interface PublishOptions {
  /**
   * The same key for every attempt at the same post. A network that honours it (Mastodon)
   * publishes once however often it is retried; one that has none (LinkedIn) ignores it.
   */
  idempotencyKey?: string
  /**
   * When the post was meant to go out, the same on every attempt. With `idempotencyKey`, it
   * fixes Bluesky's record key, so a retry finds the post it already made.
   */
  createdAt?: Date
}

export interface PublishedPost {
  /** The network's id for the post (LinkedIn: `urn:li:share:…`). */
  id: string
  /** Where to see it; `null` when the network cannot say yet (Buffer sends it on later). */
  url: string | null
}

export type PublishErrorKind =
  /** The post breaks a rule of the network (`check` lists them), or the network said 400. */
  | 'invalid'
  /** The token was refused or lacks the scope: the account must be connected again. */
  | 'reconnect'
  /** Too many posts: try later (`retryable`). */
  | 'rate_limited'
  /** The network failed. */
  | 'failed'

export class PublishError extends Error {
  constructor(
    readonly network: string,
    readonly kind: PublishErrorKind,
    message: string,
    /** The HTTP status, when the network answered. */
    readonly status: number | null = null,
    /** Seconds the network asked to wait (`Retry-After`), on a rate limit. */
    readonly retryAfter: number | null = null,
  ) {
    super(message)
    this.name = 'PublishError'
  }

  /**
   * Whether trying again later can succeed. A network that cannot deduplicate (LinkedIn) may
   * already have published when a request timed out, so a timeout is never marked retryable.
   */
  get retryable(): boolean {
    return this.kind === 'rate_limited' || (this.kind === 'failed' && (this.status ?? 0) >= 500)
  }
}

export interface Publisher {
  readonly network: string
  readonly limits: { maxChars: number; maxImages: number }
  /** What the network would refuse; empty when the post can go. Synchronous: call it as people type. */
  check(post: SocialPost): PostProblem[]
  /** Checks, then posts. Throws `PublishError`. */
  publish(target: PublishTarget, post: SocialPost, options?: PublishOptions): Promise<PublishedPost>
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif'])

function checkImage(
  image: SocialImage,
  problems: PostProblem[],
  types: ReadonlySet<string> = IMAGE_TYPES,
): void {
  if (!types.has(image.data.type)) {
    problems.push({
      code: 'bad_image',
      message: `Images must be ${[...types].map((t) => t.slice(6).toUpperCase()).join(', ')}`,
    })
  } else if (!image.alt.trim()) {
    problems.push({ code: 'bad_image', message: 'Every image needs a description (alt text)' })
  }
}

/* --------------------------------- LinkedIn --------------------------------- */

/**
 * Escapes text for LinkedIn's "little" format, where `| { } @ [ ] ( ) < > # \ * _ ~` are
 * markup: unescaped, they are swallowed or the post is refused. A `#` that starts a word is
 * kept, so hashtags still link.
 */
export function escapeLittleText(text: string): string {
  return text.replace(/[|{}@[\]()<>#\\*_~]/g, (char, index: number) => {
    if (char === '#') {
      const before = index === 0 ? '' : text[index - 1]!
      const after = text[index + 1] ?? ''
      if (!/[\p{L}\p{N}]/u.test(before) && /[\p{L}\p{N}]/u.test(after)) return char
    }
    return `\\${char}`
  })
}

export interface LinkedInPublisherOptions {
  /**
   * The `LinkedIn-Version` (YYYYMM) every call carries. LinkedIn retires a version about a
   * year after it ships, so move this forward when you update the package.
   */
  version?: string
  fetch?: typeof fetch
}

const LINKEDIN_VERSION = '202609'

/**
 * Posts to a member's own LinkedIn feed (`w_member_social`, from the self-serve "Share on
 * LinkedIn" product): text, a link card, one image or several. The subject is the member's
 * OpenID `sub`, which is their person id. LinkedIn has no idempotency key: a post whose
 * request timed out may have gone out, so do not retry one blindly.
 */
export function linkedinPublisher(options: LinkedInPublisherOptions = {}): Publisher {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const version = options.version ?? LINKEDIN_VERSION
  const limits = { maxChars: 3000, maxImages: 20 }

  const call = async (
    path: string,
    tokens: TokenSet,
    body: unknown,
  ): Promise<{ response: Response; json: unknown }> => {
    const response = await doFetch(`https://api.linkedin.com/rest/${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${tokens.accessToken}`,
        'content-type': 'application/json',
        'linkedin-version': version,
        'x-restli-protocol-version': '2.0.0',
      },
      body: JSON.stringify(body),
    })
    const json: unknown = await response.json().catch(() => null)
    if (!response.ok) throw failure(response.status, json)
    return { response, json }
  }

  function failure(status: number, json: unknown): PublishError {
    const reason = asRecord(json)?.['message']
    const message = typeof reason === 'string' ? reason : `LinkedIn answered ${status}`
    const kind: PublishErrorKind =
      status === 401 || status === 403
        ? 'reconnect'
        : status === 429
          ? 'rate_limited'
          : status === 400 || status === 422
            ? 'invalid'
            : 'failed'
    return new PublishError('linkedin', kind, message, status)
  }

  async function upload(target: PublishTarget, image: SocialImage): Promise<string> {
    const { json } = await call('images?action=initializeUpload', target.tokens, {
      initializeUploadRequest: { owner: `urn:li:person:${target.subject}` },
    })
    const value = asRecord(asRecord(json)?.['value'])
    const uploadUrl = value?.['uploadUrl']
    const urn = value?.['image']
    if (typeof uploadUrl !== 'string' || typeof urn !== 'string') {
      throw new PublishError('linkedin', 'failed', 'LinkedIn returned no upload URL')
    }
    const put = await doFetch(uploadUrl, {
      method: 'PUT',
      headers: { authorization: `Bearer ${target.tokens.accessToken}` },
      body: image.data,
    })
    if (!put.ok) throw failure(put.status, null)
    return urn
  }

  const publisher: Publisher = {
    network: 'linkedin',
    limits,
    check(post) {
      const problems: PostProblem[] = []
      const length = [...post.text].length
      if (length === 0 && !post.link && !post.images?.length) {
        problems.push({ code: 'empty', message: 'Write something to post' })
      }
      if (length > limits.maxChars) {
        problems.push({
          code: 'too_long',
          message: `LinkedIn takes ${limits.maxChars} characters; this has ${length}`,
        })
      }
      const images = post.images ?? []
      if (images.length > limits.maxImages) {
        problems.push({
          code: 'too_many_images',
          message: `LinkedIn takes ${limits.maxImages} images in a post`,
        })
      }
      if (post.link && images.length > 0) {
        problems.push({
          code: 'link_and_images',
          message: 'A LinkedIn post has a link card or images, not both',
        })
      }
      if (post.link) {
        let protocol = ''
        try {
          protocol = new URL(post.link.url).protocol
        } catch {
          // reported below
        }
        if (protocol !== 'https:' && protocol !== 'http:') {
          problems.push({ code: 'bad_link', message: 'The link must be an http(s) URL' })
        }
        if (!post.link.title.trim()) {
          problems.push({
            code: 'bad_link',
            message: 'A link card needs a title: LinkedIn does not read the page',
          })
        }
        if (post.link.thumbnail) checkImage(post.link.thumbnail, problems)
      }
      for (const image of images) checkImage(image, problems)
      return problems
    },
    async publish(target, post) {
      const problems = publisher.check(post)
      if (problems.length > 0) {
        throw new PublishError('linkedin', 'invalid', problems.map((p) => p.message).join('; '))
      }
      const images = post.images ?? []
      let content: Record<string, unknown> | undefined
      if (post.link) {
        content = {
          article: {
            source: post.link.url,
            title: post.link.title,
            ...(post.link.description ? { description: post.link.description } : {}),
            ...(post.link.thumbnail
              ? { thumbnail: await upload(target, post.link.thumbnail) }
              : {}),
          },
        }
      } else if (images.length === 1) {
        content = { media: { id: await upload(target, images[0]!), altText: images[0]!.alt } }
      } else if (images.length > 1) {
        const uploaded = []
        for (const image of images) {
          uploaded.push({ id: await upload(target, image), altText: image.alt })
        }
        content = { multiImage: { images: uploaded } }
      }
      const { response } = await call('posts', target.tokens, {
        author: `urn:li:person:${target.subject}`,
        commentary: escapeLittleText(post.text),
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        ...(content ? { content } : {}),
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      })
      const id = response.headers.get('x-restli-id')
      if (!id) throw new PublishError('linkedin', 'failed', 'LinkedIn returned no post id')
      return { id, url: `https://www.linkedin.com/feed/update/${id}/` }
    },
  }
  return publisher
}

/* --------------------------------- Mastodon --------------------------------- */

export interface MastodonPublisherOptions {
  /**
   * The server's limit (`configuration.statuses.max_characters` in `/api/v2/instance`).
   * Default 500, Mastodon's own; many servers allow more.
   */
  maxChars?: number
  /** Default `public`. */
  visibility?: 'public' | 'unlisted' | 'private'
  fetch?: typeof fetch
}

/** Mastodon counts every URL as this many characters, however long it is. */
const URL_WEIGHT = 23
const MASTODON_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/**
 * The length Mastodon counts: a URL is 23 characters, a mention `@user@server` counts only
 * `@user`, everything else by character.
 */
export function mastodonLength(text: string): number {
  const counted = text
    .replace(/https?:\/\/\S+/g, 'x'.repeat(URL_WEIGHT))
    .replace(/(^|\s)(@[\w.-]+)@[\w.-]+\.[a-z]{2,}/gi, '$1$2')
  return [...counted].length
}

/** The text Mastodon posts: the link appended when the text does not already carry it. */
function mastodonText(post: SocialPost): string {
  if (!post.link || post.text.includes(post.link.url)) return post.text
  return post.text ? `${post.text}\n\n${post.link.url}` : post.link.url
}

/**
 * Posts a status to the account's server (`write:statuses`, and `write:media` for images). A
 * link becomes part of the text, and the server builds its card. Images are uploaded first,
 * and waited for while the server processes them. With `idempotencyKey`, retrying a post
 * whose request timed out cannot publish it twice.
 */
export function mastodonPublisher(options: MastodonPublisherOptions = {}): Publisher {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const limits = { maxChars: options.maxChars ?? 500, maxImages: 4 }

  function failure(status: number, json: unknown): PublishError {
    const reason = asRecord(json)?.['error']
    const message = typeof reason === 'string' ? reason : `Mastodon answered ${status}`
    const kind: PublishErrorKind =
      status === 401 || status === 403
        ? 'reconnect'
        : status === 429
          ? 'rate_limited'
          : status === 400 || status === 422
            ? 'invalid'
            : 'failed'
    return new PublishError('mastodon', kind, message, status)
  }

  async function call(url: string, tokens: TokenSet, init: RequestInit) {
    const response = await doFetch(url, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
      headers: {
        ...(init.headers as Record<string, string>),
        authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    const json: unknown = await response.json().catch(() => null)
    if (!response.ok) throw failure(response.status, json)
    return { status: response.status, json: asRecord(json) }
  }

  async function upload(server: string, tokens: TokenSet, image: SocialImage): Promise<string> {
    const form = new FormData()
    form.set('file', image.data)
    form.set('description', image.alt)
    const uploaded = await call(`https://${server}/api/v2/media`, tokens, {
      method: 'POST',
      body: form,
    })
    const id = uploaded.json?.['id']
    if (typeof id !== 'string')
      throw new PublishError('mastodon', 'failed', 'No media id came back')
    // 202: still processing. A status cannot attach it until its URL exists.
    let ready = uploaded.status === 200 && typeof uploaded.json?.['url'] === 'string'
    for (let attempt = 0; !ready && attempt < 30; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const polled = await call(
        `https://${server}/api/v1/media/${encodeURIComponent(id)}`,
        tokens,
        {},
      )
      ready = polled.status === 200 && typeof polled.json?.['url'] === 'string'
    }
    if (!ready)
      throw new PublishError('mastodon', 'failed', 'The server took too long with an image')
    return id
  }

  const publisher: Publisher = {
    network: 'mastodon',
    limits,
    check(post) {
      const problems: PostProblem[] = []
      const text = mastodonText(post)
      const images = post.images ?? []
      if (!text.trim() && images.length === 0) {
        problems.push({ code: 'empty', message: 'Write something to post' })
      }
      const length = mastodonLength(text)
      if (length > limits.maxChars) {
        problems.push({
          code: 'too_long',
          message: `This server takes ${limits.maxChars} characters; this has ${length}`,
        })
      }
      if (images.length > limits.maxImages) {
        problems.push({
          code: 'too_many_images',
          message: `Mastodon takes ${limits.maxImages} images in a post`,
        })
      }
      if (post.link && !/^https?:\/\//.test(post.link.url)) {
        problems.push({ code: 'bad_link', message: 'The link must be an http(s) URL' })
      }
      for (const image of images) checkImage(image, problems, MASTODON_IMAGE_TYPES)
      return problems
    },
    async publish(target, post, publishOptions = {}) {
      const problems = publisher.check(post)
      if (problems.length > 0) {
        throw new PublishError('mastodon', 'invalid', problems.map((p) => p.message).join('; '))
      }
      if (!target.server) {
        throw new PublishError('mastodon', 'invalid', 'A Mastodon account needs its server')
      }
      const mediaIds: string[] = []
      for (const image of post.images ?? [])
        mediaIds.push(await upload(target.server, target.tokens, image))
      const { json } = await call(`https://${target.server}/api/v1/statuses`, target.tokens, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(publishOptions.idempotencyKey
            ? { 'idempotency-key': publishOptions.idempotencyKey }
            : {}),
        },
        body: JSON.stringify({
          status: mastodonText(post),
          ...(mediaIds.length > 0 ? { media_ids: mediaIds } : {}),
          visibility: options.visibility ?? 'public',
        }),
      })
      const id = json?.['id']
      const url = json?.['url']
      if (typeof id !== 'string' || typeof url !== 'string') {
        throw new PublishError('mastodon', 'failed', 'Mastodon returned no status')
      }
      return { id, url }
    },
  }
  return publisher
}

/* --------------------------------- Bluesky ---------------------------------- */

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

/** Characters as Bluesky counts them: graphemes (an emoji with modifiers is one). */
export function blueskyLength(text: string): number {
  let count = 0
  for (const _ of graphemes.segment(text)) count += 1
  return count
}

const utf8 = (text: string) => new TextEncoder().encode(text).byteLength

export interface Facet {
  index: { byteStart: number; byteEnd: number }
  features: Record<string, string>[]
}

const LINK = /https?:\/\/[^\s<>"]*[^\s<>".,;:!?)\]'"]/g
const TAG = /(^|\s)(#[\p{L}\p{N}_]*\p{L}[\p{L}\p{N}_]*)/gu
const MENTION = /(^|\s)(@([a-z0-9-]+(?:\.[a-z0-9-]+)+))/gi

/**
 * Links, hashtags and mentions in `text` as Bluesky facets. Offsets are UTF-8 **bytes**, not
 * string indices: get them wrong and the link lands on the wrong characters. `resolve` turns a
 * mention's handle into its DID; one it cannot resolve stays plain text.
 */
export async function blueskyFacets(
  text: string,
  resolve: (handle: string) => Promise<string | null>,
): Promise<Facet[]> {
  const facets: Facet[] = []
  const span = (start: number, length: number) => {
    const byteStart = utf8(text.slice(0, start))
    return { byteStart, byteEnd: byteStart + utf8(text.slice(start, start + length)) }
  }
  for (const m of text.matchAll(LINK)) {
    facets.push({
      index: span(m.index, m[0].length),
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: m[0] }],
    })
  }
  for (const m of text.matchAll(TAG)) {
    const tag = m[2]!
    facets.push({
      index: span(m.index + m[1]!.length, tag.length),
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag: tag.slice(1) }],
    })
  }
  for (const m of text.matchAll(MENTION)) {
    const did = await resolve(m[3]!.toLowerCase())
    if (!did) continue
    facets.push({
      index: span(m.index + m[1]!.length, m[2]!.length),
      features: [{ $type: 'app.bsky.richtext.facet#mention', did }],
    })
  }
  return facets.sort((a, b) => a.index.byteStart - b.index.byteStart)
}

const S32 = '234567abcdefghijklmnopqrstuvwxyz'

/**
 * A record key (TID) fixed by a time and an idempotency key: the time in microseconds, and ten
 * bits of the key's hash as the clock id. The same post, retried, gets the same key.
 */
export async function blueskyRecordKey(createdAt: Date, idempotencyKey: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(idempotencyKey)),
  )
  const clock = BigInt(((digest[0]! << 8) | digest[1]!) & 0x3ff)
  let n = ((BigInt(createdAt.getTime()) * BigInt(1000)) << BigInt(10)) | clock
  let key = ''
  for (let i = 0; i < 13; i++) {
    key = S32[Number(n & BigInt(31))] + key
    n >>= BigInt(5)
  }
  return key
}

const BLUESKY_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const BLUESKY_IMAGE_BYTES = 1_000_000

export interface BlueskyPublisherOptions {
  /** Post languages, BCP 47 (`['en']`); none by default. */
  langs?: readonly string[]
  fetch?: typeof fetch
}

/**
 * Posts to a Bluesky account (`app.bsky.feed.post`) on its own PDS, with every request DPoP
 * bound to the session's key. Links, hashtags and mentions become facets; a link becomes an
 * external card with the title you give (Bluesky does not read the page); up to four images
 * with alt text. With `idempotencyKey` and `createdAt`, a retry cannot post twice: the record
 * key is fixed, and an existing record under it is returned instead.
 */
export function blueskyPublisher(options: BlueskyPublisherOptions = {}): Publisher {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const limits = { maxChars: 300, maxImages: 4 }

  function failure(status: number, json: unknown): PublishError {
    const r = asRecord(json)
    const code = typeof r?.['error'] === 'string' ? r['error'] : ''
    const message = typeof r?.['message'] === 'string' ? r['message'] : `Bluesky answered ${status}`
    const kind: PublishErrorKind =
      status === 401 || status === 403 || code === 'InvalidToken' || code === 'ExpiredToken'
        ? 'reconnect'
        : status === 429
          ? 'rate_limited'
          : status === 400 || status === 413
            ? 'invalid'
            : 'failed'
    return new PublishError('bluesky', kind, message, status)
  }

  async function xrpc(
    target: PublishTarget,
    method: string,
    init: { body?: string | Blob; contentType?: string } = {},
  ): Promise<Record<string, unknown> | null> {
    const key = target.tokens.dpop?.key
    if (!key)
      throw new PublishError('bluesky', 'reconnect', 'These tokens are not a Bluesky session')
    const response = await dpopFetch(doFetch, key, `https://${target.server}/xrpc/${method}`, {
      method: 'POST',
      accessToken: target.tokens.accessToken,
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
      headers: {
        'content-type': init.contentType ?? 'application/json',
        accept: 'application/json',
      },
      ...(init.body === undefined ? {} : { body: init.body }),
    })
    const json: unknown = await response.json().catch(() => null)
    if (!response.ok) throw failure(response.status, json)
    return asRecord(json)
  }

  async function uploadBlob(target: PublishTarget, image: SocialImage): Promise<unknown> {
    const result = await xrpc(target, 'com.atproto.repo.uploadBlob', {
      body: image.data,
      contentType: image.data.type,
    })
    if (!result?.['blob']) throw new PublishError('bluesky', 'failed', 'No blob came back')
    return result['blob']
  }

  /** A handle's DID, from the account's own PDS; `null` when it does not resolve. */
  async function resolveHandle(server: string, handle: string): Promise<string | null> {
    try {
      const response = await doFetch(
        `https://${server}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
        { redirect: 'manual', signal: AbortSignal.timeout(10_000) },
      )
      const did = asRecord(await response.json().catch(() => null))?.['did']
      return response.ok && typeof did === 'string' && did.startsWith('did:') ? did : null
    } catch {
      return null
    }
  }

  const publisher: Publisher = {
    network: 'bluesky',
    limits,
    check(post) {
      const problems: PostProblem[] = []
      const images = post.images ?? []
      if (!post.text.trim() && images.length === 0 && !post.link) {
        problems.push({ code: 'empty', message: 'Write something to post' })
      }
      const length = blueskyLength(post.text)
      if (length > limits.maxChars) {
        problems.push({
          code: 'too_long',
          message: `Bluesky takes ${limits.maxChars} characters; this has ${length}`,
        })
      }
      if (images.length > limits.maxImages) {
        problems.push({
          code: 'too_many_images',
          message: `Bluesky takes ${limits.maxImages} images in a post`,
        })
      }
      if (post.link && images.length > 0) {
        problems.push({
          code: 'link_and_images',
          message: 'A Bluesky post has a link card or images, not both',
        })
      }
      if (post.link) {
        if (!/^https?:\/\//.test(post.link.url)) {
          problems.push({ code: 'bad_link', message: 'The link must be an http(s) URL' })
        }
        if (!post.link.title.trim()) {
          problems.push({
            code: 'bad_link',
            message: 'A link card needs a title: Bluesky does not read the page',
          })
        }
      }
      for (const image of [...images, ...(post.link?.thumbnail ? [post.link.thumbnail] : [])]) {
        checkImage(image, problems, BLUESKY_IMAGE_TYPES)
        if (image.data.size > BLUESKY_IMAGE_BYTES) {
          problems.push({ code: 'bad_image', message: 'Bluesky takes images up to 1 MB' })
        }
      }
      return problems
    },
    async publish(target, post, publishOptions = {}) {
      const problems = publisher.check(post)
      if (problems.length > 0) {
        throw new PublishError('bluesky', 'invalid', problems.map((p) => p.message).join('; '))
      }
      if (!target.server)
        throw new PublishError('bluesky', 'invalid', 'A Bluesky account needs its PDS')
      const did = target.subject
      const { idempotencyKey, createdAt } = publishOptions
      const rkey =
        idempotencyKey && createdAt ? await blueskyRecordKey(createdAt, idempotencyKey) : null
      const urlOf = (key: string) => `https://bsky.app/profile/${did}/post/${key}`

      if (rkey) {
        // A retry: the post may already exist under the fixed key.
        const existing = await doFetch(
          `https://${target.server}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=app.bsky.feed.post&rkey=${rkey}`,
          { redirect: 'manual', signal: AbortSignal.timeout(10_000) },
        ).catch(() => null)
        const found = existing?.ok ? asRecord(await existing.json().catch(() => null)) : null
        if (typeof found?.['uri'] === 'string') return { id: found['uri'], url: urlOf(rkey) }
      }

      const images = post.images ?? []
      let embed: Record<string, unknown> | undefined
      if (images.length > 0) {
        const uploaded = []
        for (const image of images)
          uploaded.push({ image: await uploadBlob(target, image), alt: image.alt })
        embed = { $type: 'app.bsky.embed.images', images: uploaded }
      } else if (post.link) {
        embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: post.link.url,
            title: post.link.title,
            description: post.link.description ?? '',
            ...(post.link.thumbnail
              ? { thumb: await uploadBlob(target, post.link.thumbnail) }
              : {}),
          },
        }
      }
      const facets = await blueskyFacets(post.text, (handle) =>
        resolveHandle(target.server!, handle),
      )
      const result = await xrpc(target, 'com.atproto.repo.createRecord', {
        body: JSON.stringify({
          repo: did,
          collection: 'app.bsky.feed.post',
          ...(rkey ? { rkey } : {}),
          record: {
            $type: 'app.bsky.feed.post',
            text: post.text,
            createdAt: (createdAt ?? new Date()).toISOString(),
            ...(facets.length > 0 ? { facets } : {}),
            ...(embed ? { embed } : {}),
            ...(options.langs?.length ? { langs: [...options.langs] } : {}),
          },
        }),
      })
      const uri = result?.['uri']
      if (typeof uri !== 'string')
        throw new PublishError('bluesky', 'failed', 'Bluesky returned no record')
      return { id: uri, url: urlOf(uri.split('/').pop()!) }
    },
  }
  return publisher
}

/* ---------------------------------- Buffer ---------------------------------- */

/** A personal Buffer API key as a `TokenSet`, for an app that posts to its owner's Buffer. */
export function bufferTokens(apiKey: string): TokenSet {
  return { accessToken: apiKey, refreshToken: null, expiresAt: null, scopes: [] }
}

/** A social account connected in Buffer, which the app can post to. */
export interface BufferChannel {
  id: string
  name: string
  /** The network: `bluesky`, `instagram`, `linkedin`, `mastodon`, `threads`, `twitter`, … */
  service: string
  avatar: string | null
  isQueuePaused: boolean
}

function bufferFailure(result: Awaited<ReturnType<typeof bufferQuery>>): PublishError {
  const { status, code, error, retryAfter } = result
  const kind: PublishErrorKind =
    status === 429 || code === 'RATE_LIMIT_EXCEEDED'
      ? 'rate_limited'
      : status === 401 || status === 403 || code === 'UNAUTHENTICATED' || code === 'FORBIDDEN'
        ? 'reconnect'
        : status >= 500
          ? 'failed'
          : 'invalid'
  return new PublishError('buffer', kind, error ?? `Buffer answered ${status}`, status, retryAfter)
}

/** The channels of a Buffer organization (the connection's `subject`). */
export async function bufferChannels(
  tokens: TokenSet,
  organizationId: string,
  options: { fetch?: typeof fetch } = {},
): Promise<BufferChannel[]> {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const result = await bufferQuery(
    doFetch,
    tokens.accessToken,
    `query { channels(input: { organizationId: ${JSON.stringify(organizationId)} }) { id name service avatar isQueuePaused } }`,
  )
  const list = result.data?.['channels']
  if (result.error || !Array.isArray(list)) throw bufferFailure(result)
  return list.flatMap((raw) => {
    const c = asRecord(raw)
    if (typeof c?.['id'] !== 'string' || typeof c['service'] !== 'string') return []
    return [
      {
        id: c['id'],
        name: typeof c['name'] === 'string' ? c['name'] : c['id'],
        service: c['service'],
        avatar: typeof c['avatar'] === 'string' ? c['avatar'] : null,
        isQueuePaused: c['isQueuePaused'] === true,
      },
    ]
  })
}

/**
 * The text limit of the network behind a Buffer channel, where it is well known; Buffer
 * refuses the rest itself. Bluesky counts graphemes, the others characters.
 */
const BUFFER_LIMITS: Record<string, number> = {
  bluesky: 300,
  twitter: 280,
  x: 280,
  threads: 500,
  mastodon: 500,
  instagram: 2200,
  linkedin: 3000,
}

export interface BufferPublisherOptions {
  /** The channel's network (`BufferChannel.service`), so `check` knows its text limit. */
  service?: string
  /**
   * Buffer takes images by public URL only: put the image somewhere it can fetch (an R2 object
   * behind a short-lived signed URL) and return the URL. Without it, images are refused.
   */
  uploadImage?: (image: SocialImage) => Promise<string>
  fetch?: typeof fetch
}

/** The text Buffer gets: the link appended when the text does not carry it. */
function bufferText(post: SocialPost): string {
  if (!post.link || post.text.includes(post.link.url)) return post.text
  return post.text ? `${post.text}\n\n${post.link.url}` : post.link.url
}

/**
 * Posts through Buffer to one channel (the target's `subject` is the channel id): now, or at
 * `createdAt` when that is ahead (Buffer then holds it in its queue). Buffer has no
 * idempotency key, so a request that timed out may have posted: do not retry one blindly.
 * A rate limit carries Buffer's `Retry-After` on the error.
 */
export function bufferPublisher(options: BufferPublisherOptions = {}): Publisher {
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init))
  const service = options.service?.toLowerCase()
  const limit = service ? BUFFER_LIMITS[service] : undefined
  const limits = { maxChars: limit ?? 100_000, maxImages: 10 }

  const publisher: Publisher = {
    network: 'buffer',
    limits,
    check(post) {
      const problems: PostProblem[] = []
      const text = bufferText(post)
      const images = post.images ?? []
      if (!text.trim() && images.length === 0) {
        problems.push({ code: 'empty', message: 'Write something to post' })
      }
      const length = service === 'bluesky' ? blueskyLength(text) : [...text].length
      if (limit !== undefined && length > limit) {
        problems.push({
          code: 'too_long',
          message: `${options.service} through Buffer takes ${limit} characters; this has ${length}`,
        })
      }
      if (images.length > limits.maxImages) {
        problems.push({
          code: 'too_many_images',
          message: `Buffer takes ${limits.maxImages} images`,
        })
      }
      if (images.length > 0 && !options.uploadImage) {
        problems.push({
          code: 'bad_image',
          message: 'Buffer takes images by public URL: pass uploadImage to bufferPublisher',
        })
      }
      if (post.link && !/^https?:\/\//.test(post.link.url)) {
        problems.push({ code: 'bad_link', message: 'The link must be an http(s) URL' })
      }
      for (const image of images) checkImage(image, problems, MASTODON_IMAGE_TYPES)
      return problems
    },
    async publish(target, post, publishOptions = {}) {
      const problems = publisher.check(post)
      if (problems.length > 0) {
        throw new PublishError('buffer', 'invalid', problems.map((p) => p.message).join('; '))
      }
      const urls: string[] = []
      for (const image of post.images ?? []) urls.push(await options.uploadImage!(image))
      const later =
        publishOptions.createdAt && publishOptions.createdAt.getTime() > Date.now() + 60_000
          ? publishOptions.createdAt.toISOString()
          : null
      // Written inline, every value JSON-encoded (a valid GraphQL string), enums bare.
      const input = [
        `text: ${JSON.stringify(bufferText(post))}`,
        `channelId: ${JSON.stringify(target.subject)}`,
        'schedulingType: automatic',
        later ? `mode: customScheduled, dueAt: ${JSON.stringify(later)}` : 'mode: shareNow',
        ...(urls.length > 0
          ? [
              `assets: [${urls.map((url) => `{ image: { url: ${JSON.stringify(url)} } }`).join(', ')}]`,
            ]
          : []),
      ].join(', ')
      const result = await bufferQuery(
        doFetch,
        target.tokens.accessToken,
        `mutation { createPost(input: { ${input} }) { ... on PostActionSuccess { post { id } } ... on MutationError { message } } }`,
      )
      if (result.error) throw bufferFailure(result)
      const created = asRecord(result.data?.['createPost'])
      const id = asRecord(created?.['post'])?.['id']
      if (typeof id !== 'string') {
        const message = created?.['message']
        throw new PublishError(
          'buffer',
          'invalid',
          typeof message === 'string' ? message : 'Buffer did not create the post',
          result.status,
        )
      }
      return { id, url: null }
    },
  }
  return publisher
}
