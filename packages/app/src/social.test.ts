// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { TokenSet } from './oauth'
import { escapeLittleText, linkedinPublisher, PublishError } from './social'
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

  it('refuses a post that fails its checks without calling LinkedIn', async () => {
    const { publisher, calls } = fakeLinkedIn()
    await expect(publisher.publish(target, { text: '' })).rejects.toMatchObject({ kind: 'invalid' })
    expect(calls).toEqual([])
  })
})

describe('boundary', () => {
  it('imports nothing of the app layer', async () => {
    const { readFileSync } = await import('node:fs')
    const source = readFileSync(new URL('./social.ts', import.meta.url), 'utf8')
    const imports = [...source.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])
    expect(imports).toEqual(['./oauth'])
  })
})
