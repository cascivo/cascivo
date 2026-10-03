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
}

export interface PublishedPost {
  /** The network's id for the post (LinkedIn: `urn:li:share:…`). */
  id: string
  url: string
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
