// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { TokenSet } from './oauth'
import {
  escapeLittleText,
  LINKEDIN_VERSION,
  linkedinPublisher,
  mastodonPublisher,
  publishThread,
  PublishError,
} from './social'
import type { SocialPost } from './social'

const tokens: TokenSet = { accessToken: 'li-at', refreshToken: null, expiresAt: null, scopes: [] }
const target = { tokens, subject: 'abc123' }
const png = (alt = 'A chart') => ({ data: new Blob(['png'], { type: 'image/png' }), alt })

/** LinkedIn's REST API as far as posting goes, recording each request. */
function fakeLinkedIn(postStatus = 201, postBody: unknown = {}) {
  const calls: { url: string; init: RequestInit | undefined; body: unknown }[] = []
  let images = 0
  const doFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const body =
      typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : (init?.body ?? null)
    calls.push({ url, init, body })
    if (url.startsWith('https://api.linkedin.com/rest/images?action=initializeUpload')) {
      images += 1
      return Response.json({
        value: { uploadUrl: `https://upload.example/${images}`, image: `urn:li:image:I${images}` },
      })
    }
    if (url.startsWith('https://upload.example/')) return new Response(null, { status: 201 })
    if (url.startsWith('https://api.linkedin.com/rest/socialActions/')) {
      return Response.json(
        { commentUrn: `urn:li:comment:(urn:li:activity:7,${calls.length})` },
        { status: 201 },
      )
    }
    if (url === 'https://api.linkedin.com/rest/posts') {
      return Response.json(postBody, {
        status: postStatus,
        headers: postStatus === 201 ? { 'x-restli-id': 'urn:li:share:42' } : {},
      })
    }
    throw new Error(`Unexpected fetch: ${url}`)
  }) as typeof fetch
  return { calls, publisher: linkedinPublisher({ fetch: doFetch, version: '202609' }) }
}

describe('escapeLittleText', () => {
  it('escapes every reserved character, and keeps hashtags', () => {
    expect(escapeLittleText('a|b{c}d@e[f]g(h)i<j>k\\l*m_n~o')).toBe(
      'a\\|b\\{c\\}d\\@e\\[f\\]g\\(h\\)i\\<j\\>k\\\\l\\*m\\_n\\~o',
    )
    expect(escapeLittleText('Ship it #cascivo, #1 and #über')).toBe(
      'Ship it #cascivo, #1 and #über',
    )
    // Not a hashtag: inside a word, alone, or before a space.
    expect(escapeLittleText('C# and # and a#b')).toBe('C\\# and \\# and a\\#b')
  })
})

describe('linkedinPublisher', () => {
  it('checks length, images, and the link card before anything is sent', () => {
    const { publisher } = fakeLinkedIn()
    const codes = (post: SocialPost) => publisher.check(post).map((p) => p.code)
    expect(codes({ text: 'Hello' })).toEqual([])
    expect(codes({ text: '' })).toEqual(['empty'])
    // Characters, not UTF-16 units: 3000 emoji fit.
    expect(codes({ text: '😀'.repeat(3000) })).toEqual([])
    expect(codes({ text: 'x'.repeat(3001) })).toEqual(['too_long'])
    expect(codes({ text: 'x', images: Array.from({ length: 21 }, () => png()) })).toEqual([
      'too_many_images',
    ])
    expect(codes({ text: 'x', images: [png('')] })).toEqual(['bad_image'])
    expect(
      codes({ text: 'x', images: [{ data: new Blob(['x'], { type: 'image/webp' }), alt: 'a' }] }),
    ).toEqual(['bad_image'])
    expect(codes({ text: 'x', link: { url: 'javascript:alert(1)', title: 'T' } })).toEqual([
      'bad_link',
    ])
    expect(codes({ text: 'x', link: { url: 'https://a.example', title: ' ' } })).toEqual([
      'bad_link',
    ])
    expect(
      codes({ text: 'x', link: { url: 'https://a.example', title: 'T' }, images: [png()] }),
    ).toEqual(['link_and_images'])
  })

  it('posts escaped text as the member, with the versioned headers', async () => {
    const { publisher, calls } = fakeLinkedIn()
    const posted = await publisher.publish(target, { text: 'Launch (beta) #cascivo' })
    expect(posted).toEqual({
      id: 'urn:li:share:42',
      url: 'https://www.linkedin.com/feed/update/urn:li:share:42/',
    })
    const [call] = calls
    expect(call!.body).toMatchObject({
      author: 'urn:li:person:abc123',
      commentary: 'Launch \\(beta\\) #cascivo',
      visibility: 'PUBLIC',
      lifecycleState: 'PUBLISHED',
    })
    const headers = new Headers(call!.init?.headers)
    expect(headers.get('linkedin-version')).toBe('202609')
    expect(headers.get('x-restli-protocol-version')).toBe('2.0.0')
    expect(headers.get('authorization')).toBe('Bearer li-at')
  })

  it('uploads images first, owned by the member, then posts their URNs', async () => {
    const { publisher, calls } = fakeLinkedIn()
    await publisher.publish(target, { text: 'One', images: [png('First')] })
    expect(calls.map((c) => c.url)).toEqual([
      'https://api.linkedin.com/rest/images?action=initializeUpload',
      'https://upload.example/1',
      'https://api.linkedin.com/rest/posts',
    ])
    expect(calls[0]!.body).toEqual({ initializeUploadRequest: { owner: 'urn:li:person:abc123' } })
    expect(calls[1]!.init?.method).toBe('PUT')
    expect(calls[2]!.body).toMatchObject({
      content: { media: { id: 'urn:li:image:I1', altText: 'First' } },
    })

    const many = fakeLinkedIn()
    await many.publisher.publish(target, { text: 'Two', images: [png('A'), png('B')] })
    expect(many.calls.at(-1)!.body).toMatchObject({
      content: { multiImage: { images: [{ id: 'urn:li:image:I1' }, { id: 'urn:li:image:I2' }] } },
    })
  })

  it('sends a link card with the fields given, since LinkedIn reads no page', async () => {
    const { publisher, calls } = fakeLinkedIn()
    await publisher.publish(target, {
      text: 'Read this',
      link: { url: 'https://a.example/post', title: 'The post', thumbnail: png('Cover') },
    })
    expect(calls.at(-1)!.body).toMatchObject({
      content: {
        article: {
          source: 'https://a.example/post',
          title: 'The post',
          thumbnail: 'urn:li:image:I1',
        },
      },
    })
  })

  it.each([
    [401, 'reconnect', false],
    [403, 'reconnect', false],
    [429, 'rate_limited', true],
    [422, 'invalid', false],
    [503, 'failed', true],
  ] as const)('reports a %i as %s (retryable: %s)', async (status, kind, retryable) => {
    const { publisher } = fakeLinkedIn(status, { message: 'Nope', status })
    const error = await publisher.publish(target, { text: 'Hi' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PublishError)
    expect(error).toMatchObject({ kind, status, message: 'Nope', retryable })
  })

  it('replies as a comment on the share, so a thread is a post and its first comments', async () => {
    const { publisher, calls } = fakeLinkedIn()
    const parts = await publishThread(publisher, target, [
      { text: 'The post' },
      { text: 'More (in a comment)' },
      { text: 'And more' },
    ])
    const share = 'urn:li:share:42'
    const commentsUrl = `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(share)}/comments`
    expect(calls.map((c) => c.url)).toEqual([
      'https://api.linkedin.com/rest/posts',
      commentsUrl,
      commentsUrl,
    ])
    // Comments are not in the "little" format: the text goes as written.
    expect(calls[1]!.body).toEqual({
      actor: 'urn:li:person:abc123',
      object: share,
      message: { text: 'More (in a comment)' },
    })
    expect(parts[1]).toEqual({
      id: 'urn:li:comment:(urn:li:activity:7,2)',
      url: `https://www.linkedin.com/feed/update/${share}/?commentUrn=${encodeURIComponent('urn:li:comment:(urn:li:activity:7,2)')}`,
      replyRef: { post: share },
    })
    await expect(
      publisher.publish(target, { text: 'x', images: [png()] }, { replyTo: parts[0]! }),
    ).rejects.toThrow(/text only/)
    await expect(
      publisher.publish(target, { text: 'x'.repeat(1251) }, { replyTo: parts[0]! }),
    ).rejects.toThrow(/1250/)
  })

  it('measures as it checks, says in what unit, and exports its LinkedIn-Version', () => {
    const publisher = linkedinPublisher()
    expect(publisher.measure('😀 ok')).toBe(4)
    expect(publisher.limits.unit).toBe('characters')
    expect(LINKEDIN_VERSION).toMatch(/^\d{6}$/)
  })

  it('refuses a post that fails its checks without calling LinkedIn', async () => {
    const { publisher, calls } = fakeLinkedIn()
    await expect(publisher.publish(target, { text: '' })).rejects.toMatchObject({ kind: 'invalid' })
    expect(calls).toEqual([])
  })
})

describe('publishThread', () => {
  it('names the parts already out when one fails, so a retry can resume', async () => {
    const statuses: string[] = []
    const doFetch = (async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { status: string; in_reply_to_id?: string }
      statuses.push(`${body.status}<${body.in_reply_to_id ?? ''}`)
      if (body.status === 'three') return Response.json({ error: 'Down' }, { status: 503 })
      return Response.json({
        id: `s-${statuses.length}`,
        url: `https://m.example/${statuses.length}`,
      })
    }) as unknown as typeof fetch
    const publisher = mastodonPublisher({ fetch: doFetch })
    const error = await publishThread(
      publisher,
      { tokens, subject: 'a', server: 'm.example' },
      [{ text: 'one' }, { text: 'two' }, { text: 'three' }],
      { idempotencyKey: 'k' },
    ).catch((e: unknown) => e)
    expect(statuses).toEqual(['one<', 'two<s-1', 'three<s-2'])
    expect(error).toBeInstanceOf(PublishError)
    expect(error).toMatchObject({
      kind: 'failed',
      status: 503,
      published: [
        { id: 's-1', url: 'https://m.example/1' },
        { id: 's-2', url: 'https://m.example/2' },
      ],
    })
  })
})

describe('boundary', () => {
  it('imports nothing of the app layer', async () => {
    const { readFileSync } = await import('node:fs')
    const source = readFileSync(new URL('./social.ts', import.meta.url), 'utf8')
    const imports = [...source.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])
    // oauth (types, and Buffer's GraphQL call) and dpop (Bluesky's proofs): neither touches
    // the app layer.
    expect([...new Set(imports)]).toEqual(['./dpop', './oauth'])
  })
})
